import React, { useState, useEffect } from 'react';
import { Layout, Form, Input, Select, Button, Space, Message, Modal, Grid } from '@arco-design/web-react';
import { IconSearch, IconPlus } from '@arco-design/web-react/icon';
import DataManager from '@/components/DataManager';
import AddEditModal from '@/components/DataManager/AddEditModal';
import DetailModal from '@/components/DataManager/DetailModal';
import {
  PaginationConfig,
  FormFieldConfig,
  DetailFieldConfig,
  TabConfig,
} from '@/components/DataManager/types';

const { Content } = Layout;
const { Row, Col } = Grid;

/**
 * DataManager 使用示例
 * 
 * 这是一个完整的数据管理页面示例，展示了如何使用 DataManager 组件
 * 包括：
 * - 过滤表单
 * - 卡片/表格切换
 * - 新增/编辑/删除/查看功能
 * - 分页
 */

// 模拟数据
const mockData = [
  {
    id: 1,
    name: '前端开发',
    description: '负责用户界面的开发和优化',
    category: 'development',
    status: '进行中',
    creator: '张三',
    createDate: '2024-01-15',
    image: 'https://via.placeholder.com/120',
  },
  {
    id: 2,
    name: '后端开发',
    description: '负责服务器端的开发和维护',
    category: 'development',
    status: '进行中',
    creator: '李四',
    createDate: '2024-01-16',
    image: 'https://via.placeholder.com/120',
  },
  {
    id: 3,
    name: '数据库设计',
    description: '设计和优化数据库结构',
    category: 'design',
    status: '已完成',
    creator: '王五',
    createDate: '2024-01-14',
    image: 'https://via.placeholder.com/120',
  },
  {
    id: 4,
    name: 'UI设计',
    description: '设计用户界面和交互流程',
    category: 'design',
    status: '进行中',
    creator: '赵六',
    createDate: '2024-01-17',
    image: 'https://via.placeholder.com/120',
  },
  {
    id: 5,
    name: '测试',
    description: '功能测试和性能测试',
    category: 'testing',
    status: '待开始',
    creator: '孙七',
    createDate: '2024-01-18',
    image: 'https://via.placeholder.com/120',
  },
];

interface Task {
  id: number;
  name: string;
  description: string;
  category: string;
  status: string;
  creator: string;
  createDate: string;
  image?: string;
}

