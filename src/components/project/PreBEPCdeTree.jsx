import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { buildTreeFromFlatNodes } from '../../utils/schemaUtils';
import { Folder, FileText, HardDrive, File } from 'lucide-react';

export default function PreBEPCdeTree({ plan }) {
  const [mergedData, setMergedData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTree = async () => {
      setLoading(true);
      try {
        let schemaTree = null;
        if (plan.schema_id) {
          const { data: nodes } = await supabase
            .from('esquema_nodes')
            .select('*')
            .eq('esquema_id', plan.schema_id);
          
          if (nodes && nodes.length > 0) {
            schemaTree = buildTreeFromFlatNodes(nodes);
          } else if (plan.schema?.map_data) {
            schemaTree = plan.schema.map_data;
          }
        }

        if (!schemaTree) {
          setMergedData(null);
          return;
        }

        const delta = plan.plan_data || {};
        const merge = (node) => ({
          ...node,
          ...(delta[node.id] || {}),
          children: node.children?.map(merge) || []
        });

        const fullTree = merge(schemaTree);

        const findNodeByName = (node, keyword) => {
          if (node.name && node.name.toUpperCase().includes(keyword.toUpperCase())) return node;
          if (node.children) {
            for (const child of node.children) {
              const found = findNodeByName(child, keyword);
              if (found) return found;
            }
          }
          return null;
        };

        const targetBranch = findNodeByName(fullTree, "SERVIDOR DE PROYECTO") || findNodeByName(fullTree, "CDE CLOUD");
        
        if (targetBranch) {
          setMergedData(targetBranch);
        } else {
          setMergedData(fullTree);
        }
      } catch (e) {
        console.error("Error loading CDE tree for plan", e);
      } finally {
        setLoading(false);
      }
    };
    loadTree();
  }, [plan]);

  if (loading) {
    return (
      <div className="p-6 bg-[#fcf9f4] border-2 border-[#1c1c19] border-dashed text-[10px] uppercase text-gray-500 font-mono flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        Procesando estructura de carpetas...
      </div>
    );
  }

  if (!mergedData) {
    return (
      <div className="p-6 bg-[#fcf9f4] border-2 border-gray-200 text-[10px] uppercase text-gray-500 font-mono italic">
        Estructura vacía o sin esquema vinculado.
      </div>
    );
  }

  const renderTreeLines = (node, prefix = '', isLast = true) => {
    const isFolder = node.type?.toLowerCase() === 'folder' || (node.children && node.children.length > 0);
    
    // Icon logic
    let Icon = File;
    let iconColor = "text-gray-400";
    if (isFolder) {
      Icon = Folder;
      iconColor = "text-[#0f4369] fill-current opacity-60";
    } else if (node.type?.includes('.md')) {
      Icon = FileText;
      iconColor = "text-blue-500";
    } else if (node.type?.includes('.rvt')) {
      Icon = HardDrive;
      iconColor = "text-orange-500";
    }

    const currentLinePrefix = isLast ? '└── ' : '├── ';
    const childPrefix = prefix + (isLast ? '    ' : '│   ');

    return (
      <div key={node.id || node.name || Math.random()} className="flex flex-col">
        <div className="flex items-center gap-2 hover:bg-gray-100 py-0.5 px-2 -ml-2 rounded-sm transition-colors">
          <span className="text-gray-300 whitespace-pre font-mono leading-none select-none">{prefix}{currentLinePrefix}</span>
          <Icon size={14} className={iconColor} />
          <span className={`text-[11px] font-mono tracking-tight truncate max-w-[500px] ${isFolder ? 'font-black text-[#1c1c19]' : 'text-gray-600'}`}>
            {node.name}
          </span>
        </div>
        {node.children && node.children.length > 0 && (
          <div>
            {node.children.map((child, idx) => 
              renderTreeLines(child, childPrefix, idx === node.children.length - 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border-2 border-[#1c1c19] p-6 mb-6 overflow-x-auto shadow-[4px_4px_0_0_rgba(28,28,25,1)]">
      <div className="flex items-center gap-3 mb-4 border-b-2 border-[#1c1c19]/10 pb-3">
        <Folder size={20} className="text-[#0f4369] fill-current" />
        <span className="font-black text-xs uppercase tracking-widest text-[#1c1c19]">RAÍZ: {mergedData.name || 'CDE STRUCTURE'}</span>
      </div>
      <div className="font-mono text-[11px] text-[#1c1c19] pt-2 pb-2 pl-1">
        {mergedData.children?.map((child, idx) => 
          renderTreeLines(child, '', idx === mergedData.children.length - 1)
        )}
      </div>
      <div className="mt-4 pt-3 border-t border-[#1c1c19]/10 text-[8px] text-gray-400 font-mono tracking-widest uppercase flex justify-between">
        <span>© ARK DIGITAL TWIN ENGINE</span>
        <span>STATIC DIRECTORY TREE</span>
      </div>
    </div>
  );
}
