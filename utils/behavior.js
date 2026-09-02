/**
 * 行为 → 子素养 → 对症切片教案 推荐逻辑（纯函数）
 *
 * 完整链路：
 *   家长输入一个"行为"（顶嘴/磨蹭/怕黑…）
 *   → 匹配 data/behaviors.js 的 BEHAVIORS（含别名）
 *   → 得到该行为对应的子素养集合 subs
 *   → 在 data/locations.js 的 480 个切片中，找出 subs 重叠且星级较高者作为"对症切片教案"
 *   → 每个切片带所属点位名 + 四段教案（pre/talk/act/post），供展示与点进详情页。
 *
 * 参考：
 *   - BEHAVIORS 来自归档 behavior_map_extended + behavior_slice_index_extended
 *   - 完整教案来自工作区 locations.js 的 slices（比归档行为切片多了 edu/pre/talk/act/post）
 */
const { LOCATIONS } = require('../data/locations');
const { BEHAVIORS } = require('../data/behaviors');

// 归一化文本：去空白、大写、标点
function normText(s) {
  return (s || '').replace(/\s+/g, '').toLowerCase();
}

/**
 * 匹配行为：输入文本中命中的行为名
 * 命中优先级：精确等于 > 名称出现在文本 > 别名出现在文本
 * @returns {Array<{name, score, reason}>}
 */
function matchBehaviors(text) {
  const q = normText(text);
  if (!q) return [];
  const hits = [];
  const names = Object.keys(BEHAVIORS);
  // 1 精确命中
  for (const n of names) {
    if (normText(n) === q) { hits.push({ name: n, score: 1000, reason: 'exact' }); }
  }
  // 2 行为名作为子串
  for (const n of names) {
    if (hits.some(h => h.name === n)) continue;
    if (q.includes(normText(n))) { hits.push({ name: n, score: 200, reason: 'name' }); }
  }
  // 3 别名命中
  for (const n of names) {
    if (hits.some(h => h.name === n)) continue;
    const aliases = BEHAVIORS[n].aliases || [];
    if (aliases.some(a => q.includes(normText(a)))) { hits.push({ name: n, score: 100, reason: 'alias' }); }
  }
  // 若没有任何命中，尝试把整体文本当作单个行为名精确匹配（宽松）
  return hits.sort((a, b) => b.score - a.score);
}

/**
 * 列出行为目标子素养（含别名展开）
 */
function behaviorSubs(name) {
  const b = BEHAVIORS[name];
  return (b && b.subs) || [];
}

/**
 * 推荐：输入行为文本 -> 对症切片教案列表
 * @param {string} text 行为文本
 * @param {object} opts { owner: 'behavior'|'sub', minN? , limit? }
 * @returns {Array<{behavior, subs, matchedSlices}>}
 */
function recommend(text, opts = {}) {
  const limit = opts.limit || 6;
  const q = normText(text);
  if (!q) return [];   // 无关键词 => 不推荐，避免误命中
  const matched = matchBehaviors(text);
  if (matched.length === 0) {
    // 退而求其次：把整个输入当作子素养名直接匹配
    return recommendBySubLiteracy(text, limit);
  }
  return matched.map(m => {
    const targetSubs = behaviorSubs(m.name);
    // 在全部点位切片中找 subs 与目标子素养重叠者，按重叠数 + 星级排序
    const matchedSlices = [];
    for (const loc of LOCATIONS) {
      for (const s of (loc.slices || [])) {
        const overlap = (s.subs || []).filter(x => targetSubs.includes(x));
        if (overlap.length === 0) continue;
        const maxStar = Math.max(0, ...(Object.values(s.stars || {}).map(Number)));
        matchedSlices.push({
          pointId: loc.id,
          point: loc.n,
          loc: s.loc,
          title: s.title,
          subs: s.subs || [],
          overlap,
          age: s.age,
          starTxt: starLine(s.stars),
          edu: s.edu,
          pre: s.pre,
          talk: s.talk,
          act: s.act,
          post: s.post,
          score: overlap.length * 100 + (maxStar || 0) * 5
        });
      }
    }
    matchedSlices.sort((a, b) => b.score - a.score);
    return {
      behavior: m.name,
      scene: BEHAVIORS[m.name].scene || '',
      guide: BEHAVIORS[m.name].guide || '',
      subs: targetSubs,
      matchedSlices: matchedSlices.slice(0, limit)
    };
  });
}

/**
 * 直接按子素养名/关键字匹配切片（当行为未命中或用户输入的是子素养名时）
 */
function recommendBySubLiteracy(text, limit = 6) {
  const q = normText(text);
  if (!q || q.length < 2) return [];   // 太短/空则不当子素养匹配
  const slices = [];
  for (const loc of LOCATIONS) {
    for (const s of (loc.slices || [])) {
      const subsText = normText((s.subs || []).join(''));
      // 子素养名精确包含 or 文本包含某子素养名
      const hit = subsText.includes(q) || (s.subs || []).some(x => q.includes(normText(x)));
      if (hit) {
        const maxStar = Math.max(0, ...(Object.values(s.stars || {}).map(Number)));
        slices.push({
          pointId: loc.id, point: loc.n, loc: s.loc, title: s.title,
          subs: s.subs || [], age: s.age, starTxt: starLine(s.stars),
          edu: s.edu, pre: s.pre, talk: s.talk, act: s.act, post: s.post,
          score: maxStar || 0
        });
      }
    }
  }
  slices.sort((a, b) => b.score - a.score);
  return slices.slice(0, limit);
}

/**
 * 六维星级 → 星串（仅展示非零）
 */
function starLine(stars) {
  if (!stars) return '';
  const DIM_ORDER = ['体素', '心素', '灵素', '智素', '行素', '交素'];
  return DIM_ORDER.filter(d => (stars[d] || 0) > 0).map(d => `${d}${'★'.repeat(stars[d])}`).join(' ');
}

module.exports = {
  normText,
  matchBehaviors,
  behaviorSubs,
  recommend,
  recommendBySubLiteracy,
  starLine
};
