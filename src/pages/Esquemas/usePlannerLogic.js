import { useState, useEffect } from 'react';
import { plannerService } from '../../services/plannerService';
import { bimService } from '../../services/bimService';
import { useDispatch } from 'react-redux';
import { setCurrentPlan } from '../../store/bimSlice';
import { supabase } from '../../services/supabaseClient';
import { buildTreeFromFlatNodes } from '../../utils/schemaUtils';


export const usePlannerLogic = (planId, isAdmin) => {
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [activeSchemaTree, setActiveSchemaTree] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [esquemas, setEsquemas] = useState([]); // Available schemas to connect

  const dispatch = useDispatch();

  // Load all plans and available schemas
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        // We use a try-catch because the table might not exist yet
        let loadedPlans = [];
        try {
          loadedPlans = await plannerService.getPlans();
        } catch (e) {
          console.warn("bim_plans table likely not ready yet:", e);
        }
        
        setPlans(loadedPlans);

        const { data: loadedEsquemas } = await bimService.getEsquemas();
        setEsquemas(loadedEsquemas || []);

        if (planId) {
          const plan = loadedPlans.find(p => p.id === planId);
          if (plan) setActivePlan(plan);
          else setActivePlan(null);
        } else {
          setActivePlan(null);
        }
      } catch (error) {
        console.error("Planner load error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [planId]);

  useEffect(() => {
    const loadSchemaTree = async () => {
      if (activePlan?.schema_id) {
        const { data: nodes, error } = await supabase
          .from('esquema_nodes')
          .select('*')
          .eq('esquema_id', activePlan.schema_id);

        if (!error && nodes && nodes.length > 0) {
          const tree = buildTreeFromFlatNodes(nodes);
          setActiveSchemaTree(tree);
        } else {
          if (activePlan.schema?.map_data) {
            setActiveSchemaTree(activePlan.schema.map_data);
          } else {
            setActiveSchemaTree(null);
          }
        }
      } else {
        setActiveSchemaTree(null);
      }
    };
    loadSchemaTree();
  }, [activePlan?.schema_id, activePlan?.schema?.map_data]);

  // Real-time synchronization for external changes (like from the Schema editor)
  useEffect(() => {
    if (!planId || !activePlan) return;

    const channel = supabase
      .channel('bim-realtime-sync')
      .on(
        'broadcast',
        { event: 'schema-updated' },
        async (payload) => {
          console.log("[Broadcast] Schema updated event received:", payload);
          // Check if this update belongs to our linked schema
          if (activePlan?.schema_id === payload.payload.schemaId) {
            console.log("[Sync] Linked schema changed. Refreshing plan data...");
            const { data, error } = await supabase
              .from('bim_plans')
              .select('*, schema:esquemas(name)')
              .eq('id', planId)
              .single();
              
            if (!error && data) {
              setActivePlan(data);
              setPlans(prev => prev.map(p => p.id === planId ? data : p));
              // Trigger reload of the schema tree
              const { data: nodes } = await supabase
                .from('esquema_nodes')
                .select('*')
                .eq('esquema_id', activePlan.schema_id);
              if (nodes && nodes.length > 0) {
                setActiveSchemaTree(buildTreeFromFlatNodes(nodes));
              }
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'bim_plans', 
          filter: `id=eq.${planId}` 
        },
        (payload) => {
          console.log("[Sync] Plan updated externally:", payload.new.id);
          // Merge technical data from server into active plan state
          setActivePlan(current => ({
            ...current,
            ...payload.new,
            // Ensure we keep the local joined schema info if it's not in the payload
            schema: current.schema || payload.new.schema
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [planId, activePlan?.id, activePlan?.schema_id]);


  const handleCreatePlan = async (name, description) => {
    try {
      const newPlan = await plannerService.createPlan(name, description);
      setPlans([newPlan, ...plans]);
      return newPlan;
    } catch (error) {
      console.error("Error creating plan:", error);
      alert("Error creating plan. Check if 'bim_plans' table exists.");
    }
  };

  const handleConnectSchema = async (targetPlanId, schema) => {
    try {
      setIsSaving(true);
      // Fixed: Pass the whole schema object as expected by the service
      await plannerService.connectSchema(targetPlanId, schema);
      
      // Update local state robustly
      const basePlan = plans.find(p => p.id === targetPlanId) || activePlan;
      const updatedPlan = { 
        ...basePlan, 
        id: targetPlanId,
        schema_id: schema.id, 
        plan_data: {}, 
        schema: { name: schema.name } 
      };

      setPlans(prev => prev.map(p => p.id === targetPlanId ? updatedPlan : p));
      
      if (activePlan?.id === targetPlanId || !activePlan) {
        setActivePlan(updatedPlan);
      }
      
      return updatedPlan;
    } catch (error) {
      console.error("Error connecting schema:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePlanNode = async (nodeId, updates) => {
    // In the new architecture, we save modifications to a flat delta object (nodeId -> {updates})
    const newDelta = {
        ...(activePlan.plan_data || {}),
        [nodeId]: {
            ...(activePlan.plan_data?.[nodeId] || {}),
            ...updates
        }
    };

    // Update local state immediately for responsiveness
    setActivePlan(prev => ({ ...prev, plan_data: newDelta }));
    setIsDirty(true);
    
    // Auto-save logic
    try {
        setIsSaving(true);
        await plannerService.savePlanData(activePlan.id, newDelta);
        setIsDirty(false);
    } catch (e) {
        console.error("Save error:", e);
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeletePlan = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this plan?")) return;
    try {
      await plannerService.deletePlan(id);
      setPlans(plans.filter(p => p.id !== id));
    } catch (error) {
      console.error("Error deleting plan:", error);
    }
  };

  // Helper to merge source-of-truth schema with implementation delta
  const mergeSchemaWithImplementation = (schemaTree, delta) => {
    if (!schemaTree) return null;
    const merge = (node) => {
        const nodeDelta = delta?.[node.id] || {};
        return {
            ...node,
            ...nodeDelta,
            children: node.children?.map(merge) || []
        };
    };
    return merge(schemaTree);
  };

  // Enhance the active plan with merged data for the UI
  const enhancedActivePlan = activePlan ? {
      ...activePlan,
      merged_data: mergeSchemaWithImplementation(activeSchemaTree, activePlan.plan_data)
  } : null;

  return {
    state: {
      plans, 
      activePlan: enhancedActivePlan, // UI uses this
      isLoading, isSaving, isDirty, esquemas
    },
    handlers: {
      handleCreatePlan,
      handleConnectSchema,
      handleUpdatePlanNode,
      handleDeletePlan,
      setActivePlan
    }
  };
};

