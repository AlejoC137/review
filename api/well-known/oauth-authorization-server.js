/**
 * ============================================================================
 * OAuth 2.0 Authorization Server Metadata (RFC 8414)
 * Endpoint: /.well-known/oauth-authorization-server
 * ============================================================================
 * Permite a Google Gemini, Antigravity y clientes MCP descubrir automáticamente
 * los endpoints de autenticación y token sin servicios externos.
 * ============================================================================
 */

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS, HEAD");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Cache-Control", "public, max-age=3600");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const host = req.headers["x-forwarded-host"] || req.headers.host || "arca-review.vercel.app";
  const proto = req.headers["x-forwarded-proto"] || "https";
  const BASE_URL = `${proto}://${host}`;

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.statusCode = 200;
  res.end(JSON.stringify({
    issuer: BASE_URL,
    authorization_endpoint: `${BASE_URL}/api/oauth/authorize`,
    token_endpoint: `${BASE_URL}/api/oauth/token`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "client_credentials"],
    code_challenge_methods_supported: ["S256"],
    scopes_supported: ["mcp", "review:read", "review:write"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_post", "client_secret_basic"],
  }, null, 2));
}
