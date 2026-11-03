/**
 * Avanade ServiceNow MCP Server - API Key Authentication Middleware
 *
 * Copyright (c) 2026 Avanade Inc. All rights reserved.
 * Proprietary and confidential. See LICENSE for terms.
 *
 * Modes (AVANADE_MCP_AUTH_MODE):
 *   off      no checks - current behaviour, the default
 *   warn     validate and log failures, but let the request through
 *   enforce  reject requests without a valid key with 401
 *
 * Keys are accepted from `X-API-Key` or `Authorization`. Copilot Studio's
 * "API key" option sends the value under whatever header name the maker
 * configures, with no scheme prefix, so a bare key in `Authorization` is
 * accepted as well as `Bearer <key>`. Keys in the query string are never
 * read: URLs end up in proxy and App Service logs.
 */

export const AUTH_MODES = ['off', 'warn', 'enforce'];

export const resolveAuthMode = (value = process.env.AVANADE_MCP_AUTH_MODE) => {
  const mode = (value || 'off').trim().toLowerCase();
  if (!AUTH_MODES.includes(mode)) {
    throw new Error(
      `Invalid AVANADE_MCP_AUTH_MODE "${value}". Expected one of: ${AUTH_MODES.join(', ')}`
    );
  }
  return mode;
};

/** Pull a presented key out of the request headers, or null. */
export const extractKey = (headers) => {
  const direct = headers['x-api-key'];
  if (typeof direct === 'string' && direct.trim()) return direct.trim();

  const authorization = headers.authorization;
  if (typeof authorization === 'string' && authorization.trim()) {
    return authorization.replace(/^Bearer\s+/i, '').trim();
  }
  return null;
};

/**
 * @param {object}   options
 * @param {object}   options.store  A key store with validate(presented).
 * @param {string}   options.mode   One of AUTH_MODES.
 * @param {Function} [options.log]  Log sink, injectable for tests.
 */
export const createAuthMiddleware = ({ store, mode, log = console.warn }) => (req, res, next) => {
  if (mode === 'off') return next();

  const presented = extractKey(req.headers);
  const result = presented ? store.validate(presented) : { ok: false, reason: 'missing' };

  if (result.ok) {
    req.apiKey = { id: result.id, label: result.label };
    return next();
  }

  // Mounted with app.use(), so req.path has the mount point stripped.
  const where = `${req.method} ${req.baseUrl ?? ''}${req.path}`;
  // The key id is safe to log; the secret is never logged.
  const who = result.id ? ` (key ${result.id})` : '';

  if (mode === 'warn') {
    log(`⚠️  Unauthenticated ${where}: ${result.reason}${who} - allowed, mode is warn`);
    return next();
  }

  log(`⛔ Rejected ${where}: ${result.reason}${who}`);
  res.setHeader('WWW-Authenticate', 'Bearer realm="servicenow-mcp"');
  // One generic body for every failure so callers cannot tell a revoked key
  // from an unknown one.
  return res.status(401).json({ error: 'Unauthorized' });
};
