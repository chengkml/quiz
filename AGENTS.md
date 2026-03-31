# AGENTS.md - Quiz 智能体工程执行准则

你是 quiz 项目的高级全栈开发智能体。目标是：在最小改动下稳定交付、可验证、可追溯。

## 0. 会话启动（必须）

每次会话开始先读：

1. `SOUL.md`
2. `USER.md`
3. `MEMORY.md`
4. `memory/ENGINEERING_MODULE_INDEX.md`
5. `memory/YYYY-MM-DD.md`（今天；不存在则读最近一份）
6. `HEARTBEAT.md`

## 1. 工程现状快照（以仓库为准）

- 后端：`backend/`，Java 17 + Spring Boot 3.5.6 + JPA + Security + WebSocket + Gradle
- 前端：`frontend/`，React 18 + TypeScript + Webpack + Arco Design + Antd
- 运行约束：
  - 后端 context-path 固定为 `/quiz`（见 `backend/src/main/resources/application.yml`）
  - 前端 API 前缀固定为 `/api`，开发代理到 `http://localhost:8089/quiz`
- 需求链路：
  - 后端需求模块：`backend/src/main/java/com/ck/quiz/project/**`
  - 前端需求页面：`frontend/src/pages/Requirement/**`
  - 查询技能：`skills/quiz-requirement-query/SKILL.md`
- 记忆/文档：`memory/`、`todo/`（需求设计与开发信号）

## 2. 任务路由与触发规则

### 2.1 按文件路径路由

- `backend/src/main/java/com/ck/quiz/<module>/**`
  - 路由到对应后端模块（controller/service/repository/entity 同步检查）
- `frontend/src/pages/<Module>/**`
  - 路由到对应页面模块，联动检查 `api.ts`、样式、路由配置
- `frontend/src/router/index.tsx`
  - 视为页面入口与权限路径的单一事实来源（`path` + `requiredPath`）
- `skills/**`
  - 仅改技能逻辑或触发词，不改业务代码
- `memory/**`、`*.md`
  - 仅改流程与知识沉淀，不改业务行为

### 2.2 按用户意图触发

- 提到「需求列表 / OPEN / IN_PROGRESS / quiz 项目需求」
  - 优先走 `quiz-requirement-query` 技能链路
- 提到「接口异常 / 字段不一致 / 页面无数据」
  - 先对齐前端 `api.ts` 与后端 Controller `@RequestMapping`
- 提到「状态流转 / 生命周期」
  - 优先检查 `project/Requirement` 相关 DTO、Service、LifecycleLog

### 2.3 技能触发规则（已安装）

- `java-springboot`
  - 触发条件：涉及 `backend/**` 的 Controller/Service/Repository/Entity/DTO、事务、安全、定时任务、WebSocket、JPA 查询优化。
  - 执行要求：优先保证接口契约稳定与最小改动，避免跨模块重构。
- `typescript-react-reviewer`
  - 触发条件：涉及 `frontend/**` 的 React 组件、Hooks、状态管理、性能问题、TypeScript 类型边界、页面交互一致性。
  - 执行要求：优先检查可维护性、渲染开销与类型安全，不引入与现有栈冲突的新模式。
- `code-review-excellence`
  - 触发条件：用户明确要求 review/代码评审，或在合并前做风险检查、回归检查、安全检查。
  - 执行要求：按“发现优先”输出，先列问题与风险级别，再给修复建议与验证点。

### 2.4 组合触发策略

- 全栈需求（前后端联动）
  - 先用 `java-springboot` 锁定后端接口与字段，再用 `typescript-react-reviewer` 校对前端适配。
- 合并前质检
  - 对核心变更追加 `code-review-excellence` 检查，重点看行为回归、边界条件、测试缺口。
- 冲突处理
  - 外部技能建议不得覆盖仓库既有规范（目录结构、命名、接口风格、状态流转规则）。

## 3. 需求开发标准链路（必须执行）

1. 定位模块：先查 `memory/ENGINEERING_MODULE_INDEX.md`，再做代码定位。
2. 最小改动：只改命中的模块链路，不顺手重构无关代码。
3. 验证：至少执行一条后端或前端可执行命令，并给出结果。
4. 回写文档：
   - 新命中模块未被索引覆盖时，更新 `memory/ENGINEERING_MODULE_INDEX.md`
   - 在 `memory/YYYY-MM-DD.md` 记录「改动/验证/风险」

## 4. 技术约束与实现边界

- 后端约束：
  - Java 17 语法，Spring Boot 3.x 生态
  - 复用现有分层：`controller -> service -> repository -> entity/dto`
  - 沿用既有 API 风格（大量模块使用 `/api/**`）
- 前端约束：
  - React 18 + TS，沿用现有 DataManager/FilterForm 组件模式
  - UI 组件优先复用 Arco；若已有 Antd 依赖，保持局部一致性
  - 路由与权限受 `frontend/src/router/index.tsx` 约束
- 禁止事项：
  - 不引入新框架（如 Vite/Nest 等）
  - 不在一次任务里做跨模块大重构
  - 未确认不做破坏性操作（删库、批量删除、覆盖配置）

## 4.1 `sessions_send` 回传规则（程凯指定）

- 若当前任务是通过 `sessions_send` 从上游 session 派发给你的，完成后**必须**使用 `sessions_send` 把结果回传给派单方（如 `quiz_mgr`、`main`、`dispatcher`）。
- 不能只在当前会话里输出完成结论就结束。
- 回传内容至少应包含：结论、改动点/修复点、验证结果、风险或未验证项。
- 若回传失败，必须在当前会话中明确写出“回传失败，需要上游主动拉取结果”。

## 5. 输出与风险控制

- 固定输出结构：结论 / 改动点 / 风险 / 验证 / 后续建议
- 风险分级：
  - 高：数据结构或状态机变更
  - 中：接口字段、鉴权、路由变更
  - 低：文案、样式、非功能性调整
- 明确不确定性：无法本地验证时要写清「未验证项 + 建议验证命令」
- 严禁输出敏感信息（token、cookie、密码、密钥）

## 6. 常用命令（必要且可执行）

- 后端编译：`cd backend && gradle classes`
- 后端测试：`cd backend && gradle test`（仅在用户明确要求联调/回归/测试时执行）
- 前端构建：`cd frontend && npm run build`
- 前端本地开发：`cd frontend && npm run start`
- 健康检查（后端已启动后）：`curl -sS http://localhost:8089/quiz/actuator/health`

默认验证策略（程凯偏好）：
- 若用户未主动要求联调测试/回归测试，默认只做“前后端编译检查”（`gradle classes` + `npm run build`）。

## 7. 交付门禁（提交前自检）

- 是否只改了需求命中的文件？
- 是否校对了前后端接口路径与字段？
- 是否给出可复现的验证步骤或命令？
- 是否完成 memory 文档回写？
- 是否在结果中标明风险和影响范围？
