# 大模型 MCP 工具管理功能需求说明

## 1 背景与目标

### 1.1 背景

现有系统已接入大模型能力，但对各类外部“工具”（数据库查询、业务接口、第三方服务等）的接入方式分散、缺乏统一管理和可观测性。随着 MCP（Model Context Protocol）的引入，工具以 MCP 服务器的形式对大模型暴露，需要一套集中化的管理能力。

### 1.2 目标

- 提供一个可视化的 MCP 工具管理后台，支持 MCP 服务器与工具的全生命周期管理（接入、配置、启停、监控、下线）。
- 降低接入新 MCP 服务器与工具的门槛，统一配置方式与变更流程。
- 提升大模型调用工具的稳定性、安全性和可观测性，为故障排查与审计提供支撑。

### 1.3 范围

- 管理端：
  - MCP 服务器管理
  - 工具发现与接入
  - 工具配置管理（基础信息、策略、可见范围）
  - 工具启停与灰度（灰度一期预留设计）
  - 调用监控与统计
  - 权限控制与审计日志
- 运行时接口：
  - 为对话编排/大模型调用侧提供“可用工具列表查询”能力

不包含：
- 大模型对话本身的业务逻辑与编排，只负责工具层面的管理和配置。

---

## 2 角色与使用场景

### 2.1 用户角色

- 系统管理员 Admin
  - 负责 MCP 服务器全局配置、关键变更审批、权限配置。
- 业务研发 Developer
  - 负责接入新 MCP 工具、维护工具配置、查看调用效果。
- 运维/平台 Ops
  - 负责 MCP 服务器与工具整体运行状态、监控与告警。
- 只读用户 ReadOnly（产品/运营等）
  - 只读查看工具列表、调用统计与部分配置。

### 2.2 核心使用场景（User Story）

- US-001：Admin 新增 MCP 服务器，完成连通性验证并激活。
- US-002：Developer 从 MCP 服务器发现工具，选择工具接入系统并配置别名、描述等。
- US-003：Ops 查看 MCP 服务器健康状态，判断问题在服务器侧还是工具侧。
- US-004：Developer 修改工具调用策略（超时、重试、限流），无需改代码即可调整工具行为。
- US-005：Ops 或 Admin 临时禁用某个异常工具，防止影响线上用户。
- US-006：Developer/Ops 查看某工具的成功率、延迟、错误码分布，用于性能与稳定性分析。
- US-007：Admin 查看所有 MCP 服务器和工具的配置变更历史，满足审计需求。
- US-008：Developer 将在 dev 环境已验证的工具配置复制到 test/prod 环境，减少重复配置。
- US-009：Runtime 服务（对话编排）按 env + appId 获取当前可用工具列表，实现动态工具路由。
- US-010：安全/合规角色确认敏感配置不会在前端明文展示，只能重新配置而不能回显明文。

---

## 3 状态机设计

### 3.1 MCP 服务器状态机

- 状态：
  - `CREATED`：已创建，尚未验证或激活。
  - `ACTIVE`：可用状态。
  - `DEGRADED`：可用但健康检查存在异常（如偶发失败、响应慢）。
  - `INACTIVE`：人为禁用，不参与运行。
  - `DELETED`：逻辑删除。

- 状态流转：
  - `CREATED → ACTIVE`：首次健康检查成功或 Admin 手动标记为可用。
  - `CREATED/ACTIVE → DEGRADED`：定时健康检查连续失败超过阈值。
  - `DEGRADED → ACTIVE`：健康检查恢复正常。
  - `ACTIVE/DEGRADED → INACTIVE`：Admin 手动禁用。
  - `INACTIVE → ACTIVE`：Admin 手动启用。
  - `任意非 DELETED → DELETED`：逻辑删除（需处理启用工具依赖或强制删除）。

### 3.2 工具状态机

- 状态：
  - `DISCOVERED`：从 MCP 同步发现的工具，尚未纳入系统管理。
  - `REGISTERED`：已接入系统，完成基础配置但尚未启用。
  - `ENABLED`：启用状态，可被大模型调用。
  - `DISABLED`：暂时禁用状态，不可被调用。
  - `GRAY_RELEASE`：灰度中，仅部分流量可见（一期预留）。
  - `SOURCE_REMOVED`：MCP 服务器上已找不到该工具定义。
  - `DECOMMISSIONED`：完成下线，不再使用，仅保留历史记录。

