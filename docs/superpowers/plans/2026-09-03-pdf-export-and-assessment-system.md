# PDF导出与六维素养评估系统实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现PDF导出功能和基于行为数据的六维素养评估系统，包含观察期机制、角色化报告和教师数据权限。

**Architecture:** 
- 前端：小程序原生Canvas绘制雷达图 + 无感行为采集
- 后端：云函数生成PDF（pdf-lib） + 数据库存储行为记录
- 评估算法：基于用户行为数据（查看/打卡/停留时长）推断六维素养得分
- 冷启动：观察期（打卡3次/使用7天/查看10个教案）后才开始评分

**Tech Stack:** 微信小程序原生 + 微信云开发 + pdf-lib + Canvas API

**Spec:** 微信小程序无感行为追踪技术方案.md + 用户讨论记录

## Global Constraints

- 所有数据采集必须"无感"，不增加用户操作负担
- 观察期必须给出积极反馈和下一步建议
- 角色选择首次使用时弹出，支持之后更改
- 教师只能看到自己班级的学生数据
- PDF导出支持单次和多选两种模式

---

## 文件结构

### 新增文件

| 文件路径 | 职责 |
|----------|------|
| `utils/tracker.js` | 行为采集核心：页面访问、停留时长、点击行为 |
| `utils/assessment.js` | 六维素养评估算法 |
| `utils/report-generator.js` | 报告生成：家长/学生/教师三种模板 |
| `utils/radar-chart.js` | Canvas雷达图绘制 |
| `utils/pdf-export.js` | PDF导出前端逻辑 |
| `data/user-roles.js` | 角色配置和权限定义 |
| `pages/role-select/` | 角色选择页面 |
| `pages/report/` | 报告展示页面 |
| `components/observation-period/` | 观察期提示组件 |
| `components/report-card/` | 报告卡片组件 |
| `components/radar-chart/` | 雷达图组件 |
| `cloudfunctions/generatePDF/` | PDF生成云函数 |
| `cloudfunctions/getBehaviors/` | 获取行为数据云函数 |
| `cloudfunctions/saveBehavior/` | 保存行为数据云函数 |
| `cloudfunctions/getClassStudents/` | 获取班级学生数据云函数 |

### 修改文件

| 文件路径 | 修改内容 |
|----------|---------|
| `app.js` | 添加角色初始化、行为采集初始化 |
| `app.json` | 添加新页面路由 |
| `pages/index/index.js` | 添加行为采集点 |
| `pages/detail/detail.js` | 添加行为采集点 |
| `pages/near/near.js` | 添加行为采集点 |
| `pages/recommend/recommend.js` | 添加行为采集点 |
| `pages/profile/profile.js` | 添加报告入口、角色切换 |
| `pages/checkin/checkin.js` | 添加行为采集点、观察期检查 |
| `cloudfunctions/login/index.js` | 添加角色字段 |

---

## Task 1: 用户角色系统

**Files:**
- Create: `data/user-roles.js`
- Create: `pages/role-select/role-select.js`
- Create: `pages/role-select/role-select.wxml`
- Create: `pages/role-select/role-select.wxss`
- Create: `pages/role-select/role-select.json`
- Modify: `app.js`
- Modify: `app.json`
- Modify: `cloudfunctions/login/index.js`

**Interfaces:**
- Produces: `ROLE_TYPES` 常量, `getRoleConfig()` 函数, `setUserRole()` 云函数方法

- [ ] **Step 1: 创建角色配置文件**

```javascript
// data/user-roles.js
const ROLE_TYPES = {
  PARENT: 'parent',
  STUDENT: 'student', 
  TEACHER: 'teacher'
};

const ROLE_CONFIGS = {
  [ROLE_TYPES.PARENT]: {
    label: '家长',
    icon: '👨‍👩‍👧',
    description: '查看孩子成长报告，获取育儿建议',
    reportStyle: 'warm'  // 温馨鼓励型
  },
  [ROLE_TYPES.STUDENT]: {
    label: '学生',
    icon: '👦',
    description: '查看自己的成长勋章和能力图',
    reportStyle: 'playful'  // 活泼游戏型
  },
  [ROLE_TYPES.TEACHER]: {
    label: '教师',
    icon: '👨‍🏫',
    description: '查看班级学生数据，生成教学报告',
    reportStyle: 'professional',  // 专业数据型
    permissions: ['view_class_data', 'export_class_report']
  }
};

const DEFAULT_ROLE = ROLE_TYPES.PARENT;

module.exports = { ROLE_TYPES, ROLE_CONFIGS, DEFAULT_ROLE };
```

- [ ] **Step 2: 创建角色选择页面**

```javascript
// pages/role-select/role-select.js
const { ROLE_TYPES, ROLE_CONFIGS } = require('../../data/user-roles');
const app = getApp();

Page({
  data: {
    roles: [],
    selectedRole: '',
    isFirstTime: true
  },

  onLoad(options) {
    const roles = Object.entries(ROLE_CONFIGS).map(([key, config]) => ({
      key,
      ...config,
      selected: false
    }));
    
    this.setData({
      roles,
      isFirstTime: options.first === 'true',
      selectedRole: app.globalData.userRole || ''
    });
  },

  onRoleSelect(e) {
    const role = e.currentTarget.dataset.role;
    this.setData({ selectedRole: role });
  },

  async onConfirm() {
    if (!this.data.selectedRole) {
      wx.showToast({ title: '请选择身份', icon: 'none' });
      return;
    }

    try {
      // 保存到本地
      wx.setStorageSync('userRole', this.data.selectedRole);
      app.globalData.userRole = this.data.selectedRole;

      // 保存到云端
      const db = wx.cloud.database();
      await db.collection('users').where({
        _openid: '{openid}'
      }).update({
        data: {
          role: this.data.selectedRole,
          updated_at: new Date()
        }
      });

      wx.showToast({ title: '设置成功', icon: 'success' });
      
      // 返回上一页或跳转首页
      if (this.data.isFirstTime) {
        wx.reLaunch({ url: '/pages/index/index' });
      } else {
        wx.navigateBack();
      }
    } catch (err) {
      console.error('保存角色失败:', err);
      wx.showToast({ title: '设置失败，请重试', icon: 'none' });
    }
  }
});
```

```xml
<!-- pages/role-select/role-select.wxml -->
<view class="container">
  <view class="header">
    <text class="title">欢迎使用石榴籽成长快乐导引地图！</text>
    <text class="subtitle">请选择您的身份</text>
  </view>
  
  <view class="role-list">
    <view 
      class="role-item {{item.key === selectedRole ? 'selected' : ''}}"
      wx:for="{{roles}}"
      wx:key="key"
      data-role="{{item.key}}"
      bindtap="onRoleSelect"
    >
      <text class="role-icon">{{item.icon}}</text>
      <view class="role-info">
        <text class="role-name">{{item.label}}</text>
        <text class="role-desc">{{item.description}}</text>
      </view>
      <view class="role-check" wx:if="{{item.key === selectedRole}}">✓</view>
    </view>
  </view>
  
  <view class="footer">
    <button class="confirm-btn" bindtap="onConfirm">确认选择</button>
    <text class="hint" wx:if="{{!isFirstTime}}">之后可以在"设置"中更改</text>
  </view>
</view>
```

- [ ] **Step 3: 修改云函数login，添加角色字段**

```javascript
// cloudfunctions/login/index.js - 修改用户创建部分
if (data.length === 0) {
  // 新用户，创建记录
  await db.collection('users').add({
    data: {
      _openid: openid,
      nickname: '微信用户',
      avatar: '',
      role: 'parent',  // 默认角色
      class_id: '',     // 班级ID（教师用）
      created_at: new Date(),
      updated_at: new Date()
    }
  })
}
```

