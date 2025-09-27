# 数据集管理模块

## 概述

本模块实现了完整的数据集管理功能，包括：
- 数据集的增删改查
- 分页查询和搜索
- 批量操作（删除、启用/禁用）
- 名称唯一性校验
- 详情查看

## 文件结构

```
src/pages/datasets/
├── index.tsx              # 主页面组件
├── index.css              # 样式文件
├── components/
│   ├── DatasetForm.tsx    # 新建/编辑表单
│   └── DatasetDetail.tsx  # 详情查看组件
└── README.md              # 说明文档
```

## 路由配置

在项目的路由配置文件中添加以下路由：

```javascript
// 示例：在 src/routes/index.js 或类似文件中
import DatasetManagement from '../pages/datasets';

// 添加到路由配置中
{
  path: '/datasets',
  name: '数据集管理',
  component: DatasetManagement,
  // 如果使用菜单系统，可以添加以下配置
  meta: {
    title: '数据集管理',
    icon: 'IconStorage', // 根据项目使用的图标库调整
    requireAuth: true
  }
}
```

## 菜单配置

如果项目使用侧边栏菜单，可以在菜单配置中添加：

```javascript
// 示例菜单配置
{
  key: 'datasets',
  title: '数据集管理',
  icon: 'IconStorage',
  path: '/datasets'
}
```

## API 接口

本模块依赖以下后端接口（基于设计文档）：

- `GET /api/datasets` - 分页查询
- `GET /api/datasets/search` - 搜索
- `POST /api/datasets` - 创建
- `GET /api/datasets/{id}` - 获取详情
- `POST /api/datasets/{id}/update` - 更新
- `POST /api/datasets/{id}/delete` - 删除
- `POST /api/datasets/batch/delete` - 批量删除
- `POST /api/datasets/{id}/enable` - 启用
- `POST /api/datasets/{id}/disable` - 禁用
- `GET /api/datasets/check-name` - 名称校验

## 依赖说明

本模块依赖以下文件：
- `src/services/datasetService.js` - API服务层
- `src/utils/request.js` - HTTP请求工具

确保这些文件存在并正确配置。

## 使用说明

1. 确保后端API服务正常运行
2. 将路由配置添加到项目中
3. 在菜单中添加对应的导航项
4. 访问 `/datasets` 路径即可使用数据集管理功能

## 注意事项

1. 用户信息获取：当前代码中使用了硬编码的用户信息（'current_user'），实际项目中应从用户上下文或认证系统获取
2. 权限控制：可根据需要在组件中添加权限检查逻辑
3. 错误处理：已实现基本的错误处理，可根据项目需求进一步完善
4. 响应式设计：已包含基本的响应式样式，可根据需要调整