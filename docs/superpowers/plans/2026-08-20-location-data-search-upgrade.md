# 111 点位数据升级 + 搜索逻辑重写 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `data/locations.js` 从 105 个地点升级为 111 个点位（含 docx 的 459 个教育切片），全量改为 1-3 星体系，重写搜索逻辑并修复"包头博物馆→105"bug。

**Architecture:** 数据模型 = 点位物理/身份字段（沿用现有）+ 点位级 1-3 星（按 12 类点位类型定性映射）+ `slices` 数组（docx 全量切片）；搜索改为加权打分算法替代布尔级联；详情页新增"教育切片"区块。

**Tech Stack:** 微信小程序原生（无框架）、Node.js（数据构建与校验脚本）、微信 WXML/WXSS、docx 解析产物（临时目录 JSON）。

## Global Constraints

- 数据源：`D:\weixinzanshi\xwechat_files\wxid_muexxzol56mp21_0b49\msg\file\2026-08\素养导引地图_111点位切片全量库全量库.docx`（已解析到 `%TEMP%\opencode\slices_full.json`，459 切片、111 点位、0 字段缺失）
- 星级一律 1-3 星：★★★核心 / ★★显著 / ★一般（用户 + docx 第 10 行确定）
- 分类按 docx 的 12 类点位类型（11 个场地类型组合 + 标杆/模板版本区分）
- 切片必须上详情页（用户确认）
- 名字归一化：统一用 docx 半角括号写法（用户确认）
- 不引入第三方依赖；模糊搜索自研加权算法（用户最新指示"彻底重写搜索逻辑"）
- 6 个新点位物理数据由子 agent 联网搜集；未搜到前标"待补充"不上图
- 现有字段含义保留：`id n d a c v ld md ad g ac is co h p lat lng`（已向用户确认）
- 文件按既有结构存放，不新增独立数据文件（用户此前确认：星级写回 locations.js）

## 数据事实（已完成调研，写入计划便于执行）

### 111 点位构成
- 现有 105 个：基础字段/坐标保留，9 处名字归一化（全角括号→半角括号等）
- 新增 6 个：`包头市中小学综合实践教育中心`、`王老太太故居`、`秦长城国家文化公园`、`敕勒川现代农业产业园`、`赵长城遗址胡服骑射广场`、`战国赵北长城遗址公园`（地址/坐标待子 agent 搜集）

### 名字归一化对应表（现库 → docx 用名）
| 现库名 | docx 名 |
|---|---|
| 包头市体育中心（公共开放区） | 包头市体育中心(公共开放区) |
| 包头市儿童剧院（公共开放区） | 包头市儿童剧院(公共开放区) |
| 包头市少年宫（总部） | 包头市少年宫(总部) |
| 包头市母婴店（科普体验区） | 包头市母婴店(科普体验区) |
| 包头市民族团结进步教育实践基地（九原主基地） | 包头市民族团结进步教育实践基地(九原主基地) |
| 包头市民族团结进步教育实践基地（昆区主基地） | 包头市民族团结进步教育实践基地(昆区主基地) |
| 包头市青少年活动中心 | 包头市青少年活动中心(原昆区少年宫) |
| 虫趣儿甲虫蝴蝶馆 | 虫趣儿甲虫蝴蝶馆(活体昆虫博物馆) |
| 酸的甜·粮食醋文化博物馆 | 酸的甜 |

