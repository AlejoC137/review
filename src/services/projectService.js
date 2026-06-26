import { supabase } from './supabaseClient';

/**
 * Servicio centralizado para la gestión de funcionalidades de Proyecto
 * Basado en la estructura REFS integrada.
 */
export const projectService = {
  // --- GESTIÓN DE SUB-PROYECTOS (CASAS/UNIDADES) ---
  async getSpaces(projectId) {
    const { data, error } = await supabase
      .from('subProjects')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  },

  async createSpace(spaceData) {
    const payload = {
      name: spaceData.name,
      responsable: spaceData.responsable || spaceData.responsible || null,
      Datos: spaceData.description || spaceData.Datos || null,
      espacios: spaceData.espacios || [],
      Tasks: spaceData.Tasks || []
    };

    const { data, error } = await supabase
      .from('subProjects')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateSpace(spaceId, updates) {
    const payload = { ...updates };
    if (updates.responsible) {
      payload.responsable = updates.responsible;
      delete payload.responsible;
    }
    if (updates.description) {
      payload.Datos = updates.description;
      delete payload.description;
    }
    
    // Eliminamos finished si viene accidentalmente
    delete payload.finished;

    const { data, error } = await supabase
      .from('subProjects')
      .update(payload)
      .eq('id', spaceId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteSpace(spaceId) {
    const { error } = await supabase
      .from('subProjects')
      .delete()
      .eq('id', spaceId);
    if (error) throw error;
    return true;
  },

  // --- GESTIÓN DE ROLES ---
  async getRoles() {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data;
  },

  async createRole(roleData) {
    const { data, error } = await supabase
      .from('roles')
      .insert([roleData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateRole(roleId, updates) {
    const { data, error } = await supabase
      .from('roles')
      .update(updates)
      .eq('id', roleId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteRole(roleId) {
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', roleId);
    if (error) throw error;
    return true;
  },

  // ==================== SPECIALTIES ====================
  async getSpecialties(projectId) {
    let query = supabase.from('specialties').select('*');
    if (projectId) {
      // Fetch both project-specific AND global specialties (where project_id is null)
      query = query.or(`project_id.eq.${projectId},project_id.is.null`);
    } else {
      // Solo globales
      query = query.is('project_id', null);
    }
    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;
    return data;
  },

  async createSpecialty(specialtyData) {
    const { data, error } = await supabase
      .from('specialties')
      .insert([specialtyData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateSpecialty(id, specialtyData) {
    const { data, error } = await supabase
      .from('specialties')
      .update(specialtyData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteSpecialty(id) {
    const { error } = await supabase
      .from('specialties')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // ==================== STAFF (TEAM) ====================---
  async getStaff() {
    const { data, error } = await supabase
      .from('staff')
      .select('*');

    if (error) throw error;

    return (data || []).sort((a, b) => {
      const nameA = (a.name || a.nombre || '').toLowerCase();
      const nameB = (b.name || b.nombre || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  },

  async createStaff(staffData) {
    const { data, error } = await supabase
      .from('staff')
      .insert([staffData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateStaff(staffId, updates) {
    const { data, error } = await supabase
      .from('staff')
      .update(updates)
      .eq('id', staffId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteStaff(staffId) {
    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', staffId);
    if (error) throw error;
    return true;
  },

  // --- GESTIÓN DE TAREAS OPERATIVAS ---
  async getTasks(projectId = null, staffId = null) {
    let query = supabase
      .from('tasks')
      .select('*, staff(*), subProjects(*)');

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (staffId) {
      query = query.eq('staff_id', staffId);
    }

    const { data, error } = await query.order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  async getTasksBySpace(spaceId) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, staff(*)')
      .or(`subproject_id.eq.${spaceId},espacio_uuid.eq.${spaceId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createTask(taskData) {
    const { data, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateTask(taskId, updates) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteTask(taskId) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
    if (error) throw error;
    return true;
  },

  async getTaskById(taskId) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, staff(*), subProjects(*)')
      .eq('id', taskId)
      .single();
    if (error) throw error;
    return data;
  },

  // --- GESTIÓN DE ACCIONES (SUB-TAREAS) ---
  async getTaskActions(taskId) {
    const { data, error } = await supabase
      .from('actions')
      .select('*')
      .eq('task_id', taskId)
      .order('order', { ascending: true });
    if (error) throw error;
    return data;
  },

  async createAction(actionData) {
    const { data, error } = await supabase
      .from('actions')
      .insert([actionData])
      .select();
    if (error) throw error;
    return data;
  },

  async updateAction(actionId, updates) {
    const { data, error } = await supabase
      .from('actions')
      .update(updates)
      .eq('id', actionId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // --- CENTRO DE LLAMADOS (INCIDENTES) ---
  async getIncidents(projectId) {
    const { data, error } = await supabase
      .from('incidents')
      .select('*, reporter:staff(name)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createIncident(incidentData) {
    const { data, error } = await supabase
      .from('incidents')
      .insert([incidentData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getProtocols(projectId) {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('project_id', projectId)
      .eq('category', 'Protocolo')
      .order('title', { ascending: true });
    if (error) throw error;
    return data;
  },

  // --- REQUISITOS DE INFORMACIÓN ---
  async getInformationRequirements(projectId) {
    // If projectId is provided, fetch project specific OR global ones.
    // Assuming global ones have project_id IS NULL
    let query = supabase
      .from('information_requirements')
      .select('*');
      
    if (projectId) {
      query = query.or(`project_id.eq.${projectId},project_id.is.null`);
    } else {
      query = query.is('project_id', null);
    }

    const { data, error } = await query.order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  async createInformationRequirement(reqData) {
    const { data, error } = await supabase
      .from('information_requirements')
      .insert([reqData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateInformationRequirement(id, updates) {
    const { data, error } = await supabase
      .from('information_requirements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteInformationRequirement(id) {
    const { error } = await supabase
      .from('information_requirements')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // --- DIRECTORIO EXTERNO ---
  async getDirectoryContacts(projectId) {
    let query = supabase
      .from('directory_contacts')
      .select('*');
      
    if (projectId) {
      query = query.or(`project_id.eq.${projectId},project_id.is.null`);
    } else {
      query = query.is('project_id', null);
    }

    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;
    return data;
  },

  async createDirectoryContact(contactData) {
    const { data, error } = await supabase
      .from('directory_contacts')
      .insert([contactData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateDirectoryContact(id, updates) {
    const { data, error } = await supabase
      .from('directory_contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteDirectoryContact(id) {
    const { error } = await supabase
      .from('directory_contacts')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // --- CATALOGOS Y CONFIGURACIÓN ---
  async getStages() {
    const { data, error } = await supabase
      .from('Stage')
      .select('*');

    if (error) throw error;

    return (data || []).sort((a, b) => {
      const nameA = (a.name || a.nombre || '').toLowerCase();
      const nameB = (b.name || b.nombre || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  },

  async getProjects() {
    let query = supabase.from('projects').select('*');
    if (localStorage.getItem('isDemo') === 'true') {
      query = query.ilike('name', '%demo%');
    }
    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;
    return data;
  },

  async getProjectById(projectId) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    if (error) throw error;
    
    if (localStorage.getItem('isDemo') === 'true' && !data.name.toLowerCase().includes('demo')) {
      throw new Error('Acceso denegado: El Modo Demo solo permite ver proyectos de prueba.');
    }
    
    return data;
  },

  // --- MATRIZ LOD Y TDI ---
  async getLodTdiMatrix(projectId) {
    const { data, error } = await supabase
      .from('project_element_lod_tdi')
      .select('*')
      .eq('project_id', projectId);
    if (error) throw error;
    return data;
  },

  async saveLodTdiElement(projectId, discipline, elementName, lod, tdi, notes) {
    const payload = {
      project_id: projectId,
      discipline,
      element_name: elementName,
      lod,
      tdi,
      notes,
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase
      .from('project_element_lod_tdi')
      .upsert(payload, { onConflict: 'project_id,discipline,element_name' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async saveLodTdiMatrixBatch(projectId, elements) {
    const payload = elements.map(el => ({
      project_id: projectId,
      discipline: el.discipline,
      element_name: el.element_name,
      lod: el.lod,
      tdi: el.tdi,
      notes: el.notes || '',
      updated_at: new Date().toISOString()
    }));
    const { data, error } = await supabase
      .from('project_element_lod_tdi')
      .upsert(payload, { onConflict: 'project_id,discipline,element_name' })
      .select();
    if (error) throw error;
    return data;
  },

  async deleteLodTdiElement(projectId, discipline, elementName) {
    const { error } = await supabase
      .from('project_element_lod_tdi')
      .delete()
      .eq('project_id', projectId)
      .eq('discipline', discipline)
      .eq('element_name', elementName);
    if (error) throw error;
    return true;
  },

  async updateLodTdiElementName(projectId, oldDiscipline, oldElementName, newDiscipline, newElementName) {
    // Since discipline and element_name might be part of the PK, updating them might require a targeted update.
    const { data, error } = await supabase
      .from('project_element_lod_tdi')
      .update({
        discipline: newDiscipline,
        element_name: newElementName,
        updated_at: new Date().toISOString()
      })
      .eq('project_id', projectId)
      .eq('discipline', oldDiscipline)
      .eq('element_name', oldElementName)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // --- GESTIÓN DE ROLES Y EQUIPO DEL PEB ---
  async getBepTeam(projectId) {
    const { data, error } = await supabase
      .from('bep_team')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  async createBepRole(bepRoleData) {
    const { data, error } = await supabase
      .from('bep_team')
      .insert([bepRoleData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateBepRole(roleId, updates) {
    const { data, error } = await supabase
      .from('bep_team')
      .update(updates)
      .eq('id', roleId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteBepRole(roleId) {
    const { error } = await supabase
      .from('bep_team')
      .delete()
      .eq('id', roleId);
    if (error) throw error;
    return true;
  },

  async deleteAction(actionId) {
    const { error } = await supabase
      .from('actions')
      .delete()
      .eq('id', actionId);
    if (error) throw error;
    return true;
  }
};
