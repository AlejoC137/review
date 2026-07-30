import { supabase } from './supabaseClient';

export const projectExporterService = {
  /**
   * Exporta todo el contenido y la base de datos de un proyecto específico a un objeto JSON estructurado
   * y desencadena la descarga directa en el navegador.
   */
  exportProjectToJson: async (projectId, projectName = 'Proyecto') => {
    try {
      // 1. Datos básicos del proyecto
      const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle();

      // 2. Información General / Ficha PEB
      const { data: pebInfo } = await supabase
        .from('project_general_info')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      // 3. Objetivos y Usos BIM
      const { data: objectives } = await supabase
        .from('project_objectives')
        .select('*')
        .eq('project_id', projectId);

      const { data: bimUses } = await supabase
        .from('project_bim_uses')
        .select('*')
        .eq('project_id', projectId);

      // 4. Softwares del proyecto
      const { data: software } = await supabase
        .from('project_software')
        .select('*')
        .eq('project_id', projectId);

      // 5. Equipo (Staff) del proyecto
      const { data: staff } = await supabase
        .from('staff')
        .select('*')
        .eq('project_id', projectId);

      // 6. Espacios y Cuadro de Áreas
      const { data: spaces } = await supabase
        .from('Espacio_Elemento')
        .select('*')
        .eq('subProject_id', projectId);

      // 7. Materiales del proyecto
      const { data: materials } = await supabase
        .from('Materiales')
        .select('*')
        .eq('project_id', projectId);

      // 8. Cronograma / Entregables
      const { data: deliverables } = await supabase
        .from('deliverables')
        .select('*')
        .eq('project_id', projectId);

      // 9. Etapas si existen
      let stages = [];
      if (projectData?.lifecycle_id) {
        const { data: stg } = await supabase
          .from('lifecycle_stages')
          .select('*')
          .eq('lifecycle_id', projectData.lifecycle_id)
          .order('order_index', { ascending: true });
        stages = stg || [];
      }

      // Estructura completa de la plantilla exportada
      const exportPayload = {
        version: "2.0",
        exported_at: new Date().toISOString(),
        name: projectData?.name || projectName,
        description: projectData?.description || "",
        category: "Plantilla Exportada de Proyecto",
        is_blank: false,
        peb_info: pebInfo ? { ...pebInfo, id: undefined, project_id: undefined } : {},
        stages: (stages || []).map(s => ({ name: s.name, order_index: s.order_index, estimated_days: s.estimated_days })),
        objectives: (objectives || []).map(o => ({ descripcion: o.descripcion, prioridad: o.prioridad, fase: o.fase })),
        bim_uses: (bimUses || []).map(u => ({ uso: u.uso, descripcion: u.descripcion, responsable: u.responsable })),
        software: (software || []).map(s => ({ nombre: s.nombre, version: s.version, es_software_primario: s.es_software_primario, formato: s.formato })),
        staff: (staff || []).map(st => ({ name: st.name || st.nombre, role_description: st.role_description, especialidad: st.especialidad, compania: st.compania, email: st.email, phone: st.phone, color: st.color })),
        spaces: (spaces || []).map(sp => ({ nombre: sp.nombre, tipo: sp.tipo, apellido: sp.apellido, piso: sp.piso, level_id: sp.level_id, area: sp.area, area_category: sp.area_category, componentes: sp.componentes, categoria_uso: sp.categoria_uso })),
        materials: (materials || []).map(m => ({ Nombre: m.Nombre, categoria: m.categoria, tipo: m.tipo, unidad: m.unidad, stock: m.stock, proveedor: m.proveedor, precio_COP: m.precio_COP, observaciones_tecnicas: m.observaciones_tecnicas })),
        deliverables: (deliverables || []).map(d => ({ title: d.title, due_date: d.due_date, status: d.status, responsible: d.responsible }))
      };

      // Crear y descargar archivo JSON
      const jsonString = JSON.stringify(exportPayload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const cleanName = (projectData?.name || projectName).toLowerCase().replace(/[^a-z0-9]/gi, '_');
      link.href = url;
      link.download = `plantilla_proyecto_${cleanName}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    } catch (err) {
      console.error("❌ Error al exportar plantilla del proyecto:", err);
      throw err;
    }
  },

  /**
   * Importa todo el contenido de un objeto JSON y lo asigna de forma EXCLUSIVA
   * al nuevo project_id creado.
   */
  importProjectFromJson: async (newProjectId, jsonContent) => {
    if (!newProjectId || !jsonContent || typeof jsonContent !== 'object') return;

    try {
      if (jsonContent.is_blank) {
        const cleanPeb = {
          project_id: newProjectId,
          client: '', code: '', location: '', department: '', city: '', scope: '', typology: '',
          modules: [], lot_area: 0, sales_area: 0, built_area: 0, circulation_area: 0, occupied_area: 0,
          additional_info: '', tdi_correlation: '', oir_pir_compliance: '', bim_uses: [],
          software_principal: '', version_software: '', uso_del_modelo: '', entorno_comun_de_datos_cde: ''
        };
        localStorage.setItem(`peb_info_${newProjectId}`, JSON.stringify(cleanPeb));
        await supabase.from('project_general_info').upsert(cleanPeb).catch(() => {});
        console.log(`✅ Proyecto ${newProjectId} creado totalmente limpio y en blanco.`);
        return;
      }

      // 1. Guardar o actualizar Ficha PEB / Información General
      if (jsonContent.peb_info && Object.keys(jsonContent.peb_info).length > 0) {
        const pebPayload = {
          ...jsonContent.peb_info,
          project_id: newProjectId
        };
        delete pebPayload.id;
        localStorage.setItem(`peb_info_${newProjectId}`, JSON.stringify(pebPayload));
        await supabase.from('project_general_info').upsert(pebPayload).catch(e => console.warn("Error import general info:", e));
      }

      // 2. Importar Objetivos
      if (Array.isArray(jsonContent.objectives) && jsonContent.objectives.length > 0) {
        const objPayload = jsonContent.objectives.map(o => ({
          project_id: newProjectId,
          descripcion: o.descripcion,
          prioridad: o.prioridad || 1,
          fase: o.fase || 'Diseño'
        }));
        await supabase.from('project_objectives').insert(objPayload).catch(e => console.warn("Error import objectives:", e));
      }

      // 3. Importar Usos BIM
      if (Array.isArray(jsonContent.bim_uses) && jsonContent.bim_uses.length > 0) {
        const usesPayload = jsonContent.bim_uses.map(u => ({
          project_id: newProjectId,
          uso: u.uso,
          descripcion: u.descripcion || '',
          responsable: u.responsable || ''
        }));
        await supabase.from('project_bim_uses').insert(usesPayload).catch(e => console.warn("Error import bim_uses:", e));
      }

      // 4. Importar Software
      if (Array.isArray(jsonContent.software) && jsonContent.software.length > 0) {
        const softPayload = jsonContent.software.map(s => ({
          project_id: newProjectId,
          nombre: s.nombre,
          version: s.version || '',
          es_software_primario: Boolean(s.es_software_primario),
          formato: s.formato || ''
        }));
        await supabase.from('project_software').insert(softPayload).catch(e => console.warn("Error import software:", e));
      }

      // 5. Importar Equipo / Staff exclusivo
      if (Array.isArray(jsonContent.staff) && jsonContent.staff.length > 0) {
        const staffPayload = jsonContent.staff.map(st => ({
          project_id: newProjectId,
          name: st.name || st.nombre,
          role_description: st.role_description || st.rol || '',
          especialidad: st.especialidad || '',
          compania: st.compania || '',
          email: st.email || '',
          phone: st.phone || '',
          color: st.color || '#0f4369'
        }));
        await supabase.from('staff').insert(staffPayload).catch(e => console.warn("Error import staff:", e));
      }

      // 6. Importar Espacios / Gestión de Áreas exclusivos
      if (Array.isArray(jsonContent.spaces) && jsonContent.spaces.length > 0) {
        const spacesPayload = jsonContent.spaces.map(sp => ({
          subProject_id: newProjectId,
          nombre: sp.nombre,
          tipo: sp.tipo || 'Espacio',
          apellido: sp.apellido || '',
          piso: sp.piso || 'Nivel 1',
          level_id: sp.level_id || null,
          area: sp.area || 0,
          area_category: sp.area_category || 'Área Construida',
          componentes: sp.componentes || [],
          categoria_uso: sp.categoria_uso || ''
        }));
        await supabase.from('Espacio_Elemento').insert(spacesPayload).catch(e => console.warn("Error import spaces:", e));
      }

      // 7. Importar Materiales exclusivos
      if (Array.isArray(jsonContent.materials) && jsonContent.materials.length > 0) {
        const materialsPayload = jsonContent.materials.map(m => ({
          project_id: newProjectId,
          Nombre: m.Nombre || m.nombre,
          categoria: m.categoria || 'General',
          tipo: m.tipo || '',
          unidad: m.unidad || 'm2',
          stock: m.stock || 0,
          proveedor: m.proveedor || '',
          precio_COP: m.precio_COP || 0,
          observaciones_tecnicas: m.observaciones_tecnicas || ''
        }));
        await supabase.from('Materiales').insert(materialsPayload).catch(e => console.warn("Error import materials:", e));
      }

      // 8. Importar Entregables / Cronograma
      if (Array.isArray(jsonContent.deliverables) && jsonContent.deliverables.length > 0) {
        const delivPayload = jsonContent.deliverables.map(d => ({
          project_id: newProjectId,
          title: d.title,
          due_date: d.due_date || null,
          status: d.status || 'pending',
          responsible: d.responsible || ''
        }));
        await supabase.from('deliverables').insert(delivPayload).catch(e => console.warn("Error import deliverables:", e));
      }

      console.log(`✅ Contenido importado exitosamente desde JSON para el proyecto: ${newProjectId}`);
    } catch (err) {
      console.error("❌ Error al importar JSON del proyecto:", err);
    }
  }
};
