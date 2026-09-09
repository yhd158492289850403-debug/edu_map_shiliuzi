/**
 * 个人档案页 - 展示用户信息、打卡记录、探索轨迹
 */
const app = getApp();
const { ROLE_TYPES, ROLE_CONFIGS } = require('../../data/user-roles');
const { resetGuide } = require('../../utils/guide-steps');

Page({
  data: {
    statusBarHeight: 44,
    userInfo: null,
    checkins: [],
    loading: true,
    stage: '全部',
    isObserving: true,
    isTeam: false,
    isGuest: false,
    isFamily: true,
    userEntry: 'guest',
    classData: null,
    students: [],
    showRolePicker: false,
    roleOptions: [],
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
    const userEntry = (app && app.globalData.userEntry) || 'guest';
    
    // 构建入口选项
    const roleOptions = Object.entries(ROLE_CONFIGS).map(([key, config]) => ({
      key,
      ...config,
      selected: key === userEntry
    }));
    
    this.setData({ 
      statusBarHeight: windowInfo.statusBarHeight || 44, 
      stage,
      userEntry,
      isFamily: userEntry === 'family',
      isGuest: userEntry === 'guest',
      isTeam: userEntry === 'team',
      roleOptions
    });
    this.loadUserInfo();
    this.loadCheckins();
    if (this.data.isTeam) {
      this.loadClassData();
    }
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

  onShowRolePicker() {
    this.setData({ showRolePicker: true });
  },

  onCloseRolePicker() {
    this.setData({ showRolePicker: false });
  },

  async onRoleSelect(e) {
    const entry = e.currentTarget.dataset.role;
    if (entry === this.data.userEntry) {
      this.setData({ showRolePicker: false });
      return;
    }

    try {
      // 保存到本地
      wx.setStorageSync('userEntry', entry);
      app.globalData.userEntry = entry;

      // 保存到云端
      const db = wx.cloud.database();
      await db.collection('users').where({
        _openid: '{openid}'
      }).update({
        data: {
          entry_type: entry,
          updated_at: new Date()
        }
      });

      // 更新界面
      const roleOptions = this.data.roleOptions.map(opt => ({
        ...opt,
        selected: opt.key === entry
      }));

      this.setData({
        userEntry: entry,
        isFamily: entry === 'family',
        isGuest: entry === 'guest',
        isTeam: entry === 'team',
        showRolePicker: false,
        roleOptions
      });

      wx.showToast({ title: '已切换入口', icon: 'success' });
    } catch (err) {
      console.error('切换入口失败:', err);
      wx.showToast({ title: '切换失败，请重试', icon: 'none' });
    }
  },

  onAssessmentReady() {
    this.setData({ isObserving: false });
    wx.showToast({ title: '数据收集完成！', icon: 'success' });
  },

  goToReport() {
    wx.navigateTo({ url: '/pages/report/report' });
  },

  async loadClassData() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'getClassStudents'
      });
      
      if (result.success) {
        this.setData({
          classData: result.classStats,
          students: result.students
        });
      }
    } catch (err) {
      console.error('加载班级数据失败:', err);
    }
  },

  onExportClassReport() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  onViewStudent(e) {
    const openid = e.currentTarget.dataset.openid;
    wx.navigateTo({
      url: `/pages/student-detail/student-detail?openid=${openid}`
    });
  },
  
  // 重播新手引导 - 跳转到首页启动引导
  onReplayGuide() {
    resetGuide();
    wx.reLaunch({
      url: '/pages/index/index?startGuide=true'
    });
  },

  onShareAppMessage() {
    return {
      title: '我的探索档案 - 石榴籽文化探索导引地图',
      path: '/pages/profile/profile'
    };
  }
});
