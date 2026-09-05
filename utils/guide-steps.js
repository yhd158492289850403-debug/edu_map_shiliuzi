/**
 * 全项目新手引导配置
 * 支持跨页面引导流程
 */

// 全项目引导流程（5个站点）
const FULL_GUIDE_FLOW = [
  // ===== 第1站：首页 - 找素养 =====
  {
    page: 'pages/index/index',
    stationName: '找素养',
    steps: [
      {
        target: '.gs-box',
        title: '🔍 搜索功能',
        desc: '试试输入孩子行为，如"顶嘴"或"磨蹭"，系统会找到对症的教育点位',
        position: 'bottom',
        finger: 'point',
        demo: '输入"顶嘴"试试'
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
        desc: '在地图模式和列表模式之间切换，地图可直观查看位置',
        position: 'top',
        finger: 'tap',
        demo: '试试切换到列表模式'
      }
    ]
  },
  // ===== 第2站：详情页 - 点位详情 =====
  {
    page: 'pages/detail/detail',
    stationName: '点位详情',
    steps: [
      {
        target: '.slice-card',
        title: '📋 教育切片',
        desc: '每个点位有多个教育切片，点击展开查看四段式教案',
        position: 'bottom',
        finger: 'tap',
        demo: '点击展开切片详情'
      },
      {
        target: '.slice-detail',
        title: '📖 四段教案',
        desc: '每个切片包含：行前准备 → 路上话术 → 到馆做法 → 返程复盘',
        position: 'top',
        finger: 'point',
        demo: '这是完整的教育流程'
      },
      {
        target: '.nav-action',
        title: '🗺️ 一键导航',
        desc: '点击导航按钮，直接打开微信地图前往目的地',
        position: 'top',
        finger: 'tap',
        demo: '试试导航功能'
      }
    ]
  },
  // ===== 第3站：附近页 - 距离导航 =====
  {
    page: 'pages/near/near',
    stationName: '附近点位',
    steps: [
      {
        target: '.loc-btn',
        title: '📍 定位功能',
        desc: '点击定位按钮，自动查找附近的教育基地',
        position: 'bottom',
        finger: 'tap',
        demo: '点击获取当前位置'
      },
      {
        target: '.radius-tabs',
        title: '📏 距离筛选',
        desc: '选择距离范围（2km/3km/5km/10km），快速找到周边点位',
        position: 'top',
        finger: 'tap',
        demo: '试试切换距离范围'
      },
      {
        target: '.near-nav',
        title: '🗺️ 导航按钮',
        desc: '每个点位都有导航按钮，点击直接打开微信地图导航',
        position: 'left',
        finger: 'tap',
        demo: '点击开始导航'
      }
    ]
  },
  // ===== 第4站：行为寻课页 - 行为→教案 =====
  {
    page: 'pages/recommend/recommend',
    stationName: '行为寻课',
    steps: [
      {
        target: '.search-box',
        title: '🔍 行为搜索',
        desc: '输入孩子行为（如"磨蹭""怕黑"），系统推荐对症教案',
        position: 'bottom',
        finger: 'point',
        demo: '输入"磨蹭"试试'
      },
      {
        target: '.hot-tags',
        title: '🔥 热门行为',
        desc: '点击热门标签，快速查看常见行为的教育方案',
        position: 'top',
        finger: 'tap',
        demo: '点击一个热门标签'
      },
      {
        target: '.rec-card',
        title: '📋 推荐教案',
        desc: '每个教案包含四段式行程，可展开查看详情，也可直接打卡',
        position: 'top',
        finger: 'tap',
        demo: '展开查看教案详情'
      }
    ]
  },
  // ===== 第5站：个人档案页 - 成长档案 =====
  {
    page: 'pages/profile/profile',
    stationName: '成长档案',
    steps: [
      {
        target: '.user-role-tag',
        title: '👤 身份切换',
        desc: '点击身份标签，可切换家长/学生/教师角色，不同角色有不同报告风格',
        position: 'bottom',
        finger: 'tap',
        demo: '试试切换身份'
      },
      {
        target: '.stats-grid',
        title: '📊 成长统计',
        desc: '查看打卡次数、访问点位、连续打卡天数等统计数据',
        position: 'bottom',
        finger: 'point',
        demo: '这是你的成长数据'
      },
      {
        target: '.guide-replay',
        title: '🎯 重播引导',
        desc: '随时可以在这里重播新手引导，回顾所有功能',
        position: 'top',
        finger: 'tap',
        demo: '点击可重播引导'
      }
    ]
  }
];

