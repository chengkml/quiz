# 需求设计: 智能体管理功能 (Agent Management)

## 1. 需求背景

### 1.1 功能目标
构建一个智能体(Agent)管理系统，支持用户创建和配置AI智能体。智能体是一个独立的AI助手实体，具有特定的系统提示词(Prompt)、可调用的MCP工具集合以及可选的LLM模型配置。

### 1.2 用户场景
- **开发者/运维人员**：创建面向不同业务场景的智能体，如"客服助手"、"代码审查助手"、"数据分析助手"等
- **业务用户**：通过预配置的智能体完成特定任务，无需关心底层配置
- **管理员**：管理智能体的生命周期，包括启用、禁用、版本控制等

### 1.3 核心能力
1. **智能体基本信息管理**：名称、描述、图标、分类
2. **Prompt配置**：支持直接输入系统提示词或关联已有的提示词模板
3. **MCP工具指定**：选择该智能体可使用的MCP工具列表
4. **LLM模型配置**：指定智能体使用的大语言模型(可选，可使用系统默认)
5. **状态管理**：智能体的启用/禁用/草稿状态管理

---

## 2. 总体方案

### 2.1 涉及模块
| 模块 | 说明 |
|------|------|
| Agent (新增) | 智能体核心模块 |
| AgentTool (新增) | 智能体与MCP工具的关联表 |
| McpTool (现有) | MCP工具模块 |
| PromptTemplate (现有) | 提示词模板模块 |
| LLMModel (现有) | 大语言模型模块 |

### 2.2 核心逻辑

```
┌─────────────────────────────────────────────────────────────────┐
│                        Agent (智能体)                            │
├─────────────────────────────────────────────────────────────────┤
│  - 基本信息 (name, description, icon, category)                  │
│  - systemPrompt: 系统提示词(直接存储或引用PromptTemplate)         │
│  - modelId: 关联的LLM模型ID (可选)                               │
│  - status: 状态 (DRAFT/ENABLED/DISABLED)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     AgentTool (智能体工具关联)                    │
├─────────────────────────────────────────────────────────────────┤
│  - agentId: 智能体ID                                             │
│  - mcpToolId: MCP工具ID                                          │
│  - priority: 工具优先级 (可选)                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 数据流转
1. 用户创建智能体 → 填写基本信息 + 配置Prompt + 选择MCP工具
2. 保存时：先创建Agent记录，再批量创建AgentTool关联记录
3. 运行时：根据Agent配置加载系统提示词 + 可用工具列表 + LLM模型

---

## 3. 后端设计 (Spring Boot)

### 3.1 数据库变更

#### 3.1.1 新增表: `agent` (智能体表)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | VARCHAR(32) | PK, NOT NULL | 主键ID |
| name | VARCHAR(128) | NOT NULL | 智能体名称 |
| identifier | VARCHAR(128) | UNIQUE | 智能体标识符(用于API调用) |
| description | VARCHAR(512) | - | 智能体描述 |
| icon | VARCHAR(256) | - | 图标URL或emoji |
| category | VARCHAR(64) | - | 分类 |
| system_prompt | TEXT | - | 系统提示词(直接存储) |
| prompt_template_id | VARCHAR(32) | - | 关联的提示词模板ID(二选一) |
| model_id | VARCHAR(32) | - | 关联的LLM模型ID |
| model_config | VARCHAR(2000) | - | 模型参数配置(JSON: temperature, maxTokens等) |
| status | VARCHAR(32) | NOT NULL, DEFAULT 'DRAFT' | 状态: DRAFT/ENABLED/DISABLED |
| tags | VARCHAR(512) | - | 标签(逗号分隔) |
| create_date | DATETIME | - | 创建时间 |
| create_user | VARCHAR(64) | - | 创建用户 |
| update_date | DATETIME | - | 更新时间 |
| update_user | VARCHAR(64) | - | 更新用户 |

#### 3.1.2 新增表: `agent_tool` (智能体工具关联表)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | VARCHAR(32) | PK, NOT NULL | 主键ID |
| agent_id | VARCHAR(32) | NOT NULL, INDEX | 智能体ID |
| mcp_tool_id | VARCHAR(32) | NOT NULL | MCP工具ID |
| priority | INT | DEFAULT 0 | 工具优先级(数值越大优先级越高) |
| config | VARCHAR(2000) | - | 工具特定配置(JSON) |
| create_date | DATETIME | - | 创建时间 |
| create_user | VARCHAR(64) | - | 创建用户 |
| update_date | DATETIME | - | 更新时间 |
| update_user | VARCHAR(64) | - | 更新用户 |

### 3.2 Entity 设计

#### 3.2.1 Agent.java

```java
package com.ck.quiz.agent.entity;

