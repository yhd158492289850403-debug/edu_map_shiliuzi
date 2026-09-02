/**
 * 个人档案页 - 展示用户信息、打卡记录、成长轨迹
 */
const app = getApp();

Page({
  data: {
    statusBarHeight: 44,
    userInfo: null,
    checkins: [],
    loading: true,
    stage: '全部',
    stats: {
      totalCheckins: 0,
      totalPoints: 0,
      totalBehaviors: 0,
      streak: 0
    }
  },

  onLoad() {
    const windowInfo = wx.getWindowInfo();
    const stage = (app && app.globalData.stage) || '全部';
    this.setData({ statusBarHeight: windowInfo.statusBarHeight || 44, stage });
    this.loadUserInfo();
    this.loadCheckins();
  },

  onShow() {
    // Refresh data when page shows (e.g., after adding new checkin)
    this.loadCheckins();
  },

  async loadUserInfo() {
    try {
      // Get user info from cloud
      const db = wx.cloud.database();
      const { data } = await db.collection('users').where({
        _openid: '{openid}'
      }).get();

      if (data.length > 0) {
        this.setData({ userInfo: data[0] });
      } else {
        // First time user - create profile
        this.setData({
          userInfo: {
            nickname: '未设置昵称',
            avatar: '',
            created_at: new Date()
          }
        });
      }
    } catch (err) {
      console.error('Failed to load user info:', err);
      this.setData({ userInfo: { nickname: '未登录', avatar: '' } });
    }
  },

  async loadCheckins() {
    try {
      this.setData({ loading: true });
      const db = wx.cloud.database();
      const { data } = await db.collection('checkins')
        .where({ _openid: '{openid}' })
        .orderBy('date', 'desc')
        .limit(50)
        .get();

      // Calculate stats
      const uniquePoints = new Set(data.map(c => c.point_id));
      const uniqueBehaviors = new Set(data.map(c => c.behavior));
      const streak = this.calculateStreak(data);

      this.setData({
        checkins: data,
        stats: {
          totalCheckins: data.length,
          totalPoints: uniquePoints.size,
          totalBehaviors: uniqueBehaviors.size,
          streak
        },
        loading: false
      });
    } catch (err) {
      console.error('Failed to load checkins:', err);
      this.setData({ loading: false });
    }
  },

  calculateStreak(checkins) {
    if (checkins.length === 0) return 0;

    const dates = checkins.map(c => {
      const d = new Date(c.date);
      return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    });

    const uniqueDates = [...new Set(dates)].sort().reverse();
    let streak = 1;

    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const current = new Date(uniqueDates[i]);
      const prev = new Date(uniqueDates[i + 1]);
      const diff = (current - prev) / (1000 * 60 * 60 * 24);

      if (diff === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  },

  onStageChange(e) {
    const stage = e.currentTarget.dataset.stage;
    this.setData({ stage });
    if (app) app.globalData.stage = stage;
    wx.showToast({ title: '已切换为' + stage, icon: 'none', duration: 1000 });
  },

  onCheckin(e) {
    wx.navigateTo({ url: '/pages/checkin/checkin' });
  },

  onCheckinDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/checkin/checkin?id=${id}` });
  },

  onBack() {
    wx.navigateBack({ fail: () => wx.reLaunch({ url: '/pages/index/index' }) });
  },

  onEditProfile() {
    wx.showToast({ title: '编辑资料功能开发中', icon: 'none' });
  },

  onShareAppMessage() {
    return {
      title: '我的成长档案 - 石榴籽成长快乐导引地图',
      path: '/pages/profile/profile'
    };
  }
});