### 12 类点位类型（由 459 切片的模板组合归纳而来）
| 类别 `c` | 模板组合特征 | 数量 | 基型样例 |
|---|---|---|---|
| 自然生态公园 | 主干步道/绿道+环保/文明宣传区+自然观察区 | 18 | 植物园、八一公园、劳动公园 |
| 综合文化场馆 | 主题展厅·家国/英烈+公共空间+常设展厅·核心展区+社教活动区 | 15 | 敕勒川博物馆、美岱召博物馆 |
| 红色纪念场馆 | 主展厅/陈列区+人物/故事+历史脉络+纪念/缅怀 | 12 | 王若飞纪念馆、中共包头市委旧址 |
| 城市书房 | 书房公约/自主管理+亲子/分享+阅读/活动区 | 12 | 鹿城阅立方、一念书屋 |
| 青少年活动中心 | 体育训练场+心理/成长课堂+科技/创客+艺术/表演 | 9 | 少年宫各校区、青少年活动中心 |
| 群众文化馆 | 文化讲堂/展览+群众文艺/排练观摩+非遗/民俗 | 8 | 市/区文化馆 |
| 社区成长空间 | 主展区/活动区+主题教育/科普区+互动/体验区 | 8 | 未成年人保护站、法治教育基地 |
| 公共图书馆 | 绘本/少儿+自主服务+读者活动/沙龙+阅览区 | 7 | 昆都仑区图书馆、东河区图书馆 |
| 科技科普场馆 | 公共安全/应急+创客/动手+常设展厅·基础科学+科技产业 | 5 | 轻工博物馆、立春电影博物馆 |
| 综合实践基地 | 团队/拓展+科技/探究+综合实践/劳动教育 | 2 | 综合实践教育中心、现代农业产业园 |
| 生态农耕体验 | 环保行动+生态/农耕体验+自然观察/步道 | 1 | 套马沟农耕基地 |
| 标杆研学点位 | 手工精细切片（_tpl=false，14 个点位分属上述场地类型） | 14 | 包头博物馆、王老太太故居、包头市图书馆、赛汗塔拉等 |

### 12 类点位基础星级表（1-3 星，六维顺序 体/心/灵/智/行/交）
表值由同类点位全部切片加权均值圆整；个别维度按教育功能微调（如公园体素=3）：

| 类别 | 体 | 心 | 灵 | 智 | 行 | 交 |
|---|---|---|---|---|---|---|
| 自然生态公园 | 3 | 1 | 2 | 2 | 2 | 1 |
| 综合文化场馆 | 1 | 2 | 3 | 3 | 2 | 2 |
| 红色纪念场馆 | 1 | 3 | 3 | 2 | 2 | 2 |
| 城市书房 | 1 | 1 | 2 | 3 | 1 | 2 |
| 青少年活动中心 | 3 | 2 | 2 | 2 | 3 | 3 |
| 群众文化馆 | 2 | 2 | 2 | 2 | 2 | 3 |
| 社区成长空间 | 1 | 3 | 2 | 2 | 2 | 3 |
| 公共图书馆 | 1 | 2 | 2 | 3 | 2 | 2 |
| 科技科普场馆 | 1 | 2 | 2 | 3 | 3 | 1 |
| 综合实践基地 | 2 | 1 | 2 | 3 | 3 | 2 |
| 生态农耕体验 | 3 | 1 | 2 | 2 | 3 | 1 |
| 标杆研学点位 | 按其场地类型（上述 11 类）基础星级 | | | | | |

执行时生成 `scripts/build_data.mjs` 计算并校验：111 点 × 6 维都有 1-3 星；核对关键示例（赛汗塔拉体素=3、包头博物馆智素=3/灵素=3 等）。

### 行为关键词映射（阈值为⊙ 1-3 星制重映射，原 4/3 星阈值改为 3/2）
```
坐不住/多动/好动/静不下来/乱跑/坐立不安  → 体素≥3
爱哭/脾气大/情绪化/敏感/易怒/暴躁        → 心素≥3
不爱看书/学不进去/不爱学习/成绩差/分心   → 智素≥3
胆小/不敢说话/怕人/内向/不合群/社恐      → 交素≥2
磨蹭/拖拉/懒散/拖延/不爱动               → 行素≥2
不懂事/不感恩/叛逆/顶嘴/自私             → 灵素≥3
不爱运动/体质差/挑食/容易生病            → 体素≥2
沉迷游戏/玩手机/网瘾/沉迷                → 行素≥3
说谎/骗人/撒谎/不诚实                    → 灵素≥3
欺负人/霸凌/打架/推人/打人               → 交素≥3
```

