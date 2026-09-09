# Task 1: 用户角色系统

## 任务概述

创建用户角色系统，支持家庭用户、成员、领队三种角色，首次使用时弹出角色选择，支持之后更改。

## 需要创建的文件

### 1. `data/user-roles.js` - 角色配置文件

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

### 2. `pages/role-select/` - 角色选择页面

需要创建4个文件：
- `role-select.js` - 页面逻辑
- `role-select.wxml` - 页面模板
- `role-select.wxss` - 页面样式
- `role-select.json` - 页面配置

#### role-select.js

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

#### role-select.wxml

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

#### role-select.wxss

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

#### role-select.json

```json
{
  "usingComponents": {},
  "navigationBarTitleText": "选择身份",
  "navigationBarBackgroundColor": "#667eea",
  "navigationBarTextStyle": "white"
}
```

## 需要修改的文件

### 3. `app.js` - 添加角色初始化

在 `App({...})` 中添加：

```javascript
const tracker = require('./utils/tracker');

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

### 4. `app.json` - 添加新页面路由

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
  ]
}
```

### 5. `cloudfunctions/login/index.js` - 添加角色字段

修改用户创建部分：

```javascript
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
```

## 测试要求

1. 首次使用时应弹出角色选择页
2. 选择角色后应保存到本地和云端
3. 再次打开应记住角色选择
4. 可以在个人档案页更改角色

## 提交要求

```bash
git add data/user-roles.js pages/role-select/ app.js app.json cloudfunctions/login/
git commit -m "feat: add user role system with selection page"
```
