/**
 * 维度数据 - 六维素养体系
 */

const DIMENSIONS = {
  '体素': {
    key: '体素',
    label: '身体素养',
    color: '#FF6B6B',
    description: '运动、体能、健康、感官'
  },
  '心素': {
    key: '心素',
    label: '情绪素养',
    color: '#4ECDC4',
    description: '情感、心态、抗挫、情绪管理'
  },
  '灵素': {
    key: '灵素',
    label: '价值素养',
    color: '#45B7D1',
    description: '品格、文化认同、家国情怀'
  },
  '智素': {
    key: '智素',
    label: '认知素养',
    color: '#96CEB4',
    description: '科学思维、学习能力、信息素养'
  },
  '行素': {
    key: '行素',
    label: '行动素养',
    color: '#FFEAA7',
    description: '行动规划、实践执行、劳动'
  },
  '交素': {
    key: '交素',
    label: '社交素养',
    color: '#DDA0DD',
    description: '社交发起、合作沟通、倾听'
  }
};

const DIM_ORDER = ['体素', '心素', '灵素', '智素', '行素', '交素'];

const DIM_LABELS = {
  '体素': '身体素养',
  '心素': '情绪素养',
  '灵素': '价值素养',
  '智素': '认知素养',
  '行素': '行动素养',
  '交素': '社交素养'
};

module.exports = {
  DIMENSIONS,
  DIM_ORDER,
  DIM_LABELS
};
