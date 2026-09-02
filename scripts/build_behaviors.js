/**
 * 构建 data/behaviors.js —— 116 种行为 → 子素养映射 + 联想词 + 场景/引导
 *
 * 数据源：
 *   - 归档 behavior_map_extended.json（116 行为：subs/dim/cat/scene/guide）
 *   - 归档 behavior_slice_index_extended.json（行为 → 对症切片，用于找素养页）
 *   - 工作区 utils/search.js 的联想词表（口语 → 子素养）
 *   - 归档 delivery_data.json 可能附带的联想词
 *
 * 用于：找素养页（输入行为→1-3项子素养→对症切片）、做方案页。
 */
const fs = require('fs');
const path = require('path');

const ARCHIVE = 'D:/desk/素养导引地图_全量源码归档（永恒）/src/data';
const OUT = path.resolve(__dirname, '..', 'data', 'behaviors.js');

const bme = JSON.parse(fs.readFileSync(path.join(ARCHIVE, 'behavior_map_extended.json'), 'utf8'));
const bsi = JSON.parse(fs.readFileSync(path.join(ARCHIVE, 'behavior_slice_index_extended.json'), 'utf8'));

// 归档维度名 -> 工作区六维键/标签
const DIM_KEY = { '身体': '体素', '情绪': '心素', '价值': '灵素', '认知': '智素', '行动': '行素', '社交': '交素' };
const DIM_LABEL = { '身体': '身体素养', '情绪': '情绪素养', '价值': '价值素养', '认知': '认知素养', '行动': '行动素养', '社交': '社交素养' };

// 行为别名（口语/常见说法），便于家长更能搜到
const BEHAVIOR_ALIAS = {
  '磨蹭': ['拖拉', '拖延', '懒散', '做事慢', '行动慢', '慢吞吞'],
  '顶嘴': ['逆反', '叛逆', '回嘴', '顶撞'],
  '不专注': ['坐不住', '多动', '好动', '静不下来', '分心', '注意力不集中'],
  '不爱读书': ['不爱看书', '不爱阅读', '不看书', '学不进去'],
  '怕黑': ['胆小', '怕', '不敢'],
  '爱发脾气': ['脾气大', '暴躁', '易怒', '爱生气'],
  '害羞': ['内向', '怕人', '不敢说话', '社恐', '不爱交流'],
  '沉迷屏幕': ['沉迷游戏', '玩手机', '玩平板', '手机控', '看手机'],
  '恋迷手机': ['沉迷手机', '玩手机'],
  '挑食': ['偏食', '不爱吃饭', '不吃饭'],
  '不爱运动': ['不运动', '体质差', '容易生病'],
  '打人': ['欺负人', '霸凌', '打架', '推人', '动手'],
  '撒谎': ['说谎', '骗人', '不诚实'],
  '不懂感恩': ['不感恩', '不懂事'],
  '自私自利': ['自私', '利己'],
  '没礼貌': ['不礼貌', '无礼'],
  '不守时': ['迟到', '不守约'],
  '丢三落四': ['丢东西', '忘带', '马虎'],
  '拖拉': ['磨蹭', '拖延'],
  '表达不清': ['不爱说话', '不会说话', '表达差'],
  '怕吃苦': ['娇气', '怕累'],
  '不了解规则': ['不守规矩', '没规矩'],
  '不珍惜粮食': ['浪费粮食', '剩饭'],
  '做事三分钟热度': ['坚持不了', '没恒心'],
  '不爱洗手': ['不讲卫生', '不洗手']
};

// 子素养名归一化：老体系名 -> 105/100 体系名（仅当存在明确等价时）
const SUB_NORM = {};

// 同义词归一（与 data/sub_literacies.js 的 SYNONYM 保持一致）
const SUB_SYNONYM = {
  '协商解决': '协商与冲突解决',
  '平衡': '平衡与协调',
  '语言表达': '自我表达',
  '审美': '审美感知',
  '想象力': '想象联想',
  '求助': '主动求助',
  '求知态度': '求真态度',
  '独立性': '独立自理',
  '自我觉察': '情绪觉知',
  '规则': '规则意识'
};
const normSub = (s) => SUB_NORM[s] || SUB_SYNONYM[s] || s;

const BEHAVIORS = {};
for (const [name, b] of Object.entries(bme)) {
  const dimKey = DIM_KEY[b.dim] || b.dim;
  const subs = (b.subs || []).map(normSub);
  const index = bsi[name] || {};
  const slices = (index.slices || []).map(sl => ({
    point: sl.point,
    location: sl.location,
    name: sl.name,
    subs: (sl.sub || []).map(normSub),
    age: sl.age,
    star: (sl.star && typeof sl.star === 'object')
      ? { 身体: b2s(sl.star['身体']), 情绪: b2s(sl.star['情绪']), 价值: b2s(sl.star['价值']), 认知: b2s(sl.star['认知']), 行动: b2s(sl.star['行动']), 社交: b2s(sl.star['社交']) }
      : sl.star
  }));
  BEHAVIORS[name] = {
    name,
    dim: b.dim,
    dimKey,
    dimLabel: DIM_LABEL[b.dim] || b.dim,
    cat: b.cat,
    scene: b.scene,
    guide: b.guide,
    subs,
    aliases: BEHAVIOR_ALIAS[name] || [],
    slices,
    sliceCount: slices.length
  };
}

function b2s(v) {
  if (v === undefined || v === null || v === '') return '';
  if (typeof v === 'number') return v;
  return String(v);
}

// 覆盖检查
let zero = 0, missingDim = 0;
for (const [n, b] of Object.entries(BEHAVIORS)) {
  if (!b.sliceCount) zero++;
  if (!b.dimKey) missingDim++;
}
console.log('行为总数:', Object.keys(BEHAVIORS).length);
console.log('无对症切片的行为数:', zero);
console.log('无法映射六维的行为数:', missingDim);

const content = `/**
 * 行为 → 子素养 映射库（116 行为 × 1-4 子素养）
 *
 * 数据源自归档《教养导引地图全量源码归档》behavior_map_extended.json +
 * behavior_slice_index_extended.json + 工作区 search.js 联想词。
 * 子素养名尽量归一化到 SUB_LITERACIES 100/105 体系（SUB_NORM 表）。
 *
 * 结构：BEHAVIORS[name] = { name, dim, dimKey, dimLabel, cat, scene, guide, subs[], aliases[], slices[], sliceCount }
 */
const BEHAVIORS = ${JSON.stringify(BEHAVIORS, null, 2)};

const BEHAVIOR_TOTAL = Object.keys(BEHAVIORS).length;

module.exports = { BEHAVIORS, BEHAVIOR_TOTAL };
`;

fs.writeFileSync(OUT, content, 'utf8');
console.log('已写', OUT, '(', content.length, 'bytes )');
