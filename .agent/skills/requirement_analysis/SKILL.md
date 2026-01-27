---
name: 需求分析助手
description: 基于 todo 列表逐个分析需求，生成详细的设计文档
---

此技能用于系统化地分析需求，并生成可作为开发指导的设计文档。

## 工作流程

### 1. 初始化环境 (Reset Environment)
**每次**开始新一轮需求分析前，必须清理旧数据：
1.  **清空旧设计**: 删除 `d:\idea_repo\quiz\todo\` 目录下所有 `design_*.md` 文件。
    ```powershell
    Remove-Item "d:\idea_repo\quiz\todo\design_*.md" -ErrorAction SilentlyContinue
    ```
2.  **重置 Todo 列表**: 将 `todo.md` 内容重置为初始状态（清空之前的勾选状态）。
    ```markdown
    # 需求列表

    > 记录待开发的功能、Bug修复及优化项。

    ## 待办 (To Do)
    - [ ] 

    ## 以此进行中 (In Progress)

    ## 已完成 (Done)
    ```

### 2. 定义需求列表 (Define Requirements)
询问用户或根据指令，将新的需求项填入 `todo.md` 的 **待办 (To Do)** 列表中。

### 3. 连接上下文 (Context Loading)
读取 `todo.md` 确认当前要分析的需求。
```bash
type d:\idea_repo\quiz\todo\todo.md
```

### 4. 需求分析与设计 (Analysis & Design)
对于选定的任务，AI 应执行以下分析步骤，并生成设计文档。

**设计文档结构模板**:
建议文件命名: `d:\idea_repo\quiz\todo\design_<任务名缩写>.md`

```markdown
# 需求设计: [任务名称]

## 1. 需求背景
简述功能目标及用户场景。

## 2. 总体方案
*   **涉及模块**: (如: MindMap, Auth, KnowledgeSet)
*   **核心逻辑**: 简述业务流程。

## 3. 后端设计 (Spring Boot)
*   **数据库变更**:
    *   新增/修改表结构 (Entity)。
    *   SQL 脚本示例 (如果需要)。
*   **接口设计 (API)**:
    *   `GET /api/...`: 描述。
    *   `POST /api/...`: 描述 (入参/出参)。
*   **核心类/方法**:
    *   `XxxController`: 定义端点。
    *   `XxxService`: 业务逻辑。

## 4. 前端设计 (React + Arco Design)
*   **页面位置**: `src/pages/...`
*   **组件结构**:
    *   复用 `DataManager` (列表页) 或其他通用组件?
    *   新增组件说明。
*   **状态管理**: 是否需要 Redux 或仅 Local State。

## 5. 实施步骤 (Action Plan)
1.  [Backend] 创建 Entity ...
2.  [Backend] 实现 Service/Controller ...
3.  [Skill] 运行 Java 编译检查。
4.  [Frontend] 创建/更新页面 ...
5.  [Skill] 运行前端编译检查。
```

### 5. 操作指南
1.  **主动探索**: 在设计前，使用 `find_by_name` 或 `list_dir` 查看现有代码结构，避免重复造轮子。
2.  **关联代码**: 在设计文档中尽量引用绝对路径，方便后续直接生成代码。
3.  **覆盖更新**: 设计文档应该直接覆盖（如果有重名），确保是最新的。
