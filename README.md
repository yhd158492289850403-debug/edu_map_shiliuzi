# 石榴籽成长快乐导引地图

> 包头市 111 个教育基地 × 459 个教育切片 × 116 种儿童行为 → 子素养 → 对症教案
> 微信小程序 + 微信云开发

---

## 一、这是什么

家长输入孩子的一个**行为问题**（如"顶嘴""磨蹭""怕黑"），系统：
1. 匹配 **116 种行为映射表**，找到对应的 1-3 项**子素养**（如"情绪调节""协商与冲突解决"）
2. 在 **111 个包头本地教育基地**的 **459 个切片教案**中，找出与该子素养重叠的**对症教案**
3. 每个教案含**四段式行程**：行前准备 / 路上话术 / 到馆做法 / 返程复盘
4. 家长可**打卡记录**成长轨迹，生成成长档案

---

## 二、功能使用指南

### 2.1 首次使用 - 身份选择

首次打开小程序时，需要选择身份：
- **家长**：查看孩子成长报告，获取育儿建议
- **学生**：查看自己的成长勋章和能力图
- **教师**：查看班级学生数据，生成教学报告

**切换身份**：在"我的"页面，点击用户名下方的身份标签，可随时切换身份。

### 2.2 首页 - 找素养

**视图模式**：地图视图 / 卡片列表视图（底部按钮切换）

**地图视图**：微信原生 `<map>` 组件，111 个标记点，颜色按主导维度着色，点击标记跳详情页。

**卡片列表**：地点卡片（名称 + 维度色条 + 六维星级 + 分类标签 + 区域 + 简介），点击跳详情页。

**筛选面板**（`filter-sheet` 组件）：
- 搜索框：支持行为关键词（"顶嘴"→自动筛选心素≥3星的点位）+ 文本模糊匹配
- 素养维度：6 个维度 chip 多选
- 地点分类：11 个分类 chip 多选
- 孩子问题：74 种问题 chip 多选
- 六维星级：每维星级阈值筛选（★★+ / ★★★）
- 学段筛选：小学 / 初中 / 高中

### 2.3 详情页 - 点位详情

展示内容：
- 维度色条 + 维度标签
- 基本信息（区域/地址/类别/开放时间/电话）
- 核心育人价值
- 适配行为问题标签
- 引导建议
- 推荐活动
- 预期发展素养
- 教育切片列表（每个切片展示：标题/位置/子素养/适龄/星级/教育功能/四段教案）

**切片操作**：
- 点击切片卡片 → 展开四段教案（行前准备/路上话术/到馆做法/返程复盘）
- 点击"📝 打卡记录"按钮 → 跳转打卡页面，自动填充点位和行为

### 2.4 附近页 - 距离导航

**流程**：`wx.getLocation(gcj02)` → 计算到 111 点位 Haversine 距离 → 半径筛选（2/3/5/10/不限 km）→ 维度筛选 → 文本搜索 → 距离升序列表。

**每张卡片**：点位名 + 区域 + 分类 + 维度标签 + 距离 +「导航」按钮 → `wx.openLocation` 唤起微信地图导航。

**降级**：定位失败时显示全部点位（按名称排序），提示用户开启权限。

### 2.5 行为寻课页 - 行为→教案

**完整链路**：
```
家长输入行为（如"顶嘴"）
  → utils/behavior.js matchBehaviors(): 精确匹配 > 名称子串 > 别名匹配
  → 得到子素养集合（如"情绪调节/共情回应/协商与冲突解决"）
  → 在 459 切片中找 subs 重叠的切片（按重叠数 + 星级排序）
  → 展示：行为名 + 场景 + 引导 + 对症切片卡片列表
  → 每个切片可展开四段教案，可跳详情页，可直接打卡
```

**热门行为**：顶嘴 / 磨蹭 / 怕黑 / 挑食 / 不爱运动 / 沉迷手机 / 逆反 / 害羞 / 撒谎 / 不专注

**支持多行为搜索**：从筛选面板多选行为时，URL 传 `behaviors=顶嘴,磨蹭`，分别推荐后合并去重。

**分享**：支持转发给朋友 + 分享到朋友圈（含行为名 + 子素养 + 教案标题）。

### 2.6 个人档案页 - 成长轨迹

**数据来源**：云开发数据库 `checkins` 集合（按 openid 隔离）+ 本地存储。