const DataManagerExample: React.FC = () => {
  const [filterForm] = Form.useForm();
  const [tableData, setTableData] = useState<Task[]>(mockData);
  const [loading, setLoading] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<Task | null>(null);

  // 模态框状态
  const [addEditVisible, setAddEditVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailRecord, setDetailRecord] = useState<Task | null>(null);

  // 分页状态
  const [pagination, setPagination] = useState<PaginationConfig>({
    current: 1,
    pageSize: 6,
    total: mockData.length,
    showTotal: true,
    showJumper: true,
    showPageSize: true,
    pageSizeOptions: [6, 12, 24],
  });

  // 获取分页后的数据
  const getPaginatedData = (): Task[] => {
    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return tableData.slice(start, end);
  };

  // 处理搜索
  const handleSearch = (values: any) => {
    setLoading(true);
    setTimeout(() => {
      const filtered = mockData.filter((item) => {
        if (values.name && !item.name.includes(values.name)) return false;
        if (values.category && item.category !== values.category) return false;
        if (values.status && item.status !== values.status) return false;
        return true;
      });

      setTableData(filtered);
      setPagination((prev) => ({
        ...prev,
        current: 1,
        total: filtered.length,
      }));
      setLoading(false);
    }, 300);
  };

  // 处理重置
  const handleReset = () => {
    filterForm.resetFields();
    setTableData(mockData);
    setPagination((prev) => ({
      ...prev,
      current: 1,
      total: mockData.length,
    }));
  };

  // 处理新增
  const handleAdd = () => {
    setIsEdit(false);
    setCurrentRecord(null);
    filterForm.resetFields();
    setAddEditVisible(true);
  };

  // 处理编辑
  const handleEdit = (record: Task) => {
    setIsEdit(true);
    setCurrentRecord(record);
    setAddEditVisible(true);
  };

  // 处理删除
  const handleDelete = (record: Task) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除"${record.name}"吗？`,
      onOk: async () => {
        setTableData((prev) => prev.filter((item) => item.id !== record.id));
        setPagination((prev) => ({
          ...prev,
          total: prev.total - 1,
        }));
        Message.success('删除成功');
      },
    });
  };

  // 处理查看详情
  const handleView = (record: Task) => {
    setDetailRecord(record);
    setDetailVisible(true);
  };

  // 处理新增/编辑提交
  const handleAddEditSubmit = async (values: any) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (isEdit && currentRecord) {
        // 编辑
        setTableData((prev) =>
          prev.map((item) =>
            item.id === currentRecord.id ? { ...item, ...values } : item
          )
        );
        Message.success('编辑成功');
      } else {
        // 新增
        const newRecord: Task = {
          id: Math.max(...tableData.map((item) => item.id), 0) + 1,
          ...values,
          createDate: new Date().toISOString().split('T')[0],
          creator: '当前用户',
        };
        setTableData((prev) => [newRecord, ...prev]);
        setPagination((prev) => ({
          ...prev,
          total: prev.total + 1,
        }));
        Message.success('新增成功');
      }

      setAddEditVisible(false);
      setIsEdit(false);
      setCurrentRecord(null);
    } finally {
      setLoading(false);
    }
  };

  // 表单字段配置
  const formConfig: FormFieldConfig[] = [
    {
      field: 'name',
      label: '任务名称',
      type: 'input',
      required: true,
      placeholder: '请输入任务名称',
    },
    {
      field: 'description',
      label: '任务描述',
      type: 'textarea',
      required: true,
      placeholder: '请输入任务描述',
    },
    {
      field: 'category',
      label: '任务分类',
      type: 'select',
      required: true,
      options: [
        { label: '开发', value: 'development' },
        { label: '设计', value: 'design' },
        { label: '测试', value: 'testing' },
        { label: '其他', value: 'other' },
      ],
    },
    {
      field: 'status',
      label: '任务状态',
      type: 'select',
      required: true,
      options: [
        { label: '待开始', value: '待开始' },
        { label: '进行中', value: '进行中' },
        { label: '已完成', value: '已完成' },
      ],
    },
  ];

  // 详情字段配置
  const detailFields: DetailFieldConfig[] = [
    { key: 'name', label: '任务名称', dataIndex: 'name' },
    { key: 'description', label: '任务描述', dataIndex: 'description' },
    { key: 'category', label: '任务分类', dataIndex: 'category' },
    { key: 'status', label: '任务状态', dataIndex: 'status', type: 'tag' },
    { key: 'creator', label: '创建者', dataIndex: 'creator' },
    { key: 'createDate', label: '创建时间', dataIndex: 'createDate' },
  ];

  // 表格列配置
  const tableColumns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      width: 150,
    },
    {
      title: '描述',
      dataIndex: 'description',
      width: 200,
      render: (text: string) => text.substring(0, 30) + '...',
    },
    {
      title: '分类',
      dataIndex: 'category',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
    },
    {
      title: '创建者',
      dataIndex: 'creator',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createDate',
      width: 120,
    },
  ];

  // 过滤表单内容
  const filterContent = (
    <Form
      form={filterForm}
      layout="horizontal"
      style={{ marginBottom: '16px' }}
      onValuesChange={() => {
        const values = filterForm.getFieldsValue();
        handleSearch(values);
      }}
    >
      <Row gutter={16}>
        <Col span={6}>
          <Form.Item field="name" label="任务名称">
            <Input placeholder="请输入任务名称" allowClear />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item field="category" label="任务分类">
            <Select
              placeholder="请选择分类"
              allowClear
              options={[
                { label: '开发', value: 'development' },
                { label: '设计', value: 'design' },
                { label: '测试', value: 'testing' },
                { label: '其他', value: 'other' },
              ]}
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item field="status" label="任务状态">
            <Select
              placeholder="请选择状态"
              allowClear
              options={[
                { label: '待开始', value: '待开始' },
                { label: '进行中', value: '进行中' },
                { label: '已完成', value: '已完成' },
              ]}
            />
          </Form.Item>
        </Col>
        <Col span={6} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
          <Space>
            <Button type="primary" icon={<IconSearch />} onClick={() => {
              const values = filterForm.getFieldsValue();
              handleSearch(values);
            }}>
              搜索
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Col>
      </Row>
    </Form>
  );

  return (
    <Layout className="data-manager-example">
      <Content style={{ padding: '20px' }}>
        <DataManager
          data={getPaginatedData()}
          loading={loading}
          pagination={pagination}
          onPaginationChange={setPagination}
          actions={{
            onAdd: handleAdd,
            onEdit: handleEdit,
            onDelete: handleDelete,
            onView: handleView,
          }}
          config={{
            showModeToggle: true,
            displayMode: 'shortCard',
            filterContent: filterContent,
            shortCardConfig: {
              title: (item) => item.name,
              subtitle: (item) => item.category,
              description: (item) => item.description,
              showFields: ['status', 'creator'],
              fieldLabel: {
                status: '状态',
                creator: '创建者',
              },
            },
            longCardConfig: {
              title: (item) => item.name,
              subtitle: (item) => `分类: ${item.category}`,
              description: (item) => item.description,
              image: (item) => item.image,
              imagePosition: 'left',
              imageHeight: 120,
              imageWidth: 120,
              showFields: ['status', 'creator', 'createDate'],
              fieldLabel: {
                status: '状态',
                creator: '创建者',
                createDate: '创建时间',
              },
            },
            tableColumns: tableColumns,
          }}
          showActions={true}
          actionsPosition="top"
          tableScrollHeight={500}
          cardColumns={3}
          cardGutter={16}
          cardSize="medium"
        />

        {/* 新增/编辑模态框 */}
        <AddEditModal
          visible={addEditVisible}
          isEdit={isEdit}
          record={currentRecord || undefined}
          loading={loading}
          title={isEdit ? '编辑任务' : '新增任务'}
          formConfig={formConfig}
          onOk={handleAddEditSubmit}
          onCancel={() => {
            setAddEditVisible(false);
            setIsEdit(false);
            setCurrentRecord(null);
          }}
        />

        {/* 详情模态框 */}
        <DetailModal
          visible={detailVisible}
          record={detailRecord || undefined}
          title="任务详情"
          detailFields={detailFields}
          onCancel={() => {
            setDetailVisible(false);
            setDetailRecord(null);
          }}
        />
      </Content>
    </Layout>
  );
};

export default DataManagerExample;
