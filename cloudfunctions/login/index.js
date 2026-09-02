// 云函数入口文件 - login
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  try {
    // 获取openid
    const openid = wxContext.OPENID
    
    // 检查用户是否已存在
    const db = cloud.database()
    const { data } = await db.collection('users').where({
      _openid: openid
    }).get()

    if (data.length === 0) {
      // 新用户，创建记录
      await db.collection('users').add({
        data: {
          _openid: openid,
          nickname: '微信用户',
          avatar: '',
          created_at: new Date(),
          updated_at: new Date()
        }
      })
    }

    return {
      openid: openid,
      userInfo: data.length > 0 ? data[0] : null
    }
  } catch (err) {
    console.error('Login failed:', err)
    return {
      openid: wxContext.OPENID,
      userInfo: null,
      error: err.message
    }
  }
}