**展示内容**：
- 用户信息（微信昵称 + 身份标签）
- 累计打卡次数 / 去过的点位数 / 涉及的行为数 / 连续打卡天数
- 打卡历史列表（按时间倒序）
- 学段切换（小学/初中/高中）- 仅家长显示

**观察期机制**：
- 首次使用时，需要完成 5 次打卡才能生成成长报告
- 观察期进度条显示"已完成 X/5 次打卡"
- 进度条会自动从云数据库同步打卡记录

**教师视图**：
- 显示班级数据（学生总数/活跃学生/平均打卡）
- 学生列表（可点击查看学生详情）
- 导出班级汇总表按钮

### 2.7 打卡页 - 记录成长

**表单**：
- 选择点位（从 111 个点位中选）
- 选择行为（从 116 种行为中选，或从 recommend 页自动带入）
- 评分（感受等级）
- 文字笔记
- 照片（最多 3 张，上传到云存储）

**提交**：写入云开发数据库 `checkins` 集合 + 本地存储。

### 2.8 成长报告页 - 六维素养报告

**触发条件**：完成 5 次打卡后，在"我的"页面点击"查看成长报告"。

**报告内容**：
- 六维雷达图（体素/心素/灵素/智素/行素/交素）
- 各维度分数（0-100分）
- 成长亮点
- 改进建议
- 鼓励语

**角色化报告**：
- **家长**：温馨鼓励型，关注孩子成长
- **学生**：活泼游戏型，关注成就徽章
- **教师**：专业数据型，关注班级对比

**操作**：
- 点击"导出PDF" → 生成PDF报告（英文标签）
- 点击"分享给朋友" → 微信分享

### 2.9 PDF导出

**使用方法**：
1. 在成长报告页面，点击"导出PDF"按钮
2. 系统生成PDF文件（包含雷达图和维度分数）
3. 自动打开PDF预览
4. 点击右上角"..." → "保存到手机"或"转发给朋友"

**注意**：
- PDF使用英文标签（Physical/Emotional/Value/Cognitive/Action/Social）
- 需要部署 `generatePDF` 云函数

---

## 三、技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | 微信小程序原生（WXML / WXSS / JS） |
| 后端 | 微信云开发（CloudBase） |
| 数据库 | 云开发数据库（MongoDB-like） |
| 存储 | 云开发存储（打卡照片） |
| 地图 | 微信原生 `<map>` 组件 + `wx.openLocation` 导航 |
| 数据构建 | Node.js 脚本（从 docx 文本行提取切片数据） |
| PDF生成 | pdf-lib（云函数） |

**AppID**: `wx20f82f75dc26f148`  
**云环境**: `cloud1-d5gyas9xgbb003681`

---

## 四、目录结构总览

