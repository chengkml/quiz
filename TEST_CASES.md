# 测试用例与验证步骤

## 前置条件

1. 后端已编译并部署
2. 前端已构建并部署
3. 数据库迁移已执行（添加了 todo_id 列）
4. 系统已启动并可正常访问

## 测试用例

### TC-001: 创建新日程并关联待办

#### 步骤
1. 进入"待办管理"页面
2. 创建一个新待办，标题为 "完成报告"，获得 ID（如: `todo_20250116_001`）
3. 进入"日程管理"页面，切换到月视图
4. 点击"新增日程"按钮
5. 填写表单：
   - 标题：`完成报告会议`
   - 描述：`与团队讨论报告内容`
   - 关联待办：`todo_20250116_001`
   - 开始时间：2025-01-20 14:00
   - 结束时间：2025-01-20 15:00
   - 状态：`已计划(SCHEDULED)`
6. 点击"保存"

#### 预期结果
- ✅ 日程创建成功，显示在日历中
- ✅ 待办"完成报告"的状态自动更新为 `处理中(IN_PROGRESS)`
- ✅ 后端日志显示同步成功

#### 验证方法
```sql
-- 验证日程记录
SELECT * FROM calendar_event WHERE title = '完成报告会议';

-- 验证待办状态
SELECT id, title, status FROM todo WHERE id = 'todo_20250116_001';
-- 应该看到 status = 'IN_PROGRESS'
```

---

### TC-002: 更新日程状态为已完成

#### 步骤
1. 在日程管理页面中找到 "完成报告会议" 日程
2. 点击进入编辑模式（或直接点击卡片）
3. 将状态改为 `已完成(COMPLETED)`
4. 保存修改

#### 预期结果
- ✅ 日程状态更新为 COMPLETED
- ✅ 关联的待办"完成报告"状态也自动更新为 `已完成(COMPLETED)`
- ✅ 待办管理页面中该项显示为完成状态

#### 验证方法
```sql
-- 验证日程状态
SELECT id, title, status FROM calendar_event WHERE title = '完成报告会议';
-- 应该看到 status = 'COMPLETED'

-- 验证待办状态
SELECT id, title, status FROM todo WHERE id = 'todo_20250116_001';
-- 应该看到 status = 'COMPLETED'
```

---

### TC-003: 创建无关联的日程

#### 步骤
1. 进入"日程管理"页面
2. 点击"新增日程"按钮
3. 填写表单（关键：不填"关联待办"字段）：
   - 标题：`个人学习时间`
   - 描述：`阅读技术文档`
   - 开始时间：2025-01-22 10:00
   - 结束时间：2025-01-22 12:00
   - 状态：`已计划`
4. 保存

#### 预期结果
- ✅ 日程创建成功
- ✅ 日程独立存在，不影响任何待办
- ✅ todoId 字段为空或 null

#### 验证方法
```sql
-- 验证日程记录
SELECT id, title, todo_id FROM calendar_event WHERE title = '个人学习时间';
-- todo_id 应该为 NULL
```

---

### TC-004: 更新日程的关联待办

#### 步骤
1. 创建两个待办：`待办A` 和 `待办B`
2. 创建日程并关联 `待办A`
3. 编辑日程，修改"关联待办"为 `待办B` 的 ID
4. 保存

#### 预期结果
- ✅ 日程的 todoId 更新为新待办的 ID
- ✅ 新关联待办的状态被更新
- ✅ 旧待办保持不变或可选择同步解除关联

#### 验证方法
```sql
-- 验证日程的新关联
SELECT id, title, todo_id FROM calendar_event WHERE title = '...';
-- todo_id 应该指向待办B

-- 验证待办B的状态
SELECT id, title, status FROM todo WHERE id = '待办B的ID';
-- 应该看到 status 被同步更新
```

---

### TC-005: 月视图跳转到周视图

#### 步骤
1. 进入"日程管理"页面，确保在"月"视图
2. 在日历中点击任意一天（不点击事件，点击日期卡片空白处）
3. 观察页面变化

#### 预期结果
- ✅ 页面切换到"周"视图
- ✅ 周视图显示被点击日期所在的周
- ✅ 该周的所有日程和待办关联信息正确显示

#### 验证方法
- 检查日期导航栏显示的是周范围（如 "2025-01-13 - 2025-01-19"）
- 验证周视图中的日程数据正确

---

### TC-006: 同步异常处理

#### 步骤
1. 临时关闭或模拟 TodoService 不可用
2. 创建日程并关联待办
3. 观察行为

