const { exportPDF, generateFileName } = require('../../utils/pdf-export');
const { getBehaviors } = require('../../utils/tracker');
const app = getApp();

Page({
  data: {
    isLoading: false,
    scores: {},
    selectedCheckins: [],
    allCheckins: [],
    selectMode: false
  },
  
  onLoad(options) {
    if (options.scores) {
      this.setData({ scores: JSON.parse(options.scores) });
    }
    this.loadCheckins();
  },
  
  async loadCheckins() {
    try {
      const behaviors = await getBehaviors();
      const checkins = behaviors.behaviors.filter(b => b.type === 'checkin');
      this.setData({ allCheckins: checkins });
    } catch (err) {
      console.error('加载打卡记录失败:', err);
    }
  },
  
  onToggleSelectMode() {
    this.setData({ selectMode: !this.data.selectMode });
  },
  
  onToggleCheckin(e) {
    const id = e.currentTarget.dataset.id;
    const selected = [...this.data.selectedCheckins];
    const index = selected.indexOf(id);
    
    if (index > -1) {
      selected.splice(index, 1);
    } else {
      selected.push(id);
    }
    
    this.setData({ selectedCheckins: selected });
  },
  
  onSelectAll() {
    const allIds = this.data.allCheckins.map(c => c._id);
    this.setData({ selectedCheckins: allIds });
  },
  
  onDeselectAll() {
    this.setData({ selectedCheckins: [] });
  },
  
  async onExport() {
    this.setData({ isLoading: true });
    
    try {
      const selectedData = this.data.selectMode 
        ? this.data.allCheckins.filter(c => this.data.selectedCheckins.includes(c._id))
        : [];
      
      // 传递给云函数时使用英文，避免pdf-lib编码问题
      const reportData = {
        title: 'Growth Report',
        subtitle: new Date().toLocaleDateString('en-US'),
        dimensions: Object.entries(this.data.scores).map(([key, score]) => ({
          key,
          label: getDimLabelEn(key),
          score
        })),
        radarData: this.data.scores
      };
      
      await exportPDF(reportData, selectedData);
    } catch (err) {
      console.error('导出失败:', err);
    } finally {
      this.setData({ isLoading: false });
    }
  }
});

function getDimLabel(dim) {
  const labels = {
    '体素': '身体素养',
    '心素': '情绪素养',
    '灵素': '价值素养',
    '智素': '认知素养',
    '行素': '行动素养',
    '交素': '社交素养'
  };
  return labels[dim] || dim;
}

function getDimLabelEn(dim) {
  const labels = {
    '体素': 'Physical',
    '心素': 'Emotional',
    '灵素': 'Value',
    '智素': 'Cognitive',
    '行素': 'Action',
    '交素': 'Social'
  };
  return labels[dim] || dim;
}