```
edu_map_for_shiliuzi/
│
├── app.js                    # 小程序入口：云开发初始化、获取 openid、全局状态
├── app.json                  # 页面路由 + 全局配置（自定义导航、权限声明）
├── app.wxss                  # 全局样式：维度颜色类、通用按钮、动画、空状态
├── project.config.json       # 微信开发者工具项目配置
├── sitemap.json              # 小程序搜索收录配置
├── CLAUDE.md                 # AI 代理工作规范（可忽略）
│
├── pages/                    # ===== 10 个页面 =====
│   ├── index/                # 首页：地图视图 + 卡片列表 + 筛选面板 + 行为搜索
│   ├── detail/               # 详情页：点位完整信息 + 切片教案 + 打卡入口
│   ├── near/                 # 附近页：定位 → 距离排序 → 半径筛选 → 导航
│   ├── recommend/            # 行为寻课页：行为 → 子素养 → 对症教案推荐
│   ├── profile/              # 个人档案页：打卡统计、成长轨迹、六维分布、身份切换
│   ├── checkin/              # 打卡页：选点位 + 选行为 + 评分 + 笔记 + 照片
│   ├── role-select/          # 身份选择页：家长/学生/教师
│   ├── report/               # 成长报告页：六维雷达图 + 分数 + 建议
│   ├── pdf-export/           # PDF导出页：选择打卡记录 → 导出PDF
│   └── student-detail/       # 学生详情页：教师查看学生信息
│
├── components/               # ===== 5 个自定义组件 =====
│   ├── filter-sheet/         # 筛选面板：维度 / 问题 / 分类 / 星级 / 学段
│   ├── feedback-popup/       # 意见反馈弹窗
│   ├── observation-period/   # 观察期进度条组件
│   ├── radar-chart/          # 六维雷达图组件（原生Canvas）
│   └── report-card/          # 报告卡片组件
│
├── utils/                    # ===== 纯工具函数 =====
│   ├── util.js               # 维度颜色/标签/类名、HTML 转义
│   ├── helper.wxs            # WXS 辅助函数（WXML 中直接调用）
│   ├── search.js             # 搜索核心：行为关键词 → 维度星级、多级评分排序
│   ├── behavior.js           # 行为推荐核心：行为 → 子素养 → 对症切片教案
│   ├── geo.js                # Haversine 球面距离计算（km）
│   ├── tracker.js            # 行为采集：页面访问、停留时长、点击、打卡
│   ├── assessment.js         # 六维素养评估算法
│   ├── observation.js        # 观察期检查：打卡次数、使用天数、查看教案数
│   ├── report-generator.js   # 报告生成：家长/学生/教师三种模板
│   ├── radar-chart.js        # 雷达图绘制工具（原生Canvas）
│   └── pdf-export.js         # PDF导出前端逻辑
│
├── data/                     # ===== 静态数据（全部 require 引入，不走网络）=====
│   ├── locations.js          # 【核心】111 点位 × 459 切片（含六维星级、四段教案）
│   ├── behaviors.js          # 116 种行为 → 子素养映射（含别名、场景、引导语）
│   ├── sub_literacies.js     # 100+ 子素养体系（六维分组、别名归并表）
│   ├── museum_slices.js      # 三大博物馆精细切片库（包头/敕勒川/黄河谣）
│   ├── red-sites.js          # 红色研学点位数据
│   ├── red-slices.js         # 红色研学切片数据
│   ├── red-mapping.js        # 红色切片 → 六维素养映射
│   ├── dimensions.js         # 6 维颜色 + 标签定义（体/心/灵/智/行/交）
│   ├── issues.js             # 74 种孩子问题 → 维度映射
│   ├── user-roles.js         # 用户角色配置（家长/学生/教师）
│   └── README.md             # 数据格式文档
│
├── images/                   # ===== 静态资源 =====
│   └── markers/              # 地图标记图标（每维度一个 PNG + SVG）
│
├── scripts/                  # ===== 数据构建脚本 =====
│   ├── build_data.js         # 【核心】从 docx 文本行构建 locations.js（111点/459切片）
│   ├── build_behaviors.js    # 从审核表构建 behaviors.js
│   ├── build_sub_literacies.js # 构建子素养体系
│   ├── build_museum_slices.js  # 构建博物馆精细切片库
│   ├── reconcile_data.js     # 数据对账：归档数据 vs 工作区数据差异核对
│   ├── apply_verified_updates.js # 应用已核实的物理信息更新
│   ├── add_fee_field.js      # 补充收费字段
│   ├── merge_museum_full.js  # 合并博物馆切片到主数据
│   ├── verify_e2e.js         # 端到端验证脚本
│   ├── verify_features.js    # 功能验证
│   ├── verify_search.js      # 搜索逻辑验证
│   ├── extract-data.js       # 辅助数据提取
│   ├── fix-wxss-vars.js      # WXSS 变量修复
│   ├── generate-markers.js   # 生成地图标记图标
│   └── input/                # 构建脚本的输入文件
│       └── docx_lines.txt    # 《111点位切片全量库.docx》逐行文本提取
│
├── cloudfunctions/           # ===== 微信云函数 =====
│   ├── login/                # 登录：获取 openid + 自动创建用户记录
│   ├── addCheckin/           # 打卡：写入 checkins 集合
│   ├── getCheckins/          # 查询：按用户获取打卡历史
│   ├── getPlans/             # 查询：获取保存的方案
│   ├── savePlan/             # 保存：存入方案数据
│   ├── saveBehavior/         # 保存：行为数据采集
│   ├── getBehaviors/         # 查询：获取行为数据
│   ├── getClassStudents/     # 查询：获取班级学生数据（教师用）
│   └── generatePDF/          # 生成：PDF报告
│
├── demo/                     # ===== 演示文件 =====
│   └── sidebar-interactive-demo.html  # 交互式侧边栏原型演示
│
└── docs/                     # ===== 文档 =====
    ├── agents/               # AI 代理工作规范
    └── superpowers/          # 开发过程文档（计划、对账报告等）
        ├── plans/            # 实施计划文档
        ├── cloud-*.md        # 云开发相关文档
        └── data-merge-*/     # 数据整合过程文档
```

