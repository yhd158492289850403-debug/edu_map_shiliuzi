# 云开发部署指南

## 前置条件

1. 已注册微信小程序（AppID: `wx20f82f75dc26f148`）
2. 微信开发者工具已安装
3. 云开发功能已开通

## 第一步：开通云开发

1. 打开微信开发者工具
2. 点击工具栏的「云开发」按钮
3. 点击「开通」
4. 创建云开发环境：
   - 环境名称：`edu-map-prod`（或自定义）
   - 选择「基础版」（免费额度足够测试）
5. 记录**环境ID**（格式类似 `edu-map-prod-xxxxx`）

## 第二步：配置环境ID

打开 `app.js`，将 `your-env-id` 替换为你的环境ID：

```javascript
wx.cloud.init({
  env: 'edu-map-prod-xxxxx', // 替换这里
  traceUser: true
});
```

## 第三步：创建数据库集合

在云开发控制台 → 数据库，创建以下集合：

### 集合1: `users`
- 权限设置：仅创建者可读写
- 索引：
  - `_openid` (升序，唯一)

### 集合2: `checkins`
- 权限设置：仅创建者可读写
- 索引：
  - `_openid` (升序)
  - `_openid + date` (复合索引，用于时间排序)

### 集合3: `learning_plans`
- 权限设置：仅创建者可读写
- 索引：
  - `_openid` (升序)

## 第四步：部署云函数

### 部署 login 云函数

1. 在微信开发者工具中，找到 `cloudfunctions/login` 文件夹
2. 右键点击 → 选择「上传并部署：云端安装依赖」
3. 等待部署完成（通常30秒-1分钟）

### 部署其他云函数（如需要）

需要创建以下云函数：

#### `addCheckin` 云函数
```javascript
// cloudfunctions/addCheckin/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  
  try {
    const result = await db.collection('checkins').add({
      data: {
        _openid: wxContext.OPENID,
        ...event,
        created_at: new Date()
      }
    })
    return { success: true, checkin_id: result._id }
  } catch (err) {
    return { success: false, error: err.message }
  }
}
```

#### `getCheckins` 云函数
```javascript
// cloudfunctions/getCheckins/index.js
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
      .skip(offset)
      .limit(limit)
      .get()
    
    return { success: true, checkins: data }
  } catch (err) {
    return { success: false, error: err.message }
  }
}
```

## 第五步：测试云开发

1. 在微信开发者工具中编译运行小程序
2. 打开「个人档案」页面
3. 检查是否显示「未登录」或用户信息
4. 尝试添加打卡记录
5. 在云开发控制台查看数据是否写入成功

## 常见问题

### Q: 云开发开通失败
A: 确保小程序已认证（个人主体也可以），且账号有云开发权限。

### Q: 云函数部署失败
A: 检查 package.json 中的 wx-server-sdk 版本，通常使用 `~2.6.3` 即可。

### Q: 数据库写入失败
A: 检查集合权限设置，确保是「仅创建者可读写」。

### Q: openid 获取失败
A: 确保 `app.js` 中的云环境ID正确，且 login 云函数已部署。

## 数据迁移（如需要）

如果需要将现有数据导入云数据库，可以：

1. 在云开发控制台 → 数据库 → 导入
2. 支持 JSON 格式导入
3. 或者写一个迁移脚本

## 监控和维护

在云开发控制台可以：
- 查看云函数调用日志
- 监控数据库读写次数
- 查看存储空间使用情况
- 设置告警规则

## 费用说明

基础版免费额度：
- 数据库存储：2GB
- 数据库读次数：5万次/天
- 数据库写次数：3万次/天
- 云函数调用：10万次/天
- 云存储：5GB

对于个人项目足够使用，超出后按量计费（很便宜）。
