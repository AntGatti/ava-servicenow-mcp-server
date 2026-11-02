/**
 * Avanade ServiceNow MCP Server - Express HTTP Server
 *
 * Copyright (c) 2026 Avanade Inc. All rights reserved.
 * Proprietary and confidential. See LICENSE for terms.
 */

import express from 'express';
import dotenv from 'dotenv';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'node:crypto';
import { ServiceNowClient } from './servicenow-client.js';
import { createMcpServer } from './mcp-server-consolidated.js';
import { configManager } from './config-manager.js';

// Load environment variables
dotenv.config();

// SSE configuration
const SSE_KEEPALIVE_INTERVAL = parseInt(process.env.SSE_KEEPALIVE_INTERVAL || '15000', 10); // Default: 15 seconds

const app = express();

// In-memory session store (sessionId -> {server, transport})
const sessions = {};

// In-memory streamable session store (mcp-session-id -> {server, transport})
const streamableSessions = {};

const readJsonBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return null;
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

// Get default instance configuration
const defaultInstance = configManager.getDefaultInstance();
console.log(`🔗 Default ServiceNow instance: ${defaultInstance.name} (${defaultInstance.url})`);
console.log(`💡 Use SN-Set-Instance tool to switch instances during session`);

// Create ServiceNow client with default instance
const serviceNowClient = new ServiceNowClient(
  defaultInstance.url,
  defaultInstance.username,
  defaultInstance.password
);
serviceNowClient.currentInstanceName = defaultInstance.name;

/**
 * GET /mcp - Handle streamable GET (with Mcp-Session-Id) or legacy SSE connection
 */
app.get('/mcp', async (req, res) => {
  try {
    const streamableSessionId = req.headers['mcp-session-id'];

    // Streamable HTTP GET flow (standalone SSE stream for existing streamable session)
    if (streamableSessionId && streamableSessions[streamableSessionId]) {
      const { transport } = streamableSessions[streamableSessionId];
      await transport.handleRequest(req, res);
      return;
    }

    // SSE-specific headers to prevent buffering and timeouts
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.setHeader('Connection', 'keep-alive');

    // Disable timeout for SSE endpoint (0 = infinite)
    req.setTimeout(0);
    res.setTimeout(0);

    // Create transport and start SSE connection
    const transport = new SSEServerTransport('/mcp', res);

    // Create and configure new MCP server instance
    const server = await createMcpServer(serviceNowClient);

    // Set up keepalive heartbeat to prevent connection timeout
    // Send a comment every N seconds to keep connection alive
    const keepaliveInterval = setInterval(() => {
      try {
        // Send SSE comment (starts with :) to keep connection alive
        res.write(': keepalive\n\n');
      } catch (error) {
        console.error('❌ Keepalive failed, clearing interval:', error.message);
        clearInterval(keepaliveInterval);
      }
    }, SSE_KEEPALIVE_INTERVAL);

    // Set up transport cleanup
    transport.onclose = () => {
      if (sessions[transport.sessionId]) {
        clearInterval(keepaliveInterval);
        delete sessions[transport.sessionId];
        console.log(`🧹 Cleaned up session ${transport.sessionId}`);
      }
    };

    // Clean up on request close/error
    req.on('close', () => {
      clearInterval(keepaliveInterval);
      if (sessions[transport.sessionId]) {
        delete sessions[transport.sessionId];
        console.log(`🔌 Client disconnected: ${transport.sessionId}`);
      }
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      clearInterval(keepaliveInterval);
    });

    // Store the session
    sessions[transport.sessionId] = { server, transport, keepaliveInterval };
    console.log(`🔗 New session established: ${transport.sessionId}`);

    // Connect server to transport (connect() starts SSE transport)
    await server.connect(transport);

  } catch (error) {
    console.error('❌ Error establishing SSE connection:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to establish SSE connection' });
    }
  }
});

/**
 * POST /mcp - Handle JSON-RPC messages
 */
