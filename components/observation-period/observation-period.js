const { shouldStartAssessment, getProgressMessage, getNextStepMessage } = require('../../utils/observation');

Component({
  properties: {},
  
  data: {
    isLoading: true,
    isObserving: true,
    progress: 0,
    message: '',
    nextStep: '',
    stats: {}
  },
  
  lifetimes: {
    attached() {
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
          message: result.message || getProgressMessage(result.progress || 0, {}),
          nextStep: getNextStepMessage(result.stats || {})
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
