Component({
  properties: {
    // 引导步骤配置
    steps: {
      type: Array,
      value: []
    },
    // 是否显示
    show: {
      type: Boolean,
      value: false
    }
  },

  data: {
    currentStep: 0,
    highlightRect: null,
    bubbleStyle: '',
    fingerStyle: '',
    fingerClass: '',
    isAnimating: false
  },

  lifetimes: {
    attached() {
      if (this.data.show && this.data.steps.length > 0) {
        this.startGuide();
      }
    }
  },

  observers: {
    'show': function(show) {
      if (show && this.data.steps.length > 0) {
        this.startGuide();
      }
    }
  },

  methods: {
    // 开始引导
    startGuide() {
      this.setData({ currentStep: 0 });
      this.showStep(0, 0);
    },

    // 显示指定步骤（带重试）
    showStep(index, retryCount) {
      const steps = this.data.steps;
      if (index >= steps.length) {
        this.completeGuide();
        return;
      }

      // 最多重试 10 次（每次间隔 200ms，共 2 秒）
      if (retryCount > 10) {
        console.warn('引导步骤 ' + index + ' 目标元素未找到，跳过');
        this.showStep(index + 1, 0);
        return;
      }

      const step = steps[index];
      this.setData({ isAnimating: true });

      // 获取目标元素位置
      const query = this.createSelectorQuery();
      query.select(step.target).boundingClientRect(rect => {
        if (!rect || rect.width === 0) {
          // 目标元素不存在或未渲染，延迟重试
          setTimeout(() => {
            this.showStep(index, retryCount + 1);
          }, 200);
          return;
        }

        // 计算气泡位置
        const bubblePos = this.calcBubblePosition(rect, step.position);
        
        // 计算手指位置
        const fingerPos = this.calcFingerPosition(rect, step.finger);

        this.setData({
          currentStep: index,
          highlightRect: {
            left: rect.left - 8,
            top: rect.top - 8,
            width: rect.width + 16,
            height: rect.height + 16
          },
          bubbleStyle: `left:${bubblePos.x}px;top:${bubblePos.y}px;`,
          fingerStyle: `left:${fingerPos.x}px;top:${fingerPos.y}px;`,
          fingerClass: `finger-${step.finger || 'point'}`,
          isAnimating: false
        });
      }).exec();
    },

    // 计算气泡位置
    calcBubblePosition(rect, position) {
      const sysInfo = wx.getSystemInfoSync();
      const screenWidth = sysInfo.windowWidth;
      const bubbleWidth = 240;
      let x, y;

      switch (position) {
        case 'top':
          x = rect.left + rect.width / 2 - bubbleWidth / 2;
          y = rect.top - 120;
          break;
        case 'bottom':
          x = rect.left + rect.width / 2 - bubbleWidth / 2;
          y = rect.bottom + 20;
          break;
        case 'left':
          x = rect.left - bubbleWidth - 20;
          y = rect.top + rect.height / 2 - 50;
          break;
        case 'right':
          x = rect.right + 20;
          y = rect.top + rect.height / 2 - 50;
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
    },

    // 下一步
    onNext() {
      const nextStep = this.data.currentStep + 1;
      if (nextStep >= this.data.steps.length) {
        this.completeGuide();
      } else {
        this.showStep(nextStep, 0);
      }
    },

    // 跳过引导
    onSkip() {
      this.completeGuide();
    },

    // 完成引导
    completeGuide() {
      this.setData({ show: false });
      wx.setStorageSync('guideCompleted', true);
      wx.removeStorageSync('needGuide');
      this.triggerEvent('complete');
    }
  }
});
