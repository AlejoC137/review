/**
 * Utility to convert flat esquema_nodes rows from Supabase into a nested tree structure
 * matching the layout expected by the mind map canvas and tree layout algorithms.
 */
export const buildTreeFromFlatNodes = (rows) => {
  if (!rows || rows.length === 0) return null;

  // Map database row properties to camelCase JS nodes
  const nodeMap = {};
  rows.forEach(row => {
    nodeMap[row.id] = {
      id: row.id,
      name: row.name || '',
      description: row.description || '',
      category: row.category || '',
      type: row.type || 'DOC',
      roles: row.roles || '',
      x: row.x !== null && row.x !== undefined ? row.x : undefined,
      y: row.y !== null && row.y !== undefined ? row.y : undefined,
      width: row.width !== null ? row.width : undefined,
      height: row.height !== null ? row.height : undefined,
      depth: row.depth || 0,
      isRoot: !!row.is_root,
      isBranchExpanded: row.is_branch_expanded !== false, // defaults to true
      isTextExpanded: !!row.is_text_expanded,
      isHighlighted: !!row.is_highlighted,
      highlightColor: row.highlight_color || null,
      storage_mode: row.storage_mode || 'INHERIT',
      externalLinks: row.external_links || [],
      externalResources: row.external_resources || [],
      path: row.path || [],
      recurso_id: row.recurso_id || null,
      children: []
    };
  });

  let root = null;

  rows.forEach(row => {
    const node = nodeMap[row.id];
    if (row.is_root || !row.parent_id) {
      root = node;
    } else {
      const parent = nodeMap[row.parent_id];
      if (parent) {
        parent.children.push(node);
      }
    }
  });

  // Fallback root if none explicitly matches
  if (!root) {
    const nodes = Object.values(nodeMap);
    root = nodes.find(n => n.depth === 0) || nodes[0] || null;
  }

  // Ensure helper fields like hasChildren and hasDescription are computed
  const computeHelperFields = (node) => {
    if (!node) return;
    node.hasChildren = node.children && node.children.length > 0;
    node.hasDescription = !!node.description;
    if (node.children && node.children.length > 0) {
      node.children.forEach(computeHelperFields);
    }
  };

  computeHelperFields(root);
  return root;
};
