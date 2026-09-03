/**
 * 六维素养评估算法
 * 基于用户行为数据（查看、打卡、停留时长）推断六维素养得分
 */
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
