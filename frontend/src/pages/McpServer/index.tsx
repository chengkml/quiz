import React, { useEffect, useRef, useState } from 'react';
import { DataManager } from '@/components/DataManager';
import {
  Button,
  Form,
  Grid,
  Input,
  Message,
  Modal,
  Select,
  Space,
  Tag,
} from '@arco-design/web-react';
import {
  IconDelete,
  IconEdit,
  IconHeartbeat,
  IconList,
  IconRefresh,
  IconSearch,
} from '@arco-design/web-react/icon';
import './style/index.less';
import {
  createMcpServer,
  deleteMcpServer,
  healthCheckMcpServer,
  searchMcpServers,
  updateMcpServer,
} from './api';

const { Row, Col } = Grid;
const { Option } = Select;

function McpServerManager() {
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    showTotal: true,
    showJumper: true,
    showPageSize: true,
  });
  const [tableScrollHeight, setTableScrollHeight] = useState(420);

  const [currentRecord, setCurrentRecord] = useState<any | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const addFormRef = useRef<any>(null);
  const editFormRef = useRef<any>(null);
  const filterFormRef = useRef<any>(null);

  const envOptions = [
    { label: '开发', value: 'dev' },
    { label: '测试', value: 'test' },
    { label: '预发', value: 'stage' },
    { label: '生产', value: 'prod' },
  ];

  const statusOptions = [
    { label: '已创建', value: 'CREATED' },
    { label: '可用', value: 'ACTIVE' },
    { label: '降级', value: 'DEGRADED' },
    { label: '禁用', value: 'INACTIVE' },
  ];

  const formatDateTime = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '-';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const fetchTableData = async (
    params: any = {},
    pageSize: number = pagination.pageSize,
    current: number = pagination.current,
  ) => {
    setTableLoading(true);
    try {
      const query = {
        keyWord: params.keyWord || '',
        env: params.env || '',
        status: params.status || '',
        pageNum: current - 1,
        pageSize,
      };
      const response = await searchMcpServers(query);
      if (response.data) {
        setTableData(response.data.content || []);
        setPagination(prev => ({
          ...prev,
          current,
          pageSize,
          total: response.data.totalElements || 0,
        }));
      }
    } catch (e) {
      Message.error('获取 MCP 服务器列表失败');
    } finally {
      setTableLoading(false);
    }
  };

  const searchTableData = (params: any) => {
    fetchTableData(params, pagination.pageSize, 1);
  };

  const handlePaginationChange = (nextPagination: any) => {
    const values = filterFormRef.current?.getFieldsValue?.() || {};
    fetchTableData(values, nextPagination.pageSize, nextPagination.current);
  };

  const handleAdd = () => {
    setCurrentRecord(null);
    setAddModalVisible(true);
    setTimeout(() => {
      addFormRef.current?.resetFields?.();
    }, 50);
  };

  const handleAddConfirm = async () => {
    try {
      const values = await addFormRef.current?.validate?.();
      if (values) {
        await createMcpServer(values);
        Message.success('创建 MCP 服务器成功');
        setAddModalVisible(false);
        addFormRef.current?.resetFields?.();
        fetchTableData();
      }
    } catch (error) {
      if ((error as any)?.fields) return;
      Message.error('创建 MCP 服务器失败');
    }
  };

  const handleEdit = (record: any) => {
    setCurrentRecord(record);
    setEditModalVisible(true);
    setTimeout(() => {
      editFormRef.current?.setFieldsValue?.({
        id: record.id,
        name: record.name,
        identifier: record.identifier,
        description: record.description,
        env: record.env,
        address: record.address,
        protocol: record.protocol,
        authType: record.authType,
      });
    }, 50);
  };

  const handleEditConfirm = async () => {
    try {
      const values = await editFormRef.current?.validate?.();
      if (values && currentRecord) {
        await updateMcpServer(values);
        Message.success('更新 MCP 服务器成功');
        setEditModalVisible(false);
        editFormRef.current?.resetFields?.();
        fetchTableData();
      }
    } catch (error) {
      if ((error as any)?.fields) return;
      Message.error('更新 MCP 服务器失败');
    }
  };

  const handleDelete = (record: any) => {
    setCurrentRecord(record);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!currentRecord) return;
    try {
      await deleteMcpServer(currentRecord.id);
      Message.success('删除 MCP 服务器成功');
      setDeleteModalVisible(false);
      fetchTableData();
    } catch (error) {
      Message.error('删除 MCP 服务器失败');
    }
  };

  const handleHealthCheck = async (record: any) => {
    try {
      await healthCheckMcpServer(record.id);
      Message.success('健康检查已触发');
      fetchTableData();
    } catch (error) {
      Message.error('健康检查失败');
    }
  };

  const statusTagMap: Record<
    string,
    { label: string; color: string }
  > = {
    CREATED: { label: '已创建', color: 'blue' },
    ACTIVE: { label: '可用', color: 'green' },
    DEGRADED: { label: '降级', color: 'orangered' },
    INACTIVE: { label: '禁用', color: 'gray' },
  };

  const columns = [
    { title: '名称', dataIndex: 'name', ellipsis: true },
    { title: '标识', dataIndex: 'identifier', ellipsis: true },
    {
      title: '环境',
      dataIndex: 'env',
      width: 120,
      render: (v: string) => v || '-',
    },
    { title: '地址', dataIndex: 'address', ellipsis: true },
    {
      title: '协议',
      dataIndex: 'protocol',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (v: string) => {
        const info = statusTagMap[v] || { label: v || '-', color: 'gray' };
        return (
          <Tag color={info.color} bordered>
            {info.label}
          </Tag>
        );
      },
    },
    {
      title: '最近心跳时间',
      dataIndex: 'lastHeartbeatAt',
      width: 180,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '创建时间',
      dataIndex: 'createDate',
      width: 180,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '操作',
      width: 200,
      align: 'center' as any,
      fixed: 'right' as any,
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            icon={<IconHeartbeat />}
            onClick={e => {
              e.stopPropagation();
              handleHealthCheck(record);
            }}
          >
            健康检查
          </Button>
          <Button
            size="small"
            icon={<IconEdit />}
            onClick={e => {
              e.stopPropagation();
              handleEdit(record);
            }}
          >
            编辑
          </Button>
          <Button
            size="small"
            status="danger"
            icon={<IconDelete />}
            onClick={e => {
              e.stopPropagation();
              handleDelete(record);
            }}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    const calcHeight = () => {
      const windowHeight = window.innerHeight;
      const otherHeight = 250;
      const newHeight = Math.max(100, windowHeight - otherHeight);
      setTableScrollHeight(newHeight);
    };
    calcHeight();
    const defaultParams: any = {};
    fetchTableData(defaultParams);
    setTimeout(() => {
      filterFormRef.current?.setFieldsValue?.(defaultParams);
    }, 50);
    const handleResize = () => calcHeight();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filterContent = (
    <Form
      ref={filterFormRef}
      layout="horizontal"
      className="filter-form"
      style={{ marginTop: '10px' }}
      onValuesChange={() => {
        const values = filterFormRef.current?.getFieldsValue?.() || {};
        searchTableData(values);
      }}
    >
      <Row gutter={16}>
        <Col span={6}>
          <Form.Item field="keyWord" label="关键字">
            <Input placeholder="名称或标识模糊搜索" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item field="env" label="环境">
            <Select placeholder="请选择环境" allowClear>
              {envOptions.map(opt => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item field="status" label="状态">
            <Select placeholder="请选择状态" allowClear>
              {statusOptions.map(opt => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col
          span={6}
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'flex-end',
            paddingBottom: '16px',
          }}
        >
          <Space>
            <Button
              type="primary"
              icon={<IconSearch />}
              onClick={() => {
                const values =
                  filterFormRef.current?.getFieldsValue?.() || {};
                searchTableData(values);
              }}
            >
              搜索
            </Button>
            <Button
              icon={<IconRefresh />}
              onClick={() => {
                filterFormRef.current?.resetFields?.();
                searchTableData({});
              }}
            >
              重置
            </Button>
          </Space>
        </Col>
      </Row>
    </Form>
  );

  return (
    <div className="mcp-server-manager">
      <DataManager
        data={tableData}
        loading={tableLoading}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        actions={{
          onAdd: handleAdd,
        }}
        config={{
          showModeToggle: false,
          displayMode: 'table',
          filterContent,
          tableColumns: columns,
        }}
        tableScrollHeight={tableScrollHeight}
      />

      <Modal
        title="新增 MCP 服务器"
        visible={addModalVisible}
        onOk={handleAddConfirm}
        onCancel={() => setAddModalVisible(false)}
      >
        <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 10 }}>
          <Form ref={addFormRef} layout="vertical" className="modal-form">
            <Form.Item
              label="名称"
              field="name"
              rules={[{ required: true, message: '请输入服务器名称' }]}
            >
              <Input placeholder="请输入服务器名称" />
            </Form.Item>
            <Form.Item
              label="标识"
              field="identifier"
              rules={[{ required: true, message: '请输入服务器标识' }]}
            >
              <Input placeholder="用于唯一标识服务器的英文标识" />
            </Form.Item>
            <Form.Item label="描述" field="description">
              <Input.TextArea
                placeholder="请输入描述"
                autoSize={{ minRows: 2, maxRows: 4 }}
              />
            </Form.Item>
            <Form.Item
              label="环境"
              field="env"
              rules={[{ required: true, message: '请选择环境' }]}
            >
              <Select placeholder="请选择环境" allowClear>
                {envOptions.map(opt => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              label="地址"
              field="address"
              rules={[{ required: true, message: '请输入服务器地址' }]}
            >
              <Input placeholder="如 https://mcp.example.com" />
            </Form.Item>
            <Form.Item
              label="协议"
              field="protocol"
              rules={[{ required: true, message: '请输入协议' }]}
            >
              <Input placeholder="如 HTTP、WS" />
            </Form.Item>
            <Form.Item
              label="认证类型"
              field="authType"
              rules={[{ required: true, message: '请输入认证类型' }]}
            >
              <Input placeholder="如 NONE、TOKEN、BASIC" />
            </Form.Item>
            <Form.Item label="认证配置(JSON)" field="authConfig">
              <Input.TextArea
                placeholder="可选，JSON 字符串或配置内容"
                autoSize={{ minRows: 2, maxRows: 6 }}
              />
            </Form.Item>
          </Form>
        </div>
      </Modal>

      <Modal
        title="编辑 MCP 服务器"
        visible={editModalVisible}
        onOk={handleEditConfirm}
        onCancel={() => setEditModalVisible(false)}
      >
        <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 10 }}>
          <Form ref={editFormRef} layout="vertical" className="modal-form">
            <Form.Item field="id" hidden>
              <Input />
            </Form.Item>
            <Form.Item
              label="名称"
              field="name"
              rules={[{ required: true, message: '请输入服务器名称' }]}
            >
              <Input placeholder="请输入服务器名称" />
            </Form.Item>
            <Form.Item
              label="标识"
              field="identifier"
              rules={[{ required: true, message: '请输入服务器标识' }]}
            >
              <Input placeholder="用于唯一标识服务器的英文标识" />
            </Form.Item>
            <Form.Item label="描述" field="description">
              <Input.TextArea
                placeholder="请输入描述"
                autoSize={{ minRows: 2, maxRows: 4 }}
              />
            </Form.Item>
            <Form.Item
              label="环境"
              field="env"
              rules={[{ required: true, message: '请选择环境' }]}
            >
              <Select placeholder="请选择环境" allowClear>
                {envOptions.map(opt => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              label="地址"
              field="address"
              rules={[{ required: true, message: '请输入服务器地址' }]}
            >
              <Input placeholder="如 https://mcp.example.com" />
            </Form.Item>
            <Form.Item
              label="协议"
              field="protocol"
              rules={[{ required: true, message: '请输入协议' }]}
            >
              <Input placeholder="如 HTTP、WS" />
            </Form.Item>
            <Form.Item
              label="认证类型"
              field="authType"
              rules={[{ required: true, message: '请输入认证类型' }]}
            >
              <Input placeholder="如 NONE、TOKEN、BASIC" />
            </Form.Item>
          </Form>
        </div>
      </Modal>

      <Modal
        title="确认删除"
        visible={deleteModalVisible}
        onOk={handleDeleteConfirm}
        onCancel={() => setDeleteModalVisible(false)}
      >
        <div>确定要删除该 MCP 服务器吗？此操作不可恢复。</div>
      </Modal>
    </div>
  );
}

export default McpServerManager;

