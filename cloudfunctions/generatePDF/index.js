const cloud = require('wx-server-sdk');
const { PDFDocument, PageSizes, rgb, StandardFonts } = require('pdf-lib');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { reportData, selectedCheckins, radarImage } = event;
  
  try {
    const pdfDoc = await PDFDocument.create();
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const chineseFont = await pdfDoc.embedFont(StandardFonts.Courier);
    
    const coverPage = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = coverPage.getSize();
    
    coverPage.drawText(reportData.title || '成长报告', {
      x: 50,
      y: height - 100,
      size: 24,
      font: chineseFont,
      color: rgb(0.2, 0.2, 0.2)
    });
    
    coverPage.drawText(reportData.subtitle || '', {
      x: 50,
      y: height - 130,
      size: 14,
      font: chineseFont,
      color: rgb(0.5, 0.5, 0.5)
    });
    
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
      
      if (yPosition < 50) {
        yPosition = height - 50;
        pdfDoc.addPage(PageSizes.A4);
      }
    }
    
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
