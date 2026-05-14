const summaryElement = document.querySelector('#summary');
const logElement = document.querySelector('#log');

function writeLog(lines) {
  logElement.textContent = lines.join('\n');
}

function assertDeepEqual(actual, expected, label) {
  const actualText = JSON.stringify(actual);
  const expectedText = JSON.stringify(expected);

  if (actualText !== expectedText) {
    throw new Error(`${label}\n期望: ${expectedText}\n实际: ${actualText}`);
  }
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}\n期望: ${expected}\n实际: ${actual}`);
  }
}

const tests = [
  {
    name: 'parseLevelOrderInput 解析数字和 null',
    run(module) {
      assertDeepEqual(
        module.parseLevelOrderInput('[8, 4, 12, 2, 6, 10, 14, null, null, 5, 7]'),
        [8, 4, 12, 2, 6, 10, 14, null, null, 5, 7],
        '解析结果不匹配',
      );
    },
  },
  {
    name: 'analyzeBinaryTree 输出题目样例的遍历与结构分析',
    run(module) {
      const analysis = module.analyzeBinaryTree('[8, 4, 12, 2, 6, 10, 14, null, null, 5, 7]');
      assertDeepEqual(analysis.traversals.preorder, [8, 4, 2, 6, 5, 7, 12, 10, 14], '前序遍历不匹配');
      assertDeepEqual(analysis.traversals.inorder, [2, 4, 5, 6, 7, 8, 10, 12, 14], '中序遍历不匹配');
      assertDeepEqual(analysis.traversals.postorder, [2, 5, 7, 6, 4, 10, 14, 12, 8], '后序遍历不匹配');
      assertDeepEqual(analysis.traversals.levelorder, [8, 4, 12, 2, 6, 10, 14, 5, 7], '层序遍历不匹配');
      assertDeepEqual(analysis.traversals.preorderIterative, [8, 4, 2, 6, 5, 7, 12, 10, 14], '非递归前序遍历不匹配');
      assertEqual(analysis.metrics.nodeCount, 9, '节点总数不匹配');
      assertEqual(analysis.metrics.leafCount, 5, '叶子节点数量不匹配');
      assertEqual(analysis.metrics.height, 4, '树高不匹配');
      assertDeepEqual(analysis.metrics.levelCounts, [1, 2, 4, 2], '每层节点数不匹配');
      assertEqual(analysis.metrics.maxWidth, 4, '最大宽度不匹配');
      assertEqual(analysis.properties.isComplete, false, '完全二叉树判断不匹配');
      assertEqual(analysis.properties.isBST, true, 'BST 判断不匹配');
    },
  },
  {
    name: 'findPathToValue 返回根到目标值的路径和层数',
    run(module) {
      const analysis = module.analyzeBinaryTree('[8, 4, 12, 2, 6, 10, 14, null, null, 5, 7]');
      const found = module.findPathToValue(analysis.root, 7);
      assertEqual(found.exists, true, '查找结果应存在');
      assertDeepEqual(found.path, [8, 4, 6, 7], '路径不匹配');
      assertEqual(found.level, 4, '层数不匹配');
    },
  },
];

async function run() {
  const lines = [];

  try {
    const [treeCore, renderers] = await Promise.all([
      import('../js/tree-core.js'),
      import('../js/renderers.js'),
    ]);

    const total = tests.length + 1;
    let passed = 0;
    for (const currentTest of tests) {
      currentTest.run(treeCore);
      passed += 1;
      lines.push(`PASS ${currentTest.name}`);
    }

    const asciiRoot = treeCore.buildTreeFromLevelOrder([2, 1, 3]);
    assertEqual(
      renderers.formatAsciiTree(asciiRoot),
      ['   2', '  / \\', ' 1   3'].join('\n'),
      'ASCII 文本树格式不匹配',
    );
    passed += 1;
    lines.push('PASS formatAsciiTree 生成稳定的文本树');

    summaryElement.textContent = `测试通过：${passed}/${total}`;
    summaryElement.className = 'pass';
    writeLog(lines);
  } catch (error) {
    summaryElement.textContent = '测试失败';
    summaryElement.className = 'fail';
    lines.push(`FAIL ${error.message}`);
    writeLog(lines);
    throw error;
  }
}

run();