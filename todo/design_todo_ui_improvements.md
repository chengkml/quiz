# 需求设计: 待办与知识库 UI 优化

## 1. 需求背景
优化待办管理(Todo)和知识库管理(Knowledge Set)的使用体验，统一 UI 交互风格，并修复已知 Bug。

## 2. 总体方案
*   **涉及模块**: `Todo`, `KnowledgeSet`
*   **核心逻辑**:
    *   **待办页**: 修复筛选重置/清空时的逻辑缺陷；确保默认查询待处理状态。
    *   **知识库页**: 将列表操作按钮改为图标按钮（与其他页面统一）；支持点击表格行查看详情。

## 3. 详细设计

### 3.1 待办管理 (Todo)
*   **FilterForm 交互优化**:
    *   修复搜索参数合并逻辑：当用户清空某个过滤条件时，确保 `searchParams` 中对应的字段也被清理，而不是保留旧值。
    *   实现 `onReset` 回调：点击重置时，显式将 `searchParams` 重置为默认值 (`{ status: 'PENDING' }`) 并触发刷新。

### 3.2 知识库管理 (KnowledgeSet)
*   **操作列改造**:
    *   参考 Todo 页面，将 "来源"、"编辑" 等文字按钮改为图标按钮 + Tooltip。
    *   布局调整：使用 Flex 布局 + Gap，替代 Space。
*   **行点击交互**:
    *   在 `DataManager` 配置中添加 `tableProps.onRow`，实现点击行触发详情查看。
    *   鼠标悬停样式：`cursor: pointer`。
*   **详情查看组件**:
    *   新增 `KnowledgeSetDetailModal` 或在 `index.tsx` 中内联实现详情弹窗。
    *   展示内容：名称、描述、标签、可见性、状态、创建人、创建时间等。

## 4. 实施步骤 (Action Plan)

1.  **[Frontend] 修复待办筛选 Bug**:
    *   修改 `frontend/src/pages/Todo/index.tsx` 中的 `handleSearch` 和添加 `onReset`。
    *   验证：输入标题搜索 -> 清空标题 -> 点击查询 -> 确认列表不再按旧标题过滤。
    *   验证：点击重置 -> 确认状态恢复为 "待处理"。

2.  **[Frontend] 改造知识库UI**:
    *   修改 `frontend/src/pages/KnowledgeSet/index.tsx`。
    *   更新 `columns` 定义，使用图标按钮。
    *   添加详情 Modal 状态 `detailModalVisible` 和 `detailRecord`。
    *   实现详情 Modal 渲染逻辑。
    *   配置 `onRow` 点击事件。

3.  **[Verification] 验证**:
    *   运行前端编译检查。
    *   人工验证 UI 交互。