---

## Task 0: 新点位物理数据搜集（子 agent）

**Files:**
- 产出写入 `data/locations.js` 的 6 个新点位条目（后续 Task 1 使用）
- 无代码产出（纯研究）

**Interfaces:**
- Produces: `{n, d, a, c, lat, lng, h, p}` 6 条记录，供 Task 1 合并进数据集。

- [ ] **Step 1: 并发派发 3 个子 agent（每个负责 2 个点位）**
  用 task 工具（subagent_type=general），每个 agent 联网搜索 2 个新点位的：
  - 详细地址、行政区（昆区/青山/九原/土右旗……）
  - 经纬度（高德/百度/腾讯坐标，记录来源）
  - 开放时间、联系电话
  三个批次：
  - 批次 A：王老太太故居（包头东河区；土默特右旗？）、包头市中小学综合实践教育中心
  - 批次 B：秦长城国家文化公园、战国赵北长城遗址公园
  - 批次 C：敕勒川现代农业产业园、赵长城遗址胡服骑射广场
- [ ] **Step 2: 汇总结果，搜索不到的点位坐标/地址标 `待补充`，电话/开放时间标 `待核实`；若有歧义（多个同名场所）记录备选**，回填到数据构建脚本。
- 产出直接内联进 Task 1 的构建脚本（不单独建文件）。

---

## Task 1: 生成 111 个点位新数据（data/locations.js）

**Files:**
- Create: `scripts/build_data.mjs`（数据构建 + 校验脚本，一次性生成 locations.js）
- Modify: `data/locations.js`（全量替换为 111 条）
- Read-only: `%TEMP%\opencode\slices_full.json`（解析产物，由构建脚本重新解析 docx_lines.txt 更稳妥，保证可复现）

**Interfaces:**
- Consumes: `slices_full.json`（Task 0 前的解析结果）、现有 `LOCATIONS`（105 条）、Task 0 的 6 条新点位物理数据。
- Produces: `data/locations.js` 导出 `LOCATIONS` 数组：111 条，每条含全部字段 + `stars`(1-3) + `type`(12 类之一) + `ver`('标杆'|'模板') + `sliceCount` + `slices`[]。

- [ ] **Step 1: 将 docx 解析器固化为脚本**
  在 `scripts/build_data.mjs` 内实现 docx 文本行解析（复用本会话已验证的正则）：
  ```js
  const SLICE_RE = /^【(标杆精细版|模板生成版)】\s*(.+?)(?:\s*·\s*|\s+-\s+)(.+?)\s*→\s*「(.+?)」$/;
  const META_RE = /^维度\s+(\S+)\s*｜\s*子素养\s+(.+?)\s*｜\s*适龄\s+(\S+?)\s*｜\s*星级\s+(.+)$/;
  const STAR_RE = /([价知行情身社])(★*)/g;
  ```
  解析每个切片：`{ type, point, loc, title, dim, dimKey, subs[], age, stars, edu, pre, talk, act, post }`。断言 459 切片、111 点位、0 缺失。
- [ ] **Step 2: 名称归一化 + 新点位合并**
  应用上表 9 处归一化；合并 Task 0 的 6 条新点位物理数据；断言结果恰为 111 条（105 归一化 + 6 新增）。
- [ ] **Step 3: 生成 1-3 星与分类**
  按 12 类基础星级表为每点写 `stars`；每点写 `type`（11 场地类型之一）与 `ver`（'标杆' 若含任一 标杆精细版 切片）；`c` = 场地类型（与 `type` 相同的 11 类字符串），标杆点的 `c` 取所属场地类型（不用"标杆研学点位"作类别，保证分类筛选有效）。
