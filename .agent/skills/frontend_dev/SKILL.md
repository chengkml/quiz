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
   ```typescript
   import axios from '@/utils/request';
   
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

### 4. 构建检查

完成代码修改后，**必须**运行构建检查：

```bash
cd d:\idea_repo\quiz\frontend
npm run build
```

**构建检查流程**：
1. 执行 webpack 构建
2. 如果失败，分析 TypeScript 或 Webpack 错误
3. 定位错误文件和行号
4. 修复代码后重新构建
5. 重复直到构建成功 (Exit Code 0)

### 5. 常见问题

- **类型错误 (TSxxxx)**：检查接口定义和类型匹配
- **Module not found**：检查 import 路径和文件是否存在
- **组件属性错误**：参考 Arco Design 文档确认组件 props

## UI 规范

- 使用 Arco Design 组件库
- 样式使用 Less，类名采用 kebab-case
- 颜色使用 CSS 变量 (如 `var(--color-primary-6)`)
- 响应式布局使用 Grid 或 Flex

## 参考资料

- [Arco Design React](https://arco.design/react/docs/start)
- 参考现有页面实现：`src/pages/PasswordManager`、`src/pages/DataQuery`
