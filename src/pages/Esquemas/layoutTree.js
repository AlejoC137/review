/**
 * Tree layout algorithm with dynamic heights based on expansion state
 */
export const layoutTree = (node, startX = 100, startY = 100) => {
  const horizontalGap = 120;
  const verticalGap = 40;
  
  const columnWidths = {
    0: 360, 1: 340, 2: 300, 3: 260
  };

  // PASS 1: Calculate subtree heights and metrics
  const getSubtreeMetrics = (n, depth) => {
    const nodeWidth = columnWidths[depth] || 250;
    const isTextExpanded = !!n.isTextExpanded || n.id === 'root';
    const isBranchExpanded = !!n.isBranchExpanded || n.id === 'root';
    const hasDescription = !!n.description;
    const charsPerTitleLine = Math.floor(nodeWidth / 13);
    const charsPerDescLine = Math.floor(nodeWidth / 6.2);
    
    const titleLines = Math.ceil(n.name.length / charsPerTitleLine);
    let descLines = 0;
    if (hasDescription && isTextExpanded) {
      descLines = Math.min(Math.ceil(n.description.length / charsPerDescLine), 5);
    }

    const basePaddings = depth === 0 ? 32 : depth === 1 ? 24 : 20;
    const paddingAddition = (hasDescription && isTextExpanded) ? 8 : 0;
    const nodeHeight = basePaddings + (titleLines * 18) + (descLines * 14.5) + paddingAddition;

    let totalHeight = nodeHeight;
    const childrenMetrics = [];

    if (n.children && Array.isArray(n.children) && n.children.length > 0 && isBranchExpanded) {
      let childrenTotalHeight = 0;
      n.children.forEach(child => {
        if (!child) return;
        const metrics = getSubtreeMetrics(child, depth + 1);
        childrenMetrics.push(metrics);
        childrenTotalHeight += metrics.totalHeight + verticalGap;
      });
      childrenTotalHeight -= verticalGap; // Remove last gap
      totalHeight = Math.max(nodeHeight, childrenTotalHeight);
    }

    return {
      node: n,
      depth,
      nodeWidth,
      nodeHeight,
      totalHeight,
      childrenMetrics,
      isBranchExpanded
    };
  };

  const metrics = getSubtreeMetrics(node, 0);
  const positions = [];

  // PASS 2: Assign positions
  const assignPositions = (m, x, centerX, currentPath = []) => {
    const hasManualPos = m.node.x !== undefined && m.node.y !== undefined;
    
    const nodeX = hasManualPos ? m.node.x : x;
    const nodeY = hasManualPos ? m.node.y : (centerX - m.nodeHeight / 2);

    const newPath = [...currentPath, m.node.name];

    const nodePos = {
      ...m.node,
      x: nodeX,
      y: nodeY,
      width: m.nodeWidth,
      height: m.nodeHeight,
      depth: m.depth,
      path: newPath, // Added path
      hasDescription: !!m.node.description,
      hasChildren: m.node.children && m.node.children.length > 0,
      isTextExpanded: !!m.node.isTextExpanded || m.node.id === 'root',
      hasChildren: m.node.children && m.node.children.length > 0,
      isBranchExpanded: m.isBranchExpanded,
      isRoot: !!m.node.isRoot
    };
    positions.push(nodePos);

    if (m.childrenMetrics.length > 0) {
      const nextX = nodeX + m.nodeWidth + horizontalGap;
      let currentChildY = nodeY + (m.nodeHeight / 2) - (m.totalHeight / 2);
      
      m.childrenMetrics.forEach(childMetric => {
        const childCenterX = currentChildY + childMetric.totalHeight / 2;
        assignPositions(childMetric, nextX, childCenterX, newPath);
        currentChildY += childMetric.totalHeight + verticalGap;
      });
    }
  };

  assignPositions(metrics, startX, startY + metrics.totalHeight / 2, []);

  return positions;
};