import com.ck.quiz.base.entity.Model;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

@Data
@Entity
@Comment("智能体")
@EqualsAndHashCode(callSuper = true)
@Table(name = "agent", indexes = {
    @Index(name = "idx_agent_identifier", columnList = "identifier"),
    @Index(name = "idx_agent_status", columnList = "status"),
    @Index(name = "idx_agent_category", columnList = "category")
})
public class Agent extends Model {

    @Column(length = 128, nullable = false)
    @Comment("智能体名称")
    private String name;

    @Column(length = 128, unique = true)
    @Comment("智能体标识符")
    private String identifier;

    @Column(length = 512)
    @Comment("智能体描述")
    private String description;

    @Column(length = 256)
    @Comment("图标")
    private String icon;

    @Column(length = 64)
    @Comment("分类")
    private String category;

    @Column(columnDefinition = "TEXT")
    @Comment("系统提示词")
    private String systemPrompt;

    @Column(length = 32)
    @Comment("提示词模板ID")
    private String promptTemplateId;

    @Column(length = 32)
    @Comment("关联的LLM模型ID")
    private String modelId;

    @Column(length = 2000)
    @Comment("模型参数配置JSON")
    private String modelConfig;

    @Column(length = 32, nullable = false)
    @Comment("状态: DRAFT/ENABLED/DISABLED")
    private String status = "DRAFT";

    @Column(length = 512)
    @Comment("标签")
    private String tags;
}
```

#### 3.2.2 AgentTool.java

```java
package com.ck.quiz.agent.entity;

import com.ck.quiz.base.entity.Model;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

@Data
@Entity
@Comment("智能体工具关联")
@EqualsAndHashCode(callSuper = true)
@Table(name = "agent_tool", indexes = {
    @Index(name = "idx_agent_tool_agent_id", columnList = "agentId")
})
public class AgentTool extends Model {

    @Column(length = 32, nullable = false)
    @Comment("智能体ID")
    private String agentId;

    @Column(length = 32, nullable = false)
    @Comment("MCP工具ID")
    private String mcpToolId;

    @Column
    @Comment("工具优先级")
    private Integer priority = 0;

    @Column(length = 2000)
    @Comment("工具特定配置JSON")
    private String config;
}
```

### 3.3 接口设计 (API)

#### 3.3.1 智能体管理接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/agent/create` | 创建智能体 |
| PUT | `/api/agent/update` | 更新智能体 |
| DELETE | `/api/agent/delete/{id}` | 删除智能体 |
| GET | `/api/agent/get/{id}` | 获取智能体详情 |
| POST | `/api/agent/search` | 分页查询智能体列表 |
| GET | `/api/agent/list` | 获取简单列表(下拉选择用) |
| POST | `/api/agent/{id}/enable` | 启用智能体 |
| POST | `/api/agent/{id}/disable` | 禁用智能体 |
| POST | `/api/agent/{id}/duplicate` | 复制智能体 |

#### 3.3.2 智能体工具管理接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/agent/{agentId}/tools` | 获取智能体关联的工具列表 |
| PUT | `/api/agent/{agentId}/tools` | 批量更新智能体工具(全量替换) |

#### 3.3.3 请求/响应模型

**AgentCreateDto:**
```json
{
  "name": "客服助手",
  "identifier": "customer-service-bot",
  "description": "专业的客户服务智能助手",
  "icon": "🤖",
  "category": "客服",
  "systemPrompt": "你是一个专业的客服助手...",
  "promptTemplateId": null,
  "modelId": "model-001",
  "modelConfig": "{\"temperature\": 0.7, \"maxTokens\": 2048}",
  "tags": "客服,自动回复",
  "toolIds": ["tool-001", "tool-002"]
}
```

**AgentDto (响应):**
```json
{
  "id": "agent-001",
  "name": "客服助手",
  "identifier": "customer-service-bot",
  "description": "专业的客户服务智能助手",
  "icon": "🤖",
  "category": "客服",
  "systemPrompt": "你是一个专业的客服助手...",
  "promptTemplateId": null,
  "promptTemplateName": null,
  "modelId": "model-001",
  "modelName": "GPT-4",
  "modelConfig": "{\"temperature\": 0.7}",
  "status": "ENABLED",
  "tags": "客服,自动回复",
  "tools": [
    {"id": "tool-001", "displayName": "查询订单", "priority": 1},
    {"id": "tool-002", "displayName": "发送邮件", "priority": 0}
  ],
  "createDate": "2026-02-19T10:00:00",
  "updateDate": "2026-02-19T10:00:00"
}
```

