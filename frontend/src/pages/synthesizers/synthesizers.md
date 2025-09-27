# ✅ 数据合成器页面详细设计文档（v1.0 - 最终完整版）

> **基于所有 DTO 与接口 100% 对齐，可直接用于 AI 编码**

---

## 1. 页面概述

- **页面名称**：数据合成器管理
- **路径**：`/synthesizers`
- **功能**：对数据合成器（即训练后的合成模型）进行创建、查询、查看、编辑、删除等全生命周期管理
- **权限**：数据科学家、AI 工程师、系统管理员

---

## 2. 页面布局

```tsx
<PageContainer>
  <SearchForm />              {/* 查询表单 */}
  <SynthesizerTable />       {/* 合成器列表 + 操作按钮 */}
  <CreateModal />            {/* 创建合成器模态框 */}
  <EditModal />              {/* 编辑合成器模态框 */}
  <ViewModal />              {/* 查看详情模态框 */}
</PageContainer>
```

---

## 3. 查询功能

### 3.1 查询表单字段

| 字段 | 组件 | 参数名 | 说明 |
|------|------|--------|------|
| 合成器名称 | Input | `name` | 支持模糊查询 |
| 模型类型 | Select | `modelType` | 选项：CTGAN, TVAE, CopulaGAN, GaussianCopula |
| 状态 | Select | `state` | 选项：全部、训练中、就绪、失败、已禁用 |
| 创建人 | Input | `createdBy` | 支持模糊查询 |

> **查询按钮**：`<Button type="primary">查询</Button>`  
> **重置按钮**：`<Button>重置</Button>`

---

### 3.2 查询接口

- **接口**：`GET /api/synthesizers`
- **参数**：
  ```ts
  {
    name?: string;
    modelType?: 'CTGAN' | 'TVAE' | 'CopulaGAN' | 'GaussianCopula';
    state?: 'TRAINING' | 'READY' | 'FAILED' | 'DISABLED';
    createdBy?: string;
    page: number;   // 页码（从0开始）
    size: number;   // 每页数量，默认20
    sortBy?: string; // 排序字段，默认createTime
    sortDir?: 'asc' | 'desc'; // 排序方向，默认desc
  }
  ```
- **成功响应**：
  ```json
  {
    "success": true,
    "data": [/* SynthesizerDto 列表 */],
    "totalElements": 50,
    "totalPages": 3,
    "currentPage": 0,
    "size": 20
  }
  ```

---

## 4. 表格展示

### 4.1 列定义

| 列名 | dataIndex | 宽度 | 说明 |
|------|-----------|------|------|
| 合成器名称 | `synthesizerName` | 150px | — |
| 模型类型 | `modelType` | 120px | 显示 `modelTypeDescription` |
| 训练数据集ID | `trainingDatasetId` | 130px | — |
| 状态 | `state` | 100px | 显示 `stateDescription`，带状态标签 |
| 描述 | `description` | 200px | 文本截断，hover展示全文 |
| 创建人 | `createUser` | 100px | — |
| 创建时间 | `createTime` | 140px | 格式：`YYYY-MM-DD HH:mm:ss` |
| 操作 | `action` | 180px | 按钮组 |

---

### 4.2 操作按钮

| 按钮 | 类型 | 权限 | 触发 |
|------|------|------|------|
| 查看 | Text Button | 所有授权用户 | 打开 `ViewModal` |
| 编辑 | Text Button | 创建人或管理员 | 打开 `EditModal` |
| 删除 | Text Button | 创建人或管理员 | 弹确认框 → 调用 `/delete` |

> ⚠️ **状态控制**：
> - “训练中”、“失败”状态：不可编辑
> - “已禁用”状态：不显示在可用列表中

---

## 5. 创建数据合成器

### 5.1 表单字段

| 字段 | 组件 | 必填 | 校验规则（来自 `SynthesizerCreateDto`） |
|------|------|------|----------------------------------|
| 合成器名称 | Input | ✅ | ≤ 64 字符 |
| 模型类型 | Select | ✅ | 四选一：CTGAN, TVAE, CopulaGAN, GaussianCopula |
| 训练数据集ID | Input | ✅ | ≤ 32 字符 |
| 描述 | TextArea | ❌ | ≤ 1024 字符 |
| 采样方式 | Radio Group | ❌ | 1=按比例，2=按数量 |
| 采样比例 | Input (number) | 条件 | 仅当 `采样方式=1` 时显示，范围 (0,1] |
| 采样数量 | Input (number) | 条件 | 仅当 `采样方式=2` 时显示，≥1 |
| 抽样阈值 | Input (number) | ❌ | ≥1，默认5000 |
| 训练轮数(epochs) | Input (number) | ❌ | ≥1，默认100 |
| 批次大小(batch size) | Input (number) | ❌ | ≥1，默认1000 |
| 多卡训练 | Switch | ❌ | 默认开启 |
| 通信后端 | Select | ✅ | nccl / gloo |
| GPU ID 列表 | Input (逗号分隔) | ❌ | 仅当多卡关闭时可填，输入数字如 `0,1,2` |

