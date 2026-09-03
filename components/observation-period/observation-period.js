const { shouldStartAssessment, getProgressMessage, getNextStepMessage } = require('../../utils/observation');
const app = getApp();

Component({
  properties: {},
  
  data: {
    isLoading: true,
    isObserving: true,
    isStudent: false,
    progress: 0,
    message: '',
    nextStep: '',
    stats: {},
    targetCheckins: 10  // 目标打卡次数
  },
  
  lifetimes: {
    attached() {
      const userRole = (app && app.globalData.userRole) || 'parent';
      this.setData({ isStudent: userRole === 'student' });
      this.checkStatus();
    }
  },
  
  pageLifetimes: {
    show() {
      // 页面显示时重新检查状态（例如从打卡页面返回）
      this.checkStatus();
    }
  },
  
  methods: {
    async checkStatus() {
      this.setData({ isLoading: true });
      
      try {
        const result = await shouldStartAssessment();
        
        this.setData({
          isLoading: false,
          isObserving: !result.ready,
          progress: result.progress || 0,
          message: result.message || getProgressMessage(result.progress || 0, {}, this.data.isStudent ? 'student' : 'parent'),
          nextStep: getNextStepMessage(result.stats || {}),
          stats: result.stats || {}
        });
        
        if (result.ready) {
          this.triggerEvent('ready');
        }
      } catch (err) {
        console.error('检查观察期状态失败:', err);
        this.setData({ isLoading: false });
      }
    }
  }
});
