const tracker = require('./tracker');
const app = getApp();

// 观察期触发条件
const TRIGGERS = {
  CHECKIN_COUNT: 5,  // 改为5次
  SESSION_DAYS: 7,
  VIEWED_SLICES: 10
};

/**
 * 检查是否应该开始评估
 */
async function shouldStartAssessment() {
  const behaviors = await tracker.getBehaviors();
  const stats = behaviors.stats;
  
  // 如果云函数未部署，使用本地存储的数据
  let totalCheckins = stats.totalCheckins || 0;
  let viewedSlices = stats.viewedSlices || [];
  let firstUseTime = stats.firstUseTime;
  
  // 从本地存储获取打卡次数
  try {
    const localCheckins = wx.getStorageSync('localCheckins') || [];
    console.log('从本地存储读取打卡记录:', localCheckins.length, '条');
    
    // 同时尝试从云数据库读取打卡记录
    try {
      const db = wx.cloud.database();
      const { data } = await db.collection('checkins').where({
        _openid: '{openid}'
      }).get();
      
      // 合并云数据库和本地存储的打卡记录
      const cloudCheckins = data || [];
      console.log('从云数据库读取打卡记录:', cloudCheckins.length, '条');
      
      // 取两者的最大值
      totalCheckins = Math.max(localCheckins.length, cloudCheckins.length, totalCheckins);
      
      // 如果云数据库有更多记录，同步到本地存储
      if (cloudCheckins.length > localCheckins.length) {
        wx.setStorageSync('localCheckins', cloudCheckins);
        console.log('同步云数据库记录到本地存储');
      }
    } catch (cloudErr) {
      console.warn('读取云数据库失败:', cloudErr.message);
      // 如果云数据库读取失败，使用本地存储
      totalCheckins = Math.max(localCheckins.length, totalCheckins);
    }
    
    console.log('最终打卡次数:', totalCheckins);
  } catch (err) {
    console.error('读取本地存储失败:', err);
  }
  
  // 从本地存储获取首次使用时间
  if (!firstUseTime) {
    try {
      firstUseTime = wx.getStorageSync('firstUseTime');
      if (!firstUseTime) {
        firstUseTime = Date.now();
        wx.setStorageSync('firstUseTime', firstUseTime);
        console.log('设置首次使用时间:', firstUseTime);
      }
    } catch (err) {
      firstUseTime = Date.now();
    }
  }
  
  console.log('观察期检查 - 打卡次数:', totalCheckins, '目标:', TRIGGERS.CHECKIN_COUNT);
  
  // 条件1：累计打卡≥10次
  if (totalCheckins >= TRIGGERS.CHECKIN_COUNT) {
    console.log('观察期结束：打卡次数达标');
    return { ready: true, reason: 'checkin_count', progress: 100 };
  }
  
  // 计算进度
  const progress = calculateProgress({
    totalCheckins,
    viewedSlices,
    firstUseTime
  });
  const userRole = (app && app.globalData.userRole) || 'parent';
  
  console.log('观察期进度:', progress + '%');
  
  return { 
    ready: false, 
    reason: 'observing',
    progress,
    stats: { totalCheckins, viewedSlices, firstUseTime },
    message: getProgressMessage(progress, { totalCheckins, viewedSlices }, userRole)
  };
}

function calculateProgress(stats) {
  const checkinProgress = (stats.totalCheckins / TRIGGERS.CHECKIN_COUNT) * 100;
  const daysProgress = stats.firstUseTime 
    ? ((Date.now() - stats.firstUseTime) / (1000 * 60 * 60 * 24) / TRIGGERS.SESSION_DAYS) * 100
    : 0;
  const sliceProgress = ((stats.viewedSlices || []).length / TRIGGERS.VIEWED_SLICES) * 100;
  
  return Math.min(100, Math.max(checkinProgress, daysProgress, sliceProgress));
}

function getProgressMessage(progress, stats, userRole) {
  const isStudent = userRole === 'student';
  
  if (progress < 30) {
    return isStudent ? '🌱 正在记录你的学习轨迹...' : '🌱 正在观察孩子的成长轨迹...';
  } else if (progress < 60) {
    return isStudent ? '🌿 数据收集中，你正在很好地成长！' : '🌿 数据收集中，孩子正在很好地成长！';
  } else if (progress < 90) {
    return '🌳 即将完成数据收集，再努力一点点！';
  } else {
    return '🎉 即将生成专属成长报告！';
  }
}

function getNextStepMessage(stats) {
  const checkinRemain = TRIGGERS.CHECKIN_COUNT - (stats.totalCheckins || 0);
  const sliceRemain = TRIGGERS.VIEWED_SLICES - (stats.viewedSlices || []).length;
  
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
