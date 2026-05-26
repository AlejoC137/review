/**
 * ARCHIVO: src/types/custom-schema.ts
 * Definiciones de tipos TypeScript para Supabase y columnas JSON.
 * Basado en Snapshot SQL de Diciembre 2025.
 */

// ==========================================
// 1. TIPOS PARA COLUMNAS JSON (Proyectos)
// ==========================================

export interface ProjectData {
    etapa: string;
    materialesConstantes: Array<{
        categoria: string;
        nombre: string;
        observaciones: string;
        materialId?: string; // Opcional
    }>;
    presentacionesEspacio: Array<{
        espacio: string;
        link: string; // Links a Canva
        fechaActualizacion: string;
    }>;
    tareas?: any[]; // Legacy
}

// ==========================================
// 2. DEFINICIONES DE TABLAS (SUPABASE ROWS)
// ==========================================

export interface TareaRow {
    id: string; // uuid
    project_id: string;
    staff_id?: string;
    stage_id?: string;
    espacio_uuid?: string;

    // Campos de Texto
    task_description: string;
    finished: 'Pendiente' | 'En Progreso' | 'completed' | 'En Revisión' | 'En Discusión';
    notes?: string;
    entregableType?: string;

    // Fechas (YYYY-MM-DD)
    fecha_inicio?: string;
    fecha_fin_estimada?: string;
    fecha_deadline?: string;

    // Campos con Casing Especial (Respetar mayúsculas)
    Progress?: string | number;
    Priority?: 'Alta' | 'Media' | 'Baja';
    RonaldPass?: boolean | string;
    WietPass?: boolean | string;
}

export interface AccionRow {
    id: string;
    task_id: string;
    description: string;
    fecha_ejecucion?: string;
    executor_id?: string;
    completed: boolean;
}

export interface MaterialRow {
    id: string;
    Nombre: string; // Mayúscula en DB
    tipo: string;
    categoria?: string;
    precio_COP?: number;
    precio_por_m2?: number;
    unidad?: string;
    stock?: number;
    proveedor?: string;
    foto_url?: string;

    // Dimensiones
    alto_mm?: number;
    ancho_mm?: number;
    espesor_mm?: number;
    largo_m?: number;
    area_mm2?: number;
    peso_kg_m?: number;

    acabado?: string;
    observaciones_tecnicas?: string;
}

export interface EspacioElementoRow {
    _id: string; // Nota: tiene guion bajo
    nombre: string;
    apellido?: string; // Ej: 'Principal', 'Auxiliar'
    tipo: 'Espacio' | 'Elemento';
    piso?: string;
    proyecto?: string;
    // Editables: nombre, apellido, tipo, piso, proyecto
}

export interface InstanciaComponenteRow {
    id: string;
    espacio_id: string;
    componente_id: string;
    cantidad: number;
    estado?: string;
    notas?: string;
    especificaciones_tecnicas?: string;
    // Editables: cantidad, estado, notas, especificaciones_tecnicas
}

export interface StaffRow {
    id: string;
    name: string;
    role_description?: string;
    email?: string; // Contacto opcional
    telefono?: string; // Contacto opcional
    tasks?: any; // Legacy field
    // Editables: name, role_description, email, telefono
}

export interface ComponenteRow {
    id: string;
    nombre: string;
    acabado?: string;
    construcción?: string;
    description?: string;
    espacio_elemento?: string;
    // Editables: nombre, acabado, construcción, description, espacio_elemento
}

export interface DirectorioRow {
    id: string;
    Nombre: string; // Mayúscula en DB
    Contacto: string; // Teléfono o email
    Cargo: string; // Rol o especialidad
    // Editables: Nombre, Contacto, Cargo
}

export interface StageRow {
    id: string;
    name: string;
    description?: string;
    objectives?: string;
    deliverables?: string;
}

export interface ProtocoloRow {
    id: string;
    Nombre: string;
    Contenido: string; // Markdown
    Categoria?: string;
    Editor?: string;
    FechaUpdate?: string;
}