- [ ] **Step 4: 组装 slices**
  每点 `slices` 数组 = 其全部切片，排序 = docx 出现顺序；`sliceCount` = 数量。切片内 `tpl` = (type==='模板生成版')。
- [ ] **Step 5: 运行构建脚本**：`node scripts/build_data.mjs` → 生成 `data/locations.js`。
- [ ] **Step 6: 校验脚本断言（内置于 build_data.mjs）**
  - 111 条；每条 6 维 stars ∈ {1,2,3}
  - 每点 sliceCount === slices.length；切片总数为 459
  - 例：赛汗塔拉城中草原{体素:3}；包头博物馆{智素:3,灵素:3}；包头市植物园{体素:3}
  - 9 处归一化后无重复名；6 新点均存在
- [ ] **Step 7: Commit** `git add scripts/build_data.mjs data/locations.js && git commit -m "data: upgrade locations to 111 points with 459 educational slices and 1-3 star system"`

---

## Task 2: 星级体系切换为 1-3 星

**Files:**
- Modify: `pages/index/index.js`（BEHAVIOR_KEYWORDS 阈值、detectBehaviorKeywords、card 显示逻辑）
- Modify: `pages/index/index.wxml`（卡片星级渲染）
- Modify: `pages/detail/detail.wxml`（如显示星级则同步 1-3 星）

**Interfaces:**
- Consumes: Task 1 的 `stars`(1-3)。
- Produces: 行为关键词→星级条件（阈值 3/2），供 Task 4 搜索使用。每个维度星级卡片最多显示 3 颗星。

- [ ] **Step 1: 更新 BEHAVIOR_KEYWORDS 阈值**
  按"数据事实"节映射表将 `min` 改为 3 或 2。
- [ ] **Step 2: 更新卡片星级渲染**
  现 `updateCardItems` 过滤 `>=4`，改为展示全部六维星级（或点数≥2 的维度），star 文案 `'★'.repeat(n)`（n≤3）。WXML 中 `starsDisplay` 的 `item.stars >= 5 ? '★★★★★' : ...` 三态三元改为一态 `'★'.repeat(item.stars)`。
- [ ] **Step 3: 校验**：`node scripts/verify_stars.mjs`（或内联断言）确认所有 star ∈[1,3]；"坐不住"命中体素≥3 时含赛汗塔拉。
- [ ] **Step 4: Commit** `git commit -m "feat: switch star system to 1-3 qualitative scale"`

---

## Task 3: 分类切换为 12 类

**Files:**
- Modify: `pages/index/index.js`（`ALL_CATEGORIES` 自动从数据派生，无需改逻辑）
- Modify: `components/filter-sheet/filter-sheet.wxml`（分类区标题文案可选）
- 核对：`data/dimensions.js` 无需改；分类颜色映射需在 `utils/util.js` 增加 12 类配色

**Interfaces:**
- Consumes: Task 1 的 `c`（12 类字符串）。
- Produces: 分类筛选/展示按 12 类进行。

- [ ] **Step 1: 扩展分类配色**
  `utils/util.js` 增加 `CAT_COLORS = { 自然生态公园:'#22c55e', 综合文化场馆:'#6366f1', 红色纪念场馆:'#ef4444', 城市书房:'#0ea5e9', 青少年活动中心:'#f59e0b', 群众文化馆:'#8b5cf6', 社区成长空间:'#14b8a6', 公共图书馆:'#a16207', 科技科普场馆:'#0891b2', 综合实践基地:'#059669', 生态农耕体验:'#65a30d', 标杆研学点位:'#64748b' }`。
- [ ] **Step 2: 校验**：`ALL_CATEGORIES` 派生后为 11 类（标记点 c 已归入场地类型；12 类由 type 区分）；列表筛选无报错。
- [ ] **Step 3: Commit** `git commit -m "feat: switch categories to 12 docx point types"`

