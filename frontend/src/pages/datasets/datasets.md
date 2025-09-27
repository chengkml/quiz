# 数据集管理页面详细设计文档（基于最终DTO与后端服务）

**文档版本：** 2.0  
**最后更新：** 2025年9月11日  
**作者：** Qwen（基于 Alibaba Cloud）  
**适用系统：** 亚洲信息综合管理系统（Synth）  
**目标模块：** 数据集管理（Dataset Management）  
**适配后端：** `com.asiainfo.synth.dataset.controller.DatasetController`  
**数据模型：** 最终版 DTO 定义（已根据实际代码修正）

---

## 1. 概述

本文档基于您提供的 `DatasetController`、`DatasetCreateDto`、`DatasetUpdateDto` 和 `DatasetDto` 实际代码，对数据集管理页面进行精确设计。本方案确保前端在字段命名、数据类型、校验规则、接口路径及行为逻辑上与后端实现完全对齐。

---

## 2. 数据模型（最终对齐）

| 类名 | 字段 | 类型 | 说明/校验 |
|------|------|------|-----------|
| **`DatasetCreateDto`** | `datasetName` | String | 必填，≤64字符 |
| | `sourceType` | String | 必填，"DATA_LINK" 或 "FILE_UPLOAD" |
| | `descr` | String | ≤1024字符 |
| | `state` | String | "1"=启用，"0"=禁用，默认"1" |
| | `createUser` | String | 创建人，≤64字符 |
| **`DatasetUpdateDto`** | `datasetId` | String | 必填，主键 |
| | `datasetName` | String | ≤64字符 |
| | `descr` | String | ≤1024字符 |
| | `state` | String | "1" 或 "0" |
| | `updateUser` | String | 更新人，≤64字符 |
| **`DatasetQueryDto`** | `keyword` | String | 模糊查询名称/描述 |
| | `sourceType` | String | 精确匹配："DATA_LINK", "FILE_UPLOAD" |
| | `state` | String | "1" 或 "0" |
| | `createUser` | String | 精确匹配创建人 |
| | `page` | Integer | 从0开始 |
| | `size` | Integer | 默认20 |
| | `sortBy` | String | 默认"createTime" |
| | `sortDir` | String | "asc" 或 "desc" |
| **`DatasetDto`** | `datasetId` | String | 主键 |
| | `datasetName` | String | 数据集名称 |
| | `sourceType` | String | "DATA_LINK" 或 "FILE_UPLOAD" |
| | `descr` | String | 描述 |
| | `state` | String | "1"=启用，"0"=禁用 → 前端显示“启用”/“禁用” |
| | `createUser` | String | 创建人 |
| | `createDt` | Date | 创建时间 |
| | `updateUser` | String | 更新人 |
| | `updateDt` | Date | 更新时间 |

> **重要变更说明：**
> - `sourceType` 枚举值为 `"DATA_LINK"` 和 `"FILE_UPLOAD"`，非 `"DB_TABLE"`。
> - 状态字段：DTO 中为 `"1"/"0"`，但 `DatasetDto.state` 类型为 `String`（可能为业务状态如 "ACTIVE"/"INACTIVE"），根据 Controller 逻辑，**前端应统一使用 `"1"/"0"` 与后端交互**。
> - 无复杂嵌套配置（`fileConfig`, `dbTableConfig`），配置逻辑由后端服务内部处理。
> - 新增批量删除、启用/禁用、按名称查询等操作。

---

## 3. 接口调用规范（精确映射）

| 前端操作 | HTTP 方法 | 路径 | 请求参数/体 | 成功响应 |
|--------|----------|------|-------------|----------|
| 分页查询 | `GET` | `/api/datasets` | `page`, `size`, `sortBy`, `sortDir`, `sourceType`, `state`, `createUser`, `keyword` | `{success, message, data: {content, totalElements, totalPages, currentPage, pageSize}, timestamp}` |
| 搜索数据集 | `GET` | `/api/datasets/search` | `keyword` | `{success, message, data: List<DatasetDto>, timestamp}` |
| 创建数据集 | `POST` | `/api/datasets` | Body: `DatasetCreateDto` | `{success, message, data: DatasetDto, timestamp}` |
| 获取详情 | `GET` | `/api/datasets/{datasetId}` | - | `{success, message, data: DatasetDto, timestamp}` |
| 根据名称获取 | `GET` | `/api/datasets/name/{datasetName}` | - | `{success, message, data: DatasetDto, timestamp}` |
| 更新数据集 | `POST` | `/api/datasets/{datasetId}/update` | Body: `DatasetUpdateDto` | `{success, message, data: DatasetDto, timestamp}` |
| 删除数据集 | `POST` | `/api/datasets/{datasetId}/delete` | - | `{success, message, data: null, timestamp}` |
| 批量删除 | `POST` | `/api/datasets/batch/delete` | Body: `List<String>` (datasetIds) | `{success, message, data: null, timestamp}` |
| 启用数据集 | `POST` | `/api/datasets/{datasetId}/enable` | - | `{success, message, data: null, timestamp}` |
| 禁用数据集 | `POST` | `/api/datasets/{datasetId}/disable` | - | `{success, message, data: null, timestamp}` |
| 名称校验 | `GET` | `/api/datasets/check-name` | `datasetName`, `excludeId` | `{success, message, data: {exists: boolean}, timestamp}` |

> **注意：**
> - 所有接口返回统一结构，包含 `success`, `message`, `data`, `timestamp`。
> - `check-name` 接口返回对象 `{exists: boolean}`，需解析 `data.exists`。
> - 批量删除传 `datasetIds` 数组。

