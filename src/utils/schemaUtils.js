/**
 * Converts flat list of database nodes into a hierarchical tree structure
 */
export const buildTreeFromFlatNodes = (flatNodes) => {
  if (!flatNodes || flatNodes.length === 0) return null;

  const nodeMap = {};
  let root = null;

  // First pass: create entries in map
  flatNodes.forEach((node) => {
    // Parse extra metadata stored in highlight_color or blocks if JSON-encoded
    let parsedMeta = {};
    if (
      typeof node.highlight_color === 'string' &&
      node.highlight_color.startsWith('{')
    ) {
      try {
        parsedMeta = JSON.parse(node.highlight_color);
      } catch (_) {}
    }

    nodeMap[node.node_key] = {
      id: node.node_key,
      name: node.name,
      description: node.description || '',
      type: node.node_type || 'DOC',
      fileUrl: node.file_url || '',
      highlightColor: parsedMeta.highlightColor || (node.highlight_color?.startsWith('{') ? null : node.highlight_color),
      bgColor: parsedMeta.bgColor || undefined,
      blockType: parsedMeta.blockType || (parsedMeta.revitAction ? 'revit_action' : undefined),
      revitAction: parsedMeta.revitAction || undefined,
      cableOffset: parsedMeta.cableOffset || undefined,
      side: parsedMeta.side || undefined,
      x: node.pos_x !== null ? Number(node.pos_x) : undefined,
      y: node.pos_y !== null ? Number(node.pos_y) : undefined,
      isTextExpanded: !!node.is_text_expanded,
      isBranchExpanded: node.is_branch_expanded !== false,
      isRoot: !!node.is_root,
      children: []
    };
  });

  // Second pass: link children to parents
  flatNodes.forEach((node) => {
    const current = nodeMap[node.node_key];
    if (node.is_root || !node.parent_key) {
      root = current;
    } else if (nodeMap[node.parent_key]) {
      nodeMap[node.parent_key].children.push(current);
    }
  });

  return root;
};

/**
 * Flattens a hierarchical tree structure into an array of database-ready rows
 */
export const flattenTreeToNodes = (node, schemaId, parentKey = null, index = 0) => {
  if (!node) return [];

  // Pack extended Revit Action & Markdown Schema metadata into highlight_color if needed
  const hasExtendedMeta =
    node.revitAction ||
    node.blockType ||
    node.bgColor ||
    node.cableOffset ||
    node.side;

  const packedHighlight = hasExtendedMeta
    ? JSON.stringify({
        highlightColor: node.highlightColor || null,
        bgColor: node.bgColor || null,
        blockType: node.blockType || null,
        revitAction: node.revitAction || null,
        cableOffset: node.cableOffset || null,
        side: node.side || null
      })
    : node.highlightColor || null;

  const currentRow = {
    esquema_id: schemaId,
    node_key: String(node.id),
    parent_key: parentKey ? String(parentKey) : null,
    name: node.name || 'Sin título',
    description: node.description || '',
    node_type: node.type || (node.blockType === 'revit_action' ? 'REVIT_ACTION' : 'DOC'),
    file_url: node.fileUrl || null,
    highlight_color: packedHighlight,
    pos_x: node.x !== undefined ? node.x : null,
    pos_y: node.y !== undefined ? node.y : null,
    is_text_expanded: !!node.isTextExpanded,
    is_branch_expanded: node.isBranchExpanded !== false,
    is_root: !!node.isRoot || parentKey === null,
    order_index: index
  };

  let rows = [currentRow];

  if (node.children && Array.isArray(node.children)) {
    node.children.forEach((child, idx) => {
      rows = rows.concat(flattenTreeToNodes(child, schemaId, node.id, idx));
    });
  }

  return rows;
};
