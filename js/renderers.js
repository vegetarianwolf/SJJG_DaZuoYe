const SVG_NS = 'http://www.w3.org/2000/svg';

export function formatAsciiTree(root) {
  if (!root) {
    return '（空树）';
  }

  const height = measureTreeHeight(root);
  const maxValueWidth = measureMaxValueWidth(root);
  const totalWidth = Math.max((2 ** height) * (maxValueWidth + 1), maxValueWidth + 2);
  const totalRows = (height * 2) - 1;
  const canvas = Array.from({ length: totalRows }, () => Array(totalWidth).fill(' '));

  placeNode(root, 0, 0, totalWidth - 1, canvas);

  return canvas
    .map((row) => row.join('').replace(/\s+$/u, ''))
    .join('\n');
}

export function renderAnalysisView(elements, analysis, options = {}) {
  renderTraversalList(elements.traversals, analysis.traversals);
  renderMetricList(elements.metrics, analysis.metrics);
  renderPropertyList(elements.properties, analysis.properties);
  renderAsciiTree(elements.asciiTree, analysis.root);
  renderSvgTree(elements.svgTree, analysis.layout, options);
}

export function renderQueryResult(container, result) {
  if (!container) {
    return;
  }

  container.replaceChildren();

  if (!result) {
    container.textContent = '输入目标值后可查询路径与层数。';
    return;
  }

  const status = document.createElement('p');
  status.className = `query-status ${result.exists ? 'is-found' : 'is-missing'}`;
  status.textContent = result.exists ? '目标值存在于当前二叉树中。' : '未找到该目标值。';
  container.append(status);

  if (!result.exists) {
    return;
  }

  container.append(
    buildResultCard('根到目标路径', result.path.join(' -> ')),
    buildResultCard('所在层数', `第 ${result.level} 层`),
  );
}

export function renderStatus(container, message, tone = 'neutral') {
  if (!container) {
    return;
  }

  container.textContent = message;
  container.dataset.tone = tone;
}

export function renderAsciiTree(container, root) {
  if (!container) {
    return;
  }

  container.textContent = formatAsciiTree(root);
}

export function renderSvgTree(svgElement, layout, options = {}) {
  if (!svgElement) {
    return;
  }

  svgElement.replaceChildren();

  const width = layout?.width ?? 0;
  const height = layout?.height ?? 0;
  svgElement.setAttribute('viewBox', `0 0 ${Math.max(width, 180)} ${Math.max(height, 180)}`);
  svgElement.setAttribute('role', 'img');
  svgElement.setAttribute('aria-label', '二叉树图形视图');

  if (!layout || layout.nodes.length === 0) {
    const text = createSvgElement('text', {
      x: 90,
      y: 96,
      class: 'tree-empty',
    });
    text.textContent = '空树';
    svgElement.append(text);
    return;
  }

  const highlightedIds = new Set(options.highlightNodeIds || []);
  if (options.highlightNodeId !== undefined && options.highlightNodeId !== null) {
    highlightedIds.add(options.highlightNodeId);
  }

  const nodesById = new Map(layout.nodes.map((node) => [node.id, node]));
  const edgeLayer = createSvgElement('g', { class: 'tree-edges' });
  const nodeLayer = createSvgElement('g', { class: 'tree-nodes' });

  for (const edge of layout.edges) {
    const fromNode = nodesById.get(edge.from);
    const toNode = nodesById.get(edge.to);
    if (!fromNode || !toNode) {
      continue;
    }

    edgeLayer.append(
      createSvgElement('line', {
        x1: fromNode.x,
        y1: fromNode.y,
        x2: toNode.x,
        y2: toNode.y,
        class: highlightedIds.has(edge.to) ? 'tree-edge is-highlighted' : 'tree-edge',
      }),
    );
  }

  for (const node of layout.nodes) {
    const group = createSvgElement('g', {
      class: highlightedIds.has(node.id) ? 'tree-node is-highlighted' : 'tree-node',
      transform: `translate(${node.x} ${node.y})`,
    });

    const circle = createSvgElement('circle', {
      r: 24,
      cx: 0,
      cy: 0,
    });
    const text = createSvgElement('text', {
      x: 0,
      y: 1,
    });
    text.textContent = String(node.value);
    group.append(circle, text);
    nodeLayer.append(group);
  }

  svgElement.append(edgeLayer, nodeLayer);
}