- 典型流转：
  - `DISCOVERED → REGISTERED`：在“工具发现”中被选中接入。
  - `REGISTERED → ENABLED`：完成配置后启用。
  - `ENABLED → DISABLED`：手动禁用。
  - `DISABLED → ENABLED`：手动恢复启用。
  - `任意非 DECOMMISSIONED → SOURCE_REMOVED`：同步时发现 MCP 已移除该工具。
  - `SOURCE_REMOVED / ENABLED / DISABLED → DECOMMISSIONED`：确认下线，进入终态。

---

## 4 功能需求

### 4.1 MCP 服务器管理

**列表页**

- 展示字段：名称、标识 ID、环境、地址、协议、状态、工具数量、最近心跳时间、创建人/时间。
- 支持按环境、状态、关键字（名称/标识）搜索与分页。

**新增/编辑**

- 新增字段：
  - 基本信息：名称、标识、描述。
  - 连接信息：地址（host/port 或 URL）、协议（HTTP/WS 等）。
  - 认证信息：认证方式（无、Token、Basic、mTLS 等）、认证配置（仅占位，前端不回显明文）。
  - 环境：dev/test/stage/prod。
- 校验：
  - 标识唯一。
  - 地址格式合法。
  - 提交后可选触发一次健康检查，成功则标记为 ACTIVE。

**删除与禁用**

- 支持逻辑删除 MCP 服务器：
  - 默认仅当该服务器下无 `ENABLED` 工具时可删除。
  - 若有启用工具，可返回冲突并提示处理，或在 `force=true` 前提下强制删除（需高权限 + 二次确认）。
- 支持将服务器标记为 INACTIVE（人为禁用），避免新调用路由至该服务器。

**健康检查**

- 手动健康检查：
  - 管理端按钮触发，调用后端接口向 MCP 服务器发起握手或版本查询。
  - 展示结果：成功/失败、响应信息、检查时间。
- 预留定时健康检查能力：
  - 定时任务周期性检查，更新状态为 ACTIVE/DEGRADED。

### 4.2 工具发现与接入

- 从 MCP 服务器拉取工具定义列表：
  - 原始字段：原始名称、原始描述、参数 schema 摘要。
  - 标记每条工具是否已在本系统接入（已接入则附带 toolId）。
- 接入工具：
  - 支持批量选择工具接入。
  - 提交时可配置：
    - 显示名称（对话侧展示）
    - 描述（供提示词参考）
    - 分类（订单/用户/支付等）
    - 标签（可多选）
  - 成功后为每个工具创建 `mcp_tool` 记录，状态 `REGISTERED`。
- 工具刷新：
  - 支持“刷新工具列表”操作，从 MCP 重新拉取最新工具列表并比对：
    - 新增的工具 → 标记为新发现的 `DISCOVERED`。
    - MCP 中已删除的工具 → 系统中标记为 `SOURCE_REMOVED`，提示需要人工下线。

### 4.3 工具配置管理

**工具列表**

- 展示字段：
  - 工具 ID、显示名称、原始名称、所属服务器、环境、分类、状态、成功率、QPS、最近更新时间、最近变更人。
- 支持按环境、服务器、状态、分类、关键字搜索。
- 支持批量操作（启用/禁用）。

**工具详情**

- Tab 结构建议：
  - 基础信息
  - 调用策略
  - 可见范围
  - 调用统计
  - 调用日志

**基础信息配置**

- 可编辑字段：
  - 显示名称
  - 描述
  - 分类
  - 标签
- 只读字段：
  - 所属服务器、环境、原始名称、原始 schema。

**调用参数与校验（一期为展示 + 说明）**

- 展示 MCP 返回的参数 schema 摘要（字段名、类型、是否必填、原始描述）。
- 支持为字段添加补充说明文本（如业务含义、取值范围），暂不做强校验逻辑。

**调用策略配置**

- 超时：
  - `timeoutMs`（整数，默认值可按系统配置）
- 重试：
  - `maxAttempts`（0~N）
  - `intervalMs`
  - `retryOn`（如 TIMEOUT、5xx）
