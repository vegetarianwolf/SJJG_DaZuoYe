(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const SAMPLE_INPUT = '[8, 4, 12, 2, 6, 10, 14, null, null, 5, 7]';

  class TreeNode {
    constructor(value, id) {
      this.value = value;
      this.id = id;
      this.left = null;
      this.right = null;
    }
  }

  function parseLevelOrderInput(input) {
    if (Array.isArray(input)) {
      return input.map(normalizeTokenValue);
    }

    if (typeof input !== 'string') {
      throw new Error('输入必须是数组文本');
    }

    const normalized = input.trim().replaceAll('，', ',');
    if (!normalized) {
      throw new Error('请输入层序数组');
    }

    const content = normalized.startsWith('[') && normalized.endsWith(']')
      ? normalized.slice(1, -1).trim()
      : normalized;

    if (!content) {
      return [];
    }

    return content.split(',').map((token) => normalizeTokenValue(token.trim()));
  }

  function buildTreeFromLevelOrder(levelValues) {
    if (!Array.isArray(levelValues)) {
      throw new Error('层序数据必须是数组');
    }

    if (levelValues.length === 0) {
      return null;
    }

    if (levelValues[0] === null) {
      const hasNonNull = levelValues.slice(1).some((value) => value !== null);
      if (hasNonNull) {
        throw new Error('根节点为空时不能包含其他非空节点');
      }
      return null;
    }

    let nextId = 1;
    const root = new TreeNode(levelValues[0], 0);
    const queue = [root];
    let index = 1;

    while (queue.length > 0 && index < levelValues.length) {
      const current = queue.shift();

      if (index < levelValues.length) {
        const leftValue = levelValues[index];
        index += 1;
        if (leftValue !== null) {
          current.left = new TreeNode(leftValue, nextId);
          nextId += 1;
          queue.push(current.left);
        }
      }

      if (index < levelValues.length) {
        const rightValue = levelValues[index];
        index += 1;
        if (rightValue !== null) {
          current.right = new TreeNode(rightValue, nextId);
          nextId += 1;
          queue.push(current.right);
        }
      }
    }

    return root;
  }

  function analyzeBinaryTree(input) {
    const levelValues = parseLevelOrderInput(input);
    const root = buildTreeFromLevelOrder(levelValues);
    const traversals = buildTraversals(root);
    const metrics = buildMetrics(root);
    const properties = buildProperties(root, traversals.inorder, metrics);
    const layout = buildLayout(root, metrics.height);

    return {
      inputValues: levelValues,
      root,
      traversals,
      metrics,
      properties,
      layout,
    };
  }

  function findPathToValue(root, targetValue) {
    const numericTarget = typeof targetValue === 'number' ? targetValue : Number(targetValue);
    if (Number.isNaN(numericTarget)) {
      return { exists: false, path: [], level: null, node: null };
    }

    const path = [];
    const foundNode = searchPath(root, numericTarget, path);

    if (!foundNode) {
      return { exists: false, path: [], level: null, node: null };
    }

    return {
      exists: true,
      path,
      level: path.length,
      node: foundNode,
    };
  }

  function normalizeTokenValue(token) {
    if (token === null || token === undefined) {
      return null;
    }

    if (typeof token === 'number') {
      if (!Number.isFinite(token)) {
        throw new Error('节点值必须是有限数字');
      }
      return token;
    }

    const text = String(token).trim();
    if (!text) {
      throw new Error('输入中存在空白节点');
    }

    if (text.toLowerCase() === 'null') {
      return null;
    }

    const value = Number(text);
    if (!Number.isFinite(value)) {
      throw new Error(`无法解析节点值: ${text}`);
    }

    return value;
  }

  function buildTraversals(root) {
    const preorder = [];
    const inorder = [];
    const postorder = [];

    traversePreorder(root, preorder);
    traverseInorder(root, inorder);
    traversePostorder(root, postorder);

    return {
      preorder,
      inorder,
      postorder,
      levelorder: traverseLevelorder(root),
      preorderIterative: traversePreorderIterative(root),
    };
  }

  function traversePreorder(node, values) {
    if (!node) {
      return;
    }

    values.push(node.value);
    traversePreorder(node.left, values);
    traversePreorder(node.right, values);
  }

  function traverseInorder(node, values) {
    if (!node) {
      return;
    }

    traverseInorder(node.left, values);
    values.push(node.value);
    traverseInorder(node.right, values);
  }

  function traversePostorder(node, values) {
    if (!node) {
      return;
    }

    traversePostorder(node.left, values);
    traversePostorder(node.right, values);
    values.push(node.value);
  }

  function traverseLevelorder(root) {
    if (!root) {
      return [];
    }

    const values = [];
    const queue = [root];

    while (queue.length > 0) {
      const current = queue.shift();
      values.push(current.value);

      if (current.left) {
        queue.push(current.left);
      }

      if (current.right) {
        queue.push(current.right);
      }
    }

    return values;
  }

  function traversePreorderIterative(root) {
    if (!root) {
      return [];
    }

    const values = [];
    const stack = [root];

    while (stack.length > 0) {
      const current = stack.pop();
      values.push(current.value);

      if (current.right) {
        stack.push(current.right);
      }

      if (current.left) {
        stack.push(current.left);
      }
    }

    return values;
  }

  function buildMetrics(root) {
    if (!root) {
      return {
        nodeCount: 0,
        leafCount: 0,
        height: 0,
        levelCounts: [],
        maxWidth: 0,
      };
    }

    const levelCounts = [];
    const queue = [root];
    let nodeCount = 0;
    let leafCount = 0;

    while (queue.length > 0) {
      const levelSize = queue.length;
      levelCounts.push(levelSize);

      for (let index = 0; index < levelSize; index += 1) {
        const current = queue.shift();
        nodeCount += 1;

        if (!current.left && !current.right) {
          leafCount += 1;
        }

        if (current.left) {
          queue.push(current.left);
        }

        if (current.right) {
          queue.push(current.right);
        }
      }
    }

    return {
      nodeCount,
      leafCount,
      height: calculateHeight(root),
      levelCounts,
      maxWidth: Math.max(...levelCounts),
    };
  }

  function calculateHeight(node) {
    if (!node) {
      return 0;
    }

    return Math.max(calculateHeight(node.left), calculateHeight(node.right)) + 1;
  }

  function buildProperties(root, inorder, metrics) {
    return {
      isEmpty: root === null,
      isFull: isPerfectBinaryTree(metrics.nodeCount, metrics.height),
      isComplete: isCompleteBinaryTree(root),
      isBalanced: isBalancedBinaryTree(root),
      isBST: isStrictlyIncreasing(inorder),
    };
  }

  function isPerfectBinaryTree(nodeCount, height) {
    return nodeCount === (2 ** height) - 1;
  }

  function isCompleteBinaryTree(root) {
    if (!root) {
      return true;
    }

    const queue = [root];
    let seenEmpty = false;

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) {
        seenEmpty = true;
        continue;
      }

      if (seenEmpty) {
        return false;
      }

      queue.push(current.left);
      queue.push(current.right);
    }

    return true;
  }

  function isBalancedBinaryTree(root) {
    return measureBalance(root) !== -1;
  }

  function measureBalance(node) {
    if (!node) {
      return 0;
    }

    const leftHeight = measureBalance(node.left);
    if (leftHeight === -1) {
      return -1;
    }

    const rightHeight = measureBalance(node.right);
    if (rightHeight === -1) {
      return -1;
    }

    if (Math.abs(leftHeight - rightHeight) > 1) {
      return -1;
    }

    return Math.max(leftHeight, rightHeight) + 1;
  }

  function isStrictlyIncreasing(values) {
    for (let index = 1; index < values.length; index += 1) {
      if (values[index] <= values[index - 1]) {
        return false;
      }
    }

    return true;
  }

  function buildLayout(root, height) {
    if (!root) {
      return {
        nodes: [],
        edges: [],
        width: 0,
        height: 0,
      };
    }

    const orderedNodes = [];
    collectInorderNodes(root, orderedNodes);

    const paddingX = 70;
    const paddingY = 70;
    const horizontalGap = 88;
    const verticalGap = 104;
    const xById = new Map();

    orderedNodes.forEach((node, index) => {
      xById.set(node.id, paddingX + index * horizontalGap);
    });

    const nodes = [];
    const edges = [];

    assignLayout(root, 0, xById, nodes, edges, paddingY, verticalGap);

    return {
      nodes,
      edges,
      width: Math.max(paddingX * 2 + (orderedNodes.length - 1) * horizontalGap, 180),
      height: Math.max(paddingY * 2 + (height - 1) * verticalGap, 180),
    };
  }

  function collectInorderNodes(node, collection) {
    if (!node) {
      return;
    }

    collectInorderNodes(node.left, collection);
    collection.push(node);
    collectInorderNodes(node.right, collection);
  }

  function assignLayout(node, depth, xById, nodes, edges, paddingY, verticalGap) {
    if (!node) {
      return;
    }

    const x = xById.get(node.id);
    const y = paddingY + depth * verticalGap;

    nodes.push({
      id: node.id,
      value: node.value,
      depth,
      x,
      y,
    });

    if (node.left) {
      edges.push({ from: node.id, to: node.left.id });
    }

    if (node.right) {
      edges.push({ from: node.id, to: node.right.id });
    }

    assignLayout(node.left, depth + 1, xById, nodes, edges, paddingY, verticalGap);
    assignLayout(node.right, depth + 1, xById, nodes, edges, paddingY, verticalGap);
  }

  function searchPath(node, targetValue, path) {
    if (!node) {
      return null;
    }

    path.push(node.value);
    if (node.value === targetValue) {
      return node;
    }

    const leftResult = searchPath(node.left, targetValue, path);
    if (leftResult) {
      return leftResult;
    }

    const rightResult = searchPath(node.right, targetValue, path);
    if (rightResult) {
      return rightResult;
    }

    path.pop();
    return null;
  }

  function formatAsciiTree(root) {
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

  function renderAnalysisView(elements, analysis, options = {}) {
    renderTraversalList(elements.traversals, analysis.traversals);
    renderMetricList(elements.metrics, analysis.metrics);
    renderPropertyList(elements.properties, analysis.properties);
    renderAsciiTree(elements.asciiTree, analysis.root);
    renderSvgTree(elements.svgTree, analysis.layout, options);
  }

  function renderQueryResult(container, result) {
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

  function renderStatus(container, message, tone = 'neutral') {
    if (!container) {
      return;
    }

    container.textContent = message;
    container.dataset.tone = tone;
  }

  function renderAsciiTree(container, root) {
    if (!container) {
      return;
    }

    container.textContent = formatAsciiTree(root);
  }

  function renderSvgTree(svgElement, layout, options = {}) {
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

  const elements = {
    input: document.querySelector('#level-order-input'),
    targetInput: document.querySelector('#target-value-input'),
    analyzeButton: document.querySelector('#analyze-button'),
    loadSampleButton: document.querySelector('#load-sample-button'),
    resetButton: document.querySelector('#reset-button'),
    searchButton: document.querySelector('#search-button'),
    status: document.querySelector('#status-message'),
    queryResult: document.querySelector('#query-result'),
    traversals: document.querySelector('#traversal-results'),
    metrics: document.querySelector('#metric-results'),
    properties: document.querySelector('#property-results'),
    svgTree: document.querySelector('#tree-svg'),
    asciiTree: document.querySelector('#ascii-tree'),
  };

  const state = {
    analysis: analyzeBinaryTree('[]'),
    highlightNodeId: null,
  };

  function renderCurrentAnalysis() {
    renderAnalysisView(elements, state.analysis, { highlightNodeId: state.highlightNodeId });
  }

  function resetQueryOutput(message = '输入目标值后可查询路径与层数。') {
    elements.queryResult.textContent = message;
  }

  function analyzeInput() {
    try {
      state.analysis = analyzeBinaryTree(elements.input.value);
      state.highlightNodeId = null;
      elements.targetInput.value = '';
      renderCurrentAnalysis();
      resetQueryOutput();
      renderStatus(elements.status, '已完成建树与分析。', 'success');
    } catch (error) {
      state.analysis = analyzeBinaryTree('[]');
      state.highlightNodeId = null;
      renderCurrentAnalysis();
      resetQueryOutput('请修正输入后再进行路径查询。');
      renderStatus(elements.status, `输入解析失败：${error.message}`, 'error');
    }
  }

  function loadSample() {
    elements.input.value = SAMPLE_INPUT;
    analyzeInput();
  }

  function resetAll() {
    elements.input.value = '';
    elements.targetInput.value = '';
    state.analysis = analyzeBinaryTree('[]');
    state.highlightNodeId = null;
    renderCurrentAnalysis();
    resetQueryOutput();
    renderStatus(elements.status, '已重置。请输入新的层序数组。', 'neutral');
  }

  function handleSearch() {
    if (state.analysis.properties.isEmpty) {
      resetQueryOutput('当前没有可查询的二叉树，请先构建并分析。');
      renderStatus(elements.status, '当前为空树，无法执行路径查询。', 'warning');
      return;
    }

    const rawValue = elements.targetInput.value.trim();
    if (!rawValue) {
      resetQueryOutput('请输入目标值后再查询。');
      renderStatus(elements.status, '路径查询失败：目标值为空。', 'warning');
      return;
    }

    const numericValue = Number(rawValue);
    if (!Number.isFinite(numericValue)) {
      resetQueryOutput('目标值必须是合法数字。');
      renderStatus(elements.status, '路径查询失败：目标值不是数字。', 'warning');
      return;
    }

    const queryResult = findPathToValue(state.analysis.root, numericValue);
    state.highlightNodeId = queryResult.node ? queryResult.node.id : null;
    renderCurrentAnalysis();
    renderQueryResult(elements.queryResult, queryResult);
    renderStatus(
      elements.status,
      queryResult.exists ? `已定位节点 ${numericValue}。` : `当前树中不存在 ${numericValue}。`,
      queryResult.exists ? 'success' : 'warning',
    );
  }

  function bindEvents() {
    elements.analyzeButton.addEventListener('click', analyzeInput);
    elements.loadSampleButton.addEventListener('click', loadSample);
    elements.resetButton.addEventListener('click', resetAll);
    elements.searchButton.addEventListener('click', handleSearch);

    elements.targetInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleSearch();
      }
    });

    elements.input.addEventListener('keydown', (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        analyzeInput();
      }
    });
  }

  function init() {
    bindEvents();
    renderCurrentAnalysis();
    resetQueryOutput();
    loadSample();
  }

  init();
})();