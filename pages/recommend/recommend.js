/**
 * 行为寻课页 - 行为 → 子素养 → 对症教案 完整链路
 */
const { recommend, matchBehaviors } = require('../../utils/behavior');
const { getDimColor } = require('../../utils/util');

Page({
  data: {
    statusBarHeight: 44,
    kw: '',
    empty: false,
    // 结果
    recs: [],           // [{behavior, subs, guide, scene, matchedSlices:[...]}]
    activeRec: 0,       // 当前展开的教案切片 index（全局）
    activeSlice: null,  // 当前展开展示的切片教案
    hotBehaviors: ['顶嘴', '磨蹭', '怕黑', '挑食', '不爱运动', '沉迷手机', '逆反', '害羞', '撒谎', '不专注']
  },

  onLoad(options) {
    const windowInfo = wx.getWindowInfo();
    this.setData({ statusBarHeight: windowInfo.statusBarHeight || 44 });

    // 多选行为（从筛选面板跳转）
    if (options.behaviors) {
      const behaviors = options.behaviors.split(',').map(b => decodeURIComponent(b)).filter(Boolean);
      if (behaviors.length > 0) {
        this.setData({ kw: behaviors.join(' ') });
        this.doMultiSearch(behaviors);
        return;
      }
    }
    // 单个行为（从分享链接/热门标签跳转）
    if (options.behavior) {
      this.setData({ kw: decodeURIComponent(options.behavior) });
      this.doSearch();
    }
  },

  onShow() {
    // 始终启用右上角胶囊菜单的分享入口
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  onKw(e) { this.setData({ kw: e.detail.value }); },

  onHot(e) {
    const b = e.currentTarget.dataset.b;
    this.setData({ kw: b });
    this.doSearch();
  },

  onSearch() { this.doSearch(); },
  onClear() { this.setData({ kw: '', recs: [], empty: false, activeSlice: null }); },

  doSearch() {
    const kw = (this.data.kw || '').trim();
    if (!kw) { this.setData({ empty: false, recs: [] }); return; }
    const recs = recommend(kw, { limit: 6 }).map(r => ({
      behavior: r.behavior,
      scene: r.scene,
      guide: r.guide,
      subs: r.subs,
      matchedSlices: r.matchedSlices.map(s => ({ ...s, _expanded: false }))
    }));
    this.setData({ recs, empty: recs.length === 0 });
  },

  // 多行为整合搜索：对每个行为分别推荐，合并去重
  doMultiSearch(behaviors) {
    const seen = new Set();
    const allRecs = [];
    for (const beh of behaviors) {
      const recs = recommend(beh, { limit: 4 });
      for (const r of recs) {
        // 去重：同一行为不重复
        if (seen.has(r.behavior)) continue;
        seen.add(r.behavior);
        allRecs.push({
          behavior: r.behavior,
          scene: r.scene,
          guide: r.guide,
          subs: r.subs,
          matchedSlices: r.matchedSlices.map(s => ({ ...s, _expanded: false }))
        });
      }
    }
    this.setData({ recs: allRecs, empty: allRecs.length === 0 });
  },

  onBack() {
    wx.navigateBack({ fail: () => wx.reLaunch({ url: '/pages/index/index' }) });
  },

  onSliceTap(e) {
    const g = e.currentTarget.dataset.g;
    const si = e.currentTarget.dataset.s;
    const rec = this.data.recs[g];
    if (!rec || !rec.matchedSlices[si]) return;

    const isExpanding = !rec.matchedSlices[si]._expanded;

    // Toggle expansion for this slice
    const updatedRecs = [...this.data.recs];
    const updatedSlices = updatedRecs[g].matchedSlices.map((s, idx) => ({
      ...s,
      _expanded: idx === si ? !s._expanded : false
    }));
    updatedRecs[g] = { ...updatedRecs[g], matchedSlices: updatedSlices };
    this.setData({ recs: updatedRecs });

    // 展开教案时，启用右上角胶囊菜单的分享入口
    if (isExpanding) {
      this._shareData = {
        behavior: rec.behavior,
        subs: rec.subs,
        guide: rec.guide,
        scene: rec.scene,
        slices: rec.matchedSlices.map(s => ({
          title: s.title, point: s.point, pointId: s.pointId, age: s.age,
          edu: s.edu, pre: s.pre, talk: s.talk, act: s.act, post: s.post
        }))
      };
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      });
    }
  },

  onGoDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (id != null) wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },

  onCheckinFromSlice(e) {
    const g = e.currentTarget.dataset.g;
    const si = e.currentTarget.dataset.s;
    const rec = this.data.recs[g];
    if (!rec || !rec.matchedSlices[si]) return;
    const slice = rec.matchedSlices[si];
    const params = [
      `point_id=${slice.pointId}`,
      `behavior=${encodeURIComponent(rec.behavior)}`
    ].join('&');
    wx.navigateTo({ url: `/pages/checkin/checkin?${params}` });
  },

  // 微信官方「转发给朋友」
  onShareAppMessage() {
    const d = this._shareData;
    if (!d) {
      return {
        title: '行为寻课 - 输入孩子行为，找到对症教育教案',
        path: '/pages/recommend/recommend'
      };
    }
    const top3 = d.slices.slice(0, 3).map(s => s.title).join('、');
    const suffix = d.slices.length > 3 ? `等${d.slices.length}个教案` : '';
    return {
      title: `「${d.behavior}」的教育方案：${d.subs.join('、')}`,
      path: `/pages/recommend/recommend?behavior=${encodeURIComponent(d.behavior)}`,
      // 小程序卡片描述（最多两行）
      desc: `${top3}${suffix}`
    };
  },

  // 微信官方「分享到朋友圈」
  onShareTimeline() {
    const d = this._shareData;
    if (!d) {
      return {
        title: '行为寻课 - 孩子行为对症教育教案',
        query: ''
      };
    }
    return {
      title: `孩子「${d.behavior}」怎么办？${d.subs.join('、')}对症教案`,
      query: `behavior=${encodeURIComponent(d.behavior)}`
    };
  }
});
