# Task 3: 观察期机制（积极反馈）

## 任务概述

创建观察期机制，在用户首次使用时，不立即给出评分，而是先收集数据，达到一定条件后再开始评估。观察期要有积极反馈和下一步建议。

## 需要创建的文件

### 1. `utils/observation.js` - 观察期检查模块

```javascript
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
  
  // 条件3：查看攻略≥10个
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
    return `再完成${checkinRemain}次打卡或探索${sliceRemain}个攻略即可生成报告`;
  } else if (checkinRemain > 0) {
    return `再完成${checkinRemain}次打卡即可生成报告`;
  } else if (sliceRemain > 0) {
    return `再探索${sliceRemain}个攻略即可生成报告`;
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

### 2. `components/observation-period/observation-period.js` - 观察期组件

```javascript
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

### 3. `components/observation-period/observation-period.wxml` - 组件模板

```xml
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

### 4. `components/observation-period/observation-period.wxss` - 组件样式

```css
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

### 5. `components/observation-period/observation-period.json` - 组件配置

```json
{
  "component": true,
  "usingComponents": {}
}
```

## 需要修改的文件

### 6. `pages/profile/profile.js` - 添加观察期组件

在 `Page({...})` 中添加：

```javascript
Page({
  data: {
    // ... 其他数据
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

### 7. `pages/profile/profile.wxml` - 添加观察期组件

在页面中添加：

```xml
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

### 8. `pages/profile/profile.json` - 添加组件引用

```json
{
  "usingComponents": {
    "observation-period": "/components/observation-period/observation-period"
  }
}
```

## 测试要求

1. 首次使用时应显示观察期提示
2. 观察期提示应显示积极反馈和下一步建议
3. 进度条应正确显示
4. 达到条件后应触发ready事件
5. 观察期结束后应显示报告入口

## 提交要求

```bash
git add utils/observation.js components/observation-period/ pages/profile/
git commit -m "feat: add observation period mechanism with progress tracking"
```
