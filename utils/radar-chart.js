/**
 * 雷达图绘制工具
 * 使用小程序原生Canvas绘制六维素养雷达图
 */

const DIM_KEYS = ['体素', '心素', '灵素', '智素', '行素', '交素'];
const DIM_COLORS = {
  primary: '#4A90D9',
  fill: 'rgba(74, 144, 217, 0.3)',
  grid: '#E8E8E8',
  label: '#333333',
  point: '#4A90D9',
  background: '#F8F9FA'
};

/**
 * 绘制雷达图
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文（新版2D API）
 * @param {Object} scores - 六维得分 {体素: 0-100, ...}
 * @param {Object} options - 配置选项
 */
function drawRadarChart(ctx, scores, options = {}) {
  const {
    width = 300,
    height = 300,
    centerX = 150,
    centerY = 150,
    radius = 120,
    levels = 5,
    showLabels = true,
    showPoints = true,
    showValues = true,
    colors = DIM_COLORS,
    animate = false
  } = options;

  const dimCount = DIM_KEYS.length;
  const angleStep = (2 * Math.PI) / dimCount;
  const startAngle = -Math.PI / 2;

  ctx.clearRect(0, 0, width, height);

  drawBackground(ctx, centerX, centerY, radius, colors.background);
  drawGrid(ctx, centerX, centerY, radius, levels, colors.grid);
  drawAxes(ctx, centerX, centerY, radius, dimCount, startAngle, angleStep, colors.grid);

  if (showLabels) {
    drawLabels(ctx, centerX, centerY, radius, dimCount, startAngle, angleStep, colors.label);
  }

  drawDataArea(ctx, scores, centerX, centerY, radius, dimCount, startAngle, angleStep, colors);

  if (showPoints) {
    drawDataPoints(ctx, scores, centerX, centerY, radius, dimCount, startAngle, angleStep, colors.point);
  }

  if (showValues) {
    drawValues(ctx, scores, centerX, centerY, radius, dimCount, startAngle, angleStep, colors.label);
  }
}

function drawBackground(ctx, centerX, centerY, radius, color) {
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 20, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawGrid(ctx, centerX, centerY, radius, levels, color) {
  for (let i = 1; i <= levels; i++) {
    const r = (radius / levels) * i;
    ctx.beginPath();
    ctx.arc(centerX, centerY, r, 0, 2 * Math.PI);
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
}

function drawAxes(ctx, centerX, centerY, radius, dimCount, startAngle, angleStep, color) {
  for (let i = 0; i < dimCount; i++) {
    const angle = startAngle + i * angleStep;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawLabels(ctx, centerX, centerY, radius, dimCount, startAngle, angleStep, color) {
  ctx.fillStyle = color;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < dimCount; i++) {
    const angle = startAngle + i * angleStep;
    const labelRadius = radius + 25;
    const x = centerX + labelRadius * Math.cos(angle);
    const y = centerY + labelRadius * Math.sin(angle);

    ctx.fillText(DIM_KEYS[i], x, y);
  }
}

function drawDataArea(ctx, scores, centerX, centerY, radius, dimCount, startAngle, angleStep, colors) {
  const points = getDataPoints(scores, centerX, centerY, radius, dimCount, startAngle, angleStep);

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();

  ctx.fillStyle = colors.fill;
  ctx.fill();
  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawDataPoints(ctx, scores, centerX, centerY, radius, dimCount, startAngle, angleStep, color) {
  const points = getDataPoints(scores, centerX, centerY, radius, dimCount, startAngle, angleStep);

  for (const point of points) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawValues(ctx, scores, centerX, centerY, radius, dimCount, startAngle, angleStep, color) {
  const points = getDataPoints(scores, centerX, centerY, radius, dimCount, startAngle, angleStep);

  ctx.fillStyle = color;
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  for (let i = 0; i < dimCount; i++) {
    const score = Math.round(scores[DIM_KEYS[i]] || 0);
    const x = points[i].x;
    const y = points[i].y - 10;

    ctx.fillText(score.toString(), x, y);
  }
}

function getDataPoints(scores, centerX, centerY, radius, dimCount, startAngle, angleStep) {
  const points = [];

  for (let i = 0; i < dimCount; i++) {
    const dimKey = DIM_KEYS[i];
    const score = (scores[dimKey] || 0) / 100;
    const angle = startAngle + i * angleStep;
    const r = radius * score;

    points.push({
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle)
    });
  }

  return points;
}

module.exports = {
  DIM_KEYS,
  DIM_COLORS,
  drawRadarChart,
  getDataPoints
};
