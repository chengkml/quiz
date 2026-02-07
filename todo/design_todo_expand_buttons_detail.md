# 需求设计: 待办管理页面按钮展开为图标按钮，增加详情查看功能，点击表格行触发详情查看

## 1. 需求背景

当前待办管理页面的操作列使用下拉菜单（Dropdown + Menu）展示所有操作项，用户需要点击三点图标才能看到可用操作。为提升用户体验和操作效率，需要进行以下优化：

**用户痛点**：
- 操作不够直观，需要额外点击才能看到可用操作
- 无法快速查看待办详情，必须编辑才能看到完整信息
- 点击表格行无响应，不符合用户直觉

**优化目标**：
- 将常用操作展开为图标按钮，直接可见
- 增加详情查看功能，只读方式展示待办完整信息
- 支持点击表格行触发详情查看，提升交互体验

## 2. 总体方案

*   **涉及模块**: Todo 待办管理前端页面
*   **核心逻辑**: 
    - 操作列从下拉菜单改为图标按钮（Space 布局）
    - 新增详情查看 Modal 对话框
    - 添加表格行点击事件，触发详情查看
*   **影响范围**: 仅前端展示逻辑，后端无需调整

## 3. 后端设计 (Spring Boot)
**无需变更**

后端已有的接口足够支持详情查看：
- 文件: [backend/src/main/java/com/ck/quiz/todo/service/impl/TodoServiceImpl.java](backend/src/main/java/com/ck/quiz/todo/service/impl/TodoServiceImpl.java)
- 查询接口已返回完整的 TodoDto 数据

## 4. 前端设计 (React + Arco Design)

### 4.1 页面位置
- [frontend/src/pages/Todo/index.tsx](frontend/src/pages/Todo/index.tsx)

### 4.2 参考实现

