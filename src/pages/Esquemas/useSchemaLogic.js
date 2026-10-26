import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { INITIAL_MIND_MAP_DATA, MARKER_COLORS } from './constants';
import { layoutTree } from './layoutTree';
import { buildTreeFromFlatNodes, flattenTreeToNodes } from '../../utils/schemaUtils';
import { generateBranchAiPrompt } from './schemaAiPrompt';

export const useSchemaLogic = (schemaIdFromUrl, navigate, projectId = null, initialTab = null) => {
  const [schemas, setSchemas] = useState([]);
  const [selectedSchema, setSelectedSchema] = useState(null);
  const [mapData, setMapData] = useState(INITIAL_MIND_MAP_DATA);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Viewport State
  const [panOffset, setPanOffset] = useState({ x: 80, y: 50 });
  const [zoom, setZoom] = useState(0.65);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Selection & Interaction State
  const [selectedNodeIds, setSelectedNodeIds] = useState(new Set());
  const [selectionBox, setSelectionBox] = useState(null);
  const [isolatedNodeId, setIsolatedNodeId] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isCreatorMode, setIsCreatorMode] = useState(false);
  const [allBranchesExpanded, setAllBranchesExpanded] = useState(true);
  const [allDataExpanded, setAllDataExpanded] = useState(false);

  // Measured DOM dimensions per node ID so expanded nodes never overlap
  const [nodeDimensions, setNodeDimensions] = useState({});

  const handleNodeResize = useCallback((nodeId, size) => {
    setNodeDimensions((prev) => {
      const existing = prev[nodeId];
      if (
        existing &&
        Math.abs(existing.width - size.width) < 2 &&
        Math.abs(existing.height - size.height) < 2
      ) {
        return prev;
      }
      return { ...prev, [nodeId]: size };
    });
  }, []);

  // Highlighter State
  const [isHighlighterActive, setIsHighlighterActive] = useState(false);
  const [markerColor, setMarkerColor] = useState(MARKER_COLORS[0].value);

  // Modals & Context Menu
  const [editingNode, setEditingNode] = useState(null);
  const [parentForNewNode, setParentForNewNode] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [showJsonView, setShowJsonView] = useState(false);
  const [nodeForJsonModal, setNodeForJsonModal] = useState(null);
  const [showUniversalJsonModal, setShowUniversalJsonModal] = useState(false);
  const [showNewSchemaModal, setShowNewSchemaModal] = useState(false);
  const [previewNode, setPreviewNode] = useState(null);
  const [showBimPlannerModal, setShowBimPlannerModal] = useState(false);

  // View Mode: 'canvas' | 'revit_actions' | 'cde'
  const [viewMode, setViewMode] = useState(initialTab === 'revit_actions' ? 'revit_actions' : 'canvas');

  // Dynamic Dragging/Connecting State
  const [connectingData, setConnectingData] = useState(null);
  const [draggingNode, setDraggingNode] = useState(null);

  // --- PERSISTENCE & FETCHING ---

  const fetchSchemas = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('esquemas')
        .select('*')
        .order('updated_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSchemas(data || []);

      if (schemaIdFromUrl && data) {
        const target = data.find((s) => String(s.id) === String(schemaIdFromUrl));
        if (target) {
          handleSelectSchema(target);
        }
      }
    } catch (err) {
      console.error('Error fetching schemas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemas();
  }, [schemaIdFromUrl, projectId]);

  const syncDataToSupabase = async (newTree, targetSchemaId = selectedSchema?.id) => {
    if (!targetSchemaId) return;
    setIsSaving(true);
    try {
      // 1. Save full tree into `esquemas.map_data` so blockType, blocks, revitAction, cableOffset, bgColor are preserved
      await supabase
        .from('esquemas')
        .update({
          map_data: newTree,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetSchemaId);

      // 2. Also keep relational `esquema_nodes` in sync
      const flatNodes = flattenTreeToNodes(newTree, targetSchemaId);
      const { error: deleteError } = await supabase
        .from('esquema_nodes')
        .delete()
        .eq('esquema_id', targetSchemaId);
      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from('esquema_nodes')
        .insert(flatNodes);
      if (insertError) throw insertError;
    } catch (err) {
      console.error('Failed to sync schema nodes:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // --- ACTIONS ---

  const handleSelectSchema = async (schema) => {
    setLoading(true);
    setSelectedSchema(schema);
    try {
      const { data: nodes, error } = await supabase
        .from('esquema_nodes')
        .select('*')
        .eq('esquema_id', schema.id)
        .order('order_index', { ascending: true });

      if (error) throw error;

      // Prefer rich `map_data` if it contains children/blocks/revitAction, otherwise rebuild from `esquema_nodes`
      if (schema.map_data && schema.map_data.id) {
        setMapData(schema.map_data);
      } else if (nodes && nodes.length > 0) {
        const tree = buildTreeFromFlatNodes(nodes);
        setMapData(tree);
      } else {
        const initialTree = {
          ...INITIAL_MIND_MAP_DATA,
          name: schema.title,
          description: schema.description || 'Esquema general'
        };
        setMapData(initialTree);
        await syncDataToSupabase(initialTree, schema.id);
      }
      setTimeout(() => centerOnRoot(), 100);
    } catch (err) {
      console.error('Error loading schema details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchema = async ({ title, description, category }) => {
    setIsSaving(true);
    try {
      const initialMap = {
        ...INITIAL_MIND_MAP_DATA,
        name: title,
        description: description || 'Nuevo esquema interactivo con Capa Revit'
      };

      const insertPayload = {
        title,
        description,
        category: category || 'General',
        map_data: initialMap
      };
      if (projectId) {
        insertPayload.project_id = projectId;
      }

      const { data: newSchema, error: schemaError } = await supabase
        .from('esquemas')
        .insert([insertPayload])
        .select()
        .single();

      if (schemaError) throw schemaError;

      await syncDataToSupabase(initialMap, newSchema.id);

      setSchemas([newSchema, ...schemas]);
      setSelectedSchema(newSchema);
      setMapData(initialMap);
      setShowNewSchemaModal(false);
      if (!projectId && navigate) {
        navigate(`/esquemas/${newSchema.id}`);
      }
    } catch (err) {
      console.error('Error creating schema:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSchema = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('¿Estás seguro de eliminar este esquema y todos sus nodos?')) return;

    try {
      const { error } = await supabase.from('esquemas').delete().eq('id', id);
      if (error) throw error;
      setSchemas(schemas.filter((s) => s.id !== id));
      if (selectedSchema?.id === id) {
        setSelectedSchema(null);
        if (!projectId && navigate) navigate('/esquemas');
      }
    } catch (err) {
      console.error('Error deleting schema:', err);
    }
  };

  // --- LAYOUT & VIEWPORT ---

  const centerOnRoot = () => {
    if (!containerRef.current) return;
    setPanOffset({ x: 80, y: 50 });
    setZoom(0.65);
  };

  const nodesWithPositions = useMemo(() => {
    return layoutTree(mapData, 100, 100, nodeDimensions);
  }, [mapData, nodeDimensions]);

  const visibleNodes = useMemo(() => {
    if (!isolatedNodeId) return nodesWithPositions;
    const isolatedSubtreeIds = new Set();
    const collectIds = (node) => {
      isolatedSubtreeIds.add(node.id);
      if (node.children) node.children.forEach(collectIds);
    };

    const findAndCollect = (curr) => {
      if (curr.id === isolatedNodeId) {
        collectIds(curr);
        return true;
      }
      if (curr.children) return curr.children.some(findAndCollect);
      return false;
    };

    findAndCollect(mapData);
    return nodesWithPositions.filter((n) => isolatedSubtreeIds.has(n.id));
  }, [nodesWithPositions, isolatedNodeId, mapData]);

  // --- NODE MANIPULATION ---

  const handleToggleText = (nodeId) => {
    const toggleRecursive = (curr) => {
      if (curr.id === nodeId) {
        return { ...curr, isTextExpanded: !curr.isTextExpanded };
      }
      if (curr.children) {
        return { ...curr, children: curr.children.map(toggleRecursive) };
      }
      return curr;
    };
    const nextTree = toggleRecursive(mapData);
    setMapData(nextTree);
    syncDataToSupabase(nextTree);
  };

  const handleToggleBranch = (nodeId) => {
    const toggleRecursive = (curr) => {
      if (curr.id === nodeId) {
        return { ...curr, isBranchExpanded: !curr.isBranchExpanded };
      }
      if (curr.children) {
        return { ...curr, children: curr.children.map(toggleRecursive) };
      }
      return curr;
    };
    const nextTree = toggleRecursive(mapData);
    setMapData(nextTree);
    syncDataToSupabase(nextTree);
  };

  const handleGlobalTreeToggle = () => {
    const nextState = !allBranchesExpanded;
    setAllBranchesExpanded(nextState);
    const updateAll = (curr) => ({
      ...curr,
      isBranchExpanded: nextState || curr.id === 'root',
      children: curr.children ? curr.children.map(updateAll) : []
    });
    const nextTree = updateAll(mapData);
    setMapData(nextTree);
    syncDataToSupabase(nextTree);
  };

  const handleGlobalDataToggle = () => {
    const nextState = !allDataExpanded;
    setAllDataExpanded(nextState);
    const updateAll = (curr) => ({
      ...curr,
      isTextExpanded: nextState || curr.id === 'root',
      children: curr.children ? curr.children.map(updateAll) : []
    });
    const nextTree = updateAll(mapData);
    setMapData(nextTree);
    syncDataToSupabase(nextTree);
  };

  const handleIsolateNode = () => {
    if (isolatedNodeId) {
      setIsolatedNodeId(null);
    } else if (selectedNodeIds.size === 1) {
      setIsolatedNodeId(Array.from(selectedNodeIds)[0]);
    }
  };

  const handleAutoOrganize = () => {
    const clearPositions = (curr) => {
      const { x, y, cableOffset, ...rest } = curr;
      return {
        ...rest,
        children: curr.children ? curr.children.map(clearPositions) : []
      };
    };
    const nextTree = clearPositions(mapData);
    setMapData(nextTree);
    syncDataToSupabase(nextTree);
  };

  const handleUpdateCableOffset = (childId, newOffset, shouldSync = false) => {
    const updateRecursive = (curr) => {
      if (curr.id === childId) {
        return { ...curr, cableOffset: newOffset };
      }
      if (curr.children) {
        return { ...curr, children: curr.children.map(updateRecursive) };
      }
      return curr;
    };
    const nextTree = updateRecursive(mapData);
    setMapData(nextTree);
    if (shouldSync) {
      syncDataToSupabase(nextTree);
    }
  };

  const handleSaveNodeContent = (nodeId, payload) => {
    const updateRecursive = (curr) => {
      if (curr.id === nodeId) {
        return { ...curr, ...payload };
      }
      if (curr.children) {
        return { ...curr, children: curr.children.map(updateRecursive) };
      }
      return curr;
    };
    const nextTree = updateRecursive(mapData);
    setMapData(nextTree);
    syncDataToSupabase(nextTree);
  };

  const handleDeleteNode = (nodeId) => {
    if (!nodeId || nodeId === 'root') return;
    const removeRecursive = (curr) => ({
      ...curr,
      children: curr.children
        ? curr.children.filter((c) => c.id !== nodeId).map(removeRecursive)
        : []
    });
    const nextTree = removeRecursive(mapData);
    setMapData(nextTree);
    syncDataToSupabase(nextTree);
  };

  const handleQuickAddChild = (parentNode, side = null) => {
    if (!parentNode) return;
    const newNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: 'Nuevo Nodo',
      description: '',
      blockType: 'unselected',
      side: side || parentNode.side || 'right',
      isTextExpanded: true,
      isBranchExpanded: true,
      children: []
    };

    const addRecursive = (curr) => {
      if (curr.id === parentNode.id) {
        return {
          ...curr,
          isBranchExpanded: true,
          children: [...(curr.children || []), newNode]
        };
      }
      if (curr.children) {
        return { ...curr, children: curr.children.map(addRecursive) };
      }
      return curr;
    };

    const nextTree = addRecursive(mapData);
    setMapData(nextTree);
    syncDataToSupabase(nextTree);
  };

  // Add a Revit Action Node to a specific branch (used by RevitActionsTabView)
  const handleAddActionNodeToBranch = (branchNodeId, actionNodeData) => {
    const newNode = {
      id: `revit_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: actionNodeData.name || 'Acción Revit',
      description: actionNodeData.description || '',
      blockType: 'revit_action',
      bgColor: actionNodeData.bgColor || '#e0f2fe',
      revitAction: actionNodeData.revitAction,
      isTextExpanded: false,
      isBranchExpanded: true,
      children: []
    };

    const addRecursive = (curr) => {
      if (String(curr.id) === String(branchNodeId)) {
        return {
          ...curr,
          isBranchExpanded: true,
          children: [...(curr.children || []), newNode]
        };
      }
      if (curr.children) {
        return { ...curr, children: curr.children.map(addRecursive) };
      }
      return curr;
    };

    const nextTree = addRecursive(mapData);
    setMapData(nextTree);
    syncDataToSupabase(nextTree);
  };

  // Inject a pre-built Revit process branch with multiple actions
  const handleInjectPresetBranch = (preset) => {
    if (!preset) return;
    const baseTime = Date.now();
    const branchNode = {
      id: `branch_${baseTime}`,
      name: preset.branchName || preset.title,
      description: preset.description || '',
      blockType: 'text',
      bgColor: '#f1f5f9',
      isBranchExpanded: true,
      isTextExpanded: false,
      children: (preset.actions || []).map((act, idx) => ({
        id: `revit_${baseTime}_${idx}`,
        name: act.name,
        description: act.description || '',
        blockType: 'revit_action',
        bgColor: '#e0f2fe',
        revitAction: {
          ...act.revitAction,
          order: act.revitAction?.order || idx + 1
        },
        isBranchExpanded: true,
        isTextExpanded: false,
        children: []
      }))
    };

    const nextTree = {
      ...mapData,
      isBranchExpanded: true,
      children: [...(mapData.children || []), branchNode]
    };
    setMapData(nextTree);
    syncDataToSupabase(nextTree);
  };

  const handleSaveNode = (formData) => {
    let nextTree;
    if (editingNode) {
      const updateRecursive = (curr) => {
        if (curr.id === editingNode.id) {
          return {
            ...curr,
            name: formData.name,
            description: formData.description,
            type: formData.type,
            fileUrl: formData.fileUrl,
            blockType: formData.blockType || curr.blockType || 'text',
            revitAction: formData.revitAction !== undefined ? formData.revitAction : curr.revitAction
          };
        }
        if (curr.children) {
          return { ...curr, children: curr.children.map(updateRecursive) };
        }
        return curr;
      };
      nextTree = updateRecursive(mapData);
    } else if (parentForNewNode) {
      const newNode = {
        id: `node_${Date.now()}`,
        name: formData.name,
        description: formData.description,
        type: formData.type || 'DOC',
        fileUrl: formData.fileUrl || '',
        blockType: formData.blockType || (formData.description ? 'text' : 'unselected'),
        revitAction: formData.revitAction || null,
        isTextExpanded: true,
        isBranchExpanded: true,
        children: []
      };
      const addRecursive = (curr) => {
        if (curr.id === parentForNewNode.id) {
          return {
            ...curr,
            isBranchExpanded: true,
            children: [...(curr.children || []), newNode]
          };
        }
        if (curr.children) {
          return { ...curr, children: curr.children.map(addRecursive) };
        }
        return curr;
      };
      nextTree = addRecursive(mapData);
    }

    if (nextTree) {
      setMapData(nextTree);
      syncDataToSupabase(nextTree);
    }
    setEditingNode(null);
    setParentForNewNode(null);
  };

  const handleCutConnection = (e, parentId, childId) => {
    const removeChild = (curr) => {
      if (curr.id === parentId) {
        return {
          ...curr,
          children: curr.children.filter((c) => c.id !== childId)
        };
      }
      if (curr.children) {
        return { ...curr, children: curr.children.map(removeChild) };
      }
      return curr;
    };
    const nextTree = removeChild(mapData);
    setMapData(nextTree);
    syncDataToSupabase(nextTree);
  };

  const handleInsertIntermediateNode = (parentId, childId) => {
    const newNodeId = `inter_${Date.now()}`;
    const insertRecursive = (curr) => {
      if (curr.id === parentId) {
        const targetChild = curr.children.find((c) => c.id === childId);
        const otherChildren = curr.children.filter((c) => c.id !== childId);
        const intermediateNode = {
          id: newNodeId,
          name: 'Nuevo Proceso Intermedio',
          description: '',
          blockType: 'unselected',
          isBranchExpanded: true,
          children: [targetChild]
        };
        return { ...curr, children: [...otherChildren, intermediateNode] };
      }
      if (curr.children) {
        return { ...curr, children: curr.children.map(insertRecursive) };
      }
      return curr;
    };
    const nextTree = insertRecursive(mapData);
    setMapData(nextTree);
    syncDataToSupabase(nextTree);
  };

  const handleDuplicateBranch = (e, nodeId) => {
    const cloneDeep = (n) => ({
      ...n,
      id: `${n.id}_copy_${Math.random().toString(36).substr(2, 4)}`,
      x: n.x !== undefined ? n.x + 40 : undefined,
      y: n.y !== undefined ? n.y + 40 : undefined,
      children: n.children ? n.children.map(cloneDeep) : []
    });

    const duplicateInParent = (curr) => {
      if (curr.children && curr.children.some((c) => c.id === nodeId)) {
        const original = curr.children.find((c) => c.id === nodeId);
        const cloned = cloneDeep(original);
        return { ...curr, children: [...curr.children, cloned] };
      }
      if (curr.children) {
        return { ...curr, children: curr.children.map(duplicateInParent) };
      }
      return curr;
    };

    const nextTree = duplicateInParent(mapData);
    setMapData(nextTree);
    syncDataToSupabase(nextTree);
  };

  const normalizeImportedNode = (n, isRootNode = false) => {
    const hasRevit = n.blockType === 'revit_action' || !!n.revitAction;
    const desc =
      n.description ||
      (Array.isArray(n.blocks) && n.blocks[0]?.value) ||
      '';
    const inferredBlockType =
      n.blockType ||
      (hasRevit ? 'revit_action' : null) ||
      (Array.isArray(n.blocks) && n.blocks[0]?.type) ||
      (desc ? 'text' : 'unselected');

    return {
      ...n,
      id:
        isRootNode
          ? 'root'
          : n.id && n.id !== 'root'
          ? String(n.id)
          : `json_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: n.name || n.title || 'Nodo sin título',
      description: desc,
      blockType: inferredBlockType,
      revitAction: n.revitAction || null,
      isRoot: isRootNode,
      isBranchExpanded: true,
      isTextExpanded: !!desc || hasRevit || isRootNode,
      children: Array.isArray(n.children)
        ? n.children.map((ch) => normalizeImportedNode(ch, false))
        : []
    };
  };

  const handleImportJsonToNode = async (jsonData, replaceBranch = false) => {
    if (!nodeForJsonModal) return;

    const updateRecursive = (curr) => {
      if (curr.id === nodeForJsonModal.id) {
        if (replaceBranch) {
          const normalized = normalizeImportedNode(jsonData, curr.id === 'root');
          return { ...normalized, id: curr.id };
        } else {
          const incomingList = Array.isArray(jsonData)
            ? jsonData
            : jsonData.children || [jsonData];
          const newChildren = incomingList.map((ch) =>
            normalizeImportedNode(ch, false)
          );
          return {
            ...curr,
            isBranchExpanded: true,
            children: [...(curr.children || []), ...newChildren]
          };
        }
      }
      if (curr.children) {
        return { ...curr, children: curr.children.map(updateRecursive) };
      }
      return curr;
    };

    const nextTree = updateRecursive(mapData);
    setMapData(nextTree);
    await syncDataToSupabase(nextTree);
  };

  const handleUniversalJsonImport = async (jsonData, replaceAll = true) => {
    let nextTree;
    if (replaceAll) {
      if (Array.isArray(jsonData)) {
        nextTree = {
          ...mapData,
          isBranchExpanded: true,
          children: jsonData.map((ch) => normalizeImportedNode(ch, false))
        };
      } else {
        nextTree = normalizeImportedNode(jsonData, true);
      }
    } else {
      const incomingList = Array.isArray(jsonData)
        ? jsonData
        : jsonData.children || [jsonData];
      const newChildren = incomingList.map((ch) =>
        normalizeImportedNode(ch, false)
      );
      nextTree = {
        ...mapData,
        isBranchExpanded: true,
        children: [...(mapData.children || []), ...newChildren]
      };
    }

    setMapData(nextTree);
    setNodeDimensions({});
    await syncDataToSupabase(nextTree);
  };

  // --- DRAG & CANVAS INTERACTION ---

  const handleStartDragNode = (e, node) => {
    if (isLocked && !isCreatorMode) return;
    if (isHighlighterActive) {
      const applyColor = (curr) => {
        if (curr.id === node.id) {
          return {
            ...curr,
            highlightColor: curr.highlightColor === markerColor ? null : markerColor
          };
        }
        if (curr.children) return { ...curr, children: curr.children.map(applyColor) };
        return curr;
      };
      const next = applyColor(mapData);
      setMapData(next);
      syncDataToSupabase(next);
      return;
    }

    e.stopPropagation();
    setDraggingNode({
      id: node.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: node.x,
      initialY: node.y
    });
  };

  const handleStartConnect = (e, nodeId, startPos, portSide = 'right') => {
    e.stopPropagation();
    setConnectingData({
      sourceId: nodeId,
      portSide,
      startX: startPos.x,
      startY: startPos.y,
      currX: startPos.x,
      currY: startPos.y
    });
  };

  const handleCompleteConnect = (targetId, targetPortSide = null) => {
    if (!connectingData || connectingData.sourceId === targetId) {
      setConnectingData(null);
      return;
    }

    const sourceId = connectingData.sourceId;
    const sourcePortSide = connectingData.portSide;
    setConnectingData(null);

    if (targetId === 'root') return;

    // Prevent cycles: check if sourceId is inside targetId's subtree
    let targetNodeObj = null;
    const findTarget = (curr) => {
      if (curr.id === targetId) {
        targetNodeObj = curr;
        return;
      }
      if (curr.children) curr.children.forEach(findTarget);
    };
    findTarget(mapData);
    if (!targetNodeObj) return;

    let createsCycle = false;
    const checkDescendant = (curr) => {
      if (curr.id === sourceId) createsCycle = true;
      if (curr.children) curr.children.forEach(checkDescendant);
    };
    checkDescendant(targetNodeObj);
    if (createsCycle) return;

    // Remove targetNodeObj from its old parent and attach it as child of sourceId
    const removeTarget = (curr) => ({
      ...curr,
      children: curr.children
        ? curr.children.filter((c) => c.id !== targetId).map(removeTarget)
        : []
    });

    const treeWithoutTarget = removeTarget(mapData);
    const updatedTargetNode = {
      ...targetNodeObj,
      side: sourcePortSide === 'left' ? 'left' : 'right'
    };

    const attachToSource = (curr) => {
      if (curr.id === sourceId) {
        return {
          ...curr,
          isBranchExpanded: true,
          children: [...(curr.children || []), updatedTargetNode]
        };
      }
      if (curr.children) {
        return { ...curr, children: curr.children.map(attachToSource) };
      }
      return curr;
    };

    const nextTree = attachToSource(treeWithoutTarget);
    setMapData(nextTree);
    syncDataToSupabase(nextTree);
  };

  const handleMouseMove = (e) => {
    if (draggingNode) {
      const dx = (e.clientX - draggingNode.startX) / zoom;
      const dy = (e.clientY - draggingNode.startY) / zoom;

      const updatePos = (curr) => {
        if (curr.id === draggingNode.id) {
          return {
            ...curr,
            x: Math.round(draggingNode.initialX + dx),
            y: Math.round(draggingNode.initialY + dy)
          };
        }
        if (curr.children) return { ...curr, children: curr.children.map(updatePos) };
        return curr;
      };
      setMapData(updatePos(mapData));
    } else if (connectingData) {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const currX = (e.clientX - rect.left - panOffset.x) / zoom;
      const currY = (e.clientY - rect.top - panOffset.y) / zoom;
      setConnectingData((prev) => (prev ? { ...prev, currX, currY } : null));
    } else if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else if (selectionBox) {
      const rect = containerRef.current.getBoundingClientRect();
      const currX = (e.clientX - rect.left - panOffset.x) / zoom;
      const currY = (e.clientY - rect.top - panOffset.y) / zoom;
      setSelectionBox({ ...selectionBox, endX: currX, endY: currY });

      const x1 = Math.min(selectionBox.startX, currX);
      const x2 = Math.max(selectionBox.startX, currX);
      const y1 = Math.min(selectionBox.startY, currY);
      const y2 = Math.max(selectionBox.startY, currY);

      const newlySelected = new Set();
      visibleNodes.forEach((n) => {
        if (n.x >= x1 && n.x + n.width <= x2 && n.y >= y1 && n.y + n.height <= y2) {
          newlySelected.add(n.id);
        }
      });
      setSelectedNodeIds(newlySelected);
    }
  };

  const handleMouseUp = () => {
    if (draggingNode) {
      syncDataToSupabase(mapData);
      setDraggingNode(null);
    }
    if (connectingData) {
      const { currX, currY, sourceId, portSide } = connectingData;
      const hitNode = visibleNodes.find(
        (n) =>
          n.id !== sourceId &&
          currX >= n.x - 16 &&
          currX <= n.x + n.width + 16 &&
          currY >= n.y - 16 &&
          currY <= n.y + n.height + 16
      );

      if (hitNode) {
        handleCompleteConnect(hitNode.id);
      } else {
        const sourceNode = visibleNodes.find((n) => n.id === sourceId);
        if (sourceNode) {
          const newNode = {
            id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name: 'Nuevo Nodo',
            description: '',
            blockType: 'unselected',
            side: portSide === 'left' ? 'left' : 'right',
            x: Math.round(portSide === 'left' ? currX - 260 : currX),
            y: Math.round(currY - 30),
            isTextExpanded: true,
            isBranchExpanded: true,
            children: []
          };
          const addRecursive = (curr) => {
            if (curr.id === sourceId) {
              return {
                ...curr,
                isBranchExpanded: true,
                children: [...(curr.children || []), newNode]
              };
            }
            if (curr.children) {
              return { ...curr, children: curr.children.map(addRecursive) };
            }
            return curr;
          };
          const nextTree = addRecursive(mapData);
          setMapData(nextTree);
          syncDataToSupabase(nextTree);
        }
        setConnectingData(null);
      }
    }
    setIsDragging(false);
    setSelectionBox(null);
  };

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      const newZoom = Math.min(Math.max(zoom + delta, 0.1), 3);

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const canvasX = (mouseX - panOffset.x) / zoom;
        const canvasY = (mouseY - panOffset.y) / zoom;
        setPanOffset({
          x: mouseX - canvasX * newZoom,
          y: mouseY - canvasY * newZoom
        });
      }
      setZoom(newZoom);
    } else {
      setPanOffset({
        x: panOffset.x - e.deltaX,
        y: panOffset.y - e.deltaY
      });
    }
  };

  return {
    schemas,
    selectedSchema,
    setSelectedSchema,
    mapData,
    setMapData,
    loading,
    isSaving,
    panOffset,
    setPanOffset,
    zoom,
    setZoom,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
    containerRef,
    selectedNodeIds,
    setSelectedNodeIds,
    selectionBox,
    setSelectionBox,
    isolatedNodeId,
    setIsolatedNodeId,
    isLocked,
    setIsLocked,
    isCreatorMode,
    setIsCreatorMode,
    allBranchesExpanded,
    allDataExpanded,
    isHighlighterActive,
    setIsHighlighterActive,
    markerColor,
    setMarkerColor,
    editingNode,
    setEditingNode,
    parentForNewNode,
    setParentForNewNode,
    contextMenu,
    setContextMenu,
    showJsonView,
    setShowJsonView,
    nodeForJsonModal,
    setNodeForJsonModal,
    showUniversalJsonModal,
    setShowUniversalJsonModal,
    showNewSchemaModal,
    setShowNewSchemaModal,
    previewNode,
    setPreviewNode,
    showBimPlannerModal,
    setShowBimPlannerModal,
    viewMode,
    setViewMode,
    connectingData,
    visibleNodes,
    handleSelectSchema,
    handleCreateSchema,
    handleDeleteSchema,
    centerOnRoot,
    handleToggleText,
    handleToggleBranch,
    handleGlobalTreeToggle,
    handleGlobalDataToggle,
    handleIsolateNode,
    handleAutoOrganize,
    handleUpdateCableOffset,
    handleSaveNodeContent,
    handleDeleteNode,
    handleQuickAddChild,
    handleAddActionNodeToBranch,
    handleInjectPresetBranch,
    handleNodeResize,
    handleSaveNode,
    handleCutConnection,
    handleInsertIntermediateNode,
    handleDuplicateBranch,
    handleImportJsonToNode,
    handleUniversalJsonImport,
    handleStartDragNode,
    handleStartConnect,
    handleCompleteConnect,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleCopyAiPrompt: (node) => {
      const target = node || nodeForJsonModal || { name: 'Rama Principal', id: 'root' };
      const prompt = generateBranchAiPrompt(mapData, target, true);
      navigator.clipboard.writeText(prompt);
      alert('¡Prompt contextual con Capa de Acciones Revit copiado al portapapeles!');
    }
  };
};