#### 预期结果
- ✅ 日程仍然创建成功
- ✅ 同步失败不阻塞日程保存
- ✅ 后端日志记录同步失败的异常
- ✅ 用户看不到同步相关的错误提示

#### 验证方法
- 查看后端日志，确认有错误记录但流程继续
- 确认日程数据被正确保存

---

### TC-007: 数据库迁移验证

#### 步骤
1. 连接数据库
2. 查看 calendar_event 表结构

#### 预期结果
- ✅ calendar_event 表有 todo_id 列
- ✅ todo_id 列为 VARCHAR(32)，可为 NULL
- ✅ 存在 idx_calendar_event_todo_id 索引

#### 验证 SQL
```sql
-- 查看表结构
DESC calendar_event;
-- 或
SHOW COLUMNS FROM calendar_event;

-- 查看索引
SHOW INDEX FROM calendar_event WHERE Column_name = 'todo_id';
```

---

### TC-008: location 字段完全移除验证

#### 步骤
1. 检查前端代码，确保没有 location 相关的代码
2. 检查后端代码，确保没有 location 相关的代码
3. 查看数据库表结构（如果之前有该列）

#### 预期结果
- ✅ 前端 Schedule 页面没有地点输入框
- ✅ 周视图中没有显示地点信息
- ✅ 后端 DTO 中没有 location 字段
- ✅ Service 查询中没有 location 列

#### 验证方法
```typescript
// 前端：查看 ScheduleItem 接口
// 应该没有 location 字段

// 后端：查看 CalendarEventDto
// 应该没有 location 字段
```

---

## 性能测试

### PT-001: 大数据量同步性能

#### 场景
创建 1000+ 关联待办的日程，验证同步性能

#### 验证指标
- 日程创建时间 < 2 秒
- 同步失败率 < 0.1%
- 数据库查询时间 < 500ms

#### SQL
```sql
-- 统计同步成功/失败的日程数
SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN todo_id IS NOT NULL THEN 1 ELSE 0 END) as with_todo,
    SUM(CASE WHEN todo_id IS NULL THEN 1 ELSE 0 END) as without_todo
FROM calendar_event;
```

---

## 回归测试检查清单

- [ ] 现有日程仍能正常显示
- [ ] 日程的增删改查功能完整
- [ ] 周视图、月视图、年视图正常工作
- [ ] 搜索和筛选功能正常
- [ ] 待办管理不受影响
- [ ] 没有 location 相关的错误提示
- [ ] 同步失败时日程仍被保存
- [ ] 性能没有明显下降

---

## 故障排查

### 问题1：日程保存成功但待办状态未更新

**检查步骤**
1. 确认 todoId 是否正确（可在日程详情中查看）
2. 检查后端日志是否有 "Failed to sync todo status" 错误
3. 验证 TodoService 是否可用
4. 检查待办是否真实存在于数据库中

### 问题2：月视图无法切换到周视图

**检查步骤**
1. 打开浏览器开发者工具，查看控制台错误
2. 验证点击目标是否正确（应该点击日期卡片，不是事件）
3. 检查 setViewType 和 setCurrentDate 是否被调用
4. 清除浏览器缓存重新加载

### 问题3：数据库迁移失败

**检查步骤**
1. 确认迁移脚本语法正确
2. 检查数据库权限是否足够
3. 验证 calendar_event 表是否存在
4. 查看数据库操作日志

---

## 自动化测试建议

### 单元测试
```java
@Test
public void testSyncTodoStatus() {
    // 创建日程
    CalendarEventCreateDto createDto = new CalendarEventCreateDto();
    createDto.setTitle("Test Event");
    createDto.setTodoId("todo-123");
    createDto.setStatus(CalendarEvent.Status.SCHEDULED);
    
    // 验证同步调用
    verify(todoService).updateTodo(any(TodoUpdateDto.class));
}
```

### 集成测试
```java
@Test
public void testCreateEventWithTodoSync() {
    // 创建日程
    CalendarEventDto result = calendarEventService.createEvent(createDto);
    
    // 验证日程
    assertNotNull(result.getId());
    assertEquals("todo-123", result.getTodoId());
    
    // 验证待办状态已更新
    Todo todo = todoRepository.findById("todo-123").get();
    assertEquals(Todo.Status.IN_PROGRESS, todo.getStatus());
}
```

### UI 自动化测试
```javascript
// 使用 Selenium 或 Cypress
describe('Schedule and Todo Sync', () => {
    it('should sync todo status when creating schedule', () => {
        // 创建日程
        createSchedule({
            title: 'Test Event',
            todoId: 'todo-123'
        });
        
        // 验证待办状态
        getTodoStatus('todo-123').should('equal', 'IN_PROGRESS');
    });
});
```