**图标按钮布局参考**：[PasswordManager](frontend/src/pages/PasswordManager/index.tsx#L284-L286)
```tsx
<Space>
  <Button type="text" size="small" icon={<IconEdit />} onClick={() => handleEdit(record)}>编辑</Button>
  <Button type="text" size="small" status="danger" icon={<IconDelete />} onClick={() => handleDelete(record)}>删除</Button>
</Space>
```

**详情对话框参考**：[Question](frontend/src/pages/Question/index.tsx#L1625-L1631)
```tsx
<Modal
  title="题目详情"
  visible={detailModalVisible}
  onCancel={() => setDetailModalVisible(false)}
  footer={null}
>
  {/* 详情内容 */}
</Modal>
```

**表格行点击参考**：[SysLog](frontend/src/pages/SysLog/index.tsx#L232-L236)
```tsx
tableProps: {
  onRow: (record) => ({
    onClick: () => handleView(record),
    style: { cursor: 'pointer' }
  })
}
```

### 4.3 修改点详解

#### 4.3.1 新增状态管理

```tsx
// 在现有状态后添加
const [detailModalVisible, setDetailModalVisible] = useState(false);
const [detailRecord, setDetailRecord] = useState<any | null>(null);
```

#### 4.3.2 新增详情查看处理函数

```tsx
// 查看详情
const handleDetail = (record: any) => {
  setDetailRecord(record);
  setDetailModalVisible(true);
};
```

#### 4.3.3 修改操作列配置

**当前实现**（[index.tsx#L380-L410](frontend/src/pages/Todo/index.tsx#L380-L410)）：
使用 Dropdown + Menu 的下拉菜单

**修改为**：
```tsx
{
  title: "操作",
  width: 200,  // 调整宽度以容纳多个按钮
  align: "center",
  fixed: "right",
  render: (_: any, record: any) => (
    <Space size="small">
      <Button
        type="text"
        size="small"
        icon={<IconEye />}
        onClick={(e) => {
          e.stopPropagation();
          handleDetail(record);
        }}
      >
        详情
      </Button>
      <Button
        type="text"
        size="small"
        icon={<IconMindMapping />}
        onClick={(e) => {
          e.stopPropagation();
          handleAnalyze(record);
        }}
      >
        分析
      </Button>
      <Button
        type="text"
        size="small"
        icon={<IconEdit />}
        onClick={(e) => {
          e.stopPropagation();
          handleEdit(record);
        }}
      >
        编辑
      </Button>
      {record.status !== "COMPLETED" && (
        <Button
          type="text"
          size="small"
          icon={<IconCheck />}
          onClick={(e) => {
            e.stopPropagation();
            handleComplete(record);
          }}
        >
          完成
        </Button>
      )}
      <Button
        type="text"
        size="small"
        status="danger"
        icon={<IconDelete />}
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(record);
        }}
      >
        删除
      </Button>
    </Space>
  ),
}
```

**关键点**：
- 使用 `Space` 组件布局多个按钮
- 每个按钮都是 `type="text"` 文本按钮，减少视觉噪音
- `size="small"` 保持紧凑布局
- `e.stopPropagation()` 防止触发行点击事件
- 删除按钮使用 `status="danger"` 突出危险操作
- 保留"已完成"状态隐藏完成按钮的逻辑

#### 4.3.4 添加表格行点击事件

在 DataManager 的 props 中添加 `tableProps`：

```tsx
<DataManager
  // ... 其他 props
  tableProps={{
    onRow: (record: any) => ({
      onClick: () => handleDetail(record),
      style: { cursor: 'pointer' }
    })
  }}
/>
```

**关键点**：
- `onClick` 单击触发详情查看
- `cursor: 'pointer'` 显示手型光标，提示用户可点击
- 点击操作按钮时通过 `stopPropagation` 阻止触发行点击

#### 4.3.5 新增详情查看 Modal

在组件末尾添加详情对话框（在其他 Modal 之后）：

```tsx
{/* 详情查看对话框 */}
{detailModalVisible && detailRecord && (
  <Modal
    title="待办详情"
    visible={detailModalVisible}
    onCancel={() => setDetailModalVisible(false)}
    footer={null}
    style={{ maxWidth: 600 }}
  >
    <div style={{ paddingTop: 16 }}>
      {/* 状态和优先级标签 */}
      <div style={{ marginBottom: 16 }}>
        <Space size="medium">
          <Tag
            color={
              detailRecord.status === "PENDING"
                ? "gray"
                : detailRecord.status === "IN_PROGRESS"
                ? "blue"
                : "green"
            }
            bordered
          >
            {detailRecord.status === "PENDING"
              ? "待处理"
              : detailRecord.status === "IN_PROGRESS"
              ? "处理中"
              : "已完成"}
          </Tag>
          <Tag
            color={
              detailRecord.priority === "LOW"
                ? "green"
                : detailRecord.priority === "MEDIUM"
                ? "orange"
                : "red"
            }
            bordered
          >
            优先级：
            {detailRecord.priority === "LOW"
              ? "低"
              : detailRecord.priority === "MEDIUM"
              ? "中"
              : "高"}
          </Tag>
        </Space>
      </div>

      {/* 标题 */}
      <div style={{ marginBottom: 16 }}>
        <strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>
          标题:
        </strong>
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "var(--color-info-light-1)",
            borderRadius: 6,
            color: "var(--color-text-3)",
            lineHeight: 1.6,
          }}
        >
          {detailRecord.title}
        </div>
      </div>

      {/* 描述 */}
      {detailRecord.descr && (
        <div style={{ marginBottom: 16 }}>
          <strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>
            描述:
          </strong>
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "var(--color-fill-2)",
              borderRadius: 6,
              color: "var(--color-text-3)",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}
          >
            {detailRecord.descr}
          </div>
        </div>
      )}

      {/* 截止时间 */}
      {detailRecord.dueDate && (
        <div style={{ marginBottom: 16 }}>
          <strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>
            截止时间:
          </strong>
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "var(--color-fill-2)",
              borderRadius: 6,
              color: "var(--color-text-3)",
            }}
          >
            {renderDate(detailRecord.dueDate)}
          </div>
        </div>
      )}

      {/* 创建信息 */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: "1px solid var(--color-border-2)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: "var(--color-text-2)",
            fontSize: 14,
          }}
        >
          <div>
            <span style={{ fontWeight: 500 }}>创建人：</span>
            <UserAvatar
              name={detailRecord.createUserName || detailRecord.createUser || ""}
              showName
            />
          </div>
          <div>
            <span style={{ fontWeight: 500 }}>创建时间：</span>
            {renderDate(detailRecord.createDate)}
          </div>
        </div>
        {detailRecord.updateDate && (
          <div
            style={{
              marginTop: 8,
              color: "var(--color-text-2)",
              fontSize: 14,
            }}
          >
            <span style={{ fontWeight: 500 }}>更新时间：</span>
            {renderDate(detailRecord.updateDate)}
          </div>
        )}
      </div>
    </div>
  </Modal>
)}
```

#### 4.3.6 新增图标导入

在文件顶部的 Icon 导入中添加 `IconEye`：

```tsx
import {
  IconCheck,
  IconDelete,
  IconEdit,
  IconEye,  // 新增
  IconList,
  IconMindMapping,
} from "@arco-design/web-react/icon";
```

#### 4.3.7 可选：移除旧代码

删除 `handleMenuClick` 函数（如果不再需要）：
```tsx
// 可以删除这个函数
const handleMenuClick = (key: string, e: React.MouseEvent, record: any) => {
  // ...
};
```

### 4.4 样式调整（如有需要）

在 [style/index.less](frontend/src/pages/Todo/style/index.less) 中可能需要添加：

```less
.todo-manager {
  // 确保表格行hover时有视觉反馈
  :global {
    .arco-table-tr {
      transition: background-color 0.2s;
      
      &:hover {
        background-color: var(--color-fill-2);
      }
    }
    
    // 操作按钮样式
    .arco-btn-text {
      &:hover {
        background-color: var(--color-fill-3);
      }
    }
  }
}
```

## 5. 实施步骤 (Action Plan)

### Step 1: 修改前端代码

按照 4.3 的修改点，依次修改 [frontend/src/pages/Todo/index.tsx](frontend/src/pages/Todo/index.tsx)：

1. 添加 IconEye 导入
2. 添加 detailModalVisible 和 detailRecord 状态
3. 添加 handleDetail 函数
4. 修改操作列配置（从下拉菜单改为图标按钮）
5. 添加 tableProps 支持行点击
6. 添加详情查看 Modal

### Step 2: 前端编译检查

使用 `.agent/skills/frontend_build_check/SKILL.md` 检查编译状态：
```bash
cd d:\idea_repo\quiz\frontend
npm run build
```

### Step 3: 功能测试

1. **操作列测试**：
   - 验证所有按钮正常显示
   - 点击每个按钮，确认功能正常
   - 验证"已完成"状态不显示完成按钮
   
2. **详情查看测试**：
   - 点击详情按钮，验证弹窗显示完整信息
   - 点击表格行，验证触发详情查看
   - 验证详情内容格式正确（标题、描述、时间等）
   
3. **交互测试**：
   - 点击操作按钮时，验证不触发行点击
   - 验证表格行hover显示手型光标
   - 验证详情弹窗可正常关闭

## 6. 验收标准

- [x] 操作列改为图标按钮布局，所有操作直接可见
- [x] 新增详情查看功能，可查看待办完整信息
- [x] 点击表格行触发详情查看
- [x] 表格行hover显示手型光标
- [x] 点击操作按钮不触发行点击事件
- [x] 已完成状态不显示完成按钮
- [x] 详情弹窗展示完整信息（状态、优先级、标题、描述、时间等）
- [x] 前端编译无错误

## 7. UI/UX 改进点

### 7.1 操作可见性提升
- ❌ **改进前**: 需要点击三点图标才能看到操作
- ✅ **改进后**: 所有操作直接可见，降低操作成本

### 7.2 信息获取效率
- ❌ **改进前**: 需要编辑才能查看完整信息
- ✅ **改进后**: 一键查看详情，只读模式更安全

### 7.3 交互直觉性
- ❌ **改进前**: 点击行无响应
- ✅ **改进后**: 点击行查看详情，符合用户直觉

### 7.4 视觉层次
- **状态标签**: 使用颜色区分不同状态（待处理/处理中/已完成）
- **优先级标签**: 使用颜色强调重要程度（低/中/高）
- **按钮状态**: 删除按钮使用 danger 状态，突出危险操作

## 8. 技术要点

### 8.1 事件冒泡控制

```tsx
onClick={(e) => {
  e.stopPropagation();  // 阻止冒泡到行点击
  handleEdit(record);
}}
```

**重要性**: 防止点击按钮时触发行点击事件

### 8.2 条件渲染

```tsx
{record.status !== "COMPLETED" && (
  <Button>完成</Button>
)}
```

**优势**: 根据状态动态显示/隐藏按钮

### 8.3 样式变量使用

```tsx
backgroundColor: "var(--color-info-light-1)"
color: "var(--color-text-3)"
```

**优势**: 
- 自动适配 Arco Design 主题
- 支持深色模式切换
- 保持视觉一致性

### 8.4 表格行交互

```tsx
onRow: (record) => ({
  onClick: () => handleDetail(record),
  style: { cursor: 'pointer' }
})
```

**关键点**:
- `onClick` 单击即触发，响应速度快
- `cursor: 'pointer'` 提供视觉反馈
- 可以考虑改为 `onDoubleClick` 避免误触（可选）

## 9. 扩展建议（可选）

### 9.1 响应式布局

当操作按钮过多时，可以考虑：
- 窄屏时部分按钮收进下拉菜单
- 使用 `<Tooltip>` 显示按钮说明（去掉文字，只显示图标）

```tsx
<Tooltip content="查看详情">
  <Button type="text" size="small" icon={<IconEye />} onClick={...} />
</Tooltip>
```

### 9.2 键盘快捷键

支持方向键选择行，Enter 键查看详情：
```tsx
onKeyDown: (e) => {
  if (e.key === 'Enter') {
    handleDetail(record);
  }
}
```

### 9.3 快捷操作

在详情弹窗底部添加快捷操作按钮：
```tsx
footer={
  <Space>
    <Button onClick={() => { setDetailModalVisible(false); handleEdit(detailRecord); }}>
      编辑
    </Button>
    <Button onClick={() => setDetailModalVisible(false)}>
      关闭
    </Button>
  </Space>
}
```

## 10. 注意事项

1. **操作列宽度**: 图标按钮展开后需要更多空间，建议设置 `width: 200` 或更大
2. **文字长度**: 如果按钮文字过长，考虑使用 Tooltip + 纯图标模式
3. **移动端适配**: 小屏幕下可能需要响应式调整，部分按钮改为下拉菜单
4. **性能考虑**: 详情弹窗使用条件渲染（`&&`），只在打开时渲染，避免性能问题
5. **一致性**: 如果其他页面（MindMap、Question 等）也需要类似优化，建议统一风格

## 11. 对比其他页面

| 页面 | 操作列样式 | 详情查看 | 行点击 |
|------|----------|---------|--------|
| **Todo（改进前）** | ❌ 下拉菜单 | ❌ 无 | ❌ 无 |
| **Todo（改进后）** | ✅ 图标按钮 | ✅ 有 | ✅ 单击触发 |
| MindMap | ❌ 下拉菜单 | ✅ 有（查看） | ⚠️ 双击触发 |
| MermaidMgr | ❌ 下拉菜单 | ✅ 有 | ⚠️ 双击触发 |
| PasswordManager | ✅ 图标按钮 | ❌ 无 | ❌ 无 |
| Question | ❌ 下拉菜单 | ✅ 有 | ❌ 无 |

**结论**: 改进后的 Todo 页面将成为最佳实践示例，综合了多个页面的优点。
