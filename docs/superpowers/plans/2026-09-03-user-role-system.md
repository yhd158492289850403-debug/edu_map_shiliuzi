# User Role System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a user role system supporting parent, student, and teacher roles with first-time selection popup and ability to change later.

**Architecture:** Role configuration stored in data file, selection page for UI, integration with app.js for initialization, and cloud function for persistence.

**Tech Stack:** WeChat Mini Program, Cloud Development, Local Storage

**Spec:** `.superpowers/sdd/pdf-export-and-assessment-system/task-1-brief.md`

## Global Constraints

- Must support three roles: parent, student, teacher
- First-time users must see role selection page
- Role must persist locally and in cloud
- Must integrate with existing app structure
- Follow existing code style and patterns

---

### Task 1: Create Role Configuration File

**Files:**
- Create: `data/user-roles.js`

**Interfaces:**
- Produces: `ROLE_TYPES`, `ROLE_CONFIGS`, `DEFAULT_ROLE` constants

- [ ] **Step 1: Create role configuration file**

```javascript
const ROLE_TYPES = {
  PARENT: 'parent',
  STUDENT: 'student', 
  TEACHER: 'teacher'
};

const ROLE_CONFIGS = {
  [ROLE_TYPES.PARENT]: {
    label: '家庭用户',
    icon: '👨‍👩‍👧',
    description: '查看孩子成长报告，获取育儿建议',
    reportStyle: 'warm'  // 温馨鼓励型
  },
  [ROLE_TYPES.STUDENT]: {
    label: '成员',
    icon: '👦',
    description: '查看自己的成长勋章和能力图',
    reportStyle: 'playful'  // 活泼游戏型
  },
  [ROLE_TYPES.TEACHER]: {
    label: '领队',
    icon: '👨‍🏫',
    description: '查看团队成员数据，生成讲解报告',
    reportStyle: 'professional',  // 专业数据型
    permissions: ['view_class_data', 'export_class_report']
  }
};

const DEFAULT_ROLE = ROLE_TYPES.PARENT;

module.exports = { ROLE_TYPES, ROLE_CONFIGS, DEFAULT_ROLE };
```

- [ ] **Step 2: Verify file creation**

Run: `ls data/user-roles.js`
Expected: File exists

- [ ] **Step 3: Commit**

```bash
git add data/user-roles.js
git commit -m "feat: add user role configuration file"
```

---

### Task 2: Create Role Selection Page

**Files:**
- Create: `pages/role-select/role-select.js`
- Create: `pages/role-select/role-select.wxml`
- Create: `pages/role-select/role-select.wxss`
- Create: `pages/role-select/role-select.json`

**Interfaces:**
- Consumes: `ROLE_TYPES`, `ROLE_CONFIGS` from `data/user-roles.js`
- Produces: Role selection page with UI and logic

- [ ] **Step 1: Create role-select.js**

```javascript
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

- [ ] **Step 2: Create role-select.wxml**

```xml
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

- [ ] **Step 3: Create role-select.wxss**

```css
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx;
  display: flex;
  flex-direction: column;
}

.header {
  text-align: center;
  margin-bottom: 60rpx;
  margin-top: 100rpx;
}

.title {
  font-size: 40rpx;
  font-weight: bold;
  color: white;
  display: block;
  margin-bottom: 20rpx;
}

.subtitle {
  font-size: 28rpx;
  color: rgba(255,255,255,0.8);
}

.role-list {
  flex: 1;
}

.role-item {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.role-item.selected {
  background: rgba(255,255,255,0.95);
  transform: scale(1.02);
  box-shadow: 0 10rpx 30rpx rgba(0,0,0,0.2);
}

.role-icon {
  font-size: 60rpx;
  margin-right: 30rpx;
}

.role-info {
  flex: 1;
}

.role-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}

.role-desc {
  font-size: 24rpx;
  color: #666;
}

.role-check {
  width: 50rpx;
  height: 50rpx;
  background: #4ECDC4;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 28rpx;
}

.footer {
  margin-top: 40rpx;
}

.confirm-btn {
  background: white;
  color: #667eea;
  border-radius: 50rpx;
  padding: 25rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: none;
}

.confirm-btn::after {
  border: none;
}

.hint {
  text-align: center;
  display: block;
  margin-top: 20rpx;
  font-size: 24rpx;
  color: rgba(255,255,255,0.7);
}
```

- [ ] **Step 4: Create role-select.json**

```json
{
  "usingComponents": {},
  "navigationBarTitleText": "选择身份",
  "navigationBarBackgroundColor": "#667eea",
  "navigationBarTextStyle": "white"
}
```

- [ ] **Step 5: Verify page creation**

Run: `ls pages/role-select/`
Expected: 4 files exist

- [ ] **Step 6: Commit**

```bash
git add pages/role-select/
git commit -m "feat: add role selection page"
```

---

### Task 3: Modify App.js for Role Initialization

**Files:**
- Modify: `app.js`

**Interfaces:**
- Consumes: `wx.getStorageSync`, `wx.navigateTo`
- Produces: `globalData.userRole` property

- [ ] **Step 1: Read current app.js**

Read `app.js` to understand current structure.

- [ ] **Step 2: Add role initialization logic**

