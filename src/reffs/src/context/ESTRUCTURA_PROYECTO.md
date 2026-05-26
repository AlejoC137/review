# Estructura del Proyecto Arq.tvs

Este documento describe la estructura de directorios y archivos del nuevo proyecto. El objetivo es mantener una arquitectura limpia y modular, separando responsabilidades.

## Estructura de Directorios

```
Arq.tvs/
├── .env                # Variables de entorno (Supabase keys, etc.)
├── package.json        # Dependencias y scripts del proyecto
├── vite.config.js      # Configuración de Vite
├── tailwind.config.js  # Configuración de Tailwind CSS
├── historial/          # (No Tocar) Información del proyecto previo preservada
└── src/                # Código fuente de la aplicación
    ├── config/
    │   └── supabaseClient.js  # Cliente e inicialización de Supabase
    ├── services/
    │   └── actionsService.js  # Servicios para interactuar con la base de datos/API
    ├── store/          # Gestión del estado global (Redux)
    │   ├── actions/    # Action creators de Redux
    │   ├── reducers/   # Reducers de Redux
    │   └── store.js    # Configuración del store principal
    ├── context/        # Contextos de React (si aplica, e.g., AuthContext)
    ├── components/     # Componentes de React reutilizables
    ├── utils/          # Funciones de utilidad y helpers
    ├── App.jsx         # Componente raíz de la aplicación
    ├── main.jsx        # Punto de entrada de React (Renderizado)
    └── index.css       # Estilos globales y directivas de Tailwind
```

## Descripción de Carpetas Principales

### `src/config`
Contiene la configuración de servicios externos. Aquí se inicializa el cliente de **Supabase** (`supabaseClient.js`) utilizando las variables de entorno.

### `src/services`
Esta carpeta aísla la lógica de fetching de datos. Los archivos aquí (como `actionsService.js`) contienen funciones que interactúan directamente con Supabase o APIs externas, manteniendo los componentes limpios de lógica de base de datos directa.

### `src/store`
Implementación de **Redux**.
- **actions/**: Define las acciones que disparan cambios en el estado.
- **reducers/**: Contiene la lógica pura para actualizar el estado basado en las acciones.

### `src/components`
Componentes de UI. Se recomienda subdividir esta carpeta por funcionalidades o módulos si el proyecto crece (ej. `components/dashboard`, `components/shared`).

### `src/utils`
Funciones auxiliares puras que pueden ser usadas en múltiples partes de la aplicación (formateo de fechas, cálculos, validaciones).

### `historial`
Carpeta de respaldo. Contiene archivos o referencias del proyecto anterior. **No se debe modificar ni trabajar sobre esta carpeta** para el nuevo desarrollo, sirve solo como consulta histórica.
