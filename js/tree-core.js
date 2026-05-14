export class TreeNode {
  constructor(value, id) {
    this.value = value;
    this.id = id;
    this.left = null;
    this.right = null;
  }
}

export function parseLevelOrderInput(input) {
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

export function buildTreeFromLevelOrder(levelValues) {
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

export function analyzeBinaryTree(input) {
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

export function findPathToValue(root, targetValue) {
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