import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { Plus, Edit, Trash2, X, Image as ImageIcon, CreditCard, LayoutTemplate, QrCode, FileText, Check, Save, Move, Type, AlignLeft, AlignCenter, AlignRight, AlignJustify, Wrench, Sparkles, Zap, Lock, Unlock, ArrowUp, ArrowDown, Layers } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import AiMarketingFillModal from '../components/project/AiMarketingFillModal';
import EvidenceUploader from '../components/common/EvidenceUploader';

const TYPE_ICONS = {
  tarjeta: CreditCard,
  volante: LayoutTemplate,
  qr_poster: QrCode,
};

const generateId = () => Math.random().toString(36).substr(2, 9);

const getTemplate = (type) => {
  const t = {
    tarjeta: { 
      width_cm: "8.5", height_cm: "5.5",
      sides: {
        A: {
          bg_color: "#ffffff", bg_image: "", bg_size: "cover",
          elements: [
            { id: generateId(), type: "text", content: "Review", x: 20, y: 30, width: 200, height: 30, fontSize: 16, fontWeight: "900", color: "#1c1c19", textAlign: "left" },
            { id: generateId(), type: "text", content: "Transformando la gestión y coordinación.", x: 20, y: 60, width: 200, height: 40, fontSize: 10, fontWeight: "700", color: "#0f4369", textAlign: "left" },
            { id: generateId(), type: "text", content: "admin@review.com", x: 20, y: 160, width: 120, height: 20, fontSize: 9, fontWeight: "400", color: "#1c1c19", textAlign: "left", fontFamily: "monospace" },
            { id: generateId(), type: "text", content: "www.review.com", x: 180, y: 160, width: 120, height: 20, fontSize: 9, fontWeight: "400", color: "#1c1c19", textAlign: "right", fontFamily: "monospace" }
          ]
        },
        B: {
          bg_color: "#0f4369", bg_image: "", bg_size: "cover",
          elements: [
            { id: generateId(), type: "text", content: "Conectemos", x: 60, y: 70, width: 200, height: 30, fontSize: 16, fontWeight: "900", color: "#ffffff", textAlign: "center" },
            { id: generateId(), type: "text", content: "Soluciones BIM Avanzadas", x: 60, y: 100, width: 200, height: 20, fontSize: 10, fontWeight: "400", color: "#ffffff", textAlign: "center", fontFamily: "monospace" }
          ]
        }
      }
    },
    volante: { 
      width_cm: "10", height_cm: "15",
      sides: {
        A: {
          bg_color: "#f6f3ee", bg_image: "", bg_size: "cover",
          elements: [
            { id: generateId(), type: "text", content: "Descubre el futuro", x: 20, y: 100, width: 340, height: 40, fontSize: 24, fontWeight: "900", color: "#1c1c19", textAlign: "center" },
            { id: generateId(), type: "text", content: "Gestiona proyectos BIM como nunca antes.", x: 20, y: 140, width: 340, height: 40, fontSize: 10, fontWeight: "400", color: "#1c1c19", textAlign: "center" }
          ]
        },
        B: {
          bg_color: "#ffffff", bg_image: "", bg_size: "cover",
          elements: [
            { id: generateId(), type: "text", content: "Nuestros Servicios", x: 20, y: 40, width: 340, height: 40, fontSize: 24, fontWeight: "900", color: "#1c1c19", textAlign: "left" },
            { id: generateId(), type: "text", content: "1. Planner\n2. Esquemas\n3. Materiales", x: 20, y: 80, width: 340, height: 100, fontSize: 10, fontWeight: "400", color: "#1c1c19", textAlign: "left" }
          ]
        }
      }
    },
    qr_poster: { 
      width_cm: "15", height_cm: "20",
      sides: {
        A: {
          bg_color: "#ffffff", bg_image: "", bg_size: "cover",
          elements: [
            { id: generateId(), type: "text", content: "Síguenos en IG", x: 50, y: 50, width: 460, height: 40, fontSize: 16, fontWeight: "900", color: "#1c1c19", textAlign: "center" },
            { id: generateId(), type: "text", content: "@review_app", x: 50, y: 400, width: 460, height: 40, fontSize: 10, fontWeight: "700", color: "#0f4369", textAlign: "center", fontFamily: "monospace" }
          ]
        },
        B: {
          bg_color: "#1c1c19", bg_image: "", bg_size: "cover",
          elements: [
            { id: generateId(), type: "text", content: "Visita nuestra Web", x: 50, y: 200, width: 460, height: 40, fontSize: 16, fontWeight: "900", color: "#ffffff", textAlign: "center" },
            { id: generateId(), type: "text", content: "www.review.com", x: 50, y: 250, width: 460, height: 40, fontSize: 12, fontWeight: "700", color: "#ffffff", textAlign: "center", fontFamily: "monospace" }
          ]
        }
      }
    }
  };
  return t[type];
};

const CanvasZoomWrapper = ({ item, children, zooms, setZooms }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e) => {
      e.preventDefault();
      const zoomSpeed = 0.05;
      const direction = e.deltaY > 0 ? -1 : 1;
      setZooms(prev => {
        const currentZoom = prev[item.id] || 1;
        return { ...prev, [item.id]: Math.min(Math.max(0.2, currentZoom + direction * zoomSpeed), 5) };
      });
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [item.id, setZooms]);

  const currentZoom = zooms[item.id] || 1;

  return (
    <div ref={containerRef} className="flex-1 flex justify-center items-center w-full h-full overflow-hidden relative" title="Usa el scroll para hacer zoom">
      <div 
        className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded font-mono z-50 pointer-events-none"
      >
        Zoom: {Math.round(currentZoom * 100)}%
      </div>
      <div style={{ transform: `scale(${currentZoom})`, transformOrigin: 'center', transition: 'transform 0.05s ease-out' }}>
        {children}
      </div>
    </div>
  );
};

