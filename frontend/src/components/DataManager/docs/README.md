# DataManager 通用数据管理组件库

一个功能强大、高度可复用的 React 数据管理组件库，支持卡片、表格等多种展示形式，完整的新增、编辑、删除、查看功能。

## 功能特性

✨ **多种展示模式**
- 短卡片（Short Card）：紧凑展示
- 长卡片（Long Card）：详细展示
- 表格（Table）：传统表格视图
- 支持一键切换

📋 **完整的 CRUD 操作**
- 新增（支持选项卡多步编辑）
- 编辑（支持自定义表单）
- 删除（带确认对话框）
- 查看（详情模态框）

📄 **灵活的表单和详情**
- 多种字段类型支持（文本、数字、日期、选择、复选、单选等）
- 自定义表单验证规则
- 详情字段自定义渲染
- 支持选项卡展示多个步骤或分类信息

🔍 **搜索和过滤**
- 集成过滤表单
- 支持自定义过滤逻辑
- 搜索、重置快捷操作

📑 **分页管理**
- 灵活的分页配置
- 支持自定义页码、页大小
- 分页状态实时同步

🎨 **响应式设计**
- 完全响应式布局
- 适配各种屏幕尺寸
- 卡片列数自适应

## 安装

```bash
# 项目中已包含，直接导入使用
import { DataManager, AddEditModal, DetailModal } from '@/components/DataManager';
```

## 快速开始

### 基础使用

```typescript
import React, { useState } from 'react';
import { DataManager } from '@/components/DataManager';

const MyPage = () => {
  const [data, setData] = useState([...]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 100,
  });

  return (
    <DataManager
      data={data}
      pagination={pagination}
      onPaginationChange={setPagination}
      actions={{
        onAdd: () => { /* ... */ },
        onEdit: (record) => { /* ... */ },
        onDelete: (record) => { /* ... */ },
        onView: (record) => { /* ... */ },
      }}
      config={{
        shortCardConfig: {
          title: (item) => item.name,
          description: (item) => item.description,
        },
        tableColumns: [
          { title: '名称', dataIndex: 'name', width: 150 },
          { title: '描述', dataIndex: 'description', width: 300 },
        ],
      }}
    />
  );
};

export default MyPage;
```

## API 文档

### DataManager Props

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| data | `T[]` | `[]` | 列表数据 |
| loading | `boolean` | `false` | 加载状态 |
| pagination | `PaginationConfig` | - | 分页配置 |
| onPaginationChange | `(pagination) => void` | - | 分页变化回调 |
| actions | `Actions` | - | 行为操作配置 |
| config | `DataManagerConfig` | - | 组件配置 |
| showActions | `boolean` | `true` | 是否显示操作按钮 |
| actionsPosition | `'top' \| 'bottom' \| 'both'` | `'top'` | 操作按钮位置 |
| tableScrollHeight | `number` | `400` | 表格滚动高度 |
| cardColumns | `number` | `4` | 卡片列数 |
| cardGutter | `number` | `16` | 卡片间距 |
| cardSize | `'small' \| 'medium' \| 'large'` | `'small'` | 卡片尺寸 |

### DataManagerConfig

```typescript
interface DataManagerConfig {
  // 显示模式：'shortCard' | 'longCard' | 'table'
  displayMode?: DisplayMode;
  
  // 是否显示模式切换按钮
  showModeToggle?: boolean;
  
  // 短卡片配置
  shortCardConfig?: CardConfig;
  
  // 长卡片配置
  longCardConfig?: CardConfig;
  
  // 表格列配置
  tableColumns?: any[];
  
  // 自定义卡片渲染
  renderShortCard?: (item, index, actions) => ReactNode;
  renderLongCard?: (item, index, actions) => ReactNode;
  
  // 过滤表单
  showFilterForm?: boolean;
  filterContent?: ReactNode;
  onFilter?: (values) => void;
}
```

### CardConfig

```typescript
interface CardConfig {
  // 标题（支持函数）
  title?: string | ((item) => ReactNode);
  
  // 副标题
  subtitle?: string | ((item) => ReactNode);
  
  // 描述
  description?: string | ((item) => ReactNode);
  
  // 图片
  image?: string | ((item) => string);
  imagePosition?: 'top' | 'left';
  imageHeight?: number;
  imageWidth?: number;
  
  // 显示的字段
  showFields?: string[];
  hideFields?: string[];
  fieldLabel?: { [key: string]: string };
}
```

### FormFieldConfig

表单字段配置，用于新增/编辑模态框

```typescript
interface FormFieldConfig {
  field: string;                    // 字段名
  label: string;                    // 标签
  type?: FormFieldType;             // 字段类型
  required?: boolean;               // 是否必填
  placeholder?: string;             // 占位符
  rules?: Rule[];                   // 验证规则
  options?: { label; value }[];     // 选项（select/radio）
  initialValue?: any;               // 初始值
  disabled?: boolean;               // 是否禁用
  visible?: boolean | (record) => boolean; // 是否显示
  render?: (value, allValues) => ReactNode; // 自定义渲染
}
```

