# 核心实现代码片段

## 后端 - Service 同步逻辑

### CalendarEventServiceImpl.java 中的关键方法

#### 1. 同步方法（syncTodoStatus）
```java
/**
 * 同步日程状态到待办
 * SCHEDULED -> IN_PROGRESS
 * COMPLETED -> COMPLETED
 * CANCELLED -> 保持原状态
 */
private void syncTodoStatus(String todoId, CalendarEvent.Status calendarStatus) {
    try {
        TodoUpdateDto todoUpdateDto = new TodoUpdateDto();
        todoUpdateDto.setId(todoId);
        
        // 根据日程状态映射待办状态
        if (CalendarEvent.Status.COMPLETED.equals(calendarStatus)) {
            todoUpdateDto.setStatus(Todo.Status.COMPLETED);
        } else if (CalendarEvent.Status.SCHEDULED.equals(calendarStatus)) {
            todoUpdateDto.setStatus(Todo.Status.IN_PROGRESS);
        }
        // CANCELLED状态不更新待办状态
        
        if (todoUpdateDto.getStatus() != null) {
            todoService.updateTodo(todoUpdateDto);
        }
    } catch (Exception e) {
        // 同步失败不影响主流程
        System.err.println("Failed to sync todo status: " + e.getMessage());
    }
}
```

#### 2. 创建日程时同步
```java
@Override
@Transactional
public CalendarEventDto createEvent(CalendarEventCreateDto createDto) {
    validateTimeRange(createDto.getStartTime(), createDto.getEndTime());
    CalendarEvent event = new CalendarEvent();
    event.setId(IdHelper.genUuid());
    event.setTitle(createDto.getTitle());
    event.setDescription(createDto.getDescription());
    event.setTodoId(createDto.getTodoId());  // ← 新增
    event.setStatus(createDto.getStatus() != null ? createDto.getStatus() : CalendarEvent.Status.SCHEDULED);
    event.setStartTime(createDto.getStartTime());
    event.setEndTime(createDto.getEndTime());
    event.setAllDay(createDto.getAllDay() != null ? createDto.getAllDay() : Boolean.FALSE);
    CalendarEvent saved = calendarEventRepository.save(event);
    
    // 如果关联了待办，同步待办状态 ← 新增
    if (StringUtils.hasText(createDto.getTodoId()) && todoService != null) {
        syncTodoStatus(createDto.getTodoId(), event.getStatus());
    }
    
    return convertToDto(saved);
}
```

#### 3. 更新日程时同步
```java
@Override
@Transactional
public CalendarEventDto updateEvent(CalendarEventUpdateDto updateDto) {
    Optional<CalendarEvent> optionalEvent = calendarEventRepository.findById(updateDto.getId());
    if (optionalEvent.isEmpty()) {
        throw new RuntimeException("事件不存在，ID: " + updateDto.getId());
    }
    CalendarEvent event = optionalEvent.get();

    if (StringUtils.hasText(updateDto.getTitle())) {
        event.setTitle(updateDto.getTitle());
    }
    if (updateDto.getDescription() != null) {
        event.setDescription(updateDto.getDescription());
    }
    if (updateDto.getTodoId() != null) {  // ← 新增
        event.setTodoId(updateDto.getTodoId());
    }
    if (updateDto.getStatus() != null) {
        event.setStatus(updateDto.getStatus());
    }
    // ... 其他字段更新

    validateTimeRange(event.getStartTime(), event.getEndTime());

    CalendarEvent saved = calendarEventRepository.save(event);
    
    // 如果关联了待办，同步待办状态 ← 新增
    if (StringUtils.hasText(event.getTodoId()) && todoService != null) {
        syncTodoStatus(event.getTodoId(), event.getStatus());
    }
    
    return convertToDto(saved);
}
```

## 前端 - React 实现

### Schedule/index.tsx 中的关键部分

#### 1. 类型定义
```typescript
interface ScheduleItem {
    id: string;
    title: string;
    description: string;
    todoId?: string;  // ← 新增
    startTime: string;
    endTime: string;
    allDay?: boolean;
    color?: string;
    status: string;
}
```

#### 2. 数据转换
```typescript
const toScheduleItem = (event: any): ScheduleItem => ({
    id: event.id,
    title: event.title,
    description: event.description,
    todoId: event.todoId,  // ← 新增
    startTime: event.startTime,
    endTime: event.endTime,
    allDay: event.allDay,
    status: event.status,
    color: statusColorMap[event.status] || '#165dff',
});
```

#### 3. 表单提交
```typescript
const handleSave = async () => {
    try {
        const values = await formRef.current?.validate?.();
        if (values) {
            const payload = {
                title: values.title,
                description: values.description,
                todoId: values.todoId,  // ← 新增
                status: values.status,
                startTime: dayjs(values.startTime).format('YYYY-MM-DDTHH:mm:ss'),
                endTime: dayjs(values.endTime).format('YYYY-MM-DDTHH:mm:ss'),
                allDay: values.allDay ?? false,
            };

            if (isEditMode && currentSchedule) {
                await updateSchedule({...payload, id: currentSchedule.id});
                Message.success('日程更新成功');
            } else {
                await createSchedule(payload);
                Message.success('日程创建成功');
            }
            setModalVisible(false);
            loadSchedules();
        }
    } catch (error) {
        console.error('保存日程出错:', error);
        if (error?.fields) return;
        Message.error('操作失败');
    }
};
```

#### 4. 表单字段
```typescript
<Form.Item
    label="关联待办"
    field="todoId"
>
    <Input placeholder="输入待办ID（可选）"/>
</Form.Item>
```

## 数据库

### 迁移脚本
```sql
-- 为calendar_event表添加todo_id字段
ALTER TABLE calendar_event ADD COLUMN todo_id VARCHAR(32);

-- 添加索引以提高查询性能
CREATE INDEX idx_calendar_event_todo_id ON calendar_event(todo_id);
```

## 导入依赖

### 后端
```java
// 已在 CalendarEventServiceImpl 中添加
import com.ck.quiz.todo.dto.TodoUpdateDto;
import com.ck.quiz.todo.entity.Todo;
import com.ck.quiz.todo.service.TodoService;

// 依赖注入
@Autowired(required = false)
private TodoService todoService;
```

## 错误处理

### 同步失败不中断流程
```java
try {
    // 同步逻辑
    todoService.updateTodo(todoUpdateDto);
} catch (Exception e) {
    // 同步失败不影响主流程
    System.err.println("Failed to sync todo status: " + e.getMessage());
}
```

## 状态映射表

| 日程状态 | 待办状态 | 说明 |
|---------|---------|------|
| SCHEDULED | IN_PROGRESS | 日程已计划，标记待办为处理中 |
| COMPLETED | COMPLETED | 日程已完成，标记待办为完成 |
| CANCELLED | - | 日程已取消，不更新待办状态 |

## 关键设计原则

1. **单一职责** - Service 负责业务逻辑，DTO 负责数据传输
2. **错误隔离** - 同步失败不阻塞主流程
3. **可选关联** - todoId 为可选字段，日程可独立存在
4. **向后兼容** - 现有日程不受影响
5. **异常处理** - 使用 required = false 处理 TodoService 可能不存在的情况