---

## Task 4: 搜索逻辑彻底重写 + 修复"包头博物馆→105"

**Files:**
- Modify: `pages/index/index.js`（`getFilteredLocations`、新增 `scoreLocation`、预计算 `searchText`）
- Test: `scripts/verify_search.mjs`（搜索回归测试）

**Interfaces:**
- Consumes: Task 2 的 BEHAVIOR_KEYWORDS、Task 1 的 `stars`/`slices`。
- Produces: 新搜索入口 `getFilteredLocations()` 返回按相关度降序的地点数组；供 `refreshAll` 使用。

**问题根因（已确认）：** 旧逻辑的"任意连续 2 字出现在全文即通过"回退（`index.js` 约 124-127 行）使搜"包头博物馆"时 2 字片段"包头"命中所有包头市地址 → 105 全出。

- [ ] **Step 1: 为每个地点预计算可搜索文本**
  `onLoad`/构建期：`loc._searchText = (n+d+c+v+a+is.join+slice 的 title+loc+subs+edu).toLowerCase()`。
- [ ] **Step 2: 编写评分函数 `scoreFilter(q, loc)`**
  ```js
  // 返回 { pass, score, reason }；pass=false 表示剔除
  function scoreFilter(q, loc) {
    const S = loc._searchText, T = (loc.n + loc.d + loc.c).toLowerCase();
    // 1) 行为关键词命中：不看文本，只看星级条件
    const kw = detectBehaviorKeywords(q);
    if (kw.length > 0) {
      const ok = kw.every(k => loc.stars && loc.stars[k.dim] >= k.min);
      return ok ? { pass: true, score: 1000, reason: 'keyword' } : { pass: false, score: 0, reason: 'keyword' };
    }
    // 2) 精确子串
    if (T.includes(q)) return { pass: true, score: 200, reason: 'name' };
    if (S.includes(q)) return { pass: true, score: 150, reason: 'exact' };
    // 3) 有序子序列（允许有间隔），要求覆盖率阈值
    const need = [...q];
    let i = 0;
    for (const ch of S) if (ch === need[i]) { i++; if (i === need.length) break; }
    const fullSeq = i === need.length;
    const present = need.filter(ch => S.includes(ch)).length;
    const ratio = present / need.length;
    if (fullSeq && ratio >= 0.8) return { pass: true, score: 80 + (ratio * 10), reason: 'sequence' };
    // 4) 覆盖率兜底（无顺序要求）：两字查询必须全中，多字查询≥0.9
    if (need.length <= 2) return { pass: false, score: 0, reason: 'short' };
    if (ratio >= 0.9) return { pass: true, score: 60 + (ratio * 10), reason: 'cover' };
    return { pass: false, score: 0, reason: 'nomatch' };
  }
  ```
  关键修复：删除旧的"任意连续 2 字命中即通过"。="包头博物馆" 对无关地点：2 字查询"包头 博物 物馆"——"包头"曾误伤，现要求覆盖率 ≥0.9（5 字需≥4.5→5 字全中）或有序子序列且覆盖率≥0.8，地址里只有零散 `包头` 的不再误伤。
- [ ] **Step 3: 重写 `getFilteredLocations()`**
  ```js
  getFilteredLocations() {
    const f = this.data.filter;
    let list = this.allLocations.map(loc => ({ loc, sc: f.search ? scoreFilter(f.search, loc) : { pass: true, score: 1000 } }));
    list = list
      .filter(x => x.sc.pass)
      .filter(x => f.dims.length === 0 || f.dims.some(d => x.loc.ad.includes(d)))
      .filter(x => f.starDims.length === 0 || f.starDims.every(sd => x.loc.stars && x.loc.stars[sd.dim] >= sd.min))
      .filter(x => f.issues.length === 0 || f.issues.some(i => (x.loc.is || []).includes(i)))
      .filter(x => f.cats.length === 0 || f.cats.includes(x.loc.c));
    if (f.search) list.sort((a, b) => b.sc.score - a.sc.score);
    return list.map(x => x.loc);
  }
  ```
