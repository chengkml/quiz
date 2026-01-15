# 通用大模型聊天功能详细设计说明书（Spring AI 版）

## 一、总体架构设计

- 前端  
  - 技术栈：React + TypeScript（沿用现有项目），复用当前 UI 库。  
  - 职责：  
    - 提供聊天 UI（会话列表 + 消息区 + 参数区 + 输入区）；  
    - 管理前端会话状态（当前会话、消息列表、参数设置）；  
    - 调用后端聊天接口，展示 AI 回复（支持流式或一次性返回）；  
    - 处理错误提示和 Loading 状态。

- 后端  
  - 技术栈：Spring Boot + Spring AI + JPA（或现有持久层方案） + MySQL。  
  - 职责：  
    - 对接多种大模型（通过 Spring AI 的 Model Client / Chat Client 统一封装）；  
    - 提供 REST 接口给前端调用：创建/续写会话、获取历史消息、管理会话；  
    - 管理会话与消息持久化，控制上下文长度；  
    - 记录日志与基础统计（可后续扩展）。

- 数据库  
  - 使用 MySQL 中新增聊天相关表：会话表、消息表、可选配置表。

---

## 二、后端详细设计

### 2.1 模块划分

在 `backend/src/main/java/com/ck/quiz` 下新增模块包（示例）：

- `chat/`  
  - `controller/`：`ChatController`  
  - `dto/`：`ChatMessageDto`, `ChatCompletionRequest`, `ChatCompletionResponse`, `ChatSessionDto` 等  
  - `entity/`：`ChatSession`, `ChatMessage`, `ChatUserSetting`（可选）  
  - `repository/`：`ChatSessionRepository`, `ChatMessageRepository`  
  - `service/`：`ChatService`, `ChatSessionService`  
  - `llm/`：`SpringAiChatClientFacade`（封装 Spring AI 调用）

### 2.2 数据库表结构设计

#### 2.2.1 聊天会话表 `chat_session`

- 用途：记录一段持续对话的元信息（标题、归属用户、配置等）。

字段设计：

| 字段名         | 类型         | 约束                       | 说明                                   |
|----------------|--------------|----------------------------|----------------------------------------|
| `id`           | BIGINT       | PK, AUTO_INCREMENT         | 会话主键 ID                            |
| `session_uuid` | VARCHAR(64)  | UNIQUE, NOT NULL           | 对前端暴露的会话 ID                    |
| `user_id`      | BIGINT       | 索引，可为 NULL           | 所属用户 ID，匿名用户可为空           |
| `title`        | VARCHAR(255) | 可为空                     | 会话标题（默认用首轮用户问题截断）    |
| `model_name`   | VARCHAR(100) | NOT NULL                   | 使用的模型名称                         |
| `temperature`  | DECIMAL(3,2) | NOT NULL DEFAULT 0.7       | 温度                                   |
| `max_tokens`   | INT          | 可为空                     | 最大回复 token 数，NULL 为默认        |
| `status`       | VARCHAR(32)  | NOT NULL DEFAULT 'ACTIVE'  | 会话状态：ACTIVE / ARCHIVED / DELETED |
| `created_at`   | DATETIME     | NOT NULL                   | 创建时间                               |
| `updated_at`   | DATETIME     | NOT NULL                   | 最近更新时间                           |
| `extra_config` | JSON / TEXT  | 可为空                     | 预留配置，如模式、系统提示等          |

索引建议：

- `idx_chat_session_user` (`user_id`, `status`)  
- `idx_chat_session_uuid` (`session_uuid`)

#### 2.2.2 聊天消息表 `chat_message`

- 用途：记录对话中每一条消息（用户/助手/系统），用于上下文和历史记录。

字段设计：