---

### 5.2 接口调用

- **接口**：`POST /api/synthesizers`
- **请求体**：`SynthesizerCreateDto`
- **成功响应**：`{ "success": true, "message": "合成器创建成功" }`

---

## 6. 编辑合成器

### 6.1 表单字段

| 字段 | 组件 | 必填 | 校验规则（来自 `SynthesizerUpdateDto`） |
|------|------|------|----------------------------------|
| 合成器名称 | Input | ❌ | ≤ 64 字符 |
| 描述 | TextArea | ❌ | ≤ 1024 字符 |

> ✅ **仅允许修改名称和描述**

---

### 6.2 接口调用

- **接口**：`POST /api/synthesizers/{synthesizerId}/update`
- **请求体**：`SynthesizerUpdateDto`
- **成功响应**：`{ "success": true, "message": "更新成功" }`

---

## 7. 查看详情

### 7.1 模态框内容

- **标题**：【合成器名称】详情
- **信息展示**（只读）：
    - 合成器ID
    - 合成器名称
    - 模型类型（含描述）
    - 训练数据集ID
    - 模型文件路径
    - 模型配置路径
    - 状态（含描述）
    - 描述
    - 创建人/时间
    - 更新人/时间
    - **训练参数折叠面板**：
        - 展开后显示所有 `SynthesizerTrainingParamsDto` 字段

---

### 7.2 接口调用

- **接口**：`GET /api/synthesizers/{synthesizerId}`
- **成功响应**：`SynthesizerDto`

---

## 8. 删除合成器

- **触发方式**：点击“删除”按钮 → 弹出确认对话框
- **确认文案**：`确定要删除【{synthesizerName}】吗？此操作不可恢复。`
- **接口**：`POST /api/synthesizers/{synthesizerId}/delete`
- **成功响应**：`200 OK`（无响应体）
- **失败处理**：提示错误信息

---

## 9. TypeScript 类型定义

```ts
// 枚举类型
type ModelType = 'CTGAN' | 'TVAE' | 'CopulaGAN' | 'GaussianCopula';
type SynthesizerState = 'TRAINING' | 'READY' | 'FAILED' | 'DISABLED';

// 训练参数 DTO
interface SynthesizerTrainingParamsDto {
  sampling_method: 1 | 2;
  sample_ratio: number;
  sample_size: number;
  sample_threshold: number;
  epochs: number;
  batch_size: number;
  use_multi_gpu: boolean;
  backend: string;
  gpu_ids?: number[];
}

// 创建 DTO
interface SynthesizerCreateDto {
  synthesizerName: string;
  modelType: ModelType;
  trainingDatasetId: string;
  trainingParams?: SynthesizerTrainingParamsDto;
  description?: string;
  createUser?: string;
}

// 更新 DTO
interface SynthesizerUpdateDto {
  synthesizerName?: string;
  description?: string;
  updateUser?: string;
}

// 主 DTO
interface SynthesizerDto {
  synthesizerId: string;
  synthesizerName: string;
  modelType: ModelType;
  modelTypeDescription: string;
  trainingDatasetId: string;
  trainingParams: SynthesizerTrainingParamsDto;
  modelArtifactPath: string;
  modelConfigPath: string;
  state: SynthesizerState;
  stateDescription: string;
  description: string;
  createUser: string;
  createTime: string;
  updateUser: string;
  updateTime: string;
}
```

---

## 10. 接口清单

| 功能 | 接口 | 方法 | 输入 | 输出 |
|------|------|------|------|------|
| 创建合成器 | `/api/synthesizers` | POST | `SynthesizerCreateDto` | `SynthesizerDto` |
| 查询列表 | `/api/synthesizers` | GET | `name`, `modelType`, `state`, `createdBy`, `page`, `size`, `sortBy`, `sortDir` | `Page<SynthesizerDto>` |
| 获取详情 | `/api/synthesizers/{id}` | GET | - | `SynthesizerDto` |
| 更新合成器 | `/api/synthesizers/{id}/update` | POST | `SynthesizerUpdateDto` | `SynthesizerDto` |
| 删除合成器 | `/api/synthesizers/{id}/delete` | POST | - | `200 OK` |
| 获取可用合成器 | `/api/synthesizers/available` | GET | - | `List<SynthesizerDto>` |

---
