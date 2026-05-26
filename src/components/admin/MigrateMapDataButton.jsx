import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Database, CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronRight } from 'lucide-react';

/**
 * MigrateMapDataButton
 * 
 * Migra el contenido de esquemas.map_data (JSON blob) a la tabla normalizada
 * esquema_nodes, donde cada nodo es una fila relacionada al esquema.
 * 
 * Fuentes de datos:
 *   - esquemas.map_data          → esquema_nodes (propiedades del nodo)
 *   - esquema_nodes_resources    → esquema_nodes.recurso_id (relación con recursos)
 */
export default function MigrateMapDataButton() {
  const [status, setStatus]       = useState('idle'); // idle | running | done | error
  const [log, setLog]             = useState([]);
  const [showLog, setShowLog]     = useState(false);
  const [stats, setStats]         = useState(null);

  const addLog = (msg, type = 'info') => {
    setLog(prev => [...prev, { msg, type, ts: new Date().toLocaleTimeString() }]);
  };

  // Flatten the recursive map_data tree into an array of rows
  const flattenNodes = (node, esquemaId, parentId = null, depth = 0) => {
    if (!node) return [];

    const row = {
      id:                   node.id,
      esquema_id:           esquemaId,
      parent_id:            parentId,
      name:                 node.name || null,
      description:          node.description || null,
      category:             node.category || null,
      type:                 node.type || null,
      roles:                node.roles || null,
      x:                    node.x ?? null,
      y:                    node.y ?? null,
      width:                node.width ?? null,
      height:               node.height ?? null,
      depth:                depth,
      is_root:              node.isRoot ?? false,
      is_branch_expanded:   node.isBranchExpanded ?? true,
      is_text_expanded:     node.isTextExpanded ?? false,
      is_highlighted:       node.isHighlighted ?? false,
      highlight_color:      node.highlightColor ?? null,
      storage_mode:         node.storage_mode ?? null,
      external_links:       node.externalLinks ?? [],
      external_resources:   node.externalResources ?? [],
      path:                 node.path ?? [],
      recurso_id:           null, // se rellena en la siguiente fase
    };

    const children = (node.children || []).flatMap(child =>
      flattenNodes(child, esquemaId, node.id, depth + 1)
    );

    return [row, ...children];
  };

  const handleMigrate = async () => {
    if (!window.confirm(
      '⚠️ ¿Migrar map_data → esquema_nodes?\n\n' +
      'Esto hace UPSERT de todos los nodos de todos los esquemas a la nueva tabla. ' +
      'No borra nada. Se puede ejecutar varias veces de forma segura.'
    )) return;

    setStatus('running');
    setLog([]);
    setStats(null);

    let totalNodes = 0;
    let totalLinked = 0;
    let totalSchemas = 0;
    let errors = 0;

    try {
      // ── 1. Fetch all schemas ──────────────────────────────────────────
      addLog('🔍 Cargando todos los esquemas...');
      const { data: schemas, error: schErr } = await supabase
        .from('esquemas')
        .select('id, name, map_data');

      if (schErr) throw schErr;
      addLog(`✅ ${schemas.length} esquemas encontrados.`);

      // ── 2. Fetch all node-resource links ──────────────────────────────
      addLog('🔗 Cargando vínculos esquema_nodes_resources...');
      const { data: nodeResLinks } = await supabase
        .from('esquema_nodes_resources')
        .select('node_id, resource_id');

      // Build a map: node_id → resource_id (first resource wins)
      const nodeToResource = {};
      (nodeResLinks || []).forEach(l => {
        if (!nodeToResource[l.node_id]) nodeToResource[l.node_id] = l.resource_id;
      });
      addLog(`✅ ${Object.keys(nodeToResource).length} vínculos nodo→recurso cargados.`);

      // ── 3. Flatten & upsert per schema ────────────────────────────────
      for (const schema of schemas) {
        if (!schema.map_data) {
          addLog(`⚠️  Esquema "${schema.name}" (${schema.id.substring(0,8)}) no tiene map_data. Omitido.`, 'warn');
          continue;
        }

        addLog(`📐 Procesando: "${schema.name}"...`);
        const rows = flattenNodes(schema.map_data, schema.id);

        // Attach recurso_id from the node-resource link map
        rows.forEach(row => {
          if (nodeToResource[row.id]) {
            row.recurso_id = nodeToResource[row.id];
            totalLinked++;
          }
        });

        // Upsert in batches of 100
        const BATCH = 100;
        for (let i = 0; i < rows.length; i += BATCH) {
          const batch = rows.slice(i, i + BATCH);
          const { error: upsErr } = await supabase
            .from('esquema_nodes')
            .upsert(batch, { onConflict: 'id' });

          if (upsErr) {
            addLog(`❌ Error en batch ${i / BATCH + 1} de "${schema.name}": ${upsErr.message}`, 'error');
            errors++;
          }
        }

        totalNodes += rows.length;
        totalSchemas++;
        addLog(`   → ${rows.length} nodos migrados (${rows.filter(r => r.recurso_id).length} con recurso_id).`);
      }

      // ── 4. Summary ────────────────────────────────────────────────────
      const summary = {
        schemas:  totalSchemas,
        nodes:    totalNodes,
        linked:   totalLinked,
        errors,
      };
      setStats(summary);
      addLog('');
      addLog(`🏁 MIGRACIÓN COMPLETA`, 'success');
      addLog(`   Esquemas:  ${totalSchemas}`, 'success');
      addLog(`   Nodos:     ${totalNodes}`, 'success');
      addLog(`   Con recurso_id: ${totalLinked}`, 'success');
      if (errors > 0) addLog(`   Errores:   ${errors}`, 'error');

      setStatus(errors > 0 ? 'error' : 'done');
    } catch (err) {
      addLog(`💥 Error fatal: ${err.message}`, 'error');
      setStatus('error');
    }
  };

  const logColor = { info: 'text-[#72777f]', warn: 'text-yellow-600', error: 'text-red-500', success: 'text-green-600' };

  return (
    <div className="bg-white border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,1)] p-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 border-b-2 border-[#1c1c19] pb-3">
        <div className="w-9 h-9 bg-[#1c1c19] flex items-center justify-center text-white shrink-0">
          <Database size={18} />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-[#1c1c19]">
            Migrar map_data → esquema_nodes
          </h3>
          <p className="text-[10px] text-[#72777f] font-mono uppercase tracking-widest">
            esquemas.map_data (JSON) → tabla relacional normalizada
          </p>
        </div>
      </div>

      {/* Source / Dest info */}
      <div className="grid grid-cols-2 gap-3 mb-5 text-[10px] font-mono">
        <div className="bg-[#f6f3ee] border border-[#1c1c19]/20 p-3">
          <div className="font-black uppercase text-[#ba1a1a] mb-1">ORIGEN</div>
          <div className="text-[#1c1c19]">tabla: <span className="font-bold">esquemas</span></div>
          <div className="text-[#72777f]">columna: map_data (JSONB blob)</div>
        </div>
        <div className="bg-[#e8f4ea] border border-green-300 p-3">
          <div className="font-black uppercase text-green-700 mb-1">DESTINO</div>
          <div className="text-[#1c1c19]">tabla: <span className="font-bold">esquema_nodes</span></div>
          <div className="text-[#72777f]">+ recurso_id (de esquema_nodes_resources)</div>
        </div>
      </div>

      {/* Action button */}
      <button
        onClick={handleMigrate}
        disabled={status === 'running'}
        className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-[#1c1c19] text-white font-black text-[11px] uppercase tracking-widest hover:bg-[#0f4369] transition-colors disabled:opacity-50 border-2 border-[#1c1c19]"
      >
        {status === 'running'
          ? <><Loader2 size={15} className="animate-spin" /> MIGRANDO...</>
          : status === 'done'
          ? <><CheckCircle size={15} /> MIGRAR DE NUEVO</>
          : <><Database size={15} /> MIGRAR NODOS A TABLA</>
        }
      </button>

      {/* Stats badges */}
      {stats && (
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          {[
            { label: 'Esquemas', value: stats.schemas, color: 'bg-[#f6f3ee]' },
            { label: 'Nodos',    value: stats.nodes,   color: 'bg-[#e8f4ea]' },
            { label: 'Con Recurso', value: stats.linked, color: 'bg-[#dbeafe]' },
            { label: 'Errores',  value: stats.errors,  color: stats.errors > 0 ? 'bg-red-100' : 'bg-[#f6f3ee]' },
          ].map(s => (
            <div key={s.label} className={`${s.color} border border-[#1c1c19]/10 p-2`}>
              <div className="text-xl font-black text-[#1c1c19]">{s.value}</div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-[#72777f]">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Log toggle */}
      {log.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowLog(v => !v)}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#72777f] hover:text-[#1c1c19]"
          >
            {showLog ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            {showLog ? 'Ocultar' : 'Ver'} log de migración ({log.length} líneas)
          </button>
          {showLog && (
            <div className="mt-2 bg-[#1c1c19] p-3 max-h-60 overflow-auto font-mono text-[10px] space-y-0.5">
              {log.map((entry, i) => (
                <div key={i} className={logColor[entry.type] || 'text-[#e5e2dd]'}>
                  <span className="text-[#72777f] mr-2">{entry.ts}</span>
                  {entry.msg}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
