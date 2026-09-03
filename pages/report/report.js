const { generateReport } = require('../../utils/report-generator');
const { getBehaviors } = require('../../utils/tracker');
const { calculateSixDimScores, calculateInitialScores } = require('../../utils/assessment');
const app = getApp();

Page({
  data: {
    isLoading: true,
    report: null,
    role: 'parent',
    scores: {}
  },
  
  async onLoad() {
    await this.loadReport();
  },
  
  async loadReport() {
    this.setData({ isLoading: true });
    
    try {
      // 获取用户角色
      const role = app.globalData.userRole || 'parent';
      
      // 获取行为数据
      const behaviors = await getBehaviors();
      
      // 计算分数
      const scores = calculateSixDimScores(behaviors.stats);
      
      // 生成报告
      const report = generateReport(role, scores, behaviors.stats, {
        nickname: app.globalData.userInfo?.nickname || '用户',
        checkinCount: behaviors.stats.totalCheckins
      });
      
      this.setData({
        isLoading: false,
        report,
        role,
        scores
      });
    } catch (err) {
      console.error('加载报告失败:', err);
      this.setData({ isLoading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },
  
  onExportPDF() {
    wx.navigateTo({
      url: '/pages/pdf-export/pdf-export?scores=' + JSON.stringify(this.data.scores)
    });
  },
  
  onShare() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  }
});