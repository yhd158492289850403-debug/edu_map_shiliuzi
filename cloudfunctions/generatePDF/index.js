const cloud = require('wx-server-sdk');
const { PDFDocument, PageSizes, rgb, StandardFonts } = require('pdf-lib');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 将中文字符转换为安全的ASCII字符串
function sanitizeForPdf(text) {
  if (!text) return '';
  // 移除所有非ASCII字符，保留英文、数字、标点
  return text.replace(/[^\x00-\x7F]/g, '').trim() || 'N/A';
}

// 获取英文维度标签
function getDimLabelEn(dimKey) {
  const labels = {
    '体素': 'Physical',
    '心素': 'Emotional',
    '灵素': 'Value',
    '智素': 'Cognitive',
    '行素': 'Action',
    '交素': 'Social'
  };
  return labels[dimKey] || dimKey;
}

exports.main = async (event, context) => {
  const { reportData, selectedCheckins, radarImage } = event;
  
  try {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    const coverPage = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = coverPage.getSize();
    
    // 标题
    coverPage.drawText('Growth Report', {
      x: 50,
      y: height - 100,
      size: 24,
      font: font,
      color: rgb(0.2, 0.2, 0.2)
    });
    
    // 副标题
    const subtitle = sanitizeForPdf(reportData.subtitle) || new Date().toLocaleDateString('en-US');
    coverPage.drawText(subtitle, {
      x: 50,
      y: height - 130,
      size: 14,
      font: font,
      color: rgb(0.5, 0.5, 0.5)
    });
    
    // 绘制雷达图
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
    
    // 维度详情页
    const detailPage = pdfDoc.addPage(PageSizes.A4);
    let yPosition = height - 50;
    
    for (const dim of (reportData.dimensions || [])) {
      const label = getDimLabelEn(dim.key);
      detailPage.drawText(`${label}: ${dim.score}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: font,
        color: rgb(0.2, 0.2, 0.2)
      });
      
      yPosition -= 20;
      yPosition -= 10;
      
      if (yPosition < 50) {
        yPosition = height - 50;
        pdfDoc.addPage(PageSizes.A4);
      }
    }
    
    // 打卡记录页
    if (selectedCheckins && selectedCheckins.length > 0) {
      const checkinPage = pdfDoc.addPage(PageSizes.A4);
      yPosition = height - 50;
      
      checkinPage.drawText('Check-in Records', {
        x: 50,
        y: yPosition,
        size: 16,
        font: font,
        color: rgb(0.2, 0.2, 0.2)
      });
      
      yPosition -= 30;
      
      for (const checkin of selectedCheckins) {
        const date = checkin.date ? new Date(checkin.date).toLocaleDateString('en-US') : '';
        const pointName = sanitizeForPdf(checkin.point_name);
        checkinPage.drawText(`${date} - ${pointName}`, {
          x: 50,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0.3, 0.3, 0.3)
        });
        
        yPosition -= 15;
        
        if (yPosition < 50) {
          yPosition = height - 50;
          pdfDoc.addPage(PageSizes.A4);
        }
      }
    }
    
    const pdfBytes = await pdfDoc.save();
    
    const fileName = `report_${Date.now()}.pdf`;
    const { fileID } = await cloud.uploadFile({
      cloudPath: `reports/${fileName}`,
      fileContent: Buffer.from(pdfBytes)
    });
    
    return { success: true, fileID };
  } catch (err) {
    console.error('PDF generation failed:', err);
    return { success: false, error: err.message };
  }
};