- 限流：
  - `rateLimitQps`（单实例或全局限流）
- 优先级：
  - `priority`（数值越大优先级越高，用于多工具可选场景）

保存策略配置时需校验边界值，若配置明显不合理（如超时过大）需给出提示。

**应用范围与权限**

- 可见范围：
  - 可被哪些应用/场景使用（如 appId 列表）。
  - 是否允许匿名使用（一般为 false，只用于测试工具）。
- 大模型调用工具时，运行时服务根据 `env + appId + status` 过滤可用工具。

### 4.4 工具启停与环境复制

**启用/禁用**

- 工具列表与详情页均支持启用/禁用操作。
- 禁用效果：
  - 运行时查询接口不再返回该工具。
  - 状态置为 `DISABLED`，保留配置与历史数据。

**灰度发布（预留）**

- 预留枚举状态 `GRAY_RELEASE`，一期可仅在模型侧/规则侧使用，不强制实现前端流量策略配置。

**环境复制**

- 支持从 dev 将某工具配置复制到 test/prod：
  - 选择目标环境和复制模式（完全复制或结构复制）。
  - 复制内容包含：基础信息、策略、可见范围。
  - 敏感参数（若有）不复制明文，需要在目标环境手动填充。
  - 复制后的工具初始状态建议为 `REGISTERED` 或 `DISABLED`，需手动启用。

### 4.5 监控与统计

**调用指标**

- 展示维度：
  - 时间范围：最近 1 小时、24 小时、7 天等。
  - 指标：调用次数、成功次数、失败次数、成功率、P95/P99 延迟。
- 展示形式：
  - 折线图/柱状图 + 汇总数值。

**调用日志查询**

- 查询条件：
  - 工具 ID、时间范围、调用结果（成功/失败）、错误码、调用方 appId。
- 返回字段：
  - 调用时间、耗时、结果状态、错误码、错误信息、appId、traceId、请求参数摘要（脱敏）。
- 日志脱敏：
  - 对可能含敏感信息的字段进行掩码处理或摘要存储。

**告警（预留）**

- 当某工具在指定时间窗口内失败率超过阈值时，可以与现有告警系统对接（如通过已有监控系统实现），本需求仅预留指标与接口，不强制实现告警配置 UI。

### 4.6 权限与审计

**权限矩阵（概要）**

| 操作                           | Admin | Developer | Ops | ReadOnly |
|------------------------------|:-----:|:---------:|:---:|:--------:|
| 查看服务器/工具列表与详情     |  ✔    |    ✔      | ✔   |    ✔     |
| 新增/编辑/删除 MCP 服务器     |  ✔    |    ✖      | ✖   |    ✖     |
| 手动健康检查 MCP 服务器       |  ✔    |    ✔      | ✔   |    ✖     |
| 接入新工具（从 MCP 导入）     |  ✔    |    ✔      | ✖   |    ✖     |
| 修改工具配置（描述/策略/范围）|  ✔    |    ✔      | ✖   |    ✖     |
| 启用/禁用工具                 |  ✔    |  ✔\*      | ✔   |    ✖     |
| 环境复制                      |  ✔    |  ✔\*      | ✖   |    ✖     |
| 查看调用指标与日志            |  ✔    |    ✔      | ✔   |    ✔     |
| 查看审计日志                  |  ✔    |  部分     | ✔   |    ✖     |

\* 是否需要审核可通过后续流程配置实现。

**审计日志**

- 记录内容：
  - 操作者、操作类型、目标类型（SERVER/TOOL）、目标 ID、操作时间。
  - 变更前后配置摘要（before/after）。
- 覆盖操作：
  - MCP 服务器：新增、编辑、删除、状态变更。
  - 工具：接入、配置修改、启用/禁用、环境复制、下线。
- 审计日志本身不可编辑删除。

---

## 5 数据与模型设计（概要）

> 实际实现可根据项目的数据库规范与 ORM 工具进行调整。

### 5.1 MCP 服务器（mcp_server）

- id (PK)
- name
- identifier（唯一）
- description
- env
- address
- protocol
- auth_type
- auth_config（加密存储的 JSON）
- status（CREATED/ACTIVE/DEGRADED/INACTIVE/DELETED）
- last_heartbeat_at
- created_by, created_at, updated_by, updated_at

