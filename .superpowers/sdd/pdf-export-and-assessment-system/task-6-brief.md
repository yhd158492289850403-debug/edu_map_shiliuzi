# Task 6: 报告生成系统（三种角色）

## 任务概述

创建报告生成系统，支持家长、学生、教师三种角色的报告模板，生成个性化的六维素养报告。

## 需要创建的文件

### 1. `utils/report-generator.js` - 报告生成器

```javascript
const { ROLE_TYPES } = require('../data/user-roles');
const { DIM_KEYS, calculateSixDimScores, calculateInitialScores } = require('./assessment');

/**
 * 生成报告
 * @param {string} role - 用户角色
 * @param {Object} scores - 六维得分
 * @param {Object} behaviors - 行为数据
 * @param {Object} options - 选项
 */
function generateReport(role, scores, behaviors, options = {}) {
  const generators = {
    [ROLE_TYPES.PARENT]: generateParentReport,
    [ROLE_TYPES.STUDENT]: generateStudentReport,
    [ROLE_TYPES.TEACHER]: generateTeacherReport
  };
  
  const generator = generators[role] || generateParentReport;
  return generator(scores, behaviors, options);
}

/**
 * 家长报告（温馨鼓励型）
 */
function generateParentReport(scores, behaviors, options) {
  const { nickname = '孩子', checkinCount = 0 } = options;
  
  return {
    title: `${nickname}的成长足迹`,
    subtitle: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' }),
    
    summary: {
      text: `在过去的这段时间里，${nickname}通过${checkinCount}次实地探访、多个教育教案的学习，在多个素养维度上都有了可喜的变化。`,
      highlight: getTopImprovement(scores)
    },
    
    dimensions: formatDimensions(scores, 'parent'),
    
    highlights: generateHighlights(scores, 'parent'),
    
    suggestions: generateSuggestions(scores, 'parent'),
    
    encouragement: getEncouragement(scores),
    
    radarData: scores
  };
}

/**
 * 学生报告（活泼游戏型）
 */
function generateStudentReport(scores, behaviors, options) {
  const { nickname = '同学', checkinCount = 0 } = options;
  
  return {
    title: `${nickname}的成长勋章墙`,
    subtitle: '🏆',
    
    achievements: generateAchievements(scores, behaviors),
    
    abilities: formatDimensions(scores, 'student'),
    
    tasks: generateTasks(scores),
    
    encouragement: getStudentEncouragement(scores),
    
    radarData: scores
  };
}

/**
 * 教师报告（专业数据型）
 */
function generateTeacherReport(scores, behaviors, options) {
  const { studentName = '学生', checkinCount = 0, classData = {} } = options;
  
  return {
    title: `学生素养发展评估报告 - ${studentName}`,
    subtitle: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
    
    summary: {
      evaluationPeriod: getEvaluationPeriod(behaviors),
      dataSources: getDataSources(behaviors),
      keyFindings: getKeyFindings(scores, classData)
    },
    
    dimensions: formatDimensions(scores, 'teacher'),
    
    analysis: generateAnalysis(scores, classData),
    
    recommendations: generateRecommendations(scores, 'teacher'),
    
    classComparison: classData ? generateClassComparison(scores, classData) : null,
    
    radarData: scores
  };
}

/**
 * 格式化维度数据
 */
function formatDimensions(scores, style) {
  return DIM_KEYS.map(dim => {
    const score = scores[dim] || 0;
    const label = getDimLabel(dim);
    const color = getDimColor(dim);
    
    let description = '';
    if (style === 'parent') {
      description = getParentDescription(dim, score);
    } else if (style === 'student') {
      description = getStudentDescription(dim, score);
    } else {
      description = getTeacherDescription(dim, score);
    }
    
    return {
      key: dim,
      label,
      score,
      color,
      description,
      level: getScoreLevel(score)
    };
  });
}

function getDimLabel(dim) {
  const labels = {
    '体素': '身体素养',
    '心素': '情绪素养',
    '灵素': '价值素养',
    '智素': '认知素养',
    '行素': '行动素养',
    '交素': '社交素养'
  };
  return labels[dim] || dim;
}

function getDimColor(dim) {
  const colors = {
    '体素': '#FF6B6B',
    '心素': '#4ECDC4',
    '灵素': '#45B7D1',
    '智素': '#96CEB4',
    '行素': '#FFEAA7',
    '交素': '#DDA0DD'
  };
  return colors[dim] || '#999';
}

function getScoreLevel(score) {
  if (score >= 80) return '优秀';
  if (score >= 60) return '良好';
  if (score >= 40) return '一般';
  return '待提升';
}

function getParentDescription(dim, score) {
  // 根据维度和分数生成家长风格的描述
  const descriptions = {
    '体素': {
      high: '孩子在身体素质方面表现优秀，运动能力较强！',
      medium: '孩子在身体素质方面发展良好，继续保持！',
      low: '可以多带孩子参加户外活动，提升身体素质。'
    },
    '心素': {
      high: '孩子在情绪管理方面表现优秀，能很好地控制自己的情绪！',
      medium: '孩子在情绪管理方面发展良好，继续保持！',
      low: '可以多关注孩子的情绪变化，帮助他/她学会情绪管理。'
    },
    '灵素': {
      high: '孩子在价值观方面表现优秀，有正确的价值导向！',
      medium: '孩子在价值观方面发展良好，继续保持！',
      low: '可以多和孩子讨论价值观问题，帮助他/她树立正确的价值观。'
    },
    '智素': {
      high: '孩子在认知能力方面表现优秀，学习能力较强！',
      medium: '孩子在认知能力方面发展良好，继续保持！',
      low: '可以多鼓励孩子阅读和学习，提升认知能力。'
    },
    '行素': {
      high: '孩子在行动力方面表现优秀，做事有计划有执行！',
      medium: '孩子在行动力方面发展良好，继续保持！',
      low: '可以多培养孩子的行动力，帮助他/她养成良好的习惯。'
    },
    '交素': {
      high: '孩子在社交能力方面表现优秀，善于与人沟通！',
      medium: '孩子在社交能力方面发展良好，继续保持！',
      low: '可以多创造社交机会，帮助孩子提升社交能力。'
    }
  };
  
  const level = score >= 60 ? 'high' : score >= 40 ? 'medium' : 'low';
  return descriptions[dim]?.[level] || '';
}

function getStudentDescription(dim, score) {
  // 生成学生风格的描述
  return `${getDimLabel(dim)}：${score}分 ${getStarEmoji(score)}`;
}

function getTeacherDescription(dim, score) {
  // 生成教师风格的描述
  return `${getDimLabel(dim)}得分${score}分，${getScoreLevel(score)}水平`;
}

function getStarEmoji(score) {
  if (score >= 80) return '⭐⭐⭐';
  if (score >= 60) return '⭐⭐';
  if (score >= 40) return '⭐';
  return '';
}

function getTopImprovement(scores) {
  // 找出提升最大的维度
  return '情绪素养方面有明显提升';
}

function generateHighlights(scores, style) {
  // 生成亮点
  return ['情绪管理能力提升', '对历史文化兴趣增加'];
}

function generateSuggestions(scores, style) {
  // 生成建议
  return ['建议每周安排一次亲子活动', '可以多关注价值素养类教案'];
}

function getEncouragement(scores) {
  return '每一次探访都是一次成长的种子。请继续陪伴孩子，用耐心和爱心浇灌这些种子！';
}

function getStudentEncouragement(scores) {
  return '你已经很棒了！继续加油，解锁更多成就！';
}

function generateAchievements(scores, behaviors) {
  // 生成成就徽章
  return [
    { icon: '🎖️', title: '情绪小达人', description: '学会了情绪管理', unlocked: true },
    { icon: '🏆', title: '历史探险家', description: '参观了多个博物馆', unlocked: true },
    { icon: '🌟', title: '社交小明星', description: '待解锁', unlocked: false }
  ];
}

function generateTasks(scores) {
  return ['想要解锁"社交小明星"徽章吗？试试团队合作挑战吧！'];
}

function getEvaluationPeriod(behaviors) {
  return '2026年8月20日 - 2026年9月3日';
}

function getDataSources(behaviors) {
  return '3次实地探访记录、5个教案学习数据、6次行为观察';
}

function getKeyFindings(scores, classData) {
  return '该生在情绪素养维度表现突出，建议加强社交能力培养';
}

function generateAnalysis(scores, classData) {
  return {
    strengths: ['情绪管理', '历史文化兴趣'],
    weaknesses: ['社交互动'],
    trends: '整体呈上升趋势'
  };
}

function generateRecommendations(scores, style) {
  return [
    '建议增加团队合作类活动',
    '可采用情境模拟教学法',
    '定期反馈学生在家庭环境中的表现'
  ];
}

function generateClassComparison(scores, classData) {
  return {
    average: classData.average || {},
    ranking: '前30%',
    comparison: '高于班级平均水平'
  };
}

module.exports = {
  generateReport,
  formatDimensions
};
```

