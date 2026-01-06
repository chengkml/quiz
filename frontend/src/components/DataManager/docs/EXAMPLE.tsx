/**
 * DataManager 最小示例
 * 展示最基础的使用方式
 */

import React, { useState } from 'react';
import { Message, Modal } from '@arco-design/web-react';
import { DetailFieldConfig, FormFieldConfig } from '../../types/types';
import { AddEditModal, DataManager, DetailModal } from '../index';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
}

const mockUsers: User[] = [
  { id: 1, name: '张三', email: 'zhangsan@example.com', role: '管理员', status: '激活' },
  { id: 2, name: '李四', email: 'lisi@example.com', role: '用户', status: '激活' },
  { id: 3, name: '王五', email: 'wangwu@example.com', role: '用户', status: '禁用' },
];

const SimpleExample: React.FC = () => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: mockUsers.length,
  });
  const [addEditVisible, setAddEditVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<User | null>(null);

  // 表单配置
  const formConfig: FormFieldConfig[] = [
    {
      field: 'name',
      label: '用户名',
      type: 'input',
      required: true,
    },
    {
      field: 'email',
      label: '邮箱',
      type: 'input',
      required: true,
      rules: [{ type: 'email', message: '请输入有效的邮箱' }],
    },
    {
      field: 'role',
      label: '角色',
      type: 'select',
      required: true,
      options: [
        { label: '管理员', value: '管理员' },
        { label: '用户', value: '用户' },
      ],
    },
    {
      field: 'status',
      label: '状态',
      type: 'select',
      options: [
        { label: '激活', value: '激活' },
        { label: '禁用', value: '禁用' },
      ],
    },
  ];

  // 详情字段配置
  const detailFields: DetailFieldConfig[] = [
    { key: 'name', label: '用户名', dataIndex: 'name' },
    { key: 'email', label: '邮箱', dataIndex: 'email' },
    { key: 'role', label: '角色', dataIndex: 'role' },
    { key: 'status', label: '状态', dataIndex: 'status', type: 'tag' },
  ];

  // 表格列配置
  const tableColumns = [
    { title: '用户名', dataIndex: 'name', width: 120 },
    { title: '邮箱', dataIndex: 'email', width: 200 },
    { title: '角色', dataIndex: 'role', width: 100 },
    { title: '状态', dataIndex: 'status', width: 100 },
  ];

  const handleAdd = () => {
    setIsEdit(false);
    setCurrentRecord(null);
    setAddEditVisible(true);
  };

  const handleEdit = (record: User) => {
    setIsEdit(true);
    setCurrentRecord(record);
    setAddEditVisible(true);
  };

  const handleDelete = (record: User) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定删除用户"${record.name}"吗？`,
      onOk: () => {
        setUsers((prev) => prev.filter((u) => u.id !== record.id));
        Message.success('删除成功');
      },
    });
  };

  const handleView = (record: User) => {
    setCurrentRecord(record);
    setDetailVisible(true);
  };

  const handleAddEditSubmit = async (values: any) => {
    if (isEdit && currentRecord) {
      setUsers((prev) =>
        prev.map((u) => (u.id === currentRecord.id ? { ...u, ...values } : u))
      );
      Message.success('编辑成功');
    } else {
      setUsers((prev) => [
        {
          id: Math.max(...prev.map((u) => u.id), 0) + 1,
          ...values,
        },
        ...prev,
      ]);
      Message.success('新增成功');
    }
    setAddEditVisible(false);
  };

  return (
    <>
      <DataManager
        data={users.slice(0, pagination.pageSize)}
        pagination={pagination}
        onPaginationChange={setPagination}
        actions={{
          onAdd: handleAdd,
          onEdit: handleEdit,
          onDelete: handleDelete,
          onView: handleView,
        }}
        config={{
          shortCardConfig: {
            title: (item: User) => item.name,
            subtitle: (item: User) => item.email,
            showFields: ['role', 'status'],
            fieldLabel: { role: '角色', status: '状态' },
          },
          tableColumns,
        }}
        cardColumns={3}
      />

      <AddEditModal
        visible={addEditVisible}
        isEdit={isEdit}
        record={currentRecord || undefined}
        title={isEdit ? '编辑用户' : '新增用户'}
        formConfig={formConfig}
        onOk={handleAddEditSubmit}
        onCancel={() => setAddEditVisible(false)}
      />

      <DetailModal
        visible={detailVisible}
        record={currentRecord || undefined}
        title="用户详情"
        detailFields={detailFields}
        onCancel={() => setDetailVisible(false)}
      />
    </>
  );
};

export default SimpleExample;