app.post('/mcp', async (req, res) => {
  try {
    const legacySessionId = req.query.sessionId;
    const streamableSessionId = req.headers['mcp-session-id'];

    // Legacy SSE flow (query-string session id)
    if (legacySessionId && sessions[legacySessionId]) {
      const { transport } = sessions[legacySessionId];
      await transport.handlePostMessage(req, res);
      return;
    }

    const parsedBody = await readJsonBody(req);
    const isInitialize = parsedBody?.method === 'initialize';
    const activeStreamableSessionIds = Object.keys(streamableSessions);

    if (isInitialize && streamableSessionId && streamableSessions[streamableSessionId]) {
      res.setHeader('mcp-session-id', streamableSessionId);
      return res.status(200).json({
        jsonrpc: '2.0',
        id: parsedBody?.id ?? null,
        result: {
          protocolVersion: parsedBody?.params?.protocolVersion || '2025-03-26',
          capabilities: {
            tools: {},
            resources: {},
            prompts: {}
          },
          serverInfo: {
            name: 'servicenow-server',
            version: '2.0.0'
          }
        }
      });
    }

    if (streamableSessionId && streamableSessions[streamableSessionId] && !isInitialize) {
      const { transport } = streamableSessions[streamableSessionId];
      await transport.handleRequest(req, res, parsedBody);
      return;
    }

    if (!streamableSessionId && !isInitialize && activeStreamableSessionIds.length === 1) {
      const fallbackSessionId = activeStreamableSessionIds[0];
      const { transport } = streamableSessions[fallbackSessionId];
      await transport.handleRequest(req, res, parsedBody);
      return;
    }

    if (!isInitialize) {
      return res.status(400).json({
        error: 'Invalid or missing session ID'
      });
    }

    // First streamable initialization call (no session header yet)
    const streamableTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => streamableSessionId || randomUUID()
    });
    const streamableServer = await createMcpServer(serviceNowClient);

    streamableTransport.onclose = () => {
      if (streamableTransport.sessionId && streamableSessions[streamableTransport.sessionId]) {
        delete streamableSessions[streamableTransport.sessionId];
        console.log(`🧹 Cleaned up streamable session ${streamableTransport.sessionId}`);
      }
    };

    await streamableServer.connect(streamableTransport);
    await streamableTransport.handleRequest(req, res, parsedBody);

    if (streamableTransport.sessionId) {
      streamableSessions[streamableTransport.sessionId] = {
        server: streamableServer,
        transport: streamableTransport
      };
      console.log(`🔗 New streamable session established: ${streamableTransport.sessionId}`);
    }

  } catch (error) {
    console.error('❌ Error handling POST message:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

/**
 * DELETE /mcp (streamable) - Explicitly close streamable session
 */
app.delete('/mcp', async (req, res) => {
  try {
    const streamableSessionId = req.headers['mcp-session-id'];

    if (!streamableSessionId || !streamableSessions[streamableSessionId]) {
      return res.status(404).json({ error: 'Invalid or missing session ID' });
    }

    const { transport } = streamableSessions[streamableSessionId];
    await transport.handleRequest(req, res);
    delete streamableSessions[streamableSessionId];
    console.log(`🔌 Streamable session closed: ${streamableSessionId}`);
  } catch (error) {
    console.error('❌ Error handling streamable DELETE message:', error);
    res.status(500).json({ error: 'Failed to process streamable DELETE request' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    servicenow_instance: defaultInstance.url,
    instance_name: defaultInstance.name,
    timestamp: new Date().toISOString()
  });
});

// List available instances endpoint
app.get('/instances', (req, res) => {
  try {
    const instances = configManager.listInstances();
    res.json({ instances });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 ServiceNow MCP Server listening on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 MCP SSE endpoint: http://localhost:${PORT}/mcp`);
  console.log(`📋 Available instances: http://localhost:${PORT}/instances`);
  console.log(`💓 SSE keepalive interval: ${SSE_KEEPALIVE_INTERVAL}ms`);

  if (process.env.DEBUG === 'true') {
    console.log('🐛 Debug mode enabled');
    console.log(`🔗 Active ServiceNow instance: ${defaultInstance.name} - ${defaultInstance.url}`);
  }
});