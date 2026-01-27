---
name: 全栈开发专家
description: 整合前后端开发与Git版本控制的全能开发助手，提供端到端的开发流程指导
---

此技能为本项目独有的全栈开发工作流，整合了 React (Arco Design) 前端、Java (Spring Boot) 后端及 Git 协作的最佳实践。

## 开发工作流 (Standard Workflow)

### 阶段 0：启动开发 (Start Development)
在开始写代码前，**必须**先做好准备工作。
1.  **查找设计文档**：
    *   在 `d:\idea_repo\quiz\todo` 目录下寻找对应的 `design_xxx.md` 文件并读取。
2.  **更新需求状态 (In Progress)**：
    *   修改 `todo.md`，将当前要开发的需求从 `## 待办 (To Do)` 移动到 `## 进行中 (In Progress)` 区域。
3.  **确认执行计划**：
    *   仔细阅读设计文档中的 **5. 实施步骤 (Action Plan)**。
    *   接下来的开发工作**必须严格遵循**该计划的顺序。

### 阶段 1：后端开发 (Backend First)
如果设计文档包含后端变更，**必须**先完成后端开发。
1.  **代码修改**：
    *   根据设计文档的 *后端设计* 章节，创建 Entity、Repository、Service 和 Controller。
    *   文件路径通常在 `d:\idea_repo\quiz\backend\src\main\java\...\`
2.  **编译检查**：
    *   修改完成后，**务必**运行 **[Java 编译与自动修复]** Skill (`.agent/skills/java_compile_check/SKILL.md`)。
    *   确保后端编译通过 (`BUILD SUCCESSFUL`) 后再进行下一步。

### 阶段 2：前端开发 (Frontend Implementation)
后端接口准备就绪后，进行前端界面开发。
1.  **参考规范**：
    *   **务必**阅读 **[Arco Design 开发助手]** Skill (`.agent/skills/arco_design_dev/SKILL.md`)。
    *   特别是列表页，请使用 `DataManager` 组件，而非手写 Table。
2.  **代码修改**：
    *   根据设计文档的 *前端设计* 章节，定义 API 和 React 组件。
    *   API 定义位置: `src/pages/.../api`
3.  **构建检查**：
    *   修改完成后，**务必**运行 **[前端编译与自动修复]** Skill (`.agent/skills/frontend_build_check/SKILL.md`)。
    *   确保 `tsc` 类型检查和 `webpack` 构建无误。

### 阶段 3：提交与验收 (Commit & Finish)
每完成一个需求节点，**必须**进行一次 Git 提交。

1.  **本地提交 (Mandatory Commit)**：
    *   调用 **[Git 提交助手]** Skill (`.agent/skills/git_commit/SKILL.md`) 执行 commit。
    *   **禁止**在此步骤执行 push。
    *   Message 示例: `feat(todos): finish task A`
2.  **更新需求状态 (Done)**：
    *   修改 `todo.md`，将当前需求从 `## 进行中 (In Progress)` 移动到 `## 已完成 (Done)` 区域，并将 `[ ]` 改为 `[x]`。
3.  **推送检查 (Conditional Push)**：
    *   检查 `todo.md` 的 `## 待办 (To Do)` 和 `## 进行中 (In Progress)` 区域是否为空。
    *   **若仍有任务**：任务结束，**不要推送**。
    *   **若所有任务都已在 Done 区域**：执行 `git push` 将所有 commits 一次性推送到远程。

## 常用开发技巧

*   **跨端调试**：
    *   如果遇到接口报错，请优先检查后端控制台日志，确认是参数错误还是空指针异常。
*   **按部就班**：
    *   这是一个 Meta-Skill (元技能)，请严格按照 `0 -> 1 -> 2 -> 3` 的阶段顺序执行。
    *   状态流转 `To Do -> In Progress -> Done` 对于项目跟踪至关重要，请勿遗漏。
