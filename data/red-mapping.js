/**
 * 红色研学切片 → 六维素养映射工具
 * 将红色切片的 sub 字段（如"政治认同/热爱祖国"）反向映射到六维素养体系
 */

// 红色研学常见子素养 → 六维素养映射表
const SUB_TO_DIM = {
  // 灵素（价值素养）
  '政治认同': '灵素',
  '热爱祖国': '灵素',
  '理想信念': '灵素',
  '使命担当': '灵素',
  '家国认同': '灵素',
  '忠诚报国': '灵素',
  '民族团结': '灵素',
  '共同体意识': '灵素',
  '文化自信': '灵素',
  '热爱家乡': '灵素',
  '集体主义': '灵素',
  '集体意识': '灵素',
  '责任担当': '灵素',
  '统一战线': '灵素',
  '国际主义': '灵素',
  '荣誉感': '灵素',
  '团结奋进': '灵素',

  // 心素（情绪素养）
  '勇敢坚毅': '心素',
  '坚持不懈': '心素',
  '情绪调节': '心素',
  '共情回应': '心素',
  '挫折应对': '心素',

  // 智素（认知素养）
  '历史思维': '智素',
  '审美情趣': '智素',
  '文化理解': '智素',
  '科学探究': '智素',
  '批判思考': '智素',

  // 行素（行动素养）
  '责任担当': '行素',
  '艰苦奋斗': '行素',
  '纪律意识': '行素',
  '动手实践': '行素',

  // 交素（社交素养）
  '团结奋进': '交素',
  '民族团结': '交素',
  '集体意识': '交素',
  '尊重差异': '交素',

  // 体素（身体素养）
  '体能挑战': '体素',
  '身体自信': '体素',
};

// 五育标签 → 六维素养映射
const VIRTUE_TO_DIM = {
  '德': '灵素',
  '智': '智素',
  '体': '体素',
  '美': '智素',
  '劳': '行素',
};

/**
 * 从红色切片的 sub 字段推断主要维度和次要维度
 * @param {string} subStr - 斜杠分隔的子素养字符串，如"政治认同/热爱祖国/使命担当/历史思维"
 * @param {string} virtueStr - 五育标签，如"德/智"
 * @returns {{ ld: string, md: string[], ad: string[] }}
 */
function inferDimensions(subStr, virtueStr) {
  const dimCounts = { 体素: 0, 心素: 0, 灵素: 0, 智素: 0, 行素: 0, 交素: 0 };

  // 从 sub 字段统计维度出现次数
  if (subStr) {
    const subs = subStr.split('/').map(s => s.trim());
    for (const sub of subs) {
      const dim = SUB_TO_DIM[sub];
      if (dim) {
        dimCounts[dim]++;
      }
    }
  }

  // 从 virtue 字段补充
  if (virtueStr) {
    const virtues = virtueStr.split('/').map(s => s.trim());
    for (const v of virtues) {
      const dim = VIRTUE_TO_DIM[v];
      if (dim) {
        dimCounts[dim] += 0.5; // 五育权重较低
      }
    }
  }

  // 按计数排序，取主维度和次维度
  const sorted = Object.entries(dimCounts)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) {
    return { ld: '灵素', md: ['智素'], ad: ['灵素', '智素'] };
  }

  const ld = sorted[0][0];
  const md = sorted.slice(1, 3).map(([dim]) => dim);
  const ad = [ld, ...md];

  return { ld, md, ad };
}

/**
 * 从红色切片的 sub 字段提取子素养列表（过滤掉不在系统中的）
 * @param {string} subStr
 * @returns {string[]}
 */
function extractSubs(subStr) {
  if (!subStr) return [];
  return subStr.split('/').map(s => s.trim()).filter(Boolean);
}

/**
 * 从 virtue 字段计算星级分布
 * @param {string} virtueStr - 如"德/智"
 * @returns {object} - 如{"灵素":3,"智素":2,"体素":1,...}
 */
function inferStars(virtueStr) {
  const stars = { 体素: 1, 心素: 1, 灵素: 1, 智素: 1, 行素: 1, 交素: 1 };
  if (!virtueStr) {
    stars.灵素 = 3;
    stars.智素 = 2;
    return stars;
  }
  const virtues = virtueStr.split('/').map(s => s.trim());
  for (const v of virtues) {
    const dim = VIRTUE_TO_DIM[v];
    if (dim) stars[dim] = 3;
  }
  // 确保至少有一个3星
  if (!Object.values(stars).includes(3)) {
    stars.灵素 = 3;
  }
  return stars;
}

module.exports = { SUB_TO_DIM, VIRTUE_TO_DIM, inferDimensions, extractSubs, inferStars };
