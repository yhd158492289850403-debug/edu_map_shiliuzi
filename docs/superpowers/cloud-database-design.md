# 云数据库设计

## 数据库集合（Collections）

### 1. users（用户表）
存储用户基本信息。

| 字段 | 类型 | 说明 |
|---|---|---|
| _id | string | 系统自动生成 |
| _openid | string | 用户的微信openid |
| nickname | string | 用户昵称 |
| avatar | string | 头像URL（云存储fileID） |
| phone | string | 手机号（可选） |
| created_at | date | 注册时间 |
| updated_at | date | 最后更新时间 |

**索引：**
- `_openid` - 唯一索引

---

### 2. checkins（打卡记录表）
存储用户的点位访问记录。

| 字段 | 类型 | 说明 |
|---|---|---|
| _id | string | 系统自动生成 |
| _openid | string | 用户的微信openid |
| point_id | number | 关联的点位ID |
| point_name | string | 点位名称 |
| behavior | string | 关联的行为名称（可选） |
| rating | string | 评价：great/good/ok/bad |
| notes | string | 孩子感受/备注（最多500字） |
| photos | array | 照片云存储fileID数组（最多3张） |
| date | date | 打卡日期 |
| created_at | date | 创建时间 |

**索引：**
- `_openid` - 普通索引
- `_openid + date` - 复合索引（用于按时间查询）
- `_openid + point_id` - 复合索引（用于统计访问过多少点位）

---

### 3. learning_plans（学习方案表）
存储用户保存的学习方案。

| 字段 | 类型 | 说明 |
|---|---|---|
| _id | string | 系统自动生成 |
| _openid | string | 用户的微信openid |
| behavior | string | 行为名称 |
| subs | array | 关联的子素养数组 |
| slices | array | 切片详情数组 |
| created_at | date | 保存时间 |

**索引：**
- `_openid` - 普通索引

---

## 云函数列表

### 1. login（用户登录）
- **功能**：获取openid，创建/更新用户记录
- **触发**：小程序启动时自动调用
- **返回**：`{ openid, userInfo }`

### 2. addCheckin（添加打卡）
- **功能**：保存打卡记录，上传照片到云存储
- **参数**：`{ point_id, point_name, behavior, rating, notes, photos[] }`
- **返回**：`{ success, checkin_id }`

### 3. getCheckins（获取打卡记录）
- **功能**：获取用户的打卡历史
- **参数**：`{ limit, offset }`
- **返回**：`{ checkins[], total }`

### 4. savePlan（保存方案）
- **功能**：保存学习方案
- **参数**：`{ behavior, subs[], slices[] }`
- **返回**：`{ success, plan_id }`

### 5. getPlans（获取方案）
- **功能**：获取用户保存的方案
- **参数**：`{ limit, offset }`
- **返回**：`{ plans[] }`

---

## 数据流程图

```
用户打开小程序
    ↓
调用 login 云函数
    ↓
获取 openid + 检查/创建 users 记录
    ↓
进入首页
    ↓
浏览点位/行为寻课
    ↓
点击"打卡"
    ↓
进入 checkin 页面
    ↓
选择点位、行为、评价、填写感受
    ↓
上传照片（如有）
    ↓
调用 addCheckin 云函数
    ↓
保存到 checkins 集合
    ↓
返回个人档案页
    ↓
调用 getCheckins 获取历史
    ↓
展示打卡统计和列表
```

---

## 安全规则

### users 集合
```json
{
  "read": "doc._openid == auth.openid",
  "write": "doc._openid == auth.openid"
}
```

### checkins 集合
```json
{
  "read": "doc._openid == auth.openid",
  "write": "doc._openid == auth.openid"
}
```

### learning_plans 集合
```json
{
  "read": "doc._openid == auth.openid",
  "write": "doc._openid == auth.openid"
}
```

---

## 部署步骤

1. 在微信开发者工具中开通云开发
2. 创建云开发环境，记录环境ID
3. 在 `app.js` 中替换 `your-env-id` 为实际环境ID
4. 创建上述3个数据库集合
5. 为每个集合添加索引
6. 部署 login 云函数（右键云函数文件夹 → 上传并部署：云端安装依赖）
7. 创建并部署其他云函数（addCheckin, getCheckins, savePlan, getPlans）
8. 在数据库权限设置中配置安全规则
