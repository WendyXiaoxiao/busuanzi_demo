// 云函数入口文件
const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    console.log('云函数收到请求:', event)
    
    // 从event中获取调用参数
    const { url, messages, model } = event
    
    // 请求模型API
    const response = await axios({
      method: 'post',
      url: url || 'http://vlrlabmonkey.xyz:6666/v1/chat/completions',
      data: {
        model: model || 'QwQ/Qwen3-32B-250415',
        messages: messages || []
      },
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30秒超时
    })
    
    console.log('API调用成功，返回状态:', response.status)
    
    // 返回结果
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('云函数出错:', error)
    // 生成包含错误信息的模拟响应
    return {
      success: false,
      error: error.message,
      // 模拟一个基本响应以避免客户端出错
      data: {
        choices: [{
          message: {
            content: `连接服务器时出错: ${error.message}`
          }
        }]
      }
    }
  }
} 