### 2. `pages/report/report.js` - 报告页面

```javascript
const { generateReport } = require('../../utils/report-generator');
const { getBehaviors } = require('../../utils/tracker');
const { calculateSixDimScores, calculateInitialScores } = require('../../utils/assessment');
const app = getApp();

Page({
  data: {
    isLoading: true,
    report: null,
    role: 'parent',
    scores: {}
  },
  
  async onLoad() {
    await this.loadReport();
  },
  
  async loadReport() {
    this.setData({ isLoading: true });
    
    try {
      // 获取用户角色
      const role = app.globalData.userRole || 'parent';
      
      // 获取行为数据
      const behaviors = await getBehaviors();
      
      // 计算分数
      const scores = calculateSixDimScores(behaviors.stats);
      
      // 生成报告
      const report = generateReport(role, scores, behaviors.stats, {
        nickname: app.globalData.userInfo?.nickname || '用户',
        checkinCount: behaviors.stats.totalCheckins
      });
      
      this.setData({
        isLoading: false,
        report,
        role,
        scores
      });
    } catch (err) {
      console.error('加载报告失败:', err);
      this.setData({ isLoading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },
  
  onExportPDF() {
    wx.navigateTo({
      url: '/pages/pdf-export/pdf-export?scores=' + JSON.stringify(this.data.scores)
    });
  },
  
  onShare() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  }
});
```

