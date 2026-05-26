/**
 * BIM Knowledge Base
 * A technical glossary and strategic guide for BIM Implementation.
 */
export const bimKnowledgeBase = {
  terms: [
    {
      id: "iso19650",
      term: "ISO 19650",
      definition: "Estándar internacional para la gestión de la información durante todo el ciclo de vida de un activo construido, utilizando el modelado de información de construcción (BIM).",
      category: "Normativa"
    },
    {
      id: "lod",
      term: "LOD (Level of Development)",
      definition: "Define la cantidad de detalle y la confiabilidad de la información en un elemento del modelo BIM, desde el concepto (LOD 100) hasta el as-built (LOD 500).",
      category: "Modelado"
    },
    {
      id: "bep",
      term: "BEP (BIM Execution Plan)",
      definition: "Documento fundamental que detalla cómo se llevará a cabo la gestión de la información en el proyecto, definiendo roles, procesos y estándares.",
      category: "Gestión"
    },
    {
      id: "cde",
      term: "CDE (Common Data Environment)",
      definition: "Una fuente de información única y compartida para el proyecto, utilizada para recopilar, gestionar y difundir documentación y datos.",
      category: "Infraestructura"
    }
  ],
  phases: {
    "phase-01": {
      title: "Diagnóstico Inicial (AS-IS)",
      insight: "Evaluar la madurez BIM actual es crítico. Sin un punto de partida claro, la implementación carece de métricas de éxito.",
      checklist: ["Auditoría de software", "Encuesta de habilidades del equipo", "Revisión de infraestructura IT"]
    },
    "phase-02": {
      title: "Estándares y Protocolos",
      insight: "La estandarización reduce el re-trabajo en un 30%. Aquí se definen las familias base y la estructura de archivos.",
      checklist: ["Creación de Plantillas RTR", "Manual de Nomenclatura", "Protocolo de Intercambio (IFC)"]
    },
    "phase-03": {
      title: "Capacitación y Despliegue",
      insight: "BIM no es software, es un cambio cultural. La capacitación debe ser práctica y basada en proyectos reales.",
      checklist: ["Talleres de Revit Avanzado", "Simulaciones de Coordinación", "Soporte en Sitio"]
    }
  }
};
