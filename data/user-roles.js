const ROLE_TYPES = {
  PARENT: 'parent',
  STUDENT: 'student', 
  TEACHER: 'teacher'
};

const ROLE_CONFIGS = {
  [ROLE_TYPES.PARENT]: {
    label: '家长',
    icon: '👨‍👩‍👧',
    description: '查看孩子成长报告，获取育儿建议',
    reportStyle: 'warm'  // 温馨鼓励型
  },
  [ROLE_TYPES.STUDENT]: {
    label: '学生',
    icon: '👦',
    description: '查看自己的成长勋章和能力图',
    reportStyle: 'playful'  // 活泼游戏型
  },
  [ROLE_TYPES.TEACHER]: {
    label: '教师',
    icon: '👨‍🏫',
    description: '查看班级学生数据，生成教学报告',
    reportStyle: 'professional',  // 专业数据型
    permissions: ['view_class_data', 'export_class_report']
  }
};

const DEFAULT_ROLE = ROLE_TYPES.PARENT;

module.exports = { ROLE_TYPES, ROLE_CONFIGS, DEFAULT_ROLE };