```javascript
// app.js
App({
  globalData: {
    userInfo: null,
    openid: null,
    userRole: 'parent',  // 默认角色
    filter: { search: '', dims: [], issues: [], unity: false, topics: [] },
    view: 'map',
    stage: '全部'
  },

  onLaunch() {
    // 云开发初始化
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloud1-d5gyas9xgbb003681',
        traceUser: true
      });
      // 获取 openid（容错：云函数未部署时不阻塞）
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
  },

  async getOpenid() {
    try {
      const { result } = await wx.cloud.callFunction({ name: 'login' });
      this.globalData.openid = result.openid;
    } catch (err) {
      console.warn('云函数 login 未部署，openid 将在后续获取：', err.message || err);
    }
  }
});
```

- [ ] **Step 3: Verify changes**

Run: `grep -n "initRole\|userRole" app.js`
Expected: Lines with initRole function and userRole property

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "feat: add role initialization to app.js"
```

---

### Task 4: Update App.json with New Page Route

**Files:**
- Modify: `app.json`

**Interfaces:**
- Produces: New page route for role-select

- [ ] **Step 1: Read current app.json**

Read `app.json` to understand current structure.

- [ ] **Step 2: Add role-select page route**

```json
{
  "pages": [
    "pages/index/index",
    "pages/detail/detail",
    "pages/near/near",
    "pages/recommend/recommend",
    "pages/profile/profile",
    "pages/checkin/checkin",
    "pages/role-select/role-select"
  ],
  "window": {
    "navigationStyle": "custom",
    "navigationBarTextStyle": "black",
    "backgroundColor": "#f8f9fb"
  },
  "usingComponents": {
    "filter-sheet": "/components/filter-sheet/filter-sheet",
    "feedback-popup": "/components/feedback-popup/feedback-popup"
  },
  "lazyCodeLoading": "requiredComponents",
  "permission": {
    "scope.userLocation": {
      "desc": "你的位置信息将用于查找附近的旅游景点并导航"
    }
  },
  "requiredPrivateInfos": [
    "getLocation",
    "chooseLocation"
  ],
  "sitemapLocation": "sitemap.json"
}
```

- [ ] **Step 3: Verify changes**

Run: `grep -n "role-select" app.json`
Expected: Line with role-select page route

- [ ] **Step 4: Commit**

```bash
git add app.json
git commit -m "feat: add role-select page route to app.json"
```

---

### Task 5: Update Cloud Function with Role Field

**Files:**
- Modify: `cloudfunctions/login/index.js`

**Interfaces:**
- Produces: `role` field in user document

- [ ] **Step 1: Read current cloud function**

Read `cloudfunctions/login/index.js` to understand current structure.

- [ ] **Step 2: Add role field to user creation**

```javascript
// 云函数入口文件 - login
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  try {
    // 获取openid
    const openid = wxContext.OPENID
    
    // 检查用户是否已存在
    const db = cloud.database()
    const { data } = await db.collection('users').where({
      _openid: openid
    }).get()

    if (data.length === 0) {
      // 新用户，创建记录
      await db.collection('users').add({
        data: {
          _openid: openid,
          nickname: '微信用户',
          avatar: '',
          role: 'parent',  // 默认角色
          class_id: '',     // 团队ID（领队用）
          created_at: new Date(),
          updated_at: new Date()
        }
      })
    }

    return {
      openid: openid,
      userInfo: data.length > 0 ? data[0] : null
    }
  } catch (err) {
    console.error('Login failed:', err)
    return {
      openid: wxContext.OPENID,
      userInfo: null,
      error: err.message
    }
  }
}
```

- [ ] **Step 3: Verify changes**

Run: `grep -n "role\|class_id" cloudfunctions/login/index.js`
Expected: Lines with role and class_id fields

- [ ] **Step 4: Commit**

```bash
git add cloudfunctions/login/
git commit -m "feat: add role field to user creation in login cloud function"
```

---

### Task 6: Integration Testing

**Files:**
- Test: All created and modified files

**Interfaces:**
- Consumes: All previous tasks

- [ ] **Step 1: Test role configuration file**

Run: `node -e "const roles = require('./data/user-roles'); console.log(roles);"`
Expected: Object with ROLE_TYPES, ROLE_CONFIGS, DEFAULT_ROLE

- [ ] **Step 2: Test page files exist**

Run: `ls pages/role-select/`
Expected: 4 files (js, wxml, wxss, json)

- [ ] **Step 3: Test app.js syntax**

Run: `node -c app.js`
Expected: No syntax errors

- [ ] **Step 4: Test app.json validity**

Run: `node -e "JSON.parse(require('fs').readFileSync('app.json', 'utf8'))"`
Expected: No JSON errors

- [ ] **Step 5: Test cloud function syntax**

Run: `node -c cloudfunctions/login/index.js`
Expected: No syntax errors

- [ ] **Step 6: Final commit with all changes**

```bash
git add data/user-roles.js pages/role-select/ app.js app.json cloudfunctions/login/
git commit -m "feat: add user role system with selection page"
```

---

## Verification Checklist

- [ ] Role configuration file created with correct constants
- [ ] Role selection page with all 4 files
- [ ] App.js modified with role initialization
- [ ] App.json updated with new page route
- [ ] Cloud function updated with role field
- [ ] All files have correct syntax
- [ ] Integration works as expected
- [ ] Code follows existing patterns and style