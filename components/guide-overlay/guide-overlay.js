const guideSteps = require('../../utils/guide-steps');

Component({
  properties: {
    // 是否显示
    show: {
      type: Boolean,
      value: false
    },
    // 当前页面路径
    pagePath: {
      type: String,
      value: ''
    },
    // 是否全项目引导模式
    fullGuide: {
      type: Boolean,
      value: false
    }
  },

  data: {
    // 当前步骤数据
    currentStep: null,
    highlightRect: null,
    bubbleStyle: '',
    fingerStyle: '',
    fingerClass: '',
    
    // 进度信息
    stationIndex: 0,
    stationName: '',
    stationTotal: 0,
    stepInStation: 0,
    stepTotal: 0,
    globalStep: 0,
    globalTotal: 0,
    
    // 状态
    isAnimating: false,
    isReady: false,
    
    // 步骤配置（单页面模式）
    steps: []
  },

  lifetimes: {
    attached() {
      if (this.data.show) {
        this.initGuide();
      }
    }
  },

  observers: {
    'show': function(show) {
      if (show) {
        this.initGuide();
      }
    }
  },

  methods: {
    // 初始化引导
    initGuide() {
      if (this.data.fullGuide) {
        // 全项目引导模式
        if (guideSteps.isGuideActiveState()) {
          // 引导已在进行中（跨页面跳转），继续当前步骤
          this.updateProgress();
          this.showCurrentStep(0);
        } else {
          // 首次启动全项目引导
          this.startFullGuide();
        }
      } else {
        // 单页面引导模式
        this.startPageGuide();
      }
    },

    // 开始全项目引导（仅首次启动时调用）
    startFullGuide() {
      const result = guideSteps.startGuide();
      this.updateProgress();
      this.showCurrentStep(0);
    },

    // 开始单页面引导
    startPageGuide() {
      const steps = guideSteps.getPageGuideSteps(this.data.pagePath);
      this.setData({ steps });
      if (steps.length > 0) {
        this.showPageStep(0, 0);
      }
    },

    // 显示当前步骤（全项目模式）
    showCurrentStep(retryCount) {
      const step = guideSteps.getCurrentStep();
      if (!step) {
        this.completeGuide();
        return;
      }

      // 最多重试 15 次（每次 200ms，共 3 秒）
      if (retryCount > 15) {
        console.warn('引导步骤目标元素未找到，跳过');
        const result = guideSteps.nextStep();
        if (result.done) {
          this.completeGuide();
        } else if (result.navigateTo) {
          // 需要跳转到下一个页面
          this.triggerEvent('navigate', { page: result.navigateTo });
        }
        return;
      }

      this.setData({ isAnimating: true });

      const query = wx.createSelectorQuery();
      query.select(step.target).boundingClientRect(rect => {
        if (!rect || rect.width === 0) {
          setTimeout(() => {
            this.showCurrentStep(retryCount + 1);
          }, 200);
          return;
        }

        const bubblePos = this.calcBubblePosition(rect, step.position);
        const fingerPos = this.calcFingerPosition(rect, step.finger);

        this.setData({
          currentStep: step,
          highlightRect: {
            left: rect.left - 8,
            top: rect.top - 8,
            width: rect.width + 16,
            height: rect.height + 16
          },
          bubbleStyle: `left:${bubblePos.x}px;top:${bubblePos.y}px;`,
          fingerStyle: `left:${fingerPos.x}px;top:${fingerPos.y}px;`,
          fingerClass: `finger-${step.finger || 'point'}`,
          isAnimating: false,
          isReady: true
        });
      }).exec();
    },

    // 显示步骤（单页面模式）
    showPageStep(index, retryCount) {
      const steps = this.data.steps;
      if (index >= steps.length) {
        this.completeGuide();
        return;
      }

      if (retryCount > 15) {
        console.warn('引导步骤 ' + index + ' 目标元素未找到，跳过');
        this.showPageStep(index + 1, 0);
        return;
      }

      const step = steps[index];
      this.setData({ isAnimating: true });

      const query = wx.createSelectorQuery();
      query.select(step.target).boundingClientRect(rect => {
        if (!rect || rect.width === 0) {
          setTimeout(() => {
            this.showPageStep(index, retryCount + 1);
          }, 200);
          return;
        }

        const bubblePos = this.calcBubblePosition(rect, step.position);
        const fingerPos = this.calcFingerPosition(rect, step.finger);

        this.setData({
          currentStep: step,
          highlightRect: {
            left: rect.left - 8,
            top: rect.top - 8,
            width: rect.width + 16,
            height: rect.height + 16
          },
          bubbleStyle: `left:${bubblePos.x}px;top:${bubblePos.y}px;`,
          fingerStyle: `left:${fingerPos.x}px;top:${fingerPos.y}px;`,
          fingerClass: `finger-${step.finger || 'point'}`,
          stepInStation: index + 1,
          stepTotal: steps.length,
          isAnimating: false,
          isReady: true
        });
      }).exec();
    },

    // 更新进度信息
    updateProgress() {
      this.setData({
        stationIndex: guideSteps.getCurrentStationIndex(),
        stationName: guideSteps.getCurrentStation()?.stationName || '',
        stationTotal: guideSteps.getTotalStations(),
        stepInStation: guideSteps.getCurrentStepIndex() + 1,
        stepTotal: guideSteps.getCurrentStation()?.steps.length || 0,
        globalStep: guideSteps.getGlobalStepNumber(),
        globalTotal: guideSteps.getTotalSteps()
      });
    },

    // 下一步
    onNext() {
      if (this.data.fullGuide) {
        // 全项目模式
        const result = guideSteps.nextStep();
        this.updateProgress();
        
        if (result.done) {
          this.completeGuide();
        } else if (result.navigateTo) {
          // 需要跳转
          this.triggerEvent('navigate', { 
            page: result.navigateTo,
            stationName: result.stationName
          });
        } else {
          // 继续当前页面的下一步
          this.showCurrentStep(0);
        }
      } else {
        // 单页面模式
        const nextIndex = this.data.stepInStation;
        if (nextIndex >= this.data.steps.length) {
          this.completeGuide();
        } else {
          this.showPageStep(nextIndex, 0);
        }
      }
    },

    // 跳过引导
    onSkip() {
      guideSteps.skipGuide();
      this.setData({ show: false, isReady: false });
      this.triggerEvent('skip');
    },

    // 完成引导
    completeGuide() {
      guideSteps.completeGuide();
      this.setData({ show: false, isReady: false });
      this.triggerEvent('complete');
    },

    // 计算气泡位置
    calcBubblePosition(rect, position) {
      const sysInfo = wx.getSystemInfoSync();
      const screenWidth = sysInfo.windowWidth;
      const bubbleWidth = 280;
      let x, y;

      switch (position) {
        case 'top':
          x = rect.left + rect.width / 2 - bubbleWidth / 2;
          y = rect.top - 140;
          break;
        case 'bottom':
          x = rect.left + rect.width / 2 - bubbleWidth / 2;
          y = rect.bottom + 20;
          break;
        case 'left':
          x = rect.left - bubbleWidth - 20;
          y = rect.top + rect.height / 2 - 60;
          break;
        case 'right':
          x = rect.right + 20;
          y = rect.top + rect.height / 2 - 60;
          break;
        default:
          x = rect.left + rect.width / 2 - bubbleWidth / 2;
          y = rect.bottom + 20;
      }

      // 边界检测
      if (x < 10) x = 10;
      if (x + bubbleWidth > screenWidth - 10) x = screenWidth - bubbleWidth - 10;
      if (y < 10) y = rect.bottom + 20;

      return { x, y };
    },

    // 计算手指位置
    calcFingerPosition(rect, type) {
      let x, y;
      
      switch (type) {
        case 'point':
          x = rect.left + rect.width / 2 - 15;
          y = rect.bottom + 5;
          break;
        case 'tap':
          x = rect.left + rect.width / 2 - 15;
          y = rect.top + rect.height / 2 - 15;
          break;
        case 'swipe':
          x = rect.left + rect.width / 2 - 15;
          y = rect.top + rect.height / 2 - 15;
          break;
        default:
          x = rect.left + rect.width / 2 - 15;
          y = rect.bottom + 5;
      }

      return { x, y };
    }
  }
});
