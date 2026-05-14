import { analyzeBinaryTree, findPathToValue } from './tree-core.js';
import { renderAnalysisView, renderQueryResult, renderStatus } from './renderers.js';

const SAMPLE_INPUT = '[8, 4, 12, 2, 6, 10, 14, null, null, 5, 7]';

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
  state.highlightNodeId = queryResult.node?.id ?? null;
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
  window.__BINARY_TREE_APP_READY__ = true;
  bindEvents();
  renderCurrentAnalysis();
  resetQueryOutput();
  loadSample();
}

init();