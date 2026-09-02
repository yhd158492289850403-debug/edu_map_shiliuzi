/**
 * 端到端回归：数据完整性 + 筛选交互 + 关键示例点（Task 7）
 *
 * 用法：node scripts/verify_e2e.js
 */
const { LOCATIONS } = require('../data/locations');
const { DIM_ORDER } = require('../data/dimensions');
const { withSearchText, getFilteredLocations } = require('../utils/search');

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
function filtered(over = {}) {
  return getFilteredLocations(ALL, {
    search: '', dims: [], starDims: [], issues: [], cats: [], ...over
  });
}

// ===== 数据完整性 =====
{
  assert('共 111 个点位', LOCATIONS.length, 111);
  const ids = LOCATIONS.map(l => l.id).sort((a, b) => a - b);
  assert('id 唯一且连续 1-111', ids.every((v, i) => v === i + 1), true);
  const names = LOCATIONS.map(l => l.n);
  assert('无重名', new Set(names).size, names.length);
  // 六维星级 ∈ {1,2,3}
  const badStars = LOCATIONS.filter(l => DIM_ORDER.some(d => ![1, 2, 3].includes(l.stars[d])));
  assert('所有点位六维星级 ∈ [1,3]', badStars.length, 0);
  // sliceCount 与实际 slices 一致
  const badCount = LOCATIONS.filter(l => l.sliceCount !== (l.slices || []).length);
  assert('sliceCount 与 slices 长度一致', badCount.length, 0);
  // 切片总数 480（459 基础 + 21 包头博物馆精细切片库并入）
  assert('切片总数 480', LOCATIONS.reduce((s, l) => s + (l.slices || []).length, 0), 480);
  // 6 个新点位存在且含切片
  const NEW = ['王老太太故居', '包头市中小学综合实践教育中心', '秦长城国家文化公园', '战国赵北长城遗址公园', '敕勒川现代农业产业园', '赵长城遗址胡服骑射广场'];
  for (const n of NEW) {
    const l = LOCATIONS.find(x => x.n === n);
    assert(`新点位存在: ${n}`, !!l && !!l.slices && l.slices.length > 0, true);
  }
  const allHaveLatLng = LOCATIONS.every(l => typeof l.lat === 'number' && typeof l.lng === 'number');
  assert('所有点位有坐标', allHaveLatLng, true);
  const allCat = LOCATIONS.every(l => typeof l.c === 'string' && l.c.length > 0);
  assert('所有点位有分类 c', allCat, true);
}

// ===== 筛选交互 =====
{
  // 模式一：价值素养≥★★★
  const m1 = filtered({ starDims: [{ dim: '灵素', min: 3 }] });
  assert('模式一 灵素≥3 = 数据自洽', m1.length, LOCATIONS.filter(l => l.stars.灵素 >= 3).length);
  assert('模式一 数量>0', m1.length > 0, true);
  // 模式二：交集 AND
  const m2 = filtered({ starDims: [{ dim: '心素', min: 2 }, { dim: '智素', min: 3 }] });
  assert('模式二 交集 AND', m2.length, LOCATIONS.filter(l => l.stars.心素 >= 2 && l.stars.智素 >= 3).length);
  // 分类筛选
  const cats = [...new Set(LOCATIONS.map(l => l.c))];
  assert('分类总数 11', cats.length, 11);
  const m3 = filtered({ cats: ['自然生态公园'] });
  assert('分类筛选=自然生态公园', m3.length, LOCATIONS.filter(l => l.c === '自然生态公园').length);
  // 问题筛选
  const m4 = filtered({ issues: ['坐不住'] });
  assert('问题筛选=坐不住', m4.length, LOCATIONS.filter(l => (l.is || []).includes('坐不住')).length);
  // 空筛选 = 全量
  assert('空筛选=全量', filtered().length, 111);
}

// ===== 关键示例点 =====
{
  const saihan = LOCATIONS.find(l => l.n === '赛汗塔拉城中草原');
  assert('赛汗塔拉 体素=3', saihan && saihan.stars.体素, 3);
  const bm = LOCATIONS.find(l => l.n === '包头博物馆');
  assert('包头博物馆 智素=3', bm && bm.stars.智素, 3);
  assert('包头博物馆 灵素=3', bm && bm.stars.灵素, 3);
  assert('包头博物馆 切片 34', bm && bm.sliceCount, 34);
  const whg = LOCATIONS.find(l => l.n === '王老太太故居');
  assert('王老太太故居 切片 8', whg && whg.sliceCount, 8);
  // 标杆/模板 ver 标记只取两种
  const vers = new Set(LOCATIONS.map(l => l.ver)); 
  assert('ver ∈ {标杆,模板}', [...vers].sort().join(','), '模板,标杆'.split(',').sort().join(','));
}

if (failed > 0) {
  console.log(`\n共 ${failed} 项断言失败`);
  process.exit(1);
}
console.log('\n端到端回归全部通过 ✔');