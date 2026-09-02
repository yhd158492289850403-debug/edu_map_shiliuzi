/**
 * 地理工具：Haversine 距离计算（km）
 * 用于"附近"页定位后计算点位距离并排序。
 */
function toRad(d) { return d * Math.PI / 180; }

/**
 * 两点球面距离（km）
 * @param {number} la1 纬度1
 * @param {number} lo1 经度1
 * @param {number} la2 纬度2
 * @param {number} lo2 经度2
 * @returns {number} 距离 km
 */
function distKm(la1, lo1, la2, lo2) {
  if (la1 == null || lo1 == null || la2 == null || lo2 == null) return null;
  const R = 6371;
  const a = toRad(la2 - la1);
  const b = toRad(lo2 - lo1);
  const x = Math.sin(a / 2) ** 2 +
    Math.cos(toRad(la1)) * Math.cos(toRad(la2)) * Math.sin(b / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/** 距离显示：<10km 保留 1 位小数，带单位 */
function fmtKm(km) {
  if (km == null) return '';
  if (km < 10) return km.toFixed(1) + ' km';
  return Math.round(km) + ' km';
}

module.exports = { toRad, distKm, fmtKm };
