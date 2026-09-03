const app = getApp();

// 行为类型常量
const BEHAVIOR_TYPES = {
  PAGE_VIEW: 'page_view',
  CLICK: 'click',
  STAY: 'stay',
  CHECKIN: 'checkin',
  SEARCH: 'search',
  SHARE: 'share'
};

// 采集队列
let behaviorQueue = [];
let pageStartTime = {};
let isInitialized = false;

/**
 * 初始化采集器
 */
function init() {
  if (isInitialized) return;
  
  // 监听页面切换
  const originalOnShow = Page.prototype.onShow;
  const originalOnHide = Page.prototype.onHide;
  
  Page.prototype.onShow = function() {
    const pagePath = getCurrentPages()[0].route;
    pageStartTime[pagePath] = Date.now();
    
    trackPageView(pagePath);
    
    if (originalOnShow) originalOnShow.call(this);
  };
  
  Page.prototype.onHide = function() {
    const pagePath = getCurrentPages()[0].route;
    const duration = Date.now() - (pageStartTime[pagePath] || Date.now());
    
    if (duration > 1000) {  // 停留超过1秒才记录
      trackStay(pagePath, duration);
    }
    
    delete pageStartTime[pagePath];
    
    if (originalOnHide) originalOnHide.call(this);
  };
  
  isInitialized = true;
}

/**
 * 记录页面访问
 */
function trackPageView(pagePath, extra = {}) {
  const behavior = {
    type: BEHAVIOR_TYPES.PAGE_VIEW,
    page: pagePath,
    timestamp: Date.now(),
    ...extra
  };
  
  addToQueue(behavior);
}

/**
 * 记录点击行为
 */
function trackClick(pagePath, target, extra = {}) {
  const behavior = {
    type: BEHAVIOR_TYPES.CLICK,
    page: pagePath,
    target: target,
    timestamp: Date.now(),
    ...extra
  };
  
  addToQueue(behavior);
}

/**
 * 记录停留时长
 */
function trackStay(pagePath, duration) {
  const behavior = {
    type: BEHAVIOR_TYPES.STAY,
    page: pagePath,
    duration: duration,
    timestamp: Date.now()
  };
  
  addToQueue(behavior);
}

/**
 * 记录搜索行为
 */
function trackSearch(keyword, results) {
  const behavior = {
    type: BEHAVIOR_TYPES.SEARCH,
    keyword: keyword,
    resultsCount: results,
    timestamp: Date.now()
  };
  
  addToQueue(behavior);
}

/**
 * 记录打卡行为
 */
function trackCheckin(checkinData) {
  const behavior = {
    type: BEHAVIOR_TYPES.CHECKIN,
    ...checkinData,
    timestamp: Date.now()
  };
  
  addToQueue(behavior);
}

/**
 * 添加到队列
 */
function addToQueue(behavior) {
  const app = getApp();
  if (app && app.globalData) {
    behavior.openid = app.globalData.openid;
    behavior.userRole = app.globalData.userRole;
  }
  behaviorQueue.push(behavior);
  
  // 队列满10条或超过30秒，自动上报
  if (behaviorQueue.length >= 10) {
    flush();
  }
}

/**
 * 上报行为数据
 */
async function flush() {
  if (behaviorQueue.length === 0) return;
  
  const behaviors = [...behaviorQueue];
  behaviorQueue = [];
  
  try {
    await wx.cloud.callFunction({
      name: 'saveBehavior',
      data: { behaviors }
    });
  } catch (err) {
    console.error('上报行为数据失败:', err);
    // 失败的数据放回队列
    behaviorQueue = [...behaviors, ...behaviorQueue];
  }
}

/**
 * 获取用户行为数据
 */
async function getBehaviors(options = {}) {
  try {
    const { result } = await wx.cloud.callFunction({
      name: 'getBehaviors',
      data: options
    });
    return result;
  } catch (err) {
    console.error('获取行为数据失败:', err);
    return { behaviors: [], stats: {} };
  }
}

module.exports = {
  BEHAVIOR_TYPES,
  init,
  trackPageView,
  trackClick,
  trackStay,
  trackSearch,
  trackCheckin,
  flush,
  getBehaviors
};
