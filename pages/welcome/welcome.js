Page({
  data: {
    isFirstVisit: true
  },

  onLoad() {
    // 检查是否首次访问
    const isFirstVisit = !wx.getStorageSync('hasVisited');
    this.setData({ isFirstVisit });
    if (isFirstVisit) {
      wx.setStorageSync('hasVisited', true);
    }
  },

  startDivine() {
    // 添加按钮点击音效
    const innerAudioContext = wx.createInnerAudioContext();
    innerAudioContext.src = 'https://www.soundjay.com/buttons/sounds/button-09.mp3';
    innerAudioContext.play();

    // 跳转到占卜类型选择页面
    wx.navigateTo({
      url: '/pages/divineType/divineType'
    });
  }
}); 