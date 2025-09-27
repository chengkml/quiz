# 数据合成器管理模块

## 概述

数据合成器管理模块是一个完整的前端页面，用于管理AI数据合成器的全生命周期，包括创建、查询、编辑、删除和查看详情等功能。

## 功能特性

### 1. 查询功能
- 支持按合成器名称、模型类型、状态、创建人进行筛选
- 分页展示，支持排序
- 实时状态显示

### 2. 创建合成器
- 支持四种模型类型：CTGAN、TVAE、CopulaGAN、GaussianCopula
- 灵活的训练参数配置
- 采样方式选择（按比例/按数量）
- 多卡训练支持

### 3. 编辑功能
- 仅允许编辑合成器名称和描述
- 状态控制：训练中和失败状态不可编辑

### 4. 查看详情
- 完整的合成器信息展示
- 训练参数折叠面板
- 状态标签显示

### 5. 删除功能
- 确认对话框防止误删
- 权限控制

## 技术架构

### 组件结构
```
synthesizers/
├── index.tsx           # 主页面组件
├── README.md          # 说明文档
└── services/
    └── synthesizerService.ts  # API服务层
```

### 主要依赖
- **UI框架**: Arco Design React
- **路由**: React Router DOM
- **状态管理**: React Hooks (useState, useEffect)
- **HTTP客户端**: Fetch API

## API接口

### 基础URL
```
API_BASE_URL = '/api'
```

### 接口列表

| 功能 | 接口 | 方法 | 说明 |
|------|------|------|------|
| 查询列表 | `/api/synthesizers` | GET | 分页查询合成器列表 |
| 获取详情 | `/api/synthesizers/{id}` | GET | 获取单个合成器详情 |
| 创建合成器 | `/api/synthesizers` | POST | 创建新的合成器 |
| 更新合成器 | `/api/synthesizers/{id}/update` | POST | 更新合成器信息 |
| 删除合成器 | `/api/synthesizers/{id}/delete` | POST | 删除合成器 |
| 获取可用列表 | `/api/synthesizers/available` | GET | 获取可用合成器列表 |

## 数据模型

### SynthesizerDto
```typescript
interface SynthesizerDto {
  synthesizerId: string;           // 合成器ID
  synthesizerName: string;         // 合成器名称
  modelType: ModelType;            // 模型类型
  modelTypeDescription: string;    // 模型类型描述
  trainingDatasetId: string;       // 训练数据集ID
  trainingParams: SynthesizerTrainingParamsDto; // 训练参数
  modelArtifactPath: string;       // 模型文件路径
  modelConfigPath: string;         // 模型配置路径
  state: SynthesizerState;         // 状态
  stateDescription: string;        // 状态描述
  description: string;             // 描述
  createUser: string;              // 创建人
  createTime: string;              // 创建时间
  updateUser: string;              // 更新人
  updateTime: string;              // 更新时间
}
```

### 训练参数
```typescript
interface SynthesizerTrainingParamsDto {
  sampling_method: 1 | 2;          // 采样方式：1=按比例，2=按数量
  sample_ratio?: number;           // 采样比例 (0,1]
  sample_size?: number;            // 采样数量 >=1
  sample_threshold: number;        // 抽样阈值 >=1
  epochs: number;                  // 训练轮数 >=1
  batch_size: number;              // 批次大小 >=1
  use_multi_gpu: boolean;          // 是否使用多卡训练
  backend: string;                 // 通信后端：nccl/gloo
  gpu_ids?: number[];              // GPU ID列表
}
```

## 状态管理

### 合成器状态
- **TRAINING**: 训练中（蓝色标签）
- **READY**: 就绪（绿色标签）
- **FAILED**: 失败（红色标签）
- **DISABLED**: 已禁用（灰色标签）

### 操作权限
- 查看：所有授权用户
- 编辑：创建人或管理员，且状态不为"训练中"或"失败"
- 删除：创建人或管理员

## 表单验证

### 创建表单
- 合成器名称：必填，最大64字符
- 模型类型：必填，四选一
- 训练数据集ID：必填，最大32字符
- 描述：可选，最大1024字符
- 采样比例：当采样方式为"按比例"时必填，范围(0,1]
- 采样数量：当采样方式为"按数量"时必填，>=1
- 通信后端：必填

### 编辑表单
- 合成器名称：可选，最大64字符
- 描述：可选，最大1024字符

## 使用说明

### 1. 页面访问
```
# 通过Layout框架访问
/data_synth/frame/synthesizers

# 直接访问
/synthesizers
```

### 2. 创建合成器
1. 点击"创建合成器"按钮
2. 填写基本信息（名称、类型、数据集ID）
3. 配置训练参数
4. 选择采样方式和参数
5. 配置GPU相关设置
6. 提交创建

### 3. 查询筛选
1. 在查询表单中输入筛选条件
2. 点击"查询"按钮
3. 使用"重置"按钮清空条件

### 4. 编辑合成器
1. 在表格中点击"编辑"按钮
2. 修改允许编辑的字段
3. 保存更改

### 5. 查看详情
1. 在表格中点击"查看"按钮
2. 在模态框中查看完整信息
3. 展开"训练参数"面板查看详细配置

## 错误处理

### 网络错误
- 自动捕获HTTP错误
- 显示用户友好的错误消息
- 控制台输出详细错误信息

### 表单验证
- 实时验证用户输入
- 显示具体的验证错误信息
- 阻止无效数据提交

### 状态控制
- 根据合成器状态控制操作按钮可用性
- 防止在不合适的状态下进行编辑操作

## 性能优化

### 1. 分页加载
- 默认每页20条记录
- 支持页面大小调整
- 服务端分页减少数据传输

### 2. 条件查询
- 仅传输必要的查询参数
- 避免空值参数传输

### 3. 状态管理
- 使用React Hooks进行状态管理
- 避免不必要的重新渲染

## 扩展性

### 添加新的模型类型
1. 在`synthesizerService.ts`中更新`ModelType`类型
2. 在页面组件中更新`modelTypeOptions`数组
3. 更新后端接口支持

### 添加新的训练参数
1. 更新`SynthesizerTrainingParamsDto`接口
2. 在创建表单中添加对应的表单项
3. 在详情页面中添加显示字段

### 自定义验证规则
1. 在表单项的`rules`属性中添加验证规则
2. 使用Arco Design的验证器或自定义验证函数

## 注意事项

1. **API地址配置**: 确保`API_BASE_URL`配置为相对地址以支持不同环境
2. **权限控制**: 根据用户角色和合成器状态控制操作权限
3. **错误处理**: 所有API调用都应包含适当的错误处理
4. **数据验证**: 前端验证不能替代后端验证，仅用于提升用户体验
5. **状态同步**: 操作完成后及时刷新列表数据保持状态同步

## 维护指南

### 代码结构
- 保持组件职责单一
- 将API调用封装在服务层
- 使用TypeScript确保类型安全

### 测试建议
- 测试各种表单验证场景
- 验证不同状态下的操作权限
- 测试网络异常情况的错误处理

### 更新流程
1. 更新接口定义时同步更新TypeScript类型
2. 新增功能时更新相应的文档
3. 修改验证规则时确保前后端一致