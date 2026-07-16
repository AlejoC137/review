import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';
import imageCompression from 'browser-image-compression';
import { serializeBlocks, deserializeBlocks } from '../utils/blockSerializer';


const RoadmapContext = createContext();

const INITIAL_ROADMAP_DATA = [
  {
    id: "phase-1",
    title: "Fase 1: Capacitación",
    description: "Nodos Base",
    nodes: []
  },
  {
    id: "phase-2",
    title: "Fase 2: Tutorías para la Implementación",
    description: "Nodos Avanzados",
    nodes: []
  }
];

export const RoadmapProvider = ({ children }) => {
  const { user } = useAuth();
  const [roadmapData, setRoadmapData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch dynamic roadmap structure
      const { data: phasesData, error: phasesError } = await supabase
        .from('roadmap_phases')
        .select('*')
        .order('sort_order', { ascending: true });

      const { data: modulesData, error: modulesError } = await supabase
        .from('roadmap_modules')
        .select('*')
        .order('sort_order', { ascending: true });

      // 1b. Fetch content blocks for all modules
      const { data: blocksData, error: blocksError } = await supabase
        .from('module_content_blocks')
        .select('*')
        .order('sort_order', { ascending: true });

      if (blocksError) {
        console.warn("Could not fetch module_content_blocks, table might not exist yet:", blocksError);
      }

      // If missing tables or empty result, fallback to INITIAL_ROADMAP_DATA phases
      let baseData = INITIAL_ROADMAP_DATA;
      if (!phasesError && !modulesError && phasesData?.length > 0) {
        baseData = phasesData.map((phase) => ({
          id: phase.id,
          title: phase.title,
          description: phase.description,
          nodes: modulesData.filter((m) => m.phase_id === phase.id).map((m) => ({
            id: m.id,
            title: m.title,
            description: m.description,
            parameters: m.parameters,
            notes: m.notes,
            sort_order: m.sort_order,
            image_url: m.image_url,
            finished: "not_started",
            blocks: deserializeBlocks(blocksData?.filter(b => b.module_id === m.id) || [])
          }))
        }));
      }

      // 2. Default state if no user or if it's the dummy test user
      if (!user || user.id === 'test-user') {
        setRoadmapData(baseData.map(phase => ({
          ...phase,
          nodes: phase.nodes.map(node => ({
            ...node,
            finished: "not_started"
          }))
        })));
        return;
      }

      // 3. User progress handled locally for now or via other tables if needed
      // (Removing user_progress per user request)
      const updatedData = baseData.map(phase => ({
        ...phase,
        nodes: phase.nodes.map(node => ({
          ...node,
          finished: "not_started" // Default finished as user_progress table is removed
        }))
      }));

      setRoadmapData(updatedData);
    } catch (err) {
      console.error(err);
      setRoadmapData(INITIAL_ROADMAP_DATA);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const updateNodeStatus = async (nodeId, newStatus) => {
    setRoadmapData(prev => prev.map(phase => ({
      ...phase,
      nodes: phase.nodes.map(node =>
        node.id === nodeId ? { ...node, finished: newStatus } : node
      )
    })));

    if (!user || user.id === 'test-user') return;

    // Persistence to user_progress removed per user request.
    // Progress is now local-only for the session unless moved to user_profiles.
  };

  const createModule = async (phaseId, newModuleData) => {
    try {
      const newModule = {
        id: newModuleData.id || `mod-${Date.now()}`,
        phase_id: phaseId,
        title: newModuleData.title,
        description: newModuleData.description,
        parameters: newModuleData.parameters,
        notes: newModuleData.notes,
        sort_order: newModuleData.sort_order || 99,
        image_url: newModuleData.image_url || null,
        created_at: new Date().toISOString()
      };

      // Optimistic instant update local state
      setRoadmapData(prev => prev.map(phase => {
        if (phase.id === phaseId) {
          return {
            ...phase,
            nodes: [...phase.nodes, { ...newModule, finished: 'not_started' }]
          };
        }
        return phase;
      }));

      const { error } = await supabase.from('roadmap_modules').insert(newModule);
      if (error) throw error;

      return newModule.id;
    } catch (error) {
      console.error("Error creating module:", error);
      fetchProgress(); // Revert on failure
      throw error;
    }
  };

  const updateModule = async (moduleId, updatedData) => {
    try {
      // Optimistic instant update local state
      setRoadmapData(prev => prev.map(phase => ({
        ...phase,
        nodes: phase.nodes.map(node =>
          node.id === moduleId ? { ...node, ...updatedData } : node
        )
      })));

      const { error } = await supabase
        .from('roadmap_modules')
        .update({
          title: updatedData.title,
          description: updatedData.description,
          parameters: updatedData.parameters,
          notes: updatedData.notes,
          sort_order: updatedData.sort_order,
          image_url: updatedData.image_url,
        })
        .eq('id', moduleId);

      if (error) throw error;

    } catch (error) {
      console.error("Error updating module:", error);
      fetchProgress(); // Revert on failure
      throw error;
    }
  };

  const reorderModules = async (phaseId, updatedNodes) => {
    try {
      // Optimistic instant update local state
      setRoadmapData(prev => prev.map(phase => {
        if (phase.id === phaseId) {
          return { ...phase, nodes: updatedNodes };
        }
        return phase;
      }));

      // Fire a bulk update to Supabase
      const payload = updatedNodes.map((n) => ({
        id: n.id,
        phase_id: phaseId,
        title: n.title,
        description: n.description,
        parameters: n.parameters,
        notes: n.notes,
        sort_order: n.sort_order,
        image_url: n.image_url
      }));

      const { error } = await supabase
        .from('roadmap_modules')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;
    } catch (error) {
      console.error("Error reordering modules:", error);
      fetchProgress(); // Revert on failure
    }
  };

  const moveModuleBetweenPhases = async (moduleId, sourcePhaseId, targetPhaseId, newIndex) => {
    try {
      let finalSourceNodes = [];
      let finalTargetNodes = [];

      // Optimistic update
      setRoadmapData(prev => {
        let movedNode = null;
        const newData = prev.map(phase => {
          if (phase.id === sourcePhaseId) {
            const nodeIndex = phase.nodes.findIndex(n => n.id === moduleId);
            if (nodeIndex === -1) return phase;
            const newNodes = [...phase.nodes];
            [movedNode] = newNodes.splice(nodeIndex, 1);
            const updatedSourceNodes = newNodes.map((n, i) => ({ ...n, sort_order: i + 1 }));
            finalSourceNodes = updatedSourceNodes;
            return { ...phase, nodes: updatedSourceNodes };
          }
          return phase;
        });

        if (!movedNode) return prev;

        return newData.map(phase => {
          if (phase.id === targetPhaseId) {
            const newNodes = [...phase.nodes];
            const nodeToInsert = { ...movedNode, phase_id: targetPhaseId };
            newNodes.splice(newIndex, 0, nodeToInsert);
            const updatedTargetNodes = newNodes.map((n, i) => ({ ...n, sort_order: i + 1 }));
            finalTargetNodes = updatedTargetNodes;
            return { ...phase, nodes: updatedTargetNodes };
          }
          return phase;
        });
      });

      // Supabase update: We need to update the moved node and all nodes whose sort_order changed.
      const payload = [
        ...finalSourceNodes.map(n => ({
          id: n.id,
          phase_id: sourcePhaseId,
          sort_order: n.sort_order,
          title: n.title,
          description: n.description,
          parameters: n.parameters,
          notes: n.notes,
          image_url: n.image_url
        })),
        ...finalTargetNodes.map(n => ({
          id: n.id,
          phase_id: targetPhaseId,
          sort_order: n.sort_order,
          title: n.title,
          description: n.description,
          parameters: n.parameters,
          notes: n.notes,
          image_url: n.image_url
        }))
      ];

      const { error } = await supabase
        .from('roadmap_modules')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;
    } catch (error) {
      console.error("Error moving module between phases:", error);
      fetchProgress();
    }
  };

  const updateModuleBlocks = async (moduleId, blocks) => {
    try {
      // 1. Delete existing blocks for this module
      const { error: deleteError } = await supabase
        .from('module_content_blocks')
        .delete()
        .eq('module_id', moduleId);

      if (deleteError) throw deleteError;

      // 2. Insert new blocks
      if (blocks.length > 0) {
        const serialized = serializeBlocks(blocks);
        const blocksWithModuleId = serialized.map((b, i) => ({
          module_id: moduleId,
          type: b.type,
          content: b.content,
          sort_order: i
        }));

        const { error: insertError } = await supabase
          .from('module_content_blocks')
          .insert(blocksWithModuleId);

        if (insertError) throw insertError;
      }

      // 3. Update local state
      setRoadmapData(prev => prev.map(phase => ({
        ...phase,
        nodes: phase.nodes.map(node =>
          node.id === moduleId ? { ...node, blocks } : node
        )
      })));

    } catch (error) {
      console.error("Error updating module blocks:", error);
      throw error;
    }
  };

  const uploadModuleImage = async (file) => {
    try {
      // 1. Compress Image (Logic from Evidence/Clogger)
      const compressionOptions = {
        maxSizeMB: 0.5,           // Target ~500KB (Good balance of quality/size)
        maxWidthOrHeight: 1200,  // Resize if larger
        useWebWorker: true
      };

      const compressedFile = await imageCompression(file, compressionOptions);
      console.log(`Original: ${file.size / 1024} KB, Compressed: ${compressedFile.size / 1024} KB`);

      // 2. Prepare Path (Directly in root of 'images' bucket)
      const fileExt = file.name.split('.').pop();
      const fileName = `module_${Date.now()}.${fileExt}`;
      const filePath = fileName; // No folder prefix

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const value = {
    roadmapData,
    loading,
    updateNodeStatus,
    fetchProgress,
    createModule,
    updateModule,
    reorderModules,
    moveModuleBetweenPhases,
    updateModuleBlocks,
    uploadModuleImage
  };

  return <RoadmapContext.Provider value={value}>{children}</RoadmapContext.Provider>;
};

export const useRoadmap = () => {
  const context = useContext(RoadmapContext);
  if (!context) {
    throw new Error('useRoadmap must be used within a RoadmapProvider');
  }
  return context;
};
