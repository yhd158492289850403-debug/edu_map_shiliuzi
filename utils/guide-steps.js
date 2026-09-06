/**
 * 全项目新手引导配置 - 简化版（仅首页引导）
 */

// 首页完整引导步骤（6步，覆盖所有核心功能）
const INDEX_GUIDE_STEPS = [
  {
    target: '.gs-box',
    title: '🔍 搜索功能',
    desc: '输入孩子行为（如"顶嘴"）或地点名称，快速找到对症教案',
    position: 'bottom',
    finger: 'point',
    demo: '试试输入"顶嘴"'
  },
  {
    target: '.bottom-btn-accent',
    title: '🎯 筛选功能',
    desc: '按素养维度、地点分类、孩子问题精准筛选',
    position: 'top',
    finger: 'tap',
    demo: '点击打开筛选面板'
  },
  {
    target: '.bottom-btn-primary',
    title: '🗺️ 切换视图',
    desc: '在地图和列表之间切换，地图可直观查看位置',
    position: 'top',
    finger: 'tap',
    demo: '试试切换到列表模式'
  },
  {
    target: '.bottom-btn-plain',
    title: '📍 附近点位',
    desc: '查看附近的教育基地，支持距离筛选和一键导航',
    position: 'top',
    finger: 'tap',
    demo: '点击进入附近页'
  },
  {
    target: '.bottom-btn-plain',
    title: '🔍 行为寻课',
    desc: '输入孩子行为，系统推荐对症的教育教案',
    position: 'top',
    finger: 'tap',
    demo: '点击进入行为寻课'
  },
  {
    target: '.bottom-btn-plain',
    title: '👤 我的档案',
    desc: '查看成长统计、切换身份、重播引导、查看报告',
    position: 'top',
    finger: 'tap',
    demo: '点击查看个人档案'
  }
];

// 当前引导状态
let currentStepIndex = 0;
let isGuideActive = false;

// 获取当前步骤
function getCurrentStep() {
  return INDEX_GUIDE_STEPS[currentStepIndex] || null;
}

// 获取总步骤数
function getTotalSteps() {
  return INDEX_GUIDE_STEPS.length;
}

// 获取当前步骤索引
function getCurrentStepIndex() {
  return currentStepIndex;
}

// 前进到下一步
function nextStep() {
  currentStepIndex++;
  if (currentStepIndex >= INDEX_GUIDE_STEPS.length) {
    return { done: true };
  }
  return { done: false };
}

// 开始引导
function startGuide() {
  currentStepIndex = 0;
  isGuideActive = true;
}

// 跳过引导（也算完成，不再自动弹出）
function skipGuide() {
  isGuideActive = false;
  currentStepIndex = 0;
  wx.setStorageSync('guideCompleted', true);
  wx.removeStorageSync('needGuide');
}

// 完成引导
function completeGuide() {
  isGuideActive = false;
  currentStepIndex = 0;
  wx.setStorageSync('guideCompleted', true);
  wx.removeStorageSync('needGuide');
}

// 检查引导是否激活
function isGuideActiveState() {
  return isGuideActive;
}

// 设置引导激活状态
function setGuideActive(active) {
  isGuideActive = active;
}

// 检查是否需要显示引导
function shouldShowGuide() {
  const needGuide = wx.getStorageSync('needGuide');
  const guideCompleted = wx.getStorageSync('guideCompleted');
  return needGuide && !guideCompleted;
}

// 重置引导状态（用于重播）
function resetGuide() {
  wx.removeStorageSync('guideCompleted');
  wx.setStorageSync('needGuide', true);
  currentStepIndex = 0;
  isGuideActive = false;
}

module.exports = {
  INDEX_GUIDE_STEPS,
  getCurrentStep,
  getTotalSteps,
  getCurrentStepIndex,
  nextStep,
  startGuide,
  skipGuide,
  completeGuide,
  isGuideActiveState,
  setGuideActive,
  shouldShowGuide,
  resetGuide
};