export default function AdminPresentationCard() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSides, setActiveSides] = useState({}); // { [id]: 'A' | 'B' }
  const [zooms, setZooms] = useState({}); // { [id]: number }
  
  // Inline Edit State
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState(null);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [draggingElement, setDraggingElement] = useState(null); // { id, startX, startY, startMouseX, startMouseY }
  const [resizingElement, setResizingElement] = useState(null); // { id, side, startWidth, startHeight, startMouseX, startMouseY }
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('marketing_materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Migrate old data on the fly
      const migrated = (data || []).map(m => {
        if (!m.data.sides) {
          // It's using old data schema, migrate it to generic
          const old = m.data;
          m.data = {
            width_cm: old.width_cm || "8.5",
            height_cm: old.height_cm || "5.5",
            sides: {
              A: {
                bg_color: old.a_bg_color || "#ffffff", bg_image: "", bg_size: "cover",
                elements: [
                  { id: generateId(), type: "text", content: old.a_title || "Título", x: 20, y: 20, width: 250, height: 30, fontSize: 16, fontWeight: "900", color: "#1c1c19", textAlign: "left" },
                  { id: generateId(), type: "text", content: old.a_subtitle || "Subtítulo", x: 20, y: 55, width: 250, height: 30, fontSize: 10, fontWeight: "700", color: "#0f4369", textAlign: "left" }
                ]
              },
              B: {
                bg_color: old.b_bg_color || "#0f4369", bg_image: "", bg_size: "cover",
                elements: [
                  { id: generateId(), type: "text", content: old.b_title || "Reverso", x: 20, y: 50, width: 250, height: 30, fontSize: 16, fontWeight: "900", color: "#ffffff", textAlign: "center" }
                ]
              }
            }
          };
        }
        return m;
      });

      setMaterials(migrated);
    } catch (err) {
      console.error("Error fetching materials:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSide = (id, side) => {
    setActiveSides(prev => ({ ...prev, [id]: side }));
    setSelectedElementId(null);
  };

  const startCreating = async (type) => {
    try {
      const newMaterial = {
        title: `Nuevo ${type}`,
        type: type,
        data: getTemplate(type)
      };
      
      const { data, error } = await supabase
        .from('marketing_materials')
        .insert([newMaterial])
        .select();

      if (error) throw error;
      
      if (data && data.length > 0) {
        setMaterials([data[0], ...materials]);
        startEditing(data[0]);
      }
    } catch (err) {
      console.error("Error creating material:", err);
      alert("Error al crear el material");
    }
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    // Deep clone data to avoid mutations affecting original state
    setEditingData({ title: item.title, data: JSON.parse(JSON.stringify(item.data)) });
    setSelectedElementId(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingData(null);
    setSelectedElementId(null);
  };

  const updateEditingDataRoot = (key, value) => {
    setEditingData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [key]: value
      }
    }));
  };

  const updateSideData = (side, key, value) => {
    setEditingData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        sides: {
          ...prev.data.sides,
          [side]: {
            ...prev.data.sides[side],
            [key]: value
          }
        }
      }
    }));
  };

  const updateElement = (side, elementId, changes) => {
    setEditingData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        sides: {
          ...prev.data.sides,
          [side]: {
            ...prev.data.sides[side],
            elements: prev.data.sides[side].elements.map(el => 
              el.id === elementId ? { ...el, ...changes } : el
            )
          }
        }
      }
    }));
  };

  const addElement = (side, type = 'text') => {
    const newElement = {
      id: generateId(),
      type: type,
      x: 50,
      y: 50,
      width: 150,
      zIndex: 10,
      locked: false,
      ...(type === 'text' ? {
        height: 30,
        content: "Nuevo Texto",
        fontSize: 12,
        fontWeight: "normal",
        color: "#1c1c19",
        textAlign: "left",
        fontFamily: "sans-serif"
      } : {
        height: 150,
        imageUrl: "https://via.placeholder.com/150",
        objectFit: "contain"
      })
    };
    
    setEditingData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        sides: {
          ...prev.data.sides,
          [side]: {
            ...prev.data.sides[side],
            elements: [...prev.data.sides[side].elements, newElement]
          }
        }
      }
    }));
    setSelectedElementId(newElement.id);
  };

  const removeElement = (side, elementId) => {
    setEditingData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        sides: {
          ...prev.data.sides,
          [side]: {
            ...prev.data.sides[side],
            elements: prev.data.sides[side].elements.filter(el => el.id !== elementId)
          }
        }
      }
    }));
    if (selectedElementId === elementId) setSelectedElementId(null);
  };

  const updateEditingTitle = (title) => {
    setEditingData(prev => ({ ...prev, title }));
  };

  const saveEditing = async (item) => {
    try {
      const { error } = await supabase
        .from('marketing_materials')
        .update({
          title: editingData.title,
          data: editingData.data,
          updated_at: new Date()
        })
        .eq('id', item.id);

      if (error) throw error;
      
      setMaterials(materials.map(m => m.id === item.id ? { ...m, title: editingData.title, data: editingData.data } : m));
      setEditingId(null);
      setEditingData(null);
      setSelectedElementId(null);
    } catch (err) {
      console.error("Error saving material:", err);
      alert("Error al guardar el material");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este material?")) return;
    try {
      const { error } = await supabase
        .from('marketing_materials')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setMaterials(materials.filter(m => m.id !== id));
      if (editingId === id) cancelEditing();
    } catch (err) {
      console.error("Error deleting material:", err);
      alert("Error al eliminar");
    }
  };

  const exportNodeToJPG = async (node, filename) => {
    try {
      const parent = node.parentElement;
      const originalStyle = parent.style.cssText;
      
      // Mover a la vista (pero detrás del fondo) para que el navegador recalcule el layout perfectamente
      parent.style.cssText = 'position: absolute; top: 0; left: 0; z-index: -9999; opacity: 1; visibility: visible; pointer-events: none;';
      await new Promise(r => setTimeout(r, 100)); // dar tiempo al render

      const target = node.firstElementChild || node;
      const canvas = await html2canvas(target, { 
        scale: 3, 
        useCORS: true, 
        backgroundColor: null
      });
      
      // Restaurar
      parent.style.cssText = originalStyle;

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${filename}.jpg`;
      link.click();
    } catch (err) {
      console.error('Error exporting JPG:', err);
    }
  };

  const handleDownloadJPG = async (id, title) => {
    const nodeA = document.getElementById(`export-node-A-${id}`);
    if (nodeA) await exportNodeToJPG(nodeA, `${title.replace(/\s+/g, '_')}_Lado_A`);
    
    setTimeout(async () => {
      const nodeB = document.getElementById(`export-node-B-${id}`);
      if (nodeB) await exportNodeToJPG(nodeB, `${title.replace(/\s+/g, '_')}_Lado_B`);
    }, 500);
  };

  const handleDownloadPDF = async (id, title) => {
    const nodeA = document.getElementById(`export-node-A-${id}`);
    const nodeB = document.getElementById(`export-node-B-${id}`);
    if (!nodeA) return;
    
    const parent = nodeA.parentElement;
    const originalStyle = parent.style.cssText;
    
    try {
      // Mover a la vista (pero detrás del fondo) para que el navegador recalcule el layout perfectamente
      parent.style.cssText = 'position: absolute; top: 0; left: 0; z-index: -9999; opacity: 1; visibility: visible; pointer-events: none;';
      await new Promise(r => setTimeout(r, 100)); // dar tiempo al render

      const targetA = nodeA.firstElementChild || nodeA;
      const canvasA = await html2canvas(targetA, { 
        scale: 3, 
        useCORS: true, 
        backgroundColor: null
      });
      const imgDataA = canvasA.toDataURL('image/jpeg', 0.95);
      
      const pdf = new jsPDF({
        orientation: canvasA.width > canvasA.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvasA.width, canvasA.height]
      });
      pdf.addImage(imgDataA, 'JPEG', 0, 0, canvasA.width, canvasA.height);
      
      if (nodeB) {
        const targetB = nodeB.firstElementChild || nodeB;
        const canvasB = await html2canvas(targetB, { 
          scale: 3, 
          useCORS: true, 
          backgroundColor: null
        });
        const imgDataB = canvasB.toDataURL('image/jpeg', 0.95);
        pdf.addPage([canvasB.width, canvasB.height], canvasB.width > canvasB.height ? 'landscape' : 'portrait');
        pdf.addImage(imgDataB, 'JPEG', 0, 0, canvasB.width, canvasB.height);
      }
      
      pdf.save(`${title.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Error exporting PDF:', err);
    } finally {
      parent.style.cssText = originalStyle;
    }
  };

  // Drag and Drop Mouse Handlers
  const handleMouseDown = (e, element, side) => {
    if (!editingId) return;
    e.stopPropagation();
    setSelectedElementId(element.id);
    
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    // Convert screen coordinates to canvas-relative coordinates
    setDraggingElement({
      id: element.id,
      side: side,
      startX: element.x,
      startY: element.y,
      startMouseX: e.clientX,
      startMouseY: e.clientY
    });
  };

  const handleResizeMouseDown = (e, element, side) => {
    if (!editingId) return;
    e.stopPropagation();
    setSelectedElementId(element.id);
    
    setResizingElement({
      id: element.id,
      side: side,
      startWidth: element.width || 150,
      startHeight: element.height || 30,
      startMouseX: e.clientX,
      startMouseY: e.clientY
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      const currentZoom = zooms[editingId] || 1;
      if (draggingElement) {
        const dx = (e.clientX - draggingElement.startMouseX) / currentZoom;
        const dy = (e.clientY - draggingElement.startMouseY) / currentZoom;
        updateElement(draggingElement.side, draggingElement.id, {
          x: draggingElement.startX + dx,
          y: draggingElement.startY + dy
        });
      } else if (resizingElement) {
        const dx = (e.clientX - resizingElement.startMouseX) / currentZoom;
        const dy = (e.clientY - resizingElement.startMouseY) / currentZoom;
        updateElement(resizingElement.side, resizingElement.id, {
          width: Math.max(20, resizingElement.startWidth + dx),
          height: Math.max(20, resizingElement.startHeight + dy)
        });
      }
    };

    const handleMouseUp = () => {
      setDraggingElement(null);
      setResizingElement(null);
    };

    if (draggingElement || resizingElement) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingElement, resizingElement, zooms, editingId]);

  const renderSideContent = (type, data, side, isEditing) => {
    const sideData = data.sides[side];
    // Forzamos conversión a píxeles exactos (1cm = ~37.795px) para evitar bugs de html2canvas con medidas relativas
    const w = data.width_cm ? `${parseFloat(data.width_cm) * 37.795275591}px` : '100%';
    const h = data.height_cm ? `${parseFloat(data.height_cm) * 37.795275591}px` : 'auto';

    return (
      <div 
        ref={isEditing ? canvasRef : null}
        className="relative overflow-hidden shrink-0 border border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,1)]"
        style={{ 
          width: w, 
          height: h, 
          backgroundColor: sideData.bg_color,
          backgroundImage: sideData.bg_image ? `url(${sideData.bg_image})` : 'none',
          backgroundSize: sideData.bg_size || 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
        onClick={() => { if (isEditing) setSelectedElementId(null); }}
      >
        {sideData.elements.map(el => {
          const isSelected = isEditing && selectedElementId === el.id;
          
          return (
            <div
              key={el.id}
              onMouseDown={(e) => (isEditing && !el.locked && !isSelected) ? handleMouseDown(e, el, side) : null}
              onClick={(e) => {
                e.stopPropagation();
                if (!isEditing || el.locked) return;
                setSelectedElementId(el.id);
              }}
              className={`absolute group ${isEditing && !el.locked && !isSelected ? 'cursor-move hover:outline hover:outline-1 hover:outline-dashed hover:outline-gray-400' : ''} ${isSelected ? 'outline outline-2 outline-blue-500' : ''}`}
              style={{
                left: el.x,
                top: el.y,
                width: el.width,
                minHeight: el.height,
                height: el.type === 'image' ? el.height : undefined,
                overflow: el.type === 'image' ? 'hidden' : 'visible',
                zIndex: isSelected ? 9999 : (el.zIndex || 10),
                pointerEvents: (isEditing && el.locked && !isSelected) ? 'none' : 'auto'
              }}
            >
              {isSelected && !el.locked && (
                <>
                  {/* Drag Handle (Top-Left) */}
                  <div 
                    className="absolute -top-3 -left-3 w-6 h-6 bg-blue-500 text-white flex items-center justify-center rounded-full cursor-move shadow z-[10000]"
                    onMouseDown={(e) => handleMouseDown(e, el, side)}
                    title="Arrastrar"
                  >
                    <Move size={12} />
                  </div>
                  {/* Delete Handle (Top-Right) */}
                  <div 
                    className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white flex items-center justify-center rounded-full cursor-pointer shadow z-[10000]"
                    onClick={(e) => { e.stopPropagation(); removeElement(side, el.id); }}
                    title="Eliminar"
                  >
                    <Trash2 size={12} />
                  </div>
                  {/* Resize Handle (Bottom-Right) */}
                  <div 
                    className="absolute -bottom-3 -right-3 w-6 h-6 bg-green-500 text-white flex items-center justify-center rounded-full cursor-se-resize shadow z-[10000]"
                    onMouseDown={(e) => handleResizeMouseDown(e, el, side)}
                    title="Redimensionar"
                  >
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  {/* Lock Handle (Bottom-Left) */}
                  <div 
                    className="absolute -bottom-3 -left-3 w-6 h-6 bg-yellow-500 text-white flex items-center justify-center rounded-full cursor-pointer shadow z-[10000]"
                    onClick={(e) => { e.stopPropagation(); updateElement(side, el.id, { locked: true }); }}
                    title="Bloquear Elemento"
                  >
                    <Lock size={12} />
                  </div>
                </>
              )}
              {el.type === 'text' ? (
                <div
                  contentEditable={isEditing && isSelected}
                  suppressContentEditableWarning
                  onBlur={(e) => updateElement(side, el.id, { content: e.currentTarget.innerText })}
                  style={{
                    fontSize: `${el.fontSize}px`,
                    fontWeight: el.fontWeight,
                    color: el.color,
                    textAlign: el.textAlign,
                    fontFamily: el.fontFamily || 'sans-serif',
                    lineHeight: 'normal',
                    width: '100%',
                    minHeight: '100%',
                    whiteSpace: 'pre-wrap',
                    outline: 'none',
                    wordBreak: 'break-word'
                  }}
                  onMouseDown={(e) => {
                    // Si está seleccionado, permitir click normal para editar el texto sin arrastrar
                    if (isSelected) e.stopPropagation(); 
                  }}
                >
                  {el.content}
                </div>
              ) : el.type === 'image' ? (
                <div 
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url("${el.imageUrl || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='}")`,
                    backgroundSize: el.objectFit === 'fill' ? '100% 100%' : (el.objectFit || 'contain'),
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    pointerEvents: 'none'
                  }} 
                />
              ) : null}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 w-full bg-[#fcf9f4] p-8 overflow-y-auto min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b-2 border-[#1c1c19] pb-4">
          <div>
            <h1 className="text-3xl font-black uppercase text-[#1c1c19] mb-2 tracking-tighter">
              Presentación y Publicidad
            </h1>
            <p className="text-[#72777f] font-mono text-sm uppercase">
              Diseño Visual (Arrastrar y Soltar)
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => startCreating('tarjeta')} className="bg-white border-2 border-[#1c1c19] px-4 py-2 font-black uppercase text-xs hover:bg-[#e5e2dd] transition-all">
              + Tarjeta
            </button>
            <button onClick={() => startCreating('volante')} className="bg-white border-2 border-[#1c1c19] px-4 py-2 font-black uppercase text-xs hover:bg-[#e5e2dd] transition-all">
              + Volante
            </button>
            <button onClick={() => startCreating('qr_poster')} className="bg-white border-2 border-[#1c1c19] px-4 py-2 font-black uppercase text-xs hover:bg-[#e5e2dd] transition-all">
              + Póster QR
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center font-mono py-12 animate-pulse text-[#1c1c19]">Cargando materiales...</div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {materials.map(item => {
              const Icon = TYPE_ICONS[item.type] || ImageIcon;
              const activeSide = activeSides[item.id] || 'A';
              const isEditing = editingId === item.id;
              const currentData = isEditing ? editingData.data : item.data;
              const currentTitle = isEditing ? editingData.title : item.title;

              // Prop panel data
              const sideData = currentData.sides[activeSide];
              const selectedElement = isEditing && selectedElementId ? sideData.elements.find(el => el.id === selectedElementId) : null;

              return (
                <div key={item.id} className="bg-white border-2 border-[#1c1c19] shadow-[6px_6px_0_0_rgba(28,28,25,1)] flex flex-col min-w-0 relative">
                  
                  {/* Header */}
                  <div className="p-4 border-b-2 border-[#1c1c19] flex justify-between items-center bg-[#f6f3ee]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white border-2 border-[#1c1c19]">
                        <Icon size={20} className="text-[#1c1c19]" />
                      </div>
                      <div>
                        {isEditing ? (
                          <h3 
                            className="font-black uppercase text-[#1c1c19] text-lg leading-tight border-b-2 border-[#0f4369] outline-none bg-transparent min-w-[200px]"
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => updateEditingTitle(e.currentTarget.textContent)}
                          >
                            {currentTitle}
                          </h3>
                        ) : (
                          <h3 className="font-black uppercase text-[#1c1c19] text-lg leading-tight truncate">{currentTitle}</h3>
                        )}
                        <span className="font-mono text-[10px] uppercase tracking-widest text-white bg-[#0f4369] px-2 py-0.5 inline-block mt-1">
                          {item.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col xl:flex-row">
                    
                    {/* Left: Canvas Area */}
                    <div className="flex-1 p-6 bg-[#e5e2dd] border-r-2 border-[#1c1c19]">
                      {/* Off-screen export nodes */}
                      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
                        <div id={`export-node-A-${item.id}`}>{renderSideContent(item.type, item.data, 'A', false)}</div>
                        <div id={`export-node-B-${item.id}`}>{renderSideContent(item.type, item.data, 'B', false)}</div>
                      </div>

                      {/* Formatos Select */}
                      {isEditing && (
                        <div className="max-w-sm mx-auto mb-4 flex items-center justify-between border-2 border-[#1c1c19] p-2 bg-[#fcf9f4]">
                          <label className="text-[9px] font-black uppercase tracking-widest text-[#72777f]">Formato Predefinido</label>
                          <select 
                            onChange={(e) => {
                              if(e.target.value) {
                                const [w, h] = e.target.value.split(',');
                                updateEditingDataRoot('width_cm', w);
                                updateEditingDataRoot('height_cm', h);
                                e.target.value = '';
                              }
                            }}
                            className="border border-[#1c1c19] px-2 py-1 font-mono text-[10px] bg-white text-[#1c1c19] outline-none"
                            defaultValue=""
                          >
                            <option value="" disabled>Elegir...</option>
                            <optgroup label="Tarjetas">
                              <option value="8.5,5.5">Estándar (8.5x5.5)</option>
                              <option value="8.9,5.1">USA (8.9x5.1)</option>
                            </optgroup>
                            <optgroup label="Volantes / Flyers">
                              <option value="14.8,21">A5 (14.8x21)</option>
                              <option value="10.5,14.8">A6 (10.5x14.8)</option>
                              <option value="9.9,21">DL (9.9x21)</option>
                            </optgroup>
                            <optgroup label="Pósters">
                              <option value="21,29.7">A4 (21x29.7)</option>
                              <option value="29.7,42">A3 (29.7x42)</option>
                            </optgroup>
                            <optgroup label="Digital">
                              <option value="10.8,10.8">Post IG (10.8x10.8)</option>
                              <option value="10.8,19.2">Story (10.8x19.2)</option>
                            </optgroup>
                          </select>
                        </div>
                      )}

                      {/* Toggle Tabs */}
                      <div className="flex w-full max-w-sm mx-auto mb-4 border-2 border-[#1c1c19] overflow-hidden rounded-sm bg-white shadow-[2px_2px_0_0_rgba(28,28,25,1)]">
                        <button 
                          onClick={() => toggleSide(item.id, 'A')} 
                          className={`flex-1 py-1.5 font-black uppercase text-[10px] tracking-widest transition-colors ${activeSide === 'A' ? 'bg-[#1c1c19] text-white' : 'bg-white text-[#72777f] hover:bg-[#e5e2dd]'}`}
                        >
                          Lado A
                        </button>
                        <button 
                          onClick={() => toggleSide(item.id, 'B')} 
                          className={`flex-1 py-1.5 font-black uppercase text-[10px] tracking-widest transition-colors border-l-2 border-[#1c1c19] ${activeSide === 'B' ? 'bg-[#1c1c19] text-white' : 'bg-white text-[#72777f] hover:bg-[#e5e2dd]'}`}
                        >
                          Lado B
                        </button>
                      </div>

                      {/* Live Editable Canvas & Editor Panel */}
                      <div className="w-full flex flex-col md:flex-row justify-center items-start min-h-[400px] overflow-auto custom-scrollbar border-2 border-dashed border-[#72777f] bg-[#fcf9f4] p-4 md:p-8 shadow-inner gap-8 relative">
                        {/* Canvas */}
                        <CanvasZoomWrapper item={item} zooms={zooms} setZooms={setZooms}>
                          {renderSideContent(item.type, currentData, activeSide, isEditing)}
                        </CanvasZoomWrapper>

                        {/* Editor Panel inside Canvas Area */}
                        {isEditing && (
                          <div className="w-full md:w-72 bg-white flex flex-col shrink-0 border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,1)] z-10 sticky top-4">
                            <div className="p-3 bg-[#1c1c19] text-white font-black uppercase text-[10px] tracking-widest flex items-center justify-between">
                              <span>Propiedades</span>
                              <Wrench size={14} />
                            </div>
                            
                            <div className="p-4 overflow-y-auto max-h-[600px] custom-scrollbar space-y-5">
                              
                              {/* Global Settings */}
                              <div className="space-y-2">
                                <h4 className="font-bold text-[10px] uppercase border-b border-gray-200 pb-1 text-[#0f4369]">Tamaño del Documento</h4>
                                <div className="flex gap-2">
                                  <div className="flex-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-[#72777f] block mb-1">Ancho (cm)</label>
                                    <input type="text" value={currentData.width_cm || ''} onChange={e => updateEditingDataRoot('width_cm', e.target.value)} className="w-full border-2 border-[#1c1c19] p-1.5 font-mono text-xs" />
                                  </div>
                                  <div className="flex-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-[#72777f] block mb-1">Alto (cm)</label>
                                    <input type="text" value={currentData.height_cm || ''} onChange={e => updateEditingDataRoot('height_cm', e.target.value)} className="w-full border-2 border-[#1c1c19] p-1.5 font-mono text-xs" />
                                  </div>
                                </div>
                              </div>

                              {/* Layers List */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-1 border-b border-gray-200 pb-1">
                                  <Layers size={12} className="text-[#0f4369]" />
                                  <h4 className="font-bold text-[10px] uppercase text-[#0f4369]">Capas (Z-Index)</h4>
                                </div>
                                <div className="max-h-32 overflow-y-auto custom-scrollbar border-2 border-[#1c1c19] bg-[#f6f3ee]">
                                  {sideData.elements.slice().sort((a, b) => (b.zIndex || 10) - (a.zIndex || 10)).map(el => (
                                    <div 
                                      key={el.id} 
                                      onClick={() => setSelectedElementId(el.id)}
                                      className={`flex items-center justify-between p-1.5 border-b border-[#1c1c19]/20 text-[9px] cursor-pointer ${selectedElementId === el.id ? 'bg-[#1c1c19] text-white' : 'hover:bg-[#e5e2dd]'}`}
                                    >
                                      <span className="truncate flex-1 font-mono">{el.type === 'text' ? el.content.substring(0, 15) || 'Texto vacío' : 'Imagen'}</span>
                                      <span className="font-mono text-[8px] opacity-70 w-8 text-right mr-2">Z:{el.zIndex || 10}</span>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateElement(activeSide, el.id, { locked: !el.locked }); }}
                                        className={`p-1 hover:bg-white/20 rounded ${el.locked ? 'text-red-400' : ''}`}
                                        title={el.locked ? "Desbloquear" : "Bloquear"}
                                      >
                                        {el.locked ? <Lock size={10} /> : <Unlock size={10} />}
                                      </button>
                                    </div>
                                  ))}
                                  {sideData.elements.length === 0 && (
                                    <div className="p-2 text-center text-[9px] text-[#72777f] font-mono">Sin elementos</div>
                                  )}
                                </div>
                              </div>

                              {/* Background Settings */}
                              <div className="space-y-2">
                                <h4 className="font-bold text-[10px] uppercase border-b border-gray-200 pb-1 text-[#0f4369]">Fondo (Lado {activeSide})</h4>
                                
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-6 h-6 rounded border-2 border-[#1c1c19] overflow-hidden shrink-0 relative">
                                    <input type="color" value={sideData.bg_color || '#ffffff'} onChange={e => updateSideData(activeSide, 'bg_color', e.target.value)} className="absolute -inset-4 w-16 h-16 cursor-pointer" />
                                  </div>
                                  <span className="font-mono text-[10px]">{sideData.bg_color || '#ffffff'}</span>
                                </div>

                                <div className="mt-2">
                                  <EvidenceUploader 
                                    currentUrl={sideData.bg_image || ''} 
                                    onUpload={(url) => updateSideData(activeSide, 'bg_image', url)} 
                                    pathPrefix="marketing_bg" 
                                    bucketName="images"
                                    label="Fondo de Tarjeta" 
                                  />
                                </div>
                                
                                {sideData.bg_image && (
                                  <div className="mt-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-[#72777f] block mb-1">Ajuste de Imagen</label>
                                    <select value={sideData.bg_size || 'cover'} onChange={e => updateSideData(activeSide, 'bg_size', e.target.value)} className="w-full border-2 border-[#1c1c19] p-1.5 font-bold text-[10px] uppercase">
                                      <option value="cover">Llenar (Cover)</option>
                                      <option value="contain">Ajustar (Contain)</option>
                                      <option value="auto">Original</option>
                                    </select>
                                  </div>
                                )}
                              </div>

                              {/* Element Settings */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between border-b border-gray-200 pb-1">
                                  <h4 className="font-bold text-[10px] uppercase text-[#0f4369]">Elemento Seleccionado</h4>
                                  <div className="flex gap-1">
                                    <button onClick={() => addElement(activeSide, 'text')} className="bg-[#1c1c19] text-white p-1 hover:bg-[#0f4369] transition-colors" title="Agregar Texto">
                                      <Type size={12} />
                                    </button>
                                    <button onClick={() => addElement(activeSide, 'image')} className="bg-[#1c1c19] text-white p-1 hover:bg-[#0f4369] transition-colors" title="Agregar Imagen">
                                      <ImageIcon size={12} />
                                    </button>
                                  </div>
                                </div>

                                {!selectedElement ? (
                                  <p className="text-[10px] text-gray-400 font-mono italic">Ningún texto seleccionado. Selecciona uno o agrega uno nuevo.</p>
                                ) : (
                                  <div className="space-y-3 bg-[#f6f3ee] p-3 border border-[#1c1c19]/20 shadow-[2px_2px_0_0_rgba(28,28,25,1)]">
                                    
                                    {/* Action Buttons: Up, Down */}
                                    <div className="flex gap-1 mb-2">
                                      <button 
                                        onClick={() => updateElement(activeSide, selectedElement.id, { zIndex: (selectedElement.zIndex || 10) + 1 })}
                                        className="flex-1 flex flex-col items-center justify-center gap-1 border-2 border-[#1c1c19] p-1 text-[8px] font-black uppercase tracking-widest bg-white hover:bg-gray-100 text-[#1c1c19]"
                                        title="Traer Adelante"
                                      >
                                        <ArrowUp size={12} /> Adelante
                                      </button>
                                      <button 
                                        onClick={() => updateElement(activeSide, selectedElement.id, { zIndex: Math.max(1, (selectedElement.zIndex || 10) - 1) })}
                                        className="flex-1 flex flex-col items-center justify-center gap-1 border-2 border-[#1c1c19] p-1 text-[8px] font-black uppercase tracking-widest bg-white hover:bg-gray-100 text-[#1c1c19]"
                                        title="Llevar Atrás"
                                      >
                                        <ArrowDown size={12} /> Atrás
                                      </button>
                                    </div>

                                    {/* Positioning */}
                                    <div className="flex gap-2">
                                      <div className="flex-1">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-[#72777f] block mb-1">X (px)</label>
                                        <input type="number" value={selectedElement.x || 0} onChange={e => updateElement(activeSide, selectedElement.id, { x: parseInt(e.target.value) })} className="w-full border-2 border-[#1c1c19] p-1 font-mono text-[10px]" />
                                      </div>
                                      <div className="flex-1">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-[#72777f] block mb-1">Y (px)</label>
                                        <input type="number" value={selectedElement.y || 0} onChange={e => updateElement(activeSide, selectedElement.id, { y: parseInt(e.target.value) })} className="w-full border-2 border-[#1c1c19] p-1 font-mono text-[10px]" />
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <div className="flex-1">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-[#72777f] block mb-1">Ancho (px)</label>
                                        <input type="number" value={selectedElement.width || 0} onChange={e => updateElement(activeSide, selectedElement.id, { width: parseInt(e.target.value) })} className="w-full border-2 border-[#1c1c19] p-1 font-mono text-[10px]" />
                                      </div>
                                      <div className="flex-1">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-[#72777f] block mb-1">Alto (px)</label>
                                        <input type="number" value={selectedElement.height || 0} onChange={e => updateElement(activeSide, selectedElement.id, { height: parseInt(e.target.value) })} className="w-full border-2 border-[#1c1c19] p-1 font-mono text-[10px]" />
                                      </div>
                                    </div>

                                    {selectedElement.type === 'text' ? (
                                      <>
                                        {/* Typography */}
                                        <div>
                                          <label className="text-[9px] font-black uppercase tracking-widest text-[#72777f] block mb-1">Fuente (Font)</label>
                                          <select value={selectedElement.fontFamily || 'sans-serif'} onChange={e => updateElement(activeSide, selectedElement.id, { fontFamily: e.target.value })} className="w-full border-2 border-[#1c1c19] p-1 font-bold text-[10px] uppercase">
                                            <option value="sans-serif">Sans-serif</option>
                                            <option value="serif">Serif</option>
                                            <option value="monospace">Monospace</option>
                                            <option value="Arial, sans-serif">Arial</option>
                                            <option value="'Times New Roman', serif">Times New Roman</option>
                                            <option value="'Courier New', monospace">Courier New</option>
                                            <option value="'Inter', sans-serif">Inter</option>
                                            <option value="'Roboto', sans-serif">Roboto</option>
                                            <option value="'Outfit', sans-serif">Outfit</option>
                                            <option value="'Comic Sans MS', cursive">Comic Sans</option>
                                          </select>
                                        </div>

                                        <div>
                                          <label className="text-[9px] font-black uppercase tracking-widest text-[#72777f] block mb-1">Tamaño Fuente (px)</label>
                                          <input type="number" value={selectedElement.fontSize || 12} onChange={e => updateElement(activeSide, selectedElement.id, { fontSize: parseInt(e.target.value) })} className="w-full border-2 border-[#1c1c19] p-1 font-mono text-[10px]" />
                                        </div>
                                        
                                        <div>
                                          <label className="text-[9px] font-black uppercase tracking-widest text-[#72777f] block mb-1">Grosor (Weight)</label>
                                          <select value={selectedElement.fontWeight || 'normal'} onChange={e => updateElement(activeSide, selectedElement.id, { fontWeight: e.target.value })} className="w-full border-2 border-[#1c1c19] p-1 font-bold text-[10px] uppercase">
                                            <option value="300">Light (300)</option>
                                            <option value="400">Normal (400)</option>
                                            <option value="700">Bold (700)</option>
                                            <option value="900">Black (900)</option>
                                          </select>
                                        </div>

                                        <div>
                                          <label className="text-[9px] font-black uppercase tracking-widest text-[#72777f] block mb-1">Alineación</label>
                                          <div className="flex border-2 border-[#1c1c19] bg-white">
                                            {['left', 'center', 'right', 'justify'].map(align => (
                                              <button 
                                                key={align}
                                                onClick={() => updateElement(activeSide, selectedElement.id, { textAlign: align })}
                                                className={`flex-1 p-1 flex justify-center border-r-2 last:border-r-0 border-[#1c1c19] ${selectedElement.textAlign === align ? 'bg-[#1c1c19] text-white' : 'text-[#1c1c19] hover:bg-gray-100'}`}
                                              >
                                                {align === 'left' && <AlignLeft size={12} />}
                                                {align === 'center' && <AlignCenter size={12} />}
                                                {align === 'right' && <AlignRight size={12} />}
                                                {align === 'justify' && <AlignJustify size={12} />}
                                              </button>
                                            ))}
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                          <div className="w-5 h-5 border-2 border-[#1c1c19] relative overflow-hidden shrink-0">
                                            <input type="color" value={selectedElement.color || '#000000'} onChange={e => updateElement(activeSide, selectedElement.id, { color: e.target.value })} className="absolute -inset-4 w-12 h-12 cursor-pointer" />
                                          </div>
                                          <span className="text-[9px] font-black uppercase tracking-widest text-[#1c1c19]">Color del Texto</span>
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        {/* Image specific options */}
                                        <div className="mb-2">
                                          <EvidenceUploader 
                                            currentUrl={selectedElement.imageUrl || ''} 
                                            onUpload={(url) => updateElement(activeSide, selectedElement.id, { imageUrl: url })} 
                                            pathPrefix="marketing_el" 
                                            bucketName="images"
                                            label="Imagen del Elemento" 
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[9px] font-black uppercase tracking-widest text-[#72777f] block mb-1">Ajuste de Imagen</label>
                                          <select value={selectedElement.objectFit || 'contain'} onChange={e => updateElement(activeSide, selectedElement.id, { objectFit: e.target.value })} className="w-full border-2 border-[#1c1c19] p-1 font-bold text-[10px] uppercase">
                                            <option value="cover">Llenar (Cover)</option>
                                            <option value="contain">Ajustar (Contain)</option>
                                            <option value="fill">Estirar (Fill)</option>
                                          </select>
                                        </div>
                                      </>
                                    )}

                                    <button 
                                      onClick={() => removeElement(activeSide, selectedElement.id)}
                                      className="w-full mt-3 flex items-center justify-center gap-2 border-2 border-red-500 text-red-600 p-1.5 text-[9px] font-black uppercase tracking-widest hover:bg-red-50 transition-colors shadow-[2px_2px_0_0_rgba(239,68,68,1)]"
                                    >
                                      <Trash2 size={10} /> Eliminar Elemento
                                    </button>
                                  </div>
                                )}

                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  {isEditing ? (
                    <div className="flex gap-2 justify-end p-4 border-t-2 border-[#1c1c19] bg-[#f6f3ee] items-center">
                      <button
                        onClick={() => setIsAiModalOpen(true)}
                        className="px-4 py-2 bg-yellow-100 text-yellow-600 hover:bg-yellow-200 border-2 border-yellow-400 font-black flex items-center justify-center transition-colors shadow-[2px_2px_0_0_rgba(250,204,21,0.5)] mr-auto"
                        title="Generador IA"
                      >
                        <Zap size={14} className="fill-yellow-500" />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="px-6 py-2 border-2 border-[#1c1c19] font-black uppercase text-[10px] tracking-widest text-[#1c1c19] hover:bg-[#e5e2dd] transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => saveEditing(item)}
                        className="flex items-center gap-2 px-6 py-2 bg-[#0f4369] text-white border-2 border-[#0f4369] font-black uppercase text-[10px] tracking-widest hover:bg-[#1c1c19] transition-all"
                      >
                        <Save size={14} /> Guardar Diseño
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 justify-end p-4 border-t-2 border-[#1c1c19]/10 bg-gray-50 items-center">
                      <button
                        onClick={() => handleDownloadJPG(item.id, item.title)}
                        className="p-2 h-[36px] w-[36px] flex items-center justify-center bg-blue-50 text-blue-700 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-100 transition-colors"
                        title="Descargar JPG (Ambos lados)"
                      >
                        <ImageIcon size={16} />
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(item.id, item.title)}
                        className="p-2 h-[36px] w-[36px] flex items-center justify-center bg-red-50 text-red-700 border-2 border-red-200 hover:border-red-400 hover:bg-red-100 transition-colors"
                        title="Descargar PDF (2 Páginas)"
                      >
                        <FileText size={16} />
                      </button>
                      <button
                        onClick={() => startEditing(item)}
                        className="px-4 py-2 ml-auto border-2 border-[#1c1c19] text-[#1c1c19] hover:bg-[#e5e2dd] transition-colors flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"
                        title="Editar Diseño"
                      >
                        <Edit size={14} /> Editar
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 h-[36px] w-[36px] flex items-center justify-center border-2 border-[#1c1c19] text-red-600 hover:bg-red-50 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            
            {materials.length === 0 && !loading && (
              <div className="col-span-full text-center py-12 border-2 border-dashed border-[#1c1c19] bg-white">
                <p className="font-mono text-[#72777f] uppercase">No hay diseños creados. Crea uno nuevo arriba.</p>
              </div>
            )}
          </div>
        )}

        {/* AI Import Modal */}
        {!!editingId && editingData && (
          <AiMarketingFillModal
            isOpen={isAiModalOpen}
            onClose={() => setIsAiModalOpen(false)}
            materialType={materials.find(m => m.id === editingId)?.type || 'tarjeta'}
            materialTitle={editingData.title}
            currentData={editingData.data}
            onImport={(importedData) => {
              setEditingData(prev => ({
                ...prev,
                data: {
                  ...prev.data,
                  ...importedData
                }
              }));
            }}
          />
        )}
      </div>
    </div>
  );
}