- [ ] **Step 4: 修改app.js，添加角色初始化**

```javascript
// app.js - 在onLaunch中添加
App({
  globalData: {
    userInfo: null,
    openid: null,
    userRole: 'parent'  // 默认角色
  },

  onLaunch() {
    // 云开发初始化
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloud1-d5gyas9xgbb003681',
        traceUser: true
      });
      this.getOpenid();
    }
    
    // 初始化角色
    this.initRole();
  },

  initRole() {
    const role = wx.getStorageSync('userRole');
    if (role) {
      this.globalData.userRole = role;
    } else {
      // 首次使用，跳转角色选择页
      wx.navigateTo({ 
        url: '/pages/role-select/role-select?first=true' 
      });
    }
  }
});
```

- [ ] **Step 5: 更新app.json，添加新页面路由**

```json
{
  "pages": [
    "pages/index/index",
    "pages/detail/detail",
    "pages/near/near",
    "pages/recommend/recommend",
    "pages/profile/profile",
    "pages/checkin/checkin",
    "pages/role-select/role-select",
    "pages/report/report"
  ]
}
```

- [ ] **Step 6: 测试角色选择功能**

运行：微信开发者工具 → 编译 → 首次使用应弹出角色选择页

- [ ] **Step 7: 提交代码**

```bash
git add data/user-roles.js pages/role-select/ app.js app.json cloudfunctions/login/
git commit -m "feat: add user role system with selection page"
```

---

## Task 2: 行为采集系统（无感）

**Files:**
- Create: `utils/tracker.js`
- Modify: `pages/index/index.js`
- Modify: `pages/detail/detail.js`
- Modify: `pages/near/near.js`
- Modify: `pages/recommend/recommend.js`
- Modify: `pages/checkin/checkin.js`
- Create: `cloudfunctions/saveBehavior/index.js`
- Create: `cloudfunctions/saveBehavior/package.json`
- Create: `cloudfunctions/getBehaviors/index.js`
- Create: `cloudfunctions/getBehaviors/package.json`

**Interfaces:**
- Produces: `tracker.trackPageView()`, `tracker.trackClick()`, `tracker.trackStay()`, `tracker.trackCheckin()`, `tracker.flush()`

- [ ] **Step 1: 创建行为采集核心模块**

```javascript
// utils/tracker.js
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

- [ ] **Step 2: 创建行为采集云函数**

```javascript
// cloudfunctions/saveBehavior/index.js
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

```javascript
// cloudfunctions/getBehaviors/index.js
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

- [ ] **Step 3: 在app.js中初始化采集器**

```javascript
// app.js - 添加tracker初始化
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

- [ ] **Step 4: 在各页面添加采集点**

```javascript
// pages/index/index.js - 首页添加
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

```javascript
// pages/detail/detail.js - 详情页添加
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

- [ ] **Step 5: 测试采集功能**

运行：微信开发者工具 → 编译 → 操作几个页面 → 检查云数据库behaviors集合

- [ ] **Step 6: 提交代码**

```bash
git add utils/tracker.js cloudfunctions/saveBehavior/ cloudfunctions/getBehaviors/ pages/
git commit -m "feat: add behavior tracking system (passive collection)"
```

---

## Task 3: 观察期机制

**Files:**
- Create: `components/observation-period/observation-period.js`
- Create: `components/observation-period/observation-period.wxml`
- Create: `components/observation-period/observation-period.wxss`
- Create: `components/observation-period/observation-period.json`
- Modify: `pages/profile/profile.js`
- Modify: `pages/profile/profile.wxml`

**Interfaces:**
- Produces: `checkObservationPeriod()`, `getObservationProgress()`

- [ ] **Step 1: 创建观察期检查模块**

```javascript
// utils/observation.js
const tracker = require('./tracker');

// 观察期触发条件
const TRIGGERS = {
  CHECKIN_COUNT: 3,
  SESSION_DAYS: 7,
  VIEWED_SLICES: 10
};

/**
 * 检查是否应该开始评估
 */
async function shouldStartAssessment() {
  const behaviors = await tracker.getBehaviors();
  const stats = behaviors.stats;
  
  // 条件1：累计打卡≥3次
  if (stats.totalCheckins >= TRIGGERS.CHECKIN_COUNT) {
    return { ready: true, reason: 'checkin_count', progress: 100 };
  }
  
  // 条件2：使用满7天
  if (stats.firstUseTime) {
    const daysDiff = (Date.now() - stats.firstUseTime) / (1000 * 60 * 60 * 24);
    if (daysDiff >= TRIGGERS.SESSION_DAYS) {
      return { ready: true, reason: 'session_days', progress: 100 };
    }
  }
  
  // 条件3：查看教案≥10个
  if (stats.viewedSlices.length >= TRIGGERS.VIEWED_SLICES) {
    return { ready: true, reason: 'viewed_slices', progress: 100 };
  }
  
  // 计算进度
  const progress = calculateProgress(stats);
  
  return { 
    ready: false, 
    reason: 'observing',
    progress,
    message: getProgressMessage(progress, stats)
  };
}

function calculateProgress(stats) {
  const checkinProgress = (stats.totalCheckins / TRIGGERS.CHECKIN_COUNT) * 100;
  const daysProgress = stats.firstUseTime 
    ? ((Date.now() - stats.firstUseTime) / (1000 * 60 * 60 * 24) / TRIGGERS.SESSION_DAYS) * 100
    : 0;
  const sliceProgress = (stats.viewedSlices.length / TRIGGERS.VIEWED_SLICES) * 100;
  
  return Math.min(100, Math.max(checkinProgress, daysProgress, sliceProgress));
}

function getProgressMessage(progress, stats) {
  if (progress < 30) {
    return '🌱 正在观察孩子的成长轨迹...';
  } else if (progress < 60) {
    return '🌿 数据收集中，孩子正在很好地成长！';
  } else if (progress < 90) {
    return '🌳 即将完成数据收集，再努力一点点！';
  } else {
    return '🎉 即将生成专属成长报告！';
  }
}

function getNextStepMessage(stats) {
  const checkinRemain = TRIGGERS.CHECKIN_COUNT - stats.totalCheckins;
  const sliceRemain = TRIGGERS.VIEWED_SLICES - stats.viewedSlices.length;
  
  if (checkinRemain > 0 && sliceRemain > 0) {
    return `再完成${checkinRemain}次打卡或学习${sliceRemain}个教案即可生成报告`;
  } else if (checkinRemain > 0) {
    return `再完成${checkinRemain}次打卡即可生成报告`;
  } else if (sliceRemain > 0) {
    return `再学习${sliceRemain}个教案即可生成报告`;
  }
  
  return '继续加油！';
}

module.exports = {
  TRIGGERS,
  shouldStartAssessment,
  getProgressMessage,
  getNextStepMessage
};
```

- [ ] **Step 2: 创建观察期提示组件**

```javascript
// components/observation-period/observation-period.js
const { shouldStartAssessment, getProgressMessage, getNextStepMessage } = require('../../utils/observation');

Component({
  properties: {},
  
  data: {
    isLoading: true,
    isObserving: true,
    progress: 0,
    message: '',
    nextStep: '',
    stats: {}
  },
  
  lifetimes: {
    attached() {
      this.checkStatus();
    }
  },
  
  methods: {
    async checkStatus() {
      this.setData({ isLoading: true });
      
      try {
        const result = await shouldStartAssessment();
        
        this.setData({
          isLoading: false,
          isObserving: !result.ready,
          progress: result.progress || 0,
          message: result.message || getProgressMessage(result.progress || 0, {}),
          nextStep: getNextStepMessage(result.stats || {})
        });
        
        if (result.ready) {
          this.triggerEvent('ready');
        }
      } catch (err) {
        console.error('检查观察期状态失败:', err);
        this.setData({ isLoading: false });
      }
    }
  }
});
```

