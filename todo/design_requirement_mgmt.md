# 需求设计: 需求管理 (Requirement Management)

## 1. 需求背景
为了实现自动化开发流程，需要一个需求管理功能，允许用户发布开发需求。OpenClaw 机器人将定时扫描此列表，获取待处理的需求，自动执行开发任务（如代码生成、修改等），并实时更新需求的处理状态。

## 2. 总体方案
*   **核心实体**: `Requirement` (需求)
*   **功能模块**:
    *   **需求发布**: 用户在前端界面录入需求信息（项目、Git地址、分支、描述等）。
    *   **列表展示**: 展示所有需求及其当前状态。
    *   **OpenClaw 接口**: 提供 API 供 OpenClaw 获取待办需求及更新状态。
*   **状态流转**: `PENDING` (待处理) -> `PROCESSING` (处理中) -> `COMPLETED` (已完成) / `ERROR` (失败)

## 3. 后端设计 (Spring Boot)

### 3.1 数据库设计 (Entity)
文件路径: `backend/src/main/java/com/ck/quiz/project/entity/Requirement.java` (新建 `project` 模块或放入 `base`，建议新建 `project` 包以隔离业务)

**表名**: `t_requirement`

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| id | Long | 主键 |
| project_name | String | 项目名称 |
| git_url | String | Git 仓库地址 |
| branch | String | 分支名称 (默认 main/master) |
| status | String | 状态 (PENDING, PROCESSING, COMPLETED, ERROR) |
| description | Text | 需求详细描述 |
| result_msg | Text | 处理结果/错误信息 |
| create_time | DateTime | 创建时间 |
| update_time | DateTime | 更新时间 |

### 3.2 接口设计 (API)
Controller: `backend/src/main/java/com/ck/quiz/project/controller/RequirementController.java`

*   **管理接口 (Web)**:
    *   `GET /api/requirements`: 分页查询需求列表 (支持按状态筛选)。
    *   `POST /api/requirements`: 新增需求。
    *   `PUT /api/requirements`: 修改需求。
    *   `DELETE /api/requirements/{id}`: 删除需求。

*   **OpenClaw 专用接口**:
    *   `GET /api/requirements/pending`: 获取最早的一个待处理需求 (LIFO/FIFO 策略)。
    *   `POST /api/requirements/{id}/status`: 更新需求状态 (包含结果信息)。

### 3.3 核心类
*   `RequirementRepository`: 继承 JpaRepository。
*   `RequirementService`: 业务逻辑，处理状态变更。

## 4. 前端设计 (React + Arco Design)

### 4.1 页面结构
位置: `frontend/src/pages/Requirement/index.tsx`

*   **组件**: 使用项目封装的 `DataManager` 组件进行快速开发。
*   **表格列**:
    *   ID
    *   项目名
    *   Git 地址 / 分支
    *   状态 (使用 Tag 展示: PENDING-蓝色, PROCESSING-橙色, COMPLETED-绿色, ERROR-红色)
    *   描述
    *   创建时间
    *   操作 (编辑, 删除)

### 4.2 路由配置
需在 `frontend/src/router/routes.ts` 或动态菜单中添加:
*   Path: `/requirement`
*   Component: `pages/Requirement`
*   Name: 需求管理

## 5. 实施步骤 (Action Plan)

1.  **[Backend] 创建实体与库表**:
    *   在 `com.ck.quiz.project.entity` 下创建 `Requirement` 类。
    *   创建 `RequirementRepository`。
2.  **[Backend] 实现服务与控制器**:
    *   创建 `RequirementService` 实现 CRUD 及状态流转逻辑。
    *   创建 `RequirementController` 暴露 API。
3.  **[Skill] 后端编译检查**:
    *   运行编译，确保无误。
4.  **[Frontend] 创建页面**:
    *   新建 `frontend/src/pages/Requirement` 目录。
    *   实现 `index.tsx` (列表) 和 `form.tsx` (如果 `DataManager` 不够用)。
    *   配置路由 (如果需要手动配置)。
5.  **[Skill] 前端构建检查**:
    *   运行前端构建检查。
6.  **[Verification] 联调测试**:
    *   启动前后端，测试添加需求，模拟 OpenClaw 调用状态更新接口。
