import handler from './mcp.js';
import { EventEmitter } from 'node:events';

function createMockReqRes(method, body = null, headers = {}) {
  const req = new EventEmitter();
  req.method = method;
  req.url = '/api/mcp';
  req.headers = { 'content-type': 'application/json', ...headers };
  req.body = body;

  const res = {
    statusCode: 200,
    headers: {},
    data: '',
    setHeader(k, v) { this.headers[k] = v; },
    end(d) {
      if (d) this.data = d;
      this.emitEnd?.();
    }
  };

  const promise = new Promise((resolve) => {
    res.emitEnd = () => resolve(res);
  });

  return { req, res, promise };
}

async function callTool(name, args = {}) {
  const { req, res, promise } = createMockReqRes('POST', {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: { name, arguments: args }
  });
  handler(req, res);
  const result = await promise;
  const parsed = JSON.parse(result.data);
  return parsed.result;
}

async function runFullSuite() {
  console.log('=== TEST 1: tools/list ===');
  const { req, res, promise } = createMockReqRes('POST', {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  });
  handler(req, res);
  const listResult = await promise;
  const tools = JSON.parse(listResult.data).result.tools;
  console.log(`Total herramientas expuestas: ${tools.length}`);
  tools.forEach((t, i) => console.log(` ${i + 1}. [${t.name}] - ${t.description.slice(0, 75)}...`));

  console.log('\n=== TEST 2: Cuantificación de Pisos ===');
  const pisos = await callTool('pisos_cuantificacion_consultar', { project_id: 'Torre A', agrupar_por: 'material' });
  console.log(pisos.content[0].text);

  console.log('\n=== TEST 3: Cuantificación de Muros / Mampostería ===');
  const muros = await callTool('muros_cuantificacion_consultar', { project_id: 'Torre A', agrupar_por: 'material' });
  console.log(muros.content[0].text);

  console.log('\n=== TEST 4: Cuantificación de Steel Deck ===');
  const steel = await callTool('steel_deck_cuantificacion_consultar', { project_id: 'Torre A' });
  console.log(steel.content[0].text);

  console.log('\n=== TEST 5: Presupuestador de Materiales ===');
  const pres = await callTool('materiales_presupuestar', {
    items: [
      { material: 'Porcelanato 60x60', cantidad: 150 },
      { material: 'Adoquín de Concreto Rectangular', cantidad: 80 },
      { material: 'Ladrillo Farol 6 Huecos', cantidad: 500 }
    ]
  });
  console.log(pres.content[0].text);

  console.log('\n=== TEST 6: Resumen BEP del Proyecto ===');
  const bep = await callTool('bep_resumen_consultar', { project_id: 'Torre A' });
  console.log(bep.content[0].text);

  console.log('\n=== TEST 7: Diagnóstico Global de la Base de Datos ===');
  const diag = await callTool('database_report_resumen', { project_id: 'Torre A' });
  console.log(diag.content[0].text);

  console.log('\n=== TEST 8: Consulta Directa a Tabla Supabase ===');
  const tabla = await callTool('tabla_supabase_consultar', {
    tabla: 'Materiales',
    select: 'id,Nombre,categoria,precio_COP,precio_por_m2',
    limite: 3
  });
  console.log(tabla.content[0].text);

  console.log('\n✅ BATERÍA DE PRUEBAS COMPLETADA EXITOSAMENTE');
}

runFullSuite().catch(console.error);