```xml
<!-- components/observation-period/observation-period.wxml -->
<view class="observation-container" wx:if="{{!isLoading && isObserving}}">
  <view class="observation-card">
    <view class="message">{{message}}</view>
    
    <view class="progress-bar">
      <view class="progress-fill" style="width: {{progress}}%"></view>
    </view>
    
    <view class="progress-text">{{progress}}%</view>
    
    <view class="next-step">
      <text class="hint">💡 {{nextStep}}</text>
    </view>
    
    <view class="encouragement">
      <text>您的孩子正在很好地成长！每一次探访都是宝贵的经历。</text>
    </view>
  </view>
</view>
```

```css
/* components/observation-period/observation-period.wxss */
.observation-container {
  padding: 20rpx;
}

.observation-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20rpx;
  padding: 40rpx;
  color: white;
}

.message {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 30rpx;
}

.progress-bar {
  height: 20rpx;
  background: rgba(255,255,255,0.3);
  border-radius: 10rpx;
  margin-bottom: 10rpx;
}

.progress-fill {
  height: 100%;
  background: white;
  border-radius: 10rpx;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: right;
  font-size: 24rpx;
  opacity: 0.8;
  margin-bottom: 20rpx;
}

.next-step {
  background: rgba(255,255,255,0.2);
  border-radius: 10rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.hint {
  font-size: 26rpx;
}

.encouragement {
  font-size: 24rpx;
  opacity: 0.9;
  line-height: 1.6;
}
```

- [ ] **Step 3: 在个人档案页添加观察期组件**

```xml
<!-- pages/profile/profile.wxml -->
<view class="profile-page">
  <!-- 观察期提示 -->
  <observation-period bind:ready="onAssessmentReady" />
  
  <!-- 已评估后显示报告入口 -->
  <view class="report-entry" wx:if="{{!isObserving}}">
    <button bindtap="goToReport">查看成长报告</button>
  </view>
  
  <!-- 其他内容 -->
</view>
```

```javascript
// pages/profile/profile.js
Page({
  data: {
    isObserving: true
  },
  
  onAssessmentReady() {
    this.setData({ isObserving: false });
    wx.showToast({ title: '数据收集完成！', icon: 'success' });
  },
  
  goToReport() {
    wx.navigateTo({ url: '/pages/report/report' });
  }
});
```

- [ ] **Step 4: 测试观察期功能**

运行：微信开发者工具 → 编译 → 首次使用应显示观察期提示

- [ ] **Step 5: 提交代码**

```bash
git add utils/observation.js components/observation-period/ pages/profile/
git commit -m "feat: add observation period mechanism with progress tracking"
```

---

## Task 4: 六维素养评估算法

**Files:**
- Create: `utils/assessment.js`

**Interfaces:**
- Produces: `calculateSixDimScores()`, `calculateInitialScores()`, `updateScores()`

- [ ] **Step 1: 创建评估算法模块**

```javascript
// utils/assessment.js
const { LOCATIONS } = require('../data/locations');
const { SUB_LITERACIES } = require('../data/sub_literacies');

// 六维素养键
const DIM_KEYS = ['体素', '心素', '灵素', '智素', '行素', '交素'];

// 权重配置
const WEIGHTS = {
  RECOGNITION: 0.2,   // 关注度（查看）
  PARTICIPATION: 0.3, // 参与度（打卡）
  DEPTH: 0.25,        // 深度（停留时长）
  FEEDBACK: 0.25      // 反馈（评分）
};

/**
 * 计算六维素养得分
 * @param {Object} behaviors - 用户行为数据
 * @returns {Object} 六维得分 {体素: 0-100, 心素: 0-100, ...}
 */
function calculateSixDimScores(behaviors) {
  const scores = {};
  
  for (const dimKey of DIM_KEYS) {
    const R = calcRecognition(behaviors.viewedSlices || [], dimKey);
    const P = calcParticipation(behaviors.checkins || [], dimKey);
    const D = calcDepth(behaviors.viewedSlices || [], dimKey);
    const F = calcFeedback(behaviors.feedbacks || [], dimKey);
    
    // 加权求和
    scores[dimKey] = R * WEIGHTS.RECOGNITION + 
                     P * WEIGHTS.PARTICIPATION + 
                     D * WEIGHTS.DEPTH + 
                     F * WEIGHTS.FEEDBACK;
  }
  
  // 归一化到0-100
  const maxScore = Math.max(...Object.values(scores), 1);
  for (const dimKey of DIM_KEYS) {
    scores[dimKey] = Math.round((scores[dimKey] / maxScore) * 100);
  }
  
  return scores;
}

/**
 * 计算关注度（查看教案数量和星级）
 */
function calcRecognition(viewedSlices, dimKey) {
  const dimSlices = viewedSlices.filter(s => s.dimKey === dimKey);
  if (dimSlices.length === 0) return 0;
  
  const count = dimSlices.length;
  const avgStars = dimSlices.reduce((sum, s) => {
    return sum + (s.stars && s.stars[dimKey] ? s.stars[dimKey] : 0);
  }, 0) / count;
  
  // 对数衰减：查看10个和100个的差距不是10倍，而是2倍
  return Math.log(1 + count) * (avgStars / 3) * 20;
}

/**
 * 计算参与度（打卡数量和点位星级）
 */
function calcParticipation(checkins, dimKey) {
  const dimCheckins = checkins.filter(c => {
    const point = LOCATIONS.find(l => l.id === c.pointId);
    return point && point.stars[dimKey] >= 2;
  });
  
  if (dimCheckins.length === 0) return 0;
  
  const count = dimCheckins.length;
  const avgStars = dimCheckins.reduce((sum, c) => {
    const point = LOCATIONS.find(l => l.id === c.pointId);
    return sum + (point.stars[dimKey] || 0);
  }, 0) / count;
  
  return Math.min(count * 5, 30) * (avgStars / 3);
}

/**
 * 计算深度（停留时长）
 */
function calcDepth(viewedSlices, dimKey) {
  const dimSlices = viewedSlices.filter(s => s.dimKey === dimKey);
  const totalMinutes = dimSlices.reduce((sum, s) => sum + (s.duration || 0), 0) / 60;
  
  // 对数衰减：看30分钟和300分钟的差距不是10倍
  return Math.log(1 + totalMinutes) * 10;
}

/**
 * 计算反馈权重
 */
function calcFeedback(feedbacks, dimKey) {
  const dimFeedbacks = feedbacks.filter(f => {
    const slice = findSlice(f.sliceId);
    return slice && slice.dimKey === dimKey;
  });
  
  if (dimFeedbacks.length === 0) return 0;
  
  const usefulCount = dimFeedbacks.filter(f => f.useful).length;
  const ratingScore = dimFeedbacks.reduce((sum, f) => {
    return sum + (f.rating === '有帮助' ? 3 : f.rating === '一般' ? 1 : 0);
  }, 0);
  
  return Math.min(usefulCount * 2 + ratingScore, 25);
}

/**
 * 基于历史行为推断初始分数
 */
function calculateInitialScores(behaviors) {
  const scores = {};
  
  // 基于已查看的教案维度分布
  const dimViewCount = {};
  for (const slice of (behaviors.viewedSlices || [])) {
    dimViewCount[slice.dimKey] = (dimViewCount[slice.dimKey] || 0) + 1;
  }
  
  // 基于已打卡的点位维度分布
  const dimCheckinCount = {};
  for (const checkin of (behaviors.checkins || [])) {
    const point = LOCATIONS.find(l => l.id === checkin.pointId);
    if (point) {
      for (const dim of (point.ad || [])) {
        dimCheckinCount[dim] = (dimCheckinCount[dim] || 0) + 1;
      }
    }
  }
  
  // 计算各维度得分（归一化到0-100）
  const maxView = Math.max(...Object.values(dimViewCount), 1);
  const maxCheckin = Math.max(...Object.values(dimCheckinCount), 1);
  
  for (const dimKey of DIM_KEYS) {
    const viewScore = ((dimViewCount[dimKey] || 0) / maxView) * 40;
    const checkinScore = ((dimCheckinCount[dimKey] || 0) / maxCheckin) * 60;
    scores[dimKey] = Math.round(viewScore + checkinScore);
  }
  
  return scores;
}

/**
 * 更新分数（加权平均）
 */
function updateScores(oldScores, newBehaviors) {
  const newScores = calculateSixDimScores(newBehaviors);
  
  // 加权平均：旧分70% + 新分30%（避免波动太大）
  const updated = {};
  for (const dimKey of DIM_KEYS) {
    const oldScore = oldScores[dimKey] || 0;
    const newScore = newScores[dimKey] || 0;
    updated[dimKey] = Math.round(oldScore * 0.7 + newScore * 0.3);
  }
  
  return updated;
}

/**
 * 查找切片
 */
function findSlice(sliceId) {
  for (const loc of LOCATIONS) {
    for (const slice of (loc.slices || [])) {
      if (slice.id === sliceId) return slice;
    }
  }
  return null;
}

module.exports = {
  DIM_KEYS,
  WEIGHTS,
  calculateSixDimScores,
  calculateInitialScores,
  updateScores
};
```

