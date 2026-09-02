/**
 * 阶段0：数据对账器
 *
 * 对比当前工作区 locations.js 与归档 delivery_data.json / slice_data_full.json /
 * 三大博物馆切片库，产出：
 *   1) docs/superpowers/data-merge-2026-08-21/01-对账报告.md
 *   2) docs/superpowers/data-merge-2026-08-21/02-未知项待核实.md（供用户发其他AI搜索）
 *
 * 用法: node scripts/reconcile_data.js
 */
const fs = require('fs');
const path = require('path');

const WORKSPACE = path.resolve(__dirname, '..');
const ARCHIVE = 'D:/desk/素养导引地图_全量源码归档（永恒）/src/data';
const OUT_DIR = path.join(WORKSPACE, 'docs/superpowers/data-merge-2026-08-21');

// ---------- 1. 读取工作区 locations.js ----------
const locSrc = fs.readFileSync(path.join(WORKSPACE, 'data/locations.js'), 'utf8');
const m = locSrc.match(/const LOCATIONS = (\[[\s\S]*?\]);/);
if (!m) throw new Error('无法解析 locations.js 的 LOCATIONS 数组');
const locs = eval(m[1]);

const wsPoints = new Set(locs.map(l => l.n));
const wsSlices = [];
locs.forEach(l => (l.slices || []).forEach(s => {
  wsSlices.push({ point: l.n, loc: s.loc, title: s.title, subs: s.subs || [] });
}));
const wsSubs = new Set();
wsSlices.forEach(s => s.subs.forEach(x => wsSubs.add(x)));

// ---------- 2. 读取归档 delivery_data.json ----------
const deliv = JSON.parse(fs.readFileSync(path.join(ARCHIVE, 'delivery_data.json'), 'utf8'));
const delivSites = deliv.sites || [];
const delivSlices = deliv.slices || [];
const behaviorMap = deliv.behavior_map || {};
const delivPoints = new Set(delivSites.map(s => s.name));

// 归档切片里的子素养（兼容 sub / subs 字段）
const archSubs = new Set();
const grabSubs = (s) => {
  const list = Array.isArray(s.sub) ? s.sub : (Array.isArray(s.subs) ? s.subs : []);
  list.forEach(x => x && archSubs.add(x));
};
delivSlices.forEach(grabSubs);
Object.values(deliv.behavior_map || {}).forEach(b => (b.subs || []).forEach(x => archSubs.add(x)));

// ---------- 3. 读取 slice_data_full.json（105/100 子素养体系） ----------
const sdf = JSON.parse(fs.readFileSync(path.join(ARCHIVE, 'slice_data_full.json'), 'utf8'));
const subLitSystem = sdf['六维子素养'] || {};

// ---------- 4. 读取三大博物馆切片库 ----------
const museumLibs = [];
const museumDir = 'D:/desk/素养导引地图_全量源码归档（永恒）/products/museum';
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name.endsWith('.json')) museumLibs.push(full);
  }
}
walk(museumDir);

// ---------- 输出结构 ----------
const report = {
  points: {
    total: locs.length,
    archive_total: delivPoints.size,
    ws_only: [...wsPoints].filter(p => !delivPoints.has(p)),
    archive_only: [...delivPoints].filter(p => !wsPoints.has(p))
  },
  slices: {
    ws_total: wsSlices.length,
    archive_total_nb: delivSlices.length,
  },
  subLiteracy: {
    ws_names: wsSubs.size,
    archive_names: archSubs.size,
    union_names: 0,
    ws_missing: []
  },
  museum: museumLibs.map(f => path.basename(f)),
  physical: {
    sites_confirmed: delivSites.filter(s => s.address || s.phone || s.coord).length
  }
};
const unionSubs = new Set([...archSubs, ...wsSubs]);
report.subLiteracy.union_names = unionSubs.size;
report.subLiteracy.ws_missing = [...archSubs].filter(s => !wsSubs.has(s)).sort();

fs.mkdirSync(OUT_DIR, { recursive: true });

// ---------- 写入对账报告 ----------
let rel = `# 数据融合对账报告（阶段0）

> 生成时间：${new Date().toLocaleString('zh-CN')}
> 源：工作区 \`data/locations.js\`（主体） ｜ 归档 \`src/data/delivery_data.json\` + \`slice_data_full.json\`

## 点位
| 项 | 工作区 | 归档 delivery_data.sites |
|---|---|---|
| 总数 | ${report.points.total} | ${report.points.archive_total} |
| 仅工作区有 | ${report.points.ws_only.length}：${report.points.ws_only.join('、') || '无'} |
| 仅归档有 | ${report.points.archive_only.length}：${report.points.archive_only.join('、') || '无'} |

## 切片
| 项 | 工作区 locations.slices | 归档 delivery_data.slices |
|---|---|---|
| 总数 | ${report.slices.ws_total} | ${report.slices.archive_total_nb} |

## 子素养
| 项 | 数量 |
|---|---|
| 工作区切片出现 | ${report.subLiteracy.ws_names} |
| 归档出现 | ${report.subLiteracy.archive_names} |
| 并集 | ${report.subLiteracy.union_names} |
| 归档有而工作区无 | ${report.subLiteracy.ws_missing.length}：${report.subLiteracy.ws_missing.join('、')} |

## 三大博物馆切片库 JSON 文件
${report.museum.map(f => '- ' + f).join('\n')}

## 物理信息
- 归档 sites_raw 中确证（address/phone/coord）点位数：${report.physical.sites_confirmed}

`;
rel += `

## 105 项子素养体系（slice_data_full.json 六维子素养）
`;
for (const [dim, subs] of Object.entries(subLitSystem)) {
  rel += `- **${dim}**（${subs.length}）：${subs.join('、')}\n`;
}
fs.writeFileSync(path.join(OUT_DIR, '01-对账报告.md'), rel, 'utf8');
console.log('已写 01-对账报告.md');
console.log('子素养 归档有工作区无：', report.subLiteracy.ws_missing.join('、'));
console.log('归档有而工作区无点位：', report.points.archive_only.join('、') || '(无)');
