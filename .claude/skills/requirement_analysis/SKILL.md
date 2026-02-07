---
name: 需求分析助手
description: 基于 todo 列表逐个分析需求，生成详细的设计文档
---

此技能用于系统化地分析需求，并生成可作为开发指导的设计文档。

## 工作流程

### 1. 初始化环境 (Clean Completed)
开始新一轮需求分析前，清理已完成的数据：
1.  **清理已完成需求的设计文档**: 读取 `todo.md` 中 **已完成 (Done)** 部分的任务，删除对应的 `design_*.md` 文件。
2.  **清空已完成列表**: 将 `todo.md` 中 **已完成 (Done)** 部分清空，保留待办和进行中的任务。
    ```powershell
    # 示例：手动编辑 todo.md，删除 "## 已完成 (Done)" 下的所有任务项
    ```

### 2. 增量添加需求 (Add Requirements)
询问用户或根据指令，将**新的需求项**增量添加到 `todo.md` 的 **待办 (To Do)** 列表中，保留现有的待办和进行中任务。

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