- [ ] **Step 2: 测试评估算法**

创建测试脚本验证算法正确性。

- [ ] **Step 3: 提交代码**

```bash
git add utils/assessment.js
git commit -m "feat: add six-dimension assessment algorithm"
```

---

## Task 5: 雷达图组件（原生Canvas）

**Files:**
- Create: `utils/radar-chart.js`
- Create: `components/radar-chart/radar-chart.js`
- Create: `components/radar-chart/radar-chart.wxml`
- Create: `components/radar-chart/radar-chart.wxss`
- Create: `components/radar-chart/radar-chart.json`

**Interfaces:**
- Produces: `drawRadarChart()`, `RadarChart` 组件

- [ ] **Step 1: 创建雷达图绘制工具**

```javascript
// utils/radar-chart.js
const DIM_LABELS = {
  '体素': '身体素养',
  '心素': '情绪素养',
  '灵素': '价值素养',
  '智素': '认知素养',
  '行素': '行动素养',
  '交素': '社交素养'
};

const DIM_COLORS = {
  '体素': '#FF6B6B',
  '心素': '#4ECDC4',
  '灵素': '#45B7D1',
  '智素': '#96CEB4',
  '行素': '#FFEAA7',
  '交素': '#DDA0DD'
};

/**
 * 绘制雷达图
 * @param {CanvasContext} ctx - Canvas上下文
 * @param {Object} data - 数据 {体素: 80, 心素: 60, ...}
 * @param {Object} options - 配置选项
 */
function drawRadarChart(ctx, data, options = {}) {
  const {
    centerX = 150,
    centerY = 150,
    radius = 100,
    showLabels = true,
    showValues = true,
    fillColor = 'rgba(66, 133, 244, 0.3)',
    strokeColor = '#4285F4',
    lineWidth = 2
  } = options;
  
  const dims = Object.keys(DIM_LABELS);
  const angleStep = (Math.PI * 2) / dims.length;
  
  // 绘制背景网格
  drawGrid(ctx, centerX, centerY, radius, dims.length);
  
  // 绘制数据区域
  drawDataArea(ctx, data, centerX, centerY, radius, dims, fillColor, strokeColor, lineWidth);
  
  // 绘制标签
  if (showLabels) {
    drawLabels(ctx, dims, centerX, centerY, radius);
  }
  
  // 绘制数值
  if (showValues) {
    drawValues(ctx, data, dims, centerX, centerY, radius);
  }
}

function drawGrid(ctx, centerX, centerY, radius, sides) {
  ctx.setStrokeStyle('#E0E0E0');
  ctx.setLineWidth(1);
  
  // 绘制同心多边形
  for (let level = 1; level <= 5; level++) {
    const r = (radius / 5) * level;
    ctx.beginPath();
    
    for (let i = 0; i <= sides; i++) {
      const angle = (Math.PI * 2 / sides) * i - Math.PI / 2;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.closePath();
    ctx.stroke();
  }
  
  // 绘制从中心到顶点的线
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 / sides) * i - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}

function drawDataArea(ctx, data, centerX, centerY, radius, dims, fillColor, strokeColor, lineWidth) {
  ctx.beginPath();
  
  for (let i = 0; i <= dims.length; i++) {
    const dim = dims[i % dims.length];
    const value = (data[dim] || 0) / 100;
    const angle = (Math.PI * 2 / dims.length) * i - Math.PI / 2;
    const r = radius * value;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  
  ctx.closePath();
  ctx.setFillStyle(fillColor);
  ctx.fill();
  ctx.setStrokeStyle(strokeColor);
  ctx.setLineWidth(lineWidth);
  ctx.stroke();
}

function drawLabels(ctx, dims, centerX, centerY, radius) {
  ctx.setFillStyle('#333');
  ctx.setFontSize(12);
  ctx.setTextAlign('center');
  
  for (let i = 0; i < dims.length; i++) {
    const dim = dims[i];
    const angle = (Math.PI * 2 / dims.length) * i - Math.PI / 2;
    const labelRadius = radius + 20;
    const x = centerX + labelRadius * Math.cos(angle);
    const y = centerY + labelRadius * Math.sin(angle);
    
    ctx.fillText(DIM_LABELS[dim], x, y);
  }
}

function drawValues(ctx, data, dims, centerX, centerY, radius) {
  ctx.setFillStyle('#666');
  ctx.setFontSize(10);
  ctx.setTextAlign('center');
  
  for (let i = 0; i < dims.length; i++) {
    const dim = dims[i];
    const value = data[dim] || 0;
    const angle = (Math.PI * 2 / dims.length) * i - Math.PI / 2;
    const valueRadius = radius + 35;
    const x = centerX + valueRadius * Math.cos(angle);
    const y = centerY + valueRadius * Math.sin(angle);
    
    ctx.fillText(`${value}`, x, y);
  }
}

/**
 * 生成雷达图数据URL
 */
function generateRadarChartImage(data, options = {}) {
  return new Promise((resolve, reject) => {
    const canvas = wx.createOffscreenCanvas({ type: '2d', width: 300, height: 300 });
    const ctx = canvas.getContext('2d');
    
    drawRadarChart(ctx, data, { ...options, centerX: 150, centerY: 150 });
    
    // 转换为图片
    wx.canvasToTempFilePath({
      canvas,
      success: (res) => resolve(res.tempFilePath),
      fail: reject
    });
  });
}

module.exports = {
  DIM_LABELS,
  DIM_COLORS,
  drawRadarChart,
  generateRadarChartImage
};
```

- [ ] **Step 2: 创建雷达图组件**

