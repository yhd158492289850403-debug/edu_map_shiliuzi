# Task 8: 教师权限与班级数据

## 任务概述

创建教师权限系统，教师可以查看班级所有学生的数据，生成班级汇总报告。

## 需要创建的文件

### 1. `cloudfunctions/getClassStudents/index.js` - 获取班级学生云函数

```javascript
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

### 2. `cloudfunctions/getClassStudents/package.json`

```json
{
  "name": "getClassStudents",
  "version": "1.0.0",
  "description": "获取班级学生数据",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "~2.6.3"
  }
}
```

## 需要修改的文件

### 3. `pages/profile/profile.js` - 添加教师数据视图

在 `Page({...})` 中添加：

```javascript
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

### 4. `pages/profile/profile.wxml` - 添加教师视图

在页面中添加：

```xml
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

### 5. `pages/profile/profile.wxss` - 添加教师视图样式

```css
.teacher-section {
  margin-top: 40rpx;
  padding: 30rpx;
  background: white;
  border-radius: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
}

.class-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #4ECDC4;
  display: block;
}

.stat-label {
  font-size: 24rpx;
  color: #666;
}

.student-list {
  margin-bottom: 30rpx;
}

.student-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  margin-bottom: 10rpx;
  background: #f9f9f9;
  border-radius: 10rpx;
}

.student-name {
  font-size: 28rpx;
  color: #333;
}

.student-checkins {
  font-size: 24rpx;
  color: #666;
}

.export-class-btn {
  background: #667eea;
  color: white;
  border-radius: 50rpx;
  padding: 20rpx;
  font-size: 28rpx;
  font-weight: bold;
  border: none;
}

.export-class-btn::after {
  border: none;
}
```

## 测试要求

1. 教师角色能正确识别
2. 班级数据能正确加载
3. 学生列表能正确显示
4. 班级统计能正确计算
5. 导出班级汇总表按钮功能正常

## 提交要求

```bash
git add cloudfunctions/getClassStudents/ pages/profile/
git commit -m "feat: add teacher permissions and class data view"
```
