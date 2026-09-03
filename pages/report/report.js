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
      
      // 从本地存储获取打卡记录
      let checkins = [];
      try {
        checkins = wx.getStorageSync('localCheckins') || [];
        console.log('从本地存储读取打卡记录:', checkins.length, '条');
      } catch (err) {
        console.error('读取本地存储失败:', err);
      }
      
      // 如果本地存储没有，尝试从云数据库读取
      if (checkins.length === 0) {
        try {
          const db = wx.cloud.database();
          const { data } = await db.collection('checkins').where({
            _openid: '{openid}'
          }).get();
          checkins = data || [];
          console.log('从云数据库读取打卡记录:', checkins.length, '条');
        } catch (err) {
          console.error('读取云数据库失败:', err);
        }
      }
      
      // 构建行为数据用于计算六维分数
      const behaviorData = {
        viewedSlices: behaviors.stats.viewedSlices || [],
        checkins: checkins.map(c => ({
          pointId: c.point_id,
          pointName: c.point_name,
          behavior: c.behavior
        })),
        feedbacks: []
      };
      
      console.log('行为数据:', behaviorData);
      
      // 计算分数
      const scores = calculateSixDimScores(behaviorData);
      console.log('计算的六维分数:', scores);
      
      // 如果分数全为0，使用初始分数
      const hasNonZeroScore = Object.values(scores).some(s => s > 0);
      if (!hasNonZeroScore) {
        console.log('分数全为0，使用初始分数');
        const initialScores = calculateInitialScores(behaviorData);
        console.log('初始分数:', initialScores);
        Object.assign(scores, initialScores);
      }
      
      // 生成报告
      const report = generateReport(role, scores, behaviors.stats, {
        nickname: app.globalData.userInfo?.nickname || '用户',
        checkinCount: checkins.length
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