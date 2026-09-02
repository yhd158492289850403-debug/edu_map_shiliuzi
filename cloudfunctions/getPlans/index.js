const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  try {
    const { limit = 20, offset = 0 } = event
    const { data } = await db.collection('learning_plans')
      .where({ _openid: wxContext.OPENID })
      .orderBy('created_at', 'desc')
      .skip(offset)
      .limit(limit)
      .get()
    return { success: true, plans: data }
  } catch (err) {
    return { success: false, error: err.message }
  }
}
