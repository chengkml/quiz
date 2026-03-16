---
name: quiz-requirement-analyze
description: 通过 JWT 链路执行“先查询后分析再写回”需求流程（login -> jwt -> requirement search -> requirement analyze）。当用户要求批量分析 quiz 项目待分析/待修订需求、写回需求描述、推进到待评审时使用。
---

# Quiz Requirement Analyze

按“查询 -> 分析 -> 写回”执行需求分析，主字段只写 `descr`，不再使用 `comment/analysisRemark`。

## 执行流程（必须）

1. 登录：`POST /api/user/login`
2. 生成 JWT：`POST /api/jwt/generate?userId=...`
3. 查询待处理需求：`POST /api/project/requirement/search`
   - 默认查询 `projectName=quiz`
   - 默认状态：`PENDING_ANALYSIS`、`PENDING_REVISION`
4. 逐条处理（批量串行）：
   - 读取需求详情：`GET /api/project/requirement/get/{id}`
   - **若状态是 `PENDING_REVISION`，必须先读取评审备注来源**：
     - `requirement.resultMsg`
     - `GET /api/project/requirement/{id}/lifecycle` 中最新 `REVIEW` 事件的 `remark`
5. 生成/修订 `descr`（见下方模板）
6. 写回分析：`POST /api/project/requirement/{id}/analyze`
   - Body: `{"descr":"...", "progressPercent": ...}`（进度可省略）
   - 目标状态流转：`PENDING_REVIEW`

> 查询与 JWT 链路与 requirement-query 保持一致：统一使用登录态 + Bearer token 调用需求接口。

## 状态处理规则

- `PENDING_ANALYSIS`：基于“标题 + 当前描述 + 代码结构理解”扩充描述。
- `PENDING_REVISION`：基于“标题 + 当前描述 + 代码结构理解 + 评审备注（必读）”修订描述。

## 分析输出模板（写入 descr）

至少包含以下段落：

1. `改造目标`
2. `定位链路`（页面/API/后端模块定位）
3. `实施步骤`

## 脚本

脚本：`scripts/analyze_requirement.py`

### 常用参数

- `--auto-query`：启用“先查询后逐条处理”批量流程
- `--status`：查询状态（可重复或逗号分隔），默认 `PENDING_ANALYSIS,PENDING_REVISION`
- `--project-name`：项目名过滤，默认 `quiz`
- `--list-only`：只查询与生成预览，不执行 analyze 写回
- `--requirement-id`：单条模式需求 ID（不启用 `--auto-query` 时必填）
- `--descr`：自定义描述（可选；不传时脚本自动生成模板描述）
- `--progress-percent`：可选进度百分比（0-100）
- `--dry-run`：仅校验并输出执行计划（包含“评审备注读取步骤”）

### 输出字段（关键）

- `mode`: `single` / `auto-query`
- `queryTrace`: 查询轨迹（按状态和分页）
- `items[]`: 每条需求处理结果
  - `requirementId`, `status`, `title`
  - `reviewRemarkRequired`: 是否必须读取评审备注
  - `reviewRemarkSources`: 评审备注来源（如 `requirement.resultMsg`, `lifecycle.REVIEW.remark`）
  - `reviewRemark`: 汇总后的评审意见文本
  - `payloadPreview` / `payload`: 实际将写回的 `descr`（可选 `progressPercent`）

## 示例命令

### 1) 只查询待处理列表（不写回）

```bash
python3 skills/quiz-requirement-analyze/scripts/analyze_requirement.py \
  --auto-query \
  --status PENDING_ANALYSIS \
  --status PENDING_REVISION \
  --list-only \
  --max-items 20
```

### 2) 批量逐条分析并写回

```bash
python3 skills/quiz-requirement-analyze/scripts/analyze_requirement.py \
  --auto-query \
  --status PENDING_ANALYSIS,PENDING_REVISION \
  --max-items 20
```

### 3) 单条安全校验（dry-run）

```bash
python3 skills/quiz-requirement-analyze/scripts/analyze_requirement.py \
  --requirement-id <REQ_ID> \
  --dry-run
```

## 约束

- 需求分析写回时只使用 `descr`。
- 不使用 `comment` / `analysisRemark`。
- `PENDING_REVISION` 必须读取并纳入评审备注后再分析写回。
