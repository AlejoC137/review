/**
 * ============================================================================
 * OAuth 2.0 Token Endpoint para Review MCP
 * Endpoint: /api/oauth/token
 * ============================================================================
 * Canjea el código de autorización o credenciales directas por un token Bearer
 * de larga duración que encapsula la identidad del usuario y su proyecto BIM activo.
 * ============================================================================
 */

import crypto from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://irkrljhfbtnjspyvrapa.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlya3JsamhmYnRuanNweXZyYXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMTI3OTEsImV4cCI6MjA4OTg4ODc5MX0.c_Rd0hc11NRXX3aWYOODhU-e5GjGcoxobJQbBOc6LOE";
const MCP_SECRET = process.env.MCP_SECRET || "review-mcp-secret-key-2026";

async function supabaseFetch(endpoint) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json"
      }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Supabase fetch error:", err);
    return [];
  }
}

function verifyCode(code) {
  const parts = String(code).split(".");
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expectedSig = crypto
    .createHmac("sha256", MCP_SECRET)
    .update(encoded)
    .digest("hex")
    .slice(0, 32);

  if (sig !== expectedSig) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
    if (payload.exp && payload.exp < Date.now()) return null; // expirado
    return payload;
  } catch {
    return null;
  }
}

function generateAccessToken(payloadData) {
  const payload = JSON.stringify({
    ...payloadData,
    iat: Date.now(),
    exp: Date.now() + 365 * 24 * 60 * 60 * 1000 // 1 año de validez
  });
  const encoded = Buffer.from(payload).toString("base64url");
  const sig = crypto
    .createHmac("sha256", MCP_SECRET)
    .update(encoded)
    .digest("hex")
    .slice(0, 32);
  return `rev_pat_${encoded}.${sig}`;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "method_not_allowed" }));
    return;
  }

  // Parsear body
  let body = req.body;
  if (typeof body === "string") {
    try {
      if (body.includes("=")) {
        const parsed = new URLSearchParams(body);
        body = {};
        for (const [k, v] of parsed.entries()) body[k] = v;
      } else {
        body = JSON.parse(body);
      }
    } catch {
      body = {};
    }
  }

  const grant_type = body.grant_type || "authorization_code";
  const code = body.code || "";
  const client_id = body.client_id || "";
  const client_secret = body.client_secret || "";

  res.setHeader("Content-Type", "application/json; charset=utf-8");

  // CASO 1: authorization_code (Flujo estándar Gemini y web)
  if (grant_type === "authorization_code") {
    if (!code) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "invalid_request", error_description: "Missing authorization code" }));
      return;
    }

    const payload = verifyCode(code);
    if (!payload) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "invalid_grant", error_description: "Código de autorización inválido o expirado" }));
      return;
    }

    const tokenData = {
      userId: payload.userId,
      email: payload.email,
      userName: payload.userName,
      admin: payload.admin,
      projectId: payload.projectId,
      projectName: payload.projectName
    };

    const accessToken = generateAccessToken(tokenData);

    res.statusCode = 200;
    res.end(JSON.stringify({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 31536000,
      scope: "mcp",
      user: {
        id: payload.userId,
        email: payload.email,
        name: payload.userName
      },
      project: {
        id: payload.projectId,
        name: payload.projectName
      }
    }));
    return;
  }

  // CASO 2: client_credentials (Permite conectar directamente pasando correo en client_id y contraseña en client_secret)
  if (grant_type === "client_credentials") {
    if (!client_id || !client_secret) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "invalid_request", error_description: "client_id and client_secret required" }));
      return;
    }

    const users = await supabaseFetch(`user_profiles?mail=eq.${encodeURIComponent(client_id.trim().toLowerCase())}&status=eq.true&select=*`);
    const user = users && users[0];

    if (!user || String(user.password).trim() !== String(client_secret).trim()) {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: "invalid_client", error_description: "Credenciales de Review inválidas" }));
      return;
    }

    const allProjects = await supabaseFetch("projects?select=id,name,responsible_party,id_user,status&order=name.asc");
    let targetProject = allProjects.find(p => p.id_user === user.id || p.responsible_party === user.mail) || allProjects[0];

    if (!targetProject) {
      targetProject = { id: "a1234567-89ab-cdef-0123-456789abcdef", name: "Proyecto General" };
    }

    const tokenData = {
      userId: user.id,
      email: user.mail,
      userName: user.userName || user.mail,
      admin: user.admin === true,
      projectId: targetProject.id,
      projectName: targetProject.name
    };

    const accessToken = generateAccessToken(tokenData);

    res.statusCode = 200;
    res.end(JSON.stringify({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 31536000,
      scope: "mcp",
      user: {
        id: user.id,
        email: user.mail,
        name: user.userName
      },
      project: {
        id: targetProject.id,
        name: targetProject.name
      }
    }));
    return;
  }

  res.statusCode = 400;
  res.end(JSON.stringify({ error: "unsupported_grant_type", error_description: `Grant type '${grant_type}' no soportado` }));
}
