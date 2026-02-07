# 需求设计: 待办页面默认查询待处理的数据

## 1. 需求背景
当前待办页面加载时会查询所有状态的待办数据（待处理、处理中、已完成），用户通常更关注待处理的任务。为提升用户体验，需要让页面默认只显示待处理状态的数据，用户可以通过筛选条件调整查询范围。

**用户场景**：
- 用户打开待办页面时，默认看到需要处理的任务（status=PENDING）
- 用户可以通过状态筛选器查看其他状态的任务

## 2. 总体方案
*   **涉及模块**: Todo 待办管理
*   **核心逻辑**: 前端初始化时设置默认状态过滤条件为 PENDING
*   **影响范围**: 仅前端展示逻辑，后端接口无需调整

## 3. 后端设计 (Spring Boot)
**无需变更**

后端已经支持通过 `TodoQueryDto.status` 进行状态过滤：
- 文件: [backend/src/main/java/com/ck/quiz/todo/service/impl/TodoServiceImpl.java](backend/src/main/java/com/ck/quiz/todo/service/impl/TodoServiceImpl.java#L71-L74)
- 逻辑: 当 status 不为 null 时，添加 `AND t.status = :status` 条件

```java
if (queryDto.getStatus() != null) {
    JdbcQueryHelper.equals("status", queryDto.getStatus().name(), " AND t.status = :status ", params,
            sql, countSql);
}
```

## 4. 前端设计 (React + Arco Design)

### 4.1 页面位置
- [frontend/src/pages/Todo/index.tsx](frontend/src/pages/Todo/index.tsx)

### 4.2 修改点

**当前实现** ([index.tsx#L61-L65](frontend/src/pages/Todo/index.tsx#L61-L65))：
```tsx
const [searchParams, setSearchParams] = useState({
  title: null,
  status: null,  // 当前为 null，查询所有状态
  priority: null,
});
```

**修改为**：
```tsx
const [searchParams, setSearchParams] = useState({
  title: null,
  status: 'PENDING',  // 默认查询待处理状态
  priority: null,
});
```

### 4.3 筛选表单初始值

需要同步更新筛选表单的初始值，让状态下拉框显示"待处理"：

**位置**: [index.tsx#L148-L157](frontend/src/pages/Todo/index.tsx#L148-L157) 附近

确保 `FilterForm` 组件的 `initialValues` 包含：
```tsx
<FilterForm
  fields={searchFormFields}
  onSearch={handleSearch}
  onReset={handleReset}
  initialValues={{
    status: 'PENDING',  // 初始显示待处理
  }}
  ref={filterFormRef}
/>
```

### 4.4 重置逻辑调整

**位置**: handleReset 函数

重置时应恢复为默认筛选条件（待处理），而非清空所有条件：

```tsx
const handleReset = () => {
  const defaultParams = {
    title: null,
    status: 'PENDING',  // 重置为默认状态
    priority: null,
  };
  setSearchParams(defaultParams);
  fetchTableData(defaultParams, pagination.pageSize, 1);
};
```

## 5. 实施步骤 (Action Plan)

### Step 1: 修改前端初始化状态
修改 [frontend/src/pages/Todo/index.tsx](frontend/src/pages/Todo/index.tsx)：
- 修改 `searchParams` 初始状态，设置 `status: 'PENDING'`
- 修改 `FilterForm` 的 `initialValues`，设置 `status: 'PENDING'`
- 修改 `handleReset` 函数，重置时保持 `status: 'PENDING'`

### Step 2: 前端编译检查
使用 `.agent/skills/frontend_build_check/SKILL.md` 检查编译状态：
```bash
cd d:\idea_repo\quiz\frontend
npm run build
```

### Step 3: 功能测试
1. 打开待办页面，验证默认显示待处理的任务
2. 切换状态筛选为"处理中"或"已完成"，验证可正常查询
3. 点击重置按钮，验证恢复为待处理状态

## 6. 验收标准

- [x] 待办页面加载时默认显示待处理（PENDING）状态的数据
- [x] 状态筛选器默认选中"待处理"
- [x] 用户可以通过筛选器切换到其他状态
- [x] 点击重置按钮后恢复为待处理状态
- [x] 前端编译无错误

## 7. 注意事项

1. **用户习惯**: 此变更会改变用户首次打开页面的视图，建议在必要时通知用户
2. **数据完整性**: 已完成的任务仍然可以通过筛选器查看，不影响历史数据访问
3. **性能**: 默认筛选待处理状态会减少首屏加载的数据量，提升页面响应速度
