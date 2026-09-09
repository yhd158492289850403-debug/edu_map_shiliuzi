const ROLE_TYPES = {
  GUEST: 'guest',
  FAMILY: 'family', 
  TEAM: 'team'
};

const ROLE_CONFIGS = {
  [ROLE_TYPES.GUEST]: {
    label: '游客入口',
    icon: '🌍',
    description: '自由探索，按喜好选择路线',
    reportStyle: 'exploration'  // 探索发现型
  },
  [ROLE_TYPES.FAMILY]: {
    label: '亲子入口',
    icon: '👨‍👩‍👧‍👦',
    description: '家庭带娃一起选，内容适合孩子',
    reportStyle: 'family'  // 亲子互动型
  },
  [ROLE_TYPES.TEAM]: {
    label: '团队入口',
    icon: '👥',
    description: '适合团体活动、班级出游、旅行社带团',
    reportStyle: 'group',  // 团体协作型
    permissions: ['view_group_data', 'export_group_report']
  }
};

const DEFAULT_ROLE = ROLE_TYPES.GUEST;

module.exports = { ROLE_TYPES, ROLE_CONFIGS, DEFAULT_ROLE };
