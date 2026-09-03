/**
 * 详情页
 */
const { LOCATIONS } = require('../../data/locations');
const { DIMENSIONS, DIM_LABELS, DIM_ORDER } = require('../../data/dimensions');
const { getDimColor, getDimLabel } = require('../../utils/util');
const tracker = require('../../utils/tracker');

Page({
  data: {
    location: null,
    dimTags: [],
    barColors: [],
    sliceGroups: [],
    expandedSlice: null,
    statusBarHeight: 44
  },

  onLoad(options) {
    const windowInfo = wx.getWindowInfo();
    const id = parseInt(options.id);
    const loc = LOCATIONS.find(l => l.id === id);
    if (!loc) {
      wx.showToast({ title: '地点未找到', icon: 'none' });
      wx.navigateBack();
      return;
    }

    // 获取当前学段
    const app = getApp();
    const stage = (app && app.globalData.stage) || '全部';
    const AGE_STAGE_MAP = { '6-12岁': '小学', '12-15岁': '初中', '15-18岁': '高中' };

    // 预处理维度标签
    const dimTags = (loc.ad || []).map(d => ({
      key: d,
      label: getDimLabel(d),
      color: getDimColor(d)
    }));

    // 维度条
    const barColors = (loc.ad || []).map(d => getDimColor(d));

    // 点位级六维星级（六维全展示，0 或缺省显示空）
    const pointStars = DIM_ORDER.map(d => ({
      dim: d,
      label: getDimLabel(d),
      color: getDimColor(d),
      starStr: (loc.stars && loc.stars[d]) ? '★'.repeat(loc.stars[d]) : '☆'.repeat(0),
      n: (loc.stars && loc.stars[d]) || 0,
      inAd: (loc.ad || []).includes(d)
    }));

    // 教育切片：按六维顺序分组，预处理子素养与星级
    // 学段优先：选了学段后，对应学段切片排前面并标"推荐"，其余标"进阶"
    const sliceGroups = DIM_ORDER.map(dim => {
      let slices = (loc.slices || [])
        .filter(s => s.dimKey === dim)
        .map(s => {
          const sliceStage = AGE_STAGE_MAP[s.age] || '';
          const isRecommended = stage !== '全部' && sliceStage === stage;
          return {
            ...s,
            subsTxt: (s.subs || []).join(' / '),
            starStr: s.stars && s.stars[dim] ? '★'.repeat(s.stars[dim]) : '',
            starItems: DIM_ORDER
              .filter(d => s.stars && (s.stars[d] || 0) > 0)
              .map(d => ({
                dim: d,
                label: getDimLabel(d),
                n: s.stars[d],
                starStr: '★'.repeat(s.stars[d]),
                color: getDimColor(d)
              })),
            stageLabel: isRecommended ? '推荐' : (stage !== '全部' ? '进阶' : ''),
            isRecommended,
            sliceStage
          };
        });
      // 排序：推荐的在前
      if (stage !== '全部') {
        slices.sort((a, b) => (b.isRecommended ? 1 : 0) - (a.isRecommended ? 1 : 0));
      }
      return { dim, dimLabel: DIM_LABELS[dim] || dim, color: getDimColor(dim), slices };
    }).filter(g => g.slices.length > 0);

    this.setData({
      location: loc,
      dimTags,
      barColors,
      pointStars,
      sliceGroups,
      currentStage: stage,
      statusBarHeight: windowInfo.statusBarHeight || 44
    });
    
    // 记录查看的切片
    const viewedSlices = (loc.slices || []).map(s => ({
      title: s.title,
      dimKey: s.dimKey,
      subs: s.subs
    }));
    tracker.trackPageView('detail', {
      locationId: loc.id,
      viewedSlices
    });
  },

  onSliceTap(e) {
    const gIdx = e.currentTarget.dataset.g;
    const iIdx = e.currentTarget.dataset.i;
    const group = this.data.sliceGroups[gIdx];
    if (!group) return;
    const s = group.slices[iIdx];
    if (!s) return;
    
    // 记录点击行为
    tracker.trackClick('detail', 'slice', {
      sliceIndex: iIdx,
      sliceTitle: s.title,
      dimKey: s.dimKey
    });
    
    // 切换展开/收起
    const isExpanding = !(this.data.expandedSlice && this.data.expandedSlice.gIdx === gIdx && this.data.expandedSlice.iIdx === iIdx);
    
    this.setData({
      expandedSlice: isExpanding ? {
        gIdx,
        iIdx,
        title: s.title,
        loc: s.loc,
        age: s.age,
        edu: s.edu,
        pre: s.pre,
        talk: s.talk,
        act: s.act,
        post: s.post,
        starItems: s.starItems
      } : null
    });
  },

  onBack() {
    wx.navigateBack();
  },

  onNav() {
    const loc = this.data.location;
    if (!loc || loc.lat == null || loc.lng == null) return;
    wx.openLocation({
      latitude: loc.lat,
      longitude: loc.lng,
      name: loc.n,
      address: loc.a || loc.d,
      scale: 16
    });
  },

  onShareAppMessage() {
    const loc = this.data.location;
    if (!loc) return {};
    return {
      title: `${loc.n} - 石榴籽成长快乐导引地图`,
      path: `/pages/detail/detail?id=${loc.id}`
    };
  }
});
