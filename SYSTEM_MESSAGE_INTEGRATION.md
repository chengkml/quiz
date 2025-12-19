# 系统消息功能集成清单

## 部署步骤

### 第1步：数据库迁移（自动执行）

系统消息功能已包含Flyway数据库迁移脚本：

1. **创建表** - `V20251219__create_system_message_table.sql`
   - 创建 `system_message` 表
   - 添加必要的索引

2. **添加菜单** - `V20251219__add_system_message_menu.sql`
   - 自动在菜单表中添加系统消息菜单项

启动应用后，Flyway会自动执行这些脚本。

### 第2步：后端代码

已实现的后端代码：

1. **实体类**
   - `com.ck.quiz.notification.entity.SystemMessage`

2. **数据访问层**
   - `com.ck.quiz.notification.repository.SystemMessageRepository`

3. **业务逻辑层**
   - `com.ck.quiz.notification.service.ISystemMessageService` (接口)
   - `com.ck.quiz.notification.service.impl.SystemMessageServiceImpl` (实现)

4. **数据传输对象**
   - `com.ck.quiz.notification.dto.SystemMessageDto`
   - `com.ck.quiz.notification.dto.SendSystemMessageDto`

5. **控制层**
   - `com.ck.quiz.notification.controller.SystemMessageController`

### 第3步：前端代码

已实现的前端代码：

1. **API服务**
   - `frontend/src/pages/Notification/systemMessageApi.ts`

2. **页面组件**
   - `frontend/src/pages/SystemMessage/index.tsx` (主入口)
   - `frontend/src/pages/SystemMessage/SendPage.tsx` (发送页面)
   - `frontend/src/pages/SystemMessage/ListPage.tsx` (列表页面)

3. **样式文件**
   - `frontend/src/pages/SystemMessage/style/index.less`

4. **路由配置**
   - 已添加到 `frontend/src/router/index.tsx`

## 验证部署

### 后端验证

1. **编译检查**
   ```bash
   cd backend
   ./gradlew clean build
   ```

2. **测试API**
   ```bash
   # 获取消息列表
   curl http://localhost:8080/api/system-message/list?page=0&size=20 \
     -H "Authorization: Bearer YOUR_TOKEN"
   
   # 发送消息
   curl -X POST http://localhost:8080/api/system-message/send \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "userIds": ["user1"],
       "title": "测试消息",
       "content": "这是一条测试消息",
       "type": "INFO",
       "priority": "NORMAL"
     }'
   ```

### 前端验证

1. **编译检查**
   ```bash
   cd frontend
   npm run build
   ```

2. **访问页面**
   - 登录系统后，访问 `/frame/systemmessage`
   - 验证"我的消息"标签页
   - 验证"发送消息"标签页

## 权限配置

### 建议的权限配置

1. **所有用户** - 可以查看和管理自己的消息
   - 查看消息列表
   - 标记已读
   - 删除消息

2. **管理员** - 可以发送消息给所有用户
   - 发送系统消息
   - 查看消息统计

### 添加权限校验（可选）

在 `SystemMessageController.java` 中的 `sendMessage` 方法添加权限检查：

```java
@PostMapping("/send")
@PreAuthorize("hasAuthority('ADMIN')") // 需要ADMIN权限
public ResponseEntity<Map<String, Object>> sendMessage(
    @Valid @RequestBody SendSystemMessageDto dto) {
    // ... 现有实现
}
```

## 自定义配置

### 修改菜单显示顺序

编辑 `V20251219__add_system_message_menu.sql`：

```sql
-- 修改菜单顺序（menu_order值越小，显示越靠前）
INSERT INTO menu (menu_id, parent_id, menu_name, menu_order, menu_url, menu_type, status, create_date, update_date)
VALUES (UUID(), NULL, '系统消息', 20, 'systemmessage', 'MENU', 'ACTIVE', NOW(), NOW());
```

### 修改消息保留时间

可以在业务逻辑中添加过期时间设置：

```java
LocalDateTime expireDate = LocalDateTime.now().plusDays(30); // 保留30天
message.setExpireDate(expireDate);
```

### 修改默认分页大小

在前端的 `ListPage.tsx` 中修改：

```typescript
const [pageSize, setPageSize] = useState(50); // 改为50条/页
```

## 常见问题排查

### 问题1：菜单未显示

**症状**：菜单表中找不到系统消息菜单项

**解决方案**：
1. 检查Flyway迁移脚本是否执行成功
2. 查看数据库日志
3. 手动执行SQL脚本：
   ```sql
   INSERT INTO menu (menu_id, parent_id, menu_name, menu_order, menu_url, menu_type, status, create_date, update_date)
   VALUES (UUID(), NULL, '系统消息', 99, 'systemmessage', 'MENU', 'ACTIVE', NOW(), NOW());
   ```

### 问题2：API返回401未授权

**症状**：调用API时返回401错误

**解决方案**：
1. 检查token是否有效
2. 确保用户已登录
3. 检查请求头是否包含Authorization

### 问题3：消息不显示

**症状**：发送消息后列表为空

**解决方案**：
1. 检查消息是否成功插入数据库
2. 确认接收用户ID正确
3. 检查消息status是否为ACTIVE

### 问题4：前端报错找不到API

**症状**：浏览器控制台显示404错误

**解决方案**：
1. 确保后端服务正在运行
2. 检查API基础路径配置
3. 确认 `systemMessageApi.ts` 的API地址正确

## 扩展建议

### 1. 消息模板系统

在 `SendPage.tsx` 中添加模板选择：

```typescript
const [templates, setTemplates] = useState<Template[]>([]);

// 选择模板
const handleSelectTemplate = (template: Template) => {
  formRef.current?.setFieldValue('title', template.title);
  setContentHtml(template.content);
};
```

### 2. 消息推送通知

集成第三方推送服务：

```java
// 在SystemMessageServiceImpl中添加
if (config.isPushEnabled()) {
  pushService.send(message);
}
```

### 3. 消息统计分析

添加统计dashboard：

```typescript
// 新建 StatisticsPage.tsx
const MessageStatistics = () => {
  const [stats, setStats] = useState({
    totalMessages: 0,
    unreadMessages: 0,
    readRate: 0
  });
};
```

### 4. 消息搜索和过滤

增强 `ListPage.tsx` 的搜索功能：

```typescript
const handleSearch = async (keyword: string) => {
  // 调用新的搜索API
  const results = await searchMessages(keyword);
};
```

### 5. 消息分类标签

为消息添加分类标签：

```typescript
interface SystemMessage {
  // ... 现有字段
  tags?: string[]; // 消息标签
  category?: string; // 消息分类
}
```

## 性能优化建议

1. **消息列表缓存** - 使用Redis缓存未读消息计数
2. **异步发送** - 使用消息队列异步处理批量发送
3. **索引优化** - 根据查询模式调整数据库索引
4. **分页优化** - 使用游标分页替代offset分页
5. **前端懒加载** - 实现虚拟列表优化大数据量显示

## 备份和恢复

建议定期备份消息数据：

```sql
-- 备份
CREATE TABLE system_message_archive AS SELECT * FROM system_message;

-- 清理已删除消息（可选）
DELETE FROM system_message WHERE status = 'DELETED' AND DATE_SUB(NOW(), INTERVAL 90 DAY) > create_date;
```

## 文档

详细的功能文档请参考：[README_SYSTEM_MESSAGE.md](./README_SYSTEM_MESSAGE.md)
