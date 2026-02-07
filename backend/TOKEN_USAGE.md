# Token使用统计功能

## 功能概述

本功能提供了完整的Token使用统计和成本计算功能，支持按模型、业务类型、用户、日期等多维度统计Token使用情况。

## 功能特性

1. **自动记录Token使用**：在模型调用时自动记录Token使用情况
2. **成本计算**：根据模型配置的单价自动计算成本
3. **多维度统计**：支持按模型、业务类型、用户、日期等维度统计
4. **业务关联**：支持关联业务ID和会话ID，便于追踪
5. **错误记录**：记录模型调用失败的情况

## 数据库初始化

执行SQL文件创建token_usage表：

```bash
mysql -u username -p database_name < backend/sql/token_usage_table.sql
```

或者在应用启动时，JPA会自动创建表结构（如果配置了`spring.jpa.hibernate.ddl-auto=update`）。

## 后端使用方式

### 1. 在模型调用时记录Token使用

以ChatService为例，已经集成了token统计功能：

```java
// 调用模型获取响应
ChatResponse response = client.prompt(prompt).call().chatResponse();
String answer = response.getResult().getOutput().getContent();

// 记录token使用
tokenUsageService.recordUsage(
    session.getModelName(),           // 模型名称
    "OpenAI",                         // 模型提供商
    response.getMetadata(),           // 响应元数据（包含token信息）
    "CHAT",                           // 业务类型
    session.getId(),                  // 业务ID
    session.getSessionUuid(),         // 会话ID
    payload.getContent(),             // 请求内容
    answer,                           // 响应内容
    userId                            // 用户ID
);
```

### 2. 业务类型定义

目前支持的业务类型：

- `CHAT` - 聊天对话
- `QUESTION` - 题目生成
- `OCR` - 图片识别
- `KNOWLEDGE` - 知识点生成
- `DATASOURCE` - 数据源处理
- `FUNCDOC` - 功能文档
- `MINDMAP` - 思维导图
- `MERMAID` - 流程图生成
- `CALENDAR` - 日历事件

### 3. 在其他服务中集成

#### 步骤1：注入TokenUsageService

```java
@Service
public class YourService {
    
    @Autowired
    private TokenUsageService tokenUsageService;
    
    @Autowired
    private LLMModelService llmModelService;
    
    // ...
}
```

#### 步骤2：修改模型调用代码

**方式一：使用ChatResponse（推荐）**

```java
// 原代码
String result = chatClient.prompt(prompt).call().content();

// 修改后
ChatResponse response = chatClient.prompt(prompt).call().chatResponse();
String result = response.getResult().getOutput().getContent();

// 记录token使用
try {
    tokenUsageService.recordUsage(
        modelName,
        modelProvider,
        response.getMetadata(),
        "YOUR_BUSINESS_TYPE",  // 替换为实际的业务类型
        businessId,
        null,  // 如果不是会话场景，可以为null
        requestContent,
        result,
        userId
    );
} catch (Exception e) {
    log.error("记录token使用失败", e);
}
```

**方式二：简化版（适用于无法获取元数据的场景）**

```java
// 如果无法获取ChatResponse元数据，可以手动指定token数量
tokenUsageService.recordUsage(
    modelName,
    promptTokens,      // 输入token数
    completionTokens,  // 输出token数
    "YOUR_BUSINESS_TYPE",
    businessId,
    sessionId,
    userId
);
```

### 4. 记录错误

当模型调用失败时，也应该记录：

```java
try {
    // 模型调用
} catch (Exception e) {
    tokenUsageService.recordError(
        modelName,
        "YOUR_BUSINESS_TYPE",
        businessId,
        sessionId,
        e.getMessage(),
        userId
    );
    throw e;
}
```

## 前端使用方式

### 1. 访问统计页面

在浏览器中访问：`/token-usage`

### 2. 使用API

```typescript
import { 
  getMyStatisticsByModel, 
  getMyStatisticsByBusiness, 
  getMyStatisticsByDate 
} from '@/pages/TokenUsage/api';

// 获取按模型统计
const modelStats = await getMyStatisticsByModel();

// 获取按业务类型统计
const businessStats = await getMyStatisticsByBusiness();

// 获取按日期统计
const dateStats = await getMyStatisticsByDate({
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  modelName: 'gpt-4'
});
```

### 3. 在聊天页面显示Token统计

```typescript
import { queryBySessionId } from '@/pages/TokenUsage/api';

// 获取当前会话的token使用情况
const sessionUsage = await queryBySessionId(sessionId);

const totalTokens = sessionUsage.reduce((sum, record) => sum + record.totalTokens, 0);
const totalCost = sessionUsage.reduce((sum, record) => sum + record.totalCost, 0);
```

## API接口说明

