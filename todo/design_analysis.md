# 需求设计: 思维导图样式与 Mermaid 改造 (MindMap Style & Mermaid Refactor)

## 1. 需求背景
1.  **思维导图页面**: 标签显示需要增加边框 (`bordered`) 以提升视觉效果。
2.  **Mermaid 管理页面**: 目前界面风格与功能与 MindMap 页面不统一，且使用独立的分类管理 (`MermaidCategory`)。需要将其改造为与 MindMap 统一的 UI 组件 layout (`DataManager`, `GroupTree`)，并切换底层分类体系为通用的 `Group` 接口。

## 2. 总体方案
*   **涉及模块**: 
    *   Frontend: `MindMap`, `MermaidMgr`, `Group`
    *   Backend: `MermaidDiagram` (Service/Controller)
*   **核心逻辑**:
    *   前端 `GroupTree` 组件通用化，支持传入 `type` (mindmap/mermaid)。
    *   `MermaidMgr` 页面重构，使用 `DataManager` 组件替代原有手动布局。
    *   后端 `MermaidDiagram` 接入 `Group` 系统（使用 `GroupObjRela` 关联表），不再使用 `MermaidCategory`。

## 3. 后端设计 (Spring Boot)
### 3.1. Entity & DTO
*   **MermaidDiagramDTO**:
    *   新增字段 `group` (String, 对应 GroupName)。
    *   新增字段 `groupLabel` (String, 用于展示)。
*   **MermaidDiagram Entity**:
    *   (可选) 移除 `categoryId` 字段 (或者暂时保留但不使用)。
    *   逻辑上使用 `GroupObjRela` 表建立 `mermaid_diagram.id` 与 `group.id` 的关联。

### 3.2. Service (MermaidDiagramService)
*   **create/update**:
    *   接收 `group` 参数。
    *   调用 `GroupRepository` 查找分组。
    *   调用 `GroupObjRelaRepository` 保存关联。
*   **list**:
    *   在查询列表时，需关联查询 `GroupObjRela` -> `Group`，填充 `groupLabel`。

## 4. 前端设计 (React + Arco Design)
### 4.1. MindMap 页面优化
*   `src/pages/MindMap/index.tsx`: `<Tag>` 组件增加 `bordered` 属性。

### 4.2. GroupTree 组件通用化
*   `src/pages/MindMap/components/GroupTree.tsx`:
    *   新增 Props: `type: string` (默认 'mindmap')。
    *   API 调用 `getGroupList` 和 `createGroup` 时传入此 `type`。

### 4.3. MermaidMgr 页面重构
*   `src/pages/MermaidMgr/index.tsx`:
    *   引入 `DataManager`。
    *   配置 `GroupTree` (`type='mermaid'`)。
    *   配置列定义的 `groupLabel` 展示。
    *   使用 `AddEditModal` 替代原有 Modal。
    *   **移除**原有的 `Sider` 布局和 `Tree` 组件。
    *   **API**: 切换为使用 `Group` 相关 API 管理左侧树。

## 5. 实施步骤 (Action Plan)
1.  **[Frontend]** 修改 `GroupTree.tsx` 支持 `type` 参数。
2.  **[Frontend]** 修改 `MindMap/index.tsx` 增加 Tag border，并适配 `GroupTree` 新参数。
3.  **[Backend]** 修改 `MermaidDiagramDTO` 和 `MermaidDiagramService` 支持 Group 关联。(需参考 MindMapService 实现)
4.  **[Frontend]** 重写 `MermaidMgr/index.tsx`。
5.  **[Skill]** 编译检查。
