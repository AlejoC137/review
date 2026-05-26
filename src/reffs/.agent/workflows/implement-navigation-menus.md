---
description: Plan de implementación de menús de navegación
---

# Plan de Implementación: Menús de Navegación Superior

## Análisis de la Imagen

Basado en la imagen proporcionada, necesitamos implementar los siguientes menús en la barra superior:

1. **mes** / **semanal** - Toggle para vista mensual/semanal del calendario
2. **espacios** (con sub-menú: componentes) - Gestión de espacios y componentes
3. **casas** / **parcelacion** - Toggle para vista de casas/parcelación
4. **Equipo** (con sub-menú: protocolos) - Gestión de equipo y protocolos
5. **materiales** - Gestión de materiales
6. **directorio** - Directorio general

## Objetivos Adicionales

- **Responsable de Tarea**: Debe ser un selector de la lista de staff (no texto libre)
- **Botón Eliminar**: Agregar botón de eliminar en el editor de tareas

---

## FASE 1: Crear Componente de Navegación Superior

### Paso 1.1: Crear TopNavigation Component
**Archivo**: `src/components/CommandCenter/TopNavigation.jsx`

**Funcionalidad**:
- Barra horizontal con pestañas
- Soporte para sub-menús desplegables
- Estado activo visual (fondo azul)
- Responsive

**Estructura**:
```jsx
const navigationTabs = [
  {
    id: 'calendar-view',
    type: 'toggle',
    options: [
      { label: 'mes', value: 'month' },
      { label: 'semanal', value: 'week' }
    ]
  },
  {
    id: 'spaces',
    label: 'espacios',
    type: 'menu',
    subItems: [
      { label: 'componentes', value: 'components' }
    ]
  },
  {
    id: 'properties',
    type: 'toggle',
    options: [
      { label: 'casas', value: 'houses' },
      { label: 'parcelacion', value: 'parcels' }
    ]
  },
  {
    id: 'team',
    label: 'Equipo',
    type: 'menu',
    subItems: [
      { label: 'protocolos', value: 'protocols' }
    ]
  },
  {
    id: 'materials',
    label: 'materiales',
    type: 'link'
  },
  {
    id: 'directory',
    label: 'directorio',
    type: 'link'
  }
];
```

### Paso 1.2: Integrar en CommandCenter
**Archivo**: `src/components/CommandCenter/CommandCenter.jsx`

- Importar `TopNavigation`
- Colocar arriba del calendario
- Conectar con Redux para estado global

---

## FASE 2: Implementar Redux State para Navegación

### Paso 2.1: Actualizar appReducer
**Archivo**: `src/store/reducers/appReducer.js`

**Agregar al estado**:
```javascript
{
  navigation: {
    calendarView: 'week', // 'week' | 'month'
    activeSpace: null,
    propertyView: 'houses', // 'houses' | 'parcels'
    activeTeamView: null,
    activeMaterial: null,
    activeDirectory: null
  }
}
```

### Paso 2.2: Crear Action Creators
**Archivo**: `src/store/actions/appActions.js`

**Acciones**:
- `setCalendarView(view)`
- `setActiveSpace(spaceId)`
- `setPropertyView(view)`
- `setActiveTeamView(view)`
- etc.

---

## FASE 3: Vista Mensual del Calendario

### Paso 3.1: Crear MonthlyCalendar Component
**Archivo**: `src/components/CommandCenter/MonthlyCalendar.jsx`

**Funcionalidad**:
- Grid de 7 columnas × 5-6 filas (mes completo)
- Mostrar tareas agrupadas por día
- Click en día para ver detalles
- Navegación mes anterior/siguiente

### Paso 3.2: Actualizar WeeklyCalendar
**Archivo**: `src/components/CommandCenter/WeeklyCalendar.jsx`

- Mantener funcionalidad actual
- Agregar prop para alternar entre vistas

### Paso 3.3: Crear CalendarContainer
**Archivo**: `src/components/CommandCenter/CalendarContainer.jsx`