| 字段名       | 类型       | 约束                       | 说明                              |
|--------------|------------|----------------------------|-----------------------------------|
| `id`         | BIGINT     | PK, AUTO_INCREMENT         | 消息主键 ID                       |
| `session_id` | BIGINT     | FK -> chat_session.id     | 所属会话                          |
| `role`       | VARCHAR(32)| NOT NULL                   | 角色：USER / ASSISTANT / SYSTEM   |
| `content`    | MEDIUMTEXT | NOT NULL                   | 消息内容（Markdown/纯文本）       |
| `seq`        | INT        | NOT NULL                   | 在会话中的顺序（从 1 开始）       |
| `tokens`     | INT        | 可为空                     | 消耗 token 数（可选统计）         |
| `error_flag` | TINYINT(1) | NOT NULL DEFAULT 0         | 是否异常消息（例如失败提示）      |
| `created_at` | DATETIME   | NOT NULL                   | 创建时间                          |

索引建议：

- `idx_chat_message_session_seq` (`session_id`, `seq`)  
- `idx_chat_message_created` (`created_at`)

#### 2.2.3 用户聊天配置表（可选）`chat_user_setting`

- 用途：存常用模型、默认温度等个性化配置。

字段设计：

| 字段名              | 类型         | 约束                       | 说明                |
|---------------------|--------------|----------------------------|---------------------|
| `id`                | BIGINT       | PK, AUTO_INCREMENT         | 主键                |
| `user_id`           | BIGINT       | UNIQUE, NOT NULL           | 用户 ID             |
| `default_model`     | VARCHAR(100) | 可为空                     | 默认模型            |
| `default_temp`      | DECIMAL(3,2) | 可为空                     | 默认温度            |
| `default_max_tokens`| INT          | 可为空                     | 默认最大 token 数   |
| `created_at`        | DATETIME     | NOT NULL                   | 创建时间            |
| `updated_at`        | DATETIME     | NOT NULL                   | 更新时间            |

> 前期不需要个性化配置时，可以先不建此表，后续扩展。

---

### 2.3 接口设计（REST + Spring AI）

统一前缀：`/api/chat`

#### 2.3.1 发送消息 / 补全接口

- Method：`POST /api/chat/completions`
- 功能：新建会话或在已有会话上继续对话；调用 Spring AI 完成一次补全，返回助手回复消息。

请求示例：

```json
{
  "sessionId": "9c1e7e98-0c0b-4d64-9e77-2c280c7d2f1f",
  "message": {
    "role": "USER",
    "content": "请帮我写一段活动邀请文案，语气友好一些。"
  },
  "config": {
    "modelName": "gpt-4o",
    "temperature": 0.7,
    "maxTokens": 512
  }
}
```

字段说明：

- `sessionId`：可选，空表示新建会话；非空表示在旧会话基础上继续。  
- `message`：当前用户输入（role 固定 USER）。  
- `config`：可选，若为空则使用会话保存的配置或系统默认值。

响应示例：

```json
{
  "sessionId": "9c1e7e98-0c0b-4d64-9e77-2c280c7d2f1f",
  "messages": [
    {
      "id": 101,
      "role": "USER",
      "content": "请帮我写一段活动邀请文案，语气友好一些。",
      "createdAt": "2026-01-14T12:00:00"
    },
    {
      "id": 102,
      "role": "ASSISTANT",
      "content": "当然可以！以下是一段简短的活动邀请文案：\n\n...",
      "createdAt": "2026-01-14T12:00:03"
    }
  ],
  "usage": {
    "promptTokens": 50,
    "completionTokens": 150,
    "totalTokens": 200
  }
}
```

行为说明：

- 根据 `sessionId` 查找会话，如不存在则创建新会话并生成 `session_uuid`；  
- 从 `chat_message` 中取最近 N 条消息 + 当前用户消息组成 Spring AI 的 Chat 请求；  
- 调用 Spring AI 的 Chat Client 得到回复；  
- 将用户消息与助手消息一起持久化，再返回给前端。

#### 2.3.2 获取会话列表

- Method：`GET /api/chat/sessions`
- Query：`page`, `size`, `status`（可选）, `keyword`（可选）  
- 用途：聊天界面左侧展示会话列表。

响应示例：

