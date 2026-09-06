# Task 7: PDF导出功能

## 任务概述

创建PDF导出功能，支持单次打卡和多选记录导出，生成包含雷达图和报告内容的PDF文件。

## 需要创建的文件

### 1. `utils/pdf-export.js` - PDF导出前端模块

```javascript
const { generateRadarChartImage } = require('./radar-chart');

/**
 * 导出PDF
 * @param {Object} reportData - 报告数据
 * @param {Array} selectedCheckins - 选中的打卡记录
 */
async function exportPDF(reportData, selectedCheckins = []) {
  wx.showLoading({ title: '正在生成PDF...' });
  
  try {
    // 1. 生成雷达图图片
    const radarImage = await generateRadarChartImage(reportData.radarData);
    
    // 2. 调用云函数生成PDF
    const { result } = await wx.cloud.callFunction({
      name: 'generatePDF',
      data: {
        reportData,
        selectedCheckins,
        radarImage
      }
    });
    
    if (!result.success) {
      throw new Error(result.error || '生成PDF失败');
    }
    
    // 3. 下载PDF到本地
    const { fileID } = result;
    const { tempFilePath } = await wx.cloud.downloadFile({ fileID });
    
    // 4. 打开PDF预览
    await wx.openDocument({
      filePath: tempFilePath,
      showMenu: true,  // 显示右上角菜单，支持保存/转发
      success: () => {
        wx.hideLoading();
        wx.showToast({ title: 'PDF已生成', icon: 'success' });
      },
      fail: (err) => {
        console.error('打开PDF失败:', err);
        wx.hideLoading();
        wx.showToast({ title: '打开失败', icon: 'none' });
      }
    });
    
    return { success: true, filePath: tempFilePath };
  } catch (err) {
    console.error('导出PDF失败:', err);
    wx.hideLoading();
    wx.showToast({ title: '导出失败，请重试', icon: 'none' });
    return { success: false, error: err.message };
  }
}

/**
 * 生成文件名
 */
function generateFileName(nickname, type = 'report') {
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');
  
  const timeStr = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  }).replace(/:/g, '-');
  
  return `素养报告_${nickname}_${dateStr}_${timeStr}.pdf`;
}

module.exports = {
  exportPDF,
  generateFileName
};
```

### 2. `cloudfunctions/generatePDF/index.js` - PDF生成云函数

```javascript
const cloud = require('wx-server-sdk');
const { PDFDocument, PageSizes, rgb, StandardFonts } = require('pdf-lib');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { reportData, selectedCheckins, radarImage } = event;
  
  try {
    // 创建PDF文档
    const pdfDoc = await PDFDocument.create();
    
    // 设置中文字体
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const chineseFont = await pdfDoc.embedFont(StandardFonts.Courier);
    
    // 添加封面页
    const coverPage = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = coverPage.getSize();
    
    // 标题
    coverPage.drawText(reportData.title || '成长报告', {
      x: 50,
      y: height - 100,
      size: 24,
      font: chineseFont,
      color: rgb(0.2, 0.2, 0.2)
    });
    
    // 副标题
    coverPage.drawText(reportData.subtitle || '', {
      x: 50,
      y: height - 130,
      size: 14,
      font: chineseFont,
      color: rgb(0.5, 0.5, 0.5)
    });
    
    // 添加雷达图
    if (radarImage) {
      const imageBytes = Buffer.from(radarImage, 'base64');
      const image = await pdfDoc.embedPng(imageBytes);
      
      coverPage.drawImage(image, {
        x: width / 2 - 150,
        y: height - 400,
        width: 300,
        height: 300
      });
    }
    
    // 添加维度详情页
    const detailPage = pdfDoc.addPage(PageSizes.A4);
    let yPosition = height - 50;
    
    for (const dim of (reportData.dimensions || [])) {
      detailPage.drawText(`${dim.label}: ${dim.score}分`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: chineseFont,
        color: rgb(0.2, 0.2, 0.2)
      });
      
      yPosition -= 20;
      
      if (dim.description) {
        detailPage.drawText(dim.description, {
          x: 70,
          y: yPosition,
          size: 10,
          font: chineseFont,
          color: rgb(0.4, 0.4, 0.4)
        });
        yPosition -= 15;
      }
      
      yPosition -= 10;
      
      // 换页检查
      if (yPosition < 50) {
        yPosition = height - 50;
        pdfDoc.addPage(PageSizes.A4);
      }
    }
    
    // 添加打卡记录页（如果有选中的记录）
    if (selectedCheckins && selectedCheckins.length > 0) {
      const checkinPage = pdfDoc.addPage(PageSizes.A4);
      yPosition = height - 50;
      
      checkinPage.drawText('打卡记录', {
        x: 50,
        y: yPosition,
        size: 16,
        font: chineseFont,
        color: rgb(0.2, 0.2, 0.2)
      });
      
      yPosition -= 30;
      
      for (const checkin of selectedCheckins) {
        checkinPage.drawText(`${checkin.date} - ${checkin.point_name}`, {
          x: 50,
          y: yPosition,
          size: 10,
          font: chineseFont,
          color: rgb(0.3, 0.3, 0.3)
        });
        
        yPosition -= 15;
        
        if (checkin.notes) {
          checkinPage.drawText(checkin.notes, {
            x: 70,
            y: yPosition,
            size: 9,
            font: chineseFont,
            color: rgb(0.5, 0.5, 0.5)
          });
          yPosition -= 12;
        }
        
        yPosition -= 10;
        
        if (yPosition < 50) {
          yPosition = height - 50;
          pdfDoc.addPage(PageSizes.A4);
        }
      }
    }
    
    // 保存PDF
    const pdfBytes = await pdfDoc.save();
    
    // 上传到云存储
    const fileName = `report_${Date.now()}.pdf`;
    const { fileID } = await cloud.uploadFile({
      cloudPath: `reports/${fileName}`,
      fileContent: Buffer.from(pdfBytes)
    });
    
    return { success: true, fileID };
  } catch (err) {
    console.error('生成PDF失败:', err);
    return { success: false, error: err.message };
  }
};
```

