/**
 * 数据更新脚本：根据外部 AI 核实结果回填/修正 locations.js
 *
 * 核实来源：
 *   D:\desk\新建文件夹\素养导引地图_未知项核实结果.md
 *   D:\desk\新建文件夹\locations_js_数据质量检查报告.md
 *
 * 更新类型：
 *   P0 坐标/地址/区字段修正（含内部推算，已注释说明，需再复核）
 *   P0/P1 联系电话(p)、开放时间(h) 回填（取核实文档中"已确证"项）
 *   名称修正（酸的甜 → 全称）
 *
 * 原则：不确定/⚠️ 的数据不回填，保持"待补充"，仅列入待核实清单。
 * 用法: node scripts/apply_verified_updates.js [--dry-run]
 */
const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '..', 'data', 'locations.js');
const src = fs.readFileSync(FILE, 'utf8');
const locs = eval(src.match(/const LOCATIONS = (\[[\s\S]*?\]);/)[1]);
const byName = {};
locs.forEach(l => byName[l.n] = l);

const log = [];
const change = (name, field, old, next, note) => {
  log.push({ name, field, old, next, note });
};
// 实际可安全写入的修改集合
const applied = [];

// ---------- 1. 区(d)/地址(a) 修正（核实文档确认） ----------
const fixes = [
  // {name, d?, a?, lat?, lng?, p?, h?, note}
  { name: '包头市森林公园', d: '青山区', a: '内蒙古自治区包头市青山区建设路与民主路交叉路口', note: 'P0:d/地址修正(原d错误为九原区,地址为青山区建设路辅路)' },
  { name: '石榴花开主题园', d: '青山区', note: 'P0:d修正(原d=昆都仑区,地址明确为青山区劳动公园东南角)' },
  { name: '包头市植物园', a: '内蒙古自治区包头市昆都仑区团结大街与青年路交叉口（阿尔丁植物园）', note: 'P0:地址修正(原错误地写为青山区建设路辅路)' },
  { name: '轻工博物馆', a: '内蒙古自治区包头市青山区建华路19号（包头轻工职业技术学院内）', note: 'P0:地址修正(原仅写青山区,核实在建华路19号)' },
  { name: '酸的甜·粮食醋文化博物馆', note: '名称已补全(酸的甜→全称),保持现状' },
  { name: '套马沟农耕基地', d: '达尔罕茂明安联合旗', note: '多重来源确证：人民日报/包头新闻网/文旅部四季村晚名单,场在达茂旗乌克忽洞镇(原d=固阳县错误)' },
  { name: '包头市科学技术馆', a: '内蒙古自治区包头市九原区建华南路与纬二路交叉口（国际会展中心东侧）', note: '官网精确地址' }
];

// ---------- 2. 电话/开放时间 回填（核实文档已确证项） ----------
// p/h 字段：只回填"已确证/参考值"；未查到/⚠️ 一律跳过保持待补充
const ph = [
  { name: '包头博物馆', p: '0472-5317616', h: '夏季：周二至周日9:00-17:00（16:30停止入馆）；冬季：周二至周日9:30-16:30；周一闭馆；需预约' },
  { name: '包头市图书馆', p: '0472-5218900', h: '主馆：周一14:30-18:30，周二至周日8:30-17:30' },
  { name: '黄河谣工匠博物馆', p: '13296935625', h: '09:00-19:00（18:30停止入园）', note: '园区团队为黄河谣文化旅游区电话' },
  { name: '包头市科学技术馆', p: '0472-5235911', h: '周三至周五9:00-17:00（中午不闭馆）；周六日及法定节假日延长；周一、周二闭馆', note: '电话为官网团体预约/对接' },
  { name: '北方兵器城', p: '0472-3303120', h: '08:00-19:00（18:30停止入园）' },
  { name: '赛汗塔拉城中草原', p: '0472-5135028', h: '全天24小时开放' },
  { name: '南海湿地景区', p: '0472-4603774', h: '08:00-21:00（夏季）；08:30-18:30（冬季参考）' },
  { name: '八一公园', p: '0472-2125264', h: '全年全天开放' },
  { name: '劳动公园', p: '0472-3135943', h: '全年全天开放（园内动物园另行收费）' },
  { name: '兵工路带状公园', h: '全年全天开放' },
  { name: '包头美术馆', p: '0472-5317853', h: '09:00-17:00（16:30停止入园）' },
  { name: '昆都仑区图书馆', p: '0472-5990534', h: '自习室营业至20:00' },
  { name: '九原区图书馆', p: '0472-7148653', h: '自习室营业至20:30' },
  { name: '东河区图书馆', p: '0472-6862738', h: '自习室营业至20:00' },
  { name: '青山区图书馆', h: '早8:40-晚17:30，周一下午闭馆；自习室8:30-19:00' },
  { name: '包头黄河国家文化公园博物馆', p: '15598319837', h: '春夏：周二至周五9:30-12:00、14:00-17:30；周末及节假日9:00-18:00；周一闭馆；闭馆前30分钟停止进馆；需预约', note: '电话为园区电话' },
  { name: '包头市国防动员博物馆', h: '每周三、周五：9:00-11:30、15:00-17:30；法定节假日除外；需预约' },
  { name: '王若飞纪念馆', p: '0472-4169335', h: '09:00-11:30、14:30-17:30' },
  { name: '敕勒川现代农业产业园', h: '09:00-18:00', note: '电话未查到' },
  { name: '套马沟农耕基地', p: '15848222817', note: '套马沟农庄电话' },
  { name: '包头市青少年活动中心(原昆区少年宫)', p: '0472-2100742' },
  { name: '包钢少年宫', p: '0472-2146081' },
  { name: '包头市中小学综合实践教育中心', p: '0472-5881747', h: '周一至周五 08:30-17:30（团体预约为主）' },
  { name: '内蒙古根雕博物馆', a: '内蒙古自治区包头市土默特右旗', note: '坐标存疑见质检报告P1,地址仅到旗级' },
];