- [ ] **Step 4: 编写回归测试 `scripts/verify_search.mjs`**
  断言（本会话已验证的期望值）：
  - `包头博物馆` → 1 个（精确命中，不再是 105）
  - `图书馆` → 数量=名字/内容含"图书馆"的点位（约 20 上下）
  - `赛汗塔拉` → 1 个（名字含"赛汗塔拉"）
  - `坐不住` → 体素≥3 的集合（21 个；必含 赛汗塔拉、植物园、八一公园）
  - `爱哭` → 心素≥3 的集合（16 个；必含 图书馆类、黄河文旅类）
  - `坐不住 爱哭` → 体素≥3 且 心素≥3 的交集
  - 空字符串 → 111 全出
- [ ] **Step 5: 修复 `onSearchInput` 与 `onFilterChange` 的 starDims 一致性**
  确保组件提交、页面 input、tag 移除三条路径都走同一套 starDims 归一逻辑（已有雏形，复核即可）。
- [ ] **Step 6: 运行**：`node scripts/verify_search.mjs` 全绿。
- [ ] **Step 7: Commit** `git commit -m "fix: rewrite search scoring and fix Baotou-museum returning all results"`

---

## Task 5: 筛选面板支持"按素养+星级"三种模式

**Files:**
- Modify: `components/filter-sheet/filter-sheet.js`（星级筛选交互 + onApply 携带 starDims）
- Modify: `components/filter-sheet/filter-sheet.wxml`（维度选择器旁加星级阈值选择）
- Modify: `pages/index/index.js`（接收 starDims 并入 filter，已有；补充 active-bar 显示 starDims 标签）
- Modify: `pages/index/index.wxml`（active-bar 渲染 starDims 标签及删除按钮）

**Interfaces:**
- Consumes: Task 2 的维度/星级语义。
- Produces: `filter.starDims = [{dim, min}, ...]` 与 `filterchange` 事件透传。

- [ ] **Step 1: 维度星级选择器**
  在"素养维度"区块每个 chip 下方/旁边加三档：`★★★ / ★★ / ★`；选中维度后点星级设定 `min`。交互：点维度 chip 循环切换 3→2→1→清除。
- [ ] **Step 2: onApply 透传 starDims**
  `filterchange` 事件 payload 增加 `starDims`（本地选中维度及其阈值）。
- [ ] **Step 3: active-bar 展示/移除 starDims**
  WXML 增加 `filter-tag-star`，文案 `价值素养≥★★★`，可移除；badge 计数已含 starDims.length（更新 FilterBadge 已实现）。
- [ ] **Step 4: 校验**：模拟三种模式：
  - 模式一：选"价值素养 ≥★★★" → 灵素≥3 的点位（36 个）
  - 模式二：选"情绪素养≥★★ + 认知素养≥★★★" → 交集（AND）
  - 模式三：搜"坐不住" → 同 Task 4 断言
- [ ] **Step 5: Commit** `git commit -m "feat: filter sheet star-threshold selection with three search modes"`

---

## Task 6: 详情页新增"教育切片"区块

**Files:**
- Modify: `pages/detail/detail.js`（预处理 slices 分组）
- Modify: `pages/detail/detail.wxml`（切片卡片 + 展开教案）
- Modify: `pages/detail/detail.wxss`（样式）

**Interfaces:**
- Consumes: Task 1 的 `slices` 数组。
- Produces: 详情页展示切片标题/位置/子素养/适龄/星级 与四段教案（行前准备/路上话术/到馆做法/返程复盘）。

