---
name: 全栈开发专家
description: 整合前后端开发与Git版本控制的全能开发助手，提供端到端的开发流程指导
---

此技能为本项目独有的全栈开发工作流，整合了 React (Arco Design) 前端、Java (Spring Boot) 后端及 Git 协作的最佳实践。

## 开发工作流 (Standard Workflow)

### 第一阶段：后端开发 (Backend First)
如果需求涉及数据结构或业务逻辑变更，**必须**先完成后端开发。
1.  **代码修改**：
    *   实体层 (`d:\idea_repo\quiz\backend\src\main\java\...\entity`)
    *   服务层 (`Service` / `ServiceImpl`)
    *   控制层 (`Controller`)
2.  **编译检查**：
    *   修改完成后，**务必**运行 **[Java 编译与自动修复]** Skill (`.agent/skills/java_compile_check/SKILL.md`)。
    *   确保后端编译通过 (`BUILD SUCCESSFUL`) 后再进行下一步。

### 第二阶段：前端开发 (Frontend Implementation)
后端接口准备就绪后，进行前端界面开发。
1.  **参考规范**：
    *   在编写 UI 前，**务必**阅读 **[Arco Design 开发助手]** Skill (`.agent/skills/arco_design_dev/SKILL.md`)。
    *   特别是列表页，请使用 `DataManager` 组件，而非手写 Table。
2.  **代码修改**：
    *   API 定义 (`src/pages/.../api`)
    *   UI 组件与页面逻辑
3.  **构建检查**：
    *   修改完成后，**务必**运行 **[前端编译与自动修复]** Skill (`.agent/skills/frontend_build_check/SKILL.md`)。
    *   确保 `tsc` 类型检查和 `webpack` 构建无误。

### 第三阶段：代码提交 (Version Control)
当功能开发完成且通过所有编译检查后。
1.  **提交规范**：
    *   调用 **[Git 提交助手]** Skill (`.agent/skills/git_commit/SKILL.md`)。
    *   使用 `git status` 确认文件，`git diff` 审查变更。
    *   生成符合 Conventional Commits 规范的提交信息 (如 `feat(user): add profile page`)。

## 常用开发技巧

*   **跨端调试**：
    *   如果遇到接口报错，请优先检查后端控制台日志，确认是参数错误还是空指针异常。
    *   前端请求路径前缀通常为 `/api/...`，确保 Nginx 或 Proxy 配置正确。

*   **技能组合推荐**：
    *   这是一个 Meta-Skill (元技能)，在处理复杂任务时，你应该根据当前所处的阶段，自动调用上述提到的具体的子 Skill 来辅助工作。
    *   例如：用户让你“加一个用户管理页面”，你应当按 1.后端 -> 2.Java检查 -> 3.前端(Arco) -> 4.前端检查 -> 5.Git提交 的顺序执行。
