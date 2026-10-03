/**
 * ============================================================================
 * OAuth 2.0 Protected Resource Metadata (RFC 9728)
 * Endpoint: /.well-known/oauth-protected-resource
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
    resource: `${BASE_URL}/api/mcp`,
    authorization_servers: [BASE_URL],
    scopes_supported: ["mcp", "review:read", "review:write"],
    bearer_methods_supported: ["header", "query"]
  }, null, 2));
}