- Wrapper que decide qué vista mostrar
- Lee `navigation.calendarView` de Redux
- Renderiza `WeeklyCalendar` o `MonthlyCalendar`

---

## FASE 4: Gestión de Espacios y Componentes

### Paso 4.1: Crear SpacesView Component
**Archivo**: `src/components/CommandCenter/SpacesView.jsx`

**Funcionalidad**:
- Lista de todos los espacios (Espacio_Elemento)
- Click en espacio para ver detalles
- Filtros por tipo (Espacio/Elemento)
- Búsqueda

### Paso 4.2: Crear ComponentsView Component
**Archivo**: `src/components/CommandCenter/ComponentsView.jsx`

**Funcionalidad**:
- Lista de componentes del espacio seleccionado
- CRUD de componentes
- Estados de componentes
- Cantidades y notas

### Paso 4.3: Integrar con Panel Lateral
- Mostrar en panel lateral cuando se selecciona "espacios"
- Sub-menú para alternar entre vista de espacios y componentes

---

## FASE 5: Vista de Casas/Parcelación

### Paso 5.1: Crear HousesView Component
**Archivo**: `src/components/CommandCenter/HousesView.jsx`

**Funcionalidad**:
- Grid/lista de casas del proyecto
- Información de cada casa
- Tareas asociadas a cada casa
- Progreso por casa

### Paso 5.2: Crear ParcelsView Component
**Archivo**: `src/components/CommandCenter/ParcelsView.jsx`

**Funcionalidad**:
- Vista de parcelación
- Lotes/parcelas
- Estado de cada parcela
- Asignaciones

---

## FASE 6: Gestión de Equipo y Protocolos

### Paso 6.1: Crear TeamView Component
**Archivo**: `src/components/CommandCenter/TeamView.jsx`

**Funcionalidad**:
- Lista de miembros del equipo (Staffers)
- CRUD de staff
- Asignación de tareas por persona
- Carga de trabajo

### Paso 6.2: Crear ProtocolsView Component
**Archivo**: `src/components/CommandCenter/ProtocolsView.jsx`

**Funcionalidad**:
- Lista de protocolos/procedimientos
- Documentación de procesos
- Checklists
- Plantillas

### Paso 6.3: Actualizar Selector de Responsable en Tareas

**Archivo**: `src/components/CommandCenter/ActionInspectorPanel.jsx`

**Cambios en FullActionRow**:
```jsx
// Cambiar de input text a select
<select
  value={action.executor_id || ''}
  onChange={(e) => onChange('executor_id', e.target.value)}
  className="w-20 text-[10px] bg-gray-50 border border-gray-200 rounded px-1 py-0.5"
>
  <option value="">-</option>
  {staffers.map(s => (
    <option key={s.id} value={s.nombre}>{s.nombre}</option>
  ))}
</select>
```

**Cargar staffers**:
- Usar `getStaffers()` de `spacesService.js`
- Almacenar en estado local del componente
- Cargar en `useEffect`

---

## FASE 7: Gestión de Materiales

### Paso 7.1: Crear MaterialsView Component
**Archivo**: `src/components/CommandCenter/MaterialsView.jsx`

**Funcionalidad**:
- Lista de materiales
- CRUD de materiales
- Inventario
- Proveedores
- Costos

### Paso 7.2: Crear MaterialsService
**Archivo**: `src/services/materialsService.js`

**Funciones**:
- `getMaterials()`
- `createMaterial(data)`
- `updateMaterial(id, data)`
- `deleteMaterial(id)`

---

## FASE 8: Directorio

### Paso 8.1: Crear DirectoryView Component
**Archivo**: `src/components/CommandCenter/DirectoryView.jsx`

**Funcionalidad**:
- Directorio de contactos
- Proveedores
- Clientes
- Contratistas
- Información de contacto

### Paso 8.2: Crear DirectoryService
**Archivo**: `src/services/directoryService.js`

**Funciones**:
- `getContacts()`
- `createContact(data)`
- `updateContact(id, data)`
- `deleteContact(id)`

