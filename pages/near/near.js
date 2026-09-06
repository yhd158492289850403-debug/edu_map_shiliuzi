/**
 * 附近页 - 距离与导航
 */
const { LOCATIONS } = require('../../data/locations');
const { DIM_ORDER, DIM_LABELS } = require('../../data/dimensions');
const { getDimColor, getDimLabel } = require('../../utils/util');
const { distKm, fmtKm } = require('../../utils/geo');

Page({
  data: {
    statusBarHeight: 44,
    located: false,
    locating: false,
    loc: null,           // {lat, lng}
    radius: 5,           // km
    radiusText: '5km',
    radiusTabs: [{ val: 2, t: '2km' }, { val: 3, t: '3km' }, { val: 5, t: '5km' }, { val: 10, t: '10km' }, { val: 100, t: '不限' }],
    activeDim: '',
    dims: DIM_ORDER.map(d => ({ key: d, label: DIM_LABELS[d] || d, color: getDimColor(d), active: false })),
    list: [],
    total: 0,
    kw: ''
  },

  onLoad() {
    const windowInfo = wx.getWindowInfo();
    this.setData({ statusBarHeight: windowInfo.statusBarHeight || 44 });
    this.allPoints = LOCATIONS.map(loc => ({
      id: loc.id, n: loc.n, d: loc.d, a: loc.a, c: loc.c, fee: loc.fee,
      p: loc.p, h: loc.h, lat: loc.lat, lng: loc.lng,
      ld: loc.ld, md: loc.md, ad: loc.ad, stars: loc.stars
    }));
    this.autoLocate();
  },

  autoLocate() {
    this.setData({ locating: true });
    const self = this;
    wx.getLocation({
      type: 'gcj02',
      success(res) {
        self.setData({ loc: { lat: res.latitude, lng: res.longitude }, located: true, locating: false });
        self.refresh();
      },
      fail() {
        // 定位失败：显示全部点位（无距离排序），用户仍可浏览
        self.setData({ located: false, locating: false });
        self.refresh(); // 显示全部点位
        wx.showToast({ title: '定位失败，显示全部点位', icon: 'none' });
      }
    });
  },

  onLocate() { this.autoLocate(); },

  onRadius(e) {
    const idx = e.currentTarget.dataset.idx;
    const r = this.data.radiusTabs[idx];
    this.setData({ radius: r.val, radiusText: r.t });
    this.refresh();
  },

  onDimTap(e) {
    const dim = e.currentTarget.dataset.dim;
    const activeDim = this.data.activeDim === dim ? '' : dim;
    const dims = this.data.dims.map(d => ({ ...d, active: d.key === activeDim }));
    this.setData({ activeDim, dims });
    this.refresh();
  },

  onKw(e) {
    this.setData({ kw: e.detail.value });
    this.refresh();
  },

  refresh() {
    const { loc, radius, activeDim, kw } = this.data;
    let list = this.allPoints.map(p => {
      const dist = loc ? distKm(loc.lat, loc.lng, p.lat, p.lng) : null;
      return { ...p, dist };
    });

    // 有定位时按半径过滤；无定位时显示全部（按名称排序）
    if (loc) {
      list = list.filter(p => p.dist != null && p.dist <= radius);
    }
    // 维度过滤
    if (activeDim) list = list.filter(p => (p.ad || []).includes(activeDim));
    // 文本搜索
    if (kw) {
      const q = kw.toLowerCase();
      list = list.filter(p => (p.n + p.d + p.c).toLowerCase().includes(q));
    }
    // 排序：有距离按距离，无定位按名称
    if (loc) {
      list.sort((a, b) => (a.dist == null ? 1e9 : a.dist) - (b.dist == null ? 1e9 : b.dist));
    } else {
      list.sort((a, b) => a.n.localeCompare(b.n, 'zh'));
    }
    list = list.map(p => ({
      ...p,
      dimTags: (p.ad || []).slice(0, 3).map(d => ({ label: getDimLabel(d), color: getDimColor(d) })),
      distText: fmtKm(p.dist)
    }));
    this.setData({ list, total: list.length });
  },

  onNav(e) {
    const p = e.currentTarget.dataset.p;
    wx.openLocation({
      latitude: p.lat, longitude: p.lng, name: p.n, address: p.a || p.d, scale: 16
    });
  },

  onCardTap(e) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}` });
  },

  onBack() {
    wx.navigateBack({ fail: () => wx.reLaunch({ url: '/pages/index/index' }) });
  },

  onShareAppMessage() {
    return { title: '附近素养教育基地 - 石榴籽成长快乐导引地图', path: '/pages/near/near' };
  }
});
