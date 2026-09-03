Component({
  properties: {
    title: {
      type: String,
      value: ''
    },
    subtitle: {
      type: String,
      value: ''
    },
    score: {
      type: Number,
      value: 0
    },
    level: {
      type: String,
      value: ''
    },
    dimensions: {
      type: Array,
      value: []
    },
    highlights: {
      type: Array,
      value: []
    },
    suggestions: {
      type: Array,
      value: []
    },
    encouragement: {
      type: String,
      value: ''
    },
    showActions: {
      type: Boolean,
      value: true
    }
  },

  data: {
    scoreColor: '#4ECDC4'
  },

  observers: {
    'score': function(score) {
      let color = '#4ECDC4';
      if (score >= 80) color = '#52c41a';
      else if (score >= 60) color = '#4ECDC4';
      else if (score >= 40) color = '#faad14';
      else color = '#ff4d4f';
      this.setData({ scoreColor: color });
    }
  },

  methods: {
    onTap() {
      this.triggerEvent('tap');
    },

    onExport() {
      this.triggerEvent('export');
    },

    onShare() {
      this.triggerEvent('share');
    }
  }
});