---

## FASE 9: Mejorar Editor de Tareas

### Paso 9.1: Agregar Botón Eliminar Tarea

**Archivo**: `src/components/CommandCenter/ActionInspectorPanel.jsx`

**Ubicación**: Header del panel cuando `panelMode === 'task'`

```jsx
{panelMode === 'task' && (
  <button
    onClick={handleDeleteTask}
    className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-colors"
  >
    <Trash2 size={12} />
    Eliminar Tarea
  </button>
)}
```

**Función**:
```javascript
const handleDeleteTask = async () => {
  if (!confirm('¿Eliminar esta tarea y todas sus acciones?')) return;
  
  try {
    await deleteTask(selectedTask.id);
    dispatch(clearSelection());
    if (onActionUpdated) onActionUpdated();
  } catch (error) {
    alert('Error al eliminar: ' + error.message);
  }
};
```

### Paso 9.2: Crear deleteTask en tasksService

**Archivo**: `src/services/tasksService.js`

```javascript
export const deleteTask = async (taskId) => {
  // Primero eliminar todas las acciones asociadas
  await supabase
    .from('Acciones')
    .delete()
    .eq('task_id', taskId);
  
  // Luego eliminar la tarea
  const { error } = await supabase
    .from('Tareas')
    .delete()
    .eq('id', taskId);
  
  if (error) throw error;
};
```

---

## FASE 10: Estilos y Pulido

### Paso 10.1: Estilos de TopNavigation
- Fondo azul para tabs activos
- Hover effects
- Transiciones suaves
- Sub-menús desplegables con animación

### Paso 10.2: Responsive Design
- Mobile: Menú hamburguesa
- Tablet: Menú colapsable
- Desktop: Menú completo

### Paso 10.3: Iconos
- Agregar iconos de Lucide para cada sección
- Consistencia visual

---

## order DE IMPLEMENTACIÓN RECOMENDADO

1. ✅ **FASE 9**: Mejorar Editor de Tareas (botón eliminar + selector staff) - **PRIORIDAD ALTA**
2. ✅ **FASE 1**: Crear TopNavigation Component
3. ✅ **FASE 2**: Redux State para Navegación
4. ✅ **FASE 3**: Vista Mensual del Calendario
5. ✅ **FASE 6.1**: TeamView (necesario para selector de staff)
6. ✅ **FASE 4**: Gestión de Espacios y Componentes
7. ✅ **FASE 5**: Vista de Casas/Parcelación
8. ✅ **FASE 6.2**: Protocolos
9. ✅ **FASE 7**: Gestión de Materiales
10. ✅ **FASE 8**: Directorio
11. ✅ **FASE 10**: Estilos y Pulido

---

## NOTAS TÉCNICAS

### Tablas de Base de Datos Necesarias

Verificar/crear:
- ✅ `Tareas` (existe)
- ✅ `Acciones` (existe)
- ✅ `Espacio_Elemento` (existe)
- ✅ `Proyectos` (existe)
- ❓ `Staffers` (verificar si existe, sino usar ejecutores únicos de Acciones)
- ❓ `Materiales` (crear si no existe)
- ❓ `Directorio` (crear si no existe)
- ❓ `Protocolos` (crear si no existe)
- ❓ `Casas` (verificar estructura)
- ❓ `Parcelas` (verificar estructura)

### Dependencias Adicionales

Posiblemente necesarias:
- `framer-motion` (para animaciones de menús)
- Ya instaladas: `lucide-react`, `date-fns`, `react-redux`

---

## CHECKLIST DE VALIDACIÓN

Antes de considerar completa cada fase:

- [ ] Componente creado y funcional
- [ ] Integrado con Redux
- [ ] Servicios de API implementados
- [ ] Manejo de errores
- [ ] Loading states
- [ ] Responsive design
- [ ] Accesibilidad básica
- [ ] Documentación de código

---

**Fecha de Creación**: 2025-12-17
**Última Actualización**: 2025-12-17
