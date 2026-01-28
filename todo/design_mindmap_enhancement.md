# 需求设计: 思维导图页面优化 (MindMap Enhancements)

## 1. 需求背景
优化思维导图页面的布局与交互体验。目前左侧树结构平铺较为松散，列表信息展示不合理，且跳转页面打开详情/绘图的方式在快速切换查看时体验不佳。

## 2. 总体方案
*   **涉及模块**: `MindMap`
*   **核心逻辑**:
    *   **左侧树**: 调整为层级结构，所有具体分组作为"全部"节点的子节点。
    *   **列表页**: 调整列顺序与可见性，提升信息密度。
    *   **交互**: 使用 Drawer (抽屉) 替代路由跳转来展示绘图器和详情页，保持上下文不丢失。

## 3. 后端设计 (Spring Boot)
*   **无变更**: 仅涉及前端展示逻辑，后端 API 保持原样。

## 4. 前端设计 (React + Arco Design)
*   **页面位置**: `src/pages/MindMap`
*   **组件结构变更**:
    *   `components/GroupTree.tsx`:
        *   修改 `treeData` 构造逻辑，将后台返回的分组列表放到 `children` 属性中，挂载到 "All" 节点下。
        *   需处理 `defaultExpandedKeys` 以默认展开 "All" 节点。
    *   `index.tsx`:
        *   **Table Columns**: 
            *   调整顺序: 名称 -> 分组 -> 创建人 -> 时间 -> 操作。
            *   移除 "描述" 列。
        *   **交互模式**:
            *   引入 `<Drawer>` 组件用于 "绘图" (`Edit/Draw` 模式) 和 "详情" (`View` 模式)。
            *   点击列表行或操作按钮时，不再 `navigate`，而是设置 `currentRecord` 并打开 Drawer。
            *   需要注意 Drawer 内嵌 `iframe` 或直接渲染组件。考虑到 `MindMapEditPage` 和 `ViewPage` 可能是独立路由页面，如果它们内部逻辑耦合了 Layout 或 URL 参数，可能需要适配。
            *   **适配方案**: 
                *   若原组件高度依赖路由参数 (`useParams`)，需修改组件使其支持从 props 传入 `id`。
                *   查看 `MindMap/Edit/index.tsx` 和 `MindMap/View/index.tsx` 确认是否需要重构。

*   **状态管理**:
    *   `index.tsx` 新增状态:
        *   `drawDrawerVisible`: boolean
        *   `viewDrawerVisible`: boolean
        *   `activeMindMapId`: string

## 5. 实施步骤 (Action Plan)
1.  **[Frontend] 重构 GroupTree**: 修改树结构生成逻辑，将分组挂至 "All" 下。
2.  **[Frontend] 调整列表列**: 修改 `columns` 定义，移动 Group 列，删除 Descr 列。
3.  **[Frontend] 适配子页面**: 检查并修改 `MindMap/Edit/index.tsx` 和 `View/index.tsx`，使其支持通过 Props 接收 `id` (若当前仅支持 URL Params)。
4.  **[Frontend] 实现抽屉交互**: 在 `MindMap/index.tsx` 中引入 Drawer，并嵌入 Edit/View 组件。
5.  **[Skill] 运行前端编译检查**。
