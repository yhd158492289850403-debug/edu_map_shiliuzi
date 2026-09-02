/**
 * 构建 data/sub_literacies.js —— 子素养体系（合并版）
 *
 * 数据源：
 *   1) 归档 slice_data_full.json 的「六维子素养」体系（100 项，权威）
 *   2) 归档行为映射中引用的子素养名（补充体系缺失的独立项）
 *
 * 归并策略（知识性判断，已列入《未知项待核实》供外部 AI 复核）：
 *   - 明显的同义写法直接并入体系规范名（SYNONYM）
 *   - 仅当同义词解析失败且体系无对应项时，才新增为独立子素养（source='behavior'）
 *
 * 维度：归档（身体/情绪/价值/认知/行动/社交）→ 工作区六维（体素/心素/灵素/智素/行素/交素）
 */
const fs = require('fs');
const path = require('path');

const ARCHIVE = 'D:/desk/素养导引地图_全量源码归档（永恒）/src/data';
const OUT = path.resolve(__dirname, '..', 'data', 'sub_literacies.js');

const sdf = JSON.parse(fs.readFileSync(path.join(ARCHIVE, 'slice_data_full.json'), 'utf8'));
const dimSystem = sdf['六维子素养'] || {};
const bme = JSON.parse(fs.readFileSync(path.join(ARCHIVE, 'behavior_map_extended.json'), 'utf8'));
const bsi = JSON.parse(fs.readFileSync(path.join(ARCHIVE, 'behavior_slice_index_extended.json'), 'utf8'));

const DIM_KEY_FROM_NAME = {
  '身体素养': '体素', '情绪素养': '心素', '价值素养': '灵素', '认知素养': '智素', '行动素养': '行素', '社交素养': '交素'
};
const DIM_KEY_FROM_SHORT = { '身体': '体素', '情绪': '心素', '价值': '灵素', '认知': '智素', '行动': '行素', '社交': '交素' };
const DIM_LABEL = { '体素': '身体素养', '心素': '情绪素养', '灵素': '价值素养', '智素': '认知素养', '行素': '行动素养', '交素': '社交素养' };

// 同义词并入 100 体系（行为/切片里出现的旧名 → 体系规范名）
const SYNONYM = {
  '协商解决': '协商与冲突解决',
  '平衡': '平衡与协调',
  '语言表达': '自我表达',
  '审美': '审美感知',
  '想象力': '想象联想',
  '求助': '主动求助',
  '求知态度': '求真态度',
  '独立性': '独立自理',
  '自我觉察': '情绪觉知',
  '规则': '规则意识'      // 行为里"规则"指向独立子素养，这里保留为规范
};

// 行为数据所有子素养名
const behaviorSubs = new Set();
const addSubs = (list) => (list || []).forEach(s => s && behaviorSubs.add(s));
Object.values(bme).forEach(b => addSubs(b.subs));
Object.values(bsi).forEach(idx => (idx.slices || []).forEach(sl => addSubs(sl.sub)));

// ---- 构建主体：100 体系 ----
const SUB_LITERACIES = {};
for (const [dimName, subs] of Object.entries(dimSystem)) {
  const dk = DIM_KEY_FROM_NAME[dimName];
  if (!dk) continue;
  for (const sub of subs) {
    if (!SUB_LITERACIES[sub]) SUB_LITERACIES[sub] = { id: sub, name: sub, dimKey: dk, dimLabel: DIM_LABEL[dk], dim: dimName, source: 'system', desc: '' };
  }
}

// ---- 新增独立子素养（仅当同义解析失败且体系无此项） ----
const NEW_SUBS = {};
// 行为引用的旧名若在同义词表 → 归并到体系规范名；否则辨析是否需新增
const ADD_DIM_BY_NAME = {
  '价值取向': '灵素', '健康习惯': '体素', '公德心': '灵素', '公私分明': '灵素', '利他关怀': '灵素',
  '反思': '智素', '条理整理': '行素', '理解监控': '智素', '积极情绪培育': '心素', '自我效能': '心素',
  '自我检查': '智素', '节制': '灵素', '规则意识': '交素', '谦逊': '灵素', '语言理解': '智素'
};
// 明确的新增项白名单（体系无对应、不宜强行归并）
const GENUINE_NEW = new Set(Object.keys(ADD_DIM_BY_NAME));

for (const sub of behaviorSubs) {
  if (SUB_LITERACIES[sub]) continue;                    // 已在体系（含同义并入）
  const syn = SYNONYM[sub];
  if (syn && SUB_LITERACIES[syn]) continue;              // 同义并入体系项
  if (!GENUINE_NEW.has(sub)) { /* 未知子素养，记录待核实，不加 */ continue; }
  const dk = DIM_KEY_FROM_SHORT[ADD_DIM_BY_NAME[sub]] || ADD_DIM_BY_NAME[sub] || '智素';
  SUB_LITERACIES[sub] = { id: sub, name: sub, dimKey: dk, dimLabel: DIM_LABEL[dk], dim: DIM_LABEL[dk], source: 'behavior', desc: '' };
  NEW_SUBS[sub] = true;
}

// 记录无法归并也未列为新增的"悬置"子素养（缩进：待外部核实）
const HANG_SUBS = [...behaviorSubs].filter(s => !SUB_LITERACIES[s] && !GENUINE_NEW.has(s)).sort();

// 按维度组织
const DIMENSION_SUBS = {};
for (const sub of Object.values(SUB_LITERACIES)) {
  (DIMENSION_SUBS[sub.dimKey] = DIMENSION_SUBS[sub.dimKey] || []).push(sub.id);
}

const content = `/**
 * 子素养体系 —— 合并版（100 项体系 + 行为引用补齐）
 *
 * 数据源：归档 slice_data_full.json「六维子素养」+ behavior 映射引用子素养。
 * 维度键已归一化为工作区六维（体素/心素/灵素/智素/行素/交素）。
 *
 * SUB_LITERACIES[name] = { id, name, dimKey, dimLabel, dim, source: 'system'|'behavior', desc }
 * DIMENSION_SUBS[dimKey] = [name,...]
 * SYNONYM = 行为/切片旧名 → 体系规范名
 * SUB_BEHAVIOR_EXTRA = 行为补齐新增的独立子素养（仅当体系无对应）
 */
const SUB_LITERACIES = ${JSON.stringify(SUB_LITERACIES, null, 2)};

const DIMENSION_SUBS = ${JSON.stringify(DIMENSION_SUBS, null, 2)};

const SYNONYM = ${JSON.stringify(SYNONYM, null, 2)};

const SUB_TOTAL = Object.keys(SUB_LITERACIES).length;

const SUB_BEHAVIOR_EXTRA = ${JSON.stringify(Object.keys(NEW_SUBS).sort(), null, 2)};

module.exports = { SUB_LITERACIES, DIMENSION_SUBS, SYNONYM, SUB_TOTAL, SUB_BEHAVIOR_EXTRA };
`;

fs.writeFileSync(OUT, content, 'utf8');
console.log('已写', OUT);
console.log('合并后子素养总数:', Object.keys(SUB_LITERACIES).length, '（100体系 + 行为补齐', Object.keys(NEW_SUBS).length, '）');
console.log('行为补齐项:', Object.keys(NEW_SUBS).sort().join('、'));
console.log('悬置待核实的子素养名:', HANG_SUBS.length ? HANG_SUBS.join('、') : '(无)');