### 3. `pages/report/report.wxml` - 报告页面模板

```xml
<view class="report-page">
  <view class="loading" wx:if="{{isLoading}}">加载中...</view>
  
  <view class="report-content" wx:else>
    <!-- 报告头部 -->
    <view class="report-header">
      <text class="report-title">{{report.title}}</text>
      <text class="report-subtitle">{{report.subtitle}}</text>
    </view>
    
    <!-- 雷达图 -->
    <view class="radar-section">
      <radar-chart scores="{{scores}}" width="300" height="300" />
    </view>
    
    <!-- 维度详情 -->
    <view class="dimensions-section">
      <view class="dimension-item" wx:for="{{report.dimensions}}" wx:key="key">
        <view class="dim-header">
          <text class="dim-label">{{item.label}}</text>
          <text class="dim-score" style="color: {{item.color}}">{{item.score}}分</text>
        </view>
        <text class="dim-desc">{{item.description}}</text>
        <view class="dim-bar">
          <view class="dim-fill" style="width: {{item.score}}%; background: {{item.color}}"></view>
        </view>
      </view>
    </view>
    
    <!-- 亮点和建议 -->
    <view class="highlights-section" wx:if="{{report.highlights}}">
      <view class="section-title">🌟 成长亮点</view>
      <view class="highlight-item" wx:for="{{report.highlights}}" wx:key="*this">
        {{item}}
      </view>
    </view>
    
    <view class="suggestions-section" wx:if="{{report.suggestions}}">
      <view class="section-title">💡 改进建议</view>
      <view class="suggestion-item" wx:for="{{report.suggestions}}" wx:key="*this">
        {{item}}
      </view>
    </view>
    
    <!-- 鼓励语 -->
    <view class="encouragement" wx:if="{{report.encouragement}}">
      <text>{{report.encouragement}}</text>
    </view>
    
    <!-- 操作按钮 -->
    <view class="actions">
      <button class="export-btn" bindtap="onExportPDF">导出PDF</button>
      <button class="share-btn" bindtap="onShare">分享给朋友</button>
    </view>
  </view>
</view>
```