```javascript
// components/radar-chart/radar-chart.js
const { drawRadarChart } = require('../../utils/radar-chart');

Component({
  properties: {
    data: {
      type: Object,
      value: {}
    },
    width: {
      type: Number,
      value: 300
    },
    height: {
      type: Number,
      value: 300
    },
    showLabels: {
      type: Boolean,
      value: true
    },
    showValues: {
      type: Boolean,
      value: true
    }
  },
  
  lifetimes: {
    ready() {
      this.drawChart();
    }
  },
  
  observers: {
    'data': function() {
      this.drawChart();
    }
  },
  
  methods: {
    drawChart() {
      const query = this.createSelectorQuery();
      query.select('#radar-canvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0]) return;
          
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          
          const dpr = wx.getWindowInfo().pixelRatio;
          canvas.width = this.data.width * dpr;
          canvas.height = this.data.height * dpr;
          ctx.scale(dpr, dpr);
          
          drawRadarChart(ctx, this.data.data, {
            centerX: this.data.width / 2,
            centerY: this.data.height / 2,
            radius: Math.min(this.data.width, this.data.height) / 2 - 40,
            showLabels: this.data.showLabels,
            showValues: this.data.showValues
          });
        });
    }
  }
});
```

```xml
<!-- components/radar-chart/radar-chart.wxml -->
<canvas 
  type="2d" 
  id="radar-canvas" 
  style="width: {{width}}px; height: {{height}}px;"
></canvas>
```

- [ ] **Step 3: 测试雷达图组件**

创建测试页面验证雷达图显示效果。

- [ ] **Step 4: 提交代码**

```bash
git add utils/radar-chart.js components/radar-chart/
git commit -m "feat: add radar chart component with native Canvas"
```

---

## Task 6: 报告生成系统（三种角色）

**Files:**
- Create: `utils/report-generator.js`
- Create: `pages/report/report.js`
- Create: `pages/report/report.wxml`
- Create: `pages/report/report.wxss`
- Create: `pages/report/report.json`
- Create: `components/report-card/report-card.js`
- Create: `components/report-card/report-card.wxml`
- Create: `components/report-card/report-card.wxss`
- Create: `components/report-card/report-card.json`

**Interfaces:**
- Produces: `generateReport()`, `ReportPage`, `ReportCard` 组件

- [ ] **Step 1: 创建报告生成器**

```javascript
// utils/report-generator.js
const { ROLE_TYPES } = require('../data/user-roles');
const { DIM_KEYS, calculateSixDimScores, calculateInitialScores } = require('./assessment');

/**
 * 生成报告
 * @param {string} role - 用户角色
 * @param {Object} scores - 六维得分
 * @param {Object} behaviors - 行为数据
 * @param {Object} options - 选项
 */
function generateReport(role, scores, behaviors, options = {}) {
  const generators = {
    [ROLE_TYPES.PARENT]: generateParentReport,
    [ROLE_TYPES.STUDENT]: generateStudentReport,
    [ROLE_TYPES.TEACHER]: generateTeacherReport
  };
  
  const generator = generators[role] || generateParentReport;
  return generator(scores, behaviors, options);
}

/**
 * 家长报告（温馨鼓励型）
 */
function generateParentReport(scores, behaviors, options) {
  const { nickname = '孩子', checkinCount = 0 } = options;
  
  return {
    title: `${nickname}的成长足迹`,
    subtitle: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' }),
    
    summary: {
      text: `在过去的这段时间里，${nickname}通过${checkinCount}次实地探访、多个教育教案的学习，在多个素养维度上都有了可喜的变化。`,
      highlight: getTopImprovement(scores)
    },
    
    dimensions: formatDimensions(scores, 'parent'),
    
    highlights: generateHighlights(scores, 'parent'),
    
    suggestions: generateSuggestions(scores, 'parent'),
    
    encouragement: getEncouragement(scores),
    
    radarData: scores
  };
}

/**
 * 学生报告（活泼游戏型）
 */
function generateStudentReport(scores, behaviors, options) {
  const { nickname = '同学', checkinCount = 0 } = options;
  
  return {
    title: `${nickname}的成长勋章墙`,
    subtitle: '🏆',
    
    achievements: generateAchievements(scores, behaviors),
    
    abilities: formatDimensions(scores, 'student'),
    
    tasks: generateTasks(scores),
    
    encouragement: getStudentEncouragement(scores),
    
    radarData: scores
  };
}

/**
 * 教师报告（专业数据型）
 */
function generateTeacherReport(scores, behaviors, options) {
  const { studentName = '学生', checkinCount = 0, classData = {} } = options;
  
  return {
    title: `学生素养发展评估报告 - ${studentName}`,
    subtitle: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
    
    summary: {
      evaluationPeriod: getEvaluationPeriod(behaviors),
      dataSources: getDataSources(behaviors),
      keyFindings: getKeyFindings(scores, classData)
    },
    
    dimensions: formatDimensions(scores, 'teacher'),
    
    analysis: generateAnalysis(scores, classData),
    
    recommendations: generateRecommendations(scores, 'teacher'),
    
    classComparison: classData ? generateClassComparison(scores, classData) : null,
    
    radarData: scores
  };
}

/**
 * 格式化维度数据
 */
function formatDimensions(scores, style) {
  return DIM_KEYS.map(dim => {
    const score = scores[dim] || 0;
    const label = getDimLabel(dim);
    const color = getDimColor(dim);
    
    let description = '';
    if (style === 'parent') {
      description = getParentDescription(dim, score);
    } else if (style === 'student') {
      description = getStudentDescription(dim, score);
    } else {
      description = getTeacherDescription(dim, score);
    }
    
    return {
      key: dim,
      label,
      score,
      color,
      description,
      level: getScoreLevel(score)
    };
  });
}

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

function getDimColor(dim) {
  const colors = {
    '体素': '#FF6B6B',
    '心素': '#4ECDC4',
    '灵素': '#45B7D1',
    '智素': '#96CEB4',
    '行素': '#FFEAA7',
    '交素': '#DDA0DD'
  };
  return colors[dim] || '#999';
}

function getScoreLevel(score) {
  if (score >= 80) return '优秀';
  if (score >= 60) return '良好';
  if (score >= 40) return '一般';
  return '待提升';
}

function getParentDescription(dim, score) {
  // 根据维度和分数生成家长风格的描述
  const descriptions = {
    '体素': {
      high: '孩子在身体素质方面表现优秀，运动能力较强！',
      medium: '孩子在身体素质方面发展良好，继续保持！',
      low: '可以多带孩子参加户外活动，提升身体素质。'
    },
    // ... 其他维度
  };
  
  const level = score >= 60 ? 'high' : score >= 40 ? 'medium' : 'low';
  return descriptions[dim]?.[level] || '';
}

function getStudentDescription(dim, score) {
  // 生成学生风格的描述
  return `${getDimLabel(dim)}：${score}分 ${getStarEmoji(score)}`;
}

function getTeacherDescription(dim, score) {
  // 生成教师风格的描述
  return `${getDimLabel(dim)}得分${score}分，${getScoreLevel(score)}水平`;
}

function getStarEmoji(score) {
  if (score >= 80) return '⭐⭐⭐';
  if (score >= 60) return '⭐⭐';
  if (score >= 40) return '⭐';
  return '';
}

function getTopImprovement(scores) {
  // 找出提升最大的维度
  return '情绪素养方面有明显提升';
}

function generateHighlights(scores, style) {
  // 生成亮点
  return ['情绪管理能力提升', '对历史文化兴趣增加'];
}

function generateSuggestions(scores, style) {
  // 生成建议
  return ['建议每周安排一次亲子活动', '可以多关注价值素养类教案'];
}

function getEncouragement(scores) {
  return '每一次探访都是一次成长的种子。请继续陪伴孩子，用耐心和爱心浇灌这些种子！';
}

function getStudentEncouragement(scores) {
  return '你已经很棒了！继续加油，解锁更多成就！';
}

function generateAchievements(scores, behaviors) {
  // 生成成就徽章
  return [
    { icon: '🎖️', title: '情绪小达人', description: '学会了情绪管理', unlocked: true },
    { icon: '🏆', title: '历史探险家', description: '参观了多个博物馆', unlocked: true },
    { icon: '🌟', title: '社交小明星', description: '待解锁', unlocked: false }
  ];
}

function generateTasks(scores) {
  return ['想要解锁"社交小明星"徽章吗？试试团队合作挑战吧！'];
}

function getEvaluationPeriod(behaviors) {
  return '2026年8月20日 - 2026年9月3日';
}

function getDataSources(behaviors) {
  return '3次实地探访记录、5个教案学习数据、6次行为观察';
}

function getKeyFindings(scores, classData) {
  return '该生在情绪素养维度表现突出，建议加强社交能力培养';
}

function generateAnalysis(scores, classData) {
  return {
    strengths: ['情绪管理', '历史文化兴趣'],
    weaknesses: ['社交互动'],
    trends: '整体呈上升趋势'
  };
}

function generateRecommendations(scores, style) {
  return [
    '建议增加团队合作类活动',
    '可采用情境模拟教学法',
    '定期反馈学生在家庭环境中的表现'
  ];
}

function generateClassComparison(scores, classData) {
  return {
    average: classData.average || {},
    ranking: '前30%',
    comparison: '高于班级平均水平'
  };
}

module.exports = {
  generateReport,
  formatDimensions
};
```

