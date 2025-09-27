# 角色管理页面详细设计文档（基于最终DTO）

**文档版本：** 1.2  
**最后更新：** 2025年9月8日  
**作者：** Qwen（基于 Alibaba Cloud）  
**适用系统：** 亚洲信息综合管理系统（Synth）  
**目标模块：** 角色管理（Role Management）  
**适配后端：** `com.asiainfo.synth.user.controller.RoleController`  
**数据模型：** 最终版 DTO 定义

---

## 1. 概述

本文档基于您提供的最终版 DTO（`RoleCreateDto`, `RoleUpdateDto`, `RoleQueryDto`, `RoleDto`, `RoleStatsDto`）和 `RoleController`，对角色管理页面进行精确设计。本方案确保前端与后端在字段命名、数据类型、校验规则上完全一致。

---

## 2. 数据模型（最终对齐）

| 类名 | 字段 | 类型 | 说明/校验 |
|------|------|------|-----------|
| **`RoleCreateDto`** | `roleName` | String | 必填，≤64字符 |
| | `roleDescr` | String | ≤128字符 |
| | `roleType` | String | 必填，≤16字符 |
| | `state` | String | 必填，"1"=启用，"0"=禁用 |
| **`RoleUpdateDto`** | `roleId` | String | 必填 |
| | (其余同 `RoleCreateDto`) | | |
| **`RoleQueryDto`** | `roleName` | String | 模糊查询 |
| | `roleType` | String | 精确匹配 |
| | `state` | String | "1" 或 "0" |
| | `page` | Integer | 从0开始 |
| | `size` | Integer | 默认10 |
| | `sortBy` | String | 默认"createDate" |
| | `sortDir` | String | "asc" 或 "desc" |
| **`RoleDto`** | `roleId` | String | 主键 |
| | `roleName` | String | 角色名称 |
| | `roleDescr` | String | 描述 |
| | `roleType` | String | 类型 |
| | `state` | String | "1" or "0" |
| | `createDate` | Date | 创建时间 |
| | `createUser` | String | 创建人 |
| | `updateDate` | Date | 更新时间 |
| | `updateUser` | String | 更新人 |
| **`RoleStatsDto`** | `totalCount` | Long | 总数 |
| | `enabledCount` | Long | 启用数 |
| | `disabledCount` | Long | 禁用数 |

---

## 3. 接口调用规范（精确映射）

| 前端操作 | HTTP 方法 | 路径 | 请求参数/体 | 成功响应 |
|--------|----------|------|-------------|----------|
| 分页查询 | `GET` | `/api/role` | `roleName`, `roleType`, `state`, `page`, `size`, `sortBy`, `sortDir` | `{success, data: List<RoleDto>, totalElements, totalPages, currentPage, size}` |
| 创建角色 | `POST` | `/api/role` | Body: `{roleName, roleDescr, roleType, state}` | `{success, message, data: RoleDto}` |
| 更新角色 | `POST` | `/api/role/{roleId}/update` | Body: `{roleId, roleName, roleDescr, roleType, state}` | `{success, message, data: RoleDto}` |
| 删除角色 | `POST` | `/api/role/{roleId}/delete` | - | `{success, message}` |
| 获取详情 | `GET` | `/api/role/{roleId}` | - | `{success, data: RoleDto}` |
| 启用角色 | `POST` | `/api/role/{roleId}/enable` | - | `{success, message}` |
| 禁用角色 | `POST` | `/api/role/{roleId}/disable` | - | `{success, message}` |
| 名称校验 | `GET` | `/api/role/check-name` | `roleName`, `excludeRoleId` | `{success, exists, message}` |

> **注意：** `check-name` 接口需后端支持 `excludeRoleId` 参数以实现编辑时的唯一性校验。

---

## 4. 页面结构设计（字段精确匹配）

