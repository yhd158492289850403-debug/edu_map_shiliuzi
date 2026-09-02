const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  try {
    const result = await db.collection('learning_plans').add({
      data: {
        _openid: wxContext.OPENID,
        behavior: event.behavior,
        subs: event.subs || [],
        slices: event.slices || [],
        created_at: new Date()
      }
    })
    return { success: true, plan_id: result._id }
  } catch (err) {
    return { success: false, error: err.message }
  }
}