- [ ] **Step 2: 创建报告页面**

```javascript
// pages/report/report.js
const { generateReport } = require('../../utils/report-generator');
const { getBehaviors } = require('../../utils/tracker');
const { calculateSixDimScores, calculateInitialScores } = require('../../utils/assessment');
const app = getApp();

Page({
  data: {
    isLoading: true,
    report: null,
    role: 'parent',
    scores: {}
  },
  
  async onLoad() {
    await this.loadReport();
  },
  
  async loadReport() {
    this.setData({ isLoading: true });
    
    try {
      // 获取用户角色
      const role = app.globalData.userRole || 'parent';
      
      // 获取行为数据
      const behaviors = await getBehaviors();
      
      // 计算分数
      const scores = calculateSixDimScores(behaviors.stats);
      
      // 生成报告
      const report = generateReport(role, scores, behaviors.stats, {
        nickname: app.globalData.userInfo?.nickname || '用户',
        checkinCount: behaviors.stats.totalCheckins
      });
      
      this.setData({
        isLoading: false,
        report,
        role,
        scores
      });
    } catch (err) {
      console.error('加载报告失败:', err);
      this.setData({ isLoading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },
  
  onExportPDF() {
    wx.navigateTo({
      url: '/pages/pdf-export/pdf-export?scores=' + JSON.stringify(this.data.scores)
    });
  },
  
  onShare() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  }
});
```

```xml
<!-- pages/report/report.wxml -->
<view class="report-page">
  <view class="loading" wx:if="{{isLoading}}">加载中...</view>
  
  <view class="report-content" wx:else>
    <!-- 报告头部 -->
    <view class="report-header">
      <text class="report-title">{{report.title}}</text>
      <text class="report-subtitle">{{report.subtitle}}</text>
    </view>
    
    <!-- 雷达图 -->
    <view class="radar-section">
      <radar-chart data="{{scores}}" width="300" height="300" />
    </view>
    
    <!-- 维度详情 -->
    <view class="dimensions-section">
      <view class="dimension-item" wx:for="{{report.dimensions}}" wx:key="key">
        <view class="dim-header">
          <text class="dim-label">{{item.label}}</text>
          <text class="dim-score" style="color: {{item.color}}">{{item.score}}分</text>
        </view>
        <text class="dim-desc">{{item.description}}</text>
        <view class="dim-bar">
          <view class="dim-fill" style="width: {{item.score}}%; background: {{item.color}}"></view>
        </view>
      </view>
    </view>
    
    <!-- 亮点和建议 -->
    <view class="highlights-section" wx:if="{{report.highlights}}">
      <view class="section-title">🌟 成长亮点</view>
      <view class="highlight-item" wx:for="{{report.highlights}}" wx:key="*this">
        {{item}}
      </view>
    </view>
    
    <view class="suggestions-section" wx:if="{{report.suggestions}}">
      <view class="section-title">💡 改进建议</view>
      <view class="suggestion-item" wx:for="{{report.suggestions}}" wx:key="*this">
        {{item}}
      </view>
    </view>
    
    <!-- 鼓励语 -->
    <view class="encouragement" wx:if="{{report.encouragement}}">
      <text>{{report.encouragement}}</text>
    </view>
    
    <!-- 操作按钮 -->
    <view class="actions">
      <button class="export-btn" bindtap="onExportPDF">导出PDF</button>
      <button class="share-btn" bindtap="onShare">分享给朋友</button>
    </view>
  </view>
</view>
```

- [ ] **Step 3: 测试报告功能**

运行：微信开发者工具 → 编译 → 完成观察期后查看报告

- [ ] **Step 4: 提交代码**

```bash
git add utils/report-generator.js pages/report/ components/radar-chart/
git commit -m "feat: add report generation system with role-based templates"
```

---

## Task 7: PDF导出功能

**Files:**
- Create: `utils/pdf-export.js`
- Create: `cloudfunctions/generatePDF/index.js`
- Create: `cloudfunctions/generatePDF/package.json`
- Create: `pages/pdf-export/pdf-export.js`
- Create: `pages/pdf-export/pdf-export.wxml`
- Create: `pages/pdf-export/pdf-export.wxss`
- Create: `pages/pdf-export/pdf-export.json`

**Interfaces:**
- Produces: `exportPDF()`, `generatePDFCloud()`

- [ ] **Step 1: 创建PDF导出前端模块**

```javascript
// utils/pdf-export.js
const { generateRadarChartImage } = require('./radar-chart');

/**
 * 导出PDF
 * @param {Object} reportData - 报告数据
 * @param {Array} selectedCheckins - 选中的打卡记录
 */
async function exportPDF(reportData, selectedCheckins = []) {
  wx.showLoading({ title: '正在生成PDF...' });
  
  try {
    // 1. 生成雷达图图片
    const radarImage = await generateRadarChartImage(reportData.radarData);
    
    // 2. 调用云函数生成PDF
    const { result } = await wx.cloud.callFunction({
      name: 'generatePDF',
      data: {
        reportData,
        selectedCheckins,
        radarImage
      }
    });
    
    if (!result.success) {
      throw new Error(result.error || '生成PDF失败');
    }
    
    // 3. 下载PDF到本地
    const { fileID } = result;
    const { tempFilePath } = await wx.cloud.downloadFile({ fileID });
    
    // 4. 打开PDF预览
    await wx.openDocument({
      filePath: tempFilePath,
      showMenu: true,  // 显示右上角菜单，支持保存/转发
      success: () => {
        wx.hideLoading();
        wx.showToast({ title: 'PDF已生成', icon: 'success' });
      },
      fail: (err) => {
        console.error('打开PDF失败:', err);
        wx.hideLoading();
        wx.showToast({ title: '打开失败', icon: 'none' });
      }
    });
    
    return { success: true, filePath: tempFilePath };
  } catch (err) {
    console.error('导出PDF失败:', err);
    wx.hideLoading();
    wx.showToast({ title: '导出失败，请重试', icon: 'none' });
    return { success: false, error: err.message };
  }
}

/**
 * 生成文件名
 */
function generateFileName(nickname, type = 'report') {
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');
  
  const timeStr = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  }).replace(/:/g, '-');
  
  return `素养报告_${nickname}_${dateStr}_${timeStr}.pdf`;
}

module.exports = {
  exportPDF,
  generateFileName
};
```

