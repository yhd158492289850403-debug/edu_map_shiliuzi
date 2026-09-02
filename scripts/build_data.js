/**
 * 构建 data/locations.js — 111 点位 + 459 教育切片 + 1-3 星体系
 *
 * 数据源：
 *   - scripts/input/docx_lines.txt  《素养导引地图_111点位切片全量库.docx》的逐段文本提取
 *   - data/locations.js            现有 105 条基础数据（物理字段/坐标/ld md ad 等）
 *
 * 用法：
 *   node scripts/build_data.mjs [--out data/locations.js] [--json] 
 *   --json 时输出校验断言报告到 stdout
 *   默认直接覆盖写入 data/locations.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INPUT = path.join(__dirname, 'input', 'docx_lines.txt');
const OUT = process.argv.includes('--out')
  ? path.join(ROOT, process.argv[process.argv.indexOf('--out') + 1])
  : path.join(ROOT, 'data', 'locations.js');

// ============ 1. 解析 docx 文本行 → 切片 ============
const DIM_MAP = { '价值素养': '灵素', '认知素养': '智素', '行动素养': '行素', '情绪素养': '心素', '身体素养': '体素', '社交素养': '交素' };
const STAR_DIM_KEY = { '价': '灵素', '知': '智素', '行': '行素', '情': '心素', '身': '体素', '社': '交素' };

function parseSlices(lines) {
  const slices = [];
  let i = 0;
  const SLICE_RE = /^【(标杆精细版|模板生成版)】\s*(.+?)(?:\s*·\s*|\s+-\s+)(.+?)\s*→\s*「(.+?)」$/;
  const META_RE = /^维度\s+(\S+)\s*｜\s*子素养\s+(.+?)\s*｜\s*适龄\s+(\S+?)\s*｜\s*星级\s+(.+)$/;
  const STAR_RE = /([价知行情身社])(★*)/g;
  while (i < lines.length) {
    const line = lines[i].trim();
    const m = line.match(SLICE_RE);
    if (!m) { i++; continue; }
    const [, type, point, loc, title] = m;
    const slice = { type, point: point.trim(), loc: loc.trim(), title: title.trim() };
    i++;
    while (i < lines.length && !/^【(标杆精细版|模板生成版)】/.test(lines[i].trim())) {
      const t = lines[i].trim();
      if (t.startsWith('维度 ')) {
        const pm = t.match(META_RE);
        if (pm) {
          slice.dim = pm[1].trim();
          slice.dimKey = DIM_MAP[slice.dim] || slice.dim;
          slice.subs = pm[2].trim();
          slice.age = pm[3].trim();
          slice.starsText = pm[4].trim();
          const s = {};
          let rm;
          STAR_RE.lastIndex = 0;
          while ((rm = STAR_RE.exec(slice.starsText)) !== null) {
            s[STAR_DIM_KEY[rm[1]]] = rm[2].length || 1;
          }
          slice.stars = s;
        }
      } else if (t.startsWith('教育功能：')) slice.edu = t.slice('教育功能：'.length).trim();
      else if (t.startsWith('行前准备：')) slice.pre = t.slice('行前准备：'.length).trim();
      else if (t.startsWith('路上话术：')) slice.talk = t.slice('路上话术：'.length).trim();
      else if (t.startsWith('到馆做法：')) slice.act = t.slice('到馆做法：'.length).trim();
      else if (t.startsWith('返程复盘：')) slice.post = t.slice('返程复盘：'.length).trim();
      i++;
    }
    slices.push(slice);
  }
  const bad = slices.filter(s => !s.dim || !s.subs || !s.age || !s.starsText || !s.edu || !s.pre || !s.talk || !s.act || !s.post);
  if (bad.length) throw new Error(`切片字段缺失 ${bad.length}: ${bad[0]?.point}/${bad[0]?.title}`);
  return slices;
}

// ============ 2. 类型分配 ============
// 模板切片的 loc 组合 → 场地类型（12 类点位类型中的 11 个场地类型）
const COMBO_TO_TYPE = {
  '主干步道/绿道 + 环保/文明宣传区 + 自然观察区': '自然生态公园',
  '主题展厅·家国/英烈展区 + 公共空间·漫步观察 + 常设展厅·核心展区 + 社教活动区': '综合文化场馆',
  '主展厅/陈列区 + 人物/故事展区 + 历史脉络展区 + 纪念/缅怀空间': '红色纪念场馆',
  '书房公约/自主管理 + 亲子/分享活动 + 阅读/活动区': '城市书房',
  '体育训练场 + 心理/成长课堂 + 科技/创客活动室 + 艺术/表演课堂': '青少年活动中心',
  '文化讲堂/展览 + 群众文艺/排练观摩 + 非遗/民俗文化展区': '群众文化馆',
  '主展区/活动区 + 主题教育/科普区 + 互动/体验区': '社区成长空间',
  '绘本/少儿活动区 + 自主服务区 + 读者活动/沙龙 + 阅览区': '公共图书馆',
  '公共安全/应急展区 + 创客/动手区 + 常设展厅·基础科学 + 科技创新/地方产业展区': '科技科普场馆',
  '团队/拓展项目 + 科技/探究活动区 + 综合实践/劳动教育区': '综合实践基地',
  '环保行动区 + 生态/农耕体验区 + 自然观察/步道': '生态农耕体验',
};

// 标杆点位（手工精细切片）→ 所属场地类型
const BENCHMARK_TYPE = {
  '包头博物馆': '综合文化场馆',
  '包头市科学技术馆': '科技科普场馆',
  '包钢工业旅游区': '科技科普场馆',
  '黄河谣工匠博物馆': '综合文化场馆',
  '草原英雄小姐妹事迹展览馆': '红色纪念场馆',
  '包头市图书馆': '公共图书馆',
  '包头市未成年人心理辅导站': '社区成长空间',
  '赛汗塔拉城中草原': '自然生态公园',
  '北方兵器城': '科技科普场馆',
  '包头美术馆': '综合文化场馆',
  '南海湿地景区': '自然生态公园',
  '包头召革命纪念馆': '红色纪念场馆',
  '包头文学馆': '综合文化场馆',
  '包头市少年宫(总部)': '青少年活动中心',
  '王老太太故居': '红色纪念场馆',
};

// 12 类点位类型基础星级（1-3 星，六维顺序 体/心/灵/智/行/交）
const TYPE_BASE_STARS = {
  '自然生态公园':   { 体素: 3, 心素: 1, 灵素: 2, 智素: 2, 行素: 2, 交素: 1 },
  '综合文化场馆':   { 体素: 1, 心素: 2, 灵素: 3, 智素: 3, 行素: 2, 交素: 2 },
  '红色纪念场馆':   { 体素: 1, 心素: 3, 灵素: 3, 智素: 2, 行素: 2, 交素: 2 },
  '城市书房':       { 体素: 1, 心素: 1, 灵素: 2, 智素: 3, 行素: 1, 交素: 2 },
  '青少年活动中心': { 体素: 3, 心素: 2, 灵素: 2, 智素: 2, 行素: 3, 交素: 3 },
  '群众文化馆':     { 体素: 2, 心素: 2, 灵素: 2, 智素: 2, 行素: 2, 交素: 3 },
  '社区成长空间':   { 体素: 1, 心素: 3, 灵素: 2, 智素: 2, 行素: 2, 交素: 3 },
  '公共图书馆':     { 体素: 1, 心素: 2, 灵素: 2, 智素: 3, 行素: 2, 交素: 2 },
  '科技科普场馆':   { 体素: 1, 心素: 2, 灵素: 2, 智素: 3, 行素: 3, 交素: 1 },
  '综合实践基地':   { 体素: 2, 心素: 1, 灵素: 2, 智素: 3, 行素: 3, 交素: 2 },
  '生态农耕体验':   { 体素: 3, 心素: 1, 灵素: 2, 智素: 2, 行素: 3, 交素: 1 },
};

// 类型 → ld/md/ad（仅用于新建点位）
const TYPE_DIMS = {
  '自然生态公园':   { ld: '体素', md: ['行素', '智素'] },
  '综合文化场馆':   { ld: '智素', md: ['灵素', '心素'] },
  '红色纪念场馆':   { ld: '灵素', md: ['心素', '智素'] },
  '城市书房':       { ld: '智素', md: ['心素', '行素'] },
  '青少年活动中心': { ld: '交素', md: ['体素', '行素'] },
  '群众文化馆':     { ld: '交素', md: ['智素', '灵素'] },
  '社区成长空间':   { ld: '交素', md: ['心素', '行素'] },
  '公共图书馆':     { ld: '智素', md: ['心素', '行素'] },
  '科技科普场馆':   { ld: '智素', md: ['行素', '灵素'] },
  '综合实践基地':   { ld: '行素', md: ['智素', '交素'] },
  '生态农耕体验':   { ld: '行素', md: ['体素', '智素'] },
};

// 类型 → 默认适配问题行为
const TYPE_ISSUES = {
  '自然生态公园':   ['不爱运动、体质差、缺乏户外活动', '坐不住、专注力不足、好动'],
  '综合文化场馆':   ['对历史/文化兴趣不足、知识面窄', '信息筛选能力弱、缺乏深度学习习惯'],
  '红色纪念场馆':   ['爱国意识薄弱、不懂感恩、缺乏理想', '责任感差、缺乏勇气与担当'],
  '城市书房':       ['不爱看书、阅读习惯差', '注意力不集中、缺乏安静专注能力'],
  '青少年活动中心': ['缺乏兴趣爱好、课余生活单一', '不愿与人合作、社交退缩'],
  '群众文化馆':     ['不敢当众表达、羞怯内向', '缺乏艺术兴趣、审美感知弱'],
  '社区成长空间':   ['情绪管理差、易怒敏感', '缺乏规则意识、社交技能不足'],
  '公共图书馆':     ['不爱阅读、学习兴趣低', '坐不住、静不下来'],
  '科技科普场馆':   ['对科学兴趣不足、认为科学遥远', '动手能力弱、缺乏探索精神'],
  '综合实践基地':   ['缺乏劳动意识、动手能力弱', '做事拖拉、缺乏规划与执行'],
  '生态农耕体验':   ['挑食浪费、不知道食物来源', '缺乏劳动体验、四体不勤'],
};

// 类型 → 五育关联文案（co）
const TYPE_CO = {
  '自然生态公园':   '体育：体能锻炼、坚持意志。 智育：自然观察、生命认知。 劳育：环保实践、责任担当。',
  '综合文化场馆':   '智育：历史认知、文化理解、创新精神。 德育：家国认同、文化自信。 美育：审美感知、艺术启蒙。',
  '红色纪念场馆':   '德育：理想信念、家国情怀、道德勇气。 智育：历史认知、批判思维。 劳育：责任担当、实践品格。',
  '城市书房':       '智育：阅读素养、深度学习、信息检索。 心育：专注力、情绪涵养。 德育：终身学习、自我修养。',
  '青少年活动中心': '体育：体能训练、运动技能。 智育：科学探究、创新创造。 美育：艺术素养、审美表达。 交育：合作社交、自我表达。',
  '群众文化馆':     '美育：艺术鉴赏、审美感知。 交育：社交发起、自我表达。 智育：文化认知、知识整合。',
  '社区成长空间':   '心育：情绪管理、自我觉察、求助意识。 交育：倾听尊重、协商解决。 德育：规则意识、责任担当。',
  '公共图书馆':     '智育：阅读能力、深度学习、信息素养。 心育：专注冥想、情绪调节。 劳育：自主管理、行为自律。',
  '科技科普场馆':   '智育：科学思维、探究精神、创新创造。 劳育：动手实践、问题解决。 心育：挫折耐受、求真实学。',
  '综合实践基地':   '劳育：劳动技能、动手实践、责任担当。 智育：项目学习、问题解决。 交育：协作担当、协商解决。',
  '生态农耕体验':   '劳育：农耕劳动、感恩勤俭。 智育：自然认知、生态环保。 德育：敬畏自然、珍惜资源。',
};

// 名称归一化（现库名 → docx 名）
const NAME_NORMALIZE = {
  '包头市体育中心（公共开放区）': '包头市体育中心(公共开放区)',
  '包头市儿童剧院（公共开放区）': '包头市儿童剧院(公共开放区)',
  '包头市少年宫（总部）': '包头市少年宫(总部)',
  '包头市母婴店（科普体验区）': '包头市母婴店(科普体验区)',
  '包头市民族团结进步教育实践基地（昆区主基地）': '包头市民族团结进步教育实践基地(昆区主基地)',
  '包头市民族团结进步教育实践基地（九原主基地）': '包头市民族团结进步教育实践基地(九原主基地)',
  '包头市青少年活动中心': '包头市青少年活动中心(原昆区少年宫)',
  '虫趣儿甲虫蝴蝶馆': '虫趣儿甲虫蝴蝶馆(活体昆虫博物馆)',
  '酸的甜·粮食醋文化博物馆': '酸的甜',
};

// 6 个新建点位物理数据（子 agent 2026-08 联网调研结果，坐标均为 GCJ-02 腾讯/高德系，可直接用于微信地图）
const NEW_POINTS = [
  { n: '王老太太故居', d: '土默特右旗', a: '内蒙古自治区包头市土默特右旗美岱召镇河子村（河子红色文化村内红色文化街）', h: '待核实', p: '待核实', lat: 40.602143, lng: 110.743599, type: '红色纪念场馆' },
  { n: '包头市中小学综合实践教育中心', d: '九原区', a: '内蒙古自治区包头市九原区职教园区思源道', h: '待核实（不对外散客开放）', p: '0472-5881747', lat: 40.651364, lng: 109.993261, type: '综合实践基地' },
  { n: '秦长城国家文化公园', d: '固阳县', a: '内蒙古自治区包头市固阳县金山镇（秦长城康图沟段，沿210省道）', h: '08:00-17:00', p: '18648260160', lat: 41.107933, lng: 110.05132, type: '红色纪念场馆' },
  { n: '战国赵北长城遗址公园', d: '昆都仑区', a: '内蒙古自治区包头市昆都仑区110国道北（昆都仑河畔）', h: '全天开放（免费）', p: '待核实', lat: 40.715463, lng: 109.801417, type: '自然生态公园' },
  { n: '敕勒川现代农业产业园', d: '土默特右旗', a: '内蒙古自治区包头市土默特右旗沟门镇（内蒙古农业大学职业技术学院西南）', h: '08:00-17:30（17:00停止入园）', p: '待补充', lat: 40.594198, lng: 110.571095, type: '综合实践基地' },
  { n: '赵长城遗址胡服骑射广场', d: '石拐区', a: '内蒙古自治区包头市石拐区包脑线旁山丘上（克尔玛沟内）', h: '全天开放（免费）', p: '待补充', lat: 40.71821, lng: 110.150724, type: '自然生态公园' },
];

// ============ 3. 组装 ============
const lines = fs.readFileSync(INPUT, 'utf8').split(/\r?\n/);
const slicesAll = parseSlices(lines);
const slicesByPoint = {};
slicesAll.forEach(s => { (slicesByPoint[s.point] = slicesByPoint[s.point] || []).push(s); });

const points = Object.keys(slicesByPoint);
if (points.length !== 111) throw new Error(`点位数量 ${points.length} != 111`);
if (slicesAll.length !== 459) throw new Error(`切片数量 ${slicesAll.length} != 459`);

// 模板点类型（由切片 loc 组合判定）
const tplComboByPoint = {};
for (const [p, sls] of Object.entries(slicesByPoint)) {
  const locs = sls.filter(s => s.type === '模板生成版').map(s => s.loc.replace(/^粮食醋文化博物馆 · /, '')).sort().join(' + ');
  if (locs) tplComboByPoint[p] = locs;
}
function typeOfPoint(name, slices) {
  const hasBench = slices.some(s => s.type === '标杆精细版');
  if (hasBench) {
    const t = BENCHMARK_TYPE[name];
    if (!t) throw new Error(`标杆点位缺少类型映射: ${name}`);
    return t;
  }
  const combo = tplComboByPoint[name];
  const t = COMBO_TO_TYPE[combo];
  if (!t) throw new Error(`模板点位无法判定类型: ${name} combo=[${combo}]`);
  return t;
}

// 现有 105 条（排除历史误写的 6 个新点条目，防止重复 id 自我强化）
const NEW_NAMES = new Set(NEW_POINTS.map(np => np.n));
const { LOCATIONS: LOCATIONS_OLD_RAW } = require(path.join(ROOT, 'data', 'locations.js'));
const LOCATIONS_OLD = LOCATIONS_OLD_RAW.filter(l => !NEW_NAMES.has(l.n));
const oldByName = {};
LOCATIONS_OLD.forEach(l => { oldByName[l.n] = l; });

// 归一化名称映射（旧名→新名）同时建立 新名→旧 entry
const renamedFrom = {};
Object.entries(NAME_NORMALIZE).forEach(([oldN, newN]) => { renamedFrom[newN] = oldN; });

const DIM_KEYS = ['体素', '心素', '灵素', '智素', '行素', '交素'];
const DIM_LABELS = { 体素: '身体素养', 心素: '情绪素养', 灵素: '价值素养', 智素: '认知素养', 行素: '行动素养', 交素: '社交素养' };

function dup(s) { return JSON.parse(JSON.stringify(s)); }

function buildEntry(name) {
  const sls = slicesByPoint[name] || [];
  const type = typeOfPoint(name, sls);
  const baseStars = TYPE_BASE_STARS[type];
  const tplDims = TYPE_DIMS[type];
  const old = oldByName[name] || oldByName[renamedFrom[name]] || oldByName[name.replace(/[()（）]/g, '')] || null;
  const isNew = !old;

  const entry = {
    id: old ? old.id : (106 + NEW_POINTS.findIndex(np => np.n === name)), // 现有 105 个 id 为 1-105，新点从 106 起
    n: name,
    d: old ? old.d : (NEW_POINTS.find(np => np.n === name)?.d || '待核实'),
    a: old ? old.a : (NEW_POINTS.find(np => np.n === name)?.a || '待核实'),
    c: type,
    v: old ? old.v : `${name}：${DIM_LABELS[tplDims.ld]}与${tplDims.md.map(d => DIM_LABELS[d]).join('、')}共育场，在真实场景中获得沉浸式成长体验。`,
    ld: old ? old.ld : tplDims.ld,
    md: old ? old.md : tplDims.md,
    ad: old ? old.ad : [tplDims.ld, ...tplDims.md],
    g: old ? old.g : (sls.map(s => s.pre).filter(Boolean).slice(0, 2).join('；') || '出发前结合孩子兴趣，带着一个好奇的问题前往。'),
    ac: old ? old.ac : (sls.map(s => s.act).filter(Boolean).slice(0, 2).join('；') || '到馆后跟随讲解员参观，鼓励孩子主动观察、提问与分享。'),
    is: old ? old.is : (TYPE_ISSUES[type] || []),
    co: old ? old.co : (TYPE_CO[type] || ''),
    h: old ? old.h : (NEW_POINTS.find(np => np.n === name)?.h || '待核实'),
    p: old ? old.p : (NEW_POINTS.find(np => np.n === name)?.p || '待核实'),
    lat: old ? old.lat : (NEW_POINTS.find(np => np.n === name)?.lat ?? null),
    lng: old ? old.lng : (NEW_POINTS.find(np => np.n === name)?.lng ?? null),
    stars: dup(baseStars),
    ver: sls.some(s => s.type === '标杆精细版') ? '标杆' : '模板',
    type,
    sliceCount: sls.length,
    slices: sls.map(s => ({
      tpl: s.type === '模板生成版',
      loc: s.loc,
      title: s.title,
      dim: s.dim,
      dimKey: s.dimKey,
      subs: s.subs.split('/').map(x => x.trim()).filter(Boolean),
      age: s.age,
      stars: dup(s.stars),
      edu: s.edu,
      pre: s.pre,
      talk: s.talk,
      act: s.act,
      post: s.post,
    })),
  };
  return entry;
}

const out = points.map(buildEntry);
out.sort((a, b) => a.id - b.id);

// ============ 4. 校验断言 ============
const errors = [];
if (out.length !== 111) errors.push(`总点数 ${out.length} != 111`);
const totalSlices = out.reduce((n, l) => n + l.slices.length, 0);
if (totalSlices !== 459) errors.push(`切片总数 ${totalSlices} != 459`);
out.forEach(l => {
  if (l.sliceCount !== l.slices.length) errors.push(`${l.n}: sliceCount 不一致`);
  DIM_KEYS.forEach(d => {
    const v = l.stars[d];
    if (!(v >= 1 && v <= 3)) errors.push(`${l.n}: stars.${d}=${v} 超范围`);
  });
  if (!l.slices.length) errors.push(`${l.n}: 无切片`);
  if (l.c !== l.type) errors.push(`${l.n}: c(${l.c})!=type(${l.type})`);
});
// 关键示例核对（1-3 星体系）
const keyChecks = {
  '赛汗塔拉城中草原': { 体素: 3 },
  '包头博物馆': { 智素: 3, 灵素: 3 },
  '包头市植物园': { 体素: 3 },
  '包头市图书馆': { 智素: 3 },
  '王老太太故居': { 灵素: 3, 心素: 3 },
};
for (const [name, want] of Object.entries(keyChecks)) {
  const l = out.find(x => x.n === name);
  if (!l) { errors.push(`关键点位缺失: ${name}`); continue; }
  for (const [d, v] of Object.entries(want)) {
    if (l.stars[d] !== v) errors.push(`${name}: ${d} 期望${v} 实得${l.stars[d]}`);
  }
}
// 归一化检查：无重复名
const names = new Set(out.map(l => l.n));
if (names.size !== out.length) errors.push(`存在重名点位`);

if (errors.length) {
  console.error('❌ 校验失败:\n' + errors.join('\n'));
  process.exit(1);
}

// ============ 5. 输出 ============
const fileHeader = `/**
 * 地点数据 - 包头市德育心理建设路径
 * 共 ${out.length} 个点位，${totalSlices} 个教育切片
 * 星级为 1-3 星定性映射（★★★核心/★★显著/★一般），源自《素养导引地图_111点位切片全量库》
 */

const LOCATIONS = `;
const json = JSON.stringify(out, null, 0);
const js = fileHeader + json + `;

module.exports = { LOCATIONS };
`;
fs.writeFileSync(OUT, js, 'utf8');

const catCount = {};
out.forEach(l => catCount[l.c] = (catCount[l.c] || 0) + 1);
console.log(`✅ 已生成 ${out.length} 个点位，${totalSlices} 个切片 → ${OUT}`);
console.log('分类分布:', Object.entries(catCount).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}${v}`).join(' / '));
console.log('校验断言全部通过：1-3星 / 关键示例 / 切片数 / 无重名');