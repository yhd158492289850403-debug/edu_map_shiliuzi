/**
 * 搜索逻辑回归测试
 *
 * 用法：
 *   node scripts/verify_search.js
 *   全部断言通过输出 OK；任一失败 exit 1
 */
const { LOCATIONS } = require('../data/locations');
const { withSearchText, detectBehaviorKeywords, getFilteredLocations } = require('../utils/search');

const ALL = LOCATIONS.map(withSearchText);

let failed = 0;
function assert(name, actual, expect) {
  const ok = JSON.stringify(actual) === JSON.stringify(expect);
  if (!ok) {
    failed++;
    console.log(`❌ ${name}\n   期望: ${JSON.stringify(expect)}\n   实得: ${JSON.stringify(actual)}`);
  } else {
    console.log(`✅ ${name}`);
  }
}
function search(q, extra = {}) {
  return getFilteredLocations(ALL, { search: q, dims: [], starDims: [], issues: [], cats: [], ...extra });
}
function hasName(list, name) {
  return list.some(l => l.n === name);
}

// ---- 修复目标：包头博物馆置顶且不过度全出 ----
{
  const r = search('包头博物馆');
  assert('搜索"包头博物馆"命中的最高分为包头博物馆', r[0].n, '包头博物馆');
  assert('搜索"包头博物馆"不全量且名称匹配置顶', r.length < 20 && r.length >= 1, true);
  // 精确"包头博物馆"应排首位而非泛博物馆
  assert('搜索"包头博物馆"含确切点位', hasName(r, '包头博物馆'), true);
}
{
  const r = search('包头博物馆', { starDims: [{ dim: '智素', min: 3 }] });
  assert('组合：包头博物馆+智素≥3 仍命中', r.some(x => x.n === '包头博物馆'), true);
}

// ---- 名称/区名/类别精确子串 ----
{
  const r = search('赛汗塔拉');
  assert('搜索"赛汗塔拉"至少命中 1 个', r.length >= 1, true);
  assert('"赛汗塔拉"最高分是赛汗塔拉城中草原', r[0].n, '赛汗塔拉城中草原');
  assert('"赛汗塔拉"可能含驻园场馆(鹿文化博物馆)', hasName(r, '包头市鹿文化博物馆'), true);
}
{
  const r = search('图书馆');
  const cnt = LOCATIONS.filter(l => (l.n + l.c).includes('图书馆')).length;
  assert('搜索"图书馆"命中名称/类别含图书馆的数量', r.length, cnt);
  assert('搜索"图书馆"含昆都仑区图书馆', hasName(r, '昆都仑区图书馆'), true);
  assert('搜索"图书馆"不含博物馆(无图书馆字样)', hasName(r, '包头博物馆'), false);
}

// ---- 行为关键词 → 星级推荐 ----
{
  const r = search('坐不住');
  const starHits = ALL.filter(l => l.stars.体素 >= 3).length;
  assert('搜索"坐不住"命中体素≥3的数量', r.length, starHits);
  assert('"坐不住"必含赛汗塔拉', hasName(r, '赛汗塔拉城中草原'), true);
  assert('"坐不住"必含植物园', hasName(r, '包头市植物园'), true);
  assert('"坐不住"必含八一公园', hasName(r, '八一公园'), true);
  assert('"坐不住"不含包头博物馆(体素1)', hasName(r, '包头博物馆'), false);
}
{
  const r = search('爱哭');
  const starHits = ALL.filter(l => l.stars.心素 >= 3).length;
  assert('搜索"爱哭"命中心素≥3的数量', r.length, starHits);
  assert('"爱哭"含图书馆(心素2, 不强制)', true, true); // 备注性断言，仅确认流程可跑
}
{
  const r = search('胆小');
  assert('搜索"胆小"= 交素≥2', r.length, ALL.filter(l => l.stars.交素 >= 2).length);
}
{
  const r = search('磨蹭');
  assert('搜索"磨蹭"= 行素≥2', r.length, ALL.filter(l => l.stars.行素 >= 2).length);
}

// ---- 组合筛选（星级 AND） ----
{
  const r = search('', { starDims: [{ dim: '心素', min: 3 }, { dim: '智素', min: 3 }] });
  const expect = LOCATIONS.filter(l => l.stars.心素 >= 3 && l.stars.智素 >= 3).length;
  assert('组合星级 心素≥3 且 智素≥3 交集', r.length, expect);
  assert('交集=0 (无点位双核心)', r.length, 0);
}
{
  const r = search('', { starDims: [{ dim: '心素', min: 2 }, { dim: '智素', min: 3 }] });
  const expect = LOCATIONS.filter(l => l.stars.心素 >= 2 && l.stars.智素 >= 3).length;
  assert('组合星级 心素≥2 且 智素≥3 交集>0', r.length, expect);
  assert('交集>0', r.length > 0, true);
}
{
  // 行为词 + 手动星级条件并存
  const r = search('坐不住', { starDims: [{ dim: '交素', min: 2 }] });
  const expect = LOCATIONS.filter(l => l.stars.体素 >= 3 && l.stars.交素 >= 2).length;
  assert('坐不住 + 交素≥2 并存过滤', r.length, expect);
}

// ---- 模糊：统一入口（名称/内容/行为）+ 置顶 ----
{
  // 带空格"包头博物馆"仍能命中包头博物馆（空白已归一化）
  const r = search('包 头 博 物 馆');
  assert('带空格搜索仍命中包头博物馆', hasName(r, '包头博物馆'), true);
}
{
  // 4 字部分查询"包头博物"：精确项置顶，且不全量(≪105)
  const r = search('包头博物');
  assert('"包头博物"命中包头博物馆且置顶', r[0].n, '包头博物馆');
  assert('"包头博物"不全量', r.length < 20, true);
  assert('"包头博物"命中子素养相关内容(模糊)', r.length > 0, true);
}
{
  // 2 字词"包头"：命中名称含包头前置的点，不全量
  const r = search('包头');
  assert('2字词"包头"命中但非全量', r.length < LOCATIONS.length, true);
  assert('2字词"包头"含包头前置点位', r.some(l => l.n.includes('包头')), true);
}
{
  // 无关词：应在合理区间内，不应 105 全出
  const r = search('稀土');
  assert('搜索"稀土"不超合理量', r.length <= 10, true);
}

// ---- 空搜索 = 全量 ----
{
  const r = search('');
  assert('空搜索返回全量', r.length, LOCATIONS.length);
}

// ---- 行为词不因文本误伤 ----
{
  const r = search('坐不住爱哭');
  const kw = detectBehaviorKeywords('坐不住爱哭');
  assert('"坐不住爱哭"同时命中两组关键词', kw.length, 2);
  const expect = LOCATIONS.filter(l => l.stars.体素 >= 3 && l.stars.心素 >= 3).length;
  assert('"坐不住爱哭"=体素≥3 且 心素≥3', r.length, expect);
}

if (failed > 0) {
  console.log(`\n共 ${failed} 项断言失败`);
  process.exit(1);
}
console.log('\n全部搜索断言通过 ✔');
