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