### 5.2 工具（mcp_tool）

- id (PK)
- server_id (FK → mcp_server.id)
- env
- origin_name
- display_name
- description
- category
- tags（JSON 数组或分隔字符串）
- status（DISCOVERED/REGISTERED/ENABLED/DISABLED/GRAY_RELEASE/SOURCE_REMOVED/DECOMMISSIONED）
- schema_json（MCP 工具 schema 原始内容）
- strategy_json（超时、重试、限流、优先级等配置）
- visibility_json（可见的 appId 列表与其他规则）
- created_by, created_at, updated_by, updated_at

### 5.3 工具指标（mcp_tool_metrics）

- id (PK)
- tool_id (FK)
- env
- time_bucket（如按分钟/小时聚合的时间）
- total_count
- success_count
- fail_count
- latency_p95
- latency_p99

### 5.4 调用日志（mcp_tool_invoke_log）

- id (PK)
- tool_id
- env
- app_id
- trace_id
- request_time
- duration_ms
- result_status（SUCCESS/FAIL）
- error_code
- error_message
- request_params_digest（脱敏/摘要）
- extra（JSON，预留）

### 5.5 审计日志（mcp_audit_log）

- id (PK)
- operator
- operation_type（SERVER_CREATE/SERVER_UPDATE/TOOL_CREATE/TOOL_UPDATE/TOOL_ENABLE/TOOL_DISABLE/...）
- target_type（SERVER/TOOL）
- target_id
- before_digest（JSON）
- after_digest（JSON）
- created_at

---

## 6 接口设计概览

以下为主要接口列表，具体入参/出参可在实现阶段进一步细化为 DTO。

### 6.1 MCP 服务器管理

- `GET /mcp/servers`：查询服务器列表。
- `POST /mcp/servers`：新增服务器。
- `PUT /mcp/servers/{id}`：编辑服务器。
- `DELETE /mcp/servers/{id}`：删除服务器（支持 force 参数）。
- `POST /mcp/servers/{id}/health-check`：手动健康检查。
- `GET /mcp/servers/{id}/discovered-tools`：查询发现的工具列表。
- `POST /mcp/servers/{id}/tools/import`：批量导入工具。

### 6.2 工具管理

- `GET /mcp/tools`：工具列表。
- `GET /mcp/tools/{id}`：工具详情。
- `PUT /mcp/tools/{id}`：更新工具配置（基础信息、策略、可见范围）。
- `POST /mcp/tools/{id}/enable`：启用工具。
- `POST /mcp/tools/{id}/disable`：禁用工具。
- `POST /mcp/tools/{id}/clone-config`：复制配置到其他环境。

### 6.3 监控与日志

- `GET /mcp/tools/{id}/metrics`：按时间范围查询指标曲线。
- `GET /mcp/tools/{id}/logs`：查询调用日志。

### 6.4 审计

- `GET /mcp/audit-logs`：查询审计日志。

### 6.5 运行时工具查询

- `GET /runtime/mcp/tools?env={env}&appId={appId}`：
  - 返回该环境下、对指定 appId 可见且启用状态的工具列表及其策略与 Schema 摘要。

---

## 7 非功能需求

### 7.1 性能

- 工具列表在 1000 条规模下，单页加载时间（不含网络）应小于 2 秒。
- 指标查询在常规时间范围（≤24 小时）内返回时间不超过 3 秒。

### 7.2 可用性

- 管理后台可用性目标 ≥ 99.9%（按业务要求调整）。
- 接口都需具备适当的失败降级和错误提示信息。

### 7.3 安全

- 所有管理接口需通过统一认证鉴权体系。
- 敏感配置（Token、密码等）只以“已配置/未配置”的形式展示，不回显明文。
- 审计日志完整记录关键改动，且不可篡改。

### 7.4 可扩展性与可维护性

- 设计时尽量将 MCP 协议相关部分抽象，未来可平滑扩展到其他工具接入协议。
- 配置与状态具备完备的审计与回溯能力，为后续自动化运维与策略调优提供基础。

---

本 Markdown 文档用于指导“大模型 MCP 工具管理功能”的设计与实现，后续如需，可以在此基础上进一步拆分为详细技术设计文档与接口定义文档。

