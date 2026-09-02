/**
 * 筛选面板组件 v3 —— 层级折叠 drill-down + 多选行为
 *
 * Level 1：点击"素养维度"标题 → 展开/收起
 * Level 2：六维彩色 chips → 选中某维度
 * Level 3：该维度下的子素养列表
 * Level 4：选中子素养 → 展开行为列表（可多选）
 * 底部：显示已选行为数量 + "查看方案"按钮
 */
Component({
  properties: {
    subLiteraciesByDim: { type: Object, value: {} },
    subsToBehaviors: { type: Object, value: {} },
    searchValue: { type: String, value: '' },
    topics: { type: Array, value: [] },
    stage: { type: String, value: '全部' }
  },

  data: {
    localSearch: '',
    dimFoldOpen: true,
    topicFoldOpen: true,
    selectedDim: '',
    selectedSub: '',
    selectedBehaviors: [],
    selectedTopics: [],
    dimChips: [],
    subList: [],
    actionList: [],
    topicChips: [
      { key: '红色研学', label: '红色研学', active: false }
    ]
  },

  lifetimes: { ready() { this.syncFromProps(); } },
  observers: {
    'subLiteraciesByDim, subsToBehaviors, topics': function() { this.syncFromProps(); }
  },

  methods: {
    syncFromProps() {
      const { subLiteraciesByDim, subsToBehaviors, topics } = this.properties;
      const { selectedDim, selectedSub, selectedBehaviors } = this.data;

      const DIM_ORDER = ['体素','心素','灵素','智素','行素','交素'];
      const DIM_COLOR = { 体素:'#EAB308', 心素:'#EF4444', 灵素:'#A855F7', 智素:'#22C55E', 行素:'#3B82F6', 交素:'#F97316' };
      const DIM_LABEL = { 体素:'身体素养', 心素:'情绪素养', 灵素:'价值素养', 智素:'认知素养', 行素:'行动素养', 交素:'社交素养' };

      const dimChips = DIM_ORDER.map(d => ({
        key: d, label: DIM_LABEL[d] || d, color: DIM_COLOR[d] || '#64748b', active: selectedDim === d
      }));

      let subList = [];
      if (selectedDim && subLiteraciesByDim[selectedDim]) {
        subList = subLiteraciesByDim[selectedDim]
          .filter(sub => subsToBehaviors[sub] && subsToBehaviors[sub].length > 0)
          .map(sub => ({ name: sub, behCount: (subsToBehaviors[sub] || []).length }));
      }

      let actionList = [];
      if (selectedSub && subsToBehaviors[selectedSub]) {
        actionList = subsToBehaviors[selectedSub].map(b => ({
          name: b.name,
          sliceCount: b.sliceCount || 0,
          checked: selectedBehaviors.includes(b.name)
        }));
      }

      const selectedTopics = topics || [];
      const topicChips = [
        { key: '红色研学', label: '红色研学', active: selectedTopics.includes('红色研学') }
      ];

      this.setData({ localSearch: this.properties.searchValue || '', dimChips, subList, actionList, topicChips, selectedTopics });
    },

    toggleDimFold() { this.setData({ dimFoldOpen: !this.data.dimFoldOpen }); },
    toggleTopicFold() { this.setData({ topicFoldOpen: !this.data.topicFoldOpen }); },

    toggleTopic(e) {
      const topic = e.currentTarget.dataset.topic;
      const topics = [...(this.properties.topics || [])];
      const idx = topics.indexOf(topic);
      if (idx >= 0) {
        topics.splice(idx, 1);
      } else {
        topics.push(topic);
      }
      this.triggerEvent('filterchange', {
        search: this.data.localSearch,
        dims: this.data.selectedDim ? [this.data.selectedDim] : [],
        starDims: [],
        issues: [],
        cats: [],
        topics
      });
    },

    selectDim(e) {
      const dim = e.currentTarget.dataset.dim;
      const next = this.data.selectedDim === dim ? '' : dim;
      this.setData({ selectedDim: next, selectedSub: '' }, () => this.syncFromProps());
    },

    selectSub(e) {
      const sub = e.currentTarget.dataset.sub;
      this.setData({ selectedSub: this.data.selectedSub === sub ? '' : sub }, () => this.syncFromProps());
    },

    // 多选行为：点击切换选中/取消
    selectAction(e) {
      const name = e.currentTarget.dataset.name;
      const list = [...this.data.selectedBehaviors];
      const idx = list.indexOf(name);
      if (idx >= 0) {
        list.splice(idx, 1);
      } else {
        list.push(name);
      }
      this.setData({ selectedBehaviors: list }, () => this.syncFromProps());
    },

    // 移除已选行为
    removeBehavior(e) {
      const name = e.currentTarget.dataset.name;
      const list = this.data.selectedBehaviors.filter(b => b !== name);
      this.setData({ selectedBehaviors: list }, () => this.syncFromProps());
    },

    onSearchInput(e) {
      this.setData({ localSearch: e.detail.value });
      this.triggerEvent('filterchange', {
        search: e.detail.value,
        dims: this.data.selectedDim ? [this.data.selectedDim] : [],
        starDims: [],
        issues: [],
        cats: [],
        topics: this.properties.topics || []
      });
    },

    onReset() {
      this.setData({ selectedDim: '', selectedSub: '', selectedBehaviors: [] }, () => this.syncFromProps());
      this.triggerEvent('filterchange', {
        search: '', dims: [], starDims: [], issues: [], cats: [], topics: []
      });
    },

    // 确定：有行为则跳转寻课，否则仅关闭面板（专题筛选已通过filterchange实时生效）
    onApply() {
      const behaviors = this.data.selectedBehaviors;
      const topics = this.properties.topics || [];

      if (behaviors.length > 0) {
        // 选了行为 → 跳转行为寻课页
        this.triggerEvent('behaviorselect', { behaviors });
      }

      // 无论是否有行为，都关闭面板
      this.triggerEvent('close');
    },

    onClose() { this.triggerEvent('close'); },
    onOverlayTap() { this.triggerEvent('close'); }
  }
});
