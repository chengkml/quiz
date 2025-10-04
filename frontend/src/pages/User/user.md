# ✅ 用户管理页面详细设计文档（v4.0 - 最终完整版）

> **基于所有 DTO 与接口 100% 对齐，可直接用于 AI 编码**

---

## 1. 页面概述

- **页面名称**：用户管理
- **路径**：`/user-management`
- **功能**：管理员对系统用户进行查询、新增、编辑、状态管理、密码重置等操作
- **权限**：系统管理员、用户管理员

---

## 2. 页面布局

```tsx
<PageContainer>
  <SearchForm />      {/* 查询表单 */}
  <UserTable />       {/* 用户列表 + 操作按钮 */}
  <CreateModal />     {/* 新增用户模态框 */}
  <EditModal />       {/* 编辑用户模态框 */}
  <ResetPasswordModal /> {/* 重置密码模态框 */}
  <RoleAssignModal /> {/* 分配角色模态框（可选） */}
</PageContainer>
```

---

## 3. 查询功能

### 3.1 查询表单字段

| 字段 | 组件 | 参数名 | 说明 |
|------|------|--------|------|
| 用户账号 | Input | `userId` | 支持模糊查询 |
| 用户姓名 | Input | `userName` | 支持模糊查询 |
| 状态 | Select | `state` | 选项：全部、正常、禁用 |

> **查询按钮**：`<Button type="primary">查询</Button>`  
> **重置按钮**：`<Button>重置</Button>`

---

### 3.2 查询接口

- **接口**：`GET /api/user`
- **参数**：
  ```ts
  {
    userId?: string;
    userName?: string;
    state?: string; // "正常" | "禁用"
    page: number;   // 页码（从0开始）
    size: number;   // 每页数量
  }
  ```
- **成功响应**：
  ```json
  {
    "success": true,
    "data": [/* UserDto 列表 */],
    "totalElements": 100,
    "totalPages": 10,
    "currentPage": 0,
    "size": 10
  }
  ```

---

## 4. 表格展示

### 4.1 列定义

| 列名 | dataIndex | 宽度 | 说明 |
|------|-----------|------|------|
| 用户账号 | `userId` | 120px | — |
| 用户姓名 | `userName` | 100px | — |
| 邮箱 | `email` | 150px | — |
| 手机号 | `phone` | 120px | — |
| 账号类型 | `acctType` | 100px | 显示中文映射（如“系统管理员”） |
| 角色 | `roles` | 150px | 显示 `roleName` 标签列表 |
| 状态 | `state` | 80px | 显示 `正常` / `禁用` |
| 创建时间 | `createDt` | 140px | 格式：`YYYY-MM-DD HH:mm:ss` |
| 操作 | `action` | 220px | 按钮组 |

---

### 4.2 操作按钮

| 按钮 | 类型 | 权限 | 触发 |
|------|------|------|------|
| 编辑 | Text Button | 所有管理员 | 打开 `EditModal` |
| 启用 | Text Button | 所有管理员 | 调用 `/enable` |
| 禁用 | Text Button | 所有管理员 | 调用 `/disable` |
| 重置密码 | Text Button | 系统管理员 | 打开 `ResetPasswordModal` |
| 分配角色 | Text Button | 角色管理员 | 打开 `RoleAssignModal`（可选） |

> ⚠️ 启用/禁用按钮根据当前状态动态显示。

---

## 5. 新增用户

### 5.1 表单字段

| 字段 | 组件 | 必填 | 校验规则（来自 `UserCreateDto`） |
|------|------|------|----------------------------------|
| 用户账号 | Input | ✅ | ≤ 32 字符，调用 `/check/userId` 校验唯一 |
| 用户姓名 | Input | ✅ | ≤ 128 字符 |
| 密码 | Input (password) | ✅ | 6-20 字符 |
| 确认密码 | Input (password) | ✅ | 与密码一致 |
| 邮箱 | Input | ❌ | 邮箱格式，≤ 64 字符，调用 `/check/email` |
| 手机号 | Input | ❌ | ≤ 16 字符，调用 `/check/phone` |
| 账号类型 | Select | ❌ | ≤ 8 字符（如：sys_admin, user） |
| 默认团队 | Input | ❌ | ≤ 32 字符 |
| 头像URL | Input | ❌ | ≤ 256 字符，可预览 |

---

### 5.2 接口调用

- **接口**：`POST /api/user/register`
- **请求体**：`UserCreateDto`
- **成功响应**：`{ "success": true, "message": "创建成功" }`

