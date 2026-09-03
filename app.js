// app.js
App({
  globalData: {
    userInfo: null,
    openid: null,
    userRole: 'parent',  // 默认角色
    filter: { search: '', dims: [], issues: [], unity: false, topics: [] },
    view: 'map',
    stage: '全部'
  },

  onLaunch() {
    // 云开发初始化
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloud1-d5gyas9xgbb003681',
        traceUser: true
      });
      // 获取 openid（容错：云函数未部署时不阻塞）
      this.getOpenid();
    }
    
    // 初始化角色
    this.initRole();
  },

  initRole() {
    const role = wx.getStorageSync('userRole');
    if (role) {
      this.globalData.userRole = role;
    } else {
      // 首次使用，跳转角色选择页
      wx.navigateTo({ 
        url: '/pages/role-select/role-select?first=true' 
      });
    }
  },

  async getOpenid() {
    try {
      const { result } = await wx.cloud.callFunction({ name: 'login' });
      this.globalData.openid = result.openid;
    } catch (err) {
      console.warn('云函数 login 未部署，openid 将在后续获取：', err.message || err);
    }
  }
});
