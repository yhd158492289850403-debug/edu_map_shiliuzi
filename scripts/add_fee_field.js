/**
 * 整合 fee（收费/免费）字段到 data/locations.js
 *
 * 数据源：
 *   - 归档 sites_raw.json 的 fee 字段（110/111 有值，多数"免费"）
 *   - 外部核实结果中的具体收费信息（覆盖默认为更精确值）
 * 匹配方式：点位名精确匹配（111/111 全匹配）。
 *
 * 用法: node scripts/add_fee_field.js [--dry-run]
 */
const fs = require('fs');
const path = require('path');
const FILE = path.resolve(__dirname, '..', 'data', 'locations.js');
const ARCHIVE = 'D:/desk/素养导引地图_全量源码归档（永恒）/src/data/sites_raw.json';

const sites = JSON.parse(fs.readFileSync(ARCHIVE, 'utf8'));
const ws = fs.readFileSync(FILE, 'utf8');
const locs = eval(ws.match(/const LOCATIONS = (\[[\s\S]*?\]);/)[1]);
const byName = {};
locs.forEach(l => byName[l.n] = l);

// 外部核实给到的更精确收费（覆盖归档默认）
const FEE_OVERRIDES = {
  '南海湿地景区': '收费（约20-30元/人，4A景区）',
  '北方兵器城': '收费（约50元/人，学生/老人优惠约30元）',
  '敕勒川现代农业产业园': '收费（门市50元/位，活动价约30元）',
  '美岱召博物馆': '收费（门票约28-30元/人，学生/老人半价）',
  '黄河谣工匠博物馆': '收费（园区免费入园，工匠博物馆约50元联票）',
  '包头市科学技术馆': '常设展厅免费；儿童展厅成人10元/人、儿童15元/人',
  '美岱召': '收费（门票约28-30元/人）',
  '劳动公园': '免费（园内动物园另行收费）',
  '敕勒川现代农业产业园': '收费（门市50元/位，活动价约30元）'
};

const baseFee = {};
sites.forEach(s => { baseFee[s.name] = (s.fee || '').trim(); });

let log = [];
const dry = process.argv.includes('--dry-run');
let added = 0, skipEmpty = 0;
for (const l of locs) {
  let fee = FEE_OVERRIDES[l.n] || baseFee[l.n];
  if (!fee) fee = '待确认';
  if (l.fee === fee) { continue; }
  const old = l.fee || '(无)';
  log.push({ name: l.n, old, next: fee });
  if (!dry) { l.fee = fee; added++; } else added++;
}

if (!dry) {
  const header = `/**
 * 地点数据 - 包头市德育心理建设路径
 * 共 ${locs.length} 个点位，${locs.reduce((a,l)=>a+(l.slices||[]).length,0)} 个教育切片
 * fee（收费/免费）来自归档 sites_raw + 外部核实
 */
const LOCATIONS = ${JSON.stringify(locs)};\n\nmodule.exports = { LOCATIONS };\n`;
  fs.writeFileSync(FILE, header, 'utf8');
  console.log('=== 已写入 fee 字段 ===');
} else {
  console.log('=== DRY RUN ===');
}
console.log('更新条数:', log.length);
log.slice(0, 40).forEach(x => console.log('  ' + x.name + ': "' + x.old + '" -> "' + x.next + '"'));
const missingFees = locs.filter(l => !l.fee || l.fee === '待确认').length;
console.log('仍为待确认(无fee信息):', missingFees);
