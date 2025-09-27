import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Card,
  Pagination,
  Modal,
  Tag,
  Tooltip,
  Popconfirm,
  Grid
} from '@arco-design/web-react';
import {
  IconSearch,
  IconRefresh,
  IconPlus,
  IconEdit,
  IconDelete,
  IconEye,
  IconPlayArrow,
  IconPause
} from '@arco-design/web-react/icon';
import { Message } from '@arco-design/web-react';
import {
  DataSourceDto,
  DataSourceQueryParams,
  DataSourceType,
  DataSourceState,
  ModalType,
  ActionButtonConfig
} from '../../types/datasource';
import { DataSourceService, handleApiError } from '../../services/datasourceService';
import DataSourceForm from './components/DataSourceForm';
import DataSourceDetail from './components/DataSourceDetail';
import styles from './index.module.less';

const Row = Grid.Row;
const Col = Grid.Col;
const { Option } = Select;

// 数据源类型选项
const DATA_SOURCE_TYPE_OPTIONS = [
  { label: 'MySQL', value: DataSourceType.MYSQL },
  { label: 'Oracle', value: DataSourceType.ORACLE },
  { label: 'MongoDB', value: DataSourceType.MONGODB },
  { label: 'PostgreSQL', value: DataSourceType.POSTGRESQL },
  { label: 'S3', value: DataSourceType.S3 },
  { label: 'FTP', value: DataSourceType.FTP },
  { label: 'SFTP', value: DataSourceType.SFTP }
];

// 数据源状态选项
const DATA_SOURCE_STATE_OPTIONS = [
  { label: '全部', value: '' },
  { label: '启用', value: DataSourceState.ENABLED },
  { label: '禁用', value: DataSourceState.DISABLED }
];