function renderTraversalList(container, traversals) {
  if (!container) {
    return;
  }

  container.replaceChildren(
    buildResultCard('前序遍历', formatSequence(traversals.preorder)),
    buildResultCard('中序遍历', formatSequence(traversals.inorder)),
    buildResultCard('后序遍历', formatSequence(traversals.postorder)),
    buildResultCard('层序遍历', formatSequence(traversals.levelorder)),
    buildResultCard('非递归前序', formatSequence(traversals.preorderIterative)),
  );
}

function renderMetricList(container, metrics) {
  if (!container) {
    return;
  }

  container.replaceChildren(
    buildResultCard('节点总数', String(metrics.nodeCount)),
    buildResultCard('叶子节点数量', String(metrics.leafCount)),
    buildResultCard('树的高度', String(metrics.height)),
    buildResultCard('每层节点数', `[${metrics.levelCounts.join(', ')}]`),
    buildResultCard('最大宽度', String(metrics.maxWidth)),
  );
}

function renderPropertyList(container, properties) {
  if (!container) {
    return;
  }

  container.replaceChildren(
    buildResultCard('是否为空树', formatBoolean(properties.isEmpty)),
    buildResultCard('是否为满二叉树', formatBoolean(properties.isFull)),
    buildResultCard('是否为完全二叉树', formatBoolean(properties.isComplete)),
    buildResultCard('是否为平衡二叉树', formatBoolean(properties.isBalanced)),
    buildResultCard('是否为二叉搜索树', formatBoolean(properties.isBST)),
  );
}

function buildResultCard(label, value) {
  const article = document.createElement('article');
  article.className = 'result-card';

  const title = document.createElement('h3');
  title.className = 'result-label';
  title.textContent = label;

  const body = document.createElement('p');
  body.className = 'result-value';
  body.textContent = value;

  article.append(title, body);
  return article;
}

function createSvgElement(tagName, attributes) {
  const element = document.createElementNS(SVG_NS, tagName);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, String(value));
  }
  return element;
}

function formatSequence(values) {
  return values.length > 0 ? values.join(' ') : '空';
}

function formatBoolean(value) {
  return value ? '是' : '否';
}

function placeNode(node, depth, leftBoundary, rightBoundary, canvas) {
  if (!node || leftBoundary > rightBoundary) {
    return;
  }

  const rowIndex = depth * 2;
  const midpoint = Math.floor((leftBoundary + rightBoundary) / 2);
  placeText(canvas[rowIndex], midpoint, String(node.value));

  if (rowIndex + 1 >= canvas.length) {
    return;
  }

  if (node.left) {
    const leftMidpoint = Math.floor((leftBoundary + (midpoint - 1)) / 2);
    const slashColumn = Math.floor((leftMidpoint + midpoint) / 2);
    canvas[rowIndex + 1][slashColumn] = '/';
    placeNode(node.left, depth + 1, leftBoundary, midpoint - 1, canvas);
  }

  if (node.right) {
    const rightMidpoint = Math.floor(((midpoint + 1) + rightBoundary) / 2);
    const backslashColumn = Math.floor((rightMidpoint + midpoint) / 2);
    canvas[rowIndex + 1][backslashColumn] = '\\';
    placeNode(node.right, depth + 1, midpoint + 1, rightBoundary, canvas);
  }
}

function placeText(row, centerColumn, text) {
  const startColumn = Math.max(0, Math.round(centerColumn - ((text.length - 1) / 2)));

  for (let index = 0; index < text.length && startColumn + index < row.length; index += 1) {
    row[startColumn + index] = text[index];
  }
}

function measureTreeHeight(node) {
  if (!node) {
    return 0;
  }

  return Math.max(measureTreeHeight(node.left), measureTreeHeight(node.right)) + 1;
}

function measureMaxValueWidth(node) {
  if (!node) {
    return 0;
  }

  return Math.max(
    String(node.value).length,
    measureMaxValueWidth(node.left),
    measureMaxValueWidth(node.right),
  );
}