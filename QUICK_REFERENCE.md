# 快速参考卡 - 日程与待办同步

## 🎯 一句话概括
日程与待办实现自动同步，当日程状态变化时自动更新关联的待办状态。

## 📝 核心文件清单

### 后端（Java）
```
backend/src/main/java/com/ck/quiz/calendar/
├── entity/CalendarEvent.java           ← 新增 todoId 字段
├── dto/
│   ├── CalendarEventDto.java           ← 新增 todoId 字段
│   ├── CalendarEventCreateDto.java     ← 新增 todoId 字段
│   └── CalendarEventUpdateDto.java     ← 新增 todoId 字段
└── service/impl/
    └── CalendarEventServiceImpl.java    ← 新增同步逻辑

backend/src/main/resources/db/migration/
└── V20250101__add_todo_sync_support.sql ← 数据库迁移脚本
```

### 前端（React/TypeScript）
```
frontend/src/pages/
└── Schedule/
    └── index.tsx                        ← 新增 todoId 支持
```

## 🔄 状态映射速查表

```
日程状态      → 待办状态
SCHEDULED    → IN_PROGRESS
COMPLETED    → COMPLETED
CANCELLED    → (无变化)
```

## 💻 关键代码片段

### 创建日程时
```typescript
const payload = {
    title: values.title,
    description: values.description,
    todoId: values.todoId,          // ← 新增
    status: values.status,
    startTime: ...,
    endTime: ...,
    allDay: ...
};
```

### 同步方法（后端）
```java
private void syncTodoStatus(String todoId, CalendarEvent.Status status) {
    if (Status.COMPLETED.equals(status)) {
        updateTodo(todoId, Todo.Status.COMPLETED);
    } else if (Status.SCHEDULED.equals(status)) {
        updateTodo(todoId, Todo.Status.IN_PROGRESS);
    }
}
```

## 🚀 部署检查清单（简明版）

- [ ] 执行数据库迁移脚本
- [ ] 编译后端代码（无错误）
- [ ] 构建前端项目（无错误）
- [ ] 重启应用程序
- [ ] 测试：创建关联日程 → 验证待办状态自动更新
- [ ] 测试：月视图点击日期 → 跳转周视图

## 🧪 快速测试

### 测试1：基本同步
```
1. 创建待办 "完成报告"（ID: todo-123）
2. 创建日程，关联 todoId = "todo-123"
3. 验证：待办状态自动变为 IN_PROGRESS
```

### 测试2：状态更新
```
1. 编辑日程，状态改为 COMPLETED
2. 验证：待办状态自动变为 COMPLETED
```

### 测试3：月→周切换
```
1. 在月视图点击任意日期
2. 验证：跳转到周视图，显示该周的日程
```

## 📊 数据库查询

### 查看 todoId 关联
```sql
SELECT id, title, status, todo_id 
FROM calendar_event 
WHERE todo_id IS NOT NULL;
```

### 验证同步
```sql
SELECT 
    c.id as calendar_id,
    c.title as calendar_title,
    c.status as calendar_status,
    t.id as todo_id,
    t.title as todo_title,
    t.status as todo_status
FROM calendar_event c
LEFT JOIN todo t ON c.todo_id = t.id
WHERE c.todo_id IS NOT NULL;
```

## ⚠️ 常见问题速查

| 问题 | 解决方案 |
|------|--------|
| 待办状态不同步 | 检查 todoId 是否正确，查看后端日志 |
| 日程保存失败 | 检查表单验证，确认必填字段 |
| 月视图无法切换 | 清除浏览器缓存，检查点击位置 |
| 数据库错误 | 确认迁移脚本已执行，列已添加 |

## 📋 配置项

### 环境变量（如果需要）
```properties
# application.yml
calendar:
  sync:
    enabled: true           # 启用同步
    async: false            # 同步执行（暂不支持异步）
    timeout: 5000           # 同步超时时间（毫秒）
```

## 🔐 权限检查

- [x] 用户需要能创建日程
- [x] 用户需要能编辑日程
- [x] 用户需要能查看待办
- [x] 待办编辑权限需保留给 Service

## 📞 获取帮助

1. 查看详细文档：`SYNC_FEATURE_README.md`
2. 查看代码片段：`CODE_SNIPPETS.md`
3. 查看测试用例：`TEST_CASES.md`
4. 查看部署指南：`DEPLOYMENT_CHECKLIST.md`
5. 查看实现摘要：`IMPLEMENTATION_SUMMARY.md`

## 🎯 关键指标

| 指标 | 目标值 | 验证方法 |
|------|--------|--------|
| 同步成功率 | > 99% | 检查日志统计 |
| 同步响应时间 | < 100ms | 监控性能指标 |
| 代码覆盖率 | > 80% | 运行单元测试 |
| 错误处理完整性 | 100% | 代码审查 |

## 💡 设计亮点

1. **可选关联** - todoId 是可选的，日程可独立存在
2. **错误隔离** - 同步失败不影响日程保存
3. **简单直接** - 通过 todoId 外键而不是复杂的关系映射
4. **易于扩展** - 容易添加反向同步或其他同步策略

## 📈 后续优化方向

1. 异步同步（使用消息队列）
2. 同步日志和审计
3. 批量同步支持
4. 反向同步（待办→日程）
5. 冲突解决策略

---

**版本：** 1.0  
**最后更新：** 2025-01-16  
**状态：** 待部署  
