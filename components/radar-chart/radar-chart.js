const { drawRadarChart, DIM_KEYS } = require('../../utils/radar-chart');

Component({
  properties: {
    scores: {
      type: Object,
      value: {},
      observer: 'onScoresChange'
    },
    width: {
      type: Number,
      value: 300
    },
    height: {
      type: Number,
      value: 300
    },
    showLabels: {
      type: Boolean,
      value: true
    },
    showPoints: {
      type: Boolean,
      value: true
    },
    showValues: {
      type: Boolean,
      value: true
    }
  },

  data: {
    canvasId: 'radarCanvas',
    isReady: false
  },

  lifetimes: {
    attached() {
      this.initCanvas();
    }
  },

  methods: {
    initCanvas() {
      const query = this.createSelectorQuery();
      query.select(`#${this.data.canvasId}`)
        .fields({ node: true, size: true })
        .exec((res) => {
          if (res[0]) {
            this.canvas = res[0].node;
            this.ctx = this.canvas.getContext('2d');
            this.setData({ isReady: true });
            this.drawChart();
          }
        });
    },

    onScoresChange(newScores) {
      if (this.data.isReady && newScores && Object.keys(newScores).length > 0) {
        this.drawChart();
      }
    },

    drawChart() {
      const { scores, width, height, showLabels, showPoints, showValues } = this.data;
      
      if (!this.ctx || !scores || Object.keys(scores).length === 0) {
        return;
      }

      const dpr = wx.getSystemInfoSync().pixelRatio;
      this.canvas.width = width * dpr;
      this.canvas.height = height * dpr;
      this.ctx.scale(dpr, dpr);

      drawRadarChart(this.ctx, scores, {
        width,
        height,
        centerX: width / 2,
        centerY: height / 2,
        radius: Math.min(width, height) / 2 - 40,
        showLabels,
        showPoints,
        showValues
      });
    },

    exportImage() {
      return new Promise((resolve, reject) => {
        wx.canvasToTempFilePath({
          canvas: this.canvas,
          success: (res) => resolve(res.tempFilePath),
          fail: (err) => reject(err)
        });
      });
    }
  }
});
