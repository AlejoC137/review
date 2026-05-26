import React, { useState, useEffect } from 'react';
import {
  Package, Search, DollarSign, Building2, Edit,
  Loader2, X, Save, AlertCircle, Plus, Filter, ChevronRight, ArrowUpDown,
  Ruler, Weight, Tag, Clock, Trash2, Camera, ExternalLink, Info, Database, Eye, Edit3, Settings, Check, Download
} from 'lucide-react';
import { getMaterials, getMaterialCategories, updateMaterial, createMaterial, deleteMaterial } from '../services/materialsService';



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
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 bg-[#1c1c19]/90 backdrop-blur-sm">
      <div className="bg-white border-4 border-[#1c1c19] w-full max-w-5xl shadow-[20px_20px_0_0_rgba(28,28,25,1)] flex flex-col max-h-[95vh]">
        <div className="flex justify-between items-center p-4 border-b-4 border-[#1c1c19] bg-[#f6f3ee]">
          <h3 className="text-sm font-black italic uppercase tracking-tighter">{material ? 'EDITAR_MATERIAL' : 'NUEVO_MATERIAL'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-[#1c1c19] hover:text-white border-2 border-transparent hover:border-[#1c1c19]">
            <X size={20} />
          </button>
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

// --- MAIN VIEW ---
const MaterialsView = () => {
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

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, c] = await Promise.all([getMaterials(), getMaterialCategories()]);
      setMaterials(m || []);
      setLocalMaterials(m || []);
      setCategories(c || []);
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
    setLocalMaterials(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const changed = localMaterials.filter(local => {
        const original = materials.find(m => m.id === local.id);
        return JSON.stringify(local) !== JSON.stringify(original);
      });
      await Promise.all(changed.map(m => updateMaterial(m.id, m)));
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
              {allColumns.filter(c => visibleColumns.has(c.id)).map(col => (
                <Th key={col.id} label={col.label} field={col.id} align={isPriceField(col.id) ? 'right' : 'left'} />
              ))}
              {!isEditMode && <Th label="EDIT" />}
            </tr>
          </thead>
          <tbody>
            {processedMaterials.map((m) => (
              <tr key={m.id} className="hover:bg-[#0f4369]/5 bg-white border-b border-[#1c1c19]/10 group">
                {allColumns.filter(c => visibleColumns.has(c.id)).map(col => (
                  <td key={col.id} className={`p-1 border border-[#1c1c19]/10 ${isEditMode ? 'bg-[#fcf9f4]' : ''}`}>
                    {isEditMode ? (
                      col.id === 'unidad' ? (
                        <select value={m[col.id] || 'UND'} onChange={(e) => handleInputChange(m.id, col.id, e.target.value)} className="w-full bg-transparent p-1 text-[8px] font-black outline-none border border-[#1c1c19]/30 focus:border-[#0f4369]">
                          {CONSTRUCTION_UNITS.map(u => <option key={u} value={u}>{UNIT_LABELS[u]}</option>)}
                        </select>
                      ) : (
                        <input type="text" value={m[col.id] || ''} onChange={(e) => handleInputChange(m.id, col.id, e.target.value)} className="w-full bg-transparent p-1 text-[8px] font-black outline-none border border-transparent focus:border-[#0f4369]" />
                      )
                    ) : (
                      <span title={col.id === 'unidad' ? UNIT_LABELS[m[col.id]] : undefined} className={`block p-1 text-[8px] relative ${col.id === 'Nombre' ? 'font-black' : 'font-bold'} ${isPriceField(col.id) ? 'text-right text-[#0f4369]' : ''}`}>
                        {isPriceField(col.id) ? formatCurrency(m[col.id]) : (m[col.id] || '---')}
                        {col.id === 'unidad' && m[col.id] && (
                          <div className="absolute left-full top-0 ml-2 z-50 bg-[#1c1c19] text-white text-[7px] px-2 py-1 hidden group-hover:block whitespace-nowrap shadow-[4px_4px_0_0_rgba(15,67,105,1)] border border-white/20">
                            {UNIT_LABELS[m[col.id]]}
                          </div>
                        )}
                      </span>
                    )}
                  </td>
                ))}
                {!isEditMode && (
                  <td className="p-1 text-center border border-[#1c1c19]/10">
                    <button onClick={() => { setSelectedMaterial(m); setIsModalOpen(true); }} className="p-1 border border-[#1c1c19] hover:bg-[#1c1c19] hover:text-white transition-all"><Edit size={10} /></button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <MaterialModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} material={selectedMaterial} onSave={() => loadData()} />
      <KeynotesModal isOpen={isKeynotesModalOpen} onClose={() => setIsKeynotesModalOpen(false)} materials={processedMaterials} />
    </div>
  );
};

export default MaterialsView;