// ---------- 3. 坐标修正（内部推算,标注待复核） ----------
// 说明：核实文档确认 植物园=森林公园 同坐标 与 轻工 坐标 均错误，但未给出精确数值。
// 网络受限无法联网取精确经纬度，故按"区分区/避免同址"原则做市级精度拆分，均标注为内部推算，需再 geocode。
const coordFixes = [
  // 阿尔丁植物园在昆都仑区(团结大街/青年路)，位于城区中西部，与青山区(东)分开
  { name: '包头市植物园', lat: 40.6620, lng: 109.8400, note: '坐标【内部推算】，地址=昆都仑区团结大街与青年路交叉口(阿尔丁植物园)；原与森林公园同坐标，需再精确定位' },
  // 轻工职业技术学院(建华路19号)在青山区，偏北
  { name: '轻工博物馆', lat: 40.6640, lng: 109.8790, note: '坐标【内部推算】，地址=青山区建华路19号；原与青山区图书馆同坐标，需再精确定位' },
];

// ---------- 应用 ----------
let dry = process.argv.includes('--dry-run');

function setField(l, field, val, note) {
  if (l[field] === val) return false;
  const old = l[field];
  l[field] = val;
  change(l.n, field, old, val, note || '');
  return true;
}
function setName(l, val) {
  const old = l.n;
  l.n = val;
  change(old, 'n', old, val, '名称补全');
}

// 1. d/a/n 修正
for (const f of fixes) {
  const l = byName[f.name];
  if (!l) { log.push({ name: f.name, note: '!!未找到点位，跳过' }); continue; }
  if (f.d && setField(l, 'd', f.d)) {}
  if (f.a && setField(l, 'a', f.a, f.note)) {}
  if (f.n2 && l.n !== f.n2) setName(l, f.n2);
}

// 2. p/h 回填
for (const f of ph) {
  const l = byName[f.name];
  if (!l) { log.push({ name: f.name, note: '!!未找到点位，跳过' }); continue; }
  if (f.p && setField(l, 'p', f.p, f.note)) {}
  if (f.h && setField(l, 'h', f.h, f.note)) {}
}

// 3. 坐标修正（内部推算）
for (const f of coordFixes) {
  const l = byName[f.name];
  if (!l) { log.push({ name: f.name, note: '!!未找到点位，跳过' }); continue; }
  setField(l, 'lat', f.lat, f.note);
  setField(l, 'lng', f.lng, f.note);
}

// ---------- 输出 ----------
if (dry) {
  console.log('=== DRY RUN 预览（未写入） ===');
} else {
  const header = `/**
 * 地点数据 - 包头市德育心理建设路径
 * 共 ${locs.length} 个点位
 * 教育与切片数据见各点 slices。
 * 更新时间：${new Date().toLocaleString('zh-CN')}（依据外部核实结果回填电话/开放时间；部分坐标为内部推算待复核）
 */
\nconst LOCATIONS = ${JSON.stringify(locs)};\n\nmodule.exports = { LOCATIONS };\n`;
  fs.writeFileSync(FILE, header, 'utf8');
  console.log('=== 已写入 locations.js ===');
}
let changed = 0;
for (const c of log) { if (c.note || c.field) { changed++; } }
console.log('变更条目数:', changed);
log.forEach(c => console.log(
  c.field ? `  [${c.name}] ${c.field}: ${c.old} -> ${c.next}  (${c.note})` : `  [${c.name}] ${c.note}`
));
console.log('总点位数:', locs.length);
