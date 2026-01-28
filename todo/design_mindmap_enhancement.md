# 需求设计: 思维导图功能增强 (MindMap Enhancement)

## 1. 需求背景
当前思维导图页面功能较为基础，为了提升用户体验，需要增强以下功能：
1.  **左侧分组管理**: 直接在列表页左侧的分组树上进行分组的增删改操作，无需跳转到专门的分组管理页。
2.  **思维导图查看**: 增加“查看”模式，允许用户在只读状态下浏览导图。
3.  **列表交互优化**: 支持行点击查看、双击编辑的快捷操作。

## 2. 总体方案
*   **涉及模块**: `MindMap` (前端), `Group` (后端/前端API)
*   **核心逻辑**:
    *   在前端复用现有的 `Group` API 实现树形控件的上下文菜单交互。
    *   新增路由和页面组件用于思维导图的只读查看。
    *   利用 UI 组件库的表格事件实现行点击逻辑。

## 3. 后端设计 (Spring Boot)
*   Current Status: **Ready**
*   **接口**: `com.ck.quiz.group.controller.GroupController` 已经提供了完善的 CRUD 接口。
    *   `POST /api/group/create`
    *   `PUT /api/group/update`
    *   `DELETE /api/group/delete/{id}`
    *   `POST /api/group/search`
*   **无需后端代码变更**。

## 4. 前端设计 (React + Arco Design)
### 4.1 页面: 思维导图列表页 (`src/pages/MindMap/index.tsx`)
*   **分组树增强**:
    *   引入 `Tree` 组件的 `renderExtra` 或自定义节点渲染 `titleRender`。
    *   添加右键菜单 (Context Menu) 或 悬浮操作按钮:
        *   **新增**: 弹出分组创建弹窗 (复用或新建简单的 Input Modal)。
        *   **编辑**: 弹出分组编辑弹窗。
        *   **删除**: 二次确认后调用删除接口。
    *   交互: 选中分组进行列表过滤 (现有功能保持)。
*   **表格交互**:
    *   `onRow` 属性:
        *   `onClick`: 跳转到查看页 (View Page)。
        *   `onDoubleClick`: 跳转到编辑页 (Draw Page)。
    *   **操作列**:
        *   新增 "查看" 按钮。

### 4.2 页面: 思维导图查看页 (`src/pages/MindMap/View/index.tsx`)
*   **新路由**: `/frame/mindmap/view/:id`
*   **组件**:
    *   复用 `src/pages/MindMap/Edit/index.tsx` 的核心渲染逻辑，但设置为 **Read-only** 模式。
    *   禁用工具栏、编辑操作。
    *   只保留 "导出"、"缩放" 等查看类功能。

### 4.3 组件: 分组树组件 (`src/pages/MindMap/components/GroupTree.tsx`)
*   由于逻辑变复杂，建议将左侧树逻辑抽离为单独组件。
*   Props: `onSelect`, `refreshTrigger` (用于列表更新)。

## 5. 实施步骤 (Action Plan)
1.  **[Frontend] 重构分组树**:
    *   创建 `src/pages/MindMap/components/GroupTree.tsx`。
    *   实现增删改调用的 API (`createGroup`, `updateGroup`, `deleteGroup`)。
    *   集成到 `MindMap/index.tsx`。
2.  **[Frontend] 实现查看页**:
    *   创建 `src/pages/MindMap/View/index.tsx`。
    *   配置路由 (需要在全局路由配置中添加，或确认已有路由机制)。
3.  **[Frontend] 列表交互**:
    *   修改 `MindMap/index.tsx` 表格配置，添加 `onRow` 事件。
    *   更新操作列按钮。
4.  **[Skill] 前端检查**:
    *   运行 `npm run build` 验证无报错。

## 6. 数据结构参考
### Group 接口
```typescript
interface Group {
  id: string;
  name: string; // 英文标识
  label: string; // 显示名称
  type: string; // 'mindmap'
}
```
