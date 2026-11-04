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
import { SessionStore, SessionLimitError } from './session-store.js';
import { FileKeyStore, DEFAULT_KEYS_FILE } from './api-keys.js';
import { createAuthMiddleware, resolveAuthMode } from './auth-middleware.js';

// Load environment variables
dotenv.config();

// SSE configuration
const SSE_KEEPALIVE_INTERVAL = parseInt(process.env.SSE_KEEPALIVE_INTERVAL || '15000', 10); // Default: 15 seconds

// Session limits. New settings use the AVANADE_MCP_ prefix so existing
// SERVICENOW_* configuration keeps working untouched.
const SESSION_TTL_MS = parseInt(process.env.AVANADE_MCP_SESSION_TTL_MS || '3600000', 10); // Default: 1 hour idle
const MAX_SESSIONS = parseInt(process.env.AVANADE_MCP_MAX_SESSIONS || '100', 10);

const app = express();

// API key authentication. Defaults to "enforce": an unset AVANADE_MCP_AUTH_MODE
// must fail closed, because the alternative is a deployment that silently serves
// every tool - including server-side script execution - to anyone who can reach
// the port. Running without a key is still possible, but only by asking for it.
const AUTH_MODE = resolveAuthMode();
const keyStore = new FileKeyStore({ filePath: process.env.AVANADE_MCP_API_KEYS_FILE || DEFAULT_KEYS_FILE });
const requireKey = createAuthMiddleware({ store: keyStore, mode: AUTH_MODE });
console.log(`🔐 Auth mode: ${AUTH_MODE}${AUTH_MODE === 'off' ? '' : ` (${keyStore.size} keys in ${keyStore.filePath})`}`);
if (AUTH_MODE === 'enforce' && keyStore.size === 0) {
  console.warn('⚠️  Auth mode is enforce but no API keys exist - every request will be rejected.');
  console.warn('   Create one:  npm run keys -- create --label <name>');
  console.warn('   Local dev without a key:  set AVANADE_MCP_AUTH_MODE=off');
}

// /health stays open for Azure and Docker probes, but is the one route that
// must work without a key.
app.use('/mcp', requireKey);
app.use('/instances', requireKey);

/**
 * Build a ServiceNow client dedicated to a single session.
 *
 * Every session gets its own client. This is not a micro-optimisation: the
 * SN-Set-Instance tool retargets a client via client.setInstance(), so a client
 * shared between sessions means one caller switching to prod silently retargets
 * every other caller's reads and writes.
 */
const createSessionClient = () => {
  const instance = configManager.getInstanceOrDefault();
  const client = new ServiceNowClient(instance.url, instance.username, instance.password);
  client.currentInstanceName = instance.name;
  return client;
};

// Legacy SSE sessions (sessionId -> { server, transport, keepaliveInterval })
const sessions = new SessionStore({
  maxSessions: MAX_SESSIONS,
  ttlMs: SESSION_TTL_MS,
  onEvict: (id, session) => {
    if (session.keepaliveInterval) clearInterval(session.keepaliveInterval);
    try {
      session.transport?.close?.();
    } catch { /* already closed */ }
    console.log(`🧹 Cleaned up SSE session ${id}`);
  }
});

// Streamable HTTP sessions (mcp-session-id -> { server, transport })
const streamableSessions = new SessionStore({
  maxSessions: MAX_SESSIONS,
  ttlMs: SESSION_TTL_MS,
  onEvict: (id, session) => {
    try {
      session.transport?.close?.();
    } catch { /* already closed */ }
    console.log(`🧹 Cleaned up streamable session ${id}`);
  }
});

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

const sessionLimitResponse = (res, error) => {
  console.error(`⛔ ${error.message}`);
  res.status(503).json({
    error: 'Server at capacity',
    detail: `Maximum ${error.max} concurrent MCP sessions. Retry shortly.`
  });
};

// Default instance, used for startup logging and the health endpoint.
// Request handling never uses a shared client - see createSessionClient().
const defaultInstance = configManager.getDefaultInstance();
console.log(`🔗 Default ServiceNow instance: ${defaultInstance.name} (${defaultInstance.url})`);
console.log(`💡 Use SN-Set-Instance tool to switch instances during session`);

/**
 * GET /mcp - Handle streamable GET (with Mcp-Session-Id) or legacy SSE connection
 */