---

## 6. 编辑用户

### 6.1 表单字段

| 字段 | 组件 | 必填 | 校验规则（来自 `UserUpdateDto`） |
|------|------|------|----------------------------------|
| 用户姓名 | Input | ❌ | ≤ 128 字符 |
| 邮箱 | Input | ❌ | 邮箱格式，≤ 64 字符 |
| 手机号 | Input | ❌ | ≤ 16 字符 |
| 账号类型 | Select | ❌ | ≤ 8 字符 |
| 默认团队 | Input | ❌ | ≤ 32 字符 |
| 头像URL | Input | ❌ | ≤ 256 字符，可预览 |

> ✅ **无密码字段**

---

### 6.2 接口调用

- **接口**：`POST /api/user/{id}/update`
- **请求体**：`UserUpdateDto`
- **成功响应**：`{ "success": true, "message": "更新成功" }`

---

## 7. 重置密码

### 7.1 表单字段

| 字段 | 组件 | 必填 | 校验 |
|------|------|------|------|
| 新密码 | Input (password) | ✅ | 6-20 字符 |
| 确认密码 | Input (password) | ✅ | 与新密码一致 |

---

### 7.2 接口调用

- **接口**：`POST /api/user/{id}/resetPassword`
- **请求体**：
  ```json
  { "newPassword": "123456" }
  ```
- **成功响应**：`{ "success": true, "message": "密码重置成功" }`

---

## 8. 分配角色（可选功能）

### 8.1 前提

- 后端需提供：`GET /api/roles` → 返回 `List<RoleDto>`
- 否则无法实现

---

### 8.2 模态框设计

- **标题**：为【用户名】分配角色
- **内容**：使用 `Transfer` 穿梭框或 `Tree` 选择器
- **数据源**：
  - 所有角色：`GET /api/roles`
  - 已分配角色：`GET /api/user/{id}/roles`

---

### 8.3 接口调用

- **接口**：`POST /api/user/{id}/assignRoles`
- **请求体**：
  ```json
  { "roleIds": ["r001", "r002"] }
  ```
- **成功响应**：`{ "success": true, "message": "角色分配成功" }`

---

## 9. TypeScript 类型定义

```ts
interface UserCreateDto {
  userId: string;
  userName: string;
  userPwd: string;
  confirmPassword?: string;
  email?: string;
  phone?: string;
  acctType?: string;
  defaultTeam?: string;
  logo?: string;
}

interface UserUpdateDto {
  userName?: string;
  email?: string;
  phone?: string;
  acctType?: string;
  defaultTeam?: string;
  logo?: string;
}

interface UserDto {
  id: string;
  userId: string;
  userName: string;
  email: string;
  phone: string;
  state: '正常' | '禁用';
  acctType: string;
  createDt: string;
  defaultTeam: string;
  logo: string;
  roles: RoleDto[];
}

interface RoleDto {
  roleId: string;
  roleName: string;
  roleDescr: string;
  roleType: string;
  state: string;
  createDate: string;
  createUser: string;
}
```

---

## 10. 接口清单

| 功能 | 接口 | 方法 | 输入 | 输出 |
|------|------|------|------|------|
| 查询 | `/api/user` | GET | `userId`, `userName`, `state`, `page`, `size` | `Page<UserDto>` |
| 检查账号 | `/api/user/check/userId` | GET | `userId` | `{ success: boolean, exists: boolean }` |
| 检查邮箱 | `/api/user/check/email` | GET | `email` | 同上 |
| 检查手机 | `/api/user/check/phone` | GET | `phone` | 同上 |
| 新增 | `/api/user/register` | POST | `UserCreateDto` | `{ success: boolean, message: string }` |
| 编辑 | `/api/user/{id}/update` | POST | `UserUpdateDto` | 同上 |
| 启用 | `/api/user/{id}/enable` | POST | - | 同上 |
| 禁用 | `/api/user/{id}/disable` | POST | - | 同上 |
| 重置密码 | `/api/user/{id}/resetPassword` | POST | `{ newPassword: string }` | 同上 |
| 分配角色 | `/api/user/{id}/assignRoles` | POST | `{ roleIds: string[] }` | 同上 |
| 获取用户角色 | `/api/user/{id}/roles` | GET | - | `List<RoleDto>` |
| 获取所有角色 | `/api/roles` | GET | - | `List<RoleDto>`（可选） |

---

## ✅ 文档状态：**已完成，可交付开发**
