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
