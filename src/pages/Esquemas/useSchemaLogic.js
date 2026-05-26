import { useState, useRef, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import { INITIAL_MIND_MAP_DATA } from './constants';
import { layoutTree } from './layoutTree';
import { useDispatch } from 'react-redux';
import { setCurrentPlan } from '../../store/bimSlice';
import { plannerService } from '../../services/plannerService';
import { buildTreeFromFlatNodes } from '../../utils/schemaUtils';
import { useSearchParams, useLocation } from 'react-router-dom';


export const useSchemaLogic = (schemaId, isAdmin, navigate, projectId, isAdminView) => {
  const [zoom, setZoom] = useState(0.85);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const dispatch = useDispatch();
  const basePath = isAdminView ? '/esquemaAdmin' : '/esquemas';
  
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  
  const [esquemas, setEsquemas] = useState([]);
  const [activeEsquema, setActiveEsquema] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // JSON Import states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const [projectsList, setProjectsList] = useState([]);

  useEffect(() => {
    if (isAdmin) {
      const fetchProjects = async () => {
        try {
          const { lifecycleService } = await import('../../services/lifecycleService');
          const projs = await lifecycleService.getProjects();
          setProjectsList(projs);
        } catch (err) {
          console.error("Failed to fetch projects", err);
        }
      };
      fetchProjects();
    }
  }, [isAdmin]);

  // State for editable maps
  const [mapData, setMapData] = useState(INITIAL_MIND_MAP_DATA);

  // Modal inspection state
  const [inspectedNode, setInspectedNode] = useState(null);

  // Dragging state
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [startDragPos, setStartDragPos] = useState({ x: 0, y: 0 });
  const dragHappened = useRef(false);
  const requestRef = useRef();
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const panClickStart = useRef({ x: 0, y: 0 });

  // Saving states
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedData, setLastSavedData] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Global links lookup for canvas nodes
  const [nodeLinks, setNodeLinks] = useState({});

  // Multi-selection state
  const [selectedNodeIds, setSelectedNodeIds] = useState(new Set());
  const [selectionBox, setSelectionBox] = useState(null);
  const dragStartPositions = useRef({});

  const [isLocked, setIsLocked] = useState(false);
  const [showJsonView, setShowJsonView] = useState(false);
  const [isCreatorMode, setIsCreatorMode] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [reconnectingData, setReconnectingData] = useState(null);
  const [reconnectTargetId, setReconnectTargetId] = useState(null);
  const [duplicatingData, setDuplicatingData] = useState(null);

  const [isHighlighterActive, setIsHighlighterActive] = useState(false);
  const [markerColor, setMarkerColor] = useState('#fef08a');
  const [viewMode, setViewMode] = useState('canvas');

  const [allBranchesExpanded, setAllBranchesExpanded] = useState(false);
  const [allDataExpanded, setAllDataExpanded] = useState(false);
  const [importTargetNode, setImportTargetNode] = useState(null);

  const fetchSchemaLinks = async (id) => {
    if (!id) return;
    const [modRes, resRes] = await Promise.all([
      supabase.from('esquema_nodes_modules').select('node_id, module_id').eq('esquema_id', id),
      supabase.from('esquema_nodes_resources').select('node_id, resource_id').eq('esquema_id', id)
    ]);

    const lookup = {};
    if (modRes.data) {
      modRes.data.forEach(link => {
        if (!lookup[link.node_id]) lookup[link.node_id] = { modules: [], resources: [] };
        lookup[link.node_id].modules.push(link.module_id);
      });
    }
    if (resRes.data) {
      resRes.data.forEach(link => {
        if (!lookup[link.node_id]) lookup[link.node_id] = { modules: [], resources: [] };
        lookup[link.node_id].resources.push(link.resource_id);
      });
    }
    setNodeLinks(lookup);
  };

  const treeNodes = useMemo(() => layoutTree(mapData, 100, 100), [mapData]);

  const sanitizeMapData = (node, forceNewIds = false) => {
    if (!node) return null;
    const existingIds = new Set();
    const gatherIds = (n) => {
      if (!n) return;
      existingIds.add(n.id);
      if (n.children) n.children.forEach(gatherIds);
    };
    if (mapData && !forceNewIds) gatherIds(mapData);

    const seenInThisPass = new Set();

    const recursivelySanitize = (n) => {
      let newId = n.id;
      const isDuplicate = existingIds.has(newId) || seenInThisPass.has(newId);
      if (forceNewIds || isDuplicate || !newId) {
        newId = 'node_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      }
      seenInThisPass.add(newId);
      return {
        ...n,
        id: newId,
        children: n.children && Array.isArray(n.children) ? n.children.map(recursivelySanitize) : []
      };
    };
    return recursivelySanitize(node);
  };

  const centerOnRoot = () => {
    if (!containerRef.current || treeNodes.length === 0) return;
    const root = treeNodes.find(n => n.isRoot) || treeNodes[0];
    const rect = containerRef.current.getBoundingClientRect();
    const targetX = rect.width / 2 - (root.x + root.width / 2) * zoom;
    const targetY = rect.height / 2 - (root.y + root.height / 2) * zoom;
    setPanOffset({ x: targetX, y: targetY });
  };

  const openEsquema = async (esq) => {
    setActiveEsquema(esq);
    setIsLoading(true);
    try {
      const { data: nodes, error } = await supabase
        .from('esquema_nodes')
        .select('*')
        .eq('esquema_id', esq.id);

      if (error) throw error;

      let parsedTree;
      if (!nodes || nodes.length === 0) {
        console.warn("No nodes found in esquema_nodes for schema ID:", esq.id);
        const fallbackData = esq.map_data || { ...INITIAL_MIND_MAP_DATA, name: esq.name };
        parsedTree = sanitizeMapData(fallbackData);
      } else {
        parsedTree = buildTreeFromFlatNodes(nodes);
      }

      setMapData(parsedTree);
      setLastSavedData(JSON.stringify(parsedTree));
      setIsDirty(false);
      fetchSchemaLinks(esq.id);
      dispatch(setCurrentPlan(esq));
      if (schemaId !== esq.id) {
        navigate(`${basePath}/${esq.id}${projectId ? `?projectId=${projectId}` : ''}`);
      }
    } catch (err) {
      console.error("Error loading schema nodes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEsquemas = async () => {
    setIsLoading(true);
    let query = supabase.from('esquemas').select('*').order('name', { ascending: true });
    
    if (projectId) {
      query = query.eq('project', projectId);
    }
    
    const { data, error } = await query;
      
    if (!error && data) {
      setEsquemas(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEsquemas();
  }, [projectId]);

  useEffect(() => {
    if (esquemas.length > 0 && schemaId) {
      const found = esquemas.find(e => e.id === schemaId);
      if (found) openEsquema(found);
      else setActiveEsquema(null);
    } else if (!schemaId) {
      setActiveEsquema(null);
    }
  }, [schemaId, esquemas]);

  // Auto-expand, center, and inspect node if passed in query params
  useEffect(() => {
    const selectedNodeParam = searchParams.get('selectedNode');
    if (!selectedNodeParam || !mapData || isLoading) return;

    // Helper: find path to target node inside nested children
    const findAncestorPath = (node, targetId, currentPath = []) => {
      if (!node) return null;
      if (node.id === targetId) return { found: node, path: currentPath };
      if (node.children) {
        for (const child of node.children) {
          const res = findAncestorPath(child, targetId, [...currentPath, node.id]);
          if (res) return res;
        }
      }
      return null;
    };

    const result = findAncestorPath(mapData, selectedNodeParam);
    if (result) {
      const { found: targetNode, path } = result;
      const pathSet = new Set(path);

      // Check if any ancestor in the path is collapsed
      let needsExpansion = false;
      const checkAncestors = (node) => {
        if (!node) return;
        if (pathSet.has(node.id)) {
          if (node.isBranchExpanded === false) {
            needsExpansion = true;
          }
        }
        if (node.children) {
          node.children.forEach(checkAncestors);
        }
      };
      checkAncestors(mapData);

      if (needsExpansion) {
        // Expand the path
        const expandPathInTree = (node) => {
          if (!node) return null;
          let updated = { ...node };
          if (pathSet.has(node.id)) {
            updated.isBranchExpanded = true;
          }
          if (node.children) {
            updated.children = node.children.map(expandPathInTree);
          }
          return updated;
        };
        const expandedTree = expandPathInTree(mapData);
        setMapData(expandedTree);
        setIsDirty(true);
        return;
      }

      // Once all ancestors are expanded, check if the node exists in treeNodes
      const nodeObj = treeNodes.find(n => n.id === selectedNodeParam);
      if (nodeObj) {
        // Inspect the node
        setInspectedNode(nodeObj);

        // Center on the node
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const targetX = rect.width / 2 - (nodeObj.x + nodeObj.width / 2) * zoom;
          const targetY = rect.height / 2 - (nodeObj.y + nodeObj.height / 2) * zoom;
          setPanOffset({ x: targetX, y: targetY });
        }

        // Clear the search param from URL so it doesn't reopen on every zoom/pan
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('selectedNode');
        const searchStr = newParams.toString();
        navigate(`${location.pathname}${searchStr ? `?${searchStr}` : ''}`, { replace: true });
      }
    }
  }, [searchParams, mapData, isLoading, treeNodes, zoom, location.pathname, navigate]);

  // Keep sync channel alive
  const syncChannelRef = useRef(null);
  useEffect(() => {
    syncChannelRef.current = supabase.channel('bim-realtime-sync');
    syncChannelRef.current.subscribe();
    return () => {
      supabase.removeChannel(syncChannelRef.current);
    };
  }, []);


  useEffect(() => {
    if (!isDirty || !activeEsquema) return;
    const timer = setTimeout(async () => {
      await handlers.persistToDatabase(mapData);
    }, 800);
    return () => clearTimeout(timer);
  }, [mapData, isDirty, activeEsquema]);

  const updateNodeInTree = (nodeId, updateFn) => {
    const recursivelyUpdate = (n) => {
      if (n.id === nodeId) return updateFn(n);
      if (n.children) return { ...n, children: n.children.map(recursivelyUpdate) };
      return n;
    };
    const newMapData = recursivelyUpdate(mapData);
    setMapData(newMapData);
    setIsDirty(true);
    return newMapData;
  };

  const handlers = {
    handleBackToList: () => {
      setActiveEsquema(null);
      setMapData(INITIAL_MIND_MAP_DATA);
      navigate(basePath);
    },
    persistToDatabase: async (dataToSave) => {
      if (!activeEsquema) return;
      setIsSaving(true);
      try {
        const flattenTree = (node, parentId = null, depth = 0) => {
          if (!node) return [];
          const row = {
            id: node.id,
            esquema_id: activeEsquema.id,
            parent_id: parentId,
            name: node.name || null,
            description: node.description || null,
            category: node.category || null,
            type: node.type || 'DOC',
            roles: node.roles || null,
            x: node.x !== undefined ? node.x : null,
            y: node.y !== undefined ? node.y : null,
            width: node.width !== undefined ? node.width : null,
            height: node.height !== undefined ? node.height : null,
            depth: depth,
            is_root: node.isRoot ?? false,
            is_branch_expanded: node.isBranchExpanded ?? true,
            is_text_expanded: node.isTextExpanded ?? false,
            is_highlighted: node.isHighlighted ?? false,
            highlight_color: node.highlightColor ?? null,
            storage_mode: node.storage_mode ?? 'INHERIT',
            external_links: node.externalLinks || [],
            external_resources: node.externalResources || [],
            path: node.path || [],
            recurso_id: node.recurso_id || null
          };
          const children = (node.children || []).flatMap(child =>
            flattenTree(child, node.id, depth + 1)
          );
          return [row, ...children];
        };

        const rows = flattenTree(dataToSave);

        const { error } = await supabase
          .from('esquema_nodes')
          .upsert(rows, { onConflict: 'id' });

        if (!error) {
          setIsDirty(false);
          setLastSavedData(JSON.stringify(dataToSave));
          
          // PROP: Emit broadcast for instant UI update in other tabs
          console.log(`[Broadcast] Sending sync signal for schema ${activeEsquema.id}`);
          if (syncChannelRef.current) {
            syncChannelRef.current.send({
              type: 'broadcast',
              event: 'schema-updated',
              payload: { 
                schemaId: activeEsquema.id, 
                timestamp: Date.now()
              }
            });
          }
        } else {
          console.error("Error upserting nodes in persistToDatabase:", error);
        }
      } catch (err) {
        console.error("Fatal error in persistToDatabase:", err);
      } finally {
        setIsSaving(false);
      }
    },
    handleCreateEsquema: async () => {
      const newEsquema = {
        name: 'Nuevo Ecosistema',
        description: 'Generado automáticamente',
        project: projectId || null
      };
      const { data, error } = await supabase.from('esquemas').insert([newEsquema]).select();
      if (!error && data) {
        const createdEsq = data[0];
        
        // Insert root node into esquema_nodes
        const rootNode = {
          id: 'node_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
          esquema_id: createdEsq.id,
          parent_id: null,
          name: createdEsq.name,
          description: createdEsq.description,
          is_root: true,
          is_branch_expanded: true,
          is_text_expanded: false,
          depth: 0,
          type: 'DOC',
          storage_mode: 'INHERIT'
        };
        
        const { error: nodeErr } = await supabase.from('esquema_nodes').insert([rootNode]);
        if (nodeErr) {
          console.error("Error creating root node in esquema_nodes:", nodeErr);
        }
        
        setEsquemas([createdEsq, ...esquemas]);
        openEsquema(createdEsq);
      }
    },
    handleDeleteEsquema: async (e, id) => {
      e.stopPropagation();
      if (!window.confirm("¿Seguro que deseas eliminar el esquema completo? Esto no se puede deshacer.")) return;
      const { error } = await supabase.from('esquemas').delete().eq('id', id);
      if (!error) setEsquemas(prev => prev.filter(esq => esq.id !== id));
    },
    handleAssignProject: async (schemaIdToAssign, newProjectId) => {
      const pId = newProjectId === 'none' ? null : newProjectId;
      const { error } = await supabase.from('esquemas').update({ project: pId }).eq('id', schemaIdToAssign);
      if (!error) {
        setEsquemas(prev => prev.map(e => e.id === schemaIdToAssign ? { ...e, project: pId } : e));
      } else {
        console.error('Error assigning project:', error);
      }
    },
    handleImportJson: async () => {
      if (!importJsonText.trim()) return;
      setIsImporting(true);
      try {
        const jsonData = JSON.parse(importJsonText);
        const newEsquema = { 
          name: jsonData.name || 'Imported Schema', 
          description: jsonData.description || 'Imported via JSON Paste', 
          project: projectId || null
        };
        const { data: esqData, error: esqError } = await supabase.from('esquemas').insert([newEsquema]).select();
        if (!esqError && esqData) {
          const createdEsq = esqData[0];
          
          // Flatten the JSON tree
          const sanitizeAndFlatten = (node, parentId = null, depth = 0) => {
            const nodeId = node.id || 'node_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
            const row = {
              id: nodeId,
              esquema_id: createdEsq.id,
              parent_id: parentId,
              name: node.name || null,
              description: node.description || null,
              category: node.category || null,
              type: node.type || 'DOC',
              roles: node.roles || null,
              x: node.x ?? null,
              y: node.y ?? null,
              width: node.width ?? null,
              height: node.height ?? null,
              depth: depth,
              is_root: node.isRoot || (depth === 0),
              is_branch_expanded: node.isBranchExpanded ?? true,
              is_text_expanded: node.isTextExpanded ?? false,
              is_highlighted: node.isHighlighted ?? false,
              highlight_color: node.highlightColor ?? null,
              storage_mode: node.storage_mode ?? 'INHERIT',
              external_links: node.externalLinks || [],
              external_resources: node.externalResources || [],
              path: node.path || [],
              recurso_id: node.recurso_id || null
            };
            
            const children = (node.children || []).flatMap(child => 
              sanitizeAndFlatten(child, nodeId, depth + 1)
            );
            return [row, ...children];
          };
          
          const rows = sanitizeAndFlatten(jsonData);
          
          const { error: nodesError } = await supabase.from('esquema_nodes').insert(rows);
          if (nodesError) {
            console.error("Error inserting imported nodes:", nodesError);
          }
          
          setEsquemas([createdEsq, ...esquemas]);
          setIsImportModalOpen(false);
          setImportJsonText('');
          openEsquema(createdEsq);
        }
      } catch (err) { 
        alert("Error processing JSON: " + err.message); 
      } finally { 
        setIsImporting(false); 
      }
    },
    toggleTextExpand: (id) => updateNodeInTree(id, n => ({ ...n, isTextExpanded: !n.isTextExpanded })),
    toggleBranchExpand: (id) => updateNodeInTree(id, n => ({ ...n, isBranchExpanded: !n.isBranchExpanded })),
    handleToggleHighlight: async (nodeId) => {
      const isPartOfSelection = selectedNodeIds.has(nodeId);
      const targetNode = treeNodes.find(n => n.id === nodeId);
      const isRemoving = targetNode?.isHighlighted && targetNode?.highlightColor === markerColor;

      const recursivelyUpdate = (n) => {
        let newNode = { ...n };
        const shouldUpdate = n.id === nodeId || (isPartOfSelection && selectedNodeIds.has(n.id));
        
        if (shouldUpdate) {
          if (isRemoving) {
            newNode.isHighlighted = false;
            newNode.highlightColor = null;
          } else {
            newNode.isHighlighted = true;
            newNode.highlightColor = markerColor;
          }
        }
        
        if (n.children && Array.isArray(n.children)) {
          newNode.children = n.children.map(recursivelyUpdate);
        }
        
        return newNode;
      };

      const newData = recursivelyUpdate(mapData);
      setMapData(newData);
      setIsDirty(true);
      await handlers.persistToDatabase(newData);
    },
    handleDeepToggleBranch: (nodeId, expand) => {
      const recursivelyToggle = (n, force = false) => {
        const shouldApply = force || n.id === nodeId;
        let updatedNode = { ...n };
        if (shouldApply && n.children?.length > 0) updatedNode.isBranchExpanded = expand;
        if (n.children) updatedNode.children = n.children.map(child => recursivelyToggle(child, shouldApply));
        return updatedNode;
      };
      setMapData(recursivelyToggle(mapData));
      setIsDirty(true);
    },
    handleGlobalTreeToggle: () => {
      const nextValue = !allBranchesExpanded;
      const recursivelyUpdateAll = (n) => ({ ...n, isBranchExpanded: nextValue, children: n.children?.map(recursivelyUpdateAll) || [] });
      setMapData(recursivelyUpdateAll(mapData));
      setIsDirty(true);
      setAllBranchesExpanded(nextValue);
    },
    handleGlobalDataToggle: () => {
      const nextValue = !allDataExpanded;
      const recursivelyUpdateAll = (n) => ({ ...n, isTextExpanded: nextValue, children: n.children?.map(recursivelyUpdateAll) || [] });
      setMapData(recursivelyUpdateAll(mapData));
      setIsDirty(true);
      setAllDataExpanded(nextValue);
    },
    handleIsolateNode: () => {
      if (selectedNodeIds.size === 0) return;
      const targetId = Array.from(selectedNodeIds)[0];
      const findPath = (node, target, currentPath = []) => {
        if (node.id === target) return [...currentPath, node.id];
        if (node.children) {
          for (const child of node.children) {
            const path = findPath(child, target, [...currentPath, node.id]);
            if (path) return path;
          }
        }
        return null;
      };
      const path = findPath(mapData, targetId);
      if (!path) return;
      const pathSet = new Set(path);
      const updateNodes = (node) => {
        const isAncestor = pathSet.has(node.id) && node.id !== targetId;
        return { ...node, isBranchExpanded: isAncestor, children: node.children?.map(updateNodes) || [] };
      };
      setMapData(updateNodes(mapData));
      setIsDirty(true);
      const nodeObj = treeNodes.find(n => n.id === targetId);
      if (nodeObj && containerRef.current) {
        setTimeout(() => {
          const rect = containerRef.current.getBoundingClientRect();
          setPanOffset({ x: rect.width / 2 - (nodeObj.x + nodeObj.width / 2) * zoom, y: rect.height / 2 - (nodeObj.y + nodeObj.height / 2) * zoom });
        }, 150);
      }
    },
    handleMouseDownMain: (e) => {
      if (editingNodeId && document.activeElement instanceof HTMLInputElement) document.activeElement.blur();
      if (e.button === 0 && e.shiftKey) {
          const rect = containerRef.current.getBoundingClientRect();
          const x = (e.clientX - rect.left - panOffset.x) / zoom;
          const y = (e.clientY - rect.top - panOffset.y) / zoom;
          setSelectionBox({ startX: x, startY: y, endX: x, endY: y });
          setSelectedNodeIds(new Set());
          return;
      }
      if (e.button === 1 || e.button === 0) {
        if (e.target.closest('button')) return;
        e.preventDefault();
        setIsPanning(true);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        panClickStart.current = { x: e.clientX, y: e.clientY };
      }
    },
    handleMouseMove: (e) => {
      if (selectionBox && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setSelectionBox(prev => ({ ...prev, endX: (e.clientX - rect.left - panOffset.x) / zoom, endY: (e.clientY - rect.top - panOffset.y) / zoom }));
          return;
      }
      if (reconnectingData && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const mouseX = (e.clientX - rect.left - panOffset.x) / zoom;
          const mouseY = (e.clientY - rect.top - panOffset.y) / zoom;
          setReconnectingData(prev => ({ ...prev, mouseX, mouseY }));
          const target = treeNodes.find(n => mouseX >= n.x && mouseX <= n.x + n.width && mouseY >= n.y && mouseY <= n.y + n.height && n.id !== reconnectingData.childId && n.id !== reconnectingData.parentId);
          setReconnectTargetId(target?.id || null);
          return;
      }
      if (duplicatingData && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const mouseX = (e.clientX - rect.left - panOffset.x) / zoom;
          const mouseY = (e.clientY - rect.top - panOffset.y) / zoom;
          setDuplicatingData(prev => ({ ...prev, mouseX, mouseY }));
          const target = treeNodes.find(n => mouseX >= n.x && mouseX <= n.x + n.width && mouseY >= n.y && mouseY <= n.y + n.height);
          setReconnectTargetId(target?.id || null);
          return;
      }
      if (isPanning) {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        return;
      }
      if (!draggingNodeId || !containerRef.current) return;
      if (!draggingNodeId.confirmed) {
        const dx = e.clientX - startDragPos.x, dy = e.clientY - startDragPos.y;
        if (Math.sqrt(dx * dx + dy * dy) > 10) { setDraggingNodeId(prev => ({ ...prev, confirmed: true })); dragHappened.current = true; } else return;
      }
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      requestRef.current = requestAnimationFrame(() => {
        const dx = (e.clientX - startDragPos.x) / zoom, dy = (e.clientY - startDragPos.y) / zoom;
        const recursivelyUpdateAllSelected = (n) => {
          let updated = n;
          if (selectedNodeIds.has(n.id)) {
            const start = dragStartPositions.current[n.id];
            if (start) updated = { ...n, x: start.x + dx, y: start.y + dy };
          }
          if (n.children) return { ...updated, children: n.children.map(recursivelyUpdateAllSelected) };
          return updated;
        };
        setMapData(prev => recursivelyUpdateAllSelected(prev));
        setIsDirty(true);
      });
    },
    handleMouseUp: (e) => {
      if (isPanning && panClickStart.current) {
          const dx = e.clientX - panClickStart.current.x, dy = e.clientY - panClickStart.current.y;
          if (Math.sqrt(dx * dx + dy * dy) < 5 && !e.shiftKey) setSelectedNodeIds(new Set());
      }
      setIsPanning(false);
      if (selectionBox) {
          const xMin = Math.min(selectionBox.startX, selectionBox.endX), xMax = Math.max(selectionBox.startX, selectionBox.endX);
          const yMin = Math.min(selectionBox.startY, selectionBox.endY), yMax = Math.max(selectionBox.startY, selectionBox.endY);
          const newlySelected = new Set();
          treeNodes.forEach(node => { if (node.x + node.width/2 >= xMin && node.x + node.width/2 <= xMax && node.y + node.height/2 >= yMin && node.y + node.height/2 <= yMax) newlySelected.add(node.id); });
          setSelectedNodeIds(newlySelected);
          setSelectionBox(null);
      }
      if (reconnectingData) {
          if (reconnectTargetId) handlers.handleReconnectNode(reconnectingData.parentId, reconnectingData.childId, reconnectTargetId);
          setReconnectingData(null); setReconnectTargetId(null);
      }
      if (duplicatingData) {
          if (reconnectTargetId) handlers.handleAttachDuplicatedBranch(reconnectTargetId, duplicatingData.branchRootNode);
          setDuplicatingData(null); setReconnectTargetId(null);
      }
      if (draggingNodeId) setDraggingNodeId(null);
    },
    handleReconnectNode: (oldParentId, childId, newParentId) => {
      let nodeToMove = null;
      const findAndExtract = (n) => {
          if (!n?.children) return n;
          const nodeIdx = n.children.findIndex(c => c.id === childId);
          if (nodeIdx > -1) { nodeToMove = n.children[nodeIdx]; return { ...n, children: n.children.filter(c => c.id !== childId) }; }
          return { ...n, children: n.children.map(findAndExtract) };
      };
      const tempTree = findAndExtract(mapData);
      if (!nodeToMove) return;
      const insertIntoNew = (n) => (n.id === newParentId ? { ...n, children: [...(n.children || []), nodeToMove] } : { ...n, children: n.children?.map(insertIntoNew) || [] });
      setMapData(insertIntoNew(tempTree));
      setIsDirty(true);
    },
    handleInsertIntermediateNode: (parentId, childId) => {
      const newNodeID = 'node_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      const newNode = { id: newNodeID, name: "Nuevo Módulo", description: "Inserción jerárquica", children: [], isBranchExpanded: true, isTextExpanded: false };
      const insertBetween = (n) => {
          if (n.id === parentId) {
              const childIdx = n.children.findIndex(c => c.id === childId);
              if (childIdx > -1) {
                  const newChildren = [...n.children];
                  newChildren[childIdx] = { ...newNode, children: [n.children[childIdx]] };
                  return { ...n, children: newChildren };
              }
          }
          return { ...n, children: n.children?.map(insertBetween) || []};
      };
      setMapData(insertBetween(mapData)); setIsDirty(true);
      setTimeout(() => setEditingNodeId(newNodeID), 200);
    },
    handleStartCut: (e, parentId, childId, handlePos) => setReconnectingData({ parentId, childId, mouseX: handlePos.x, mouseY: handlePos.y }),
    handleStartDuplicateBranch: (e, childId) => {
      const findNode = (n) => (n.id === childId ? n : n.children?.reduce((acc, c) => acc || findNode(c), null));
      const nodeToDuplicate = findNode(mapData);
      if (!nodeToDuplicate) return;
      const rect = containerRef.current.getBoundingClientRect();
      setDuplicatingData({ branchRootNode: JSON.parse(JSON.stringify(nodeToDuplicate)), mouseX: (e.clientX - rect.left - panOffset.x) / zoom, mouseY: (e.clientY - rect.top - panOffset.y) / zoom });
    },
    handleAttachDuplicatedBranch: (targetParentId, branchRoot) => {
      const sanitizedBranch = sanitizeMapData(branchRoot, true);
      const recursivelyAdd = (n) => (n.id === targetParentId ? { ...n, children: [...(n.children || []), sanitizedBranch], isBranchExpanded: true } : { ...n, children: n.children?.map(recursivelyAdd) || [] });
      setMapData(recursivelyAdd(mapData)); setIsDirty(true);
    },
    handleSaveNode: async (updatedNode) => {
      const newMapData = updateNodeInTree(updatedNode.id, n => ({ ...n, ...updatedNode }));
      setInspectedNode(null);
      if (updatedNode.isRoot && activeEsquema) setEsquemas(prev => prev.map(e => e.id === activeEsquema.id ? { ...e, name: updatedNode.name, description: updatedNode.description } : e));
      await handlers.persistToDatabase(newMapData);
    },
    handleSaveNodeName: (nodeId, newName) => { 
      const newData = updateNodeInTree(nodeId, n => ({ ...n, name: newName })); 
      setEditingNodeId(null); 
      handlers.persistToDatabase(newData);
    },
    handleAddSubNodeToTree: (parentId) => {
      const newNodeID = 'node_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      const newNode = { id: newNodeID, name: 'NUEVO SUB-MÓDULO', description: 'Añada una definición técnica...', children: [] };
      setMapData(updateNodeInTree(parentId, n => ({ ...n, children: [...(n.children || []), newNode], isBranchExpanded: true })));
      if (!isCreatorMode) setTimeout(() => setInspectedNode(newNode), 100);
      else setTimeout(() => setEditingNodeId(newNodeID), 200);
    },
    handleImportBranchToNode: async (parentId, jsonData, replace = false) => {
      console.log('--- EXECUTING SYNC AI (Import Branch) ---', { parentId, replace, jsonData });
      
      let finalNewData;
      if (replace) {
        // Delete descendants from database first
        const { error: delErr } = await supabase.from('esquema_nodes').delete().eq('parent_id', parentId);
        if (delErr) {
          console.error("Error deleting old children for replacement:", delErr);
        }
        
        const sourceData = (Array.isArray(jsonData) ? jsonData[0] : jsonData);
        const { children, id: incomingId, ...attributes } = sourceData;
        
        const sanitizedChildren = (children || []).map(c => sanitizeMapData(c, true));
        
        console.log('Replacing node attributes with:', attributes);
        
        finalNewData = updateNodeInTree(parentId, n => ({ 
            ...n, 
            ...attributes, 
            children: sanitizedChildren,
            isBranchExpanded: true 
        }));
      } else {
        // Append Mode: Only add new children
        let nodes = jsonData.children || (Array.isArray(jsonData) ? jsonData : [jsonData]);
        const sanitized = nodes.map(n => sanitizeMapData(n, true));
        
        console.log('Appending sanitized children:', sanitized.length);
        
        finalNewData = updateNodeInTree(parentId, n => ({ 
            ...n, 
            children: [...(n.children || []), ...sanitized], 
            isBranchExpanded: true 
        }));
      }
      setImportTargetNode(null);
      
      // Explicitly persist
      if (finalNewData) {
        console.log('Persisting updated map data to DB...');
        await handlers.persistToDatabase(finalNewData);
      }
    },
    handleDeleteNodeFromTree: (nodeId) => setConfirmDeleteId(nodeId),
    executeDeleteNode: async () => {
      if (!confirmDeleteId) return;
      
      // Delete from database (foreign key ON DELETE CASCADE handles children)
      const { error } = await supabase.from('esquema_nodes').delete().eq('id', confirmDeleteId);
      if (error) {
        console.error("Error deleting node from esquema_nodes:", error);
      }
      
      if (selectedNodeIds.has(confirmDeleteId)) setSelectedNodeIds(prev => { const n = new Set(prev); n.delete(confirmDeleteId); return n; });
      if (editingNodeId === confirmDeleteId) setEditingNodeId(null);
      if (inspectedNode?.id === confirmDeleteId) setInspectedNode(null);
      const recursivelyRemove = (n) => ({ ...n, children: n.children?.filter(c => c.id !== confirmDeleteId).map(recursivelyRemove) || [] });
      setMapData(recursivelyRemove(mapData)); 
      setIsDirty(false);
      setConfirmDeleteId(null);
    },
    handleAutoOrganize: () => {
      const isSelectionActive = selectedNodeIds.size > 0;
      const recursivelyRemoveCoords = (n, parentIsSelected = false) => {
        const isSelected = selectedNodeIds.has(n.id);
        let updated = { ...n };
        if (!isSelectionActive || (isSelected && parentIsSelected)) { delete updated.x; delete updated.y; }
        if (updated.children) updated.children = updated.children.map(c => recursivelyRemoveCoords(c, isSelected));
        return updated;
      };
      setMapData(recursivelyRemoveCoords(mapData)); setIsDirty(true);
      if (!isSelectionActive) setTimeout(centerOnRoot, 100);
    },
    handleDragStart: (e, nodeId) => {
      if (!isAdmin) return;
      e.stopPropagation();
      let newSelection = new Set(selectedNodeIds);
      if (!newSelection.has(nodeId)) newSelection = e.shiftKey ? new Set(newSelection).add(nodeId) : new Set([nodeId]);
      setSelectedNodeIds(newSelection);
      const starts = {}; treeNodes.forEach(n => { if (newSelection.has(n.id)) starts[n.id] = { x: n.x, y: n.y }; });
      dragStartPositions.current = starts;
      const rect = e.currentTarget.getBoundingClientRect();
      setStartDragPos({ x: e.clientX, y: e.clientY });
      setDragOffset({ x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom });
      dragHappened.current = false; setDraggingNodeId({ id: nodeId, confirmed: false });
    },
    handleSetNodeType: async (nodeId, type) => {
      const isPartOfSelection = selectedNodeIds.has(nodeId);
      
      const recursivelyUpdate = (n) => {
        let newNode = { ...n };
        const shouldUpdate = n.id === nodeId || (isPartOfSelection && selectedNodeIds.has(n.id));
        
        if (shouldUpdate) {
          newNode.type = type;
        }
        
        if (n.children && Array.isArray(n.children)) {
          newNode.children = n.children.map(recursivelyUpdate);
        }
        
        return newNode;
      };

      const newData = recursivelyUpdate(mapData);
      setMapData(newData);
      setIsDirty(true);
      
      // Save the entire updated tree to the database immediately
      await handlers.persistToDatabase(newData);
    },
    handleSetNodeCategory: async (nodeId, category) => {
      const isPartOfSelection = selectedNodeIds.has(nodeId);
      
      const recursivelyUpdate = (n) => {
        let newNode = { ...n };
        const shouldUpdate = n.id === nodeId || (isPartOfSelection && selectedNodeIds.has(n.id));
        
        if (shouldUpdate) {
          newNode.category = category;
        }
        
        if (n.children && Array.isArray(n.children)) {
          newNode.children = n.children.map(recursivelyUpdate);
        }
        
        return newNode;
      };

      const newData = recursivelyUpdate(mapData);
      setMapData(newData);
      setIsDirty(true);
      await handlers.persistToDatabase(newData);
    },
    handleSetStorageMode: async (nodeId, mode) => {
      const isPartOfSelection = selectedNodeIds.has(nodeId);
      
      const recursivelyUpdate = (n, force = false) => {
        let newNode = { ...n };
        const isTarget = n.id === nodeId || (isPartOfSelection && selectedNodeIds.has(n.id));
        
        // If we are at the target node OR if we are forcing from a parent
        if (isTarget || force) {
          newNode.storage_mode = mode;
        }

        if (n.children && Array.isArray(n.children)) {
          // If we just updated this node, force the update on children too
          newNode.children = n.children.map(child => recursivelyUpdate(child, isTarget || force));
        }
        return newNode;
      };

      const newData = recursivelyUpdate(mapData);
      setMapData(newData);
      setIsDirty(true);
      await handlers.persistToDatabase(newData);
    },
    handleUpdateNodeInPlanner: (nodeId, updates) => {
      const recursivelyUpdate = (n) => {
        if (n.id === nodeId) return { ...n, ...updates };
        if (n.children && Array.isArray(n.children)) {
            return { ...n, children: n.children.map(recursivelyUpdate) };
        }
        return n;
      };
      const newData = recursivelyUpdate(mapData);
      setMapData(newData);
      setIsDirty(true);
    },
    setCurrentPlan: (plan) => dispatch(setCurrentPlan(plan))
  };

  return {
    state: {
      zoom, setZoom, panOffset, setPanOffset, containerRef, esquemas, activeEsquema, isLoading, isImportModalOpen, setIsImportModalOpen,
      importJsonText, setImportJsonText, isImporting, mapData, setMapData, inspectedNode, setInspectedNode, draggingNodeId, selectedNodeIds,
      selectionBox, isLocked, setIsLocked, showJsonView, setShowJsonView, isCreatorMode, setIsCreatorMode, editingNodeId, setEditingNodeId,
      reconnectingData, reconnectTargetId, duplicatingData, isHighlighterActive, setIsHighlighterActive, markerColor, setMarkerColor,
      allBranchesExpanded, allDataExpanded, importTargetNode, setImportTargetNode, isSaving, isDirty, confirmDeleteId, setConfirmDeleteId,
      nodeLinks, treeNodes, dragHappened, isPanning, viewMode, setViewMode, projectsList
    },
    handlers,
    centerOnRoot
  };
};
