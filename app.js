// app.js
const tracker = require('./utils/tracker');

App({
  globalData: {
    userInfo: null,
    openid: null,
    userEntry: 'guest',  // 默认入口
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
    
    // 初始化入口
    this.initEntry();
    
    // 初始化行为采集
    tracker.init();
  },

  onUnload() {
    // 页面卸载时上报剩余数据
    tracker.flush();
  },

  initEntry() {
    let entry = wx.getStorageSync('userEntry');
    
    // 自动清理无效值（空字符串、null、undefined）
    if (!entry || typeof entry !== 'string' || entry.trim() === '') {
      wx.removeStorageSync('userEntry');
      entry = null;
    }
    
    if (entry) {
      this.globalData.userEntry = entry;
    } else {
      // 首次使用或入口无效，跳转选择页
      setTimeout(() => {
        wx.reLaunch({ 
          url: '/pages/role-select/role-select?first=true' 
        });
      }, 100);
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
