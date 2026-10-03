/**
 * ============================================================================
 * OAuth 2.0 Authorization Endpoint para Review MCP + Gemini / Antigravity
 * Endpoint: /api/oauth/authorize
 * ============================================================================
 * Autentica usuarios directamente contra Supabase ('user_profiles') sin
 * servicios externos de OAuth. Permite seleccionar el proyecto BIM activo
 * para la sesión.
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

function generateCode(user, project, clientId, redirectUri) {
  const payload = JSON.stringify({
    userId: user.id,
    email: user.mail,
    userName: user.userName || user.mail,
    admin: user.admin === true,
    projectId: project.id,
    projectName: project.name,
    clientId: clientId || "",
    redirectUri,
    exp: Date.now() + 10 * 60 * 1000 // 10 minutos de validez
  });
  const encoded = Buffer.from(payload).toString("base64url");
  const sig = crypto
    .createHmac("sha256", MCP_SECRET)
    .update(encoded)
    .digest("hex")
    .slice(0, 32);
  return `${encoded}.${sig}`;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Capturar parámetros tanto de query (GET) como de body (POST)
  let params = { ...req.query };
  if (req.method === "POST") {
    let body = req.body;
    if (typeof body === "string") {
      try {
        // Puede venir como application/x-www-form-urlencoded o application/json
        if (body.includes("=")) {
          const parsed = new URLSearchParams(body);
          for (const [k, v] of parsed.entries()) params[k] = v;
        } else {
          params = { ...params, ...JSON.parse(body) };
        }
      } catch (e) {
        console.error("Error parsing body:", e);
      }
    } else if (body && typeof body === "object") {
      params = { ...params, ...body };
    }
  }

  const client_id = params.client_id || "";
  const redirect_uri = params.redirect_uri || "";
  const state = params.state || "";
  const response_type = params.response_type || "code";

  // Cargar proyectos disponibles desde Supabase
  const allProjects = await supabaseFetch("projects?select=id,name,responsible_party,id_user,status&order=name.asc");

  // Procesar Intento de Login
  let errorMessage = "";
  if (params.action === "login") {
    const email = (params.email || "").trim().toLowerCase();
    const passkey = (params.passkey || "").trim();
    const selectedProjectId = params.project_id || "";

    if (!email || !passkey) {
      errorMessage = "Por favor ingresa tu correo y contraseña.";
    } else {
      // Validar usuario contra Supabase user_profiles
      const users = await supabaseFetch(`user_profiles?mail=eq.${encodeURIComponent(email)}&status=eq.true&select=*`);
      const user = users && users[0];

      if (!user || String(user.password).trim() !== passkey) {
        errorMessage = "Credenciales inválidas. Verifica tu correo y contraseña de Review.";
      } else {
        // Encontrar el proyecto seleccionado
        let targetProject = allProjects.find(p => p.id === selectedProjectId);
        if (!targetProject && allProjects.length > 0) {
          // Si no seleccionó o no existe, asociar al primero autorizado
          if (user.admin) {
            targetProject = allProjects[0];
          } else {
            targetProject = allProjects.find(p => p.id_user === user.id || p.responsible_party === user.mail) || allProjects[0];
          }
        }

        if (!targetProject) {
          targetProject = { id: "a1234567-89ab-cdef-0123-456789abcdef", name: "Proyecto General" };
        }

        // Generar código de autorización firmado
        const code = generateCode(user, targetProject, client_id, redirect_uri);

        // Si tenemos redirect_uri (flujo estándar Gemini OAuth), redirigir
        if (redirect_uri) {
          try {
            const callbackUrl = new URL(redirect_uri);
            callbackUrl.searchParams.set("code", code);
            if (state) callbackUrl.searchParams.set("state", state);
            res.writeHead(302, { Location: callbackUrl.toString() });
            res.end();
            return;
          } catch (err) {
            errorMessage = `URI de redirección inválida: ${redirect_uri}`;
          }
        } else {
          // Si se abrió directamente en navegador
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.statusCode = 200;
          res.end(JSON.stringify({
            status: "authorized",
            code,
            user: { id: user.id, email: user.mail, userName: user.userName },
            project: targetProject
          }));
          return;
        }
      }
    }
  }

  // Renderizar interfaz visual tipo Review (estética idéntica al formulario de la plataforma)
  const defaultEmail = client_id.includes("@") ? client_id : (params.email || "");
  const projectOptionsHtml = allProjects.map(p => 
    `<option value="${p.id}" ${params.project_id === p.id ? "selected" : ""}>${p.name.toUpperCase()} (ID: ${p.id.slice(0, 8)}...)</option>`
  ).join("\n");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>REVIEW BIM // MCP OAUTH AUTHORIZE</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Space Grotesk', -apple-system, sans-serif;
      background: #f6f5f0;
      color: #1e293b;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .panel {
      background: #ffffff;
      border: 2px solid #0f2c4d;
      border-radius: 4px;
      box-shadow: 8px 8px 0px #0f2c4d;
      max-width: 480px;
      width: 100%;
      padding: 36px 32px;
    }
    .header-badge {
      display: inline-block;
      background: #0f2c4d;
      color: #f6f5f0;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 1.5px;
      padding: 4px 8px;
      margin-bottom: 16px;
      text-transform: uppercase;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f2c4d;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    .subtitle {
      font-family: 'Inter', sans-serif;
      font-size: 0.85rem;
      color: #64748b;
      margin-bottom: 24px;
      line-height: 1.4;
    }
    .field-group {
      margin-bottom: 20px;
    }
    .field-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    label {
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 1px;
      color: #0f2c4d;
      text-transform: uppercase;
    }
    .hint {
      font-size: 0.7rem;
      font-weight: 600;
      color: #64748b;
      letter-spacing: 0.5px;
    }
    input, select {
      width: 100%;
      padding: 12px 14px;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1rem;
      color: #0f2c4d;
      background: #f1f5f9;
      border: 1.5px solid #cbd5e1;
      border-radius: 2px;
      outline: none;
      transition: all 0.15s ease-in-out;
    }
    input:focus, select:focus {
      border-color: #0f2c4d;
      background: #ffffff;
      box-shadow: 0 0 0 2px rgba(15, 44, 77, 0.15);
    }
    .btn-submit {
      width: 100%;
      padding: 15px;
      margin-top: 10px;
      background: #0f2c4d;
      color: #ffffff;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      border: none;
      border-radius: 2px;
      cursor: pointer;
      box-shadow: 4px 4px 0px #64748b;
      transition: all 0.15s ease-in-out;
    }
    .btn-submit:hover {
      background: #184675;
      transform: translate(-1px, -1px);
      box-shadow: 5px 5px 0px #64748b;
    }
    .btn-submit:active {
      transform: translate(2px, 2px);
      box-shadow: 1px 1px 0px #64748b;
    }
    .error-banner {
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      color: #991b1b;
      padding: 12px;
      font-family: 'Inter', sans-serif;
      font-size: 0.85rem;
      margin-bottom: 20px;
    }
    .meta-footer {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      font-family: 'Inter', sans-serif;
      font-size: 0.75rem;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="panel">
    <div class="header-badge">REVIEW 2.0 // MCP GATEWAY</div>
    <h1>Conectar Asistente IA</h1>
    <p class="subtitle">Inicia sesión con tus credenciales de Review para autorizar la sincronización de modelos BIM, cuantificaciones y especificaciones.</p>

    ${errorMessage ? `<div class="error-banner">⚠️ ${errorMessage}</div>` : ""}

    <form method="POST" action="/api/oauth/authorize">
      <input type="hidden" name="action" value="login" />
      <input type="hidden" name="client_id" value="${client_id}" />
      <input type="hidden" name="redirect_uri" value="${redirect_uri}" />
      <input type="hidden" name="state" value="${state}" />
      <input type="hidden" name="response_type" value="${response_type}" />

      <div class="field-group">
        <div class="field-header">
          <label>TARGET [EMAIL]</label>
        </div>
        <input type="email" name="email" value="${defaultEmail}" required placeholder="correo@ejemplo.com" autofocus />
      </div>

      <div class="field-group">
        <div class="field-header">
          <label>PASS_KEY</label>
          <span class="hint">8_CHAR_MIN</span>
        </div>
        <input type="password" name="passkey" required placeholder="••••••••" />
      </div>

      <div class="field-group">
        <div class="field-header">
          <label>PROYECTO ACTIVO A VINCULAR</label>
          <span class="hint">SUPABASE BIM</span>
        </div>
        <select name="project_id">
          ${projectOptionsHtml}
        </select>
      </div>

      <button type="submit" class="btn-submit">EXECUTE LOGIN & AUTHORIZE</button>
    </form>

    <div class="meta-footer">
      <span>SERVERLESS // SUPABASE</span>
      <span>OAUTH 2.1 RFC 8414</span>
    </div>
  </div>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.statusCode = 200;
  res.end(html);
}
