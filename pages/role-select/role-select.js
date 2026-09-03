const { ROLE_TYPES, ROLE_CONFIGS } = require('../../data/user-roles');
const app = getApp();

Page({
  data: {
    roles: [],
    selectedRole: '',
    isFirstTime: true
  },

  onLoad(options) {
    const roles = Object.entries(ROLE_CONFIGS).map(([key, config]) => ({
      key,
      ...config,
      selected: false
    }));
    
    this.setData({
      roles,
      isFirstTime: options.first === 'true',
      selectedRole: app.globalData.userRole || ''
    });
  },

  onRoleSelect(e) {
    const role = e.currentTarget.dataset.role;
    this.setData({ selectedRole: role });
  },

  async onConfirm() {
    if (!this.data.selectedRole) {
      wx.showToast({ title: '请选择身份', icon: 'none' });
      return;
    }

    try {
      // 保存到本地
      wx.setStorageSync('userRole', this.data.selectedRole);
      app.globalData.userRole = this.data.selectedRole;

      // 保存到云端
      const db = wx.cloud.database();
      await db.collection('users').where({
        _openid: '{openid}'
      }).update({
        data: {
          role: this.data.selectedRole,
          updated_at: new Date()
        }
      });

      wx.showToast({ title: '设置成功', icon: 'success' });
      
      // 返回上一页或跳转首页
      if (this.data.isFirstTime) {
        wx.reLaunch({ url: '/pages/index/index' });
      } else {
        wx.navigateBack();
      }
    } catch (err) {
      console.error('保存角色失败:', err);
      wx.showToast({ title: '设置失败，请重试', icon: 'none' });
    }
  }
});
