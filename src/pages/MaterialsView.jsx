import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Package, Search, DollarSign, Building2, Edit,
  Loader2, X, Save, AlertCircle, Plus, Filter, ChevronRight, ArrowUpDown,
  Ruler, Weight, Tag, Clock, Trash2, Camera, ExternalLink, Info, Database, Eye, Edit3, Settings, Check, Download,
  Sparkles, Copy, Globe, Lock
} from 'lucide-react';
import { getMaterials, getMaterialCategories, updateMaterial, createMaterial, deleteMaterial, createMaterialsBatch, toggleGlobalMaterial } from '../services/materialsService';
import { useAuth } from '../context/AuthContext';



// --- CONSTANTS ---
const UNIT_LABELS = {
  'UND': 'UNIDAD',
  'M2': 'METROS CUADRADOS',
  'ML': 'METROS LINEALES',
  'M3': 'METROS CÚBICOS',
  'KG': 'KILOGRAMOS',
  'TON': 'TONELADAS',
  'GL': 'GALONES',
  'CJ': 'CAJAS',
  'BL': 'BULTOS',
  'PAQ': 'PAQUETES',
  'PLN': 'PLANCHAS',
  'RLL': 'ROLLOS'
};

const CONSTRUCTION_UNITS = Object.keys(UNIT_LABELS);

// --- UTILS ---
const formatCurrency = (val) => {
  if (!val || val === '---') return '---';
  const num = parseFloat(val.toString().replace(/[$,]/g, ''));
  if (isNaN(num)) return val;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
};

