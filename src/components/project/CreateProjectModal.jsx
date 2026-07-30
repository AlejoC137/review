import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, FolderPlus, Briefcase, Calendar, User, Loader2, FileText, Info, Upload, Download, CheckCircle2, FileCode } from 'lucide-react';
import { lifecycleService } from '../../services/lifecycleService';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { JSON_TEMPLATES, getJsonTemplateById } from '../../data/templates';
import { projectExporterService } from '../../services/projectExporterService';

export default function CreateProjectModal({ isOpen, onClose, onProjectCreated }) {
  const { user, isAdmin } = useAuth();
  const { t } = useTranslation();
  const fileInputRef = useRef(null);

  const [projectName, setProjectName] = useState('');
  const [responsibleParty, setResponsibleParty] = useState('');
  const [description, setDescription] = useState('');
  const [lifecycles, setLifecycles] = useState(JSON_TEMPLATES);
  const [selectedLifecycleId, setSelectedLifecycleId] = useState(JSON_TEMPLATES[0].id);
  const [loadingLifecycles, setLoadingLifecycles] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const loadAllTemplates = () => {
    const savedCustom = JSON.parse(localStorage.getItem('custom_json_templates') || '[]');
    return [
      ...JSON_TEMPLATES,
      ...savedCustom
    ];
  };

  useEffect(() => {
    if (!isOpen) return;

    // Reset fields on open
    setProjectName('');
    setDescription('');
    setErrorMsg(null);
    setSuccessMsg(null);
    setResponsibleParty(user?.name || user?.mail || 'Equipo BIM');

    const allTemplates = loadAllTemplates();
    setLifecycles(allTemplates);
    setSelectedLifecycleId(allTemplates[0]?.id || JSON_TEMPLATES[0].id);
    setLoadingLifecycles(false);
  }, [isOpen, user]);

  // Handle uploading custom JSON file
  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonContent = JSON.parse(e.target?.result);
        if (!jsonContent || typeof jsonContent !== 'object') {
          throw new Error('El archivo no contiene una plantilla JSON válida.');
        }

        const templateName = jsonContent.name || file.name.replace('.json', '');
        const isValidUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
        const newTemplate = {
          id: (jsonContent.id && isValidUUID(jsonContent.id)) ? jsonContent.id : crypto.randomUUID(),
          name: `[JSON CUSTOM] ${templateName.toUpperCase()}`,
          category: jsonContent.category || 'Personalizada (JSON)',
          description: jsonContent.description || `Plantilla cargada desde el archivo ${file.name}`,
          is_blank: Boolean(jsonContent.is_blank),
          stages: Array.isArray(jsonContent.stages) ? jsonContent.stages : [],
          peb_info: jsonContent.peb_info || {}
        };

        const existingCustom = JSON.parse(localStorage.getItem('custom_json_templates') || '[]');
        const updatedCustom = [...existingCustom.filter(t => t.id !== newTemplate.id), newTemplate];
        localStorage.setItem('custom_json_templates', JSON.stringify(updatedCustom));

        setLifecycles(prev => [...prev.filter(t => t.id !== newTemplate.id), newTemplate]);
        setSelectedLifecycleId(newTemplate.id);
        setSuccessMsg(`Plantilla "${templateName}" cargada exitosamente desde JSON.`);
        setErrorMsg(null);
      } catch (err) {
        console.error("Error al procesar archivo JSON:", err);
        setErrorMsg(`Error al procesar el JSON: ${err.message}`);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Download sample JSON template
  const handleDownloadSampleJson = () => {
    const sampleData = {
      name: "Mi Plantilla BIM Personalizada",
      category: "Infraestructura / Personalizado",
      description: "Plantilla personalizada de ciclo de vida en formato JSON.",
      stages: [
        { name: "Fase 1: Diagnóstico y Alcance", order_index: 1, estimated_days: 15 },
        { name: "Fase 2: Coordinación BIM 3D", order_index: 2, estimated_days: 45 },
        { name: "Fase 3: Entrega Final & As-Built", order_index: 3, estimated_days: 30 }
      ],
      peb_info: {
        client: "Cliente Personalizado",
        code: "CUSTOM-2026",
        location: "Medellín, Colombia",
        department: "Antioquia",
        city: "Medellín",
        scope: "Alcance definido mediante archivo JSON",
        typology: "Uso Mixto",
        modules: ["Arquitectura", "Estructuras", "Hidrosanitario"],
        lot_area: 2500,
        sales_area: 1200,
        built_area: 2000,
        circulation_area: 300,
        occupied_area: 800,
        additional_info: "Cargado automáticamente mediante plantilla JSON importada.",
        software_principal: "Revit",
        version_software: "2025",
        uso_del_modelo: "Coordinación y Extracción de Cantidades",
        entorno_comun_de_datos_cde: "Autodesk Construction Cloud"
      }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sampleData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "plantilla_ejemplo_bim.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setErrorMsg('El nombre del proyecto es obligatorio.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const activeLifecycleId = selectedLifecycleId || JSON_TEMPLATES[0].id;
      const selectedTemplate = lifecycles.find(t => t.id === activeLifecycleId) || getJsonTemplateById(activeLifecycleId);
      
      const newProject = await lifecycleService.createProject({
        name: projectName.trim(),
        description: description.trim() || (selectedTemplate?.is_blank ? "" : selectedTemplate?.description) || undefined,
        lifecycle_id: activeLifecycleId,
        status: 'active',
        responsible_party: responsibleParty.trim() || 'Equipo BIM',
        id_user: user?.id || localStorage.getItem('custom_user_id')
      });

      if (newProject?.id && selectedTemplate) {
        await projectExporterService.importProjectFromJson(newProject.id, selectedTemplate);
      }

      if (onProjectCreated) {
        await onProjectCreated(newProject);
      }
      onClose();
    } catch (err) {
      console.error("Error al crear proyecto:", err);
      setErrorMsg(err.message || 'Ocurrió un error al crear el proyecto. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };
  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity animate-fadeIn">
      <div 
        className="bg-[#fcf9f4] border-2 border-[#1c1c19] w-full max-w-lg shadow-[12px_12px_0_0_rgba(28,28,25,1)] relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex justify-between items-center border-b-2 border-[#1c1c19] bg-[#0f4369] text-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#1c1c19] text-white p-2 border border-white/20">
              <FolderPlus size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="font-mono text-base font-black tracking-wider uppercase leading-none">
                Crear Nuevo Proyecto
              </h2>
              <span className="text-[10px] font-mono text-white/70 uppercase tracking-widest">
                Configuración Inicial
              </span>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="hover:bg-white/10 p-1.5 transition-colors border border-transparent text-white hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Hidden File Input for Custom JSON Upload */}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept=".json" 
          onChange={handleFileUpload} 
          className="hidden" 
        />

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="bg-red-50 border-2 border-red-600 text-red-700 px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider">
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border-2 border-emerald-600 text-emerald-800 px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Nombre del Proyecto */}
          <div>
            <label className="block text-[11px] font-mono font-black uppercase text-[#1c1c19] tracking-wider mb-2 flex items-center gap-1.5">
              <Briefcase size={14} className="text-[#0f4369]" />
              Nombre del Proyecto <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Ej: HOTEL CLICK CLACK TORRE B"
              className="w-full bg-white border-2 border-[#1c1c19] px-4 py-3 text-sm font-sans font-bold text-[#1c1c19] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0f4369] focus:border-[#0f4369] shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] transition-all uppercase"
            />
          </div>

          {/* Plantilla / Ciclo de Vida */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[11px] font-mono font-black uppercase text-[#1c1c19] tracking-wider flex items-center gap-1.5">
                <Calendar size={14} className="text-[#0f4369]" />
                Plantilla de Ciclo de Vida
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0f4369] text-white border border-[#1c1c19] text-[9px] font-mono font-black uppercase tracking-wider hover:bg-[#1c1c19] transition-all shadow-[2px_2px_0_0_rgba(28,28,25,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
                  title="Cargar plantilla desde archivo JSON en tu equipo"
                >
                  <Upload size={11} strokeWidth={2.5} />
                  <span>Cargar JSON</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSampleJson}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-[#1c1c19] border border-[#1c1c19] text-[9px] font-mono font-black uppercase tracking-wider hover:bg-[#e5e2dd] transition-all shadow-[2px_2px_0_0_rgba(28,28,25,0.15)] cursor-pointer"
                  title="Descargar archivo JSON de plantilla de ejemplo"
                >
                  <Download size={11} strokeWidth={2.5} />
                  <span>Ejemplo JSON</span>
                </button>
              </div>
            </div>
            {loadingLifecycles ? (
              <div className="flex items-center gap-2 py-3 px-4 bg-white border-2 border-[#1c1c19] text-xs font-mono text-gray-500">
                <Loader2 size={14} className="animate-spin text-[#0f4369]" />
                Cargando plantillas...
              </div>
            ) : (
              <>
                <select
                  value={selectedLifecycleId}
                  onChange={(e) => setSelectedLifecycleId(e.target.value)}
                  className="w-full bg-white border-2 border-[#1c1c19] px-4 py-3 text-xs font-mono font-bold text-[#1c1c19] focus:outline-none focus:ring-2 focus:ring-[#0f4369] focus:border-[#0f4369] shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] transition-all uppercase cursor-pointer"
                >
                  {lifecycles.map((lc) => (
                    <option key={lc.id} value={lc.id}>
                      {lc.name ? lc.name.toUpperCase() : `PLANTILLA ${lc.id.split('-')[0]}`}
                    </option>
                  ))}
                </select>
                {(() => {
                  const currentTmpl = lifecycles.find(t => t.id === selectedLifecycleId) || getJsonTemplateById(selectedLifecycleId);
                  if (!currentTmpl || !currentTmpl.description) return null;
                  return (
                    <div className="mt-2 p-2.5 bg-[#f6f3ee] border border-[#1c1c19]/20 flex items-start gap-2">
                      <Info size={14} className="text-[#0f4369] shrink-0 mt-0.5" />
                      <p className="text-[10px] font-mono text-slate-700 leading-snug">
                        {currentTmpl.description}
                      </p>
                    </div>
                  );
                })()}
              </>
            )}
          </div>

          {/* Responsable del Proyecto */}
          <div>
            <label className="block text-[11px] font-mono font-black uppercase text-[#1c1c19] tracking-wider mb-2 flex items-center gap-1.5">
              <User size={14} className="text-[#0f4369]" />
              Responsable / Equipo
            </label>
            <input
              type="text"
              value={responsibleParty}
              onChange={(e) => setResponsibleParty(e.target.value)}
              placeholder="Ej: ARQ. ALEJANDRO / EQUIPO BIM"
              className="w-full bg-white border-2 border-[#1c1c19] px-4 py-3 text-xs font-mono font-bold text-[#1c1c19] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0f4369] focus:border-[#0f4369] shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] transition-all uppercase"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-[11px] font-mono font-black uppercase text-[#1c1c19] tracking-wider mb-2 flex items-center gap-1.5">
              <FileText size={14} className="text-[#0f4369]" />
              Descripción (Opcional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descripción del alcance, uso u objetivos..."
              className="w-full bg-white border-2 border-[#1c1c19] px-4 py-2.5 text-xs font-sans text-[#1c1c19] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0f4369] focus:border-[#0f4369] shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] transition-all"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-[#1c1c19]/10">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 bg-[#f6f3ee] text-[#1c1c19] border-2 border-[#1c1c19] font-mono text-xs font-black uppercase tracking-wider hover:bg-[#e5e2dd] transition-all shadow-[3px_3px_0_0_rgba(28,28,25,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-[#0f4369] text-white border-2 border-[#1c1c19] font-mono text-xs font-black uppercase tracking-wider hover:bg-[#1c1c19] transition-all flex items-center gap-2 shadow-[3px_3px_0_0_rgba(28,28,25,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Creando...</span>
                </>
              ) : (
                <>
                  <Plus size={16} strokeWidth={3} />
                  <span>Crear Proyecto</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
