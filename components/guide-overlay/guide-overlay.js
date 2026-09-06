const guideSteps = require('../../utils/guide-steps');

Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    }
  },

  data: {
    currentStep: null,
    highlightRect: null,
    bubbleStyle: '',
    fingerStyle: '',
    fingerClass: '',
    isAnimating: false,
    isReady: false,
    stepIndex: 0,
    totalSteps: 0
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
    initGuide() {
      if (guideSteps.isGuideActiveState()) {
        this.updateProgress();
        this.showCurrentStep(0);
      } else {
        guideSteps.startGuide();
        this.updateProgress();
        this.showCurrentStep(0);
      }
    },

    showCurrentStep(retryCount) {
      const step = guideSteps.getCurrentStep();
      if (!step) {
        this.completeGuide();
        return;
      }

      if (retryCount > 15) {
        console.warn('引导步骤目标元素未找到，跳过');
        const result = guideSteps.nextStep();
        if (result.done) {
          this.completeGuide();
        } else {
          this.updateProgress();
          this.showCurrentStep(0);
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

    updateProgress() {
      this.setData({
        stepIndex: guideSteps.getCurrentStepIndex() + 1,
        totalSteps: guideSteps.getTotalSteps()
      });
    },

    onNext() {
      const result = guideSteps.nextStep();
      this.updateProgress();

      if (result.done) {
        this.completeGuide();
      } else {
        this.showCurrentStep(0);
      }
    },

    onMaskTap() {
      // 不做任何事，阻止点击穿透
    },

    onSkip() {
      guideSteps.skipGuide();
      this.setData({ show: false, isReady: false });
      this.triggerEvent('skip');
    },

    completeGuide() {
      guideSteps.completeGuide();
      this.setData({ show: false, isReady: false });
      this.triggerEvent('complete');
    },

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

      if (x < 10) x = 10;
      if (x + bubbleWidth > screenWidth - 10) x = screenWidth - bubbleWidth - 10;
      if (y < 10) y = rect.bottom + 20;

      return { x, y };
    },

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
        default:
          x = rect.left + rect.width / 2 - 15;
          y = rect.bottom + 5;
      }

      return { x, y };
    }
  }
});
