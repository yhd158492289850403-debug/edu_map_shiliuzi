const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  try {
    const { limit = 50, offset = 0 } = event
    const { data } = await db.collection('checkins')
      .where({ _openid: wxContext.OPENID })
      .orderBy('date', 'desc')
      .skip(offset)
      .limit(limit)
      .get()
    return { success: true, checkins: data }
  } catch (err) {
    return { success: false, error: err.message }
  }
}