### 1. 查询统计数据

**接口**：`POST /api/token-usage/statistics`

**请求体**：
```json
{
  "statType": "model",        // model|business|user|date
  "startDate": "2024-01-01",  // 可选
  "endDate": "2024-01-31",    // 可选
  "userId": "user123",        // 可选
  "modelName": "gpt-4"        // 可选
}
```

**响应**：
```json
[
  {
    "dimension": "gpt-4",
    "totalTokens": 12500,
    "promptTokens": 5000,
    "completionTokens": 7500,
    "totalCost": 0.625,
    "requestCount": 25
  }
]
```

### 2. 查询记录列表

**接口**：`POST /api/token-usage/records`

### 3. 查询会话Token使用

**接口**：`GET /api/token-usage/session/{sessionId}`

### 4. 获取个人统计

- `GET /api/token-usage/my-statistics/by-model` - 按模型统计
- `GET /api/token-usage/my-statistics/by-business` - 按业务类型统计
- `GET /api/token-usage/my-statistics/by-date` - 按日期统计

## 模型价格配置

在模型管理页面配置模型的Token单价：

1. 进入"模型管理"页面
2. 编辑模型
3. 设置"输入token单价（元/1K）"和"输出token单价（元/1K）"
4. 保存

例如：
- GPT-4: 输入 0.03元/1K, 输出 0.06元/1K
- GPT-3.5: 输入 0.0015元/1K, 输出 0.002元/1K

## 集成到其他服务的完整示例

### QuestionService示例

```java
@Service
public class QuestionServiceImpl implements QuestionService {
    
    @Autowired
    private TokenUsageService tokenUsageService;
    
    @Autowired
    private LLMModelService llmModelService;
    
    public SseEmitter generateQuestionsStream(GenerateRequest request, String userId) {
        SseEmitter emitter = new SseEmitter(300000L);
        
        executor.execute(() -> {
            try {
                OpenAiChatModel chatModel = llmModelService.getChatModel(request.getModelName());
                ChatClient client = ChatClient.builder(chatModel).build();
                
                StringBuilder fullContent = new StringBuilder();
                
                client.prompt(buildPrompt(request))
                    .stream()
                    .content()
                    .doOnNext(chunk -> {
                        fullContent.append(chunk);
                        emitter.send(chunk);
                    })
                    .doOnComplete(() -> {
                        // 流式响应完成后，需要手动计算或估算token数量
                        // 这里可以使用第三方库如tiktoken来计算
                        int estimatedPromptTokens = estimateTokens(request.getPrompt());
                        int estimatedCompletionTokens = estimateTokens(fullContent.toString());
                        
                        // 记录token使用
                        try {
                            tokenUsageService.recordUsage(
                                request.getModelName(),
                                estimatedPromptTokens,
                                estimatedCompletionTokens,
                                "QUESTION",
                                request.getKnowledgeId(),
                                null,
                                userId
                            );
                        } catch (Exception e) {
                            log.error("记录token使用失败", e);
                        }
                        
                        emitter.complete();
                    })
                    .doOnError(error -> {
                        tokenUsageService.recordError(
                            request.getModelName(),
                            "QUESTION",
                            request.getKnowledgeId(),
                            null,
                            error.getMessage(),
                            userId
                        );
                        emitter.completeWithError(error);
                    })
                    .subscribe();
                    
            } catch (Exception e) {
                log.error("生成题目失败", e);
                emitter.completeWithError(e);
            }
        });
        
        return emitter;
    }
    
    private int estimateTokens(String text) {
        // 简单估算：1个中文字符约等于2个token，1个英文单词约等于1.3个token
        // 这只是粗略估算，实际应该使用tiktoken库
        if (text == null) return 0;
        return (int) (text.length() * 1.5);
    }
}
```

## 注意事项

1. **流式响应**：流式响应（SSE）通常无法获取完整的元数据，需要在响应完成后手动记录或估算token数量
2. **Token估算**：对于无法获取实际token数的场景，可以使用tiktoken等库进行估算
3. **成本计算**：确保在模型管理中正确配置了Token单价，否则成本将为0
4. **异步记录**：token记录失败不应影响主业务流程，建议使用try-catch包裹
5. **存储内容**：requestContent和responseContent字段用于记录实际的请求和响应内容，较大的内容可能会占用较多存储空间，可以根据需要选择是否存储完整内容

## 未来扩展

1. **Token估算库**：集成tiktoken-java等库，更准确地估算token数量
2. **预算控制**：添加用户或组织级别的Token使用预算和告警
3. **实时监控**：添加WebSocket实时推送Token使用情况
4. **详细分析**：添加更多维度的分析，如单次调用平均token、峰值统计等
5. **导出功能**：支持导出统计数据为Excel或PDF
