---
name: Arco Design 开发助手
description: 辅助生成和修改基于 Arco Design (React) 的前端代码，包含项目特定的组件最佳实践
---

此技能用于指导在本项目中正确使用 Arco Design 组件库及内部封装组件。

## 核心环境
*   **组件库**: `@arco-design/web-react` (React 18+)
*   **图标库**: `@arco-design/web-react/icon`
*   **样式语言**: Less

## 项目最佳实践 (Project Specifics)

### 1. 列表页开发模式 (推荐)
本项目高度封装了 **列表-详情-筛选** 的交互模式，推荐使用 `d:\idea_repo\quiz\frontend\src\components\DataManager` 组件，而不是直接手写整个 Table 和 Pagination 逻辑。

**典型结构 (参考 `MindMap/index.tsx`):**
1.  **定义列 (`columns`)**: 标准 Arco Table `ColumnProps` 数组。
2.  **定义筛选表单 (`searchFormFields`)**: 使用 `FormFieldConfig[]` 定义搜索项。
3.  **定义编辑表单 (`formConfig`)**: 使用 `FormFieldConfig[]` 定义新增/编辑弹窗的字段。
4.  **组合组件**:
    ```tsx
    <DataManager
      data={tableData}          // 表格数据
      loading={loading}         // 加载状态
      pagination={pagination}   // 分页对象
      onPaginationChange={...}  // 分页回调
      actions={{ onAdd: ... }}  // 顶部操作按钮
      config={{
        displayMode: "table",   // 模式: table | list | card
        filterContent: <FilterForm ... />, // 筛选区
        tableColumns: columns,  // 表格列定义
      }}
    />
    ```

### 2. 常用组件引入
```typescript
// 基础组件
import { Button, Card, Grid, Space, Form, Input, Table, Message, Modal } from "@arco-design/web-react";
// 图标 (按需引入)
import { IconPlus, IconEdit, IconDelete, IconSearch } from "@arco-design/web-react/icon";
// 内部封装组件
import { DataManager, AddEditModal } from "@/components/DataManager";
import FilterForm from "@/components/FilterForm";
```

### 3. 表单处理
*   **简单表单**: 使用 `AddEditModal` 配合 `formConfig` 自动生成。
*   **复杂表单**: 使用 `<Form layout="vertical">` 手动构建，配合 `useForm` hook 管理状态。

### 4. 样式规范
*   每个页面文件夹下应有 `style/index.less`。
*   在 `index.tsx` 中引入: `import "./style/index.less";`。
*   尽量使用 Arco 内置的 Design Token 或 className (如 `arco-btn`, `arco-card`)，避免过度覆盖样式。

## 常用代码片段

### 消息提示
```typescript
import { Message } from "@arco-design/web-react";
Message.success("操作成功");
Message.error("操作失败");
```

### 确认对话框
```typescript
import { Modal } from "@arco-design/web-react";

Modal.confirm({
  title: "确认删除",
  content: "确定要删除这条记录吗？",
  onOk: async () => {
    // 执行删除逻辑
  }
});
```

### 栅格布局 (Grid)
```typescript
const { Row, Col } = Grid;

<Row gutter={24}>
  <Col span={12}>
    {/* 左侧内容 */}
  </Col>
  <Col span={12}>
    {/* 右侧内容 */}
  </Col>
</Row>
```
