import test from 'node:test';
import assert from 'node:assert/strict';

import {
  analyzeBinaryTree,
  findPathToValue,
  parseLevelOrderInput,
} from '../js/tree-core.js';
import { formatAsciiTree } from '../js/renderers.js';

const sampleInput = '[8, 4, 12, 2, 6, 10, 14, null, null, 5, 7]';

test('parseLevelOrderInput parses numbers and null markers', () => {
  assert.deepEqual(parseLevelOrderInput(sampleInput), [8, 4, 12, 2, 6, 10, 14, null, null, 5, 7]);
});

test('analyzeBinaryTree returns expected traversals and metrics for the assignment sample', () => {
  const analysis = analyzeBinaryTree(sampleInput);

  assert.deepEqual(analysis.traversals.preorder, [8, 4, 2, 6, 5, 7, 12, 10, 14]);
  assert.deepEqual(analysis.traversals.inorder, [2, 4, 5, 6, 7, 8, 10, 12, 14]);
  assert.deepEqual(analysis.traversals.postorder, [2, 5, 7, 6, 4, 10, 14, 12, 8]);
  assert.deepEqual(analysis.traversals.levelorder, [8, 4, 12, 2, 6, 10, 14, 5, 7]);
  assert.deepEqual(analysis.traversals.preorderIterative, [8, 4, 2, 6, 5, 7, 12, 10, 14]);

  assert.equal(analysis.metrics.nodeCount, 9);
  assert.equal(analysis.metrics.leafCount, 5);
  assert.equal(analysis.metrics.height, 4);
  assert.deepEqual(analysis.metrics.levelCounts, [1, 2, 4, 2]);
  assert.equal(analysis.metrics.maxWidth, 4);

  assert.equal(analysis.properties.isEmpty, false);
  assert.equal(analysis.properties.isFull, false);
  assert.equal(analysis.properties.isComplete, false);
  assert.equal(analysis.properties.isBalanced, true);
  assert.equal(analysis.properties.isBST, true);
});

test('findPathToValue returns root-to-target path and level', () => {
  const analysis = analyzeBinaryTree(sampleInput);
  const found = findPathToValue(analysis.root, 7);

  assert.equal(found.exists, true);
  assert.deepEqual(found.path, [8, 4, 6, 7]);
  assert.equal(found.level, 4);
});

test('analyzeBinaryTree handles an empty tree input', () => {
  const analysis = analyzeBinaryTree('[]');

  assert.equal(analysis.properties.isEmpty, true);
  assert.equal(analysis.metrics.nodeCount, 0);
  assert.equal(analysis.metrics.height, 0);
  assert.deepEqual(analysis.traversals.levelorder, []);
  assert.deepEqual(analysis.layout.nodes, []);
});

test('analyzeBinaryTree detects a non-BST tree', () => {
  const analysis = analyzeBinaryTree('[8, 10, 4]');

  assert.equal(analysis.properties.isBST, false);
  assert.equal(analysis.properties.isComplete, true);
});

test('findPathToValue reports missing values without a path', () => {
  const analysis = analyzeBinaryTree(sampleInput);
  const missing = findPathToValue(analysis.root, 99);

  assert.equal(missing.exists, false);
  assert.deepEqual(missing.path, []);
  assert.equal(missing.level, null);
});

test('formatAsciiTree renders the tree in a top-down layout', () => {
  const analysis = analyzeBinaryTree('[2, 1, 3]');

  assert.equal(formatAsciiTree(analysis.root), ['   2', '  / \\', ' 1   3'].join('\n'));
});