---

## 五、核心数据架构

### 5.1 `data/locations.js` — 点位与切片（最核心）

```
LOCATIONS = [
  {
    id: 1,                    // 唯一 ID（1-111）
    n: "包头博物馆",           // 名称
    d: "昆都仑区",            // 行政区（10 个区旗县）
    a: "详细地址",             // GCJ-02 坐标系地址
    c: "综合文化场馆",         // 分类（11 类）
    v: "核心育人价值描述",     // 一段话概述教育价值
    ld: "智素",               // 主导维度（1 个）
    md: ["行素","灵素"],      // 次要维度（1-3 个）
    ad: ["智素","行素","灵素"],// 全部维度 = [ld, ...md]
    g: "引导建议",             // 行前引导文案
    ac: "推荐活动",            // 到馆活动文案
    is: ["问题1","问题2"],     // 适配的行为问题列表
    co: "预期发展素养",        // 五育/六维关联描述
    h: "周二至周日9:00-17:00", // 开放时间（部分"待核实"）
    p: "0472-5235901",         // 联系电话（部分"待核实"）
    lat: 40.64,                // 纬度（GCJ-02）
    lng: 109.84,               // 经度（GCJ-02）
    stars: {                   // 六维星级（1-3 星定性映射）
      体素: 1, 心素: 2, 灵素: 3, 智素: 3, 行素: 2, 交素: 2
    },
    ver: "标杆",               // "标杆"=手工精细版 / "模板"=模板生成版
    type: "综合文化场馆",      // 同 c 字段
    sliceCount: 13,            // 切片数量
    slices: [                  // 教育切片数组
      {
        tpl: false,            // true=模板生成 / false=标杆精细
        loc: "展厅·展区",      // 馆内具体位置
        title: "切片标题",     // 如"走西口——爷爷的爷爷从哪里来"
        dim: "价值素养",       // 维度全称
        dimKey: "灵素",        // 维度缩写键
        subs: ["孝亲敬老"],    // 子素养名称数组
        age: "6-15岁",         // 适用年龄段
        stars: {灵素:3, ...},  // 该切片六维星级
        edu: "教育功能说明",   // 该切片教什么
        pre: "行前准备",       // 出发前家长说什么/做什么
        talk: "路上话术",      // 路上聊天引导
        act: "到馆做法",       // 到馆后的具体活动任务
        post: "返程复盘"       // 回家后的复盘/巩固
      }
    ]
  }
]
```

### 5.2 `data/behaviors.js` — 行为映射（116 种行为）

```
BEHAVIORS = {
  "顶嘴": {
    name: "顶嘴",
    dim: "情绪",               // 归属大维度
    dimKey: "心素",            // 对应六维键
    dimLabel: "情绪素养",      // 维度中文标签
    cat: "情绪对抗",           // 行为分类
    scene: "被批评时不服从、回嘴", // 行为场景描述
    guide: "教情绪命名+暂停三步法", // 引导建议
    subs: ["情绪调节","共情回应","协商与冲突解决"], // 目标子素养
    aliases: ["逆反","叛逆","回嘴","顶撞"] // 同义词（搜索别名）
  }
}
```

### 5.3 `data/sub_literacies.js` — 子素养体系（100+ 项）

```
SUB_LITERACIES = {
  "情绪调节": { id, name, dimKey:"心素", dimLabel:"情绪素养", source:"system" }
}
DIMENSION_SUBS = { "心素": ["情绪调节","冲动控制",...], ... }
SYNONYM = { "情绪恢复力": "挫折应对", ... } // 别名归并表
```

### 5.4 六维素养体系

| 维度键 | 显示标签 | 颜色 | 含义 |
|--------|---------|------|------|
| `体素` | 身体素养 | 黄 `#EAB308` | 运动、体能、健康、感官 |
| `心素` | 情绪素养 | 红 `#EF4444` | 情感、心态、抗挫、情绪管理 |
| `灵素` | 价值素养 | 紫 `#A855F7` | 品格、文化认同、家国情怀 |
| `智素` | 认知素养 | 绿 `#22C55E` | 科学思维、学习能力、信息素养 |
| `行素` | 行动素养 | 蓝 `#3B82F6` | 行动规划、实践执行、劳动 |
| `交素` | 社交素养 | 橙 `#F97316` | 社交发起、合作沟通、倾听 |

