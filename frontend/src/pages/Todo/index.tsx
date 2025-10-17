import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  Dropdown,
  Form,
  Input,
  Layout,
  Menu,
  Message,
  Modal,
  Pagination,
  Select,
  Space,
  Table,
  Tag,
  DatePicker,
  Tooltip,
} from '@arco-design/web-react';
import {
  IconDelete,
  IconEdit,
  IconEye,
  IconList,
  IconPlus,
} from '@arco-design/web-react/icon';
import './style/index.less';
import FilterForm from '@/components/FilterForm';
import { createTodo, deleteTodo, getTodoById, getTodoList, updateTodo } from './api';
import dayjs from 'dayjs';

const { Content } = Layout;
const { TextArea } = Input;
const { Option } = Select;

function TodoManager() {
  // 表格数据与状态
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [tableScrollHeight, setTableScrollHeight] = useState(420);

  // 当前记录与弹窗
  const [currentRecord, setCurrentRecord] = useState<any | null>(null);
  const [detailRecord, setDetailRecord] = useState<any | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // 表单引用
  const addFormRef = useRef<any>(null);
  const editFormRef = useRef<any>(null);
  const filterFormRef = useRef<any>(null);

  // 状态与优先级选项
  const statusOptions = [
    { label: '待处理', value: 'PENDING' },
    { label: '处理中', value: 'IN_PROGRESS' },
    { label: '已完成', value: 'COMPLETED' },
  ];
  const priorityOptions = [
    { label: '低', value: 'LOW' },
    { label: '中', value: 'MEDIUM' },
    { label: '高', value: 'HIGH' },
  ];

  // 时间格式化（与其它页面一致的相对/绝对展示）
  const formatDateTime = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '-';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays === 0) {
      if (diffSeconds < 60) return `${diffSeconds}秒前`;
      if (diffMinutes < 60) return `${diffMinutes}分钟前`;
      return `${diffHours}小时前`;
    } else if (diffDays === 1) {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `昨天 ${hours}:${minutes}`;
    } else {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
  };

  // 获取表格数据
  const fetchTableData = async (params: any = {}, pageSize: number = pagination.pageSize, current: number = pagination.current) => {
    setTableLoading(true);
    try {
      const targetParams = {
        ...params,
        pageNum: current - 1,
        pageSize: pageSize,
        sortColumn: 'createDate',
        sortType: 'desc',
      };
      const response = await getTodoList(targetParams);
      if (response.data) {
        setTableData(response.data.content || []);
        setPagination(prev => ({
          ...prev,
          current,
          pageSize,
          total: response.data.totalElements || 0,
        }));
      }
    } catch (error) {
      Message.error('获取待办数据失败');
    } finally {
      setTableLoading(false);
    }
  };

  // 搜索
  const searchTableData = (params: any) => {
    fetchTableData(params, pagination.pageSize, 1);
  };

  // 分页变化
  const handlePageChange = (current: number, pageSize: number) => {
    const filterParams = filterFormRef.current?.getFieldsValue?.() || {};
    fetchTableData(filterParams, pageSize, current);
  };

  // 新增
  const handleAdd = () => {
    setCurrentRecord(null);
    setAddModalVisible(true);
    setTimeout(() => addFormRef.current?.resetFields?.(), 50);
  };

  const handleAddConfirm = async () => {
    try {
      const values = await addFormRef.current?.validate?.();
      if (values) {
        const payload = {
          ...values,
          // 统一转换为 LocalDateTime 可解析格式
          dueDate: values.dueDate ? dayjs(values.dueDate).format('YYYY-MM-DDTHH:mm:ss') : null,
        };
        await createTodo(payload);
        Message.success('待办创建成功');
        setAddModalVisible(false);
        addFormRef.current?.resetFields?.();
        fetchTableData();
      }
    } catch (error) {
      if (error?.fields) return; // 表单校验错误
      Message.error('待办创建失败');
    }
  };

  // 编辑
  const handleEdit = (record: any) => {
    setCurrentRecord(record);
    setEditModalVisible(true);
    setTimeout(() => {
      editFormRef.current?.setFieldsValue?.({
        id: record.id,
        title: record.title,
        description: record.description,
        status: record.status,
        priority: record.priority,
        dueDate: record.dueDate ? dayjs(record.dueDate) : null,
      });
    }, 50);
  };

  const handleEditConfirm = async () => {
    try {
      const values = await editFormRef.current?.validate?.();
      if (values && currentRecord) {
        const payload = {
          id: currentRecord.id,
          title: values.title,
          description: values.description,
          status: values.status,
          priority: values.priority,
          dueDate: values.dueDate ? dayjs(values.dueDate).format('YYYY-MM-DDTHH:mm:ss') : null,
        };
        await updateTodo(payload);
        Message.success('待办更新成功');
        setEditModalVisible(false);
        editFormRef.current?.resetFields?.();
        fetchTableData();
      }
    } catch (error) {
      if (error?.fields) return;
      Message.error('待办更新失败');
    }
  };

  // 删除
  const handleDelete = (record: any) => {
    setCurrentRecord(record);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!currentRecord) return;
    try {
      await deleteTodo(currentRecord.id);
      Message.success('待办删除成功');
      setDeleteModalVisible(false);
      fetchTableData();
    } catch (error) {
      Message.error('待办删除失败');
    }
  };

  // 查看详情
  const handleDetail = async (record: any) => {
    try {
      const resp = await getTodoById(record.id);
      if (resp.data) {
        setDetailRecord(resp.data);
        setDetailModalVisible(true);
      }
    } catch (error) {
      Message.error('获取待办详情失败');
    }
  };

  // 菜单点击
  const handleMenuClick = (key: string, e: React.MouseEvent, record: any) => {
    e.stopPropagation();
    if (key === 'detail') {
      handleDetail(record);
    } else if (key === 'edit') {
      handleEdit(record);
    } else if (key === 'delete') {
      handleDelete(record);
    }
  };

  // 列配置
  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (status: string) => {
        const map: Record<string, any> = {
          PENDING: { color: 'gray', text: '待处理' },
          IN_PROGRESS: { color: 'blue', text: '处理中' },
          COMPLETED: { color: 'green', text: '已完成' },
        };
        const it = map[status] || { color: 'arcoblue', text: status };
        return <Tag color={it.color}>{it.text}</Tag>;
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 120,
      render: (priority: string) => {
        const map: Record<string, any> = {
          LOW: { color: 'green', text: '低' },
          MEDIUM: { color: 'orange', text: '中' },
          HIGH: { color: 'red', text: '高' },
        };
        const it = map[priority] || { color: 'arcoblue', text: priority };
        return <Tag color={it.color}>{it.text}</Tag>;
      },
    },
    {
      title: '截止时间',
      dataIndex: 'dueDate',
      width: 180,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '创建人',
      dataIndex: 'createUserName',
      width: 140,
      render: (_: any, record: any) => record.createUserName || record.createUser || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createDate',
      width: 180,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '更新时间',
      dataIndex: 'updateDate',
      width: 180,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '操作',
      width: 100,
      align: 'center',
      fixed: 'right' as any,
      render: (_: any, record: any) => (
        <Space size="large" className="table-btn-group">
          <Dropdown
            position="bl"
            droplist={
              <Menu onClickMenuItem={(key, e) => handleMenuClick(key, e, record)} className="handle-dropdown-menu">
                <Menu.Item key="detail">
                  <IconEye style={{ marginRight: 5 }} />
                  查看详情
                </Menu.Item>
                <Menu.Item key="edit">
                  <IconEdit style={{ marginRight: 5 }} />
                  编辑
                </Menu.Item>
                <Menu.Item key="delete">
                  <IconDelete style={{ marginRight: 5 }} />
                  删除
                </Menu.Item>
              </Menu>
            }
          >
            <Button type="text" className="more-btn" onClick={(e) => e.stopPropagation()}>
              <IconList />
            </Button>
          </Dropdown>
        </Space>
      ),
    },
  ];

  // 初始化与高度自适应
  useEffect(() => {
    const calculateTableHeight = () => {
      const windowHeight = window.innerHeight;
      const otherElementsHeight = 235;
      const newHeight = Math.max(200, windowHeight - otherElementsHeight);
      setTableScrollHeight(newHeight);
    };
    calculateTableHeight();
    fetchTableData();
    const handleResize = () => calculateTableHeight();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 筛选表单配置（可选）
  const filterFormConfig = [
    { type: 'input', field: 'title', label: '标题', placeholder: '请输入标题关键字', span: 6 },
    { type: 'select', field: 'status', label: '状态', placeholder: '请选择状态', span: 6, options: statusOptions },
    { type: 'select', field: 'priority', label: '优先级', placeholder: '请选择优先级', span: 6, options: priorityOptions },
    { type: 'input', field: 'createUser', label: '创建人', placeholder: '请输入创建人', span: 6 },
  ];

  return (
    <Layout className="todo-manager">
      <Content>
        {/* 筛选表单 */}
        <FilterForm ref={filterFormRef} config={filterFormConfig} onSearch={searchTableData} onReset={() => fetchTableData()}>
          <Form.Item field="title" label="标题">
            <Input placeholder="请输入标题关键字" />
          </Form.Item>
          <Form.Item field="status" label="状态">
            <Select placeholder="请选择状态" allowClear>
              {statusOptions.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item field="priority" label="优先级">
            <Select placeholder="请选择优先级" allowClear>
              {priorityOptions.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item field="createUser" label="创建人">
            <Input placeholder="请输入创建人" />
          </Form.Item>
        </FilterForm>

        {/* 操作按钮 */}
        <div className="action-buttons">
          <Button type="primary" icon={<IconPlus />} onClick={handleAdd}>
            新增待办
          </Button>
        </div>

        {/* 表格 */}
        <Table
          columns={columns}
          data={tableData}
          loading={tableLoading}
          pagination={false}
          scroll={{ y: tableScrollHeight }}
          rowKey="id"
          size="small"
        />

        {/* 分页 */}
        <div className="pagination-wrapper">
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={handlePageChange}
            showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
            showSizeChanger
            pageSizeOptions={["10", "20", "50", "100"]}
          />
        </div>

        {/* 新增对话框 */}
        <Modal
          title="新增待办"
          visible={addModalVisible}
          onOk={handleAddConfirm}
          onCancel={() => setAddModalVisible(false)}
        >
          <Form ref={addFormRef} layout="vertical" className="modal-form">
            <Form.Item label="标题" field="title" rules={[{ required: true, message: '请输入标题' }] }>
              <Input placeholder="请输入标题" />
            </Form.Item>
            <Form.Item label="详细描述" field="description">
              <TextArea placeholder="请输入详细描述" autoSize={{ minRows: 3, maxRows: 6 }} />
            </Form.Item>
            <Form.Item label="状态" field="status">
              <Select placeholder="请选择状态" allowClear>
                {statusOptions.map(opt => (
                  <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="优先级" field="priority">
              <Select placeholder="请选择优先级" allowClear>
                {priorityOptions.map(opt => (
                  <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="截止时间" field="dueDate">
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
          </Form>
        </Modal>

        {/* 编辑对话框 */}
        <Modal
          title="编辑待办"
          visible={editModalVisible}
          onOk={handleEditConfirm}
          onCancel={() => setEditModalVisible(false)}
        >
          <Form ref={editFormRef} layout="vertical" className="modal-form">
            <Form.Item label="标题" field="title" rules={[{ required: true, message: '请输入标题' }] }>
              <Input placeholder="请输入标题" />
            </Form.Item>
            <Form.Item label="详细描述" field="description">
              <TextArea placeholder="请输入详细描述" autoSize={{ minRows: 3, maxRows: 6 }} />
            </Form.Item>
            <Form.Item label="状态" field="status">
              <Select placeholder="请选择状态" allowClear>
                {statusOptions.map(opt => (
                  <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="优先级" field="priority">
              <Select placeholder="请选择优先级" allowClear>
                {priorityOptions.map(opt => (
                  <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="截止时间" field="dueDate">
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
          </Form>
        </Modal>

        {/* 删除确认 */}
        <Modal
          title="确认删除"
          visible={deleteModalVisible}
          onOk={handleDeleteConfirm}
          onCancel={() => setDeleteModalVisible(false)}
        >
          <div className="delete-modal">确定要删除该待办吗？此操作不可恢复。</div>
        </Modal>

        {/* 详情对话框 */}
        <Modal
          title="待办详情"
          visible={detailModalVisible}
          onOk={() => setDetailModalVisible(false)}
          onCancel={() => setDetailModalVisible(false)}
          footer={null}
        >
          {detailRecord ? (
            <div className="todo-detail">
              <div className="detail-item"><label>标题：</label><span>{detailRecord.title || '-'}</span></div>
              <div className="detail-item"><label>状态：</label><span>{detailRecord.status || '-'}</span></div>
              <div className="detail-item"><label>优先级：</label><span>{detailRecord.priority || '-'}</span></div>
              <div className="detail-item"><label>截止时间：</label><span>{formatDateTime(detailRecord.dueDate)}</span></div>
              <div className="detail-item"><label>创建人：</label><span>{detailRecord.createUserName || detailRecord.createUser || '-'}</span></div>
              <div className="detail-item"><label>创建时间：</label><span>{formatDateTime(detailRecord.createDate)}</span></div>
              <div className="detail-item"><label>更新时间：</label><span>{formatDateTime(detailRecord.updateDate)}</span></div>
              <div className="detail-item"><label>详细描述：</label><span style={{ whiteSpace: 'pre-wrap' }}>{detailRecord.description || '-'}</span></div>
            </div>
          ) : (
            <div style={{ color: '#86909c' }}>暂无详情</div>
          )}
        </Modal>
      </Content>
    </Layout>
  );
}

export default TodoManager;