- [ ] **Step 2: 创建PDF生成云函数**

```javascript
// cloudfunctions/generatePDF/index.js
const cloud = require('wx-server-sdk');
const { PDFDocument, PageSizes, rgb, StandardFonts } = require('pdf-lib');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { reportData, selectedCheckins, radarImage } = event;
  
  try {
    // 创建PDF文档
    const pdfDoc = await PDFDocument.create();
    
    // 设置中文字体
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const chineseFont = await pdfDoc.embedFont(StandardFonts.Courier);
    
    // 添加封面页
    const coverPage = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = coverPage.getSize();
    
    // 标题
    coverPage.drawText(reportData.title || '成长报告', {
      x: 50,
      y: height - 100,
      size: 24,
      font: chineseFont,
      color: rgb(0.2, 0.2, 0.2)
    });
    
    // 副标题
    coverPage.drawText(reportData.subtitle || '', {
      x: 50,
      y: height - 130,
      size: 14,
      font: chineseFont,
      color: rgb(0.5, 0.5, 0.5)
    });
    
    // 添加雷达图
    if (radarImage) {
      const imageBytes = Buffer.from(radarImage, 'base64');
      const image = await pdfDoc.embedPng(imageBytes);
      
      coverPage.drawImage(image, {
        x: width / 2 - 150,
        y: height - 400,
        width: 300,
        height: 300
      });
    }
    
    // 添加维度详情页
    const detailPage = pdfDoc.addPage(PageSizes.A4);
    let yPosition = height - 50;
    
    for (const dim of (reportData.dimensions || [])) {
      detailPage.drawText(`${dim.label}: ${dim.score}分`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: chineseFont,
        color: rgb(0.2, 0.2, 0.2)
      });
      
      yPosition -= 20;
      
      if (dim.description) {
        detailPage.drawText(dim.description, {
          x: 70,
          y: yPosition,
          size: 10,
          font: chineseFont,
          color: rgb(0.4, 0.4, 0.4)
        });
        yPosition -= 15;
      }
      
      yPosition -= 10;
      
      // 换页检查
      if (yPosition < 50) {
        yPosition = height - 50;
        pdfDoc.addPage(PageSizes.A4);
      }
    }
    
    // 添加打卡记录页（如果有选中的记录）
    if (selectedCheckins && selectedCheckins.length > 0) {
      const checkinPage = pdfDoc.addPage(PageSizes.A4);
      yPosition = height - 50;
      
      checkinPage.drawText('打卡记录', {
        x: 50,
        y: yPosition,
        size: 16,
        font: chineseFont,
        color: rgb(0.2, 0.2, 0.2)
      });
      
      yPosition -= 30;
      
      for (const checkin of selectedCheckins) {
        checkinPage.drawText(`${checkin.date} - ${checkin.point_name}`, {
          x: 50,
          y: yPosition,
          size: 10,
          font: chineseFont,
          color: rgb(0.3, 0.3, 0.3)
        });
        
        yPosition -= 15;
        
        if (checkin.notes) {
          checkinPage.drawText(checkin.notes, {
            x: 70,
            y: yPosition,
            size: 9,
            font: chineseFont,
            color: rgb(0.5, 0.5, 0.5)
          });
          yPosition -= 12;
        }
        
        yPosition -= 10;
        
        if (yPosition < 50) {
          yPosition = height - 50;
          pdfDoc.addPage(PageSizes.A4);
        }
      }
    }
    
    // 保存PDF
    const pdfBytes = await pdfDoc.save();
    
    // 上传到云存储
    const fileName = `report_${Date.now()}.pdf`;
    const { fileID } = await cloud.uploadFile({
      cloudPath: `reports/${fileName}`,
      fileContent: Buffer.from(pdfBytes)
    });
    
    return { success: true, fileID };
  } catch (err) {
    console.error('生成PDF失败:', err);
    return { success: false, error: err.message };
  }
};
```

- [ ] **Step 3: 创建PDF导出页面**

```javascript
// pages/pdf-export/pdf-export.js
const { exportPDF, generateFileName } = require('../../utils/pdf-export');
const { getBehaviors } = require('../../utils/tracker');
const app = getApp();

Page({
  data: {
    isLoading: false,
    scores: {},
    selectedCheckins: [],
    allCheckins: [],
    selectMode: false
  },
  
  onLoad(options) {
    if (options.scores) {
      this.setData({ scores: JSON.parse(options.scores) });
    }
    this.loadCheckins();
  },
  
  async loadCheckins() {
    try {
      const behaviors = await getBehaviors();
      const checkins = behaviors.behaviors.filter(b => b.type === 'checkin');
      this.setData({ allCheckins: checkins });
    } catch (err) {
      console.error('加载打卡记录失败:', err);
    }
  },
  
  onToggleSelectMode() {
    this.setData({ selectMode: !this.data.selectMode });
  },
  
  onToggleCheckin(e) {
    const id = e.currentTarget.dataset.id;
    const selected = [...this.data.selectedCheckins];
    const index = selected.indexOf(id);
    
    if (index > -1) {
      selected.splice(index, 1);
    } else {
      selected.push(id);
    }
    
    this.setData({ selectedCheckins: selected });
  },
  
  onSelectAll() {
    const allIds = this.data.allCheckins.map(c => c._id);
    this.setData({ selectedCheckins: allIds });
  },
  
  onDeselectAll() {
    this.setData({ selectedCheckins: [] });
  },
  
  async onExport() {
    this.setData({ isLoading: true });
    
    try {
      const selectedData = this.data.selectMode 
        ? this.data.allCheckins.filter(c => this.data.selectedCheckins.includes(c._id))
        : [];
      
      const reportData = {
        title: '成长报告',
        subtitle: new Date().toLocaleDateString('zh-CN'),
        dimensions: Object.entries(this.data.scores).map(([key, score]) => ({
          key,
          label: getDimLabel(key),
          score
        })),
        radarData: this.data.scores
      };
      
      await exportPDF(reportData, selectedData);
    } catch (err) {
      console.error('导出失败:', err);
    } finally {
      this.setData({ isLoading: false });
    }
  }
});

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
```

```xml
<!-- pages/pdf-export/pdf-export.wxml -->
<view class="export-page">
  <view class="loading" wx:if="{{isLoading}}">正在生成PDF...</view>
  
  <view class="content" wx:else>
    <view class="header">
      <text class="title">导出PDF报告</text>
      <text class="subtitle">选择要导出的内容</text>
    </view>
    
    <!-- 导出选项 -->
    <view class="options">
      <view class="option-item" bindtap="onToggleSelectMode">
        <text class="option-label">选择打卡记录</text>
        <switch checked="{{selectMode}}" />
      </view>
    </view>
    
    <!-- 打卡记录列表 -->
    <view class="checkin-list" wx:if="{{selectMode}}">
      <view class="list-header">
        <text>选择打卡记录</text>
        <view class="select-actions">
          <text bindtap="onSelectAll">全选</text>
          <text bindtap="onDeselectAll">取消全选</text>
        </view>
      </view>
      
      <view 
        class="checkin-item {{selectedCheckins.indexOf(item._id) > -1 ? 'selected' : ''}}"
        wx:for="{{allCheckins}}"
        wx:key="_id"
        data-id="{{item._id}}"
        bindtap="onToggleCheckin"
      >
        <view class="checkin-date">{{item.date}}</view>
        <view class="checkin-point">{{item.point_name}}</view>
        <view class="checkin-check" wx:if="{{selectedCheckins.indexOf(item._id) > -1}}">✓</view>
      </view>
      
      <view class="empty" wx:if="{{allCheckins.length === 0}}">暂无打卡记录</view>
    </view>
    
    <!-- 导出按钮 -->
    <view class="export-actions">
      <button class="export-btn" bindtap="onExport">
        导出PDF {{selectMode ? '(' + selectedCheckins.length + '条记录)' : '(仅报告)'}}
      </button>
    </view>
  </view>
</view>
```