// 当前引导状态
let currentFlowIndex = 0;
let currentStepIndex = 0;
let isGuideActive = false;

// 获取当前站点配置
function getCurrentStation() {
  return FULL_GUIDE_FLOW[currentFlowIndex] || null;
}

// 获取当前步骤
function getCurrentStep() {
  const station = getCurrentStation();
  if (!station) return null;
  return station.steps[currentStepIndex] || null;
}

// 获取总站点数
function getTotalStations() {
  return FULL_GUIDE_FLOW.length;
}

// 获取当前站点索引
function getCurrentStationIndex() {
  return currentFlowIndex;
}

// 获取当前步骤索引
function getCurrentStepIndex() {
  return currentStepIndex;
}

// 获取总步骤数
function getTotalSteps() {
  return FULL_GUIDE_FLOW.reduce((sum, station) => sum + station.steps.length, 0);
}

// 获取当前是第几步（全局）
function getGlobalStepNumber() {
  let count = 0;
  for (let i = 0; i < currentFlowIndex; i++) {
    count += FULL_GUIDE_FLOW[i].steps.length;
  }
  return count + currentStepIndex + 1;
}

// 前进到下一步
function nextStep() {
  const station = getCurrentStation();
  if (!station) return { done: true };
  
  currentStepIndex++;
  
  // 当前站点的步骤完成
  if (currentStepIndex >= station.steps.length) {
    currentFlowIndex++;
    currentStepIndex = 0;
    
    // 所有站点完成
    if (currentFlowIndex >= FULL_GUIDE_FLOW.length) {
      return { done: true };
    }
    
    // 需要跳转到下一个页面
    return { 
      done: false, 
      navigateTo: FULL_GUIDE_FLOW[currentFlowIndex].page,
      stationName: FULL_GUIDE_FLOW[currentFlowIndex].stationName
    };
  }
  
  return { done: false };
}

// 开始引导
function startGuide() {
  currentFlowIndex = 0;
  currentStepIndex = 0;
  isGuideActive = true;
  return {
    page: FULL_GUIDE_FLOW[0].page,
    stationName: FULL_GUIDE_FLOW[0].stationName
  };
}

// 跳过引导
function skipGuide() {
  isGuideActive = false;
  currentFlowIndex = 0;
  currentStepIndex = 0;
}

// 完成引导
function completeGuide() {
  isGuideActive = false;
  currentFlowIndex = 0;
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
  currentFlowIndex = 0;
  currentStepIndex = 0;
  isGuideActive = false;
}

// 获取页面的独立引导步骤（用于单页面引导）
function getPageGuideSteps(pageName) {
  const station = FULL_GUIDE_FLOW.find(s => s.page === pageName);
  return station ? station.steps : [];
}

module.exports = {
  FULL_GUIDE_FLOW,
  getCurrentStation,
  getCurrentStep,
  getTotalStations,
  getCurrentStationIndex,
  getCurrentStepIndex,
  getTotalSteps,
  getGlobalStepNumber,
  nextStep,
  startGuide,
  skipGuide,
  completeGuide,
  isGuideActiveState,
  setGuideActive,
  shouldShowGuide,
  resetGuide,
  getPageGuideSteps
};
