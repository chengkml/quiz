# 需求设计: 分组接口参数强化与 Mermaid 页面优化

## 1. 需求背景
1.  **分组接口类型分离**: 后端 `Group` 资源被多个模块复用 (MindMap, Mermaid 等)，目前前端调用查询接口时需明确传 `type`，后端需强制校验。
2.  **Mermaid 列表优化**:
    *   表格中直接显示 `createUserName` (不再从 createUser 转换，统一后端返回逻辑或前端字段)。
    *   移除操作列的“详情”下拉菜单。
    *   双击或点击名称/详情时，展示 **Mermaid 渲染图** 而非源码。

## 2. 总体方案

### 2.1 分组查询 `type` 校验
*   **Backend**: `GroupController`/`GroupService` 中对 `queryGroupList` 的入参校验，要求 `type` 必填。(或在 Service 层处理逻辑)
*   **Frontend**: 全局搜索 `getGroupList` 调用点，确保都传入了 `type` 参数。
    *   `MindMap/components/GroupTree.tsx`: 已传入。
    *   `MermaidMgr`: 已传入。
    *   `MermaidMgr/api`: 检查调用。
    *   `MindMap`: 检查 GroupSelect 或其他地方。

### 2.2 Mermaid 列表与详情
*   **列表页 (`MermaidMgr/index.tsx`)**:
    *   Columns: `createUser` 显示逻辑调整。
    *   Columns: 操作列移除 `detail` 菜单项。
    *   Interaction: 双击行或点击名称触发 `handleDetail`。
*   **详情展示**:
    *   复用或新建一个 `MermaidPreview` 组件 (仅 View 无 Edit)。
    *   目前 `pages/Mermaid/index.tsx` 是一个编辑器 (`MermaidEditor`)，包含左右分栏。
    *   **方案**: 
        *   Option A: 抽取 `MermaidEditor` 中的预览部分为 `MermaidView` 组件。
        *   Option B: 在 Modal 中使用简化的 Mermaid 渲染逻辑 (类似 `MermaidEditor` 中的渲染代码)。考虑到代码复用，简单起见可以直接在 Modal 中集成 `mermaid.render` 逻辑，或者抽取一个小型 `MermaidViewer` 组件。
    *   决策: 为了快速实现且代码清晰，在 `MermaidMgr` 目录下创建一个 `components/MermaidViewer.tsx`，专门用于弹窗展示。

## 3. 后端设计 (Spring Boot)
*   **GroupQueryDto**: 
    *   `type` 字段增加 `@NotBlank` (如果使用 javax.validation) 或在 Controller/Service 中增加 Assert。
    *   校验逻辑: 如果 `type` 为空抛出异常。

## 4. 前端设计 (React)
*   **src/pages/MermaidMgr/components/MermaidViewer.tsx**:
    *   Props: `code`
    *   Effect: `mermaid.render`
*   **src/pages/MermaidMgr/index.tsx**:
    *   引入 `MermaidViewer`。
    *   `handleDetail` 打开 Modal，Content 为 `<MermaidViewer code={record.diagramData} />`。

## 5. 实施步骤 (Action Plan)
1.  **[Backend]** 修改 `GroupService` / `GroupController`，强制 `type` 校验。
2.  **[Skill]** 运行 Java 编译检查。
3.  **[Frontend]** 检查所有 `getGroupList` 调用点，确保传 `type`。
4.  **[Frontend]** 创建 `MermaidMgr/components/MermaidViewer.tsx`。
5.  **[Frontend]** 修改 `MermaidMgr/index.tsx`：
    *   使用 `createUserName`。
    *   移除详情下拉。
    *   集成 `MermaidViewer` 进行详情展示。
6.  **[Skill]** 运行前端编译检查。
