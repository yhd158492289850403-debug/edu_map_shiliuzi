const { drawRadarChart, DIM_KEYS } = require('./radar-chart');

/**
 * 生成雷达图图片
 * @param {Object} scores - 六维得分
 * @returns {Promise<string>} base64图片数据
 */
function generateRadarChartImage(scores) {
  return new Promise((resolve, reject) => {
    const query = wx.createSelectorQuery();
    query.select('#radarCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0]) {
          // 如果没有canvas节点，返回空
          resolve('');
          return;
        }
        
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        
        const dpr = wx.getSystemInfoSync().pixelRatio;
        canvas.width = 300 * dpr;
        canvas.height = 300 * dpr;
        ctx.scale(dpr, dpr);
        
        drawRadarChart(ctx, scores, {
          width: 300,
          height: 300,
          centerX: 150,
          centerY: 150,
          radius: 120
        });
        
        wx.canvasToTempFilePath({
          canvas: canvas,
          success: (res) => {
            // 读取文件为base64
            const fs = wx.getFileSystemManager();
            fs.readFile({
              filePath: res.tempFilePath,
              encoding: 'base64',
              success: (data) => {
                resolve(data.data);
              },
              fail: reject
            });
          },
          fail: reject
        });
      });
  });
}

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
      showMenu: true,
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
  generateFileName,
  generateRadarChartImage
};