---

## 六、工具函数详解

### `utils/search.js` — 搜索核心

| 函数 | 作用 |
|------|------|
| `detectBehaviorKeywords(text)` | 检测文本中的行为关键词 → `[{dim, min}]` |
| `withSearchText(loc)` | 预计算地点可搜索文本索引 |
| `scoreFilter(query, loc)` | 单点位搜索评分：返回 `{pass, score, reason}` |
| `getFilteredLocations(locations, filter)` | 综合筛选：搜索 + 维度 + 星级 + 问题 + 分类 + 专题 + 学段排序 |

评分优先级：行为关键词（1000）> 名称精确（300）> 区域类别（200）> 地址（150）> 内容子串（130）> 名称模糊（110）> 拆词（90）> 覆盖率（40）

### `utils/behavior.js` — 行为推荐核心

| 函数 | 作用 |
|------|------|
| `matchBehaviors(text)` | 匹配行为：精确 > 名称子串 > 别名 |
| `behaviorSubs(name)` | 获取行为目标子素养列表 |
| `recommend(text, opts)` | 完整推荐：行为 → 子素养 → 对症切片教案 |
| `recommendBySubLiteracy(text)` | 按子素养名直接匹配切片（行为未命中时的退路） |

### `utils/geo.js` — 地理工具

| 函数 | 作用 |
|------|------|
| `distKm(la1, lo1, la2, lo2)` | Haversine 两点球面距离（km） |
| `fmtKm(km)` | 距离格式化（<10km 保留 1 位小数） |

### `utils/util.js` — 通用工具

| 函数 | 作用 |
|------|------|
| `getDimColor(dim)` | 维度缩写 → 颜色 hex |
| `getDimLabel(dim)` | 维度缩写 → 中文标签 |
| `getDimClass(dim)` | 维度缩写 → WXSS 类名后缀（拼音） |
| `escHtml(str)` | HTML 转义（防 XSS） |

### `utils/tracker.js` — 行为采集

| 函数 | 作用 |
|------|------|
| `init()` | 初始化采集器（自动拦截页面生命周期） |
| `trackPageView(pagePath, extra)` | 记录页面访问 |
| `trackClick(pagePath, target, extra)` | 记录点击行为 |
| `trackStay(pagePath, duration)` | 记录停留时长 |
| `trackSearch(keyword, results)` | 记录搜索行为 |
| `trackCheckin(checkinData)` | 记录打卡行为 |
| `flush()` | 上报行为数据到云函数 |
| `getBehaviors(options)` | 获取用户行为数据 |

### `utils/assessment.js` — 六维素养评估

| 函数 | 作用 |
|------|------|
| `calculateSixDimScores(behaviors)` | 计算六维素养得分（0-100） |
| `calculateInitialScores(behaviors)` | 基于历史行为推断初始分数 |
| `updateScores(oldScores, newBehaviors)` | 更新分数（加权平均） |

### `utils/observation.js` — 观察期检查

| 函数 | 作用 |
|------|------|
| `shouldStartAssessment()` | 检查是否应该开始评估 |
| `getProgressMessage(progress, stats, userRole)` | 获取进度提示信息 |
| `getNextStepMessage(stats)` | 获取下一步提示信息 |

### `utils/report-generator.js` — 报告生成

| 函数 | 作用 |
|------|------|
| `generateReport(role, scores, behaviors, options)` | 生成报告（家长/学生/教师） |
| `formatDimensions(scores, style)` | 格式化维度数据 |

### `utils/radar-chart.js` — 雷达图绘制

| 函数 | 作用 |
|------|------|
| `drawRadarChart(ctx, scores, options)` | 绘制雷达图（原生Canvas） |
| `getDataPoints(scores, centerX, centerY, radius, dimCount, startAngle, angleStep)` | 获取数据点坐标 |

### `utils/pdf-export.js` — PDF导出

| 函数 | 作用 |
|------|------|
| `exportPDF(reportData, selectedCheckins)` | 导出PDF |
| `generateFileName(nickname, type)` | 生成文件名 |

