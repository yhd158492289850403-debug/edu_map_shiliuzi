/**
 * 新手引导步骤配置
 * 每个页面的引导步骤独立定义
 */

// 首页引导步骤
const INDEX_GUIDE_STEPS = [
  {
    target: '.gs-box',
    title: '搜索功能',
    desc: '输入孩子行为（如"顶嘴"）或地点名称，快速找到对症教案',
    position: 'bottom',
    finger: 'point'
  },
  {
    target: '.bottom-btn-accent',
    title: '筛选功能',
    desc: '按维度、分类、问题精准筛选，找到最适合的教育点位',
    position: 'top',
    finger: 'tap'
  },
  {
    target: '.bottom-btn-primary',
    title: '切换视图',
    desc: '在地图和列表之间切换，地图模式可直观查看位置',
    position: 'top',
    finger: 'tap'
  }
];

// 详情页引导步骤
const DETAIL_GUIDE_STEPS = [
  {
    target: '.slice-card:first-child',
    title: '教育切片',
    desc: '点击切片卡片，展开四段式教案（行前准备/路上话术/到馆做法/返程复盘）',
    position: 'bottom',
    finger: 'tap'
  },
  {
    target: '.slice-checkin-btn',
    title: '打卡记录',
    desc: '完成体验后，点击这里记录成长足迹',
    position: 'top',
    finger: 'tap'
  },
  {
    target: '.nav-action',
    title: '一键导航',
    desc: '点击导航按钮，直接打开微信地图前往目的地',
    position: 'top',
    finger: 'tap'
  }
];

// 附近页引导步骤
const NEAR_GUIDE_STEPS = [
  {
    target: '.locate-btn',
    title: '定位功能',
    desc: '点击定位按钮，自动查找附近的教育基地',
    position: 'bottom',
    finger: 'tap'
  },
  {
    target: '.radius-tabs',
    title: '距离筛选',
    desc: '选择距离范围，快速找到周边合适的点位',
    position: 'top',
    finger: 'tap'
  }
];

// 个人档案页引导步骤
const PROFILE_GUIDE_STEPS = [
  {
    target: '.user-role-tag',
    title: '身份切换',
    desc: '点击身份标签，可随时切换家长/学生/教师角色',
    position: 'bottom',
    finger: 'tap'
  },
  {
    target: '.stats-grid',
    title: '成长统计',
    desc: '查看打卡次数、访问点位、连续打卡等统计数据',
    position: 'bottom',
    finger: 'point'
  },
  {
    target: '.report-entry',
    title: '成长报告',
    desc: '完成5次打卡后，可查看六维素养成长报告',
    position: 'top',
    finger: 'tap'
  }
];

// 行为寻课页引导步骤
const RECOMMEND_GUIDE_STEPS = [
  {
    target: '.search-box',
    title: '行为搜索',
    desc: '输入孩子行为（如"磨蹭"），系统会推荐对症教案',
    position: 'bottom',
    finger: 'point'
  },
  {
    target: '.hot-tags',
    title: '热门行为',
    desc: '点击热门标签，快速查看常见行为的教育方案',
    position: 'top',
    finger: 'tap'
  }
];

// 获取当前页面的引导步骤
function getGuideSteps(pageName) {
  const stepsMap = {
    'pages/index/index': INDEX_GUIDE_STEPS,
    'pages/detail/detail': DETAIL_GUIDE_STEPS,
    'pages/near/near': NEAR_GUIDE_STEPS,
    'pages/profile/profile': PROFILE_GUIDE_STEPS,
    'pages/recommend/recommend': RECOMMEND_GUIDE_STEPS
  };
  
  return stepsMap[pageName] || [];
}

// 检查是否需要显示引导
function shouldShowGuide() {
  const needGuide = wx.getStorageSync('needGuide');
  const guideCompleted = wx.getStorageSync('guideCompleted');
  return needGuide && !guideCompleted;
}

// 标记引导完成
function markGuideCompleted() {
  wx.setStorageSync('guideCompleted', true);
  wx.removeStorageSync('needGuide');
}

// 重置引导状态（用于重播）
function resetGuide() {
  wx.removeStorageSync('guideCompleted');
  wx.setStorageSync('needGuide', true);
}

module.exports = {
  INDEX_GUIDE_STEPS,
  DETAIL_GUIDE_STEPS,
  NEAR_GUIDE_STEPS,
  PROFILE_GUIDE_STEPS,
  RECOMMEND_GUIDE_STEPS,
  getGuideSteps,
  shouldShowGuide,
  markGuideCompleted,
  resetGuide
};
