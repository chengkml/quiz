---
name: quiz-requirement-develop
description: 通过 JWT 链路执行“查询待处理需求 -> 开发执行 -> 状态流转 -> 进度更新 -> 完成”流程（login -> jwt -> requirement search/get -> requirement status update）。当用户要求开发 quiz 项目 OPEN/IN_PROGRESS 需求、批量推进进度、或将需求闭环到 COMPLETED 时使用。
---

# Quiz Requirement Develop

按“查询 -> 逐条读取 -> 开发推进 -> 状态流转 -> 完成”执行需求开发闭环。

服务地址与认证默认值已统一为与 `requirement-query` 一致：
- 默认 `base-url`: `https://www.quizck.cn`
- 默认账号: `openclaw`
- 默认密码: `12345678`

## 执行流程（必须）

1. 登录：`POST /api/user/login`
2. 生成 JWT：`POST /api/jwt/generate?userId=...`
3. 查询待处理需求：`POST /api/project/requirement/search`
   - 默认 `projectName=quiz`
   - 默认状态：`OPEN`、`IN_PROGRESS`
4. 逐条读取需求详情：`GET /api/project/requirement/get/{id}`
   - 读取 `title / descr / status / progressPercent`
   - 基于 `descr` 形成开发执行计划
5. 开始开发前更新状态：`POST /api/project/requirement/{id}/status`
   - `status=IN_PROGRESS`
6. 关键阶段持续更新进度：`POST /api/project/requirement/{id}/status`
   - `status=IN_PROGRESS`
   - `progressPercent` 按里程碑更新（默认 `30,60,90`）
7. 完成时更新状态：`POST /api/project/requirement/{id}/status`
   - `status=COMPLETED`
   - `progressPercent=100`

> 查询与 JWT 调用风格与 `quiz-requirement-analyze` 保持一致：统一 login + jwt + Bearer Token。

## 工程接口定位（以代码为准）

- Controller：`backend/src/main/java/com/ck/quiz/project/controller/RequirementController.java`
  - `POST /api/project/requirement/search`（继承 `BaseController#search`）
  - `GET /api/project/requirement/get/{id}`（继承 `BaseController#get`）
  - `POST /api/project/requirement/{id}/status`（`updateStatus`）
  - `POST /api/project/requirement/{id}/analyze`
  - `POST /api/project/requirement/{id}/review`
  - `GET /api/project/requirement/{id}/lifecycle`
- Service：`backend/src/main/java/com/ck/quiz/project/service/impl/RequirementServiceImpl.java`
  - `search`：按当前登录用户 + projectName/status 查询
  - `updateStatus`：状态更新、进度归一化（0-100）并写生命周期日志
- DTO：
  - `RequirementQueryDto`：`title/projectName/status/priority + pageNum/pageSize`
  - `RequirementDto`：`descr/resultMsg/progressPercent/status` 等

## 脚本

脚本：`scripts/develop_requirement.py`

### 参数说明

- `--action`：`query|start|progress|complete|full`
  - `query`：仅查询/读取，不更新状态
  - `start`：仅执行“置为 IN_PROGRESS”
  - `progress`：仅执行里程碑进度更新（保持 IN_PROGRESS）
  - `complete`：仅执行完成（COMPLETED + 100）
  - `full`：完整流程（默认）
- `--auto-query`：批量模式（先查列表，再逐条执行）
- `--requirement-id`：单条模式需求 ID（未启用 `--auto-query` 时必填）
- `--status`：查询状态（可重复或逗号分隔），默认 `OPEN,IN_PROGRESS`
- `--project-name`：项目过滤，默认 `quiz`
- `--max-items`：批量处理上限，默认 `20`
- `--page-size`：分页大小，默认 `50`
- `--progress-milestones`：关键进度里程碑，默认 `30,60,90`
- `--start-progress`：start 阶段进度值，默认 `0`
- `--dry-run`：只做登录/查询/详情/计划输出，不写状态
- `--base-url --user-id --user-pwd --timeout`：连接与认证参数

### 优先级处理规则（批量）

- `--auto-query` 批量模式下，需求处理顺序固定为：`HIGH -> MEDIUM -> LOW`。
- 同优先级内保持稳定顺序：按 `createDate`，再按 `id`。
- 输出中会返回：
  - `processingOrderRule`
  - `items[].processOrder`
  - `items[].priority`

### 输出结构（JSON）

- `mode`: `single` / `auto-query`
- `action`: 当前执行动作
- `processingOrderRule`: 批量模式的优先级排序规则说明
- `queryTrace`: 查询轨迹（状态、页码、返回量）
- `items[]`: 每条需求的执行轨迹
  - `requirementId/title/initialStatus/finalStatusPlanned`
  - `priority/processOrder/createDate`
  - `developmentPlan`：基于 `descr` 的开发计划摘要
  - `transitionPlan`：计划中的状态与进度步骤
  - `trajectory[]`：每次实际（或 dry-run 计划）状态更新记录

## 示例命令

### 1) 查询待处理需求（不写回）

```bash
python3 skills/quiz-requirement-develop/scripts/develop_requirement.py \
  --auto-query \
  --action query \
  --status OPEN,IN_PROGRESS \
  --max-items 20 \
  --dry-run
```

### 2) 开始开发并持续更新进度（批量）

```bash
python3 skills/quiz-requirement-develop/scripts/develop_requirement.py \
  --auto-query \
  --action full \
  --status OPEN,IN_PROGRESS \
  --progress-milestones 25,50,80 \
  --max-items 5
```

### 3) 完成单条需求

```bash
python3 skills/quiz-requirement-develop/scripts/develop_requirement.py \
  --requirement-id <REQ_ID> \
  --action complete
```

## 错误处理与回滚策略

- 参数校验失败（如 `start-progress>99`、里程碑超范围、非法 status）：
  - 立即失败并返回 `step=validate`，不发起任何状态写入
- 登录/JWT/查询失败：
  - 返回失败步骤与 HTTP 明细，不输出 token/cookie/password
- 状态更新失败（单条）：
  - 返回失败步骤 `update_status` + 对应请求参数，便于重试
- 批量部分失败：
  - 已成功项保留结果，失败项在轨迹中单独标记

回滚建议：
1. 若误完成（COMPLETED）：调用 `/{id}/status?status=IN_PROGRESS&progressPercent=<上次值>` 回退到处理中。
2. 若进度写错：重复调用 `/{id}/status?status=IN_PROGRESS&progressPercent=<正确值>` 覆盖。
3. 若需重新进入待处理：调用 `/{id}/status?status=OPEN&progressPercent=0`。

## 与需求分析 skill 的衔接

1. 先用 `quiz-requirement-analyze` 将需求从 `PENDING_ANALYSIS/PENDING_REVISION` 推进到可开发状态（通常评审通过后到 `OPEN`）。
2. 再用本 skill 聚焦 `OPEN/IN_PROGRESS` 做开发执行和进度推进，直到 `COMPLETED`。
3. 两个 skill 共享同一 JWT 链路与需求查询接口，便于串联自动化流水线。
