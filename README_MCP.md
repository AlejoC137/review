# Servidor MCP Integral de Review (BIM Revit + Supabase + Gestión BEP)

Servidor oficial que implementa el protocolo **Model Context Protocol (MCP)** sobre HTTP y SSE para conectar asistentes de Inteligencia Artificial (Claude Desktop, Cursor, Antigravity, etc.) con **todo el ecosistema de Review**, integrando los datos BIM extraídos desde Revit (`reviewPlugIn`), la base de datos de costos de **Supabase**, y todos los componentes de la aplicación web.

---

## 1. Arquitectura del Flujo

```
[ Revit + reviewPlugIn ]
        │ (Sincroniza elementos 3D, pisos, muros, steel deck, schedules, materiales)
        ▼
   [ Supabase ]
        │ (Tablas: plugin_project_data, Materiales, Espacio_Elemento, bep_team, etc.)
        ▼
[ Servidor MCP (api/mcp.js en Vercel) ]
        │ (Expone 23 herramientas JSON-RPC sobre HTTP/SSE)
        ▼
   [ Asistente IA ] ◄── Preguntas en lenguaje natural
```

---

## 2. Catálogo Completo de Herramientas MCP (23 Herramientas)

### 🧱 Cuantificación BIM y Modelado (`reviewPlugIn`)
| Herramienta | Parámetros | Descripción |
| :--- | :--- | :--- |
| `pisos_cuantificacion_consultar` | `project_id`, `agrupar_por` | Cuantifica pisos, baldosas y enchapes con áreas ($m^2$), materiales y costos cruzados. |
| `muros_cuantificacion_consultar` | `project_id`, `agrupar_por` | Cuantifica muros de mampostería, ladrillos y mortero con áreas ($m^2$), volúmenes ($m^3$) y costos. |
| `steel_deck_cuantificacion_consultar`| `project_id` | Cuantificación de entrepisos (lámina colaborante, concreto y malla). |
| `elementos_bim_consultar` | `project_id`, `categoria`, `limite` | Consulta universal de elementos BIM por categoría (Walls, Floors, Doors, Windows, Columns, etc.). |
| `tablas_planificacion_consultar` | `project_id`, `nombre_tabla` | Lee y consulta tablas de planificación (Schedules de Revit) sincronizadas. |
| `revit_sync_status` | `project_id` | Estado y metadatos de las exportaciones BIM recibidas desde Revit. |

### 🏢 Espacios, Áreas y Niveles Arquitectónicos
| Herramienta | Parámetros | Descripción |
| :--- | :--- | :--- |
| `espacios_consultar` | `project_id`, `nivel`, `categoria_uso` | Consulta recintos, habitaciones (rooms) y espacios arquitectónicos con sus áreas y acabados. |
| `areas_proyecto_consultar` | `project_id` | Cuadro integral de áreas del proyecto (construida, vendible, libre, curaduría, constructiva vs comercial). |
| `niveles_proyecto_consultar` | `project_id` | Niveles o pisos del edificio (cotas de elevación y alturas entre pisos). |

### 💰 Materiales y Presupuestos
| Herramienta | Parámetros | Descripción |
| :--- | :--- | :--- |
| `materiales_consultar` | `busqueda`, `categoria`, `project_id` | Catálogo maestro de materiales con especificaciones y precios ($m^2$ y COP). |
| `materiales_presupuestar` | `items` `[{ material, cantidad, unidad }]` | Genera una estimación presupuestal rápida cruzada con la base de datos oficial. |

### 🧩 Familias y Componentes BIM
| Herramienta | Parámetros | Descripción |
| :--- | :--- | :--- |
| `componentes_catalogo_consultar` | `categoria_revit`, `busqueda` | Catálogo de tipos de componentes y familias constructivas (`Catalogo_Componentes`). |

### 📋 Plan de Ejecución BIM (Pre-BEP / BEP)
| Herramienta | Parámetros | Descripción |
| :--- | :--- | :--- |
| `bep_resumen_consultar` | `project_id` | Ficha técnica ejecutiva del BEP (información general, objetivos y usos BIM, software, unidades). |
| `bep_equipo_consultar` | `project_id` | Equipo BIM, directorio de empresas, contactos, roles y especialidades técnicas. |
| `bep_lod_matriz` | `project_id`, `disciplina` | Matriz de Nivel de Desarrollo (LOD) e Información (TDI) requerida. |
| `bep_entregables_calendario` | `project_id` | Cronograma de hitos y entregas del modelo BIM. |

### 🗺️ Roadmap, Protocolos y Conocimiento
| Herramienta | Parámetros | Descripción |
| :--- | :--- | :--- |
| `roadmap_modulos_consultar` | `fase_id` | Fases y módulos de la ruta de implementación y madurez BIM. |
| `protocolos_recursos_consultar` | `busqueda`, `project_id` | Protocolos, directrices técnicas, manuales y documentos administrativos. |
| `diccionario_bim_consultar` | `termino` | Glosario de términos y estándares BIM (BEP, LOD, IFC, CDE, EIR, BCF, etc.). |

### 🚀 Gestión de Proyectos y Control
| Herramienta | Parámetros | Descripción |
| :--- | :--- | :--- |
| `proyectos_listar` | *Ninguno* | Lista todos los proyectos registrados y modelos sincronizados. |
| `tareas_e_incidentes_consultar` | `project_id`, `estado` | Centro de tareas operativas e incidentes de obra / QAQC. |

### 🔍 Herramienta Universal SQL y Diagnóstico
| Herramienta | Parámetros | Descripción |
| :--- | :--- | :--- |
| `tabla_supabase_consultar` | `tabla`, `select`, `filtro_columna`, `filtro_valor`, `limite` | Consulta cualquier tabla del esquema de Supabase de forma segura y estructurada. |
| `database_report_resumen` | `project_id` | Diagnóstico general de conectividad y conteo de registros en las 24 tablas del ecosistema. |

---

## 3. Configuración para el Asistente

### Configuración Remota (Vercel)
```json
{
  "mcpServers": {
    "review_cloud": {
      "url": "https://arca-review.vercel.app/mcp"
    },
    "review_local": {
      "url": "http://localhost:8080/mcp"
    }
  }
}
```

### Ejecución y Prueba Local
```bash
# Iniciar servidor localmente
node api/mcp.js

# Ejecutar batería completa de pruebas
node api/test_mcp.mjs
```
Configuración local:
```json
{
  "mcpServers": {
    "review-local": {
      "url": "http://localhost:3000/api/mcp"
    }
  }
}
```
