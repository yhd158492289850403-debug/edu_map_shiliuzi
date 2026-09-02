/**
 * 合并 conf='full' 的博物馆精细切片到 locations.js
 *
 * 说明：仅并入字段完整（conf='full'）的切片，避免破坏详情页渲染（需要 title/dimKey/subs/stars/edu/pre/talk/act/post）。
 * 当前仅"包头博物馆"库为 conf='full'（21 片）；敕勒川(partial)、黄河谣(missing)待字段补齐后再并入。
 * 并入为"追加"（与现有切片无重叠，已校验），更新 sliceCount。
 *
 * 用法: node scripts/merge_museum_full.js [--dry-run]
 */
const fs = require('fs');
const path = require('path');
const FILE = path.resolve(__dirname, '..', 'data', 'locations.js');
const MUSEUM_FILE = path.resolve(__dirname, '..', 'data', 'museum_slices.js');

const ws = fs.readFileSync(FILE, 'utf8');
const locs = eval(ws.match(/const LOCATIONS = (\[[\s\S]*?\]);/)[1]);
const { MUSEUM_SLICES } = require(MUSEUM_FILE);

const dry = process.argv.includes('--dry-run');
const log = [];

for (const [pointName, slices] of Object.entries(MUSEUM_SLICES)) {
  const loc = locs.find(l => l.n === pointName);
  if (!loc) { log.push(`${pointName}: !!未找到点位`); continue; }
  const full = slices.filter(s => s.conf === 'full');
  if (full.length === 0) { log.push(`${pointName}: 无 conf='full' 切片，跳过`); continue; }
  const existing = new Set((loc.slices || []).map(s => s.title));
  const toAdd = full.filter(s => !existing.has(s.title));
  if (toAdd.length === 0) { log.push(`${pointName}: 无新增（全重复）`); continue; }
  // 去掉内部字段 conf/source，保留工作区分片 schema 所需字段
  const addClean = toAdd.map(s => {
    const { conf, source, ...keep } = s;  // eslint-disable-line no-unused-vars
    return { ...keep };
  });
  if (!dry) {
    loc.slices = (loc.slices || []).concat(addClean);
    loc.sliceCount = loc.slices.length;
  }
  log.push(`${pointName}: 追加 ${addClean.length} 片 → 现有 ${(loc.slices||[]).length - (dry?addClean.length:0)} 片 + ${addClean.length} = ${dry? '预览' : loc.slices.length} 片`);
}

// 若未修改位点数，则可写回
let totalSlices = locs.reduce((a, l) => a + (l.slices || []).length, 0);
if (!dry) {
  const header = `/**
 * 地点数据 - 包头市德育心理建设路径
 * 共 ${locs.length} 个点位，${totalSlices} 个教育切片
 * 已并入包头博物馆精细切片库（深度探索版）
 */
const LOCATIONS = ${JSON.stringify(locs)};\n\nmodule.exports = { LOCATIONS };\n`;
  fs.writeFileSync(FILE, header, 'utf8');
  console.log('=== 已写回 locations.js ===');
} else {
  console.log('=== DRY RUN（未写入） ===');
}
log.forEach(x => console.log('  ' + x));
console.log('切片总数(预览):', totalSlices);
