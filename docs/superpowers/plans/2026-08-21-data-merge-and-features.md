# 数据融合 + 功能整合 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将归档 `D:\desk\素养导引地图_全量源码归档（永恒）` 的**数据**与**功能**融合进当前小程序工作区 `D:\AI_agent_workspace`，保证数据全面、功能完整。数据融合以工作区 `locations.js` 为点位/切片主体，以归档 `delivery_data.json` 为行为→子素养→切片索引与子素养体系主体；功能移植归档缺失的 4 大页面（找素养 / 附近 / 做方案 / 点位库）。

**Architecture:** 数据模型 = 工作区点位切片模型（`slices`/`stars`/六维）为主 + 归档行为→子素养映射 + 105 项子素养体系 + 三大博物馆精细切片。功能 = 沿用工作区现有组件/样式框架新增 4 个 tabBar 页面。

**Tech Stack:** 微信小程序原生（无框架）、Node.js（数据对账/构建/校验脚本）、微信 WXML/WXSS。

## 事实基线（已核实）

### 工作区（主体）
- `data/locations.js` = **111 点位 + 459 教育切片**，结构 `id,n,d,a,c,v,ld,md,ad,g,ac,is,co,h,p,lat,lng,stars,ver,type,sliceCount,slices`。
- 六维：体素/心素/灵素/智素/行素/交素；`data/issues.js`（问题→维度）。
- UI 已具备：地图+卡片、多维筛选、详情页切片点读。
- 子素养名（切片内 `subs`）：**67 个**。

### 归档（融合源）
- `delivery_data.json`：`meta{111点位/133切片/116行为/68子素养} + sites[111] + slices[133] + behavior_map(116行为→子素养+场景+引导) + behavior_slice_index(行为→切片)`。
- 中国版 **105 项子素养**体系（身体/情绪/价值/认知/行动/社交 6 维度）。
- 行为检索**联想词表**（`顶嘴/逆反/磨蹭/拖延…`）。
- 物理信息：`sites_raw.json` 仅 **6 点位**确证 address/hours/phone；`_geo_table.json` = **51 处**坐标表。
- 三大博物馆精细切片库（包头/敕勒川/黄河谣）：**63 个** ABC 故事化·身心化·生活化深度切片，字段命名与工作区不同。
- 子素养名：**85 个**；其中 **18 个在工作区切片缺失**：利他关怀 / 启动执行 / 恭敬礼让 / 情绪恢复力 / 时间管理 / 条理整理 / 理解监控 / 礼仪规范 / 积极情绪培育 / 自我效能 / 自我检查 / 边界感 / 谦逊 / 节制 / 公德心 / 反思 / 健康习惯 / 体态意识。

## 阶段 0 · 数据对账（先做）
- [ ] 对账点位名/切片名，产出《融合对账报告》：两库点位、切片、子素养各自重复/互缺。
- [ ] 建立映射字典：归档行为名 ↔ 工作区 `issues.js` 问题；归档子素养名(情绪/认知…) ↔ 工作区维度(心素/智素…)。

## 阶段 1 · 数据融合
- [ ] 以工作区 `locations.js` 为主，补入归档独有切片（含 18 个缺失子素养切片）与三大博物馆精细切片。
- [ ] 回填 6 个确证物理信息 + `_geo_table.json` 51 处坐标（未确证保持"待补充"）。
- [ ] 新增 `data/behaviors.js`（116 行为→子素养映射 + 联想词 + 场景/引导）。
- [ ] 新增 `data/sub_literacies.js`（105 项子素养体系，6 维归类）。
- [ ] 对齐 `data/dimensions.js` 维度命名。

## 阶段 2 · 功能移植（沿用工作区框架）
- [ ] `pages/literacy/` 找素养：行为→子素养→对症切片点读（带联想词）。
- [ ] `pages/near/` 附近：定位→半径/维度过滤→距离排序→导航。
- [ ] `pages/plan/` 做方案：1-3 子素养 + 时长/区域/收费约束 → ★★★ 点位方案。
- [ ] `pages/points/` 点位库：检索+导航（复用 detail 逻辑）。
- [ ] `app.json` tabBar 调整为 4 tab（找素养/附近/做方案/点位库）。

## 阶段 3 · 校验回归
- [ ] 校验融合后：111 点位、切片完整、116 行为→切片 0 空缺、105 子素养覆盖、坐标/星级完整。
- [ ] 回归 `verify_search.js` / `verify_e2e.js`（"顶嘴/磨蹭"链路）。

## 产出物
- 本计划落地版（含融合对账报告）
- `data/locations.js`（融合）、`data/behaviors.js`、`data/sub_literacies.js`
- `pages/literacy|near|plan|points/` + `app.json` tabBar
- `scripts/` 构建/校验脚本更新

## 风险与注意
- 物理信息仅 6 确证，其余保留"待补充"。
- 归档行为名(口语)与工作区问题(表述)措辞不同 → 需映射字典，防止检索缺失。
- 三大博物馆切片字段别名需映射后再并入，勿破坏现行地图/筛选/详情页。
