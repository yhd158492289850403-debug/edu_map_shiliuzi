/**
 * 构建 data/museum_slices.js —— 三大博物馆精细切片库（归一化）
 *
 * 将归档 products/museum/ 下三个不同 schema 的精细切片库，归一化为工作区切片 schema：
 *   { tpl, loc, title, dim, dimKey, subs[], age, stars{六维key}, edu, pre, talk, act, post, seed?, storyLevel?, source, conf }
 *
 * conf 字段标记该切片字段的把握等级：
 *   full   —— 字段齐全且直接映射（包头库）
 *   partial—— 部分字段需推断（敕勒川库：无逐维星级；dimension 是"子素养"非维度，dimKey 由 sub_dim_map 推断）
 *   missing—— 缺失 子素养/维/星级，需外部核实或规则推断（黄河谣库）
 *
 * 用法: node scripts/build_museum_slices.js
 */
const fs = require('fs');
const path = require('path');

const MUSEUM = 'D:/desk/素养导引地图_全量源码归档（永恒）/products/museum';
const OUT = path.resolve(__dirname, '..', 'data', 'museum_slices.js');

// 维度名 -> 六维键
const DIM_KEY = {
  '认知素养': '智素', '价值素养': '灵素', '行动素养': '行素', '情绪素养': '心素', '社交素养': '交素', '身体素养': '体素'
};
const DIM_KEY_SHORT = {
  '认知': '智素', '价值': '灵素', '行动': '行素', '情绪': '心素', '社交': '交素', '身体': '体素'
};

// 六维显示名（用于 dim 字段中文全称）
const DIM_FULL = { '智素': '认知素养', '灵素': '价值素养', '行素': '行动素养', '心素': '情绪素养', '交素': '社交素养', '体素': '身体素养' };

// ---------- 包头博物馆库（slices_v2.json, full 字段） ----------
function normBaotou() {
  const d = JSON.parse(fs.readFileSync(path.join(MUSEUM, '包头博物馆_精细打磨切片库v2/slices_v2.json'), 'utf8'));
  return (d.slices || []).map((s, i) => {
    const stars = {};
    for (const [k, v] of Object.entries(s.star || {})) {
      const kk = DIM_KEY_SHORT[k];
      if (kk) stars[kk] = (v === '★') ? 1 : (v === '★★') ? 2 : (v === '★★★') ? 3 : Number(v) || 0;
    }
    const dimKey = DIM_KEY[s.dim] || '';
    return {
      tpl: false,
      loc: s.location || '',
      title: s.name || '',
      dim: DIM_FULL[dimKey] || s.dim || '',
      dimKey,
      subs: (s.sub || []).slice(),
      age: s.age || '',
      stars,
      edu: s.desc || '',
      pre: s.pre || '',
      talk: s.onway || '',
      act: s.onsite || '',
      post: s.after || '',
      storyLevel: s.story_level || '',
      seed: s.seed || '',
      source: '包头博物馆_精细打磨切片库v2',
      conf: 'full'
    };
  });
}

// ---------- 敕勒川博物馆库（chilechuan_slices.json, partial） ----------
function normChilechuan() {
  const d = JSON.parse(fs.readFileSync(path.join(MUSEUM, '敕勒川博物馆_精细打磨切片库/chilechuan_slices.json'), 'utf8'));
  const STAR_SCORE = { '★★★核心': 3, '★★核心': 3, '★★显著': 2, '★★一般': 2, '★一般': 1, '★': 1 };
  return (d.slices || []).map((s, i) => {
    const subs = (s.sub_literacies || []).slice();
    const leadSub = subs[0] || '';
    // dimension 字段实际是"子素养"名，真正的维由 sub_dim_map[leadSub] 推断
    const dimShort = (s.sub_dim_map && s.sub_dim_map[leadSub]) || '';
    const dimKey = DIM_KEY_SHORT[dimShort] || '';
    // stars：库只有定性"核心/显著/一般"，非逐维；给主导维赋该分，其余留 0（conf=partial 说明）
    const stars = {};
    if (dimKey) {
      const sc = STAR_SCORE[s.stars] || 0;
      stars[dimKey] = sc;
    }
    return {
      id: s.id || ('CL-' + (i + 1)),
      tpl: false,
      loc: s.room || s.location || '',
      title: s.slice_name || s.name || '',
      dim: DIM_FULL[dimKey] || '',
      dimKey,
      subs,
      age: s.age || (s.ages || ''),
      stars,
      edu: s.idea || '',
      pre: s.before || '',
      talk: s.road || '',
      act: s.onsite || '',
      post: s.after || '',
      figure: s.figure || '',
      seed: s.seed || '',
      src: s.source || '',
      subDimMap: s.sub_dim_map || {},
      source: '敕勒川博物馆_精细打磨切片库',
      conf: 'partial'
    };
  });
}

// ---------- 黄河谣工匠博物馆库（missing 字段） ----------
function normHuangheyao() {
  const d = JSON.parse(fs.readFileSync(path.join(MUSEUM, '黄河谣工匠博物馆_精细打磨切片库/黄河谣工匠博物馆_切片数据.json'), 'utf8'));
  return (d.slices || []).map((s) => {
    return {
      id: s.id,
      tpl: false,
      loc: s.exhibit || '',
      title: s.title || '',
      dim: '', dimKey: '', subs: [], age: '', stars: {},
      edu: s.note || '',          // desc 仅"注"，非教育功能
      pre: s.hook || '',
      talk: s.road || '',
      act: s.do || '',
      post: (s.back || '') + ((s.takehome ? '\n带回生活：' + s.takehome : '')),
      storyLevel: s.story_level || '',
      seed: s.seed || '',
      person: s.person || '',
      source: '黄河谣工匠博物馆_精细打磨切片库',
      conf: 'missing'   // 缺 子素养/维/星级
    };
  });
}

const MUSEUMS = {
  '包头博物馆': normBaotou(),
  '敕勒川博物馆': normChilechuan(),
  '黄河谣工匠博物馆': normHuangheyao()
};

const content = `/**
 * 三大博物馆精细切片库（归一化到工作区分片 schema）
 *
 * 数据源：归档 products/museum/ 三个切片库。
 * conf 说明：
 *   full    —— 字段齐全直接映射（包头）
 *   partial —— 缺逐维星级；dimKey 由 sub_dim_map[主导子素养] 推断（敕勒川）
 *   missing —— 缺 子素养/维度/星级，需外部核实后补（黄河谣）
 */
const MUSEUM_SLICES = ${JSON.stringify(MUSEUMS, null, 2)};

module.exports = { MUSEUM_SLICES };
`;

fs.writeFileSync(OUT, content, 'utf8');
console.log('已写', OUT);
for (const [k, v] of Object.entries(MUSEUMS)) console.log(` ${k}: ${v.length} 片`);
