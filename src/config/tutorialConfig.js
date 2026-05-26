import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const commonOptions = {
  showProgress: true,
  animate: true,
  popoverClass: 'driverjs-theme',
  progressText: 'PASO {{current}} DE {{total}}',
  nextBtnText: 'SIGUIENTE',
  prevBtnText: 'ANTERIOR',
  doneBtnText: 'FINALIZAR',
};

// Dashboard Tour
export const dashboardTutorial = driver({
  ...commonOptions,
  steps: [
    { 
      element: '#nav-fase-1', 
      popover: { 
        title: 'ESTRATEGIA_BIM', 
        description: 'Aquí se define la hoja de ruta. Cada fase orquesta la transición tecnológica de la compañía.',
        side: "right", 
        align: 'start' 
      } 
    },
    { 
      element: '#roadmap-container', 
      popover: { 
        title: 'MATRIZ_DE_DESPLIEGUE', 
        description: 'Los módulos son entregables técnicos. El progreso aquí impacta directamente en el cumplimiento de la norma ISO 19650.',
        side: "top", 
        align: 'center' 
      } 
    },
    { 
      element: '#bim-assistant', 
      popover: { 
        title: 'ASISTENTE_TÉCNICO', 
        description: 'Usa el agente para resolver dudas sobre términos como LOD, BEP o CDE en tiempo real.',
        side: "left", 
        align: 'end' 
      } 
    },
  ]
});

// Lifecycle Tour
export const lifecycleTutorial = driver({
  ...commonOptions,
  steps: [
    { 
      element: '#lifecycle-header', 
      popover: { 
        title: 'CENTRO_DE_CONTROL_4D', 
        description: 'Gestión del ciclo de vida del proyecto. Aquí vinculamos el diseño con el tiempo y el presupuesto.',
        side: "bottom", 
        align: 'start' 
      } 
    },
    { 
      element: '#new-project-btn', 
      popover: { 
        title: 'INICIALIZACIÓN_DE_PROYECTO', 
        description: 'Crea nuevos entornos de trabajo. Cada proyecto heredará los estándares BIM definidos en la organización.',
        side: "left", 
        align: 'center' 
      } 
    },
    { 
      element: '#project-card-sample', 
      popover: { 
        title: 'TARJETA_DE_PROYECTO', 
        description: 'Resumen técnico: responsables, fechas críticas y plantilla de trabajo seleccionada.',
        side: "top", 
        align: 'center' 
      } 
    },
  ]
});

// Resources Tour
export const resourcesTutorial = driver({
  ...commonOptions,
  steps: [
    { 
      element: '#resources-header', 
      popover: { 
        title: 'CATÁLOGO_GLOBAL_CDE', 
        description: 'Repositorio central de normativas, familias y estándares. Evita el "silencio de información" entre equipos.',
        side: "bottom", 
        align: 'start' 
      } 
    },
    { 
      element: '#resource-search', 
      popover: { 
        title: 'BÚSQUEDA_FILTRADA', 
        description: 'Encuentra recursos por categoría o palabra clave técnica rápidamente.',
        side: "bottom", 
        align: 'center' 
      } 
    },
  ]
});

// Admin Documents Tour
export const adminDocsTutorial = driver({
  ...commonOptions,
  steps: [
    { 
      element: '#docs-archive-panel', 
      popover: { 
        title: 'ARCHIVO_DE_PROPUESTAS', 
        description: 'Historial completo de cotizaciones y facturas generadas bajo protocolos BIM.',
        side: "right", 
        align: 'start' 
      } 
    },
    { 
      element: '#add-doc-btn', 
      popover: { 
        title: 'GENERADOR_DOCUMENTAL', 
        description: 'Crea propuestas técnicas profesionales con formato blueprint institucional.',
        side: "top", 
        align: 'center' 
      } 
    },
    { 
      element: '#doc-viewer-header', 
      popover: { 
        title: 'EDITOR_DE_CONTENIDO', 
        description: 'Visualización y edición en tiempo real de documentos técnicos. Soporta formato Markdown avanzado.',
        side: "bottom", 
        align: 'center' 
      } 
    },
    { 
      element: '#doc-print-btn', 
      popover: { 
        title: 'SALIDA_OFICIAL', 
        description: 'Exporta o imprime documentos con el sello de calidad REVIEW.',
        side: "left", 
        align: 'center' 
      } 
    },
  ]
});

export const startTutorial = (pathname) => {
  if (pathname === '/') dashboardTutorial.drive();
  else if (pathname === '/lifecycle' || pathname.startsWith('/lifecycle/')) lifecycleTutorial.drive();
  else if (pathname === '/resources' || pathname.startsWith('/resource/')) resourcesTutorial.drive();
  else if (pathname === '/documents') adminDocsTutorial.drive();
  else dashboardTutorial.drive(); // Default
};
