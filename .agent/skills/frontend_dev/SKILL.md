---
name: 前端开发助手
description: React + Arco Design 前端开发流程指导，包含组件规范与构建检查
---

此技能为本项目 React + TypeScript + Arco Design 前端开发的最佳实践指南。

## 项目结构

前端代码位于 `d:\idea_repo\quiz\frontend\src\` 目录下：

```
frontend/src/
├── pages/                    # 页面组件
│   └── [Module]/
│       ├── index.tsx        # 主页面
│       ├── api/index.ts     # API 定义
│       └── style/index.less # 样式文件
├── components/               # 通用组件
│   ├── DataManager/         # 数据管理组件
│   ├── FilterForm/          # 搜索表单
│   └── ...
├── router/                   # 路由配置
├── utils/                    # 工具函数
└── types/                    # 类型定义
```

## 开发流程

### 1. 创建新页面

创建新页面时，按以下步骤进行：

1. **创建目录结构**
   ```
   src/pages/XxxModule/
   ├── index.tsx
   ├── api/index.ts
   └── style/index.less (可选)
   ```

2. **定义 API** (`api/index.ts`)
   
   > **注意**：`@/core/src/http` 的 baseURL 已包含 `/api` 前缀，因此 API 路径不需要再加 `/api`，例如使用 `/xxx/search` 而非 `/api/xxx/search`。
   
   ```typescript
   import axios from '@/core/src/http';
   
   export interface XxxDto {
       id: number;
       name: string;
       // ...
   }
   
   export const getXxxList = (params: any) => 
       axios.post('/xxx/search', params);
   
   export const createXxx = (data: XxxDto) => 
       axios.post('/xxx/create', data);
   
   export const updateXxx = (data: XxxDto) => 
       axios.post('/xxx/update', data);
   
   export const deleteXxx = (id: number) => 
       axios.delete(`/xxx/${id}`);
   ```

3. **创建页面组件** (`index.tsx`)
   - **列表页面**：使用 `DataManager` 组件
   - **表单**：使用 `AddEditModal` 或 `FilterForm`
   
   ```tsx
   import DataManager from '@/components/DataManager';
   import FilterForm from '@/components/FilterForm';
   import './style/index.less';
   
   const XxxPage: React.FC = () => {
       // 状态定义
       // 数据获取逻辑
       // 操作处理函数
       
       return (
           <div className="xxx-manager">
               <DataManager
                   data={data}
                   loading={loading}
                   pagination={pagination}
                   config={{
                       displayMode: 'table',
                       tableColumns: columns,
                       filterContent: <FilterForm ... />
                   }}
                   actions={{ onAdd, onEdit, onDelete }}
               />
           </div>
       );
   };
   ```

4. **页面样式规范** (`style/index.less`)
   
   > **重要**：使用 `DataManager` 组件的页面，样式以 DataManager 为主，页面容器只需设置 `height: 100%`。
   
   ```less
   .xxx-manager {
     height: 100%;
   }
   ```
   
   参考实现：[Todo 页面样式](file:///d:/idea_repo/quiz/frontend/src/pages/Todo/style/index.less)

5. **添加路由** (`router/index.tsx`)
   ```tsx
   import XxxPage from '@/pages/XxxModule';
   
   // 在 protectedPages 数组中添加
   {
       path: "xxx",
       element: <XxxPage />,
       requiredPath: "xxx"
   }
   ```

### 2. 使用 DataManager 组件

`DataManager` 是本项目的核心列表组件，支持表格、卡片等多种展示模式。

**基本配置**：
```tsx
<DataManager
    data={tableData}
    loading={loading}
    pagination={pagination}
    onPaginationChange={setPagination}
    config={{
        displayMode: 'table',      // 'table' | 'shortCard' | 'longCard'
        tableColumns: columns,
        filterContent: <FilterForm />,
        showTree: false,           // 是否显示左侧树
        treeContent: <GroupTree />
    }}
    actions={{
        onAdd: handleAdd,
        onEdit: handleEdit,
        onDelete: handleDelete
    }}
