const cloud = require('wx-server-sdk');
const { PDFDocument, PageSizes, rgb, StandardFonts } = require('pdf-lib');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { reportData, selectedCheckins, radarImage } = event;
  
  try {
    const pdfDoc = await PDFDocument.create();
    
    // 使用 Helvetica 字体（不支持中文，但可以显示英文和数字）
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // 对于中文内容，使用简单的ASCII字符替代
    const coverPage = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = coverPage.getSize();
    
    // 标题使用英文
    coverPage.drawText('Growth Report', {
      x: 50,
      y: height - 100,
      size: 24,
      font: font,
      color: rgb(0.2, 0.2, 0.2)
    });
    
    // 副标题
    coverPage.drawText(reportData.subtitle || '', {
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
    
    // 使用英文标签
    const dimLabels = {
      '体素': 'Physical',
      '心素': 'Emotional',
      '灵素': 'Value',
      '智素': 'Cognitive',
      '行素': 'Action',
      '交素': 'Social'
    };
    
    for (const dim of (reportData.dimensions || [])) {
      const label = dimLabels[dim.key] || dim.key;
      detailPage.drawText(`${label}: ${dim.score}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: font,
        color: rgb(0.2, 0.2, 0.2)
      });
      
      yPosition -= 20;
      
      if (dim.description) {
        // 截断中文描述，只显示前20个字符
        const desc = dim.description.substring(0, 20) + (dim.description.length > 20 ? '...' : '');
        detailPage.drawText(desc, {
          x: 70,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0.4, 0.4, 0.4)
        });
        yPosition -= 15;
      }
      
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
        const date = checkin.date ? new Date(checkin.date).toLocaleDateString() : '';
        const pointName = checkin.point_name ? checkin.point_name.substring(0, 15) : '';
        checkinPage.drawText(`${date} - ${pointName}`, {
          x: 50,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0.3, 0.3, 0.3)
        });
        
        yPosition -= 15;
        
        if (checkin.notes) {
          const notes = checkin.notes.substring(0, 30) + (checkin.notes.length > 30 ? '...' : '');
          checkinPage.drawText(notes, {
            x: 70,
            y: yPosition,
            size: 9,
            font: font,
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
    
    const pdfBytes = await pdfDoc.save();
    
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
