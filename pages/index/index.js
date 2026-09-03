/**
 * 首页 - 石榴籽成长快乐导引地图
 */
const { LOCATIONS } = require('../../data/locations');
const { DIMENSIONS, DIM_ORDER, DIM_LABELS } = require('../../data/dimensions');
const { ISSUE_DIM_MAP } = require('../../data/issues');
const { getDimColor, getDimLabel, getDimClass } = require('../../utils/util');
const { detectBehaviorKeywords, withSearchText, getFilteredLocations: applyFilters } = require('../../utils/search');
const { recommend } = require('../../utils/behavior');
const { DIMENSION_SUBS, SUB_LITERACIES } = require('../../data/sub_literacies');
const { BEHAVIORS } = require('../../data/behaviors');
const tracker = require('../../utils/tracker');

// 从地点数据中提取唯一分类
const ALL_CATEGORIES = [...new Set(LOCATIONS.map(l => l.c).filter(Boolean))].sort();

// 构建层级折叠所需数据：每个子素养 → 行为列表（name, sliceCount）
const subsToBehaviors = {};
const subLiteraciesByDim = {}; // { 体素: [子素养名,...] }
for (const dimKey of Object.keys(DIMENSION_SUBS)) {
  const subs = DIMENSION_SUBS[dimKey].filter(sub => {
    // 只保留有行为映射的子素养
    const matching = Object.entries(BEHAVIORS).filter(([_, b]) => b.subs.includes(sub));
    if (matching.length > 0) {
      (subsToBehaviors[sub] = subsToBehaviors[sub] || []).push(
        ...matching.map(([name, b]) => ({ name, sliceCount: b.sliceCount || 0, dimKey }))
      );
    }
    return matching.length > 0;
  });
  subLiteraciesByDim[dimKey] = subs;
}

