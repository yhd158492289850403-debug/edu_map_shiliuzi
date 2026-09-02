/**
 * 工具函数
 */

/**
 * 转义 HTML 特殊字符（小程序中主要防止 XSS，但数据为内置可不做）
 * 保留以兼容后续从 API 加载数据
 */
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 获取维度颜色
 */
function getDimColor(dim) {
  const colors = {
    '体素': '#EAB308',
    '心素': '#EF4444',
    '灵素': '#A855F7',
    '智素': '#22C55E',
    '行素': '#3B82F6',
    '交素': '#F97316'
  };
  return colors[dim] || '#64748b';
}

/**
 * 获取维度显示标签
 */
function getDimLabel(dim) {
  const labels = {
    '体素': '身体素养',
    '心素': '情绪素养',
    '灵素': '价值素养',
    '智素': '认知素养',
    '行素': '行动素养',
    '交素': '社交素养'
  };
  return labels[dim] || dim;
}

/**
 * 获取维度WXSS类名后缀（pinyin，不含中文）
 * WXSS 不支持中文类名
 */
function getDimClass(dim) {
  const map = {
    '体素': 'ti',
    '心素': 'xin',
    '灵素': 'ling',
    '智素': 'zhi',
    '行素': 'xing',
    '交素': 'jiao'
  };
  return map[dim] || 'default';
}

/**
 * 获取点位分类颜色（12 类点位类型）
 */
function getCatColor(cat) {
  const colors = {
    '自然生态公园': '#22c55e',
    '综合文化场馆': '#6366f1',
    '红色纪念场馆': '#ef4444',
    '城市书房': '#0ea5e9',
    '青少年活动中心': '#f59e0b',
    '群众文化馆': '#8b5cf6',
    '社区成长空间': '#14b8a6',
    '公共图书馆': '#a16207',
    '科技科普场馆': '#0891b2',
    '综合实践基地': '#059669',
    '生态农耕体验': '#65a30d'
  };
  return colors[cat] || '#64748b';
}

module.exports = {
  escHtml,
  getDimColor,
  getDimLabel,
  getDimClass,
  getCatColor
};