const DataSourceManagement: React.FC = () => {
  // 状态管理
  const [dataList, setDataList] = useState<DataSourceDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchParams, setSearchParams] = useState({
    name: '',
    type: '',
    state: ''
  });
  
  // 模态框状态
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(ModalType.CREATE);
  const [selectedRecord, setSelectedRecord] = useState<DataSourceDto | null>(null);

  // 加载数据源列表
  const loadDataSources = useCallback(async () => {
    setLoading(true);
    try {
      const params: DataSourceQueryParams = {
        page: currentPage,
        size: pageSize,
        ...(searchParams.name && { name: searchParams.name }),
        ...(searchParams.type && { type: searchParams.type as DataSourceType }),
        ...(searchParams.state && { state: searchParams.state as DataSourceState })
      };
      
      const response = await DataSourceService.getDataSources(params);
      if (response.success) {
        setDataList(response.data.content);
        setTotal(response.data.totalElements);
      } else {
        Message.error('加载数据源列表失败');
      }
    } catch (error) {
      Message.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchParams]);

  // 初始化加载
  useEffect(() => {
    loadDataSources();
  }, [loadDataSources]);

  // 搜索处理
  const handleSearch = () => {
    setCurrentPage(1);
    loadDataSources();
  };

  // 重置搜索
  const handleReset = () => {
    setSearchParams({ name: '', type: '', state: '' });
    setCurrentPage(1);
  };

  // 刷新数据
  const handleRefresh = () => {
    loadDataSources();
  };

  // 分页变化
  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  // 打开模态框
  const openModal = (type: ModalType, record?: DataSourceDto) => {
    setModalType(type);
    setSelectedRecord(record || null);
    setModalVisible(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setModalVisible(false);
    setSelectedRecord(null);
  };

  // 启用数据源
  const handleEnable = async (record: DataSourceDto) => {
    try {
      const response = await DataSourceService.enableDataSource(record.dsId);
      if (response.success) {
        Message.success('启用成功');
        loadDataSources();
      } else {
        Message.error(response.message || '启用失败');
      }
    } catch (error) {
      Message.error(handleApiError(error));
    }
  };

  // 禁用数据源
  const handleDisable = async (record: DataSourceDto) => {
    try {
      const response = await DataSourceService.disableDataSource(record.dsId);
      if (response.success) {
        Message.success('禁用成功');
        loadDataSources();
      } else {
        Message.error(response.message || '禁用失败');
      }
    } catch (error) {
      Message.error(handleApiError(error));
    }
  };

  // 删除数据源
  const handleDelete = async (record: DataSourceDto) => {
    try {
      const response = await DataSourceService.deleteDataSource(record.dsId);
      if (response.success) {
        Message.success('删除成功');
        loadDataSources();
      } else {
        Message.error(response.message || '删除失败');
      }
    } catch (error) {
      Message.error(handleApiError(error));
    }
  };

  // 测试连接
  const handleTestConnection = async (record: DataSourceDto) => {
    try {
      const response = await DataSourceService.testConnectionById(record.dsId);
      if (response.success) {
        if (response.data) {
          Message.success('连接测试成功');
        } else {
          Message.error('连接测试失败');
        }
      } else {
        Message.error(response.message || '连接测试失败');
      }
    } catch (error) {
      Message.error(handleApiError(error));
    }
  };

  // 获取状态标签
  const getStateTag = (state: DataSourceState, lastTestResult?: boolean) => {
    if (state === DataSourceState.DISABLED) {
      return <Tag color="gray">禁用</Tag>;
    }
    if (lastTestResult === true) {
      return <Tag color="green">正常</Tag>;
    }
    if (lastTestResult === false) {
      return <Tag color="red">连接失败</Tag>;
    }
    return <Tag color="blue">未测试</Tag>;
  };

  // 获取操作按钮
  const getActionButtons = (record: DataSourceDto): ActionButtonConfig[] => {
    const buttons: ActionButtonConfig[] = [];
    
    if (record.state === DataSourceState.DISABLED) {
      buttons.push(
        { key: 'enable', label: '启用', type: 'primary' },
        { key: 'edit', label: '编辑', type: 'default' }
      );
    } else {
      if (record.lastTestResult === false) {
        buttons.push(
          { key: 'disable', label: '禁用', type: 'default', status: 'warning' },
          { key: 'edit', label: '编辑', type: 'default' },
          { key: 'delete', label: '删除', type: 'text', status: 'danger' }
        );
      } else {
        buttons.push(
          { key: 'edit', label: '编辑', type: 'default' },
          { key: 'delete', label: '删除', type: 'text', status: 'danger' }
        );
      }
    }
    
    return buttons;
  };

  // 表格列配置
  const columns = [
    {
      title: '名称',
      dataIndex: 'dsName',
      key: 'dsName',
      width: 200,
      render: (text: string, record: DataSourceDto) => (
        <div>
          <div className={styles.dataSourceName}>{text}</div>
          {record.dsDesc && (
            <div className={styles.dataSourceDesc}>{record.dsDesc}</div>
          )}
        </div>
      )
    },
    {
      title: '类型',
      dataIndex: 'dsType',
      key: 'dsType',
      width: 120,
      render: (type: DataSourceType) => (
        <Tag color="blue">{type}</Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'state',
      key: 'state',
      width: 120,
      render: (state: DataSourceState, record: DataSourceDto) => 
        getStateTag(state, record.lastTestResult)
    },
    {
      title: '最后测试',
      dataIndex: 'lastTestTime',
      key: 'lastTestTime',
      width: 180,
      render: (time: string, record: DataSourceDto) => {
        if (!time) return '-';
        const result = record.lastTestResult ? '成功' : '失败';
        const color = record.lastTestResult ? 'green' : 'red';
        return (
          <div>
            <div>{new Date(time).toLocaleString()}</div>
            <Tag color={color} size="small">{result}</Tag>
          </div>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 300,
      render: (_, record: DataSourceDto) => {
        const buttons = getActionButtons(record);
        return (
          <Space>
            <Tooltip content="查看详情">
              <Button
                type="text"
                icon={<IconEye />}
                onClick={() => openModal(ModalType.VIEW, record)}
              />
            </Tooltip>
            <Tooltip content="测试连接">
              <Button
                type="text"
                icon={<IconRefresh />}
                onClick={() => handleTestConnection(record)}
              />
            </Tooltip>
            {buttons.map(button => {
              if (button.key === 'enable') {
                return (
                  <Button
                    key={button.key}
                    type={button.type}
                    size="small"
                    icon={<IconPlayArrow />}
                    onClick={() => handleEnable(record)}
                  >
                    {button.label}
                  </Button>
                );
              }
              if (button.key === 'disable') {
                return (
                  <Popconfirm
                    key={button.key}
                    title="确定要禁用该数据源吗？禁用后将停止数据同步任务。"
                    onOk={() => handleDisable(record)}
                  >
                    <Button
                      type={button.type}
                      size="small"
                      status={button.status}
                      icon={<IconPause />}
                    >
                      {button.label}
                    </Button>
                  </Popconfirm>
                );
              }
              if (button.key === 'edit') {
                return (
                  <Button
                    key={button.key}
                    type={button.type}
                    size="small"
                    icon={<IconEdit />}
                    onClick={() => openModal(ModalType.EDIT, record)}
                  >
                    {button.label}
                  </Button>
                );
              }
              if (button.key === 'delete') {
                return (
                  <Popconfirm
                    key={button.key}
                    title="确定要删除该数据源吗？删除后无法恢复。"
                    onOk={() => handleDelete(record)}
                  >
                    <Button
                      type={button.type}
                      size="small"
                      status={button.status}
                      icon={<IconDelete />}
                    >
                      {button.label}
                    </Button>
                  </Popconfirm>
                );
              }
              return null;
            })}
          </Space>
        );
      }
    }
  ];

  return (
    <div className={styles.container}>
      <Card title="数据源管理" className={styles.card}>
        {/* 搜索区域 */}
        <div className={styles.searchArea}>
          <Row gutter={16}>
            <Col span={6}>
              <Input
                placeholder="请输入数据源名称"
                value={searchParams.name}
                onChange={(value) => setSearchParams(prev => ({ ...prev, name: value }))}
                onPressEnter={handleSearch}
                allowClear
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="数据源类型"
                value={searchParams.type}
                onChange={(value) => setSearchParams(prev => ({ ...prev, type: value }))}
                allowClear
              >
                {DATA_SOURCE_TYPE_OPTIONS.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="状态"
                value={searchParams.state}
                onChange={(value) => setSearchParams(prev => ({ ...prev, state: value }))}
              >
                {DATA_SOURCE_STATE_OPTIONS.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={10}>
              <Space>
                <Button type="primary" icon={<IconSearch />} onClick={handleSearch}>
                  搜索
                </Button>
                <Button onClick={handleReset}>
                  重置
                </Button>
                <Button icon={<IconRefresh />} onClick={handleRefresh}>
                  刷新
                </Button>
                <Button
                  type="primary"
                  icon={<IconPlus />}
                  onClick={() => openModal(ModalType.CREATE)}
                >
                  新增数据源
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        {/* 数据表格 */}
        <Table
          columns={columns}
          data={dataList}
          loading={loading}
          pagination={false}
          rowKey="dsId"
          className={styles.table}
        />

        {/* 分页 */}
        <div className={styles.pagination}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            onChange={handlePageChange}
            showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
            showSizeChanger
            pageSizeOptions={['10', '20', '50', '100']}
          />
        </div>
      </Card>

      {/* 数据源表单模态框 */}
      <Modal
        title={
          modalType === ModalType.CREATE
            ? '新建数据源'
            : modalType === ModalType.EDIT
            ? `编辑数据源 - ${selectedRecord?.dsName}`
            : `数据源详情 - ${selectedRecord?.dsName}`
        }
        visible={modalVisible}
        onCancel={closeModal}
        footer={null}
        width={800}
        className={styles.modal}
      >
        {modalType === ModalType.VIEW ? (
          <DataSourceDetail
            dataSource={selectedRecord}
            onClose={closeModal}
          />
        ) : (
          <DataSourceForm
            type={modalType}
            dataSource={selectedRecord}
            onSuccess={() => {
              closeModal();
              loadDataSources();
            }}
            onCancel={closeModal}
          />
        )}
      </Modal>
    </div>
  );
};

export default DataSourceManagement;