### DetailFieldConfig

详情字段配置，用于详情模态框

```typescript
interface DetailFieldConfig {
  key: string;                      // 唯一标识
  label: string;                    // 标签
  dataIndex: string;                // 数据索引
  type?: 'text' | 'tag' | 'avatar' | 'image' | 'link';
  render?: (value, record) => ReactNode; // 自定义渲染
}
```

### AddEditModal Props

```typescript
interface AddEditModalProps {
  visible: boolean;                 // 是否显示
  isEdit?: boolean;                 // 是否编辑模式
  record?: any;                     // 当前记录
  loading?: boolean;                // 加载状态
  title?: string;                   // 标题
  formConfig?: FormFieldConfig[];   // 表单配置
  tabs?: TabConfig[];               // 选项卡配置
  onOk?: (values) => Promise<void>; // 提交回调
  onCancel?: () => void;            // 取消回调
}
```

### DetailModal Props

```typescript
interface DetailModalProps {
  visible: boolean;                 // 是否显示
  record?: any;                     // 当前记录
  loading?: boolean;                // 加载状态
  title?: string;                   // 标题
  detailFields?: DetailFieldConfig[]; // 字段配置
  tabs?: TabConfig[];               // 选项卡配置
  onCancel?: () => void;            // 关闭回调
}
```

## 高级用法

### 自定义卡片渲染

```typescript
<DataManager
  config={{
    renderShortCard: (item, index, actions) => (
      <Card>
        <div>{item.name}</div>
        <Button onClick={() => actions.onEdit(item)}>编辑</Button>
      </Card>
    ),
  }}
/>
```

### 使用选项卡编辑

```typescript
<AddEditModal
  tabs={[
    {
      key: 'basic',
      title: '基本信息',
      content: <Form>...</Form>,
    },
    {
      key: 'detail',
      title: '详细信息',
      content: <Form>...</Form>,
    },
  ]}
/>
```

### 自定义表单验证

```typescript
const formConfig: FormFieldConfig[] = [
  {
    field: 'email',
    label: '邮箱',
    type: 'input',
    rules: [
      { required: true, message: '请输入邮箱' },
      { type: 'email', message: '请输入有效的邮箱' },
    ],
  },
];
```

### 动态显示字段

```typescript
const formConfig: FormFieldConfig[] = [
  {
    field: 'type',
    label: '类型',
    type: 'select',
    options: [
      { label: '个人', value: 'personal' },
      { label: '企业', value: 'company' },
    ],
  },
  {
    field: 'companyName',
    label: '公司名称',
    type: 'input',
    visible: (record) => record.type === 'company',
  },
];
```

## 工具函数

DataManager 提供了一些实用的工具函数：

```typescript
import {
  formatDate,           // 格式化日期
  formatRelativeTime,   // 相对时间格式化
  paginateData,         // 分页数据
  generateSelectOptions, // 生成选择框选项
  debounce,             // 防抖
  throttle,             // 节流
} from '@/components/DataManager';

// 使用示例
const formatted = formatDate(new Date(), 'YYYY-MM-DD');
const relative = formatRelativeTime(new Date());
const paged = paginateData(data, 1, 10);
const options = generateSelectOptions(items, 'name', 'id');
```

## 样式定制

### CSS 变量（如果支持）

可以通过覆盖样式进行定制：

```less
.data-manager {
  // 自定义样式
  .short-card {
    padding: 16px;
  }
}
```

### Arco Design 主题

DataManager 基于 Arco Design，支持其主题系统：

```typescript
import { ConfigProvider } from '@arco-design/web-react';

<ConfigProvider theme={{ colorPrimary: '#1890ff' }}>
  <DataManager {...props} />
</ConfigProvider>
```

## 完整示例

参考 `/pages/DataManagerExample/index.tsx` 获取完整的使用示例。

## 最佳实践

1. **数据管理**：使用 React Hooks 管理数据状态
2. **API 调用**：在 useEffect 中获取数据
3. **加载状态**：在 API 调用时设置 loading 状态
4. **错误处理**：使用 Message 组件显示错误信息
5. **确认对话框**：删除操作前显示确认
6. **表单验证**：使用 formConfig 中的 rules 进行验证
7. **响应式设计**：根据屏幕宽度调整 cardColumns

## 浏览器兼容性

- Chrome（最新）
- Firefox（最新）
- Safari（最新）
- Edge（最新）

## 许可证

MIT

## 更新日志

### v1.0.0
- ✨ 初始发布
- 🎉 支持短卡片、长卡片、表格三种展示模式
- 📋 完整的 CRUD 操作
- 📄 灵活的表单和详情系统
- 🔍 搜索和过滤功能
- 📑 分页管理
- 🎨 响应式设计