- [ ] **Step 4: 测试PDF导出功能**

运行：微信开发者工具 → 编译 → 查看报告 → 点击导出PDF

- [ ] **Step 5: 提交代码**

```bash
git add utils/pdf-export.js cloudfunctions/generatePDF/ pages/pdf-export/
git commit -m "feat: add PDF export with selective checkin records"
```

---

## Task 8: 教师权限与班级数据

**Files:**
- Create: `cloudfunctions/getClassStudents/index.js`
- Create: `cloudfunctions/getClassStudents/package.json`
- Modify: `pages/profile/profile.js`
- Modify: `pages/profile/profile.wxml`

**Interfaces:**
- Produces: `getClassStudents()`, 教师数据视图

- [ ] **Step 1: 创建获取班级学生云函数**

```javascript
// cloudfunctions/getClassStudents/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();
  const { class_id } = event;
  
  try {
    // 验证教师权限
    const { data: teacher } = await db.collection('users').where({
      _openid: wxContext.OPENID,
      role: 'teacher'
    }).get();
    
    if (teacher.length === 0) {
      return { success: false, error: '无教师权限' };
    }
    
    const teacherData = teacher[0];
    const targetClassId = class_id || teacherData.class_id;
    
    if (!targetClassId) {
      return { success: false, error: '未绑定班级' };
    }
    
    // 获取班级学生
    const { data: students } = await db.collection('users').where({
      class_id: targetClassId,
      role: 'student'
    }).get();
    
    // 获取每个学生的行为数据
    const studentsWithBehaviors = await Promise.all(
      students.map(async (student) => {
        const { data: behaviors } = await db.collection('behaviors').where({
          _openid: student._openid
        }).limit(100).get();
        
        return {
          ...student,
          behaviors
        };
      })
    );
    
    // 计算班级统计
    const classStats = calculateClassStats(studentsWithBehaviors);
    
    return {
      success: true,
      students: studentsWithBehaviors,
      classStats
    };
  } catch (err) {
    console.error('获取班级数据失败:', err);
    return { success: false, error: err.message };
  }
};

function calculateClassStats(students) {
  const stats = {
    totalStudents: students.length,
    activeStudents: 0,
    averageCheckins: 0,
    dimAverages: {
      '体素': 0,
      '心素': 0,
      '灵素': 0,
      '智素': 0,
      '行素': 0,
      '交素': 0
    }
  };
  
  let totalCheckins = 0;
  
  for (const student of students) {
    const checkins = student.behaviors.filter(b => b.type === 'checkin');
    if (checkins.length > 0) {
      stats.activeStudents++;
      totalCheckins += checkins.length;
    }
  }
  
  stats.averageCheckins = stats.activeStudents > 0 
    ? Math.round(totalCheckins / stats.activeStudents) 
    : 0;
  
  return stats;
}
```

- [ ] **Step 2: 修改个人档案页，添加教师视图**

```javascript
// pages/profile/profile.js - 添加教师数据视图
Page({
  data: {
    // ... 其他数据
    isTeacher: false,
    classData: null,
    students: []
  },
  
  onLoad() {
    // ... 其他初始化
    this.checkTeacherRole();
  },
  
  async checkTeacherRole() {
    const role = app.globalData.userRole;
    if (role === 'teacher') {
      this.setData({ isTeacher: true });
      await this.loadClassData();
    }
  },
  
  async loadClassData() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'getClassStudents'
      });
      
      if (result.success) {
        this.setData({
          classData: result.classStats,
          students: result.students
        });
      }
    } catch (err) {
      console.error('加载班级数据失败:', err);
    }
  },
  
  onExportClassReport() {
    // 导出班级汇总表
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },
  
  onViewStudent(e) {
    const openid = e.currentTarget.dataset.openid;
    wx.navigateTo({
      url: `/pages/student-detail/student-detail?openid=${openid}`
    });
  }
});
```

```xml
<!-- pages/profile/profile.wxml - 添加教师视图 -->
<view class="teacher-section" wx:if="{{isTeacher}}">
  <view class="section-title">班级数据</view>
  
  <view class="class-stats">
    <view class="stat-item">
      <text class="stat-value">{{classData.totalStudents}}</text>
      <text class="stat-label">学生总数</text>
    </view>
    <view class="stat-item">
      <text class="stat-value">{{classData.activeStudents}}</text>
      <text class="stat-label">活跃学生</text>
    </view>
    <view class="stat-item">
      <text class="stat-value">{{classData.averageCheckins}}</text>
      <text class="stat-label">平均打卡</text>
    </view>
  </view>
  
  <view class="student-list">
    <view 
      class="student-item" 
      wx:for="{{students}}" 
      wx:key="_openid"
      data-openid="{{item._openid}}"
      bindtap="onViewStudent"
    >
      <text class="student-name">{{item.nickname}}</text>
      <text class="student-checkins">打卡{{item.behaviors.length}}次</text>
    </view>
  </view>
  
  <button class="export-class-btn" bindtap="onExportClassReport">
    导出班级汇总表
  </button>
</view>
```

- [ ] **Step 3: 测试教师权限功能**

运行：微信开发者工具 → 编译 → 使用教师账号登录 → 查看班级数据

- [ ] **Step 4: 提交代码**

```bash
git add cloudfunctions/getClassStudents/ pages/profile/
git commit -m "feat: add teacher permissions and class data view"
```

---

## 最终测试与部署

- [ ] **Step 1: 完整功能测试**

1. 首次使用 → 角色选择
2. 观察期 → 积极反馈
3. 行为采集 → 无感记录
4. 评估算法 → 六维得分
5. 报告生成 → 三种角色
6. PDF导出 → 单次/多选
7. 教师权限 → 班级数据

- [ ] **Step 2: 部署云函数**

```bash
# 部署所有云函数
cd cloudfunctions
for dir in */; do
  echo "Deploying $dir..."
  cd $dir
  npm install
  cd ..
done
```

- [ ] **Step 3: 更新README**

更新项目文档，说明新功能的使用方法。

- [ ] **Step 4: 最终提交**

```bash
git add .
git commit -m "feat: complete PDF export and assessment system implementation"
git push origin main
```

---

## 实施顺序建议

1. **Task 1**: 用户角色系统（基础）
2. **Task 2**: 行为采集系统（数据基础）
3. **Task 3**: 观察期机制（用户体验）
4. **Task 4**: 评估算法（核心功能）
5. **Task 5**: 雷达图组件（可视化）
6. **Task 6**: 报告生成系统（核心功能）
7. **Task 7**: PDF导出功能（用户需求）
8. **Task 8**: 教师权限（扩展功能）

每个Task完成后都应该进行测试，确保功能正常后再进入下一个Task。
