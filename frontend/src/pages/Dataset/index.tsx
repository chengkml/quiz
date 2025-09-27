import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Form,
  Input,
  Select,
  Space,
  Message,
  Popconfirm,
  Tag,
  Grid,
  Pagination,
  Tooltip,
} from '@arco-design/web-react';
import {
  IconPlus,
  IconRefresh,
  IconEdit,
  IconDelete,
  IconLock,
  IconUnlock,
  IconEye,
  IconSettings,
} from '@arco-design/web-react/icon';
import { DatasetDto, DatasetQueryParams } from '../../types/dataset';
import { DatasetService } from '../../services/datasetService';
import CreateDatasetModal from './components/CreateDatasetModal';
import EditDatasetModal from './components/EditDatasetModal';
import ViewDatasetModal from './components/ViewDatasetModal';
import styles from './index.module.css';

const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;
const Option = Select.Option;

const DatasetManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [datasets, setDatasets] = useState<DatasetDto[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  
  // 模态框状态
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<DatasetDto | null>(null);

  // 权限选项
  const permissionOptions = [
    { label: '全部', value: '' },
    { label: '公有', value: 'public' },
    { label: '私有', value: 'private' },
  ];

  // 状态选项
  const statusOptions = [
    { label: '全部', value: '' },
    { label: '生效', value: 'active' },
    { label: '未生效', value: 'inactive' },
  ];

  // 获取数据集列表
  const fetchDatasets = useCallback(async (params?: Partial<DatasetQueryParams>) => {
    setLoading(true);
    try {
      const queryParams: DatasetQueryParams = {
        page: currentPage - 1, // 后端从0开始
        size: pageSize,
        ...params,
      };
      
      const response = await DatasetService.getDatasets(queryParams);
      if (response.success) {
        setDatasets(response.data);
        setTotal(response.totalElements);
      } else {
        Message.error('获取数据集列表失败');
      }
    } catch (error) {
      console.error('获取数据集列表失败:', error);
      Message.error('获取数据集列表失败');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  // 初始化加载
  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  // 查询
  const handleSearch = () => {
    const values = form.getFieldsValue();
    setCurrentPage(1);
    fetchDatasets(values);
  };

  // 重置
  const handleReset = () => {
    form.resetFields();
    setCurrentPage(1);
    fetchDatasets();
  };

  // 刷新
  const handleRefresh = () => {
    const values = form.getFieldsValue();
    fetchDatasets(values);
  };

  // 启用数据集
  const handleEnableDataset = async (dataset: DatasetDto) => {
    try {
      const response = await DatasetService.enableDataset(dataset.id);
      if (response.success) {
        Message.success('启用数据集成功');
        handleRefresh();
      } else {
        Message.error(response.message || '启用数据集失败');
      }
    } catch (error) {
      console.error('启用数据集失败:', error);
      Message.error('启用数据集失败');
    }
  };

  // 禁用数据集
  const handleDisableDataset = async (dataset: DatasetDto) => {
    try {
      const response = await DatasetService.disableDataset(dataset.id);
      if (response.success) {
        Message.success('禁用数据集成功');
        handleRefresh();
      } else {
        Message.error(response.message || '禁用数据集失败');
      }
    } catch (error) {
      console.error('禁用数据集失败:', error);
      Message.error('禁用数据集失败');
    }
  };

  // 查看数据集
  const handleViewDataset = (dataset: DatasetDto) => {
    setSelectedDataset(dataset);
    setViewModalVisible(true);
  };

  // 编辑数据集
  const handleEditDataset = (dataset: DatasetDto) => {
    setSelectedDataset(dataset);
    setEditModalVisible(true);
  };

  // 删除数据集
  const handleDeleteDataset = async (dataset: DatasetDto) => {
    try {
      const response = await DatasetService.deleteDataset(dataset.id);
      if (response.success) {
        Message.success('删除数据集成功');
        handleRefresh();
      } else {
        Message.error(response.message || '删除数据集失败');
      }
    } catch (error) {
      console.error('删除数据集失败:', error);
      Message.error('删除数据集失败');
    }
  };

  // 分页变化
  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  // 表格列定义
  const columns = [
    {
      title: '数据集英文名',
      dataIndex: 'datasetNameEn',
      width: 150,
    },
    {
      title: '数据集中文名',
      dataIndex: 'datasetNameCn',
      width: 150,
    },
    {
      title: '权限',
      dataIndex: 'permission',
      width: 80,
      align: 'center',
      render: (permission: string) => {
        const permissionText = permission === 'public' ? '公有' : '私有';
        const color = permission === 'public' ? 'blue' : 'orange';
        return (
          <Tag color={color} size="small">
            {permissionText}
          </Tag>
        );
      },
    },
    {
      title: '表名',
      dataIndex: 'tableName',
      width: 120,
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 170,
      render: (createTime: string) => {
        if (!createTime) return '-';
        const date = new Date(createTime);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      align: 'center',
      width: 80,
      render: (status: string) => {
        const statusText = status === 'active' ? '生效' : '未生效';
        const color = status === 'active' ? 'green' : 'red';
        return (
          <Tag color={color} size="small">
            {statusText}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: 220,
      fixed: 'right' as const,
      render: (_: any, record: DatasetDto) => (
        <Space>
          <Tooltip content="查看">
            <Button
              type="text"
              size="small"
              icon={<IconEye />}
              onClick={() => handleViewDataset(record)}
            />
          </Tooltip>
          <Tooltip content="编辑">
            <Button
              type="text"
              size="small"
              icon={<IconEdit />}
              onClick={() => handleEditDataset(record)}
            />
          </Tooltip>
          {record.status === 'active' ? (
            <Popconfirm
              title="确定要禁用该数据集吗？"
              onOk={() => handleDisableDataset(record)}
            >
              <Tooltip content="禁用">
                <Button
                  type="text"
                  size="small"
                  status="warning"
                  icon={<IconLock />}
                />
              </Tooltip>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="确定要启用该数据集吗？"
              onOk={() => handleEnableDataset(record)}
            >
              <Tooltip content="启用">
                <Button
                  type="text"
                  size="small"
                  status="success"
                  icon={<IconUnlock />}
                />
              </Tooltip>
            </Popconfirm>
          )}
          <Popconfirm
            title="确定要删除该数据集吗？"
            content="删除后将无法恢复，请谨慎操作！"
            onOk={() => handleDeleteDataset(record)}
          >
            <Tooltip content="删除">
              <Button
                type="text"
                size="small"
                status="danger"
                icon={<IconDelete />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.datasetManagement}>
      {/* 查询表单 */}
      <Card className={styles.queryForm}>
        <Form form={form}>
          <div className={styles.formRow}>
            <div className={styles.formItem}>
              <FormItem field="datasetNameCn" label="数据集名" className={styles.arcoFormItem}>
                <Input placeholder="请输入数据集名" allowClear />
              </FormItem>
            </div>
            <div className={styles.formItem}>
              <FormItem field="permission" label="权限" className={styles.arcoFormItem}>
                <Select placeholder="请选择权限" allowClear>
                  {permissionOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </FormItem>
            </div>
            <div className={styles.formItem}>
              <FormItem field="status" label="状态" className={styles.arcoFormItem}>
                <Select placeholder="请选择状态" allowClear>
                  {statusOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </FormItem>
            </div>
            <div className={styles.buttonGroup}>
              <Button type="primary" onClick={handleSearch}>
                查询
              </Button>
              <Button onClick={handleReset}>
                重置
              </Button>
            </div>
          </div>
        </Form>
      </Card>

      {/* 数据集表格 */}
      <Card className={styles.datasetTable}>
        <div className={styles.tableHeader}>
          <div className={styles.tableTitle}>数据集列表</div>
          <div className={styles.tableActions}>
            <Button
              type="primary"
              icon={<IconPlus />}
              onClick={() => setCreateModalVisible(true)}
            >
              新增数据集
            </Button>
            <Button icon={<IconRefresh />} onClick={handleRefresh}>
              刷新
            </Button>
          </div>
        </div>
        <Table
          columns={columns}
          data={datasets}
          loading={loading}
          pagination={false}
          scroll={{ x: 1200 }}
          rowKey="id"
        />
        
        {/* 分页 */}
        <div className={styles.paginationWrapper}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
            showQuickJumper
            sizeOptions={[10, 20, 50, 100]}
            onChange={handlePageChange}
          />
        </div>
      </Card>

      {/* 新增数据集模态框 */}
      <CreateDatasetModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={() => {
          setCreateModalVisible(false);
          handleRefresh();
        }}
      />

      {/* 编辑数据集模态框 */}
      <EditDatasetModal
        visible={editModalVisible}
        dataset={selectedDataset}
        onCancel={() => {
          setEditModalVisible(false);
          setSelectedDataset(null);
        }}
        onSuccess={() => {
          setEditModalVisible(false);
          setSelectedDataset(null);
          handleRefresh();
        }}
      />

      {/* 查看数据集模态框 */}
      <ViewDatasetModal
        visible={viewModalVisible}
        dataset={selectedDataset}
        onCancel={() => {
          setViewModalVisible(false);
          setSelectedDataset(null);
        }}
      />
    </div>
  );
};

export default DatasetManagement;