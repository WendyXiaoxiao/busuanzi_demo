Page({
  data: {
    divineTypes: {
      love: '感情姻缘',
      career: '事业财运',
      health: '健康平安',
      study: '学业考试'
    }
  },

  selectType(e) {
    const type = e.currentTarget.dataset.type;
    
    // 添加点击音效
    const innerAudioContext = wx.createInnerAudioContext();
    innerAudioContext.src = 'https://www.soundjay.com/buttons/sounds/button-09.mp3';
    innerAudioContext.play();

    // 保存选择的类型
    wx.setStorageSync('divineType', type);
    
    // 跳转到主页面
    wx.redirectTo({
      url: '/pages/index/index'
    });
  }
}); 