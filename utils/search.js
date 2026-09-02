/**
 * 搜索核心逻辑（纯函数，可被页面与测试脚本共用）
 *
 * 1-3 星制行为关键词 → 维度+最小星级 映射（★★★核心/★★显著/★一般）
 */
const BEHAVIOR_KEYWORDS = [
  { words: ['坐不住', '多动', '好动', '静不下来', '乱跑', '坐立不安'], dim: '体素', min: 3 },
  { words: ['爱哭', '脾气大', '情绪化', '敏感', '易怒', '暴躁', '爱发脾气'], dim: '心素', min: 3 },
  { words: ['不爱看书', '学不进去', '不爱学习', '成绩差', '注意力差', '分心'], dim: '智素', min: 3 },
  { words: ['胆小', '不敢说话', '怕人', '内向', '不合群', '社恐', '不爱交流'], dim: '交素', min: 2 },
  { words: ['磨蹭', '拖拉', '懒散', '懒惰', '做事慢', '拖延', '不爱动'], dim: '行素', min: 2 },
  { words: ['不懂事', '不感恩', '叛逆', '顶嘴', '不听话', '自私', '没礼貌'], dim: '灵素', min: 3 },
  { words: ['不爱运动', '体质差', '容易生病', '挑食', '不吃饭'], dim: '体素', min: 2 },
  { words: ['沉迷游戏', '玩手机', '网瘾', '沉迷', '电子设备'], dim: '行素', min: 3 },
  { words: ['说谎', '骗人', '撒谎', '不诚实'], dim: '灵素', min: 3 },
  { words: ['欺负人', '霸凌', '打架', '推人', '打人'], dim: '交素', min: 3 },
];

/**
 * 检测搜索文本是否匹配行为关键词
 * @param {string} searchText
 * @returns {Array<{dim:string,min:number}>}
 */
function detectBehaviorKeywords(searchText) {
  if (!searchText) return [];
  const q = searchText.toLowerCase().replace(/\s+/g, '');
  const results = [];
  for (const rule of BEHAVIOR_KEYWORDS) {
    for (const word of rule.words) {
      if (q.includes(word)) {
        results.push({ dim: rule.dim, min: rule.min });
        break;
      }
    }
  }
  return results;
}

/**
 * 预计算地点可搜索文本（含教育切片内容）
 * @param {object} loc
 * @returns {object} scene 上挂 _searchText
 */
function withSearchText(loc) {
  const name = (loc.n || '') + (loc.d || '') + (loc.c || '');
  const content = (loc.v || '') + (loc.is || []).join('') +
    (loc.slices || []).map(s => (s.title || '') + (s.loc || '') + (s.subs || []).join('') + (s.edu || '')).join('');
  return {
    ...loc,
    _T: name.toLowerCase(),
    _C: content.toLowerCase(),
    _A: (loc.a || '').toLowerCase(),
    _S: (name + content + (loc.a || '')).toLowerCase()
  };
}

/**
 * 拆词：把查询拆成若干 2 字词组（用于模糊召回）
 */
function splitBigrams(q) {
  const out = [];
  if (q.length < 2) return out;
  for (let i = 0; i <= q.length - 2; i++) out.push(q.slice(i, i + 2));
  return out;
}

/**
 * 搜索评分：返回 { pass, score, reason }
 * 优先级：行为关键词(星级条件) > 名称子串 > 类别/区 > 全文本子串 > 拆词词组召回 > 字符覆盖率兜底
 * 目标：提升模糊召回，同时避免 2 字词（如"包头"）全量误出
 */