### 3. `cloudfunctions/generatePDF/package.json`

```json
{
  "name": "generatePDF",
  "version": "1.0.0",
  "description": "生成PDF报告",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "~2.6.3",
    "pdf-lib": "^1.17.1"
  }
}
```

### 4. `pages/pdf-export/pdf-export.js` - PDF导出页面

```javascript
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
      
      const reportData = {
        title: '成长报告',
        subtitle: new Date().toLocaleDateString('zh-CN'),
        dimensions: Object.entries(this.data.scores).map(([key, score]) => ({
          key,
          label: getDimLabel(key),
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
```

### 5. `pages/pdf-export/pdf-export.wxml` - PDF导出页面模板

```xml
<view class="export-page">
  <view class="loading" wx:if="{{isLoading}}">正在生成PDF...</view>
  
  <view class="content" wx:else>
    <view class="header">
      <text class="title">导出PDF报告</text>
      <text class="subtitle">选择要导出的内容</text>
    </view>
    
    <!-- 导出选项 -->
    <view class="options">
      <view class="option-item" bindtap="onToggleSelectMode">
        <text class="option-label">选择打卡记录</text>
        <switch checked="{{selectMode}}" />
      </view>
    </view>
    
    <!-- 打卡记录列表 -->
    <view class="checkin-list" wx:if="{{selectMode}}">
      <view class="list-header">
        <text>选择打卡记录</text>
        <view class="select-actions">
          <text bindtap="onSelectAll">全选</text>
          <text bindtap="onDeselectAll">取消全选</text>
        </view>
      </view>
      
      <view 
        class="checkin-item {{selectedCheckins.indexOf(item._id) > -1 ? 'selected' : ''}}"
        wx:for="{{allCheckins}}"
        wx:key="_id"
        data-id="{{item._id}}"
        bindtap="onToggleCheckin"
      >
        <view class="checkin-date">{{item.date}}</view>
        <view class="checkin-point">{{item.point_name}}</view>
        <view class="checkin-check" wx:if="{{selectedCheckins.indexOf(item._id) > -1}}">✓</view>
      </view>
      
      <view class="empty" wx:if="{{allCheckins.length === 0}}">暂无打卡记录</view>
    </view>
    
    <!-- 导出按钮 -->
    <view class="export-actions">
      <button class="export-btn" bindtap="onExport">
        导出PDF {{selectMode ? '(' + selectedCheckins.length + '条记录)' : '(仅报告)'}}
      </button>
    </view>
  </view>
</view>
```

### 6. `pages/pdf-export/pdf-export.wxss` - PDF导出页面样式

```css
.export-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 28rpx;
  color: #666;
}

.content {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
}

.header {
  text-align: center;
  margin-bottom: 40rpx;
  padding-bottom: 30rpx;
  border-bottom: 1px solid #eee;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}

.subtitle {
  font-size: 24rpx;
  color: #666;
}

.options {
  margin-bottom: 30rpx;
}

.option-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1px solid #f0f0f0;
}

.option-label {
  font-size: 28rpx;
  color: #333;
}

.checkin-list {
  margin-bottom: 30rpx;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.list-header text {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.select-actions {
  display: flex;
  gap: 20rpx;
}

.select-actions text {
  font-size: 24rpx;
  color: #4ECDC4;
}

.checkin-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  margin-bottom: 10rpx;
  background: #f9f9f9;
  border-radius: 10rpx;
  border: 2px solid transparent;
}

.checkin-item.selected {
  background: #e8f8f5;
  border-color: #4ECDC4;
}

.checkin-date {
  font-size: 24rpx;
  color: #666;
  margin-right: 20rpx;
}

.checkin-point {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.checkin-check {
  width: 40rpx;
  height: 40rpx;
  background: #4ECDC4;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24rpx;
}

.empty {
  text-align: center;
  padding: 40rpx;
  font-size: 24rpx;
  color: #999;
}

.export-actions {
  margin-top: 30rpx;
}

.export-btn {
  background: #4ECDC4;
  color: white;
  border-radius: 50rpx;
  padding: 25rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: none;
}

.export-btn::after {
  border: none;
}
```

### 7. `pages/pdf-export/pdf-export.json` - PDF导出页面配置

```json
{
  "usingComponents": {},
  "navigationBarTitleText": "导出PDF",
  "navigationBarBackgroundColor": "#4ECDC4",
  "navigationBarTextStyle": "white"
}
```

## 需要修改的文件

### 8. `app.json` - 添加PDF导出页面路由

```json
{
  "pages": [
    "pages/index/index",
    "pages/detail/detail",
    "pages/near/near",
    "pages/recommend/recommend",
    "pages/profile/profile",
    "pages/checkin/checkin",
    "pages/role-select/role-select",
    "pages/report/report",
    "pages/pdf-export/pdf-export"
  ]
}
```

## 测试要求

1. 单次报告导出功能正常
2. 多选记录导出功能正常
3. 雷达图能正确显示在PDF中
4. 打卡记录能正确显示在PDF中
5. PDF能正确打开和预览
6. 文件名能正确生成

## 提交要求

```bash
git add utils/pdf-export.js cloudfunctions/generatePDF/ pages/pdf-export/ app.json
git commit -m "feat: add PDF export with selective checkin records"
```
