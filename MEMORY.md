# MEMORY.md - Quiz 工程长期记忆

## 1) 项目基线记忆

- 技术栈：Java Spring Boot + React TypeScript + Arco/Antd。
- 后端根路径：`/quiz`；前端统一走 `/api` 代理。
- 需求模块核心目录：
  - 后端：`backend/src/main/java/com/ck/quiz/project/**`
  - 前端：`frontend/src/pages/Requirement/**`
  - 技能：`skills/quiz-requirement-query/SKILL.md`

## 2) 标准开发链路记忆

每次功能开发遵循：

1. 定位模块（先查索引，再定位代码）
2. 最小改动（只改命中链路）
3. 执行验证（后端/前端至少一项）
4. 回写文档（索引 + 当日日志）

## 3) 文档回写规则

- `memory/ENGINEERING_MODULE_INDEX.md`
  - 当出现新的模块入口、关键调用链、核心配置来源时必须更新。
- `memory/YYYY-MM-DD.md`
  - 每次交付至少记录：需求、改动文件、验证命令、风险。

建议模板：

```markdown
## <需求标题>
- 结论：
- 改动文件：
- 验证：
- 风险：
```

## 4) 已知流程信号

- 需求状态不仅有 OPEN/IN_PROGRESS，还包含：
  - `PENDING_ANALYSIS`
  - `PENDING_REVIEW`
  - `PENDING_REVISION`
  - `OPEN`
  - `IN_PROGRESS`
  - `COMPLETED`
  - `CLOSED`
- 与 OpenClaw 对接时，常用筛选语义仍是“开发需求 = OPEN + IN_PROGRESS”。

## 5) 用户执行偏好（程凯）

- 默认不要做联调测试/回归测试。
- 默认也不要做前后端代码编译检查。
- 仅当程凯**主动明确要求**时，才执行编译/构建检查或回归测试。
- 若被明确要求做编译检查，常用命令仍是：
  - 后端：`cd backend && gradle classes`
  - 前端：`cd frontend && npm run build`

## 6) 调度并发配置（供 check-to-dispatcher 读取）

- targetAgent: `quiz`
- dispatchProjectName: `quiz`
- maxConcurrency: `6`
- 约定：`check-to-dispatcher` 运行时应从本记忆读取 `maxConcurrency`，不要再在调度技能中硬编码该值。