function scoreFilter(rawQ, loc) {
  const q = rawQ.toLowerCase().replace(/\s+/g, '');            // 去除空白
  const T = loc._T;       // 名称+区+类别
  const C = loc._C;       // 价值/问题/切片/子素养
  const A = loc._A;       // 地址（仅精确子串）
  const name = (loc.n || '').toLowerCase();

  const kw = detectBehaviorKeywords(q);
  if (kw.length > 0) {
    const ok = kw.every(k => loc.stars && loc.stars[k.dim] >= k.min);
    return ok ? { pass: true, score: 1000, reason: 'keyword' } : { pass: false, score: 0, reason: 'keyword' };
  }

  // 1. 名称精确子串（最高）
  if (name.includes(q)) return { pass: true, score: 300, reason: 'name' };
  // 2. 区/类别精确子串
  if (T.includes(q)) return { pass: true, score: 200, reason: 'name' };
  // 3. 地址精确命中（≥4 字，避免"包头"等城市前缀经地址全量命中）
  if (A.includes(q) && q.length >= 4) return { pass: true, score: 150, reason: 'address' };

  // 4. 2 字及以下：仅匹配"名称"精确子串（避免"包头"因区/类别/地址前缀而全量命中）
  if (q.length <= 2) {
    if (name.includes(q)) return { pass: true, score: 120, reason: 'short' };
    return { pass: false, score: 0, reason: 'short' };
  }

  // 5. 内容（切片/子素养）精确子串
  if (C.includes(q)) return { pass: true, score: 130, reason: 'content' };

  // 6. 名称有序子序列模糊命中（容忍缺字/错位，但要求多数字符按序命中）
  //    例如 "包头博" → 包头博物馆；"敕勒川博物馆" 不因公共词"博物馆"而误中"包头博物馆"
  const nameSeq = orderedSeq(q, name);
  if (nameSeq >= 3 && nameSeq / q.length >= 0.6) {
    return { pass: true, score: 110 + nameSeq * 4, reason: 'fuzzy-name' };
  }

  // 7. 名称拆词强命中：至少连续两字词组在名称&类别中出现，且至少命中 2 个不同词组
  const bigrams = splitBigrams(q);
  const tHits = bigrams.filter(b => T.includes(b)).length;
  if (tHits >= 3 && bigrams.length > 2) {
    return { pass: true, score: 90, reason: 'fuzzy-name2' };
  }

  // 8. 内容有序子序列（切片/子素养模糊召回）
  const contentSeq = orderedSeq(q, C);
  if (contentSeq >= 3 && contentSeq / q.length >= 0.6) {
    return { pass: true, score: 60 + contentSeq * 2, reason: 'fuzzy-content' };
  }

  // 9. 覆盖率兜底（基于 T+C，不含地址，抑制地理前缀误出）
  const hay = T + C;
  const present = [...q].filter(ch => hay.includes(ch)).length;
  if (present / q.length >= 0.8) return { pass: true, score: 40, reason: 'cover' };

  return { pass: false, score: 0, reason: 'nomatch' };
}

/**
 * 计算 query 在 target 中的"有序子序列"最长匹配长度（允许跳字）
 */
function orderedSeq(q, target) {
  if (!target) return 0;
  let i = 0;
  for (const ch of target) {
    if (ch === q[i]) { i++; if (i === q.length) break; }
  }
  return i;
}

/**
 * 综合筛选：搜索 + 维度 + 星级 + 问题 + 分类 + 专题 + 学段排序（AND）
 * @param {Array} locations 已带 _searchText 的地点数组
 * @param {object} filter { search, dims, starDims, issues, cats, topics, stage }
 * @returns {Array} 按相关度降序
 */
function getFilteredLocations(locations, filter) {
  const f = filter || { search: '', dims: [], starDims: [], issues: [], cats: [], topics: [], stage: '全部' };
  const hasSearch = !!(f.search && f.search.trim());

  let list;
  if (hasSearch) {
    const q = f.search.trim().toLowerCase();
    list = locations
      .map(loc => ({ loc, sc: scoreFilter(q, loc) }))
      .filter(x => x.sc.pass);
  } else {
    list = locations.map(loc => ({ loc, sc: { pass: true, score: 1000 } }));
  }

  if (f.dims && f.dims.length > 0) list = list.filter(x => f.dims.some(d => x.loc.ad.includes(d)));
  if (f.starDims && f.starDims.length > 0) {
    list = list.filter(x => f.starDims.every(sd => x.loc.stars && x.loc.stars[sd.dim] >= sd.min));
  }
  if (f.issues && f.issues.length > 0) list = list.filter(x => f.issues.some(i => (x.loc.is || []).includes(i)));
  if (f.cats && f.cats.length > 0) list = list.filter(x => f.cats.includes(x.loc.c));

  // 专题分类过滤
  if (f.topics && f.topics.length > 0) {
    list = list.filter(x => {
      if (f.topics.includes('红色研学')) {
        return x.loc.hasRedSlices === true;
      }
      return true;
    });
  }

  // 学段排序：选了学段后，有对应学段切片的点位优先
  if (f.stage && f.stage !== '全部') {
    list = list.map(x => {
      const hasStageSlices = (x.loc.slices || []).some(s => {
        if (f.stage === '小学') return s.age === '6-12岁';
        if (f.stage === '初中') return s.age === '12-15岁';
        if (f.stage === '高中') return s.age === '15-18岁';
        return false;
      });
      return { ...x, sc: { ...x.sc, score: x.sc.score + (hasStageSlices ? 50 : 0) } };
    });
  }

  if (hasSearch || (f.stage && f.stage !== '全部')) list.sort((a, b) => b.sc.score - a.sc.score);
  return list.map(x => x.loc);
}

module.exports = {
  BEHAVIOR_KEYWORDS,
  detectBehaviorKeywords,
  withSearchText,
  scoreFilter,
  getFilteredLocations
};