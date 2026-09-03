const tracker = require('./tracker');
const app = getApp();

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
  const userRole = (app && app.globalData.userRole) || 'parent';
  
  return { 
    ready: false, 
    reason: 'observing',
    progress,
    message: getProgressMessage(progress, stats, userRole)
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