### `utils/helper.wxs` — WXS 辅助

在 WXML 模板中直接调用的函数（`getDimColor` / `getDimLabel` / `getDimClass` / `getCatColor`），因为 WXML 不能直接调用 JS 模块。

---

## 七、数据构建脚本

### 核心构建链

```
scripts/input/docx_lines.txt    ← 《111点位切片全量库.docx》逐行提取
        ↓
scripts/build_data.js           → data/locations.js（111点/459切片/六维星级）
        ↓
scripts/build_behaviors.js      → data/behaviors.js（116行为映射）
scripts/build_sub_literacies.js → data/sub_literacies.js（100+子素养体系）
scripts/build_museum_slices.js  → data/museum_slices.js（三大博物馆精细切片）
```

### 数据校验与维护

| 脚本 | 作用 |
|------|------|
| `verify_e2e.js` | 端到端验证：点位数/切片数/星级范围/关键示例 |
| `verify_features.js` | 功能验证：搜索/推荐/导航链路 |
| `verify_search.js` | 搜索逻辑专项验证 |
| `reconcile_data.js` | 归档数据 vs 工作区数据差异对账 |
| `apply_verified_updates.js` | 应用已核实的物理信息（电话/时间/地址） |
| `add_fee_field.js` | 补充收费字段（从归档 sites_raw.json 合并） |
| `merge_museum_full.js` | 合并博物馆精细切片到主数据 |

### 重新生成数据

```bash
# 从 docx 文本重新构建 locations.js（需先准备好 input/docx_lines.txt）
node scripts/build_data.js

# 构建行为映射
node scripts/build_behaviors.js

# 构建子素养体系
node scripts/build_sub_literacies.js

# 运行端到端验证
node scripts/verify_e2e.js
```

---

## 八、云函数与数据库

### 云函数

| 函数 | 触发方式 | 功能 |
|------|---------|------|
| `login` | 小程序启动时调用 | 获取 openid + 自动创建 users 记录 |
| `addCheckin` | 打卡页提交 | 写入 checkins 集合（含照片上传） |
| `getCheckins` | 档案页加载 | 按 openid 查询打卡历史 |
| `savePlan` | 做方案页保存 | 存入 plans 集合 |
| `getPlans` | 做方案页加载 | 按 openid 查询已保存方案 |
| `saveBehavior` | 行为采集 | 保存用户行为数据 |
| `getBehaviors` | 档案页加载 | 获取用户行为数据 |
| `getClassStudents` | 教师档案页 | 获取班级学生数据 |
| `generatePDF` | PDF导出页 | 生成PDF报告 |

### 数据库集合

| 集合 | 用途 | 关键字段 |
|------|------|---------|
| `users` | 用户信息 | `_openid`, `nickname`, `avatar`, `role`, `class_id`, `created_at` |
| `checkins` | 打卡记录 | `_openid`, `point_id`, `point_name`, `behavior`, `rating`, `notes`, `photos[]`, `date` |
| `plans` | 保存的方案 | `_openid`, `plan_name`, `behaviors`, `points[]`, `created_at` |
| `behaviors` | 行为数据 | `_openid`, `type`, `page`, `target`, `timestamp`, `duration` |

---

## 九、组件详解

### `components/filter-sheet` — 筛选面板

底部弹出面板，包含：
- 搜索输入框
- 维度 chip 多选（6 个）
- 分类 chip 多选（11 个）
- 问题 chip 多选（74 个）
- 重置 / 查看结果按钮
- 意见反馈入口

通过 `bind:filterchange` 事件向父页面传递筛选条件对象 `{search, dims, issues, cats, starDims, stage, topics}`。

### `components/feedback-popup` — 反馈弹窗

简单的意见反馈表单弹窗。

### `components/observation-period` — 观察期进度条

显示观察期进度：
- 进度条（百分比）
- 已完成 X/5 次打卡
- 下一步提示
- 鼓励语

### `components/radar-chart` — 六维雷达图

使用原生Canvas绘制六维素养雷达图：
- 六个维度轴
- 数据区域填充
- 数据点标记
- 数值显示

### `components/report-card` — 报告卡片

展示报告内容：
- 标题
- 维度分数
- 进度条
- 鼓励语

---

## 十、本地运行