Page({
  data: {
    view: 'map',
    latitude: 40.66,
    longitude: 109.88,
    scale: 11,
    markers: [],
    showEmptyHint: false,

    filter: { search: '', dims: [], issues: [], cats: [], starDims: [], topics: [] },
    searchValue: '',
    filterBadge: 0,

    cardItems: [],
    resultCount: 0,

    // 方案A：选中行为后内嵌的教案推荐
    behaviorRecs: [],
    selectedBehaviorLabel: '', // 如 "顶嘴 → 情绪调节/共情回应/协商与冲突解决"

    showFilterSheet: false,
    showFeedback: false,

    // 层级折叠数据（传入 filter-sheet 组件）
    subLiteraciesByDim,
    subsToBehaviors,

    statusBarHeight: 44,
  },

  onLoad() {
    const windowInfo = wx.getWindowInfo();
    const sb = windowInfo.statusBarHeight || 44;
    this.setData({ statusBarHeight: sb, searchTop: sb + 50 });
    // 预计算每点的可搜索文本（含教育切片内容），供搜索评分使用
    this.allLocations = LOCATIONS.map(withSearchText);
    this.refreshAll();
  },

  onReady() {
    this.mapCtx = wx.createMapContext('mainMap');
  },

  // ===== 核心数据刷新 =====
  refreshAll() {
    const filtered = this.getFilteredLocations();
    this.updateMarkers(filtered);
    this.updateCardItems(filtered);
    this.updateBehaviorRecs();
    this.updateFilterBadge();
  },

  // ===== 行为推荐（方案A：内嵌卡片视图，不跳转） =====
  updateBehaviorRecs() {
    const q = this.data.filter.search || '';
    const recs = recommend(q, { limit: 3 });
    this.setData({ behaviorRecs: recs });
  },

  onBehaviorSelect(e) {
    const { behaviors } = e.detail || {};
    if (!behaviors || behaviors.length === 0) return;
    // 关闭筛选面板，跳转到行为寻课页，传递所有已选行为（逗号分隔）
    this.setData({ showFilterSheet: false });
    const query = behaviors.map(b => encodeURIComponent(b)).join(',');
    wx.navigateTo({ url: `/pages/recommend/recommend?behaviors=${query}` });
  },

  clearBehaviorRecs() {
    this.setData({ behaviorRecs: [], selectedBehaviorLabel: '' });
  },

  onRecSliceTap(e) {
    const recIdx = e.currentTarget.dataset.rec;
    const resIdx = e.currentTarget.dataset.res;
    const rec = this.data.behaviorRecs[recIdx];
    if (!rec || !rec.matchedSlices[resIdx]) return;
    const s = rec.matchedSlices[resIdx];
    wx.navigateTo({ url: `/pages/detail/detail?id=${s.pointId}` });
  },

  getFilteredLocations() {
    const app = getApp();
    const stage = (app && app.globalData.stage) || '全部';
    const filter = { ...this.data.filter, stage };
    return applyFilters(this.allLocations, filter);
  },

  updateMarkers(filtered) {
    const markers = filtered.map(loc => ({
      id: loc.id,
      latitude: loc.lat,
      longitude: loc.lng,
      iconPath: `/images/markers/marker-${loc.ld}.png`,
      width: 28,
      height: 28,
      label: {
        content: loc.n.substring(0, 6) + (loc.n.length > 6 ? '..' : ''),
        color: '#fff',
        fontSize: 10,
        bgColor: getDimColor(loc.ld),
        borderRadius: 4,
        padding: 2,
        textAlign: 'center'
      }
    }));
    this.setData({
      markers,
      showEmptyHint: markers.length === 0,
      resultCount: filtered.length
    });
  },

  updateCardItems(filtered) {
    const cardItems = filtered.map(loc => ({
      ...loc,
      dimTags: (loc.ad || []).map(d => ({
        key: d,
        label: getDimLabel(d),
        colorClass: `dim-tag-${getDimClass(d)}`,
        barClass: `bar-${getDimClass(d)}`
      })),
      starsDisplay: loc.stars ? DIM_ORDER.filter(d => loc.stars[d] >= 2).map(d => ({
        dim: d,
        label: getDimLabel(d),
        stars: loc.stars[d],
        starStr: '★'.repeat(loc.stars[d]),
        color: getDimColor(d)
      })) : [],
      descShort: loc.v ? (loc.v.length > 70 ? loc.v.substring(0, 70) + '...' : loc.v) : '',
      hoursShort: loc.h || ''
    }));
    this.setData({
      cardItems,
      resultCount: filtered.length
    });
  },

  updateFilterBadge() {
    const f = this.data.filter;
    const count = f.dims.length + f.issues.length + f.cats.length + f.starDims.length + (f.topics || []).length + (f.search ? 1 : 0);
    this.setData({ filterBadge: count });
  },

  // ===== 视图切换 =====
  toggleView() {
    const newView = this.data.view === 'map' ? 'card' : 'map';
    this.setData({ view: newView });
    if (newView === 'card') {
      this.refreshAll();
    }
  },

  // ===== 地图事件 =====
  onMapMarkerTap(e) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${e.markerId}` });
  },

  // ===== 卡片事件 =====
  onCardTap(e) {
    const id = e.currentTarget.dataset.id;
    // 记录点击行为
    tracker.trackClick('index', 'location_card', { locationId: id });
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  // ===== 筛选面板 =====
  openFilterSheet() {
    this.setData({ showFilterSheet: true });
  },

  closeFilterSheet() {
    this.setData({ showFilterSheet: false });
  },

  onFilterChange(e) {
    const filter = e.detail;
    // 检测搜索文本中的行为关键词，自动设置星级条件（用于行为推荐）
    let starDims = filter.starDims || [];
    if (filter.search && starDims.length === 0) {
      const keywordHits = detectBehaviorKeywords(filter.search);
      if (keywordHits.length > 0) starDims = keywordHits;
    }
    if (!filter.search) starDims = [];
    const dims = filter.dims || [];
    // 维度芯片状态：active = 勾选了该维度（按 ad 涉及维度筛选）
    const dimsData = DIM_ORDER.map(d => {
      const on = dims.includes(d);
      const onStar = starDims.find(s => s.dim === d);
      return {
        key: d,
        label: DIM_LABELS[d] || d,
        color: (DIMENSIONS[d] || {}).color || '#999',
        active: on,
        star: onStar ? onStar.min : 0,
        starStr: onStar ? '★'.repeat(onStar.min) : ''
      };
    });
    const issuesData = Object.keys(ISSUE_DIM_MAP).map(i => ({
      key: i,
      label: i,
      checked: filter.issues.includes(i)
    }));
    const catsData = ALL_CATEGORIES.map(c => ({
      key: c,
      label: c,
      active: filter.cats.includes(c)
    }));
    this.setData({
      filter: { ...filter, dims, starDims, topics: filter.topics || [] },
      searchValue: filter.search,
      dimsData,
      issuesData,
      catsData
    }, () => this.refreshAll());
  },

  onFilterReset() {
    this.onFilterChange({
      detail: { search: '', dims: [], issues: [], cats: [], starDims: [], topics: [] }
    });
  },

  // ===== 筛选标签移除 =====
  onDimTagRemove(e) {
    const dim = e.currentTarget.dataset.dim;
    const dims = this.data.filter.dims.filter(d => d !== dim);
    this.onFilterChange({ detail: { ...this.data.filter, dims } });
  },

  onIssueTagRemove(e) {
    const issue = e.currentTarget.dataset.issue;
    const issues = this.data.filter.issues.filter(i => i !== issue);
    this.onFilterChange({ detail: { ...this.data.filter, issues } });
  },

  onCatTagRemove(e) {
    const cat = e.currentTarget.dataset.cat;
    const cats = this.data.filter.cats.filter(c => c !== cat);
    this.onFilterChange({ detail: { ...this.data.filter, cats } });
  },

  onStarDimTagRemove(e) {
    const dim = e.currentTarget.dataset.dim;
    const starDims = this.data.filter.starDims.filter(sd => sd.dim !== dim);
    this.onFilterChange({ detail: { ...this.data.filter, starDims } });
  },

  onTopicTagRemove(e) {
    const topic = e.currentTarget.dataset.topic;
    const topics = (this.data.filter.topics || []).filter(t => t !== topic);
    this.onFilterChange({ detail: { ...this.data.filter, topics } });
  },

  // ===== 搜索（统一入口：地点/行为/子素养/教案） =====
  onSearchInput(e) {
    const search = e.detail.value;
    // 检测行为关键词，自动转换为星级条件
    const keywordHits = detectBehaviorKeywords(search);
    let starDims;
    if (!search.trim()) {
      starDims = [];
    } else if (keywordHits.length > 0) {
      starDims = keywordHits;
    } else {
      starDims = this.data.filter.starDims;
    }
    const payload = { ...this.data.filter, search, starDims };
    // 有输入时自动切到卡片视图，同时展示地点结果与行为教案推荐
    const set = { searchValue: search, filter: payload, view: search.trim() ? 'card' : 'map' };
    // 若从键盘输入（非无意义字符），保持卡片视图
    this.setData(set, () => this.refreshAll());
    
    // 记录搜索行为
    if (search.trim()) {
      tracker.trackSearch(search, this.data.resultCount);
    }
  },

  onSearchConfirm(e) {
    // 确认搜索：行为/子素养类关键词，跳转行为寻课页获得教案推荐
    wx.navigateTo({ url: '/pages/recommend/recommend' });
  },

  onSearchClear() {
    this.onSearchInput({ detail: { value: '' } });
  },

  // ===== 反馈 =====
  openFeedback() {
    this.setData({ showFeedback: true });
  },
  closeFeedback() {
    this.setData({ showFeedback: false });
  },

  // ===== 转发 =====
  onShareAppMessage() {
    return {
      title: '石榴籽成长快乐导引地图 - 让每一个孩子找到属于自己的成长快乐',
      path: '/pages/index/index'
    };
  },

  goNear() {
    wx.navigateTo({ url: '/pages/near/near' });
  },
  goRecommend() {
    wx.navigateTo({ url: '/pages/recommend/recommend' });
  },
  goProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' });
  }
});
