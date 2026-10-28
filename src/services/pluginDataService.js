import { supabase } from './supabaseClient.js';

export const pluginDataService = {
  // Obtener todas las exportaciones recibidas desde el plugin
  async getAllPluginExports() {
    const { data, error } = await supabase
      .from('plugin_project_data')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener datos del plugin:', error);
      throw error;
    }
    return data || [];
  },

  // Eliminar un registro de prueba
  async deleteExport(id) {
    const { data, error } = await supabase
      .from('plugin_project_data')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar registro:', error);
      throw error;
    }
    return data;
  },

  // Vaciar toda la tabla de pruebas
  async clearAllExports() {
    const { data, error } = await supabase
      .from('plugin_project_data')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error('Error al limpiar registros:', error);
      throw error;
    }
    return data;
  },

  // Actualizar los materiales editados de un proyecto
  async updateMaterials(id, materials) {
    const { data, error } = await supabase
      .from('plugin_project_data')
      .update({ materials })
      .eq('id', id);

    if (error) {
      console.error('Error al actualizar materiales:', error);
      throw error;
    }
    return data;
  },

  // Asignar una recepción/exportación a un proyecto existente
  async assignProjectToExport(exportId, projectId, projectName = '') {
    if (!exportId) throw new Error('ID de exportación no proporcionado');

    // 1. Obtener registro actual para no sobreescribir project_info
    const { data: current, error: fetchErr } = await supabase
      .from('plugin_project_data')
      .select('project_info')
      .eq('id', exportId)
      .single();

    if (fetchErr) {
      console.error('Error al consultar exportación para asignar:', fetchErr);
    }

    const currentInfo = current?.project_info || {};
    const updatedInfo = {
      ...currentInfo,
      review_project_id: projectId,
      review_project_name: projectName
    };

    // 2. Intentar actualizar con columna project_id y project_info
    let updateResult = await supabase
      .from('plugin_project_data')
      .update({
        project_id: projectId,
        project_info: updatedInfo
      })
      .eq('id', exportId);

    // Si falla porque la columna project_id no existe aún en el esquema SQL, actualizar solo project_info
    if (updateResult.error && updateResult.error.message?.includes('project_id')) {
      console.warn('Columna project_id no detectada en plugin_project_data, guardando en project_info:', updateResult.error.message);
      updateResult = await supabase
        .from('plugin_project_data')
        .update({
          project_info: updatedInfo
        })
        .eq('id', exportId);
    }

    if (updateResult.error) {
      console.error('Error al asignar proyecto:', updateResult.error);
      throw updateResult.error;
    }

    return true;
  },

  // Desasignar una recepción de su proyecto
  async unassignProjectFromExport(exportId) {
    if (!exportId) return;

    const { data: current } = await supabase
      .from('plugin_project_data')
      .select('project_info')
      .eq('id', exportId)
      .single();

    const currentInfo = { ...(current?.project_info || {}) };
    delete currentInfo.review_project_id;
    delete currentInfo.review_project_name;

    let res = await supabase
      .from('plugin_project_data')
      .update({
        project_id: null,
        project_info: currentInfo
      })
      .eq('id', exportId);

    if (res.error && res.error.message?.includes('project_id')) {
      res = await supabase
        .from('plugin_project_data')
        .update({
          project_info: currentInfo
        })
        .eq('id', exportId);
    }

    if (res.error) throw res.error;
    return true;
  },

  // ADOPTAR TODA LA INFORMACIÓN DE LA RECEPCIÓN EN EL PROYECTO OBJETIVO
  async adoptExportIntoProject(exportRecord, targetProjectId, options = {}) {
    if (!exportRecord || !targetProjectId) {
      throw new Error('Faltan parámetros requeridos (exportRecord o targetProjectId)');
    }

    const {
      syncGeneralInfo = true,
      syncLevels = true,
      syncRooms = true,
      syncMaterials = true,
      targetProjectName = ''
    } = options;

    const summaryReport = {
      generalInfoUpdated: false,
      levelsAdded: 0,
      levelsUpdated: 0,
      roomsAdded: 0,
      materialsAdded: 0,
      assigned: false
    };

    // ---------------------------------------------------------
    // 1. SINCRONIZAR INFORMACIÓN GENERAL (project_general_info & projects)
    // ---------------------------------------------------------
    if (syncGeneralInfo) {
      try {
        const info = exportRecord.project_info || {};
        const siteLoc = exportRecord.site_location || {};

        // Extraer ciudad y departamento
        let city = '';
        let department = '';
        const address = exportRecord.project_address || info.address || '';
        if (address && address.includes(',')) {
          const parts = address.split(',').map(s => s.trim());
          city = parts[0] || '';
          department = parts[1] || '';
        } else if (address && !address.toLowerCase().includes('introduzca') && !address.toLowerCase().includes('enter address')) {
          city = address;
        }

        // Calcular áreas sumando habitaciones si existen
        const allRooms = Array.isArray(exportRecord.rooms) && exportRecord.rooms.length > 0 
          ? exportRecord.rooms 
          : (Array.isArray(info.rooms) ? info.rooms : []);

        let computedBuiltArea = 0;
        let computedCirculationArea = 0;

        for (const rm of allRooms) {
          const area = Number(rm.area_m2) || 0;
          computedBuiltArea += area;
          const nameLower = (rm.name || '').toLowerCase();
          if (nameLower.includes('circula') || nameLower.includes('corredor') || nameLower.includes('hall') || nameLower.includes('pasillo')) {
            computedCirculationArea += area;
          }
        }

        // Consultar info general existente para no sobreescribir datos valiosos con vacíos
        const { data: existingGeneral } = await supabase
          .from('project_general_info')
          .select('*')
          .eq('project_id', targetProjectId)
          .maybeSingle();

        const clientVal = (info.client && !info.client.toLowerCase().includes('client name') && !info.client.toLowerCase().includes('propietario')) 
          ? info.client 
          : (existingGeneral?.client || 'Sin asignar');

        const codeVal = (exportRecord.project_number && !exportRecord.project_number.toLowerCase().includes('project number')) 
          ? exportRecord.project_number 
          : (existingGeneral?.code || info.number || 'REVIT-01');

        const locationVal = (address && !address.toLowerCase().includes('introduzca') && !address.toLowerCase().includes('enter address')) 
          ? address 
          : (siteLoc.place_name || existingGeneral?.location || 'Medellín, Antioquia');

        const additionalNotes = [
          existingGeneral?.additional_info || '',
          `[Sincronizado Revit el ${new Date().toLocaleDateString()} desde plugin por ${exportRecord.user_email || 'usuario'} (${exportRecord.project_name || 'Modelo'})]`
        ].filter(Boolean).join('\n');

        const generalPayload = {
          project_id: targetProjectId,
          client: clientVal,
          code: codeVal,
          location: locationVal,
          department: department || existingGeneral?.department || 'Antioquia',
          city: city || existingGeneral?.city || 'Medellín',
          scope: existingGeneral?.scope || 'Diseño y Coordinación Técnica BIM Revit',
          typology: existingGeneral?.typology || 'Edificación / Infraestructura',
          additional_info: additionalNotes,
          updated_at: new Date().toISOString()
        };

        if (computedBuiltArea > 0) {
          generalPayload.built_area = parseFloat(computedBuiltArea.toFixed(2));
        }
        if (computedCirculationArea > 0) {
          generalPayload.circulation_area = parseFloat(computedCirculationArea.toFixed(2));
        }

        // Upsert en project_general_info
        const { error: genErr } = await supabase
          .from('project_general_info')
          .upsert(generalPayload, { onConflict: 'project_id' });

        if (genErr) {
          console.warn('Error al actualizar project_general_info:', genErr);
        } else {
          summaryReport.generalInfoUpdated = true;
        }

        // Actualizar projects si la descripción está vacía
        const { data: projData } = await supabase
          .from('projects')
          .select('description')
          .eq('id', targetProjectId)
          .single();

        if (projData && (!projData.description || projData.description.trim() === '')) {
          await supabase
            .from('projects')
            .update({
              description: `Modelo Revit ${exportRecord.project_name || ''} (#${exportRecord.project_number || '1/1'}) sincronizado desde Plugin.`
            })
            .eq('id', targetProjectId);
        }
      } catch (err) {
        console.error('Error adoptando Información General:', err);
      }
    }

    // ---------------------------------------------------------
    // 2. SINCRONIZAR NIVELES (project_levels)
    // ---------------------------------------------------------
    const levelNameToIdMap = new Map();

    if (syncLevels && Array.isArray(exportRecord.levels) && exportRecord.levels.length > 0) {
      try {
        // Consultar niveles existentes en el proyecto
        const { data: existingLevels, error: fetchLvlErr } = await supabase
          .from('project_levels')
          .select('id, nombre, elevacion')
          .eq('project_id', targetProjectId);

        if (!fetchLvlErr && existingLevels) {
          existingLevels.forEach(lvl => {
            if (lvl.nombre) levelNameToIdMap.set(lvl.nombre.trim().toLowerCase(), lvl.id);
          });
        }

        for (const revitLvl of exportRecord.levels) {
          const lvlName = revitLvl.name?.trim() || `Nivel ${revitLvl.id}`;
          const normName = lvlName.toLowerCase();
          const elevM = typeof revitLvl.elevation_m === 'number' ? revitLvl.elevation_m : 0;
          const elevFormatted = `${elevM >= 0 ? '+' : ''}${elevM.toFixed(2)}m`;
          const desc = `Nivel sincronizado desde Revit (ID: ${revitLvl.id})`;

          if (levelNameToIdMap.has(normName)) {
            // Nivel ya existe, actualizar elevación y descripción
            const existingId = levelNameToIdMap.get(normName);
            await supabase
              .from('project_levels')
              .update({
                elevacion: elevFormatted,
                descripcion: desc,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingId);
            summaryReport.levelsUpdated++;
          } else {
            // Insertar nuevo nivel
            const { data: inserted, error: insertErr } = await supabase
              .from('project_levels')
              .insert([{
                project_id: targetProjectId,
                nombre: lvlName,
                elevacion: elevFormatted,
                descripcion: desc
              }])
              .select('id, nombre');

            if (!insertErr && inserted && inserted.length > 0) {
              levelNameToIdMap.set(normName, inserted[0].id);
              summaryReport.levelsAdded++;
            }
          }
        }
      } catch (err) {
        console.error('Error adoptando niveles:', err);
      }
    }

    // ---------------------------------------------------------
    // 3. SINCRONIZAR HABITACIONES / ÁREAS (project_area_details)
    // ---------------------------------------------------------
    const allRooms = Array.isArray(exportRecord.rooms) && exportRecord.rooms.length > 0 
      ? exportRecord.rooms 
      : (Array.isArray(exportRecord.project_info?.rooms) ? exportRecord.project_info.rooms : []);

    if (syncRooms && allRooms.length > 0) {
      try {
        // Consultar áreas existentes para evitar duplicados exactos
        const { data: existingAreas } = await supabase
          .from('project_area_details')
          .select('id, name, level_id')
          .eq('project_id', targetProjectId);

        const existingAreaKeys = new Set(
          (existingAreas || []).map(a => `${(a.name || '').trim().toLowerCase()}_${a.level_id || 'none'}`)
        );

        for (const rm of allRooms) {
          const roomName = rm.name?.trim() || `Habitación ${rm.number || rm.id}`;
          const roomLevelName = (rm.level || '').trim().toLowerCase();
          const matchedLevelId = levelNameToIdMap.get(roomLevelName) || null;
          const areaKey = `${roomName.toLowerCase()}_${matchedLevelId || 'none'}`;

          if (!existingAreaKeys.has(areaKey)) {
            const { error: areaErr } = await supabase
              .from('project_area_details')
              .insert([{
                project_id: targetProjectId,
                level_id: matchedLevelId,
                context_type: 'GENERAL',
                name: roomName,
                usage_type: roomName,
                built_area: parseFloat((Number(rm.area_m2) || 0).toFixed(2)),
                uncovered_area: 0
              }]);

            if (!areaErr) {
              existingAreaKeys.add(areaKey);
              summaryReport.roomsAdded++;
            }
          }
        }
      } catch (err) {
        console.error('Error adoptando áreas y habitaciones:', err);
      }
    }

    // ---------------------------------------------------------
    // 4. SINCRONIZAR MATERIALES (Materiales)
    // ---------------------------------------------------------
    if (syncMaterials && Array.isArray(exportRecord.materials) && exportRecord.materials.length > 0) {
      try {
        // Consultar materiales existentes del proyecto
        const { data: existingMats } = await supabase
          .from('Materiales')
          .select('id, Nombre')
          .eq('project_id', targetProjectId);

        const existingNames = new Set(
          (existingMats || []).map(m => (m.Nombre || '').trim().toLowerCase())
        );

        const newMaterials = [];
        for (const mat of exportRecord.materials) {
          const matName = (mat.name || '').trim();
          if (!matName) continue;
          if (existingNames.has(matName.toLowerCase())) continue;

          existingNames.add(matName.toLowerCase());
          newMaterials.push({
            project_id: targetProjectId,
            Nombre: matName,
            categoria: mat.category || 'Revit',
            tipo: 'Material Revit',
            acabado: mat.color_rgb ? `RGB(${mat.color_rgb})` : null,
            notas: `ID Revit: ${mat.id}`
          });
        }

        // Insertar por lotes de 50
        const batchSize = 50;
        for (let i = 0; i < newMaterials.length; i += batchSize) {
          const chunk = newMaterials.slice(i, i + batchSize);
          const { error: matErr } = await supabase
            .from('Materiales')
            .insert(chunk);

          if (!matErr) {
            summaryReport.materialsAdded += chunk.length;
          } else {
            console.warn('Error insertando lote de materiales:', matErr);
          }
        }
      } catch (err) {
        console.error('Error adoptando materiales:', err);
      }
    }

    // ---------------------------------------------------------
    // 5. VINCULAR LA RECEPCIÓN AL PROYECTO
    // ---------------------------------------------------------
    try {
      await this.assignProjectToExport(exportRecord.id, targetProjectId, targetProjectName);
      summaryReport.assigned = true;
    } catch (err) {
      console.error('Error al actualizar enlace de asignación:', err);
    }

    return summaryReport;
  }
};
