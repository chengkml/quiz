# DataManager 快速入门指南

## 项目结构

```
DataManager/
├── index.tsx                    # 主组件（DataManager）
├── AddEditModal.tsx             # 新增/编辑模态框
├── DetailModal.tsx              # 详情查看模态框
├── ShortCardList.tsx            # 短卡片列表视图
├── LongCardList.tsx             # 长卡片列表视图
├── TableList.tsx                # 表格列表视图
├── types.ts                     # TypeScript 类型定义
├── utils.ts                     # 工具函数集合
├── index.less                   # 主样式文件
├── card.less                    # 卡片样式
├── modal.less                   # 模态框样式
├── export.ts                    # 导出文件（用于包管理）
├── README.md                    # 详细文档
├── EXAMPLE.tsx                  # 最小示例
└── QUICK_START.md              # 本文件
```

## 核心特性

### 📱 多视图模式
- **短卡片（ShortCard）** - 紧凑四列布局，适合快速浏览
- **长卡片（LongCard）** - 单列布局，包含图片和详细信息
- **表格（Table）** - 传统表格视图，适合数据对比

### ✨ 完整功能
- ✅ 新增操作（支持多步骤选项卡）
- ✅ 编辑操作（自动加载记录数据）
- ✅ 删除操作（带确认对话框）
- ✅ 详情查看（支持多个分类标签页）
- ✅ 搜索过滤（灵活的表单配置）
- ✅ 分页管理（完整的分页控制）

### 🎨 设计特点
- 响应式布局，适配各种屏幕
- Arco Design UI 框架集成
- 平滑的过渡动画
- 统一的交互体验

## 快速开始

### 1. 导入组件

```typescript
import DataManager from '@/components/DataManager';
import AddEditModal from '@/components/DataManager/AddEditModal';
import DetailModal from '@/components/DataManager/DetailModal';
```

### 2. 基础使用

```typescript
import React, { useState } from 'react';
import DataManager from '@/components/DataManager';

function MyDataPage() {
  const [data, setData] = useState([
    { id: 1, name: '项目1', description: '这是第一个项目' },
    { id: 2, name: '项目2', description: '这是第二个项目' },
  ]);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: data.length,
  });

  return (
    <DataManager
      data={data}
      pagination={pagination}
      onPaginationChange={setPagination}
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
}
```

### 3. 添加操作

```typescript
<DataManager
  actions={{
    onAdd: () => {
      // 显示新增模态框
    },
    onEdit: (record) => {
      // 处理编辑
    },
    onDelete: (record) => {
      // 处理删除
    },
    onView: (record) => {
      // 显示详情
    },
  }}
/>
```

### 4. 完整示例