---

## 4. 页面结构设计（字段精确匹配）

```
+---------------------------------------------------+
| 数据集管理                                         |
+---------------------------------------------------+
| 搜索区                                             |
| [全局搜索框] [搜索按钮]                            |
+---------------------------------------------------+
| 过滤条件区                                         |
| 来源: [下拉框: 全部/数据链接/文件上传]               |
| 状态: [下拉框: 全部/启用/禁用]                       |
| 创建人: [输入框]   [查询] [重置]                    |
+---------------------+-----------------------------+
| [新建数据集] [刷新]   | [批量删除]                   |
+---------------------+-----------------------------+
| 表格：数据集列表                                    |
|                                                   |
| | 名称       | 来源      | 状态     | 描述           | 创建人 | 创建时间       | 更新人 | 更新时间       | 操作 |
| |----------|---------|--------|--------------|-------|--------------|-------|--------------|------|
| | 用户表     | 数据链接   | 启用     | 核心用户信息    | admin | 2025-01-15   | alice | 2025-03-20   | [详情][编辑][删除] |
| | ...       | ...     | ...    | ...          | ...   | ...          | ...   | ...          | ...  |
+---------------------------------------------------+
| 分页控件：共 {totalElements} 条记录，第 {currentPage + 1}/{totalPages} 页 |
+---------------------------------------------------+
```

---

## 5. 核心功能实现（字段级对齐）

### 5.1 新建/编辑表单

| 前端标签 | DTO字段 | 前端组件 | 校验规则 |
|--------|--------|--------|--------|
| **数据集名称** * | `datasetName` | Input | 必填，≤64字符，调用 `/check-name` |
| **来源类型** * | `sourceType` | RadioGroup | 必选："数据链接" → "DATA_LINK"，"文件上传" → "FILE_UPLOAD" |
| **描述** | `descr` | TextArea | ≤1024字符 |
| **状态** * | `state` | Radio | "1"=启用，"0"=禁用 |

> **动态行为：**
> - “文件上传”类型：点击“新建”后应跳转至文件上传向导页或弹出上传组件。
> - “数据链接”类型：点击“新建”后应跳转至数据源选择与配置页。

### 5.2 表格列定义

| 表头 | 数据字段 | 显示逻辑 |
|------|----------|----------|
| 名称 | `datasetName` | 直接显示 |
| 来源 | `sourceType` | "DATA_LINK" → “数据链接”，"FILE_UPLOAD" → “文件上传” |
| 状态 | `state` | "1" → **绿色标签“启用”**，"0" → **灰色标签“禁用”** |
| 描述 | `descr` | 显示，过长省略或悬停显示 |
| 创建人 | `createUser` | 直接显示 |
| 创建时间 | `createDt` | 格式化为 `yyyy-MM-dd HH:mm` |
| 更新人 | `updateUser` | 直接显示，若为空则“-” |
| 更新时间 | `updateDt` | 格式化为 `yyyy-MM-dd HH:mm`，若为空则“-” |
| 操作 | - | 条件渲染：`state="1"` → 显示“禁用”按钮；`state="0"` → 显示“启用”按钮 |

---

## 6. 关键交互逻辑

### 6.1 全局搜索
```javascript
// 伪代码 - 调用 /search 接口
async function globalSearch(keyword) {
  if (!keyword.trim()) return;
  const res = await GET(`/api/datasets/search?keyword=${encodeURIComponent(keyword)}`);
  if (res.success) {
    updateTableData(res.data);
  }
}
```

### 6.2 名称唯一性校验（新建/编辑）
```javascript
// 伪代码
async function validateDatasetName(name, excludeId = null) {
  let url = `/api/datasets/check-name?datasetName=${encodeURIComponent(name)}`;
  if (excludeId) url += `&excludeId=${excludeId}`;
  const res = await GET(url);
  if (res.success && res.data?.exists) {
    showError("该数据集名称已存在，请更换");
    return false;
  }
  return true;
}
```

### 6.3 状态切换（启用/禁用）
```javascript
// 伪代码 - 禁用数据集
async function disableDataset(datasetId) {
  const res = await POST(`/api/datasets/${datasetId}/disable`);
  if (res.success) {
    updateTableRowStatus(datasetId, "0");
    showSuccess("数据集禁用成功");
  } else {
    showError(res.message);
  }
}
```

### 6.4 批量删除
```javascript
// 伪代码
async function batchDelete(selectedIds) {
  if (!selectedIds.length) return;
  const confirmed = await confirm(`确定删除选中的 ${selectedIds.length} 个数据集？`);
  if (!confirmed) return;
  const res = await POST(`/api/datasets/batch/delete`, selectedIds);
  if (res.success) {
    refreshTable();
    showSuccess("批量删除成功");
  } else {
    showError(res.message);
  }
}
```

---

## 7. 异常处理与用户体验

| 场景 | 处理方式 |
|------|----------|
| 后端校验失败（如名称超长） | 提示具体错误信息（如“数据集名称长度不能超过64个字符”） |
| 网络错误或服务不可达 | 提示“网络连接失败，请检查网络后重试” |
| 权限不足（403） | 禁用操作按钮，提示“您无此操作权限” |
| 删除/操作被引用的数据集 | 后端返回具体错误信息（如“无法删除：该数据集正在被使用”），前端原样展示 |
| 查询无结果 | 表格区域显示“暂无数据” |
| 批量删除部分失败 | 后端应返回失败列表，前端提示“成功删除X个，Y个失败：原因...” |

---