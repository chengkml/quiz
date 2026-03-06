# 需求设计: 作业管理功能 (Homework Management)

## 1. 需求背景
系统需要提供作业管理功能，支持用户创建、修改、删除和查询作业。
每个作业的内容以 Markdown 格式保存。
作业标题可以由系统根据一定规则自动生成（如：当前日期 + 序号，或者根据正文内容 AI 生成）。
作业 Markdown 内容应支持通过 AI 模型进行分析，自动提取并生成待办项（To Do Items）。

## 2. 总体方案
*   **涉及模块**: `homework` (新建模块), `todo` (现有待办模块), `llmmodel` (现有 AI 模型模块)
*   **核心逻辑**:
    1. 前端提供 CRUD 页面，包括 Markdown 编辑器。
    2. 新建作业时，后端根据规则（如日期+递增编号等）默认生成标题。
    3. AI 待办项生成：通过前端触发请求，后端调用 LLM API 对作业的 Markdown 文本进行分析，提取出任务项并将其写入 `todo` 模块（或者在页面展示列表由用户确认后再写入）。

## 3. 后端设计 (Spring Boot)
*   **数据库变更**:
    *   新增 `homework` 表:
        *   `id` (主键)
        *   `title` (VARCHAR, 作业标题)
        *   `content` (TEXT, 存储 markdown)
        *   `status` (VARCHAR, 比如未开始、进行中、已完成)
        *   以及 `create_time`, `update_time`, `create_by` 等公共审计字段。
*   **接口设计 (API)**:
    *   `GET /api/homework/page`: 分页查询作业列表。
    *   `GET /api/homework/{id}`: 获取作业详情。
    *   `POST /api/homework`: 创建作业。
    *   `PUT /api/homework/{id}`: 更新作业。
    *   `DELETE /api/homework/{id}`: 删除作业。
    *   `POST /api/homework/{id}/generate-todos`: 根据作业的内容调用 AI 生成待办项，并进行保存。
*   **核心类/方法**:
    *   `HomeworkController`: 定义相关端点。
    *   `HomeworkService` / `HomeworkServiceImpl`: 业务逻辑实现，内部可能需注入 `TodoService` 及 `LlmService`（或实现专用的 `HomeworkAIHelper`）。
    *   `HomeworkMapper` / `Homework` (Entity层)。

## 4. 前端设计 (React + Arco Design)
*   **页面位置**: `src/pages/Homework/...`
*   **组件结构**:
    *   复用系统的通用列表组件（如 `DataManager`）作为作业列表页。
    *   新增作业编辑和查看页面，使用项目现有的 Markdown 编辑器组件进行文本处理。
    *   在编辑页面或详情页面中，新增 **"AI 生成待办"** 按钮，点击后发送提取请求，并在界面中展示或直接对接待办事项面板。
*   **状态管理**: 使用 Component Local State 控制编辑表单及 AI 生成进度/结果确认。

## 5. 实施步骤 (Action Plan)
1.  [Backend] 创建 `Homework` Entity, Mapper, Service, Controller，以及对应的数据库表。
2.  [Backend] 实现作业基础 CRUD 逻辑（包括标题的自动生成策略）。
3.  [Backend] 实现调用 LLM 提取 Markdown 待办项的 API 及逻辑，联调 `todo` 模块。
4.  [Skill] 运行 Java 编译检查工具。
5.  [Frontend] 添加前端路由，创建作业列表页和编辑详情页组件。
6.  [Frontend] 联调前端功能：基本保存、按规则生成标题交互，以及触发 AI 提取待办的功能测试。
7.  [Skill] 运行前端编译检查工具。