```typescript
import React, { useState } from 'react';
import DataManager from '@/components/DataManager';
import AddEditModal from '@/components/DataManager/AddEditModal';
import { Message, Modal } from '@arco-design/web-react';

interface Item {
  id: number;
  name: string;
  description: string;
}

function CompleteExample() {
  const [data, setData] = useState<Item[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<Item | null>(null);

  // 处理新增
  const handleAdd = () => {
    setIsEdit(false);
    setCurrentRecord(null);
    setModalVisible(true);
  };

  // 处理编辑
  const handleEdit = (record: Item) => {
    setIsEdit(true);
    setCurrentRecord(record);
    setModalVisible(true);
  };

  // 处理删除
  const handleDelete = (record: Item) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定删除"${record.name}"吗？`,
      onOk: async () => {
        // 调用删除 API
        setData((prev) => prev.filter((item) => item.id !== record.id));
        Message.success('删除成功');
      },
    });
  };

  // 处理提交
  const handleSubmit = async (values: any) => {
    try {
      if (isEdit && currentRecord) {
        // 编辑
        setData((prev) =>
          prev.map((item) =>
            item.id === currentRecord.id ? { ...item, ...values } : item
          )
        );
        Message.success('编辑成功');
      } else {
        // 新增
        setData((prev) => [
          {
            id: Math.max(...prev.map((item) => item.id), 0) + 1,
            ...values,
          },
          ...prev,
        ]);
        Message.success('新增成功');
      }
      setModalVisible(false);
    } catch (error) {
      Message.error('操作失败');
    }
  };

  return (
    <>
      <DataManager
        data={data}
        pagination={pagination}
        onPaginationChange={setPagination}
        actions={{
          onAdd: handleAdd,
          onEdit: handleEdit,
          onDelete: handleDelete,
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

      <AddEditModal
        visible={modalVisible}
        isEdit={isEdit}
        record={currentRecord || undefined}
        title={isEdit ? '编辑' : '新增'}
        formConfig={[
          {
            field: 'name',
            label: '名称',
            type: 'input',
            required: true,
          },
          {
            field: 'description',
            label: '描述',
            type: 'textarea',
          },
        ]}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      />
    </>
  );
}

export default CompleteExample;
```

## 常见问题

### Q1: 如何自定义卡片样式？

**答：** 使用 `config` 中的 `shortCardConfig` 或 `longCardConfig` 来配置卡片内容，或使用 `renderShortCard`/`renderLongCard` 完全自定义渲染。

```typescript
config={{
  renderShortCard: (item, index, actions) => (
    <Card style={{ backgroundColor: '#f0f0f0' }}>
      <h3>{item.name}</h3>
      <Button onClick={() => actions.onEdit(item)}>编辑</Button>
    </Card>
  ),
}}
```

### Q2: 如何实现搜索功能？

**答：** 在 DataManager 外部管理搜索状态，过滤数据后传入 `data` 属性。

```typescript
const [searchTerm, setSearchTerm] = useState('');
const filteredData = data.filter((item) =>
  item.name.includes(searchTerm)
);

<DataManager data={filteredData} {...props} />
```

### Q3: 如何实现选项卡编辑？

**答：** 使用 AddEditModal 的 `tabs` 属性。

```typescript
<AddEditModal
  tabs={[
    {
      key: 'basic',
      title: '基本信息',
      content: <Form>{/* 基本信息表单 */}</Form>,
    },
    {
      key: 'detail',
      title: '详细信息',
      content: <Form>{/* 详细信息表单 */}</Form>,
    },
  ]}
/>
```

### Q4: 如何改变卡片列数？

**答：** 使用 `cardColumns` 属性（默认为 4），在响应式设计下会自动调整。

```typescript
<DataManager
  cardColumns={3}  // 3 列布局
  cardGutter={16}  // 16px 间距
  cardSize="medium" // 中等大小
/>
```

### Q5: 如何处理 API 加载错误？

**答：** 在 try-catch 中捕获错误并使用 Message 或 Modal 显示。

```typescript
const handleSubmit = async (values: any) => {
  try {
    await api.createItem(values);
    Message.success('成功');
  } catch (error) {
    Message.error('失败: ' + error.message);
  }
};
```

## 最佳实践

### 1. 数据管理

```typescript
// ✅ 好的做法
const [data, setData] = useState<Item[]>([]);

// ❌ 避免
const data = [];  // 重新渲染时会重新创建
```

### 2. 事件处理

```typescript
// ✅ 好的做法
const handleAdd = useCallback(() => {
  setModalVisible(true);
}, []);

// ❌ 避免
onClick={() => setModalVisible(true)} // 每次渲染都创建新函数
```

### 3. 分页处理

```typescript
// ✅ 正确的分页逻辑
const paginatedData = data.slice(
  (pagination.current - 1) * pagination.pageSize,
  pagination.current * pagination.pageSize
);

<DataManager data={paginatedData} pagination={pagination} />
```

### 4. 删除确认

```typescript
// ✅ 使用 Modal.confirm
const handleDelete = (record) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定删除"${record.name}"吗？`,
    onOk: () => {
      // 执行删除
    },
  });
};
```

## 性能优化

### 1. 虚拟滚动（大数据量）

对于大量数据，考虑使用虚拟滚动库：

```typescript
import VirtualList from '@arco-design/web-react/VirtualList';

// 包装 DataManager 使用虚拟列表
```

### 2. 记忆化组件

```typescript
const MemoizedDataManager = React.memo(DataManager);
```

### 3. 防抖搜索

```typescript
import { debounce } from '@/components/DataManager/utils';

const handleSearch = debounce((value) => {
  // 搜索逻辑
}, 300);
```

## 样式定制

### 覆盖样式

```less
// 在你的页面样式中
.data-manager {
  .short-card {
    padding: 20px;  // 自定义卡片内边距
  }

  .short-card-title {
    font-size: 16px;  // 自定义标题大小
  }
}
```

### Arco Design 主题

```typescript
import { ConfigProvider } from '@arco-design/web-react';

<ConfigProvider theme={{
  colorPrimary: '#1890ff',
  colorSuccess: '#52c41a',
}}>
  <DataManager {...props} />
</ConfigProvider>
```

## 下一步

- 📖 查看 [详细 API 文档](./README.md)
- 💡 查看 [完整示例](./EXAMPLE.tsx)
- 🎨 尝试自定义渲染和样式
- 🚀 集成到你的项目中

---

需要帮助？检查示例代码或阅读详细文档！
