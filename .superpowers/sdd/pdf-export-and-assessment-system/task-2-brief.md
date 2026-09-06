# Task 2: 行为采集系统（无感记录）

## 任务概述

创建无感行为采集系统，自动记录用户的页面访问、停留时长、点击行为等，不增加用户操作负担。

## 需要创建的文件

### 1. `utils/tracker.js` - 行为采集核心模块

```javascript
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
  behavior.openid = app.globalData.openid;
  behavior.userRole = app.globalData.userRole;
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
```

### 2. `cloudfunctions/saveBehavior/index.js` - 保存行为数据云函数

```javascript
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();
  const { behaviors } = event;
  
  try {
    // 批量插入行为数据
    const tasks = behaviors.map(behavior => {
      return db.collection('behaviors').add({
        data: {
          _openid: wxContext.OPENID,
          ...behavior,
          created_at: new Date()
        }
      });
    });
    
    await Promise.all(tasks);
    
    return { success: true, count: behaviors.length };
  } catch (err) {
    console.error('保存行为数据失败:', err);
    return { success: false, error: err.message };
  }
};
```

### 3. `cloudfunctions/saveBehavior/package.json`

```json
{
  "name": "saveBehavior",
  "version": "1.0.0",
  "description": "保存用户行为数据",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "~2.6.3"
  }
}
```

### 4. `cloudfunctions/getBehaviors/index.js` - 获取行为数据云函数

```javascript
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();
  const { openid, startDate, endDate, type } = event;
  
  try {
    let query = db.collection('behaviors').where({
      _openid: openid || wxContext.OPENID
    });
    
    if (startDate) {
      query = query.where({
        created_at: db.command.gte(new Date(startDate))
      });
    }
    
    if (endDate) {
      query = query.where({
        created_at: db.command.lte(new Date(endDate))
      });
    }
    
    if (type) {
      query = query.where({ type });
    }
    
    const { data } = await query
      .orderBy('created_at', 'desc')
      .limit(1000)
      .get();
    
    // 统计信息
    const stats = calculateStats(data);
    
    return { behaviors: data, stats };
  } catch (err) {
    console.error('获取行为数据失败:', err);
    return { behaviors: [], stats: {} };
  }
};

function calculateStats(behaviors) {
  const stats = {
    totalPageViews: 0,
    totalStayDuration: 0,
    totalCheckins: 0,
    viewedSlices: [],
    dimViewCount: {},
    firstUseTime: null,
    lastUseTime: null
  };
  
  for (const b of behaviors) {
    if (b.type === 'page_view') stats.totalPageViews++;
    if (b.type === 'stay') stats.totalStayDuration += b.duration || 0;
    if (b.type === 'checkin') stats.totalCheckins++;
    if (b.viewedSlices) stats.viewedSlices.push(...b.viewedSlices);
    
    if (b.timestamp) {
      if (!stats.firstUseTime || b.timestamp < stats.firstUseTime) {
        stats.firstUseTime = b.timestamp;
      }
      if (!stats.lastUseTime || b.timestamp > stats.lastUseTime) {
        stats.lastUseTime = b.timestamp;
      }
    }
  }
  
  return stats;
}
```

### 5. `cloudfunctions/getBehaviors/package.json`

```json
{
  "name": "getBehaviors",
  "version": "1.0.0",
  "description": "获取用户行为数据",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "~2.6.3"
  }
}
```

## 需要修改的文件

### 6. `app.js` - 添加tracker初始化

在 `App({...})` 中添加：

```javascript
const tracker = require('./utils/tracker');

App({
  onLaunch() {
    // ... 其他初始化
    
    // 初始化行为采集
    tracker.init();
  },
  
  onUnload() {
    // 页面卸载时上报剩余数据
    tracker.flush();
  }
});
```

### 7. 各页面添加采集点

在以下页面中添加行为采集：

#### `pages/index/index.js`

```javascript
const tracker = require('../../utils/tracker');

Page({
  onShow() {
    // 页面访问已自动采集
  },
  
  onSearch(e) {
    const keyword = e.detail.value;
    // 记录搜索行为
    tracker.trackSearch(keyword, this.data.searchResults.length);
  },
  
  onCardTap(e) {
    const id = e.currentTarget.dataset.id;
    // 记录点击行为
    tracker.trackClick('index', 'location_card', { locationId: id });
  }
});
```

#### `pages/detail/detail.js`

```javascript
const tracker = require('../../utils/tracker');

Page({
  onShow() {
    // 记录查看的切片
    const slices = this.data.location.slices || [];
    tracker.trackPageView('detail', {
      locationId: this.data.location.id,
      viewedSlices: slices.map(s => ({
        title: s.title,
        dimKey: s.dimKey,
        subs: s.subs
      }))
    });
  },
  
  onSliceTap(e) {
    const sliceIndex = e.currentTarget.dataset.index;
    tracker.trackClick('detail', 'slice', {
      sliceIndex,
      sliceTitle: this.data.location.slices[sliceIndex].title
    });
  }
});
```

#### `pages/recommend/recommend.js`

```javascript
const tracker = require('../../utils/tracker');

Page({
  onShow() {
    // 页面访问已自动采集
  },
  
  onBehaviorSelect(e) {
    const behavior = e.currentTarget.dataset.behavior;
    tracker.trackClick('recommend', 'behavior', { behavior });
  }
});
```

#### `pages/checkin/checkin.js`

```javascript
const tracker = require('../../utils/tracker');

Page({
  onShow() {
    // 页面访问已自动采集
  },
  
  onSubmit() {
    // 记录打卡行为
    tracker.trackCheckin({
      pointId: this.data.selectedPoint.id,
      pointName: this.data.selectedPoint.name,
      behavior: this.data.selectedBehavior,
      rating: this.data.rating
    });
  }
});
```

## 测试要求

1. 行为采集器能自动初始化
2. 页面访问、停留时长能自动记录
3. 点击行为能正确记录
4. 搜索行为能正确记录
5. 打卡行为能正确记录
6. 行为数据能正确上报到云端
7. 能从云端获取行为数据

## 提交要求

```bash
git add utils/tracker.js cloudfunctions/saveBehavior/ cloudfunctions/getBehaviors/ app.js pages/
git commit -m "feat: add behavior tracking system (passive collection)"
```
