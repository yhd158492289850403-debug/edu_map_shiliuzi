const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  try {
    const result = await db.collection('checkins').add({
      data: {
        _openid: wxContext.OPENID,
        point_id: event.point_id,
        point_name: event.point_name,
        behavior: event.behavior || '',
        rating: event.rating || '',
        notes: event.notes || '',
        photos: event.photos || [],
        date: event.date || new Date().toISOString(),
        created_at: new Date()
      }
    })
    return { success: true, checkin_id: result._id }
  } catch (err) {
    return { success: false, error: err.message }
  }
}
