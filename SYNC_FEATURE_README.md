# 日程与待办同步功能说明

## 功能概述
实现了日程（Calendar）与待办（Todo）的同步机制。当创建或更新日程时，如果关联了待办项，日程的状态变化会自动同步到关联的待办项。

## 实现细节

### 后端修改

#### 1. 实体类变更
- **CalendarEvent.java**: 新增 `todoId` 字段，用于关联待办项

#### 2. DTO变更
- **CalendarEventDto.java**: 新增 `todoId` 字段
- **CalendarEventCreateDto.java**: 新增 `todoId` 字段（可选）
- **CalendarEventUpdateDto.java**: 新增 `todoId` 字段

#### 3. Service实现变更
- **CalendarEventServiceImpl.java**: 
  - 新增 `TodoService` 依赖注入
  - `createEvent()` 方法：创建日程时，如果指定了 `todoId`，会自动同步待办状态
  - `updateEvent()` 方法：更新日程时，如果关联了待办，会同步待办状态
  - `searchEvents()` 方法：查询SQL已更新为包含 `todo_id` 字段
  - 新增 `syncTodoStatus()` 方法：实现状态映射和同步逻辑

#### 4. 状态映射规则
日程状态 → 待办状态的映射：
- `SCHEDULED` (已计划) → `IN_PROGRESS` (处理中)
- `COMPLETED` (已完成) → `COMPLETED` (已完成)
- `CANCELLED` (已取消) → 不更新待办状态

### 前端修改

#### 1. Schedule组件（日程管理）
- **interface ScheduleItem**: 新增 `todoId?: string` 字段
- **模态框表单**: 新增"关联待办"输入框
- **表单提交**: 在 payload 中包含 `todoId` 字段

#### 2. Todo组件（待办管理）
- 待办项可选地关联日程
- 通过待办ID可追踪到相关的日程

### 数据库变更

#### SQL迁移脚本
```sql
-- 为calendar_event表添加todo_id字段
ALTER TABLE calendar_event ADD COLUMN todo_id VARCHAR(32);

-- 添加索引以提高查询性能
CREATE INDEX idx_calendar_event_todo_id ON calendar_event(todo_id);
```

## 使用流程

### 创建关联的日程
1. 打开日程管理页面
2. 点击"新增日程"
3. 填写日程基本信息（标题、描述、时间等）
4. 在"关联待办"字段中输入待办的ID
5. 点击"保存"
6. 系统会自动将日程状态同步到关联的待办项

### 查询关联关系
1. 在日程列表中查看，可以看到 `todoId` 字段
2. 日程的状态变化会实时影响相关的待办状态

## 技术细节

### 为什么采用这种设计？
1. **松耦合**: 通过 `todoId` 外键引用而不是真正的数据库外键约束，提供灵活性
2. **单向同步**: 仅日程 → 待办的同步，避免复杂的双向同步问题
3. **可选关联**: 日程可以不关联待办，完全独立使用
4. **异常处理**: 同步失败不会影响日程的保存

### 注意事项
- `TodoService` 使用 `@Autowired(required = false)` 注入，确保即使没有 TodoService 也不会报错
- 同步操作在事务内执行，保证数据一致性
- 如果同步失败，系统会记录错误但继续处理，不会中断主流程

## 未来扩展

1. **反向同步**: 当待办完成时，自动更新关联的日程状态
2. **批量同步**: 支持批量操作日程和待办的同步
3. **同步日志**: 记录所有同步操作，便于审计和调试
4. **优化**: 通过事件驱动而非直接调用，实现更优雅的异步同步
