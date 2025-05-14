function drawTextAutoLine(ctx, text, x, y, maxWidth, lineHeight, align = 'center') {
  const lines = [];
  let start = 0;
  let end = 1;
  while (start < text.length) {
    while (end <= text.length && ctx.measureText(text.substring(start, end)).width <= maxWidth) {
      end++;
    }
    if (end === start + 1) {
      lines.push(text.substring(start, end));
      start = end;
      end = start + 1;
    } else {
      lines.push(text.substring(start, end - 1));
      start = end - 1;
      end = start + 1;
    }
  }
  ctx.setTextAlign(align);
  lines.forEach((line, idx) => {
    ctx.fillText(line, x, y + idx * lineHeight);
  });
  return y + lines.length * lineHeight;
}

// 从右到左，从上到下排列文字
function drawVerticalText(ctx, text, x, y, maxHeight, charWidth, align = 'center') {
  const lineHeight = charWidth * 1.6;
  const charsPerLine = Math.floor(maxHeight / lineHeight);
  const lines = [];
  
  // 将文本分成多列，每列从上到下排列
  for (let i = 0; i < text.length; i += charsPerLine) {
    lines.push(text.substring(i, i + charsPerLine));
  }
  
  // 从右到左绘制每列
  lines.forEach((line, idx) => {
    const startX = x - idx * charWidth * 1.5;
    for (let i = 0; i < line.length; i++) {
      ctx.fillText(line[i], startX, y + i * lineHeight);
    }
  });
  
  return x - lines.length * charWidth * 1.5;
}

// 从上到下排列文字
function drawVerticalQuote(ctx, text, x, y, maxHeight, fontSize, color) {
  ctx.setFontSize(fontSize);
  ctx.setFillStyle(color);
  ctx.setTextAlign('center');
  
  const lineHeight = fontSize * 1.5;
  const chars = text.split('');
  
  console.log('开始绘制竖排文字，总共字符：', chars.length);
  chars.forEach((char, idx) => {
    if (y + idx * lineHeight < maxHeight) {
      console.log(`绘制字符'${char}'在位置(${x}, ${y + idx * lineHeight})`);
      ctx.fillText(char, x, y + idx * lineHeight);
    }
  });
  
  return y + Math.min(chars.length * lineHeight, maxHeight);
}