const isPriceField = (id) => ['precio_COP', 'precio_por_m2', 'precio_por_m_lineal'].includes(id);
// --- SUB-COMPONENT: EDIT/CREATE MODAL ---
const MaterialModal = ({ material, isOpen, onClose, onSave }) => {
  const { isBimManager, isAdmin } = useAuth();
  const canImport = isBimManager || isAdmin;

  const [loading, setLoading] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    Nombre: '', categoria: '', tipo: '', unidad: 'UND', stock: '', proveedor: '',
    precio_COP: '', precio_por_m2: '', precio_por_m_lineal: '',
    alto_mm: '', ancho_mm: '', espesor_mm: '', largo_m: '', area_mm2: '',
    peso_kg_m: '', acabado: '', grado: '',
    uso_recomendado: '', observaciones_tecnicas: '', notas: '',
    foto_url: ''
  });

  useEffect(() => {
    if (material && isOpen) {
      setFormData({
        Nombre: material.Nombre || '',
        categoria: material.categoria || '',
        tipo: material.tipo || '',
        unidad: material.unidad || 'UND',
        stock: material.stock || '',
        proveedor: material.proveedor || '',
        precio_COP: material.precio_COP || '',
        precio_por_m2: material.precio_por_m2 || '',
        precio_por_m_lineal: material.precio_por_m_lineal || '',
        alto_mm: material.alto_mm || '',
        ancho_mm: material.ancho_mm || '',
        espesor_mm: material.espesor_mm || '',
        largo_m: material.largo_m || '',
        area_mm2: material.area_mm2 || '',
        peso_kg_m: material.peso_kg_m || '',
        acabado: material.acabado || '',
        grado: material.grado || '',
        uso_recomendado: material.uso_recomendado || '',
        observaciones_tecnicas: material.observaciones_tecnicas || '',
        notas: material.notas || '',
        foto_url: material.foto_url || ''
      });
    } else if (isOpen) {
      setFormData({
        Nombre: '', categoria: '', tipo: '', unidad: 'UND', stock: '0', proveedor: '',
        precio_COP: '', precio_por_m2: '', precio_por_m_lineal: '',
        alto_mm: '', ancho_mm: '', espesor_mm: '', largo_m: '', area_mm2: '',
        peso_kg_m: '', acabado: '', grado: '',
        uso_recomendado: '', observaciones_tecnicas: '', notas: '',
        foto_url: ''
      });
    }
  }, [material, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      if (material) await updateMaterial(material.id, formData);
      else await createMaterial(formData);
      onSave();
      onClose();
    } catch (err) {
      alert("Error en la operación.");
    } finally {
      setLoading(false);
    }
  };

  const handleAiFill = (data) => {
    if (data && data.length > 0) {
      const item = data[0];
      setFormData({
        Nombre: item.Nombre || '',
        categoria: item.categoria || '',
        tipo: item.tipo || '',
        unidad: item.unidad || 'UND',
        stock: item.stock !== undefined && item.stock !== null ? item.stock.toString() : '0',
        proveedor: item.proveedor || '',
        precio_COP: item.precio_COP !== undefined && item.precio_COP !== null ? item.precio_COP.toString() : '',
        precio_por_m2: item.precio_por_m2 !== undefined && item.precio_por_m2 !== null ? item.precio_por_m2.toString() : '',
        precio_por_m_lineal: item.precio_por_m_lineal !== undefined && item.precio_por_m_lineal !== null ? item.precio_por_m_lineal.toString() : '',
        alto_mm: item.alto_mm !== undefined && item.alto_mm !== null ? item.alto_mm.toString() : '',
        ancho_mm: item.ancho_mm !== undefined && item.ancho_mm !== null ? item.ancho_mm.toString() : '',
        espesor_mm: item.espesor_mm !== undefined && item.espesor_mm !== null ? item.espesor_mm.toString() : '',
        largo_m: item.largo_m !== undefined && item.largo_m !== null ? item.largo_m.toString() : '',
        area_mm2: item.area_mm2 !== undefined && item.area_mm2 !== null ? item.area_mm2.toString() : '',
        peso_kg_m: item.peso_kg_m !== undefined && item.peso_kg_m !== null ? item.peso_kg_m.toString() : '',
        acabado: item.acabado || '',
        grado: item.grado || '',
        uso_recomendado: item.uso_recomendado || '',
        observaciones_tecnicas: item.observaciones_tecnicas || '',
        notas: item.notas || '',
        foto_url: item.foto_url || ''
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 bg-[#1c1c19]/90 backdrop-blur-sm">
      <div className="bg-white border-4 border-[#1c1c19] w-full max-w-5xl shadow-[20px_20px_0_0_rgba(28,28,25,1)] flex flex-col max-h-[95vh]">
        <div className="flex justify-between items-center p-4 border-b-4 border-[#1c1c19] bg-[#f6f3ee]">
          <h3 className="text-sm font-black italic uppercase tracking-tighter">{material ? 'EDITAR_MATERIAL' : 'NUEVO_MATERIAL'}</h3>
          <div className="flex items-center gap-2">
            {canImport && (
              <button
                onClick={() => setIsAiModalOpen(true)}
                className="p-1 hover:bg-[#1c1c19] hover:text-white border-2 border-[#1c1c19] bg-white text-[#0f4369] flex items-center justify-center transition-all"
                title="Autocompletar con IA"
              >
                <Sparkles size={16} className="text-yellow-500" fill="currentColor" />
              </button>
            )}
            <button onClick={onClose} className="p-1 hover:bg-[#1c1c19] hover:text-white border-2 border-transparent hover:border-[#1c1c19]">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
          <div className="grid grid-cols-4 gap-3">
            {Object.keys(formData).map(key => (
              <div key={key} className={['Nombre', 'proveedor', 'uso_recomendado', 'foto_url'].includes(key) ? "col-span-4" : "col-span-1"}>
                <label className="block text-[7px] font-black uppercase text-[#72777f] mb-0.5">{key.replace('_', ' ')}</label>
                {key === 'unidad' ? (
                  <select value={formData[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })} className="w-full p-1.5 border-2 border-[#1c1c19] font-black text-[9px] outline-none bg-white">
                    {CONSTRUCTION_UNITS.map(u => <option key={u} value={u}>{UNIT_LABELS[u]}</option>)}
                  </select>
                ) : (
                  <input type="text" value={formData[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })} className="w-full p-1.5 border-2 border-[#1c1c19] font-black text-[9px] outline-none" />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 border-t-4 border-[#1c1c19] bg-[#f6f3ee] flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 border-4 border-[#1c1c19] font-black text-[9px] hover:bg-[#e5e2dd]">CANCELAR</button>
          <button onClick={handleSave} disabled={loading} className="px-8 py-2 bg-[#1c1c19] text-white font-black text-[9px] flex items-center gap-2">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} GUARDAR
          </button>
        </div>
      </div>
      <AiMaterialImportModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} onImport={handleAiFill} singleMode={true} />
    </div>
  );
};

// --- SUB-COMPONENT: KEYNOTES CONFIG MODAL ---
const KeynotesModal = ({ isOpen, onClose, materials }) => {
  const [keyField, setKeyField] = useState('auto');
  const [textField, setTextField] = useState('Nombre');
  const [treeLayers, setTreeLayers] = useState([]);
  const [selectedFields, setSelectedFields] = useState(new Set(['categoria', 'tipo', 'acabado', 'uso_recomendado', 'dimensiones']));

  if (!isOpen) return null;

  const fieldsForCondensation = [
    { id: 'categoria', label: 'CATEGORÍA' },
    { id: 'tipo', label: 'TIPO' },
    { id: 'acabado', label: 'ACABADO' },
    { id: 'uso_recomendado', label: 'USO RECOMENDADO' },
    { id: 'grado', label: 'GRADO' },
    { id: 'proveedor', label: 'PROVEEDOR' },
    { id: 'dimensiones', label: 'DIMENSIONES INTELIGENTES' }
  ];

  const toggleField = (id) => {
    const newSet = new Set(selectedFields);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedFields(newSet);
  };

  const handleExport = () => {
    let output = "";

    // Árbol Dinámico
    const treeNodes = new Map();
    const childrenCount = new Map(); // Para contar hijos de cada nodo

    const getNodeCode = (pathArray) => {
      const pathKey = JSON.stringify(pathArray);
      if (!treeNodes.has(pathKey)) {
        let pCode = '';
        let parentPathKey = 'root';

        if (pathArray.length > 1) {
          const parentPath = pathArray.slice(0, -1);
          pCode = getNodeCode(parentPath);
          parentPathKey = JSON.stringify(parentPath);
        }

        const count = (childrenCount.get(parentPathKey) || 0) + 1;
        childrenCount.set(parentPathKey, count);

        // Genera el sufijo (ej. 01, 02...)
        const suffix = count.toString().padStart(2, '0');
        // El código es "Padre.Hijo" o solo "Hijo" si es la raíz
        const code = pCode ? `${pCode}.${suffix}` : suffix;

        treeNodes.set(pathKey, {
          code,
          text: pathArray[pathArray.length - 1],
          parentCode: pCode
        });
      }
      return treeNodes.get(pathKey).code;
    };

    if (treeLayers.length > 0) {
      materials.forEach(m => {
        let currentPath = [];
        for (let layer of treeLayers) {
          const val = m[layer];
          if (!val) break; // Rompe si falta el valor en la cadena
          currentPath.push(val.toString());
          getNodeCode([...currentPath]);
        }
      });
    }

    // Imprimir Nodos Padre
    treeNodes.forEach(node => {
      output += `${node.code}\t${node.text}\t${node.parentCode}\r\n`;
    });

    const materialCount = new Map(); // Para enumerar los materiales dentro de su carpeta

    // Luego procesamos los materiales
    materials.forEach((m, index) => {
      let text = '';
      if (textField === 'CONDENSE') {
        let parts = [m.Nombre || 'Sin Nombre'];

        if (selectedFields.has('categoria') && m.categoria) parts.push(m.categoria);
        if (selectedFields.has('tipo') && m.tipo) parts.push(m.tipo);
        if (selectedFields.has('acabado') && m.acabado) parts.push(m.acabado);
        if (selectedFields.has('uso_recomendado') && m.uso_recomendado) parts.push(m.uso_recomendado);
        if (selectedFields.has('grado') && m.grado) parts.push(m.grado);
        if (selectedFields.has('proveedor') && m.proveedor) parts.push(m.proveedor);

        if (selectedFields.has('dimensiones')) {
          const dimProps = [m.largo_m, m.ancho_mm, m.espesor_mm || m.alto_mm].filter(Boolean);
          if (dimProps.length > 0) {
            parts.push(`${dimProps.join('x')}mm`);
          }
        }
        text = parts.join(' | ');
      } else {
        text = m[textField] || 'Sin Descripción';
      }

      let parentCode = '';
      if (treeLayers.length > 0) {
        let currentPath = [];
        for (let layer of treeLayers) {
          const val = m[layer];
          if (!val) break;
          currentPath.push(val.toString());
        }
        if (currentPath.length > 0) {
          const pathKey = JSON.stringify(currentPath);
          if (treeNodes.has(pathKey)) {
            parentCode = treeNodes.get(pathKey).code;
          }
        }
      }

      let key = '';
      if (keyField === 'auto') {
        if (parentCode) {
          const count = (materialCount.get(parentCode) || 0) + 1;
          materialCount.set(parentCode, count);
          key = `${parentCode}.${count.toString().padStart(2, '0')}`;
        } else {
          key = `MAT-${(index + 1).toString().padStart(4, '0')}`;
        }
      } else {
        key = m[keyField] || `MAT-${(index + 1).toString().padStart(4, '0')}`;
      }

      output += `${key}\t${text}\t${parentCode}\r\n`;
    });

    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Revit_Keynotes_2025.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onClose();
  };

  const fields = [
    { id: 'Nombre', label: 'NOMBRE' },
    { id: 'categoria', label: 'CATEGORÍA' },
    { id: 'tipo', label: 'TIPO' },
    { id: 'unidad', label: 'UNIDAD' },
    { id: 'alto_mm', label: 'ALTO' },
    { id: 'ancho_mm', label: 'ANCHO' },
    { id: 'largo_m', label: 'LARGO' },
    { id: 'area_mm2', label: 'AREA MM' },
    { id: 'espesor_mm', label: 'ESP' },
    { id: 'acabado', label: 'ACABADO' },
    { id: 'precio_COP', label: '$ COP' },
    { id: 'precio_por_m2', label: '$ M2' },
    { id: 'precio_por_m_lineal', label: '$ ML' },
    { id: 'peso_kg_m', label: 'KG M' },
    { id: 'grado', label: 'GRADO' },
    { id: 'uso_recomendado', label: 'USO RECOMENDADO' },
    { id: 'proveedor', label: 'PROVEEDOR' },
    { id: 'stock', label: 'STOCK' },
    { id: 'id', label: 'ID (UUID)' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 bg-[#1c1c19]/90 backdrop-blur-sm">
      <div className="bg-white border-4 border-[#1c1c19] w-full max-w-md shadow-[16px_16px_0_0_rgba(28,28,25,1)] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b-4 border-[#1c1c19] bg-[#f6f3ee]">
          <h3 className="text-sm font-black italic uppercase tracking-tighter">EXPORTAR KEYNOTES REVIT</h3>
          <button onClick={onClose} className="p-1 hover:bg-[#1c1c19] hover:text-white border-2 border-transparent hover:border-[#1c1c19]">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="block text-[9px] font-black uppercase text-[#72777f]">1. Clave Principal (Key Value)</label>
            <select value={keyField} onChange={e => setKeyField(e.target.value)} className="w-full p-2 border-2 border-[#1c1c19] font-black text-xs outline-none bg-white">
              <option value="auto">Autogenerar Secuencial (MAT-0001)</option>
              {fields.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-[9px] font-black uppercase text-[#72777f]">2. Texto Descriptivo (Keynote Text)</label>
            <select value={textField} onChange={e => setTextField(e.target.value)} className="w-full p-2 border-2 border-[#1c1c19] font-black text-xs outline-none bg-white">
              <option value="CONDENSE">⭐ Condensar Múltiples Datos (Avanzado)</option>
              {fields.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>

          {textField === 'CONDENSE' && (
            <div className="p-3 bg-[#fcf9f4] border-2 border-[#1c1c19] space-y-2 animate-in slide-in-from-top-2">
              <label className="block text-[8px] font-black uppercase text-[#1c1c19]">Selecciona los datos a concatenar:</label>
              <div className="grid grid-cols-2 gap-2">
                {fieldsForCondensation.map(f => (
                  <label key={f.id} className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-3 h-3 flex-none border-2 border-[#1c1c19] flex items-center justify-center ${selectedFields.has(f.id) ? 'bg-[#1c1c19]' : 'bg-white'}`}>
                      {selectedFields.has(f.id) && <Check size={8} className="text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={selectedFields.has(f.id)} onChange={() => toggleField(f.id)} />
                    <span className="text-[8px] font-bold uppercase truncate">{f.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4 border-t-2 border-[#1c1c19] pt-4">
            <div>
              <label className="block text-[9px] font-black uppercase text-[#72777f] mb-2">3. Estructura de Árbol (Jerarquía de Carpetas en Revit)</label>

              <div className="space-y-2 mb-3">
                {treeLayers.map((layer, index) => (
                  <div key={index} className="flex items-center gap-2 animate-in slide-in-from-left-2">
                    <div className="bg-[#1c1c19] text-white text-[8px] font-black px-2 py-1 flex-none">Nivel {index + 1}</div>
                    <select
                      value={layer}
                      onChange={e => {
                        const newLayers = [...treeLayers];
                        newLayers[index] = e.target.value;
                        setTreeLayers(newLayers);
                      }}
                      className="flex-1 p-2 border-2 border-[#1c1c19] font-black text-xs outline-none bg-[#f6f3ee]"
                    >
                      {fields.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                    </select>
                    <button
                      onClick={() => setTreeLayers(treeLayers.filter((_, i) => i !== index))}
                      className="p-2 border-2 border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ba1a1a] hover:text-white transition-all flex-none"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setTreeLayers([...treeLayers, fields[1].id])}
                className="w-full py-2 border-2 border-dashed border-[#1c1c19] text-[#1c1c19] font-black text-[9px] uppercase hover:bg-[#1c1c19] hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Plus size={12} /> AÑADIR NIVEL JERÁRQUICO
              </button>
            </div>
          </div>
        </div>
        <div className="p-4 border-t-4 border-[#1c1c19] bg-[#f6f3ee] flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 border-4 border-[#1c1c19] font-black text-[9px] hover:bg-[#e5e2dd]">CANCELAR</button>
          <button onClick={handleExport} className="px-6 py-2 bg-[#0f4369] text-white font-black text-[9px] hover:bg-[#1c1c19] flex items-center gap-2 shadow-[3px_3px_0_0_rgba(28,28,25,1)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] hover:translate-x-0 hover:translate-y-0 transition-all">
            <Download size={14} /> DESCARGAR .TXT
          </button>
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: AI MATERIAL IMPORT MODAL ---
// --- SUB-COMPONENT: AI MATERIAL IMPORT MODAL ---
function AiMaterialImportModal({ isOpen, onClose, onImport, singleMode = false }) {
  const [jsonInput, setJsonInput] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  if (!isOpen) return null;

  const handleCopyPrompt = () => {
    const masterPrompt = singleMode
      ? `Actúa como un experto en presupuestos y bases de datos de materiales de construcción. Genera un ÚNICO material de construcción estándar y realista.

ESTRUCTURA DEL OBJETO JSON (debes retornar un Arreglo con este único objeto y usar estos nombres de campos exactos):
- Nombre: (String, requerido) Nombre del material.
- categoria: (String) Categoría general (ej. "MAMPUESTERÍA", "PISOS Y ENCHAPES", "CEMENTOS Y AGREGADOS").
- tipo: (String) Tipo específico del material.
- unidad: (String) Unidad de medida, DEBE ser una de: "UND", "M2", "ML", "M3", "KG", "TON", "GL", "CJ", "BL", "PAQ", "PLN", "RLL".
- stock: (Number) Cantidad en stock.
- proveedor: (String) Nombre del proveedor recomendado.
- precio_COP: (Number) Precio unitario estimado en pesos colombianos (COP).
- precio_por_m2: (Number) Precio estimado por metro cuadrado (si aplica).
- precio_por_m_lineal: (Number) Precio estimado por metro lineal (si aplica).
- alto_mm: (Number) Alto en milímetros (si aplica).
- ancho_mm: (Number) Ancho en milímetros (si aplica).
- espesor_mm: (Number) Espesor en milímetros (si aplica).
- largo_m: (Number) Largo en metros (si aplica).
- area_mm2: (Number) Área en milímetros cuadrados (si aplica).
- peso_kg_m: (Number) Peso en kg/m (si aplica).
- acabado: (String) Acabado superficial (ej. "MATE", "PULIDO", "RÚSTICO").
- grado: (String) Grado o calidad (ej. "Grado A", "Grado 50").
- uso_recomendado: (String) Uso recomendado en obra.
- observaciones_tecnicas: (String) Especificaciones o detalles técnicos.
- notas: (String) Notas adicionales.
- foto_url: (String) URL de imagen ficticia u opcional.

REGLAS CRÍTICAS:
1. El output debe ser ÚNICAMENTE el JSON Array con 1 objeto adentro, sin texto adicional ni bloques de markdown (como \`\`\`json). Ejemplo: [{"Nombre":"Bloque de concreto","categoria":"MAMPUESTERÍA","unidad":"UND","stock":500,"precio_COP":2500}]`
      : `Actúa como un experto en presupuestos y bases de datos de materiales de construcción. Genera un conjunto variado y realista de materiales de construcción estándar (genera al menos 15 materiales diferentes que cubran categorías como agregados, mampostería, acabados, aceros, etc.).

ESTRUCTURA DE CADA OBJETO JSON (debes usar estos nombres de campos exactos):
- Nombre: (String, requerido) Nombre del material.
- categoria: (String) Categoría general (ej. "MAMPUESTERÍA", "PISOS Y ENCHAPES", "CEMENTOS Y AGREGADOS").
- tipo: (String) Tipo específico del material.
- unidad: (String) Unidad de medida, DEBE ser una de: "UND", "M2", "ML", "M3", "KG", "TON", "GL", "CJ", "BL", "PAQ", "PLN", "RLL".
- stock: (Number) Cantidad en stock.
- proveedor: (String) Nombre del proveedor recomendado.
- precio_COP: (Number) Precio unitario estimado en pesos colombianos (COP).
- precio_por_m2: (Number) Precio estimado por metro cuadrado (si aplica).
- precio_por_m_lineal: (Number) Precio estimado por metro lineal (si aplica).
- alto_mm: (Number) Alto en milímetros (si aplica).
- ancho_mm: (Number) Ancho en milímetros (si aplica).
- espesor_mm: (Number) Espesor en milímetros (si aplica).
- largo_m: (Number) Largo en metros (si aplica).
- area_mm2: (Number) Área en milímetros cuadrados (si aplica).
- peso_kg_m: (Number) Peso en kg/m (si aplica).
- acabado: (String) Acabado superficial (ej. "MATE", "PULIDO", "RÚSTICO").
- grado: (String) Grado o calidad (ej. "Grado A", "Grado 50").
- uso_recomendado: (String) Uso recomendado en obra.
- observaciones_tecnicas: (String) Especificaciones o detalles técnicos.
- notas: (String) Notas adicionales.
- foto_url: (String) URL de imagen ficticia u opcional.

REGLAS CRÍTICAS:
1. El output debe ser ÚNICAMENTE el JSON Array, sin texto adicional ni bloques de markdown (como \`\`\`json). Ejemplo: [{"Nombre":"Bloque de concreto","categoria":"MAMPUESTERÍA","unidad":"UND","stock":500,"precio_COP":2500}]`;

    navigator.clipboard.writeText(masterPrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleValidate = () => {
    setError(null);
    setPreviewData(null);
    try {
      let cleanJson = jsonInput.trim();
      if (cleanJson.startsWith('```json')) cleanJson = cleanJson.replace(/```json/g, '').trim();
      if (cleanJson.endsWith('```')) cleanJson = cleanJson.replace(/```/g, '').trim();

      const parsed = JSON.parse(cleanJson);

      if (!Array.isArray(parsed)) {
        throw new Error("El JSON debe ser un Arreglo (Array) de objetos.");
      }

      parsed.forEach((item, index) => {
        if (!item.Nombre) {
          throw new Error(`El elemento en el índice ${index} no contiene el campo 'Nombre'.`);
        }
      });

      setPreviewData(parsed);
    } catch (err) {
      setError("Error al parsear JSON. Detalles: " + err.message);
    }
  };

  const handleCreate = async () => {
    setIsImporting(true);
    try {
      await onImport(previewData);
      onClose();
    } catch (err) {
      setError("Error al importar: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#1c1c19]/90 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border-4 border-[#1c1c19] shadow-[20px_20px_0_0_rgba(28,28,25,1)] w-full max-w-3xl my-8 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b-4 border-[#1c1c19] bg-[#0f4369] text-white flex justify-between items-center flex-none">
          <div className="flex items-center gap-3">
            <Sparkles size={24} className="text-yellow-400" />
            <h3 className="text-xl font-black italic uppercase tracking-tighter">{singleMode ? 'ASISTENTE_MATERIAL_IA' : 'IMPORTADOR_MATERIALES_IA'}</h3>
          </div>
          <button onClick={onClose} className="text-white hover:rotate-90 transition-transform"><X size={24} /></button>
        </div>

        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-8 bg-white">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-[#1c1c19] pb-2">
              <span className="bg-[#1c1c19] text-white font-black text-xs px-2 py-1">PASO 1</span>
              <h4 className="text-sm font-black uppercase tracking-widest text-[#1c1c19]">Copiar Prompt de Estructura</h4>
            </div>

            <button
              onClick={handleCopyPrompt}
              className={`w-full py-3 border-2 font-display font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${copied ? 'bg-green-600 text-white border-green-800' : 'bg-[#1c1c19] text-white border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,0.2)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'}`}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'PROMPT COPIADO AL PORTAPAPELES' : 'COPIAR PROMPT DE ESTRUCTURA A IA'}
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-[#1c1c19] pb-2">
              <span className="bg-[#1c1c19] text-white font-black text-xs px-2 py-1">PASO 2</span>
              <h4 className="text-sm font-black uppercase tracking-widest text-[#1c1c19]">Pegar y Validar Resultado</h4>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#72777f]">Pega el JSON generado por la IA aquí:</label>
              <textarea
                value={jsonInput}
                onChange={e => { setJsonInput(e.target.value); setPreviewData(null); setError(null); }}
                placeholder="[ { ... } ]"
                className="w-full bg-[#1c1c19] text-green-400 font-mono border-2 border-[#1c1c19] p-4 text-[10px] focus:outline-none min-h-[150px] custom-scrollbar"
              />
            </div>

            {error && <div className="p-3 bg-red-100 text-red-700 text-xs font-bold uppercase border-l-4 border-red-500">{error}</div>}

            {!previewData ? (
              <button
                onClick={handleValidate}
                disabled={!jsonInput.trim()}
                className="w-full py-3 bg-[#f6f3ee] text-[#1c1c19] border-2 border-[#1c1c19] font-display font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#e5e2dd] disabled:opacity-50"
              >
                <Check size={16} /> VALIDAR JSON
              </button>
            ) : (
              <div className="bg-[#f6f3ee] border-2 border-[#1c1c19] p-4 space-y-3">
                <h5 className="text-[10px] font-black uppercase bg-[#1c1c19] text-white px-2 py-1 inline-block mb-2">VISTA_PREVIA ({previewData.length} {singleMode ? 'MATERIAL' : 'MATERIALES'})</h5>

                <div className="max-h-60 overflow-y-auto border border-[#1c1c19]/20 bg-white">
                  <table className="w-full text-left text-[9px] border-collapse">
                    <thead>
                      <tr className="bg-[#1c1c19] text-white">
                        <th className="p-1.5 border border-white/20">NOMBRE</th>
                        <th className="p-1.5 border border-white/20">CATEGORÍA</th>
                        <th className="p-1.5 border border-white/20">UNIDAD</th>
                        <th className="p-1.5 border border-white/20">PRECIO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((m, i) => (
                        <tr key={i} className="border-b border-[#1c1c19]/10">
                          <td className="p-1.5 font-bold">{m.Nombre}</td>
                          <td className="p-1.5">{m.categoria || '---'}</td>
                          <td className="p-1.5 font-mono">{m.unidad || 'UND'}</td>
                          <td className="p-1.5">{m.precio_COP ? `$${Number(m.precio_COP).toLocaleString('es-CO')}` : '---'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={handleCreate}
                  disabled={isImporting}
                  className="w-full mt-4 py-3 bg-[#0f4369] text-white border-2 border-[#1c1c19] font-display font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#1c1c19] transition-colors disabled:opacity-50"
                >
                  {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isImporting ? 'PROCESANDO...' : singleMode ? 'CONFIRMAR Y LLENAR FORMULARIO' : 'CONFIRMAR E IMPORTAR MATERIALES'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MAIN VIEW ---
const MaterialsView = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const { isBimManager, isAdmin } = useAuth();
  const canImport = isBimManager || isAdmin;

  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [localMaterials, setLocalMaterials] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'Nombre', direction: 'desc' });
  const [showColSettings, setShowColSettings] = useState(false);
  const [isKeynotesModalOpen, setIsKeynotesModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAiImportModalOpen, setIsAiImportModalOpen] = useState(false);
  const [togglingGlobalId, setTogglingGlobalId] = useState(null);

  // Vista admin global: sin projectId
  const isGlobalAdminView = !projectId;

  // REORDERED COLUMNS BASED ON USER REQUEST
  const allColumns = [
    { id: 'Nombre', label: 'NOMBRE' },
    { id: 'categoria', label: 'CATEGORÍA' },
    { id: 'tipo', label: 'TIPO' },
    { id: 'unidad', label: 'UNIDAD' },
    { id: 'alto_mm', label: 'ALTO' },
    { id: 'ancho_mm', label: 'ANCHO' },
    { id: 'largo_m', label: 'LARGO' },
    { id: 'area_mm2', label: 'AREA MM' },
    { id: 'espesor_mm', label: 'ESP' },
    { id: 'acabado', label: 'ACABADO' },
    { id: 'precio_COP', label: '$ COP' },
    { id: 'precio_por_m2', label: '$ M2' },
    { id: 'precio_por_m_lineal', label: '$ ML' },
    { id: 'peso_kg_m', label: 'KG M' },
    { id: 'grado', label: 'GRADO' },
    { id: 'uso_recomendado', label: 'USO' },
    { id: 'proveedor', label: 'PROVEEDOR' },
    { id: 'stock', label: 'STOCK' },
  ];

  const [visibleColumns, setVisibleColumns] = useState(new Set(allColumns.map(c => c.id)));

  useEffect(() => { loadData(); }, [projectId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, c] = await Promise.all([getMaterials(projectId), getMaterialCategories()]);
      setMaterials(m || []);
      setLocalMaterials(m || []);
      setCategories(c || []);
      setSelectedIds(new Set());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const toggleColumn = (id) => {
    const newSet = new Set(visibleColumns);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setVisibleColumns(newSet);
  };

  const handleInputChange = (id, field, value) => {
    setLocalMaterials(prev => prev.map(m => (m.id || m.Nombre) === id ? { ...m, [field]: value } : m));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const changed = localMaterials.filter(local => {
        const original = materials.find(m => (m.id || m.Nombre) === (local.id || local.Nombre));
        return JSON.stringify(local) !== JSON.stringify(original);
      });
      await Promise.all(changed.map(m => updateMaterial(m.id || m.Nombre, m)));
      setMaterials([...localMaterials]);
      setIsEditMode(false);
      alert("Cambios guardados.");
    } catch (err) { alert("Error al guardar."); }
    finally { setIsSaving(false); }
  };

  const dataToProcess = isEditMode ? localMaterials : materials;

  const processedMaterials = dataToProcess
    .filter(m => {
      const s = searchTerm.toLowerCase();
      return (m.Nombre || '').toLowerCase().includes(s) || (m.proveedor || '').toLowerCase().includes(s);
    })
    .filter(m => selectedCategory === 'all' || m.categoria === selectedCategory)
    .sort((a, b) => {
      const valA = (a[sortConfig.key] || '').toString().toLowerCase();
      const valB = (b[sortConfig.key] || '').toString().toLowerCase();
      const numA = parseFloat(valA.replace(/[$,]/g, ''));
      const numB = parseFloat(valB.replace(/[$,]/g, ''));
      if (!isNaN(numA) && !isNaN(numB)) return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllToggle = () => {
    const allProcessedIds = processedMaterials.map(m => m.id || m.Nombre);
    const areAllSelected = allProcessedIds.length > 0 && allProcessedIds.every(id => selectedIds.has(id));

    setSelectedIds(prev => {
      const next = new Set(prev);
      if (areAllSelected) {
        allProcessedIds.forEach(id => next.delete(id));
      } else {
        allProcessedIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    // Bloquear eliminación de materiales globales para no-admins
    const selectedMats = materials.filter(m => selectedIds.has(m.id || m.Nombre));
    const hasGlobal = selectedMats.some(m => m.globalMaterial);
    if (hasGlobal && !isAdmin) {
      alert("No puedes eliminar materiales globales. Solo el administrador puede hacerlo.");
      return;
    }

    const key = window.prompt("Ingrese la clave de BIM Manager para confirmar la eliminación:");
    if (key !== "123123") {
      alert("Clave incorrecta. No tiene permisos para eliminar materiales.");
      return;
    }

    if (window.confirm(`¿Estás seguro de que deseas eliminar ${selectedIds.size} material(es)?`)) {
      setIsDeleting(true);
      try {
        await Promise.all(Array.from(selectedIds).map(id => deleteMaterial(id)));
        setSelectedIds(new Set());
        await loadData();
        alert("Materiales eliminados correctamente.");
      } catch (err) {
        alert("Error al eliminar los materiales.");
        console.error(err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleToggleGlobal = async (material) => {
    if (!isAdmin) return;
    setTogglingGlobalId(material.id);
    try {
      const updated = await toggleGlobalMaterial(material.id, material.globalMaterial);
      setMaterials(prev => prev.map(m => m.id === updated.id ? { ...m, globalMaterial: updated.globalMaterial } : m));
      setLocalMaterials(prev => prev.map(m => m.id === updated.id ? { ...m, globalMaterial: updated.globalMaterial } : m));
    } catch (err) {
      alert('Error al cambiar estado global del material.');
    } finally {
      setTogglingGlobalId(null);
    }
  };

  const handleAiImport = async (data) => {
    if (!data || !Array.isArray(data)) return;
    try {
      await createMaterialsBatch(data);
      alert("Materiales importados con éxito.");
      await loadData();
    } catch (err) {
      alert("Error al importar los materiales.");
      console.error(err);
      throw err;
    }
  };

  const Th = ({ label, field, align = 'left' }) => (
    <th onClick={() => field && handleSort(field)} className={`p-2 text-${align} text-[7px] font-black uppercase tracking-widest border border-white/20 bg-[#1c1c19] text-white whitespace-nowrap sticky top-0 z-20 ${field ? 'cursor-pointer hover:bg-[#0f4369]' : ''}`}>
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : ''}`}>
        {label} {field && <ArrowUpDown size={6} className={sortConfig.key === field ? 'text-red-500' : 'opacity-30'} />}
      </div>
    </th>
  );

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden font-mono relative">
      {/* Header */}
      <div className="p-3 border-b-4 border-[#1c1c19] bg-white flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-black italic uppercase tracking-tighter">MATERIALES_DATABASE</h2>
          <div className="relative">
            <button onClick={() => setShowColSettings(!showColSettings)} className="p-1.5 border-2 border-[#1c1c19] hover:bg-[#f6f3ee] transition-all"><Settings size={14} /></button>
            {showColSettings && (
              <div className="absolute top-full left-0 mt-2 z-[60] bg-white border-4 border-[#1c1c19] shadow-[8px_8px_0_0_rgba(0,0,0,1)] w-56 max-h-96 overflow-y-auto p-2">
                <div className="text-[8px] font-black uppercase mb-2 border-b-2 border-[#1c1c19] pb-1">COLUMNAS_VISIBLES</div>
                {allColumns.map(col => (
                  <label key={col.id} className="flex items-center gap-2 p-1 hover:bg-[#f6f3ee] cursor-pointer group">
                    <div className={`w-3 h-3 border-2 border-[#1c1c19] flex items-center justify-center ${visibleColumns.has(col.id) ? 'bg-[#1c1c19]' : ''}`}>
                      {visibleColumns.has(col.id) && <Check size={8} className="text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={visibleColumns.has(col.id)} onChange={() => toggleColumn(col.id)} />
                    <span className="text-[9px] font-bold uppercase">{col.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 items-center">
          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="px-5 py-1.5 bg-[#ba1a1a] text-white font-black text-[9px] uppercase italic border-2 border-[#1c1c19] hover:bg-[#93000a] transition-all flex items-center gap-2 shadow-[3px_3px_0_0_rgba(28,28,25,1)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] hover:translate-x-0 hover:translate-y-0"
            >
              {isDeleting ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
              ELIMINAR ({selectedIds.size})
            </button>
          )}
          <button onClick={() => { if (isEditMode) handleSaveChanges(); else setIsEditMode(true); }} disabled={isSaving} className={`px-6 py-1.5 font-black text-[10px] uppercase italic border-4 transition-all flex items-center gap-2 ${isEditMode ? 'bg-red-600 text-white border-red-800 animate-pulse' : 'bg-white text-red-600 border-red-600 shadow-[4px_4px_0_0_rgba(220,38,38,1)] hover:shadow-none'}`}>
            {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Edit3 size={12} />}
            {isEditMode ? 'GUARDAR_CAMBIOS' : 'EDIT TABLE'}
          </button>
          {isEditMode && <button onClick={() => { setIsEditMode(false); setLocalMaterials([...materials]); }} className="px-4 py-1.5 border-4 border-[#1c1c19] text-[10px] font-black uppercase bg-[#f6f3ee]">CANCELAR</button>}
          <div className="w-px h-8 bg-[#1c1c19]/10 mx-2"></div>
          <input type="text" placeholder="BUSCAR..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-4 py-1.5 border-2 border-[#1c1c19] text-[9px] font-black uppercase outline-none w-48" />
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="px-4 py-1.5 border-2 border-[#1c1c19] text-[9px] font-black uppercase outline-none bg-white">
            <option value="all">CATEGORIAS</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {canImport && (
            <button
              onClick={() => setIsAiImportModalOpen(true)}
              className="px-5 py-1.5 bg-[#0f4369] text-white font-black text-[9px] uppercase italic border-2 border-[#1c1c19] hover:bg-[#1c1c19] transition-all flex items-center gap-2 shadow-[3px_3px_0_0_rgba(28,28,25,1)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] hover:translate-x-0 hover:translate-y-0"
            >
              <Sparkles size={10} className="text-yellow-400" /> IMPORTADOR IA
            </button>
          )}
          <button onClick={() => setIsKeynotesModalOpen(true)} className="px-5 py-1.5 bg-[#f6f3ee] text-[#1c1c19] font-black text-[9px] uppercase italic border-2 border-[#1c1c19] hover:bg-[#e5e2dd] transition-all flex items-center gap-2">
            <Download size={10} /> KEYNOTES
          </button>
          <button onClick={() => { setSelectedMaterial(null); setIsModalOpen(true); }} className="px-5 py-1.5 bg-[#1c1c19] text-white font-black text-[9px] uppercase italic border-2 border-[#1c1c19] shadow-[3px_3px_0_0_rgba(15,67,105,1)] hover:shadow-none transition-all">NUEVO</button>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 border border-white/20 bg-[#1c1c19] text-white w-10 text-center sticky top-0 z-20">
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={processedMaterials.length > 0 && processedMaterials.every(m => selectedIds.has(m.id || m.Nombre))}
                    onChange={handleSelectAllToggle}
                    className="w-3.5 h-3.5 cursor-pointer accent-[#1c1c19]"
                  />
                </div>
              </th>
              {/* Columna GLOBAL solo visible en vista admin sin projectId */}
              {isGlobalAdminView && isAdmin && (
                <th className="p-2 border border-white/20 bg-[#0f4369] text-white w-20 text-center sticky top-0 z-20">
                  <div className="flex items-center justify-center gap-1">
                    <Globe size={8} className="text-yellow-400" />
                    <span className="text-[7px] font-black uppercase tracking-widest">GLOBAL</span>
                  </div>
                </th>
              )}
              {allColumns.filter(c => visibleColumns.has(c.id)).map(col => (
                <Th key={col.id} label={col.label} field={col.id} align={isPriceField(col.id) ? 'right' : 'left'} />
              ))}
              {!isEditMode && <Th label="EDIT" />}
            </tr>
          </thead>
          <tbody>
            {processedMaterials.map((m) => {
              const isGlobal = !!m.globalMaterial;
              const canEditRow = isAdmin || (!isGlobal && (isBimManager || true));
              const isToggling = togglingGlobalId === m.id;
              return (
                <tr
                  key={m.id || m.Nombre}
                  className={`hover:bg-[#0f4369]/5 border-b border-[#1c1c19]/10 group ${isGlobal
                    ? 'bg-[#0f4369]/5 border-l-4 border-l-[#0f4369]'
                    : 'bg-white'
                    }`}
                >
                  <td className="p-1 text-center border border-[#1c1c19]/10 w-10">
                    <div className="flex items-center justify-center">
                      {/* No permitir seleccionar globales si no es admin */}
                      {(!isGlobal || isAdmin) && (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(m.id || m.Nombre)}
                          onChange={() => toggleSelect(m.id || m.Nombre)}
                          className="w-3.5 h-3.5 cursor-pointer accent-[#1c1c19]"
                        />
                      )}
                    </div>
                  </td>
                  {/* Celda GLOBAL con switch - solo admin en vista global */}
                  {isGlobalAdminView && isAdmin && (
                    <td className="p-1 text-center border border-[#1c1c19]/10">
                      <div className="flex items-center justify-center">
                        {isToggling ? (
                          <Loader2 size={12} className="animate-spin text-[#0f4369]" />
                        ) : (
                          <button
                            onClick={() => handleToggleGlobal(m)}
                            title={isGlobal ? 'Desactivar material global' : 'Activar como material global'}
                            className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none ${isGlobal
                              ? 'bg-[#0f4369] border-[#0f4369]'
                              : 'bg-gray-200 border-gray-300'
                              }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-2.5 w-2.5 mt-[1px] rounded-full bg-white shadow transform transition duration-200 ease-in-out ${isGlobal ? 'translate-x-3.5' : 'translate-x-0.5'
                                }`}
                            />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                  {/* Badge GLOBAL en la columna Nombre cuando se visualiza desde proyecto */}
                  {allColumns.filter(c => visibleColumns.has(c.id)).map(col => (
                    <td key={col.id} className={`p-1 border border-[#1c1c19]/10 ${isEditMode && canEditRow ? 'bg-[#fcf9f4]' : ''
                      } ${isGlobal && col.id === 'Nombre' ? 'relative' : ''}`}>
                      {isEditMode && canEditRow ? (
                        col.id === 'unidad' ? (
                          <select value={m[col.id] || 'UND'} onChange={(e) => handleInputChange(m.id || m.Nombre, col.id, e.target.value)} className="w-full bg-transparent p-1 text-[8px] font-black outline-none border border-[#1c1c19]/30 focus:border-[#0f4369]">
                            {CONSTRUCTION_UNITS.map(u => <option key={u} value={u}>{UNIT_LABELS[u]}</option>)}
                          </select>
                        ) : (
                          <input type="text" value={m[col.id] || ''} onChange={(e) => handleInputChange(m.id || m.Nombre, col.id, e.target.value)} className="w-full bg-transparent p-1 text-[8px] font-black outline-none border border-transparent focus:border-[#0f4369]" />
                        )
                      ) : (
                        <span title={col.id === 'unidad' ? UNIT_LABELS[m[col.id]] : undefined} className={`flex items-center gap-1 p-1 text-[8px] relative ${col.id === 'Nombre' ? 'font-black' : 'font-bold'} ${isPriceField(col.id) ? 'text-right text-[#0f4369] block' : ''}`}>
                          {isPriceField(col.id) ? formatCurrency(m[col.id]) : (m[col.id] || '---')}
                          {col.id === 'Nombre' && isGlobal && (
                            <span className="inline-flex items-center gap-0.5 ml-1 px-1 py-0 bg-[#0f4369] text-white text-[6px] font-black uppercase rounded-sm shrink-0">
                              <Globe size={5} /> GLOBAL
                            </span>
                          )}
                          {col.id === 'unidad' && m[col.id] && (
                            <div className="absolute left-full top-0 ml-2 z-50 bg-[#1c1c19] text-white text-[7px] px-2 py-1 hidden group-:block whitespace-nowrap shadow-[4px_4px_0_0_rgba(15,67,105,1)] border border-white/20">
                              {UNIT_LABELS[m[col.id]]}
                            </div>
                          )}
                        </span>
                      )}
                    </td>
                  ))}
                  {!isEditMode && (
                    <td className="p-1 text-center border border-[#1c1c19]/10">
                      {canEditRow ? (
                        <button onClick={() => { setSelectedMaterial(m); setIsModalOpen(true); }} className="p-1 border border-[#1c1c19] hover:bg-[#1c1c19] hover:text-white transition-all">
                          <Edit size={10} />
                        </button>
                      ) : (
                        <span title="Material global: solo editable por admin" className="p-1 text-[#0f4369] opacity-40">
                          <Lock size={10} />
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <MaterialModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} material={selectedMaterial} onSave={() => loadData()} />
      <KeynotesModal isOpen={isKeynotesModalOpen} onClose={() => setIsKeynotesModalOpen(false)} materials={processedMaterials} />
      <AiMaterialImportModal isOpen={isAiImportModalOpen} onClose={() => setIsAiImportModalOpen(false)} onImport={handleAiImport} />
    </div>
  );
};

export default MaterialsView;
