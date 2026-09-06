# Task 5: 雷达图组件（原生Canvas）

## 任务概述

创建雷达图组件，使用小程序原生Canvas绘制六维素养雷达图，用于报告展示。

## 需要创建的文件

### 1. `utils/radar-chart.js` - 雷达图绘制工具

```javascript
const DIM_LABELS = {
  '体素': '身体素养',
  '心素': '情绪素养',
  '灵素': '价值素养',
  '智素': '认知素养',
  '行素': '行动素养',
  '交素': '社交素养'
};

const DIM_COLORS = {
  '体素': '#FF6B6B',
  '心素': '#4ECDC4',
  '灵素': '#45B7D1',
  '智素': '#96CEB4',
  '行素': '#FFEAA7',
  '交素': '#DDA0DD'
};

/**
 * 绘制雷达图
 * @param {CanvasContext} ctx - Canvas上下文
 * @param {Object} data - 数据 {体素: 80, 心素: 60, ...}
 * @param {Object} options - 配置选项
 */
function drawRadarChart(ctx, data, options = {}) {
  const {
    centerX = 150,
    centerY = 150,
    radius = 100,
    showLabels = true,
    showValues = true,
    fillColor = 'rgba(66, 133, 244, 0.3)',
    strokeColor = '#4285F4',
    lineWidth = 2
  } = options;
  
  const dims = Object.keys(DIM_LABELS);
  const angleStep = (Math.PI * 2) / dims.length;
  
  // 绘制背景网格
  drawGrid(ctx, centerX, centerY, radius, dims.length);
  
  // 绘制数据区域
  drawDataArea(ctx, data, centerX, centerY, radius, dims, fillColor, strokeColor, lineWidth);
  
  // 绘制标签
  if (showLabels) {
    drawLabels(ctx, dims, centerX, centerY, radius);
  }
  
  // 绘制数值
  if (showValues) {
    drawValues(ctx, data, dims, centerX, centerY, radius);
  }
}

function drawGrid(ctx, centerX, centerY, radius, sides) {
  ctx.setStrokeStyle('#E0E0E0');
  ctx.setLineWidth(1);
  
  // 绘制同心多边形
  for (let level = 1; level <= 5; level++) {
    const r = (radius / 5) * level;
    ctx.beginPath();
    
    for (let i = 0; i <= sides; i++) {
      const angle = (Math.PI * 2 / sides) * i - Math.PI / 2;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.closePath();
    ctx.stroke();
  }
  
  // 绘制从中心到顶点的线
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 / sides) * i - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}

function drawDataArea(ctx, data, centerX, centerY, radius, dims, fillColor, strokeColor, lineWidth) {
  ctx.beginPath();
  
  for (let i = 0; i <= dims.length; i++) {
    const dim = dims[i % dims.length];
    const value = (data[dim] || 0) / 100;
    const angle = (Math.PI * 2 / dims.length) * i - Math.PI / 2;
    const r = radius * value;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  
  ctx.closePath();
  ctx.setFillStyle(fillColor);
  ctx.fill();
  ctx.setStrokeStyle(strokeColor);
  ctx.setLineWidth(lineWidth);
  ctx.stroke();
}

function drawLabels(ctx, dims, centerX, centerY, radius) {
  ctx.setFillStyle('#333');
  ctx.setFontSize(12);
  ctx.setTextAlign('center');
  
  for (let i = 0; i < dims.length; i++) {
    const dim = dims[i];
    const angle = (Math.PI * 2 / dims.length) * i - Math.PI / 2;
    const labelRadius = radius + 20;
    const x = centerX + labelRadius * Math.cos(angle);
    const y = centerY + labelRadius * Math.sin(angle);
    
    ctx.fillText(DIM_LABELS[dim], x, y);
  }
}

function drawValues(ctx, data, dims, centerX, centerY, radius) {
  ctx.setFillStyle('#666');
  ctx.setFontSize(10);
  ctx.setTextAlign('center');
  
  for (let i = 0; i < dims.length; i++) {
    const dim = dims[i];
    const value = data[dim] || 0;
    const angle = (Math.PI * 2 / dims.length) * i - Math.PI / 2;
    const valueRadius = radius + 35;
    const x = centerX + valueRadius * Math.cos(angle);
    const y = centerY + valueRadius * Math.sin(angle);
    
    ctx.fillText(`${value}`, x, y);
  }
}

/**
 * 生成雷达图数据URL
 */
function generateRadarChartImage(data, options = {}) {
  return new Promise((resolve, reject) => {
    const canvas = wx.createOffscreenCanvas({ type: '2d', width: 300, height: 300 });
    const ctx = canvas.getContext('2d');
    
    drawRadarChart(ctx, data, { ...options, centerX: 150, centerY: 150 });
    
    // 转换为图片
    wx.canvasToTempFilePath({
      canvas,
      success: (res) => resolve(res.tempFilePath),
      fail: reject
    });
  });
}

module.exports = {
  DIM_LABELS,
  DIM_COLORS,
  drawRadarChart,
  generateRadarChartImage
};
```

### 2. `components/radar-chart/radar-chart.js` - 雷达图组件

```javascript
const { drawRadarChart } = require('../../utils/radar-chart');

Component({
  properties: {
    data: {
      type: Object,
      value: {}
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
    showValues: {
      type: Boolean,
      value: true
    }
  },
  
  lifetimes: {
    ready() {
      this.drawChart();
    }
  },
  
  observers: {
    'data': function() {
      this.drawChart();
    }
  },
  
  methods: {
    drawChart() {
      const query = this.createSelectorQuery();
      query.select('#radar-canvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0]) return;
          
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          
          const dpr = wx.getWindowInfo().pixelRatio;
          canvas.width = this.data.width * dpr;
          canvas.height = this.data.height * dpr;
          ctx.scale(dpr, dpr);
          
          drawRadarChart(ctx, this.data.data, {
            centerX: this.data.width / 2,
            centerY: this.data.height / 2,
            radius: Math.min(this.data.width, this.data.height) / 2 - 40,
            showLabels: this.data.showLabels,
            showValues: this.data.showValues
          });
        });
    }
  }
});
```

### 3. `components/radar-chart/radar-chart.wxml` - 组件模板

```xml
<canvas 
  type="2d" 
  id="radar-canvas" 
  style="width: {{width}}px; height: {{height}}px;"
></canvas>
```

### 4. `components/radar-chart/radar-chart.wxss` - 组件样式

```css
canvas {
  display: block;
}
```

### 5. `components/radar-chart/radar-chart.json` - 组件配置

```json
{
  "component": true,
  "usingComponents": {}
}
```

## 测试要求

1. 雷达图能正确绘制六维数据
2. 标签和数值能正确显示
3. 组件能正确响应数据变化
4. 图片导出功能正常

## 提交要求

```bash
git add utils/radar-chart.js components/radar-chart/
git commit -m "feat: add radar chart component with native Canvas"
```
