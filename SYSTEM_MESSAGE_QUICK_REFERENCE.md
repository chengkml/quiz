# 系统消息功能快速参考

## 文件清单

### 后端文件

#### 数据库
- [V20251219__create_system_message_table.sql](backend/src/main/resources/db/migration/V20251219__create_system_message_table.sql) - 创建消息表
- [V20251219__add_system_message_menu.sql](backend/src/main/resources/db/migration/V20251219__add_system_message_menu.sql) - 添加菜单

#### Java代码
- [SystemMessage.java](backend/src/main/java/com/ck/quiz/notification/entity/SystemMessage.java) - 实体类
- [SystemMessageRepository.java](backend/src/main/java/com/ck/quiz/notification/repository/SystemMessageRepository.java) - 数据访问层
- [ISystemMessageService.java](backend/src/main/java/com/ck/quiz/notification/service/ISystemMessageService.java) - 服务接口
- [SystemMessageServiceImpl.java](backend/src/main/java/com/ck/quiz/notification/service/impl/SystemMessageServiceImpl.java) - 服务实现
- [SystemMessageDto.java](backend/src/main/java/com/ck/quiz/notification/dto/SystemMessageDto.java) - 消息DTO
- [SendSystemMessageDto.java](backend/src/main/java/com/ck/quiz/notification/dto/SendSystemMessageDto.java) - 发送DTO
- [SystemMessageController.java](backend/src/main/java/com/ck/quiz/notification/controller/SystemMessageController.java) - 控制器

### 前端文件

- [systemMessageApi.ts](frontend/src/pages/Notification/systemMessageApi.ts) - API服务
- [index.tsx](frontend/src/pages/SystemMessage/index.tsx) - 主页面
- [SendPage.tsx](frontend/src/pages/SystemMessage/SendPage.tsx) - 发送页面
- [ListPage.tsx](frontend/src/pages/SystemMessage/ListPage.tsx) - 列表页面
- [style/index.less](frontend/src/pages/SystemMessage/style/index.less) - 样式

### 文档文件

- [README_SYSTEM_MESSAGE.md](README_SYSTEM_MESSAGE.md) - 功能文档
- [SYSTEM_MESSAGE_INTEGRATION.md](SYSTEM_MESSAGE_INTEGRATION.md) - 集成指南

## 核心API一览表

### 用户API

| 功能 | 方法 | URL |
|------|------|-----|
| 获取消息列表 | GET | `/api/system-message/list?page=0&size=20` |
| 获取未读消息 | GET | `/api/system-message/unread?page=0&size=20` |
| 获取未读数 | GET | `/api/system-message/unread/count` |
| 获取消息详情 | GET | `/api/system-message/{messageId}` |
| 标记已读 | PUT | `/api/system-message/{messageId}/read` |
| 全部标记已读 | PUT | `/api/system-message/read-all` |
| 删除消息 | DELETE | `/api/system-message/{messageId}` |
| 删除全部 | DELETE | `/api/system-message/delete-all` |

### 管理员API

| 功能 | 方法 | URL | 请求体 |
|------|------|-----|--------|
| 发送消息 | POST | `/api/system-message/send` | SendSystemMessageDto |

## 消息类型和优先级

### 消息类型 (type)
- `INFO` - 信息（蓝色）
- `SUCCESS` - 成功（绿色）
- `WARNING` - 警告（橙色）
- `ERROR` - 错误（红色）

### 消息优先级 (priority)
- `LOW` - 低优先级（灰色）
- `NORMAL` - 普通（蓝色）
- `HIGH` - 高优先级（红色）

## 快速开始

### 发送消息（后端代码）

```java
@Autowired
private ISystemMessageService messageService;

// 发送单条消息
messageService.sendMessage("user123", "欢迎", "欢迎使用系统", "INFO");

// 批量发送
List<String> userIds = Arrays.asList("user1", "user2", "user3");
messageService.sendMessageBatch(userIds, "标题", "内容", "SUCCESS");

// 发送给所有用户
messageService.sendMessageToAll("系统通知", "系统维护中...", "WARNING");
```

### 获取消息（前端代码）

```typescript
import { getUserMessages, getUnreadCount } from '@/pages/Notification/systemMessageApi';

// 获取消息列表
const messages = await getUserMessages(0, 20);

// 获取未读数
const { unreadCount } = await getUnreadCount();

// 标记已读
import { markAsRead } from '@/pages/Notification/systemMessageApi';
await markAsRead(messageId);
```

## 数据库查询示例

### 查询用户消息

