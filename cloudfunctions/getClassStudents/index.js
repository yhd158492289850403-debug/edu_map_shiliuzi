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