/>
```

### 3. 表单配置

使用 `FormFieldConfig` 定义表单字段：

```tsx
const formConfig: FormFieldConfig[] = [
    {
        field: 'name',
        label: '名称',
        type: 'input',      // 'input' | 'select' | 'textarea' | 'password' | 'number'
        required: true,
        rules: [{ required: true, message: '请输入名称' }],
        placeholder: '请输入名称'
    },
    {
        field: 'category',
        label: '分类',
        type: 'select',
        options: [{ label: '选项1', value: '1' }],
        allowClear: true
    }
];
```



### 5. 常见问题

- **类型错误 (TSxxxx)**：检查接口定义和类型匹配
- **Module not found**：检查 import 路径和文件是否存在
- **组件属性错误**：参考 Arco Design 文档确认组件 props

## UI 规范

- 使用 Arco Design 组件库
- 样式使用 Less，类名采用 kebab-case
- 颜色使用 CSS 变量 (如 `var(--color-primary-6)`)
- 响应式布局使用 Grid 或 Flex
- **用户信息展示**：所有的创建人、更新人展示都**必须**使用中文名。请优先使用后端返回的 `createUserName`/`updateUserName` 字段。涉及用户对象渲染时，**必须**使用 `@/utils/userUtils` 工具类。
- **时间展示**：所有的时间展示处理都**必须**使用 `@/utils/timeUtil` 工具类进行渲染（`import renderDate from '@/utils/timeUtil'`）。
- **交互规范**：如果页面支持查看详情，**必须**通过点击表格行或卡片整体触发详情查看，**禁止**在操作列中添加"查看详情"按钮。
- **样式约束**：
  - **主容器**：使用 Flexbox 纵向布局，背景色使用全局变量 `var(--background-color-base)`。
  - **内容区域**：采用卡片式风格（白色背景，8px 圆角，带有阴影 `box-shadow`），内边距 `16px`，外边距 `10px`。
  - **变量使用**：广泛使用 CSS 变量（如 `--color-primary`, `--color-text-1`）以确保与系统主题一致。
  - **图标使用**：使用 Arco Design 图标库（如 `IconClockCircle`, `IconCheckCircle` 等）作为状态指示。
  - **超链接规范**：
    - 必须使用 Arco Design 的 `<Link>` 组件。
    - 必须显式设置 `style={{ textDecoration: 'underline' }}` 以提供清晰的点击提示。
    - 悬停时应显示手型光标（Link 组件默认行为）。

### 搜索表单交互规范

在使用 `FilterForm` 或自定义搜索表单时，必须遵循以下交互规范以提升用户体验：

- **输入框 (Input)**：必须绑定 `onPressEnter` 事件，使用户按下回车键时立即触发查询。
- **选择框 (Select)**：必须绑定 `onChange` 事件，使用户选择选项后立即触发查询，无需额外点击搜索按钮。

### 表格操作按钮规范

位于 `src/components/DataManager/components/TableList.tsx` 中，针对每一行数据的操作按钮应遵循以下规范：

> **重要**：表格操作列**禁止**使用下拉菜单 (Dropdown Menu) 收纳按钮。所有操作按钮必须直接平铺展示，如果按钮过多，请考虑精简或使用图标按钮+Tooltip的形式。

- **查看按钮** (如果启用):
  - 组件: `<Button>`
  - 类型: `type="text"` (文本按钮，无背景边框)
  - 尺寸: `size="small"`
  - 图标: `<IconEye />`
  - Tooltip: "查看"

- **编辑按钮**:
  - 组件: `<Button>`
  - 类型: `type="text"`
  - 尺寸: `size="small"`
  - 图标: `<IconEdit />`
  - Tooltip: "编辑"

-   **删除按钮**:
  - 组件: `<Button>`
  - 类型: `type="text"`
  - 状态: `status="danger"` (危险状态，通常图标为红色)
  - 尺寸: `size="small"`
  - 图标: `<IconDelete />`
  - Tooltip: "删除"

- **操作确认规范**:
  - 对于删除、完成等不可逆或重要操作，**禁止**使用全屏 Modal 弹窗进行确认。
  - **必须**使用 `<Popconfirm>` 气泡确认框包裹操作按钮。
  - 确认文案应简洁明了，例如"确认删除该记录吗？"。

## 参考资料

- [Arco Design React](https://arco.design/react/docs/start)
- 参考现有页面实现：`src/pages/PasswordManager`、`src/pages/DataQuery`