Page({
  data: {
    question: '',
    result: '',
    oracle: '',
    meaning: '',
    fortuneType: '',
    quote: '',
    shareImage: '',
    isGenerating: false,
    previewWidth: 320,
    previewHeight: 500,
    modernMeaning: ''
  },
  onLoad(options) {
    console.log('分享页参数：', options);
    this.setPreviewSize();
    this.setData({
      question: decodeURIComponent(options.question || ''),
      result: decodeURIComponent(options.result || ''),
      oracle: decodeURIComponent(options.oracle || ''),
      meaning: decodeURIComponent(options.meaning || ''),
      fortuneType: decodeURIComponent(options.fortuneType || ''),
      quote: decodeURIComponent(options.quote || ''),
      modernMeaning: decodeURIComponent(options.modernMeaning || '')
    }, () => {
      this.generateShareImage();
    });
  },
  onShow() {
    this.setPreviewSize();
  },
  setPreviewSize() {
    try {
      const sys = wx.getSystemInfoSync();
      const previewWidth = sys.windowWidth;
      const previewHeight = Math.floor(previewWidth * 1.6); // 使用16:10的比例
      console.log('预览尺寸：', previewWidth, previewHeight);
      this.setData({ previewWidth, previewHeight });
    } catch (e) {
      console.error('获取系统信息失败：', e);
      this.setData({ previewWidth: 320, previewHeight: 512 });
    }
  },
  // 修改后的 generateShareImage，去掉 fs.copyFileSync，统一使用 wx.getImageInfo
  generateShareImage() {
    console.log('开始生成分享图');
    this.setData({ isGenerating: true });

    const canvasWidth = this.data.previewWidth;
    const canvasHeight = this.data.previewHeight;
    console.log('Canvas尺寸：', canvasWidth, canvasHeight);

    const ctx = wx.createCanvasContext('shareCanvas', this);
    if (!ctx) {
      console.error('创建Canvas上下文失败');
      wx.showToast({ title: '创建Canvas失败', icon: 'none' });
      this.setData({ isGenerating: false });
      return;
    }

    // 绘制背景色
    ctx.setFillStyle('#f5f5f5');
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 通过 wx.getImageInfo 加载静态背景图
    wx.getImageInfo({
      src: '/images/share_poster.png',
      success: imgRes => {
        console.log('通过 getImageInfo 获取背景图成功:', imgRes.path);
        ctx.drawImage(imgRes.path, 0, 0, canvasWidth, canvasHeight);
        this.continueDrawing(ctx, canvasWidth, canvasHeight);
      },
      fail: err => {
        console.error('加载背景图失败，使用简易模式:', err);
        this.generateSimpleShareImage(ctx, canvasWidth, canvasHeight);
      }
    });
  },
  
  // 继续绘制其他元素
  continueDrawing(ctx, canvasWidth, canvasHeight) {
    // 设置阴影效果，让文字更清晰
    ctx.setShadow(1, 1, 3, 'rgba(0,0,0,0.2)');
    
    // 用户问题 - 绘制在横线上，稍微调整Y位置
    const questionFontSize = 0.055 * canvasWidth; // 进一步增大字体
    ctx.setFontSize(questionFontSize);
    ctx.setFillStyle('#3a1a0a'); // 更深的棕色，更易辨认
    ctx.setTextAlign('center');
    
    const questionY = canvasHeight * 0.27; // 调整位置对准横线
    
    // 限制用户问题长度
    let questionText = this.data.question;
    if (questionText && questionText.length > 15) {
      questionText = questionText.substring(0, 15) + '...';
    }
    
    drawTextAutoLine(ctx, questionText, canvasWidth / 2, questionY, canvasWidth * 0.7, 0.06 * canvasWidth);
    
    // 拓片位置参数，根据截图调整
    const rubbing = {
      centerX: canvasWidth * 0.55,  // 拓片中心X坐标
      topY: canvasHeight * 0.38,    // 拓片顶部Y坐标
      width: canvasWidth * 0.55,    // 拓片宽度
      height: canvasHeight * 0.35   // 拓片高度
    };
    
    // 先绘制有趣的句子 - 在拓片左侧从上到下排列
    if (this.data.quote && this.data.quote.length > 0) {
      console.log('绘制有趣的句子:', this.data.quote);
      
      // 调整有趣的句子位置参数
      const quoteX = canvasWidth * 0.22; // 更靠左侧
      const quoteY = rubbing.topY + 20; // 靠上一些
      const quoteFontSize = 0.04 * canvasWidth;
      ctx.setFontSize(quoteFontSize);
      ctx.setFillStyle('#3a1a0a');
      
      // 计算行高
      const quoteLineHeight = quoteFontSize * 1.4;
      
      // 根据句子长度动态调整显示方式
      const quoteChars = this.data.quote.split('');
      const maxCharsToShow = Math.min(quoteChars.length, Math.floor(rubbing.height * 0.9 / quoteLineHeight));
      
      // 如果句子太长，则截断并添加省略号
      const displayQuoteChars = quoteChars.slice(0, maxCharsToShow);
      if (quoteChars.length > maxCharsToShow) {
        displayQuoteChars[maxCharsToShow - 1] = '…';
      }
      
      // 使用直接绘制方法画竖排文字
      displayQuoteChars.forEach((char, idx) => {
        const charY = quoteY + idx * quoteLineHeight;
        ctx.fillText(char, quoteX, charY);
      });
      
      console.log(`已绘制${displayQuoteChars.length}个字符，共${quoteChars.length}个字符`);
    } else {
      console.warn('引用文字为空，无法绘制');
    }
    
    // 占卜结果 - 在拓片上从右到左，从上到下排列
    const resultFontSize = 0.055 * canvasWidth;
    ctx.setFontSize(resultFontSize);
    ctx.setFillStyle('#000000'); // 黑色更加清晰
    
    // 计算占卜结果的位置，使其位于拓片中央
    const resultText = this.data.result || '';
    
    // 每列可容纳的字符数（拓片高度 / 行高）
    const resultLineHeight = resultFontSize * 1.5;
    const charsPerCol = Math.floor(rubbing.height * 0.8 / resultLineHeight);
    
    // 计算需要多少列
    const totalCols = Math.ceil(resultText.length / charsPerCol);
    
    // 计算文本总宽度
    const colWidth = resultFontSize * 1.6;
    const resultTextWidth = totalCols * colWidth;
    
    // 使用自定义方法直接画竖排文字，确保居中
    const resultChars = resultText.split('');
    let currentCol = 0;
    let charsInCurrentCol = 0;
    
    // 计算起始X位置，修正偏左问题
    // 首先计算文本总宽度，其次确保文本中心点与拓片中心点对齐
    const totalTextWidth = totalCols * colWidth;
    const textStartX = rubbing.centerX + (rubbing.width * 0.25) - (totalTextWidth / 2);
    
    resultChars.forEach((char, idx) => {
      if (charsInCurrentCol >= charsPerCol) {
        currentCol++;
        charsInCurrentCol = 0;
      }
      
      const x = textStartX - (currentCol * colWidth);
      const y = rubbing.topY + rubbing.height * 0.15 + charsInCurrentCol * resultLineHeight;
      
      ctx.fillText(char, x, y);
      charsInCurrentCol++;
    });
    
    // 去掉阴影效果，避免卷轴文字模糊
    ctx.setShadow(0, 0, 0, 'rgba(0,0,0,0)');
    
    // 在卷轴上绘制原文和释义 - 调整位置到卷轴图片上
    const scrollY = canvasHeight * 0.78; // 调整到卷轴中间位置
    
    // 甲骨文原文 - 简化处理
    const oracleFontSize = 0.042 * canvasWidth;
    ctx.setFontSize(oracleFontSize);
    ctx.setFillStyle('#2a1a0a');
    ctx.setTextAlign('center');
    
    // 绘制原文
    let oracleText = this.data.oracle || '';
    if (oracleText.length > 15) {
      oracleText = oracleText.substring(0, 15) + '...';
    }
    
    // 卷轴宽度限制
    const scrollWidth = canvasWidth * 0.7;
    
    // 使用简单的drawTextAutoLine绘制原文
    const nextY = drawTextAutoLine(
      ctx,
      `甲骨文原文: ${oracleText}`,
      canvasWidth / 2,
      scrollY,
      scrollWidth,
      oracleFontSize * 1.3
    );
    
    // 释义 - 简化处理
    const meaningFontSize = 0.038 * canvasWidth;
    ctx.setFontSize(meaningFontSize);
    ctx.setFillStyle('#3a250f');
    
    // 准备释义文本
    let meaningText = this.data.modernMeaning || this.data.meaning || '';
    if (meaningText.length > 25) {
      meaningText = meaningText.substring(0, 25) + '...';
    }
    
    // 使用简单的drawTextAutoLine绘制释义
    drawTextAutoLine(
      ctx,
      `释义: ${meaningText}`,
      canvasWidth / 2,
      nextY + 5, // 添加一点间隔
      scrollWidth,
      meaningFontSize * 1.3
    );
    
    // 吉/凶印章
    if (this.data.fortuneType) {
      const stampColor = this.data.fortuneType === '吉' ? '#d94e3b' : '#3b7a2f';
      ctx.setFillStyle(stampColor);
      ctx.beginPath();
      ctx.arc(canvasWidth - 40, 40, 18, 0, 2 * Math.PI);
      ctx.fill();
      ctx.setFillStyle('#fff');
      ctx.setFontSize(0.055 * canvasWidth);
      ctx.setTextAlign('center');
      ctx.fillText(this.data.fortuneType, canvasWidth - 40, 46);
    }
    
    ctx.draw(false, () => {
      console.log('Canvas绘制完成，开始生成图片');
      wx.canvasToTempFilePath({
        canvasId: 'shareCanvas',
        width: canvasWidth,
        height: canvasHeight,
        destWidth: canvasWidth,
        destHeight: canvasHeight,
        success: res => {
          console.log('生成图片成功：', res.tempFilePath);
          this.setData({ 
            shareImage: res.tempFilePath, 
            isGenerating: false 
          });
        },
        fail: err => {
          console.error('生成图片失败：', err);
          wx.showToast({ title: '生成失败', icon: 'none' });
          this.setData({ isGenerating: false });
        }
      }, this);
    });
  },
  
  // 生成简单的分享图（无背景图版本）
  generateSimpleShareImage(ctx, width, height) {
    // 绘制纯色背景
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#fdf7ec');
    grad.addColorStop(1, '#eeeadc');
    ctx.setFillStyle(grad);
    ctx.fillRect(0, 0, width, height);
    
    // 古风边框
    ctx.setStrokeStyle('#c9a774');
    ctx.setLineWidth(4);
    ctx.strokeRect(10, 10, width - 20, height - 20);
    
    // 标题
    ctx.setFontSize(0.05 * width);
    ctx.setFillStyle('#333333');
    ctx.setTextAlign('center');
    ctx.fillText('甲骨文占卜', width / 2, height * 0.1);
    
    // 用户问题
    ctx.setFontSize(0.045 * width);
    let y = height * 0.2;
    ctx.fillText('我的提问', width / 2, y);
    y = drawTextAutoLine(ctx, this.data.question, width / 2, y + 0.06 * width, width * 0.8, 0.06 * width) + 0.04 * height;
    
    // 占卜结果
    ctx.setFontSize(0.05 * width);
    ctx.setFillStyle('#7a5e4b');
    y = drawTextAutoLine(ctx, this.data.result, width / 2, y, width * 0.8, 0.06 * width) + 0.05 * height;
    
    // 甲骨文原文和释义
    ctx.setFontSize(0.04 * width);
    ctx.setFillStyle('#44332f');
    y = drawTextAutoLine(ctx, `甲骨文原文: ${this.data.oracle}`, width / 2, y, width * 0.8, 0.05 * width) + 0.03 * height;
    
    ctx.setFontSize(0.035 * width);
    ctx.setFillStyle('#666666');
    y = drawTextAutoLine(ctx, `释义: ${this.data.meaning}`, width / 2, y, width * 0.8, 0.045 * width) + 0.03 * height;
    
    // 吉凶印章
    if (this.data.fortuneType) {
      const stampColor = this.data.fortuneType === '吉' ? '#d94e3b' : '#3b7a2f';
      ctx.setFillStyle(stampColor);
      ctx.beginPath();
      ctx.arc(width - 40, 40, 18, 0, 2 * Math.PI);
      ctx.fill();
      ctx.setFillStyle('#fff');
      ctx.setFontSize(0.055 * width);
      ctx.setTextAlign('center');
      ctx.fillText(this.data.fortuneType, width - 40, 46);
    }
    
    // 名言警句
    ctx.setFontSize(0.035 * width);
    ctx.setFillStyle('#7a5e4b');
    drawTextAutoLine(ctx, this.data.quote, width / 2, height - 0.15 * height, width * 0.8, 0.05 * width);
    
    ctx.draw(false, () => {
      wx.canvasToTempFilePath({
        canvasId: 'shareCanvas',
        width: width,
        height: height, 
        destWidth: width,
        destHeight: height,
        success: res => {
          console.log('生成简单图片成功：', res.tempFilePath);
          this.setData({ 
            shareImage: res.tempFilePath, 
            isGenerating: false 
          });
        },
        fail: err => {
          console.error('生成简单图片失败：', err);
          wx.showToast({ title: '生成失败', icon: 'none' });
          this.setData({ isGenerating: false });
        }
      }, this);
    });
  },
  saveImage() {
    if (!this.data.shareImage) {
      wx.showToast({ title: '请先生成分享图', icon: 'none' });
      return;
    }
    wx.saveImageToPhotosAlbum({
      filePath: this.data.shareImage,
      success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
      fail: () => wx.showToast({ title: '保存失败', icon: 'none' })
    });
  }
});