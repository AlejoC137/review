import { useRoadmap } from '../context/RoadmapContext';

/**
 * useRoadmapProgress Hook
 * Now a wrapper around RoadmapContext to ensure a single source of truth
 * for roadmap data and progress across the entire application.
 */
export const useRoadmapProgress = () => {
  const { 
    roadmapData, 
    loading, 
    updateNodeStatus, 
    fetchProgress, 
    createModule, 
    updateModule, 
    reorderModules,
    moveModuleBetweenPhases
  } = useRoadmap();

  // Helper for backward compatibility
  const getModuleDetail = (moduleId) => {
    for (const phase of roadmapData) {
      const found = phase.nodes.find(n => n.id === moduleId);
      if (found) return { ...found, phaseId: phase.id, phaseTitle: phase.title };
    }
    return null;
  };

  return { 
    roadmapData, 
    loading, 
    updateNodeStatus, 
    fetchProgress, 
    getModuleDetail,
    createModule,
    updateModule,
    reorderModules,
    moveModuleBetweenPhases
  };
};