```json
{
  "content": [
    {
      "sessionId": "9c1e7e98-0c0b-4d64-9e77-2c280c7d2f1f",
      "title": "帮我写活动邀请文案",
      "modelName": "gpt-4o",
      "updatedAt": "2026-01-14T12:05:00"
    },
    {
      "sessionId": "ab23cd45-67ef-8901-2345-6789abcdef01",
      "title": "接口文档生成讨论",
      "modelName": "gpt-4o-mini",
      "updatedAt": "2026-01-13T20:11:00"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 35
}
```

#### 2.3.3 获取会话详情（历史消息）

- Method：`GET /api/chat/sessions/{sessionId}/messages`
- Query：`limit`（默认 50）、`before`（可选，用于向上翻页）  
- 用途：进入某个会话时拉取历史消息；滚动加载更多历史。

响应示例：

```json
{
  "sessionId": "9c1e7e98-0c0b-4d64-9e77-2c280c7d2f1f",
  "messages": [
    {
      "id": 90,
      "role": "USER",
      "content": "之前的问题...",
      "createdAt": "2026-01-14T11:50:00"
    },
    {
      "id": 91,
      "role": "ASSISTANT",
      "content": "之前的回答...",
      "createdAt": "2026-01-14T11:50:05"
    }
  ]
}
```

#### 2.3.4 新建会话（可选显式接口）

- Method：`POST /api/chat/sessions`

请求：

```json
{
  "title": "新的空白会话",
  "config": {
    "modelName": "gpt-4o-mini",
    "temperature": 0.7
  }
}
```

响应：

```json
{
  "sessionId": "new-uuid",
  "title": "新的空白会话"
}
```

> 若希望简化，也可以不提供此接口，首次发送消息时自动创建会话。

#### 2.3.5 会话归档 / 删除（可选）

- `POST /api/chat/sessions/{sessionId}/archive`  
- `DELETE /api/chat/sessions/{sessionId}`  

根据业务需求决定是否实现。

---

### 2.4 Spring AI 集成设计

#### 2.4.1 依赖配置（示意）

在 `backend/build.gradle` 中加入 Spring AI 相关依赖（版本以官方为准）：

```groovy
implementation 'org.springframework.ai:spring-ai-openai-spring-boot-starter:<version>'
```

#### 2.4.2 配置文件 `application.yml`（示意）

```yaml
spring:
  ai:
    openai:
      api-key: ${OPENAI_API_KEY}
      base-url: https://api.openai.com/v1
      chat:
        options:
          model: gpt-4o
          temperature: 0.7
          max-tokens: 512
```

#### 2.4.3 Chat Client 封装设计

- 定义统一服务类 `SpringAiChatClientFacade`：  
  - 依赖 Spring AI 的 ChatClient；  
  - 提供方法：

    ```java
    ChatCompletionResult chat(ChatRequestContext context);
    ```

  - `ChatRequestContext` 包含：模型名、temperature、maxTokens、历史消息列表、system prompt 等。

- 控制器通过 `ChatService` 调用该 Facade，屏蔽底层厂商细节。

#### 2.4.4 上下文截断策略

- 从数据库按 `sessionId` + `seq` 倒序取最近 N 条消息（如最近 10 轮）；  
- 合并为 Spring AI Chat 请求的 messages 列表（按 SYSTEM/USER/ASSISTANT 区分）；  
- 若总长度超出阈值（基于估算 tokens 或内容长度）：  
  - 丢弃最早几条消息，仅保留最近会话；  
  - 后续可扩展为“摘要旧消息”。

---

## 三、前端详细设计

### 3.1 路由与页面结构

在 `frontend/src/pages` 下新增聊天页面模块，例如：

- `pages/Chat/`  
  - `index.tsx`：聊天主页面  
  - `style/index.less`：样式文件  
  - `components/`：
    - `SessionList.tsx`：会话列表  
    - `MessageList.tsx`：消息列表  
    - `MessageInput.tsx`：输入区  
    - `ChatHeader.tsx`：顶部栏（标题、模型等）  
    - `ChatSettingsPanel.tsx`：参数区（可折叠）

路由（在 `router/index.tsx` 中）：

- `path: '/chat'` -> `ChatPage` 组件  
- 可选：`/chat/:sessionId` 对应某个会话直达。

