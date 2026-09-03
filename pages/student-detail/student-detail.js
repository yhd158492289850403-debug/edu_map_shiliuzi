const { generateReport } = require('../../utils/report-generator');
const { calculateSixDimScores } = require('../../utils/assessment');
const app = getApp();

Page({
  data: {
    loading: true,
    studentInfo: null,
    checkins: [],
    behaviors: [],
    scores: {},
    report: null,
    openid: ''
  },

  async onLoad(options) {
    if (options.openid) {
      this.setData({ openid: options.openid });
      await this.loadStudentData(options.openid);
    }
  },

  async loadStudentData(openid) {
    try {
      this.setData({ loading: true });
      const db = wx.cloud.database();

      // Load student info
      const { data: users } = await db.collection('users')
        .where({ _openid: openid })
        .get();

      if (users.length > 0) {
        this.setData({ studentInfo: users[0] });
      }

      // Load checkins
      const { data: checkins } = await db.collection('checkins')
        .where({ _openid: openid })
        .orderBy('date', 'desc')
        .limit(100)
        .get();

      // Calculate behaviors stats
      const behaviorStats = this.calculateBehaviorStats(checkins);
      const scores = calculateSixDimScores(behaviorStats);

      // Generate report
      const report = generateReport('teacher', scores, behaviorStats, {
        studentName: users[0]?.nickname || '学生',
        checkinCount: checkins.length
      });

      this.setData({
        checkins,
        behaviors: behaviorStats,
        scores,
        report,
        loading: false
      });
    } catch (err) {
      console.error('Failed to load student data:', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  calculateBehaviorStats(checkins) {
    const behaviors = {};
    const uniquePoints = new Set();
    const uniqueDates = new Set();

    checkins.forEach(checkin => {
      if (checkin.behavior) {
        behaviors[checkin.behavior] = (behaviors[checkin.behavior] || 0) + 1;
      }
      if (checkin.point_id) {
        uniquePoints.add(checkin.point_id);
      }
      if (checkin.date) {
        const d = new Date(checkin.date);
        uniqueDates.add(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`);
      }
    });

    return {
      behaviors,
      totalCheckins: checkins.length,
      uniquePoints: uniquePoints.size,
      uniqueDays: uniqueDates.size
    };
  },

  onCheckinDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/checkin/checkin?id=${id}` });
  },

  onExportPDF() {
    wx.navigateTo({
      url: '/pages/pdf-export/pdf-export?openid=' + this.data.openid
    });
  },

  onBack() {
    wx.navigateBack();
  },

  onShareAppMessage() {
    return {
      title: `${this.data.studentInfo?.nickname || '学生'}的成长报告`,
      path: `/pages/student-detail/student-detail?openid=${this.data.openid}`
    };
  }
});