### 3.4 核心类/方法

#### 目录结构
```
backend/src/main/java/com/ck/quiz/agent/
├── controller/
│   └── AgentController.java
├── dto/
│   ├── AgentCreateDto.java
│   ├── AgentUpdateDto.java
│   ├── AgentQueryDto.java
│   ├── AgentDto.java
│   ├── AgentToolDto.java
│   └── AgentToolBatchDto.java
├── entity/
│   ├── Agent.java
│   └── AgentTool.java
├── repository/
│   ├── AgentRepository.java
│   └── AgentToolRepository.java
└── service/
    ├── AgentService.java
    └── AgentServiceImpl.java
```

#### AgentController.java
- 继承 `BaseController<AgentCreateDto, AgentUpdateDto, AgentQueryDto, AgentDto>`
- 额外添加 `enable`、`disable`、`duplicate` 端点
- 添加工具管理端点 `getTools`、`updateTools`

#### AgentService.java
- 继承 `BaseService`
- `create()`: 创建智能体 + 批量创建工具关联
- `update()`: 更新智能体 + 同步更新工具关联
- `delete()`: 删除智能体 + 级联删除工具关联
- `enable()` / `disable()`: 状态切换
- `duplicate()`: 复制智能体及其工具配置
- `getTools()`: 获取智能体关联的工具列表(带McpTool详情)
- `updateTools()`: 批量更新工具关联

---

## 4. 前端设计 (React + Arco Design)

### 4.1 页面位置
```
frontend/src/pages/Agent/
├── api/
│   └── index.ts
├── components/
│   ├── AgentForm.tsx          # 智能体表单(新建/编辑共用)
│   ├── ToolSelector.tsx       # MCP工具选择器组件
│   └── PromptEditor.tsx       # Prompt编辑器组件
├── style/
│   └── index.less
└── index.tsx                  # 智能体列表页(使用DataManager)
```

### 4.2 组件结构

#### 4.2.1 智能体列表页 (`index.tsx`)
- 使用 `DataManager` 组件
- 筛选条件：关键词、状态、分类
- 列表字段：名称、标识符、描述、分类、状态、关联工具数、更新时间、操作
- 操作：编辑、启用/禁用、复制、删除

#### 4.2.2 智能体表单 (`AgentForm.tsx`)
表单分为多个区域：

**基本信息区：**
- 名称 (Input, 必填)
- 标识符 (Input, 自动生成或手动输入)
- 描述 (TextArea)
- 图标 (EmojiPicker 或 Input)
- 分类 (Select 或 Input)
- 标签 (Tags Input)

**Prompt配置区：**
- 配置方式单选：直接输入 / 选择模板
- 直接输入：TextArea (支持变量占位符)
- 选择模板：下拉选择已有的 PromptTemplate

**模型配置区：**
- LLM模型选择 (Select, 可选)
- 模型参数配置 (temperature, maxTokens 等)

**工具配置区：**
- MCP工具多选 (Transfer 或 Table + Checkbox)
- 支持搜索过滤
- 可设置工具优先级

#### 4.2.3 工具选择器 (`ToolSelector.tsx`)
- 左侧：可选工具列表(从McpTool接口获取，仅显示ENABLED状态的)
- 右侧：已选工具列表
- 支持拖拽排序(设置优先级)

### 4.3 API 定义

```typescript
// frontend/src/pages/Agent/api/index.ts
import axios from '@/core/src/http';

// 智能体 CRUD
export const createAgent = (params: any) => axios.post('/agent/create', params);
export const updateAgent = (params: any) => axios.put('/agent/update', params);
export const deleteAgent = (id: string) => axios.delete(`/agent/delete/${id}`);
export const getAgent = (id: string) => axios.get(`/agent/get/${id}`);
export const searchAgents = (params: any) => axios.post('/agent/search', params);
export const listAgents = () => axios.get('/agent/list');

// 状态管理
export const enableAgent = (id: string) => axios.post(`/agent/${id}/enable`);
export const disableAgent = (id: string) => axios.post(`/agent/${id}/disable`);
export const duplicateAgent = (id: string) => axios.post(`/agent/${id}/duplicate`);

// 工具管理
export const getAgentTools = (agentId: string) => axios.get(`/agent/${agentId}/tools`);
export const updateAgentTools = (agentId: string, toolIds: string[]) => 
  axios.put(`/agent/${agentId}/tools`, { toolIds });

// 辅助接口
export const listEnabledMcpTools = () => axios.get('/mcp/tool/list-enabled');
export const listPromptTemplates = () => axios.get('/prompt/template/list');
export const listLlmModels = () => axios.get('/llm-model/list');
```

