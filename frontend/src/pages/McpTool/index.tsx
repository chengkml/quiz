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
  IconCheck,
  IconCopy,
  IconDelete,
  IconEdit,
  IconRefresh,
  IconSearch,
  IconStop,
} from '@arco-design/web-react/icon';
import './style/index.less';
import {
  cloneMcpToolConfig,
  createMcpTool,
  deleteMcpTool,
  disableMcpTool,
  enableMcpTool,
  searchMcpTools,
  updateMcpTool,
} from './api';

const { Row, Col } = Grid;
const { Option } = Select;

function McpToolManager() {
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
  const [cloneModalVisible, setCloneModalVisible] = useState(false);
  const [cloneTargetEnv, setCloneTargetEnv] = useState<string | undefined>();

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
    { label: '已发现/已接入', value: 'REGISTERED' },
    { label: '启用', value: 'ENABLED' },
    { label: '禁用', value: 'DISABLED' },
    { label: '灰度', value: 'GRAY_RELEASE' },
    { label: '来源已删除', value: 'SOURCE_REMOVED' },
  ];

  const statusTagMap: Record<string, { label: string; color: string }> = {
    REGISTERED: { label: '已接入', color: 'blue' },
    ENABLED: { label: '启用', color: 'green' },
    DISABLED: { label: '禁用', color: 'gray' },
    GRAY_RELEASE: { label: '灰度', color: 'orangered' },
    SOURCE_REMOVED: { label: '来源已删除', color: 'red' },
  };

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
        serverId: params.serverId || '',
        category: params.category || '',
        pageNum: current - 1,
        pageSize,
      };
      const response = await searchMcpTools(query);
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
      Message.error('获取 MCP 工具列表失败');
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
        await createMcpTool(values);
        Message.success('创建 MCP 工具成功');
        setAddModalVisible(false);
        addFormRef.current?.resetFields?.();
        fetchTableData();
      }
    } catch (error) {
      if ((error as any)?.fields) return;
      Message.error('创建 MCP 工具失败');
    }
  };

  const handleEdit = (record: any) => {
    setCurrentRecord(record);
    setEditModalVisible(true);
    setTimeout(() => {
      editFormRef.current?.setFieldsValue?.({
        id: record.id,
        serverId: record.serverId,
        env: record.env,
        originName: record.originName,
        displayName: record.displayName,
        description: record.description,
        category: record.category,
        tags: record.tags,
        schemaJson: record.schemaJson,
        strategyJson: record.strategyJson,
        visibilityJson: record.visibilityJson,
      });
    }, 50);
  };

  const handleEditConfirm = async () => {
    try {
      const values = await editFormRef.current?.validate?.();
      if (values && currentRecord) {
        await updateMcpTool(values);
        Message.success('更新 MCP 工具成功');
        setEditModalVisible(false);
        editFormRef.current?.resetFields?.();
        fetchTableData();
      }
    } catch (error) {
      if ((error as any)?.fields) return;
      Message.error('更新 MCP 工具失败');
    }
  };

  const handleDelete = (record: any) => {
    setCurrentRecord(record);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!currentRecord) return;
    try {
      await deleteMcpTool(currentRecord.id);
      Message.success('删除 MCP 工具成功');
      setDeleteModalVisible(false);
      fetchTableData();
    } catch (error) {
      Message.error('删除 MCP 工具失败');
    }
  };

  const handleEnable = async (record: any) => {
    try {
      await enableMcpTool(record.id);
      Message.success('已启用工具');
      fetchTableData();
    } catch (error) {
      Message.error('启用工具失败');
    }
  };

  const handleDisable = async (record: any) => {
    try {
      await disableMcpTool(record.id);
      Message.success('已禁用工具');
      fetchTableData();
    } catch (error) {
      Message.error('禁用工具失败');
    }
  };

  const handleCloneConfig = (record: any) => {
    setCurrentRecord(record);
    setCloneTargetEnv(undefined);
    setCloneModalVisible(true);
  };

  const handleCloneConfirm = async () => {
    if (!currentRecord || !cloneTargetEnv) {
      Message.warning('请选择目标环境');
      return;
    }
    try {
      await cloneMcpToolConfig(currentRecord.id, cloneTargetEnv);
      Message.success('复制配置成功');
      setCloneModalVisible(false);
    } catch (error) {
      Message.error('复制配置失败');
    }
  };

  const columns = [
    {
      title: '显示名称',
      dataIndex: 'displayName',
      ellipsis: true,
    },
    {
      title: '原始名称',
      dataIndex: 'originName',
      ellipsis: true,
    },
    {
      title: '服务器ID',
      dataIndex: 'serverId',
      width: 160,
      ellipsis: true,
    },
    {
      title: '环境',
      dataIndex: 'env',
      width: 100,
    },
    {
      title: '分类',
      dataIndex: 'category',
      width: 120,
    },
    {
      title: '标签',
      dataIndex: 'tags',
      ellipsis: true,
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
      title: '创建时间',
      dataIndex: 'createDate',
      width: 180,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '操作',
      width: 260,
      fixed: 'right' as any,
      align: 'center' as any,
      render: (_: any, record: any) => (
        <Space>
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
          {record.status === 'ENABLED' ? (
            <Button
              size="small"
              icon={<IconStop />}
              onClick={e => {
                e.stopPropagation();
                handleDisable(record);
              }}
            >
              禁用
            </Button>
          ) : (
            <Button
              size="small"
              icon={<IconCheck />}
              onClick={e => {
                e.stopPropagation();
                handleEnable(record);
              }}
            >
              启用
            </Button>
          )}
          <Button
            size="small"
            icon={<IconCopy />}
            onClick={e => {
              e.stopPropagation();
              handleCloneConfig(record);
            }}
          >
            复制配置
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
            <Input placeholder="名称或原始名称模糊搜索" />
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
        <Col span={6}>
          <Form.Item field="serverId" label="服务器ID">
            <Input placeholder="按服务器ID过滤" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item field="category" label="分类">
            <Input placeholder="按分类过滤" />
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
    <div className="mcp-tool-manager">
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
        title="新增 MCP 工具"
        visible={addModalVisible}
        onOk={handleAddConfirm}
        onCancel={() => setAddModalVisible(false)}
      >
        <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 10 }}>
          <Form ref={addFormRef} layout="vertical" className="modal-form">
            <Form.Item
              label="服务器ID"
              field="serverId"
              rules={[{ required: true, message: '请输入服务器ID' }]}
            >
              <Input placeholder="关联的 MCP 服务器ID" />
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
              label="原始名称"
              field="originName"
              rules={[{ required: true, message: '请输入原始名称' }]}
            >
              <Input placeholder="MCP 工具原始名称" />
            </Form.Item>
            <Form.Item
              label="显示名称"
              field="displayName"
              rules={[{ required: true, message: '请输入显示名称' }]}
            >
              <Input placeholder="给业务和提示词使用的名称" />
            </Form.Item>
            <Form.Item label="描述" field="description">
              <Input.TextArea
                placeholder="工具用途说明"
                autoSize={{ minRows: 2, maxRows: 4 }}
              />
            </Form.Item>
            <Form.Item label="分类" field="category">
              <Input placeholder="如 订单、用户" />
            </Form.Item>
            <Form.Item label="标签" field="tags">
              <Input placeholder="多个标签用逗号分隔" />
            </Form.Item>
            <Form.Item label="Schema(JSON)" field="schemaJson">
              <Input.TextArea
                placeholder="可选，参数 Schema JSON"
                autoSize={{ minRows: 2, maxRows: 6 }}
              />
            </Form.Item>
            <Form.Item label="策略(JSON)" field="strategyJson">
              <Input.TextArea
                placeholder="可选，策略配置 JSON"
                autoSize={{ minRows: 2, maxRows: 6 }}
              />
            </Form.Item>
            <Form.Item label="可见范围(JSON)" field="visibilityJson">
              <Input.TextArea
                placeholder='可选，如 {"apps":["chat_bot"]}'
                autoSize={{ minRows: 2, maxRows: 6 }}
              />
            </Form.Item>
          </Form>
        </div>
      </Modal>

      <Modal
        title="编辑 MCP 工具"
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
              label="服务器ID"
              field="serverId"
              rules={[{ required: true, message: '请输入服务器ID' }]}
            >
              <Input placeholder="关联的 MCP 服务器ID" />
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
              label="原始名称"
              field="originName"
              rules={[{ required: true, message: '请输入原始名称' }]}
            >
              <Input placeholder="MCP 工具原始名称" />
            </Form.Item>
            <Form.Item
              label="显示名称"
              field="displayName"
              rules={[{ required: true, message: '请输入显示名称' }]}
            >
              <Input placeholder="给业务和提示词使用的名称" />
            </Form.Item>
            <Form.Item label="描述" field="description">
              <Input.TextArea
                placeholder="工具用途说明"
                autoSize={{ minRows: 2, maxRows: 4 }}
              />
            </Form.Item>
            <Form.Item label="分类" field="category">
              <Input placeholder="如 订单、用户" />
            </Form.Item>
            <Form.Item label="标签" field="tags">
              <Input placeholder="多个标签用逗号分隔" />
            </Form.Item>
            <Form.Item label="Schema(JSON)" field="schemaJson">
              <Input.TextArea
                placeholder="可选，参数 Schema JSON"
                autoSize={{ minRows: 2, maxRows: 6 }}
              />
            </Form.Item>
            <Form.Item label="策略(JSON)" field="strategyJson">
              <Input.TextArea
                placeholder="可选，策略配置 JSON"
                autoSize={{ minRows: 2, maxRows: 6 }}
              />
            </Form.Item>
            <Form.Item label="可见范围(JSON)" field="visibilityJson">
              <Input.TextArea
                placeholder='可选，如 {"apps":["chat_bot"]}'
                autoSize={{ minRows: 2, maxRows: 6 }}
              />
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
        <div>确定要删除该 MCP 工具吗？此操作不可恢复。</div>
      </Modal>

      <Modal
        title="复制配置到其他环境"
        visible={cloneModalVisible}
        onOk={handleCloneConfirm}
        onCancel={() => setCloneModalVisible(false)}
      >
        <Form layout="vertical">
          <Form.Item label="目标环境" required>
            <Select
              placeholder="请选择目标环境"
              value={cloneTargetEnv}
              onChange={value => setCloneTargetEnv(value)}
            >
              {envOptions.map(opt => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default McpToolManager;