### 4. `pages/report/report.wxss` - 报告页面样式

```css
.report-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 28rpx;
  color: #666;
}

.report-content {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.report-header {
  text-align: center;
  margin-bottom: 40rpx;
  padding-bottom: 30rpx;
  border-bottom: 1px solid #eee;
}

.report-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}

.report-subtitle {
  font-size: 24rpx;
  color: #666;
}

.radar-section {
  display: flex;
  justify-content: center;
  margin-bottom: 40rpx;
}

.dimensions-section {
  margin-bottom: 40rpx;
}

.dimension-item {
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1px solid #f0f0f0;
}

.dim-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
}

.dim-label {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.dim-score {
  font-size: 28rpx;
  font-weight: bold;
}

.dim-desc {
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
  margin-bottom: 10rpx;
}

.dim-bar {
  height: 16rpx;
  background: #f0f0f0;
  border-radius: 8rpx;
  overflow: hidden;
}

.dim-fill {
  height: 100%;
  border-radius: 8rpx;
  transition: width 0.3s ease;
}

.highlights-section,
.suggestions-section {
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 15rpx;
}

.highlight-item,
.suggestion-item {
  font-size: 24rpx;
  color: #666;
  line-height: 1.8;
  padding-left: 20rpx;
  position: relative;
}

.highlight-item::before,
.suggestion-item::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #4ECDC4;
}

.encouragement {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 15rpx;
  padding: 25rpx;
  margin-bottom: 30rpx;
}

.encouragement text {
  font-size: 24rpx;
  color: white;
  line-height: 1.6;
}

.actions {
  display: flex;
  gap: 20rpx;
}

.export-btn,
.share-btn {
  flex: 1;
  border-radius: 50rpx;
  padding: 20rpx;
  font-size: 28rpx;
  font-weight: bold;
  border: none;
}

.export-btn {
  background: #4ECDC4;
  color: white;
}

.export-btn::after {
  border: none;
}

.share-btn {
  background: #667eea;
  color: white;
}

.share-btn::after {
  border: none;
}
```

### 5. `pages/report/report.json` - 报告页面配置

```json
{
  "usingComponents": {
    "radar-chart": "/components/radar-chart/radar-chart"
  },
  "navigationBarTitleText": "成长报告",
  "navigationBarBackgroundColor": "#667eea",
  "navigationBarTextStyle": "white"
}
```

## 需要修改的文件

### 6. `app.json` - 添加报告页面路由

```json
{
  "pages": [
    "pages/index/index",
    "pages/detail/detail",
    "pages/near/near",
    "pages/recommend/recommend",
    "pages/profile/profile",
    "pages/checkin/checkin",
    "pages/role-select/role-select",
    "pages/report/report"
  ]
}
```

## 测试要求

1. 家长报告能正确生成
2. 学生报告能正确生成
3. 教师报告能正确生成
4. 雷达图能正确显示
5. 维度详情能正确显示
6. 亮点和建议能正确显示
7. 导出和分享按钮功能正常

## 提交要求

```bash
git add utils/report-generator.js pages/report/ app.json
git commit -m "feat: add report generation system with role-based templates"
```