1. 下载 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 导入本项目目录（选择 `project.config.json` 所在目录）
3. 使用 AppID `wx20f82f75dc26f148` 登录（或使用测试号）
4. 如需云开发功能：在微信开发者工具中开通云开发，环境 ID 为 `cloud1-d5gyas9xgbb003681`
5. 部署云函数：右键每个云函数目录 → "上传并部署：云端安装依赖"
6. 编译运行

### 无云开发时的降级

云函数未部署时，小程序仍可正常运行（搜索/筛选/详情/附近/导航/行为推荐均可用），仅打卡/档案/方案保存功能不可用。`app.js` 中已做容错处理。

---

## 十一、给 AI 代理的快速索引

如果你是一个 AI 代理，需要快速理解或修改本项目：

| 你想做的事 | 看哪里 |
|-----------|--------|
| 理解数据结构 | `data/README.md` + `data/locations.js` 前 10 行注释 |
| 修改点位数据 | `data/locations.js`（直接编辑，或改 `scripts/input/docx_lines.txt` 后重跑 `build_data.js`） |
| 修改行为映射 | `data/behaviors.js` |
| 修改搜索逻辑 | `utils/search.js` 的 `scoreFilter()` |
| 修改推荐逻辑 | `utils/behavior.js` 的 `recommend()` |
| 修改筛选面板 | `components/filter-sheet/` |
| 修改首页 | `pages/index/` |
| 修改详情页 | `pages/detail/` |
| 修改附近页 | `pages/near/` |
| 修改行为寻课页 | `pages/recommend/` |
| 修改打卡功能 | `pages/checkin/` + `cloudfunctions/addCheckin/` |
| 修改成长档案 | `pages/profile/` + `cloudfunctions/getCheckins/` |
| 修改身份选择 | `pages/role-select/` + `data/user-roles.js` |
| 修改成长报告 | `pages/report/` + `utils/report-generator.js` |
| 修改PDF导出 | `pages/pdf-export/` + `cloudfunctions/generatePDF/` |
| 修改观察期逻辑 | `utils/observation.js` + `components/observation-period/` |
| 修改六维评估算法 | `utils/assessment.js` |
| 修改雷达图 | `utils/radar-chart.js` + `components/radar-chart/` |
| 修改行为采集 | `utils/tracker.js` |
| 添加新点位 | 在 `data/locations.js` 末尾添加，`id` 接续最大编号 +1 |
| 添加新行为 | 在 `data/behaviors.js` 中添加条目 |
| 重新生成全部数据 | `node scripts/build_data.js`（需 `input/docx_lines.txt`） |
| 验证数据完整性 | `node scripts/verify_e2e.js` |
| 对账归档数据 | `node scripts/reconcile_data.js` |

---

## 十二、关键设计决策

1. **数据全部内嵌**：`locations.js` / `behaviors.js` 等通过 `require()` 加载，无需网络请求，首次打开即完整可用。
2. **纯函数搜索/推荐**：`search.js` / `behavior.js` 是纯函数，可被页面和测试脚本共用，无副作用。
3. **六维 1-3 星体系**：星级为定性映射（★★★ 核心 / ★★ 显著 / ★ 一般），非精确评分，基于点位类型 + 教育功能推断。
4. **四段教案**：每个切片含 `pre`（行前）/ `talk`（路上）/ `act`（到馆）/ `post`（返程）四段式行程设计。
5. **云开发可选**：核心功能不依赖云开发，仅打卡/档案/方案保存需要云函数支持。
6. **自定义导航**：所有页面使用自定义导航栏（`navigationStyle: custom`），统一标题样式。
7. **观察期机制**：首次使用需完成 5 次打卡才能生成成长报告，避免给孩子贴标签。
8. **角色化报告**：家长/学生/教师三种角色，报告风格不同。
9. **本地存储优先**：打卡数据同时保存到云数据库和本地存储，云函数未部署时仍可使用。

---

## 十三、数据规模

| 指标 | 数量 |
|------|------|
| 教育基地（点位） | 111 个 |
| 教育切片 | 459 个 |
| 行为映射 | 116 种 |
| 子素养体系 | 100+ 项 |
| 行政区覆盖 | 10 个区旗县 |
| 点位分类 | 11 类 |
| 孩子问题条目 | 74 种 |
| 博物馆精细切片 | 63 个（3 大博物馆） |
| 红色研学切片 | 专用切片库 |
