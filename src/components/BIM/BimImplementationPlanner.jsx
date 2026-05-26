import React, { useState } from 'react';
import { 
  ClipboardList, 
  ChevronRight, 
  ChevronDown, 
  Save, 
  Search, 
  Filter, 
  ArrowRight,
  User,
  Link2,
  FileText,
  AlertCircle,
  Copy,
  Zap,
  RefreshCw
} from 'lucide-react';
import { PROMPTS } from '../../config/aiPrompts';

const PlannerRow = ({ node, level = 0, onUpdateNode, isAdmin, currentPath = [], onSyncNode }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const newPath = [...currentPath, node.name];
  const children = node.children || [];
  const hasChildren = children.length > 0;

  const handleChange = (field, value) => {
    onUpdateNode(node.id, { [field]: value });
  };

  const handleCopyPrompt = () => {
    const promptPath = newPath.join(' > ');
    const cleanNode = { ...node };
    delete cleanNode.children;

    const dataStr = `DEFINICIÓN ACTUAL: ${node.description || 'Sin definir'}
ROLES: ${node.roles || 'Sin asignar'}

TAREA:
Lee la información y genera CONTENIDO REALISTA para este elemento basándote en estándares internacionales (ISO 19650). 
- Si es una MATRIZ, genera una tabla Markdown realista.
- Si es un PROTOCOLO o MANUAL, detalla los pasos técnicos.
- Entrega un EJEMPLO CLARO tal como se vería en un proyecto real de alta complejidad.

FORMATO DE ENTREGA:
Devuelve ÚNICAMENTE un objeto JSON con esta estructura exacta:
{
  "name": "${node.name}",
  "description": "Aquí va el contenido técnico detallado con tablas/ejemplos en Markdown",
  "roles": "${node.roles || 'Coordinador BIM'}",
  "type": "${node.type || 'DOC'}"
}`;

    const fullPrompt = PROMPTS.bimImplementationPlanner(node.name, promptPath, dataStr);

    navigator.clipboard.writeText(fullPrompt);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <>
      <tr className={`border-b border-[#1c1c19]/10 group transition-colors ${level === 0 ? 'bg-[#fcf9f4]' : 'bg-white'} hover:bg-[#0f4369]/5`}>
        {/* Component Name & Hierarchy */}
        <td className="py-4 px-4 min-w-[300px]" style={{ paddingLeft: `${level * 24 + 16}px` }}>
          <div className="flex items-center gap-3">
            {hasChildren ? (
              <button 
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 hover:bg-[#1c1c19]/10 rounded transition-colors text-[#0f4369]"
              >
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <div className="w-6" />
            )}
            <input 
              value={node.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={!isAdmin}
              className={`bg-transparent border-b-2 border-transparent focus:border-[#0f4369] focus:outline-none font-bold text-xs uppercase tracking-tight w-full ${level === 0 ? 'text-[#1c1c19]' : 'text-gray-700'}`}
              placeholder="Nombre del componente..."
            />
          </div>
        </td>

        {/* Type Column */}
        <td className="py-4 px-4 w-32">
          <select
            value={node.type || 'DOC'}
            onChange={(e) => handleChange('type', e.target.value)}
            disabled={!isAdmin}
            className="bg-[#f6f3ee] border border-[#1c1c19]/20 text-[10px] font-black uppercase tracking-widest px-2 py-1 focus:outline-none focus:border-[#0f4369] w-full cursor-pointer"
          >
            <option value="FOLDER">FOLDER</option>
            <option value="DOC">DOC</option>
            <option value=".PDF">.PDF</option>
            <option value=".RVT">.RVT</option>
            <option value=".RFA">.RFA</option>
            <option value=".DWG">.DWG</option>
            <option value=".MD">.MD</option>
          </select>
        </td>

        {/* Storage Mode Column */}
        <td className="py-4 px-4 w-32">
          <select
            value={node.storage_mode || 'INHERIT'}
            onChange={(e) => handleChange('storage_mode', e.target.value)}
            disabled={!isAdmin}
            className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 focus:outline-none w-full cursor-pointer border ${
                node.storage_mode === 'CLOUD' ? 'bg-blue-50 border-blue-200 text-blue-700' : 
                node.storage_mode === 'LOCAL' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                node.storage_mode === 'BOTH' ? 'bg-green-50 border-green-200 text-green-700' :
                'bg-[#f6f3ee] border-[#1c1c19]/20 text-gray-500'
            }`}
          >
            <option value="INHERIT">HEREDADO</option>
            <option value="LOCAL">LOCAL</option>
            <option value="CLOUD">NUBE</option>
            <option value="BOTH">AMBOS</option>
          </select>
        </td>

        {/* Responsibility / Roles */}
        <td className="py-4 px-4 w-64">
          <div className="flex items-center gap-2 bg-[#f6f3ee]/50 p-1 px-2 border border-[#1c1c19]/10 rounded-sm">
            <User size={12} className="text-[#0f4369] opacity-50 shrink-0" />
            <input 
              value={node.roles || ''}
              onChange={(e) => handleChange('roles', e.target.value)}
              disabled={!isAdmin}
              className="bg-transparent text-[10px] font-mono tracking-tighter w-full focus:outline-none"
              placeholder="Ej: BIM Coordinator"
            />
          </div>
        </td>

        {/* URL / Link */}
        <td className="py-4 px-4 w-64">
          <div className="flex items-center gap-2 bg-[#f6f3ee]/50 p-1 px-2 border border-[#1c1c19]/10 rounded-sm">
            <Link2 size={12} className="text-[#0f4369] opacity-50 shrink-0" />
            <input 
              value={node.url || ''}
              onChange={(e) => handleChange('url', e.target.value)}
              disabled={!isAdmin}
              className="bg-transparent text-[10px] font-mono tracking-tighter w-full focus:outline-none"
              placeholder="https://drive.google.com/..."
            />
          </div>
        </td>

        {/* Definition / Description Brief */}
        <td className="py-4 px-4 flex-1 min-w-[300px]">
          <div className="flex items-center gap-2 group/desc">
            <FileText size={12} className="text-gray-400 shrink-0" />
            <input 
              value={node.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={!isAdmin}
              className="bg-transparent border-b border-transparent group-hover/desc:border-gray-200 focus:border-[#0f4369] focus:outline-none text-[10px] w-full italic"
              placeholder="Definición técnica o metas..."
            />
          </div>
        </td>

        {/* AI ACTIONS */}
        <td className="py-4 px-4 w-48">
            <div className="flex items-center gap-2">
                <button
                    onClick={handleCopyPrompt}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-[2px] text-[8px] font-black uppercase tracking-widest transition-all border border-[#1c1c19]/10 shadow-[2px_2px_0_0_rgba(28,28,25,0.1)] ${isCopied ? 'bg-green-600 text-white' : 'bg-amber-400 text-[#1c1c19] hover:bg-amber-500'}`}
                    title="Copiar AI Command"
                >
                    <Zap size={10} fill="currentColor" /> {isCopied ? 'COPIADO' : 'AI'}
                </button>
                <button
                    onClick={() => onSyncNode(node)}
                    className="flex items-center gap-1.5 px-2 py-1 bg-[#1c1c19] text-white text-[8px] font-black uppercase tracking-widest rounded-[2px] border border-[#1c1c19]/20 shadow-[2px_2px_0_0_rgba(28,28,25,0.1)] hover:bg-[#0f4369] transition-all"
                    title="Sincronizar con JSON de la IA"
                >
                    <RefreshCw size={10} className="text-amber-400" /> SYNC AI
                </button>
            </div>
        </td>
      </tr>

      {isOpen && hasChildren && (
        <>
          {children.map((child, idx) => (
            <PlannerRow 
              key={child.id || idx} 
              node={child} 
              level={level + 1} 
              onUpdateNode={onUpdateNode}
              isAdmin={isAdmin}
              currentPath={newPath}
              onSyncNode={onSyncNode}
            />
          ))}
        </>
      )}
    </>
  );
};

export default function BimImplementationPlanner({ mapData, title, onUpdateNode, isAdmin, onSyncNode }) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!mapData) return null;

  return (
    <div className="bg-[#fcf9f4] border-2 border-[#1c1c19] h-full flex flex-col shadow-[12px_12px_0_0_rgba(28,28,25,1)] overflow-hidden">
      {/* Premium Header */}
      <div className="bg-[#1c1c19] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-amber-400 p-1 rounded-sm">
              <ClipboardList size={18} className="text-[#1c1c19]" />
            </div>
            <h3 className="text-[#e5e2dd] font-black text-lg uppercase tracking-[4px]">Planificador de Implementación</h3>
          </div>
          <p className="font-mono text-[9px] text-white/40 uppercase tracking-widest pl-10">
            Esquema Activo: <span className="text-amber-400/80">{title}</span> — ISO 19650 Compliance
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
            <input 
              type="text"
              placeholder="FILTRAR COMPONENTES..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/10 border border-white/20 p-2 pl-10 text-[10px] font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-amber-400 transition-all uppercase"
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[9px] font-black uppercase tracking-tighter rounded-sm">
            <AlertCircle size={12} />
            Auto-Sync On
          </div>
        </div>
      </div>

      {/* Spreadsheet Implementation */}
      <div className="flex-1 overflow-auto custom-scrollbar bg-white">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-20 bg-[#f6f3ee] border-b-2 border-[#1c1c19]">
            <tr>
              <th className="py-3 px-6 text-left font-mono text-[10px] font-black text-[#1c1c19] uppercase tracking-widest border-r border-[#1c1c19]/10">Componente / Nivel</th>
              <th className="py-3 px-4 text-left font-mono text-[10px] font-black text-[#1c1c19] uppercase tracking-widest border-r border-[#1c1c19]/10">Tipo</th>
              <th className="py-3 px-4 text-left font-mono text-[10px] font-black text-[#1c1c19] uppercase tracking-widest border-r border-[#1c1c19]/10">Ubicación</th>
              <th className="py-3 px-4 text-left font-mono text-[10px] font-black text-[#1c1c19] uppercase tracking-widest border-r border-[#1c1c19]/10">Responsabilidad</th>
              <th className="py-3 px-4 text-left font-mono text-[10px] font-black text-[#1c1c19] uppercase tracking-widest border-r border-[#1c1c19]/10">Ref. Documental</th>
              <th className="py-3 px-4 text-left font-mono text-[10px] font-black text-[#1c1c19] uppercase tracking-widest border-r border-[#1c1c19]/10">Definición General</th>
              <th className="py-3 px-4 text-left font-mono text-[10px] font-black text-[#1c1c19] uppercase tracking-widest">AI Sync</th>
            </tr>
          </thead>
          <tbody>
            <PlannerRow 
              node={mapData} 
              level={0} 
              onUpdateNode={onUpdateNode}
              isAdmin={isAdmin}
              onSyncNode={onSyncNode}
            />
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-[#1c1c19]/10 bg-white/50 text-[9px] font-mono text-gray-400 uppercase tracking-widest flex justify-between items-center shrink-0">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Database Connected</span>
          <span className="flex items-center gap-2"><Save size={10} /> Latency: 45ms</span>
        </div>
        <div className="flex items-center gap-2">
          <span>ARK DIGITAL TWIN ENGINE</span>
          <ArrowRight size={10} />
          <span className="text-[#1c1c19] font-black">Sync Protocol V2.1</span>
        </div>
      </div>
    </div>
  );
}