### 4.4 状态管理
- 使用组件本地 State，无需 Redux
- 表单状态使用 Arco Form 管理

### 4.5 UI 交互说明

#### 新建智能体流程
1. 点击"新建智能体"按钮
2. 弹出 Modal 或跳转至表单页
3. 填写基本信息
4. 配置 Prompt (二选一)
5. 选择 LLM 模型 (可选)
6. 选择 MCP 工具 (可多选)
7. 点击"保存草稿"或"保存并启用"

#### 编辑智能体流程
1. 在列表点击"编辑"
2. 加载智能体详情 + 关联工具列表
3. 修改配置
4. 保存

---

## 5. 实施步骤 (Action Plan)

### Phase 1: 后端开发

| # | 类型 | 任务 | 文件路径 |
|---|------|------|----------|
| 1 | Backend | 创建 Agent Entity | `backend/src/main/java/com/ck/quiz/agent/entity/Agent.java` |
| 2 | Backend | 创建 AgentTool Entity | `backend/src/main/java/com/ck/quiz/agent/entity/AgentTool.java` |
| 3 | Backend | 创建 AgentRepository | `backend/src/main/java/com/ck/quiz/agent/repository/AgentRepository.java` |
| 4 | Backend | 创建 AgentToolRepository | `backend/src/main/java/com/ck/quiz/agent/repository/AgentToolRepository.java` |
| 5 | Backend | 创建 DTO 类 | `backend/src/main/java/com/ck/quiz/agent/dto/` 目录下所有 DTO |
| 6 | Backend | 创建 AgentService 接口 | `backend/src/main/java/com/ck/quiz/agent/service/AgentService.java` |
| 7 | Backend | 实现 AgentServiceImpl | `backend/src/main/java/com/ck/quiz/agent/service/AgentServiceImpl.java` |
| 8 | Backend | 创建 AgentController | `backend/src/main/java/com/ck/quiz/agent/controller/AgentController.java` |
| 9 | Skill | 运行 Java 编译检查 | `.agent/skills/java_compile_check/SKILL.md` |

### Phase 2: 前端开发

| # | 类型 | 任务 | 文件路径 |
|---|------|------|----------|
| 10 | Frontend | 创建 API 定义 | `frontend/src/pages/Agent/api/index.ts` |
| 11 | Frontend | 创建 ToolSelector 组件 | `frontend/src/pages/Agent/components/ToolSelector.tsx` |
| 12 | Frontend | 创建 AgentForm 组件 | `frontend/src/pages/Agent/components/AgentForm.tsx` |
| 13 | Frontend | 创建智能体列表页 (DataManager) | `frontend/src/pages/Agent/index.tsx` |
| 14 | Frontend | 创建样式文件 | `frontend/src/pages/Agent/style/index.less` |
| 15 | Frontend | 添加路由配置 | `frontend/src/router/` 相关文件 |
| 16 | Frontend | 添加菜单配置 | 后端 menu 数据或前端配置 |
| 17 | Skill | 运行前端编译检查 | `.agent/skills/frontend_build_check/SKILL.md` |

### Phase 3: 测试与优化

| # | 类型 | 任务 |
|---|------|------|
| 18 | Test | 创建智能体功能测试 |
| 19 | Test | 编辑/删除功能测试 |
| 20 | Test | 工具关联功能测试 |
| 21 | Optimize | 性能优化与Bug修复 |

---

## 6. 附录

### 6.1 状态枚举

```java
public enum AgentStatus {
    DRAFT,      // 草稿
    ENABLED,    // 启用
    DISABLED    // 禁用
}
```

### 6.2 模型配置示例

```json
{
  "temperature": 0.7,
  "maxTokens": 2048,
  "topP": 1.0,
  "frequencyPenalty": 0,
  "presencePenalty": 0
}
```

### 6.3 关联模块接口依赖

| 模块 | 需要的接口 | 用途 |
|------|-----------|------|
| McpTool | `GET /api/mcp/tool/list` | 获取可选的MCP工具列表 |
| PromptTemplate | `GET /api/prompt/template/list` | 获取可选的提示词模板 |
| LLMModel | `GET /api/llm-model/list` | 获取可选的LLM模型 |

### 6.4 未来扩展点

1. **版本管理**：支持智能体配置版本历史，可回滚
2. **运行统计**：记录智能体调用次数、Token消耗等
3. **权限控制**：智能体的可见性和使用权限控制
4. **工具组**：支持工具组批量关联
5. **环境隔离**：支持开发/测试/生产环境隔离配置
