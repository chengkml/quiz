import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Form,
  Space,
  Tag,
  Modal,
  Message,
  Popconfirm,
  Pagination
} from '@arco-design/web-react';
import { IconSearch, IconRefresh, IconPlus, IconDelete } from '@arco-design/web-react/icon';
import datasetService from '../../services/datasetService';
import DatasetForm from './components/DatasetForm';
import DatasetDetail from './components/DatasetDetail';
import styles from './index.module.css';

const { Option } = Select;
const { Search } = Input;

const DatasetManagement = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [datasets, setDatasets] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    showTotal: (total, range) => `共 ${total} 条记录，第 ${range[0]}-${range[1]} 条`,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100']
  });
  
  // 弹窗状态
  const [formVisible, setFormVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editingDataset, setEditingDataset] = useState(null);
  const [viewingDataset, setViewingDataset] = useState(null);
  
  // 搜索和过滤状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filters, setFilters] = useState({
    sourceType: '',
    state: '',
    createUser: ''
  });

  // 来源类型选项
  const sourceTypeOptions = [
    { label: '全部', value: '' },
    { label: '数据链接', value: 'DATA_LINK' },
    { label: '文件上传', value: 'FILE_UPLOAD' }
  ];

  // 状态选项
  const stateOptions = [
    { label: '全部', value: '' },
    { label: '启用', value: '1' },
    { label: '禁用', value: '0' }
  ];

  // 表格列定义
  const columns = [
    {
      title: '名称',
      dataIndex: 'datasetName',
      key: 'datasetName',
      width: 200,
      ellipsis: true
    },
    {
      title: '来源',
      dataIndex: 'sourceType',
      key: 'sourceType',
      width: 120,
      render: (sourceType) => {
        const typeMap = {
          'DATA_LINK': '数据链接',
          'FILE_UPLOAD': '文件上传'
        };
        return typeMap[sourceType] || sourceType;
      }
    },
    {
      title: '状态',
      dataIndex: 'state',
      key: 'state',
      width: 100,
      render: (state) => {
        return state === '1' ? 
          <Tag color="green">启用</Tag> : 
          <Tag color="gray">禁用</Tag>;
      }
    },
    {
      title: '描述',
      dataIndex: 'descr',
      key: 'descr',
      ellipsis: true,
      render: (text) => text || '-'
    },
    {
      title: '创建人',
      dataIndex: 'createUser',
      key: 'createUser',
      width: 120,
      render: (text) => text || '-'
    },
    {
      title: '创建时间',
      dataIndex: 'createDt',
      key: 'createDt',
      width: 180,
      render: (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    },
    {
      title: '更新人',
      dataIndex: 'updateUser',
      key: 'updateUser',
      width: 120,
      render: (text) => text || '-'
    },
    {
      title: '更新时间',
      dataIndex: 'updateDt',
      key: 'updateDt',
      width: 180,
      render: (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="text" size="small" onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button type="text" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          {record.state === '1' ? (
            <Button type="text" size="small" onClick={() => handleDisable(record.datasetId)}>
              禁用
            </Button>
          ) : (
            <Button type="text" size="small" onClick={() => handleEnable(record.datasetId)}>
              启用
            </Button>
          )}
          <Popconfirm
            title="确定要删除这个数据集吗？"
            onOk={() => handleDelete(record.datasetId)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" size="small" status="danger">
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 加载数据集列表
  const loadDatasets = async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        page: pagination.current - 1,
        size: pagination.pageSize,
        ...filters,
        ...params
      };
      
      const response = await datasetService.getDatasets(queryParams);
      if (response.success) {
        setDatasets(response.data.content || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.totalElements || 0,
          current: (response.data.currentPage || 0) + 1
        }));
      } else {
        Message.error(response.message || '加载数据失败');
      }
    } catch (error) {
      console.error('加载数据集失败:', error);
      Message.error('网络连接失败，请检查网络后重试');
    } finally {
      setLoading(false);
    }
  };

  // 全局搜索
  const handleGlobalSearch = async (keyword) => {
    if (!keyword.trim()) {
      loadDatasets();
      return;
    }
    
    setLoading(true);
    try {
      const response = await datasetService.searchDatasets(keyword);
      if (response.success) {
        setDatasets(response.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.data?.length || 0,
          current: 1
        }));
      } else {
        Message.error(response.message || '搜索失败');
      }
    } catch (error) {
      console.error('搜索失败:', error);
      Message.error('搜索失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 条件查询
  const handleQuery = () => {
    const formValues = form.getFieldsValue();
    setFilters(formValues);
    setPagination(prev => ({ ...prev, current: 1 }));
    loadDatasets({ ...formValues, page: 0 });
  };

  // 重置查询
  const handleReset = () => {
    form.resetFields();
    setFilters({ sourceType: '', state: '', createUser: '' });
    setSearchKeyword('');
    setPagination(prev => ({ ...prev, current: 1 }));
    loadDatasets({ page: 0 });
  };

  // 新建数据集
  const handleCreate = () => {
    setEditingDataset(null);
    setFormVisible(true);
  };

  // 编辑数据集
  const handleEdit = (record) => {
    setEditingDataset(record);
    setFormVisible(true);
  };

  // 查看详情
  const handleViewDetail = (record) => {
    setViewingDataset(record);
    setDetailVisible(true);
  };

  // 删除数据集
  const handleDelete = async (datasetId) => {
    try {
      const response = await datasetService.deleteDataset(datasetId);
      if (response.success) {
        Message.success('删除成功');
        loadDatasets();
      } else {
        Message.error(response.message || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      Message.error('删除失败，请重试');
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      Message.warning('请选择要删除的数据集');
      return;
    }
    
    Modal.confirm({
      title: '批量删除确认',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个数据集吗？`,
      onOk: async () => {
        try {
          const response = await datasetService.batchDeleteDatasets(selectedRowKeys);
          if (response.success) {
            Message.success('批量删除成功');
            setSelectedRowKeys([]);
            loadDatasets();
          } else {
            Message.error(response.message || '批量删除失败');
          }
        } catch (error) {
          console.error('批量删除失败:', error);
          Message.error('批量删除失败，请重试');
        }
      }
    });
  };

  // 启用数据集
  const handleEnable = async (datasetId) => {
    try {
      const response = await datasetService.enableDataset(datasetId);
      if (response.success) {
        Message.success('启用成功');
        loadDatasets();
      } else {
        Message.error(response.message || '启用失败');
      }
    } catch (error) {
      console.error('启用失败:', error);
      Message.error('启用失败，请重试');
    }
  };

  // 禁用数据集
  const handleDisable = async (datasetId) => {
    try {
      const response = await datasetService.disableDataset(datasetId);
      if (response.success) {
        Message.success('禁用成功');
        loadDatasets();
      } else {
        Message.error(response.message || '禁用失败');
      }
    } catch (error) {
      console.error('禁用失败:', error);
      Message.error('禁用失败，请重试');
    }
  };

  // 表单提交成功回调
  const handleFormSuccess = () => {
    setFormVisible(false);
    loadDatasets();
  };

  // 分页变化
  const handlePageChange = (current, pageSize) => {
    setPagination(prev => ({ ...prev, current, pageSize }));
    loadDatasets({ page: current - 1, size: pageSize });
  };

  // 行选择
  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    checkboxProps: (record) => ({
      disabled: false
    })
  };

  // 初始化加载
  useEffect(() => {
    loadDatasets();
  }, []);

  return (
    <div className={styles.datasetManagement}>
      {/* 搜索和过滤区 */}
      <Card className={styles.filterCard}>
        <Form form={form} className={styles.filterForm}>
          <div className={styles.formRow}>
            <div className={styles.formItem}>
              <Search
                placeholder="搜索数据集名称或描述"
                allowClear
                style={{ width: 300 }}
                value={searchKeyword}
                onChange={setSearchKeyword}
                onSearch={handleGlobalSearch}
                enterButton={<IconSearch />}
              />
            </div>
            <div className={styles.formItem}>
              <Form.Item field="sourceType" label="来源" className={styles.arcoFormItem}>
                <Select placeholder="请选择来源" style={{ width: 120 }} allowClear>
                  {sourceTypeOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
            <div className={styles.formItem}>
              <Form.Item field="state" label="状态" className={styles.arcoFormItem}>
                <Select placeholder="请选择状态" style={{ width: 120 }} allowClear>
                  {stateOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
            <div className={styles.formItem}>
              <Form.Item field="createUser" label="创建人" className={styles.arcoFormItem}>
                <Input placeholder="请输入创建人" style={{ width: 150 }} allowClear />
              </Form.Item>
            </div>
            <div className={styles.buttonGroup}>
              <Button type="primary" onClick={handleQuery}>
                查询
              </Button>
              <Button onClick={handleReset}>
                重置
              </Button>
            </div>
          </div>
        </Form>
      </Card>

      {/* 数据表格 */}
      <Card className={styles.datasetTable}>
        <div className={styles.tableHeader}>
          <div className={styles.tableTitle}>数据集列表</div>
          <div className={styles.tableActions}>
            <Button type="primary" icon={<IconPlus />} onClick={handleCreate}>
              新建数据集
            </Button>
            <Button icon={<IconRefresh />} onClick={() => loadDatasets()}>
              刷新
            </Button>
            <Button 
              icon={<IconDelete />} 
              status="danger" 
              disabled={selectedRowKeys.length === 0}
              onClick={handleBatchDelete}
            >
              批量删除
            </Button>
          </div>
        </div>
        
        <Table
          columns={columns}
          data={datasets}
          loading={loading}
          rowKey="datasetId"
          rowSelection={rowSelection}
          pagination={false}
          scroll={{ x: 1400 }}
          className={styles.table}
        />
        
        {/* 分页 */}
        <div className={styles.paginationSection}>
          <Pagination
            {...pagination}
            onChange={handlePageChange}
            onPageSizeChange={(current, size) => handlePageChange(current, size)}
          />
        </div>
      </Card>

      {/* 新建/编辑表单弹窗 */}
      <DatasetForm
        visible={formVisible}
        dataset={editingDataset}
        onCancel={() => setFormVisible(false)}
        onSuccess={handleFormSuccess}
      />

      {/* 详情查看弹窗 */}
      <DatasetDetail
        visible={detailVisible}
        dataset={viewingDataset}
        onCancel={() => setDetailVisible(false)}
      />
    </div>
  );
};

export default DatasetManagement;