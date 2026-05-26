# Contexto Maestro De Base De Datos (PostgreSQL / Supabase)

**FUENTE DE VERDAD ACTUALIZADA: Diciembre 2025**
Este esquema describe la estructura relacional actual.

---

## 1. Tablas Principales (Core)

### Tabla: Tareas (public."Tareas")
La tabla central de gestión.
*Nota: Cuidado con el Casing (Mayúsculas/Minúsculas) en las columnas.*
- `id` (uuid): PK.
- `project_id` (uuid): FK -> Proyectos.
- `staff_id` (uuid): FK -> Staff.
- `stage_id` (uuid): FK -> Stage.
- `espacio_uuid` (uuid): FK -> Espacio_Elemento._id.
- `task_description` (text): Descripción principal.
- `finished` (text): Ej: 'Pendiente', 'completed', 'En Progreso'.
- `fecha_inicio` (date): YYYY-MM-DD.
- `fecha_fin_estimada` (date): Due Date.
- `fecha_deadline` (date): Fecha límite estricta.
- `Progress` (text/numeric): Porcentaje de avance (0-100). **(CamelCase)**
- `Priority` (text): 'Alta', 'Media', 'Baja'. **(CamelCase)**
- `RonaldPass` (bool/text): Aprobación de Ronald.
- `WietPass` (bool/text): Aprobación de Wiet.
- `entregableType` (text): Tipo de entregable asociado.
- `notes` (text): Observaciones generales.

### Tabla: Acciones (public."Acciones")
Desglose atómico de las Tareas (Sub-tareas).
- `id` (uuid): PK.
- `task_id` (uuid): FK -> Tareas.id.
- `description` (text).
- `fecha_ejecucion` (date).
- `executor_id` (text).
- `completed` (bool).

### Tabla: Proyectos (public."Proyectos")
- `id` (uuid): PK.
- `name` (text).
- `responsable` (uuid): FK -> Staff.id.
- `finished` (uuid): FK? (Type is UUID in DB).
- `Datos` (jsonb): **Columna JSON Crítica**. Contiene configuración de Canva y materiales constantes.
- `espacios` (jsonb): Lista de IDs de espacios relacionados (opcional).
- `Tasks` (text/json): Resúmenes o snapshots.

---

## 2. Inventario y Costos (Nuevas Tablas)

### Tabla: Materiales (public."Materiales")
Base de datos maestra de items constructivos.
- `id` (uuid): PK.
- `Nombre` (text): Nombre comercial.
- `tipo` (text): Ej: 'Perfiles Metalicos', 'MELAMINA MDF', 'PINTURA'.
- `categoria` (text): Subcategoría.
- `precio_COP` (numeric): Costo unitario.
- `unidad` (text): Unidad de medida.
- `stock` (numeric).
- `proveedor` (text).
- `foto_url` (text).
- `dimensiones` (varias columnas): `alto_mm`, `ancho_mm`, `espesor_mm`, `largo_m`.

### Tabla: Espacio_Elemento (public."Espacio_Elemento")
Define los lugares o muebles del proyecto.
- `_id` (uuid): PK (**Nota: empieza con guion bajo**).
- `nombre` (text): Ej: 'Habitación', 'Cocina'.
- `apellido` (text): Ej: 'Principal', 'Auxiliar'.
- `tipo` (text): 'Espacio' o 'Elemento'.
- `piso` (text): Nivel del espacio.
- `proyecto` (text): Proyecto al que pertenece.

### Tabla: Componentes (public."Componentes")
Catálogo de componentes arquitectónicos reutilizables.
- `id` (uuid): PK.
- `nombre` (text): Nombre del componente (Ej: 'Zócalo', 'Ventana', 'Puerta').
- `acabado` (text): Tipo de acabado.
- `construcción` (text): Método de construcción.
- `description` (text): Descripción detallada.
- `espacio_elemento` (text): Tipo de espacio donde se usa.

### Tabla: Instancias_Componentes (public."Instancias_Componentes")
Tabla pivote: Qué materiales hay en qué espacio.
- `id` (uuid): PK.
- `espacio_id` (uuid): FK -> Espacio_Elemento._id.
- `componente_id` (uuid): FK -> Materiales.id (o Componentes).
- `cantidad` (numeric).
- `estado` (text).

---

## 3. Tablas de Soporte y RRHH

### Tabla: Staff (public."Staff")
Equipo de trabajo interno.
- `id` (uuid): PK.
- `name` (text): Nombre del miembro del equipo.
- `role_description` (text): Descripción del rol.
- `email` (text): Correo electrónico (opcional).
- `telefono` (text): Teléfono de contacto (opcional).
- `tasks` (jsonb): Tareas asignadas (legacy).

### Tabla: Directorio (public."Directorio")
Directorio de contactos externos (proveedores, contratistas, etc.).
- `id` (uuid): PK.
- `Nombre` (text): Nombre del contacto.
- `Contacto` (text): Teléfono o email.
- `Cargo` (text): Rol o especialidad.

### Tabla: Stage (public."Stage")
Etapas del proceso constructivo.
- `id` (uuid): PK.
- `name` (text): Ej: 'Idea Basica', 'Desarrollo Técnico'.
- `deliverables` (text): Lista de entregables esperados.

### Tabla: Protocolos (public."Protocolos")
Base de conocimiento.
- `id` (uuid): PK.
- `Nombre` (text).
- `Contenido` (text): Markdown con las reglas.
- `Categoria` (text).

---

## 4. Relaciones Clave para Joins
1. **Tareas Completas:** `Tareas` JOIN `Proyectos` JOIN `Staff` JOIN `Stage`.
2. **Materiales por Espacio:** `Espacio_Elemento` JOIN `Instancias_Componentes` JOIN `Materiales`.
3. **Componentes en Espacios:** `Espacio_Elemento` JOIN `Instancias_Componentes` JOIN `Componentes`.

---

## 5. Propiedades Editables por Tabla

### Tareas
**Editables:**
- `task_description`, `finished`, `notes`, `entregableType`
- `fecha_inicio`, `fecha_fin_estimada`, `fecha_deadline`
- `Progress`, `Priority`
- `RonaldPass`, `WietPass`
- `project_id`, `staff_id`, `stage_id`, `espacio_uuid`

**No editables:** `id`

### Materiales
**Editables:**
- `Nombre`, `tipo`, `categoria`
- `precio_COP`, `precio_por_m2`, `unidad`, `stock`
- `proveedor`, `foto_url`
- `alto_mm`, `ancho_mm`, `espesor_mm`, `largo_m`, `area_mm2`, `peso_kg_m`
- `acabado`, `observaciones_tecnicas`

**No editables:** `id`

### Staff
**Editables:**
- `name`, `role_description`
- `email`, `telefono`

**No editables:** `id`, `tasks` (legacy)

### Componentes
**Editables:**
- `nombre`, `acabado`, `construcción`
- `description`, `espacio_elemento`

**No editables:** `id`

### Espacio_Elemento
**Editables:**
- `nombre`, `apellido`, `tipo`
- `piso`, `proyecto`

**No editables:** `_id`

### Instancias_Componentes
**Editables:**
- `cantidad`, `estado`, `notas`
- `especificaciones_tecnicas`

**No editables:** `id`, `espacio_id`, `componente_id`

### Directorio
**Editables:**
- `Nombre`, `Contacto`, `Cargo`

**No editables:** `id`

### Protocolos
**Editables:**
- `Nombre`, `Contenido`, `Categoria`
- `Editor`, `FechaUpdate`

**No editables:** `id`