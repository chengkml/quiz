# 需求设计: 修复待办页面标题过滤输入然后清空后查询关键字仍被传给后端问题

## 1. 需求背景

**问题现象**：
用户在待办页面的标题筛选框中输入关键字搜索后，将输入框清空再次点击搜索，发现后端仍然收到包含 `title: null` 的查询参数，导致可能的查询异常或不符合预期的结果。

**问题范围**：
经过检查，这是一个**全局性问题**，影响多个页面：
- [Todo 待办管理](frontend/src/pages/Todo/index.tsx#L148-L155)
- [MindMap 思维导图](frontend/src/pages/MindMap/index.tsx#L140-L146)
- [MermaidMgr Mermaid管理](frontend/src/pages/MermaidMgr/index.tsx#L127-L131) - 甚至没有任何过滤
- 其他 10+ 个页面可能也有类似问题

**原因分析**：
当用户清空 Input 输入框时，Arco Design 表单会将该字段值设置为 `null`，而当前的 `handleSearch` 函数只过滤了空字符串 `""` 和 `undefined`，没有过滤 `null` 值，导致 `null` 被合并到 `searchParams` 中并传递给后端。

**影响范围**：
- 所有使用文本输入框的筛选条件（标题、描述等）
- 可能影响后端查询逻辑（如果后端没有正确处理 null 值）

## 2. 总体方案

*   **涉及模块**: 前端筛选表单（FilterForm 组件及多个页面）
*   **核心逻辑**: 在 FilterForm 组件中统一过滤 `null`、`undefined` 和空字符串，避免传递无效值
*   **影响范围**: 前端多个页面受益，后端无需调整
*   **推荐方案**: **优先修复 FilterForm 组件**（一次修复，所有页面受益），作为补充可以修复个别页面的特殊逻辑

## 3. 后端设计 (Spring Boot)
**无需变更**

后端当前使用 JdbcQueryHelper.lowerLike 处理 title 查询：
- 文件: [backend/src/main/java/com/ck/quiz/todo/service/impl/TodoServiceImpl.java](backend/src/main/java/com/ck/quiz/todo/service/impl/TodoServiceImpl.java#L63-L64)
- 逻辑: 只有当 title 不为 null 且不为空时才添加查询条件

```java
JdbcQueryHelper.lowerLike("titleKey", queryDto.getTitle(), 
    " AND LOWER(t.title) LIKE :titleKey ", params,
    namedParameterJdbcTemplate, sql, countSql);
```

虽然后端已经做了防护，但前端应该避免传递无效值，提升健壮性和性能。

## 4. 前端设计 (React + Arco Design)

### 4.1 问题定位

**文件**: [frontend/src/pages/Todo/index.tsx](frontend/src/pages/Todo/index.tsx#L148-L155)

**当前代码**（有问题）：
```tsx
// 搜索处理
const handleSearch = (values: any) => {
  const filterValues = Object.fromEntries(
    Object.entries(values).filter(([_, v]) => v !== "" && v !== undefined)
  );
  setSearchParams((prev) => ({ ...prev, ...filterValues }));
  setPagination((prev) => ({ ...prev, current: 1 }));
};
```

**问题分析**：
1. 过滤条件 `v !== "" && v !== undefined` 不完整，没有排除 `null`
2. 使用 `...prev, ...filterValues` 的方式合并，无法删除已存在的 null 值
3. 当用户清空输入框后，`filterValues` 包含 `{ title: null }`，会覆盖到 `searchParams` 中

### 4.2 修复方案

#### 方案一：完善过滤条件（推荐）

修改 `handleSearch` 函数，同时处理新值和旧值：

```tsx
// 搜索处理
const handleSearch = (values: any) => {
  // 1. 过滤掉无效值（null、undefined、空字符串）
  const filterValues = Object.fromEntries(
    Object.entries(values).filter(([_, v]) => {
      return v !== null && v !== undefined && v !== "";
    })
  );
  
  // 2. 合并时清除之前的值，只保留有效的新值
  setSearchParams((prev) => {
    const newParams = { ...prev };
    
    // 遍历所有可能的搜索字段
    Object.keys(values).forEach((key) => {
      if (filterValues[key] !== undefined) {
        // 有有效新值，更新它
        newParams[key] = filterValues[key];
      } else {
        // 新值无效（被过滤掉了），删除旧值
        delete newParams[key];
      }
    });
    
    return newParams;
  });
  
  setPagination((prev) => ({ ...prev, current: 1 }));
};
```

#### 方案二：简化版（更直接）

直接用过滤后的值替换对应字段：

```tsx
// 搜索处理
const handleSearch = (values: any) => {
  setSearchParams((prev) => {
    const newParams = { ...prev };
    
    // 遍历新提交的值
    Object.entries(values).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        // 有效值：更新
        newParams[key] = value;
      } else {
        // 无效值：删除
        delete newParams[key];
      }
    });
    
    return newParams;
  });
  
  setPagination((prev) => ({ ...prev, current: 1 }));
};
```

### 4.3 其他可能受影响的地方

检查是否有类似的问题：

1. **DataManager 组件**（如果其他页面也使用了）
   - 检查是否有统一的筛选值处理逻辑
   - 如果有，应该在组件级别修复

2. **FilterForm 组件**
   - [frontend/src/components/FilterForm/index.tsx](frontend/src/components/FilterForm/index.tsx)
   - 当前 `updateValueList` 已经正确过滤了 `null`（用于显示标签）
   - 但 `getFilterValues` 直接返回原始值，没有过滤
   - 可以考虑在 FilterForm 中统一处理，避免每个页面都要写过滤逻辑

### 4.4 建议的全局优化（可选）

**在 FilterForm 组件中统一处理**：

修改 [frontend/src/components/FilterForm/index.tsx](frontend/src/components/FilterForm/index.tsx#L112-L115)：

```tsx
// 获取当前筛选条件（过滤掉无效值）
const getFilterValues = useCallback(() => {
  const currentValues = { ...valuesRef.current };
  
  // 过滤掉 null、undefined、空字符串
  return Object.fromEntries(
    Object.entries(currentValues).filter(([_, v]) => {
      return v !== null && v !== undefined && v !== "";
    })
  );
}, []);
```

这样所有使用 FilterForm 的页面都能自动受益。

## 5. 实施步骤 (Action Plan)

### Step 1: 【推荐】全局修复 FilterForm 组件

修改 [frontend/src/components/FilterForm/index.tsx](frontend/src/components/FilterForm/index.tsx#L112-L115)：
- 在 `getFilterValues` 方法中统一过滤无效值（null、undefined、空字符串）
- **优势**: 一次修复，所有使用 FilterForm 的页面（13+ 个）都能自动受益

### Step 2: 修复 Todo 页面的 handleSearch 函数（如果 Step 1 不够）

修改 [frontend/src/pages/Todo/index.tsx](frontend/src/pages/Todo/index.tsx#L148-L155)：
- 实现方案二（简化版），确保清空输入框时删除对应的搜索参数
- **仅在**: FilterForm 修复后仍有问题时才需要

### Step 3: 前端编译检查

```bash
cd d:\idea_repo\quiz\frontend
npm run build
```

### Step 4: 功能测试

1. 在标题输入框输入关键字，点击搜索，验证查询正常
2. 清空标题输入框，点击搜索，验证后端不再收到 `title` 参数
3. 测试其他筛选条件（状态、优先级），确保正常工作
4. 测试组合筛选，验证多个条件协同工作

## 6. 验收标准

- [x] 清空输入框后点击搜索，不会传递 `null` 值给后端
- [x] 正常输入关键字搜索功能不受影响
- [x] 其他筛选条件正常工作
- [x] 前端编译无错误
- [x] 浏览器控制台无报错

## 7. 技术要点

### 7.1 JavaScript 值类型区别

| 值类型 | 场景 | 是否应该过滤 |
|--------|------|------------|
| `null` | 用户清空输入框 | ✅ 是 |
| `undefined` | 字段未设置 | ✅ 是 |
| `""` | 空字符串 | ✅ 是 |
| `0` | 数字0 | ❌ 否（可能是有效值） |
| `false` | 布尔值 | ❌ 否（可能是有效值） |

### 7.2 对象合并陷阱

```tsx
// ❌ 错误：会保留 null 值
const newParams = { ...prev, ...{ title: null } };
// 结果：{ ...prev, title: null }

// ✅ 正确：应该删除键
const newParams = { ...prev };
delete newParams.title;
// 结果：{ ...prev }（没有 title）
```

### 7.3 Arco Design Input 行为

- 有值 → 清空：值变为 `null`（而非 `undefined` 或 `""`）
- 从未输入：值为 `undefined`
- 输入后全选删除：值为 `""`

因此必须同时过滤这三种情况。

## 8. 测试用例

| 操作步骤 | 预期结果 |
|---------|---------|
| 1. 输入标题"测试"，点击搜索 | 发送 `{ title: "测试" }` |
| 2. 清空标题，点击搜索 | 发送 `{}`（不包含 title） |
| 3. 选择状态"待处理"，点击搜索 | 发送 `{ status: "PENDING" }` |
| 4. 输入标题"测试" + 状态"待处理"，点击搜索 | 发送 `{ title: "测试", status: "PENDING" }` |
| 5. 清空标题，保持状态，点击搜索 | 发送 `{ status: "PENDING" }` |
| 6. 点击重置按钮 | 清空所有条件，重新查询 |

## 9. 注意事项

1. **不要过度过滤**：数字 `0` 和布尔值 `false` 可能是有效的搜索条件，不应该被过滤
2. **考虑向后兼容**：修改后确保不影响其他使用相同逻辑的页面
3. **统一性**：如果项目中有多个类似页面，建议统一修复（如 MindMap、Mermaid 等）
4. **日志调试**：在开发环境可以打印 searchParams，便于排查问题

```tsx
// 调试用
useEffect(() => {
  console.log('searchParams changed:', searchParams);
}, [searchParams]);
```

## 10. 受影响的页面清单

以下页面都使用了 FilterForm 或类似的筛选逻辑，修复 FilterForm 后应进行回归测试：

1. ✅ [Todo 待办管理](frontend/src/pages/Todo/index.tsx)
2. ✅ [MindMap 思维导图](frontend/src/pages/MindMap/index.tsx)
3. ✅ [MermaidMgr Mermaid管理](frontend/src/pages/MermaidMgr/index.tsx)
4. [Script 脚本管理](frontend/src/pages/Script/index.tsx)
5. [Question 题目管理](frontend/src/pages/Question/index.tsx)
6. [PasswordManager 密码管理](frontend/src/pages/PasswordManager/index.tsx)
7. [Orchestration 编排管理](frontend/src/pages/Orchestration/index.tsx)
8. [LlmModel 模型管理](frontend/src/pages/LlmModel/index.tsx)
9. [JobQueue 任务队列](frontend/src/pages/JobQueue/index.tsx)
10. [Job 任务管理](frontend/src/pages/Job/index.tsx)
11. [Group 分组管理](frontend/src/pages/Group/index.tsx)
12. [Exam 考试管理](frontend/src/pages/Exam/index.tsx)
13. [DataManagerExample 示例](frontend/src/pages/DataManagerExample/index.tsx)

**测试建议**：
- 重点测试有文本输入框的页面（如 Todo、MindMap、Question 等）
- 测试组合筛选条件的场景
- 测试清空后重新搜索的场景
