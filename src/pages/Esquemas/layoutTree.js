/**
 * Tree layout algorithm with dynamic heights based on expansion state,
 * actual DOM measurements (`nodeDimensions`), left/right side support,
 * and post-layout collision resolution so expanded nodes never overlap.
 */
export const layoutTree = (node, startX = 100, startY = 100, nodeDimensions = {}) => {
  const horizontalGap = 150;
  const verticalGap = 44;

  const columnWidths = {
    0: 380,
    1: 350,
    2: 320,
    3: 290
  };

  // PASS 1: Calculate subtree heights and metrics using real DOM heights when available
  const getSubtreeMetrics = (n, depth, inheritedSide = null) => {
    const measured = nodeDimensions[n.id];
    const nodeWidth = measured?.width || columnWidths[depth] || 280;
    const isTextExpanded = !!n.isTextExpanded || n.id === 'root';
    const isBranchExpanded = n.isBranchExpanded !== false || n.id === 'root';
    const hasDescription =
      !!n.description ||
      !!n.blockType ||
      !!n.revitAction ||
      (Array.isArray(n.blocks) && n.blocks.length > 0);

    // Estimate height if not yet measured by ResizeObserver
    const charsPerTitleLine = Math.max(12, Math.floor(nodeWidth / 12));
    const charsPerDescLine = Math.max(18, Math.floor(nodeWidth / 6));

    const titleLines = Math.ceil((n.name || '').length / charsPerTitleLine) || 1;
    let descLines = 0;
    if (hasDescription && isTextExpanded) {
      const descLen = (n.description || '').length;
      descLines = Math.max(3, Math.ceil(descLen / charsPerDescLine));
    }

    const basePaddings = depth === 0 ? 54 : depth === 1 ? 46 : 40;
    const revitExtra = (n.blockType === 'revit_action' || n.revitAction) && isTextExpanded ? 190 : 0;
    const paddingAddition = hasDescription && isTextExpanded ? 110 + revitExtra : 0;
    const estimatedHeight =
      basePaddings + titleLines * 22 + descLines * 16 + paddingAddition;

    const nodeHeight = measured?.height
      ? Math.max(measured.height, 56)
      : estimatedHeight;

    const side = depth === 0 ? 'root' : n.side || inheritedSide || 'right';

    let totalHeight = nodeHeight;
    const childrenMetrics = [];

    if (
      n.children &&
      Array.isArray(n.children) &&
      n.children.length > 0 &&
      isBranchExpanded
    ) {
      let childrenTotalHeight = 0;
      n.children.forEach((child) => {
        if (!child) return;
        const childSide = depth === 0 ? child.side || 'right' : side;
        const metrics = getSubtreeMetrics(child, depth + 1, childSide);
        childrenMetrics.push(metrics);
        childrenTotalHeight += metrics.totalHeight + verticalGap;
      });
      if (childrenMetrics.length > 0) {
        childrenTotalHeight -= verticalGap;
      }
      totalHeight = Math.max(nodeHeight, childrenTotalHeight);
    }

    return {
      node: n,
      depth,
      side,
      nodeWidth,
      nodeHeight,
      totalHeight,
      childrenMetrics,
      isBranchExpanded
    };
  };

  const metrics = getSubtreeMetrics(node, 0, null);
  const positions = [];

  // PASS 2: Assign positions (supporting both right and left branches from root)
  const assignPositions = (m, x, centerY, currentPath = []) => {
    const hasManualPos =
      m.node.x !== undefined &&
      m.node.y !== undefined &&
      m.node.x !== null &&
      m.node.y !== null;

    const nodeX = hasManualPos ? m.node.x : x;
    const nodeY = hasManualPos ? m.node.y : centerY - m.nodeHeight / 2;

    const newPath = [...currentPath, m.node.name];

    const nodePos = {
      ...m.node,
      x: nodeX,
      y: nodeY,
      width: m.nodeWidth,
      height: m.nodeHeight,
      depth: m.depth,
      side: m.side,
      path: newPath,
      hasDescription:
        !!m.node.description ||
        !!m.node.blockType ||
        !!m.node.revitAction ||
        (Array.isArray(m.node.blocks) && m.node.blocks.length > 0),
      hasChildren: !!(m.node.children && m.node.children.length > 0),
      isTextExpanded: !!m.node.isTextExpanded || m.node.id === 'root',
      isBranchExpanded: m.isBranchExpanded,
      isRoot: !!m.node.isRoot || m.depth === 0
    };
    positions.push(nodePos);

    if (m.childrenMetrics.length > 0) {
      if (m.depth === 0) {
        // Split root children by side ('right' vs 'left')
        const rightChildren = m.childrenMetrics.filter((c) => c.side !== 'left');
        const leftChildren = m.childrenMetrics.filter((c) => c.side === 'left');

        if (rightChildren.length > 0) {
          const rightTotalHeight =
            rightChildren.reduce((acc, c) => acc + c.totalHeight, 0) +
            verticalGap * (rightChildren.length - 1);
          const nextRightX = nodeX + m.nodeWidth + horizontalGap;
          let currentChildY =
            nodeY + m.nodeHeight / 2 - rightTotalHeight / 2;

          rightChildren.forEach((childMetric) => {
            const childCenterY = currentChildY + childMetric.totalHeight / 2;
            assignPositions(childMetric, nextRightX, childCenterY, newPath);
            currentChildY += childMetric.totalHeight + verticalGap;
          });
        }

        if (leftChildren.length > 0) {
          const leftTotalHeight =
            leftChildren.reduce((acc, c) => acc + c.totalHeight, 0) +
            verticalGap * (leftChildren.length - 1);
          let currentChildY =
            nodeY + m.nodeHeight / 2 - leftTotalHeight / 2;

          leftChildren.forEach((childMetric) => {
            const nextLeftX = nodeX - childMetric.nodeWidth - horizontalGap;
            const childCenterY = currentChildY + childMetric.totalHeight / 2;
            assignPositions(childMetric, nextLeftX, childCenterY, newPath);
            currentChildY += childMetric.totalHeight + verticalGap;
          });
        }
      } else {
        const isLeft = m.side === 'left';
        let currentChildY = nodeY + m.nodeHeight / 2 - m.totalHeight / 2;

        m.childrenMetrics.forEach((childMetric) => {
          const nextX = isLeft
            ? nodeX - childMetric.nodeWidth - horizontalGap
            : nodeX + m.nodeWidth + horizontalGap;
          const childCenterY = currentChildY + childMetric.totalHeight / 2;
          assignPositions(childMetric, nextX, childCenterY, newPath);
          currentChildY += childMetric.totalHeight + verticalGap;
        });
      }
    }
  };

  assignPositions(metrics, startX, startY + metrics.totalHeight / 2, []);

  // PASS 3: Overlap resolution per column/side for nodes that share horizontal bands
  const resolveVerticalOverlaps = () => {
    const minVerticalClearance = 28;
    const sorted = [...positions].sort((a, b) => a.y - b.y);

    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
          const a = sorted[i];
          const b = sorted[j];

          const horizontalOverlap =
            a.x < b.x + b.width - 20 && a.x + a.width - 20 > b.x;

          if (horizontalOverlap) {
            const requiredTopForB = a.y + a.height + minVerticalClearance;
            if (b.y < requiredTopForB) {
              const pushDelta = requiredTopForB - b.y;
              b.y += pushDelta;
            }
          }
        }
      }
    }
  };

  resolveVerticalOverlaps();

  return positions;
};