- [ ] **Step 1: 预处理切片**
  ```js
  const slices = (loc.slices || []).map(s => ({
    ...s, subsTxt: s.subs.join(' / '),
    starItems: DIM_ORDER.filter(d => (s.stars?.[d]||0) > 0).map(d => ({ d, label: getDimLabel(d), n: s.stars[d], color: getDimColor(d) }))
  }));
  ```
  分组：`dimOrder` 固定的六维顺序，`groups = [{ dim, dimLabel, slices:[...] }]`。
- [ ] **Step 2: 详情页 WXML 区块**
  在"预期发展素养"之后插入：
  ```xml
  <view class="info-section">
    <view class="section-title">教育切片（{{location.sliceCount}}）</view>
    <view class="slice-group" wx:for="{{sliceGroups}}" wx:key="dim" wx:if="{{item.slices.length>0}}">
      <view class="slice-group-title" style="color: {{item.color}}">{{item.dimLabel}}</view>
      <view class="slice-card" wx:for="{{item.slices}}" wx:for-item="s" wx:key="title" data-i="{{index}}" data-g="{{index}}" bindtap="onSliceTap">
        <view class="slice-title">{{s.title}}</view>
        <view class="slice-meta">{{s.loc}} · {{s.age}} · {{s.subsTxt}}</view>
      </view>
    </view>
  </view>
  ```
  （data-index 需修正为内层 index；点击展开该切片四段教案。）
- [ ] **Step 3: 展开交互**
  `data.expandedSlice = {title, edu, pre, talk, act, post, starItems}`；点击切片展开/收起；星标同行内渲染。
- [ ] **Step 4: 校验**：进入包头博物馆详情页可见 13 个切片按六维分组；王老太太故居 8 个切片可展开完整教案。
- [ ] **Step 5: Commit** `git commit -m "feat: show educational slices on detail page grouped by dimension"`

---

## Task 7: 端到端回归验证

**Files:**
- Run: `node scripts/verify_search.mjs`、`node scripts/build_data.mjs`（断言模式）
- Run: 微信开发者工具人工过一遍（若可用）

**Interfaces:**
- Consumes: 全部前序任务。
- Produces: 验收结论。

- [ ] **Step 1: 数据完整性回归**：数据断言全绿（111 条、stars∈1-3、slices 总数 459、6 新点含切片）。
- [ ] **Step 2: 搜索回归**：Task 4 断言全绿 + 无"全量误出"类回归。
- [ ] **Step 3: 交互回归**：筛选面板三模式、active-bar 增删、详情页切片展开、地图 marker 与分类筛选联动。
- [ ] **Step 4: 记录结果**：将验证输出摘要写入 `docs/agents/issue-tracker.md` 或会话日志（按仓库惯例）。

---

## Self-Review

**1. Spec coverage：**
- ✅ 111 点数据（Task 0/1）｜ ✅ 1-3 星全量（Task 2）｜ ✅ 12 类分类（Task 3）｜ ✅ 搜索重写+bug 修复（Task 4）｜ ✅ 三搜索模式（Task 5）｜ ✅ 切片上详情页（Task 6）｜ ✅ 名字归一化（Task 1 Step 2）｜ ✅ 子 agent 搜物理数据（Task 0）

**2. Placeholder scan：** 无 TBD/TODO；关键代码均给出实体。唯一外部输入是 Task 0 子 agent 搜索结果——已明确"未搜到则待补充"兜底。

**3. Type consistency：** `stars` 全链路 1-3；`detectBehaviorKeywords` 返回 `[{dim,min}]` 由 Task 2 与 Task 5 共用；`slices[].tpl`、`sliceCount`、`type`、`ver` 名称在 Task 1 定义、Task 3/6 引用一致；`scoreFilter` 的 `pass/score/reason` 结构在 Task 4 定义并被 `getFilteredLocations` 消费。

**已知风险：** docx 内部计数不一致（"15 个标杆"实为 14 个；模板组合求和为 97 而非 96），以实际解析结果（14 标杆 + 97 模板 = 111）为准。