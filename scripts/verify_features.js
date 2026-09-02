/**
 * 功能回归测试：behavior 寻课 + geo 距离 + fee/星级数据完整性
 * 用法: node scripts/verify_features.js
 */
const { LOCATIONS } = require('../data/locations');
const { SUB_LITERACIES, SYNONYM, SUB_TOTAL } = require('../data/sub_literacies');
const { BEHAVIORS, BEHAVIOR_TOTAL } = require('../data/behaviors');
const behavior = require('../utils/behavior');
const geo = require('../utils/geo');

let pass = 0, fail = 0;
function assert(label, cond, extra) {
  if (cond) { pass++; console.log('✅', label); }
  else { fail++; console.log('❌', label, extra || ''); }
}

// 1. 数据规模
assert('点位111', LOCATIONS.length === 111);
const totalSlices = LOCATIONS.reduce((a, l) => a + (l.slices || []).length, 0);
assert('切片480', totalSlices === 480);
assert('行为116', BEHAVIOR_TOTAL === 116);
assert('子素养115', SUB_TOTAL === 115);

// 2. fee 覆盖
const feeCnt = LOCATIONS.filter(l => l.fee && l.fee !== '待确认').length;
assert('fee覆盖≥110', feeCnt >= 110, `实际 ${feeCnt}`);

// 3. 拼音点级星级齐全
const noStar = LOCATIONS.filter(l => !l.stars || Object.keys(l.stars).length === 0);
assert('全部点位有星级', noStar.length === 0);

// 4. behavior 寻课
const r1 = behavior.recommend('顶嘴');
assert('顶嘴→1条行为', r1.length === 1);
assert('顶嘴→含对症切片', r1[0] && r1[0].matchedSlices.length > 0);
const r2 = behavior.recommend('磨蹭');
assert('磨蹭→匹配并给出切片', r2.length > 0 && r2[0].matchedSlices.length > 0);
assert('空查询→不误命中', behavior.recommend('').length === 0);
// 别名
const m = behavior.matchBehaviors('拖拉');
assert('拖拉→含磨蹭别名', m.some(x => x.name === '磨蹭'));

// 5. 子素养可解析（行为引用的子素养名都在体系或同义词表）
let unResolvable = 0;
for (const b of Object.values(BEHAVIORS)) {
  for (const s of b.subs) {
    if (!SUB_LITERACIES[s] && !SYNONYM[s]) unResolvable++;
  }
}
assert('行为子素养全部可解析', unResolvable === 0, `未解析 ${unResolvable}`);

// 6. geo
const d = geo.distKm(40.66, 109.88, 40.66, 109.88);
assert('同点距离=0', d === 0);
const d2 = geo.distKm(40.66, 109.88, 40.64, 109.83);
assert('跨约5km合理', d2 > 3 && d2 < 8, `实际 ${d2.toFixed(2)}`);

// 7. 坐标无重复(修复后 植物园/森林公园 已分)
const pg = LOCATIONS.find(l => l.n === '包头市植物园');
const sl = LOCATIONS.find(l => l.n === '包头市森林公园');
assert('植物园/森林公园坐标已分离', pg.lat !== sl.lat || pg.lng !== sl.lng);

// 8. 星级筛选可用(存在六维星级结构)
const hasRatio = LOCATIONS.find(l => l.stars && Object.values(l.stars).some(v => v >= 3));
assert('存在≥3星点位', !!hasRatio);

console.log(`\n测试结果：${pass} 通过，${fail} 失败`);
process.exit(fail === 0 ? 0 : 1);