```
+---------------------------------------------------+
| 角色管理                                           |
+---------------------------------------------------+
| 统计卡片（可选）                                   |
| 总数: 15 | 启用: 12 | 禁用: 3                     |
+---------------------------------------------------+
| 过滤条件区                                         |
| 名称: [________]   类型: [下拉框]   状态: [下拉框]  |
| [查询] [重置]                                      |
+---------------------+-----------------------------+
| [新建角色] [刷新]   |                               |
+---------------------+-----------------------------+
| 表格：角色列表                                      |
|                                                   |
| | 名称       | 类型    | 状态     | 描述           | 创建时间       | 操作 |
| |----------|-------|--------|--------------|--------------|------|
| | 管理员     | 系统    | 启用     | 系统管理员     | 2025-01-15   | [详情][编辑][删除] |
| | ...       | ...   | ...    | ...          | ...          | ...  |
+---------------------------------------------------+
| 分页控件：共 {totalElements} 条记录，第 {currentPage + 1}/{totalPages} 页 |
+---------------------------------------------------+
```

---

## 5. 核心功能实现（字段级对齐）

### 5.1 新建/编辑表单

| 前端标签 | DTO字段 | 前端组件 | 校验规则 |
|--------|--------|--------|--------|
| **角色名称** * | `roleName` | Input | 必填，≤64字符，调用 `/check-name` |
| **角色描述** | `roleDescr` | TextArea | ≤128字符 |
| **角色类型** * | `roleType` | Select | 必选，选项从系统配置获取 |
| **状态** * | `state` | Radio | "1"=启用，"0"=禁用 |

> **状态显示转换：**
> - 前端显示：“启用” / “禁用”
> - 传给后端："1" / "0"
> - 从后端接收："1" → “启用”，"0" → “禁用”

### 5.2 表格列定义

| 表头 | 数据字段 | 显示逻辑 |
|------|----------|----------|
| 名称 | `roleName` | 直接显示 |
| 类型 | `roleType` | 显示值（如：SYSTEM → “系统”） |
| 状态 | `state` | "1" → **绿色标签“启用”**，"0" → **灰色标签“禁用”** |
| 描述 | `roleDescr` | 显示，过长可省略或悬停显示 |
| 创建时间 | `createDate` | 格式化为 `yyyy-MM-dd HH:mm:ss` |
| 操作 | - | 条件渲染：`state="1"` → 显示“禁用”按钮；`state="0"` → 显示“启用”按钮 |

---

## 6. 关键交互逻辑

### 6.1 名称唯一性校验（新建）
```javascript
// 伪代码
async function validateRoleName(name) {
  const res = await GET(`/api/role/check-name?roleName=${encodeURIComponent(name)}`);
  if (res.exists) {
    showError("该角色名称已存在，请更换");
    return false;
  }
  return true;
}
```

### 6.2 名称唯一性校验（编辑）
```javascript
// 伪代码
async function validateRoleNameOnEdit(name, currentRoleId) {
  const res = await GET(`/api/role/check-name?roleName=${encodeURIComponent(name)}&excludeRoleId=${currentRoleId}`);
  // 同上处理
}
```

### 6.3 状态切换（启用/禁用）
```javascript
// 伪代码 - 禁用角色
async function disableRole(roleId) {
  const res = await POST(`/api/role/${roleId}/disable`);
  if (res.success) {
    updateTableRowStatus(roleId, "0"); // 更新状态为禁用
    showSuccess("角色禁用成功");
  } else {
    showError(res.message);
  }
}
```

---

## 7. 异常处理与用户体验

| 场景 | 处理方式 |
|------|----------|
| 后端校验失败（如名称超长） | 提示具体错误信息（如“角色名称长度不能超过64个字符”） |
| 网络错误 | 提示“网络连接失败，请检查网络后重试” |
| 权限不足 | 禁用操作按钮，提示“您无此操作权限” |
| 删除角色被引用 | 后端应在 `deleteRole` 中检查并返回友好错误，如“无法删除：该角色已被5个用户使用” |

---