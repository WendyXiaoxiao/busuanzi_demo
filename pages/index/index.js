// pages/index/index.js
const INSCRIPTIONS = require('../../data/oracle_data.js').inscriptions;

Page({
  data: {
    examples: [
      "我今年能脱单吗？",
      "下个月事业如何？",
      "本周健康运势怎样？",
      "考试能拿高分吗？"
    ],
    userQuery: '',
    divinationResult: '',
    isLoading: false,
    matchedOracle: '',
    matchedMeaning: '',
    fortuneType: '',
    messages: [],
    funnyQuotes: [
      "这不是预测，是古老智慧的回声。",
      "你不是第一个问这个问题的人，三千年前他们就开始问了。",
      "古人用火灼龟壳，你用指尖点开神意。",
      "每一个问题，甲骨都认真倾听。",
      "这片刻的疑问，千年前也有人低声求问。",
      "千年之前，有人也为这事焦虑过。",
      "问题在变，命运的回应一如既往。",
      "你在提问，古人在沉思。",
      "甲骨虽冷，心意长热。",
      "有些答案，需由时间来低语。",
      "焚香不必，一问即通。",
      "一语千金，一问通古。",
      "谁说现代人不能问天？",
      "你问命运，命运从甲骨中回信。",
      "千年流转，一问如旧。",
      "有些答案，亘古不变。",
      "不是你选择了占卜，是它在等你来问。",
      "这不是解答，是一次古今对话。",
      "古人以骨问天，今人以心感应。",
      "这一问，通天通地通古今。"
    ]
  },

  handleInput(e) {
    // 更新用户问题，并添加长度限制
    const value = e.detail.value;
    const maxLength = 40; // 最大字符限制
    const trimmedValue = value.length > maxLength ? value.substring(0, maxLength) : value;
    
    this.setData({ userQuery: trimmedValue });
  },

  useExample(e) {
    const text = e.currentTarget.dataset.text;
    this.setData({ userQuery: text });
  },

  submitQuery() {
    const query = this.data.userQuery.trim();
    if (!query) {
      wx.showToast({ title: '请输入您的问题', icon: 'none' });
      return;
    }
    this.setData({ isLoading: true, divinationResult: '' });

    // Top-10 随机匹配
    const scored = INSCRIPTIONS.map(item => {
      let score = 0;
      for (let ch of query) if (item.meaning.includes(ch)) score++;
      return { item, score };
    }).filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    const fallback = INSCRIPTIONS[Math.floor(Math.random() * INSCRIPTIONS.length)];
    const matched = scored.length
      ? scored[Math.floor(Math.random() * scored.length)].item
      : fallback;

    // 50% 吉凶
    const fortuneType = Math.random() < 0.5 ? '吉' : '凶';

    this.setData({
      matchedOracle: matched.inscription,
      matchedMeaning: matched.meaning,
      fortuneType
    });

    const prompt = `你现在是一位古风神秘占卜师，会用简短而神秘的语言为用户解签。我将提供用户问题、甲骨文原文和释义，并指定此次签文的吉凶类型，请据此生成不超过25字的签文。

【用户问题】：${query}
【甲骨文卜辞原文】：${matched.inscription}
【释义】：${matched.meaning}
【吉凶类型】：${fortuneType}

请你根据指定的吉凶类型，生成一个简洁、风格古风、略带幽默或神秘色彩的签文：
- 若为 **吉**，请写出有利暗示、好运指引，结合现代流行语，给出新颖有趣的回答
- 若为 **凶**，请写出轻微劝诫或有趣的"失败警告"，可以适度使用现代网络流行语（如：桃花劫、内卷、孤寡、emo、不如修仙等）增强趣味性
- 无论吉凶，文字都要尽量短小精悍，最多25字
- 不要复述用户提问或卜辞内容，直接生成签文即可`;

    const userMessage = { role: 'user', content: prompt };
    const messages = [...this.data.messages, userMessage];
    this.setData({ messages });

    const apiUrl = 'http://127.0.0.1:30000/v1/chat/completions';
    const payload = { model: '/home/tiaozhanbei/.cache/modelscope/hub/models/Qwen/Qwen3-8B/', messages };
    console.log('🌐 请求:', apiUrl, payload);

    // 直接调用 API
    wx.request({
      url: apiUrl,
      method: 'POST',
      data: payload,
      header: { 'Content-Type': 'application/json',
                'api-key': 'None' },
      success: (res) => {
        console.log('API响应:', res.data);
        let resultText = '';
        const result = res.data;
        if (result.choices && result.choices.length) {
          resultText = result.choices[0].message.content;
        } else if (result.content || result.response || result.message) {
          resultText = result.content || result.response || result.message;
        } else {
          resultText = JSON.stringify(result);
        }
        if (resultText.length > 25) resultText = resultText.substring(0, 25);
        const assistantMessage = { role: 'assistant', content: resultText };
        this.setData({
          messages: [...messages, assistantMessage],
          divinationResult: resultText,
          isLoading: false
        });
        
        // 处理释义
        this.processKoreanMeaning(matched.meaning);
      },
      fail: (error) => {
        console.error('API请求失败:', error);
        wx.showToast({ title: '网络请求失败，请检查服务器连接', icon: 'none', duration: 2000 });
        this.setData({ divinationResult: '连接失败，请检查模型服务是否启动', isLoading: false });
      }
    });
  },
  
  processKoreanMeaning(originalMeaning) {
    const meaningPrompt = `你是一个甲骨文研究专家。
【甲骨文卜辞原文】：${this.data.matchedOracle}
【释义】：${originalMeaning}请你在不改变原来甲骨文释义的基础上，添加一些现代流行元素，把这句释义用更简短且新颖有趣的方式给出来，现在的释义还是有点难读懂，请直接给出修改后的释义。修改后的释义不超过50字。`;

    const userMessage = { role: 'user', content: meaningPrompt };
    const messages = [userMessage];
    
    const apiUrl = 'http://127.0.0.1:30000/v1/chat/completions';
    const payload = { model: '/home/tiaozhanbei/.cache/modelscope/hub/models/Qwen/Qwen3-8B/', messages };
    
    wx.request({
      url: apiUrl,
      method: 'POST',
      data: payload,
      timeout: 30000,
      header: { 'Content-Type': 'application/json', 'api-key': 'None' },
      success: (res) => {
        let modernMeaning = originalMeaning;
        const result = res.data;
        if (result.choices && result.choices.length) {
          modernMeaning = result.choices[0].message.content;
        }
        this.setData({ modernMeaning });
      },
      fail: (error) => {
        console.error('处理释义失败:', error);
        this.setData({ modernMeaning: originalMeaning });
      }
    });
  },

  toShare() {
    // 随机选择一条有趣的话
    const randomQuote = this.data.funnyQuotes[Math.floor(Math.random() * this.data.funnyQuotes.length)];
    
    const q = encodeURIComponent(this.data.userQuery);
    const r = encodeURIComponent(this.data.divinationResult);
    const oracle = encodeURIComponent(this.data.matchedOracle || '');
    const meaning = encodeURIComponent(this.data.matchedMeaning || '');
    const modernMeaning = encodeURIComponent(this.data.modernMeaning || this.data.matchedMeaning || '');
    const fortuneType = encodeURIComponent(this.data.fortuneType || '');
    const quote = encodeURIComponent(randomQuote);
    
    wx.navigateTo({
      url: `/pages/share/share?question=${q}&result=${r}&oracle=${oracle}&meaning=${meaning}&fortuneType=${fortuneType}&quote=${quote}&modernMeaning=${modernMeaning}`
    });
  }
});