### 3.2 状态管理设计

使用 React Hooks + 本地状态（如配合 Context 或现有状态管理）。

状态类型示例：

```ts
type ChatMessage = {
  id: string | number;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  createdAt: string;
};

type ChatSession = {
  sessionId: string;
  title: string;
  modelName: string;
  updatedAt: string;
};

type ChatConfig = {
  modelName: string;
  temperature: number;
  maxTokens?: number;
};

type ChatState = {
  sessions: ChatSession[];
  currentSessionId?: string;
  messages: ChatMessage[];
  config: ChatConfig;
  loading: boolean;
  error?: string;
};
```

交互逻辑：

- 页面加载：请求 `/api/chat/sessions` 填充 `sessions`；  
- 选择会话：更新 `currentSessionId`，请求 `/api/chat/sessions/{id}/messages`；  
- 发送消息：  
  - 将用户消息先插入 `messages`；  
  - 设置 `loading = true`，调用 `POST /api/chat/completions`；  
  - 返回后追加 AI 消息，更新会话 `updatedAt`；  
  - 失败时设置 `error`，触发提示。

### 3.3 UI 布局设计

#### 3.3.1 整体布局

- 左侧：会话列表（SessionList）；  
- 中间：消息区（ChatHeader + MessageList + MessageInput）；  
- 右侧（可选）：参数设置面板（ChatSettingsPanel）。

在移动端自适应折叠会话列表和参数面板，仅保留消息区和底部输入框。

#### 3.3.2 会话列表（SessionList）

- 展示：标题、更新时间、模型名；  
- 交互：  
  - 点击切换当前会话；  
  - 顶部“新建会话”按钮；  
  - 可选搜索框按标题过滤。

#### 3.3.3 消息区（MessageList + ChatHeader）

- ChatHeader：  
  - 显示当前会话标题；  
  - 可编辑标题并保存；  
  - 展示当前模型信息。

- MessageList：  
  - 用户消息右对齐，AI 消息左对齐；  
  - 支持 Markdown 渲染和代码块高亮；  
  - 自动滚动到底部；  
  - 可选复制按钮和时间戳显示。

#### 3.3.4 输入区（MessageInput）

- 多行文本框，Shift+Enter 换行，Enter 发送；  
- 发送按钮（输入为空或 loading 时禁用）；  
- 可选清空输入/插入模板按钮。

#### 3.3.5 参数设置区（ChatSettingsPanel）

- 模型选择下拉；  
- 温度滑块（0–1，步长 0.1）；  
- 回复长度选项（短/中/长 -> 映射 maxTokens）；  
- 修改后更新前端 `config`，下次发送时携带到后端。

#### 3.3.6 状态提示与错误处理

- Loading：显示“AI 正在思考中…”占位，按钮 Loading；  
- 错误：顶部或消息列表内插入错误提示消息，同时用全局消息组件提醒。

### 3.4 前后端数据契约

消息对象：

```ts
type ApiChatMessage = {
  id: number;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  createdAt: string;
};
```

会话对象：

```ts
type ApiChatSession = {
  sessionId: string;
  title: string;
  modelName: string;
  updatedAt: string;
};
```

发送请求对象：

```ts
type ApiChatCompletionRequest = {
  sessionId?: string;
  message: {
    role: 'USER';
    content: string;
  };
  config?: {
    modelName?: string;
    temperature?: number;
    maxTokens?: number;
  };
};
```

返回对象结构参照 2.3 节示例。

---

## 四、非功能设计补充

- 性能：  
  - 客户端每次只拉取最近 N 条消息；  
  - 服务端控制上下文长度，大模型超时时间控制在 10 秒内。

- 安全：  
  - 前端页面显著提示不要输入敏感信息；  
  - API Key 仅配置在后端，通过 Spring AI 使用，前端不感知。

- 可扩展性：  
  - Spring AI 接入层采用接口 + 实现方式，方便新增模型厂商；  
  - 表结构预留 `extra_config` 等字段，用于后续扩展知识库 ID、对话模式等信息。