```sql
-- 查询特定用户的所有活跃消息
SELECT * FROM system_message 
WHERE user_id = 'user123' 
  AND status = 'ACTIVE'
ORDER BY create_date DESC;

-- 查询未读消息数
SELECT COUNT(*) FROM system_message 
WHERE user_id = 'user123' 
  AND is_read = FALSE 
  AND status = 'ACTIVE';

-- 查询高优先级消息
SELECT * FROM system_message 
WHERE user_id = 'user123' 
  AND priority = 'HIGH'
  AND status = 'ACTIVE';
```

## 路由配置

访问路径：`/frame/systemmessage`

菜单URL：`systemmessage`

菜单权限：`systemmessage`

## 前端组件使用

### 在其他页面中显示未读消息提示

```typescript
import { getUnreadCount } from '@/pages/Notification/systemMessageApi';
import { Badge } from '@arco-design/web-react';

const MyComponent = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    const loadCount = async () => {
      const data = await getUnreadCount();
      setUnreadCount(data.unreadCount);
    };
    loadCount();
    
    // 定时刷新
    const timer = setInterval(loadCount, 30000); // 每30秒刷新
    return () => clearInterval(timer);
  }, []);
  
  return (
    <Badge count={unreadCount}>
      <a href="/frame/systemmessage">消息</a>
    </Badge>
  );
};
```

## 开发调试

### 查看消息数据库结构

```sql
DESC system_message;
SHOW INDEXES FROM system_message;
```

### 查看菜单是否已添加

```sql
SELECT * FROM menu WHERE menu_url = 'systemmessage';
```

### 清空用户消息（测试用）

```sql
DELETE FROM system_message WHERE user_id = 'user123';
```

### 重置消息状态（测试用）

```sql
-- 标记所有消息为未读
UPDATE system_message SET is_read = FALSE, read_date = NULL 
WHERE user_id = 'user123';

-- 恢复已删除的消息
UPDATE system_message SET status = 'ACTIVE' 
WHERE user_id = 'user123' AND status = 'DELETED';
```

## 常用操作

### 查看后端日志

```
# 搜索系统消息相关日志
grep -i "系统消息" backend/logs/*.log

# 或查看发送日志
grep -i "已发送\|消息已发送" backend/logs/*.log
```

### 测试消息发送

使用 curl 或 Postman 发送 POST 请求：

```bash
curl -X POST http://localhost:8080/api/system-message/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userIds": ["admin"],
    "title": "测试消息",
    "content": "<p>这是一条<strong>测试</strong>消息</p>",
    "type": "INFO",
    "priority": "NORMAL"
  }'
```

### 前端本地测试

在浏览器控制台测试：

```javascript
// 导入API
import { getUserMessages, getUnreadCount } from '@/pages/Notification/systemMessageApi';

// 测试获取消息
getUserMessages(0, 20).then(data => console.log(data));

// 测试获取未读数
getUnreadCount().then(data => console.log(data));
```

## 常见修改

### 修改默认消息类型

编辑 [SendPage.tsx](frontend/src/pages/SystemMessage/SendPage.tsx)：

```typescript
const [messageType, setMessageType] = useState<MessageType>('SUCCESS'); // 改为默认SUCCESS
```

### 修改默认优先级

编辑 [SendPage.tsx](frontend/src/pages/SystemMessage/SendPage.tsx)：

```typescript
const [messagePriority, setMessagePriority] = useState<MessagePriority>('HIGH'); // 改为默认HIGH
```

### 修改每页显示条数

编辑 [ListPage.tsx](frontend/src/pages/SystemMessage/ListPage.tsx)：

```typescript
const [pageSize, setPageSize] = useState(50); // 改为50条/页
```

### 修改未读消息刷新间隔

编辑 [ListPage.tsx](frontend/src/pages/SystemMessage/ListPage.tsx)：

```typescript
// 修改定时器间隔
setInterval(() => loadUnreadCount(), 60000); // 改为60秒刷新
```

## 性能参数调优

### 数据库连接池配置

在 `application.yml` 中调整：

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20  # 根据并发用户数调整
      minimum-idle: 5
```

### 前端分页配置

根据实际使用情况调整分页大小：

```typescript
const [pageSize, setPageSize] = useState(20); // 根据内存情况调整
```

## 支持和反馈

如有问题或建议，请参考：
- [README_SYSTEM_MESSAGE.md](README_SYSTEM_MESSAGE.md) - 详细文档
- [SYSTEM_MESSAGE_INTEGRATION.md](SYSTEM_MESSAGE_INTEGRATION.md) - 集成指南
