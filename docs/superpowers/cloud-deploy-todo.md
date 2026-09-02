# 云开发部署计划（待办）

> 环境ID: `cloud1-d5gyas9xgbb003681`
> 状态：app.js 已配置环境ID，以下步骤需在微信开发者工具中操作

## 第1步：确认云开发环境已开通
- [ ] 打开微信开发者工具 → 点击工具栏「云开发」按钮
- [ ] 确认环境 `cloud1-d5gyas9xgbb003681` 已创建并可用
- [ ] 如果未开通：点击「开通」→ 选择基础版 → 记录环境ID

## 第2步：创建数据库集合
在云开发控制台 → 数据库 → 新建集合：

- [ ] **users** - 用户表
- [ ] **checkins** - 打卡记录表
- [ ] **learning_plans** - 学习方案表

权限设置：每个集合选择「仅创建者可读写」

## 第3步：为数据库集合添加索引
每个集合 → 索引管理 → 添加索引：

### users
- [ ] `_openid` (升序，唯一)

### checkins
- [ ] `_openid` (升序)
- [ ] `_openid + date` (复合索引，用于时间排序查询)

### learning_plans
- [ ] `_openid` (升序)

## 第4步：部署云函数
在微信开发者工具中，找到 `cloudfunctions/login` 文件夹：

- [ ] 右键 `login` 文件夹 → 上传并部署：云端安装依赖
- [ ] 等待部署完成（约30秒-1分钟）
- [ ] 部署成功后可以在云开发控制台 → 云函数 中看到

## 第5步：测试云开发
- [ ] 编译运行小程序
- [ ] 点击底部「我的」按钮进入个人档案页
- [ ] 检查页面是否正常显示（应显示「未登录」或用户信息）
- [ ] 尝试在行为寻课页展开教案后点击「去打卡」
- [ ] 填写打卡信息并提交
- [ ] 返回个人档案页查看打卡记录是否显示
- [ ] 在云开发控制台 → 数据库 → checkins 集合中确认数据已写入

## 第6步：后续扩展云函数（可选）
如需完整功能，还需创建以下云函数：

### addCheckin（添加打卡）
```javascript
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  try {
    const result = await db.collection('checkins').add({
      data: { _openid: wxContext.OPENID, ...event, created_at: new Date() }
    })
    return { success: true, checkin_id: result._id }
  } catch (err) {
    return { success: false, error: err.message }
  }
}
```

### getCheckins（获取打卡记录）
```javascript
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  try {
    const { limit = 20, offset = 0 } = event
    const { data } = await db.collection('checkins')
      .where({ _openid: wxContext.OPENID })
      .orderBy('date', 'desc')
      .skip(offset).limit(limit).get()
    return { success: true, checkins: data }
  } catch (err) {
    return { success: false, error: err.message }
  }
}
```

每个云函数都需要：
1. 创建文件夹 `cloudfunctions/<函数名>/`
2. 创建 `index.js`（代码如上）
3. 创建 `package.json`（依赖 `wx-server-sdk`）
4. 右键文件夹 → 上传并部署

## 完整文档
- 数据库设计详见：`docs/superpowers/cloud-database-design.md`
- 部署指南详见：`docs/superpowers/cloud-setup-guide.md`