app.get('/mcp', async (req, res) => {
  try {
    const streamableSessionId = req.headers['mcp-session-id'];

    // Streamable HTTP GET flow (standalone SSE stream for existing streamable session)
    const streamableSession = streamableSessionId ? streamableSessions.get(streamableSessionId) : undefined;
    if (streamableSession) {
      await streamableSession.transport.handleRequest(req, res);
      return;
    }

    // Refuse before building anything that writes to the response. Once a
    // transport has handled a request the headers are committed and a later
    // capacity failure can no longer be reported as a 503.
    if (!sessions.canAccept()) {
      return sessionLimitResponse(res, new SessionLimitError(MAX_SESSIONS));
    }

    // SSE-specific headers to prevent buffering and timeouts
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.setHeader('Connection', 'keep-alive');

    // Disable timeout for SSE endpoint (0 = infinite).
    // An unbounded connection lifetime is only safe because SessionStore caps
    // the number of concurrent sessions and expires idle ones.
    req.setTimeout(0);
    res.setTimeout(0);

    // Create transport and start SSE connection
    const transport = new SSEServerTransport('/mcp', res);

    // Create a new MCP server instance with its own ServiceNow client
    const server = await createMcpServer(createSessionClient());

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
      sessions.delete(transport.sessionId);
    };

    // Clean up on request close/error
    req.on('close', () => {
      clearInterval(keepaliveInterval);
      if (sessions.delete(transport.sessionId)) {
        console.log(`🔌 Client disconnected: ${transport.sessionId}`);
      }
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      clearInterval(keepaliveInterval);
    });

    // Store the session
    try {
      sessions.add(transport.sessionId, { server, transport, keepaliveInterval });
    } catch (error) {
      clearInterval(keepaliveInterval);
      if (error instanceof SessionLimitError) return sessionLimitResponse(res, error);
      throw error;
    }
    console.log(`🔗 New session established: ${transport.sessionId} (${sessions.size} active)`);

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
    const legacySession = legacySessionId ? sessions.get(legacySessionId) : undefined;
    if (legacySession) {
      await legacySession.transport.handlePostMessage(req, res);
      return;
    }

    const parsedBody = await readJsonBody(req);
    const isInitialize = parsedBody?.method === 'initialize';
    const existingStreamable = streamableSessionId ? streamableSessions.get(streamableSessionId) : undefined;

    // Re-initialize against an existing session: acknowledge without tearing it
    // down. serverInfo here must stay identical to the MCP server identity in
    // mcp-server-consolidated.js - see docs/MIGRATION_CONTRACT.md.
    if (isInitialize && existingStreamable) {
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

    if (existingStreamable && !isInitialize) {
      await existingStreamable.transport.handleRequest(req, res, parsedBody);
      return;
    }

    // A non-initialize request with no valid session is rejected outright.
    //
    // This previously fell back to "if exactly one session is active, use that
    // one", which routed an unidentified request straight into another client's
    // session. There is no safe way to guess which session a request belongs to.
    if (!isInitialize) {
      return res.status(400).json({
        error: 'Invalid or missing session ID'
      });
    }

    // Refuse before the transport commits response headers, otherwise a
    // capacity failure cannot be reported and the client is handed a session id
    // that was never registered.
    if (!streamableSessions.canAccept()) {
      return sessionLimitResponse(res, new SessionLimitError(MAX_SESSIONS));
    }

    // First streamable initialization call.
    //
    // The session id is always generated server-side. Honouring a client-supplied
    // mcp-session-id here let a caller fix the session id in advance.
    const streamableTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID()
    });
    const streamableServer = await createMcpServer(createSessionClient());

    streamableTransport.onclose = () => {
      if (streamableTransport.sessionId) {
        streamableSessions.delete(streamableTransport.sessionId);
      }
    };

    await streamableServer.connect(streamableTransport);
    await streamableTransport.handleRequest(req, res, parsedBody);

    if (streamableTransport.sessionId) {
      try {
        streamableSessions.add(streamableTransport.sessionId, {
          server: streamableServer,
          transport: streamableTransport
        });
      } catch (error) {
        if (error instanceof SessionLimitError) {
          try { streamableTransport.close(); } catch { /* ignore */ }
          if (!res.headersSent) return sessionLimitResponse(res, error);
          return;
        }
        throw error;
      }
      console.log(`🔗 New streamable session established: ${streamableTransport.sessionId} (${streamableSessions.size} active)`);
    }

  } catch (error) {
    console.error('❌ Error handling POST message:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process message' });
    }
  }
});

/**
 * DELETE /mcp (streamable) - Explicitly close streamable session
 */
app.delete('/mcp', async (req, res) => {
  try {
    const streamableSessionId = req.headers['mcp-session-id'];
    const session = streamableSessionId ? streamableSessions.get(streamableSessionId) : undefined;

    if (!session) {
      return res.status(404).json({ error: 'Invalid or missing session ID' });
    }

    await session.transport.handleRequest(req, res);
    streamableSessions.delete(streamableSessionId);
    console.log(`🔌 Streamable session closed: ${streamableSessionId}`);
  } catch (error) {
    console.error('❌ Error handling streamable DELETE message:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process streamable DELETE request' });
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  // Once auth is enforced this route is unauthenticated, so it stops
  // disclosing the instance URL.
  if (AUTH_MODE === 'enforce') {
    return res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  }
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
  console.log(`🚀 Avanade ServiceNow MCP Server listening on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 MCP SSE endpoint: http://localhost:${PORT}/mcp`);
  console.log(`📋 Available instances: http://localhost:${PORT}/instances`);
  console.log(`💓 SSE keepalive interval: ${SSE_KEEPALIVE_INTERVAL}ms`);
  console.log(`🧮 Session limits: max ${MAX_SESSIONS}, idle TTL ${SESSION_TTL_MS}ms`);

  if (process.env.DEBUG === 'true') {
    console.log('🐛 Debug mode enabled');
    console.log(`🔗 Active ServiceNow instance: ${defaultInstance.name} - ${defaultInstance.url}`);
  }
});
