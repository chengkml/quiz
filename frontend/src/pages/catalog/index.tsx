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
  Progress,
} from '@arco-design/web-react';
import {
  IconPlus,
  IconRefresh,
  IconEdit,
  IconDelete,
  IconEye,
  IconPlayArrow,
  IconPause,
  IconDownload,
} from '@arco-design/web-react/icon';
import { CatalogDto, CatalogQueryParams } from '../../types/catalog';
import { CatalogService } from '../../services/catalogService';
import CreateCatalogModal from './components/CreateCatalogModal';
import ApplyModal from './components/ApplyModal';
import ViewCatalogModal from './components/ViewCatalogModal';
import styles from './index.module.css';

const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;
const Option = Select.Option;

const CatalogManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [catalogs, setCatalogs] = useState<CatalogDto[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  
  // 模态框状态
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedCatalog, setSelectedCatalog] = useState<CatalogDto | null>(null);

  // 状态选项
  const stateOptions = [
    { label: '全部', value: '' },
    { label: '训练中', value: 'TRAINING' },
    { label: '已完成', value: 'COMPLETED' },
    { label: '失败', value: 'FAILED' },
  ];

  // 获取合成目录列表
  const fetchCatalogs = useCallback(async (params?: Partial<CatalogQueryParams>) => {
    setLoading(true);
    try {
      const queryParams: CatalogQueryParams = {
        page: currentPage - 1, // 后端从0开始
        size: pageSize,
        ...params,
      };
      
      const response = await CatalogService.getCatalogs(queryParams);
      if (response.success) {
        // 后端返回的数据结构是嵌套的：{success: true, data: {content: [...], totalElements: ...}}
        const responseData = response.data;
        setCatalogs(responseData.content || []);
        setTotal(responseData.totalElements || 0);
      } else {
        Message.error('获取合成目录列表失败');
      }
    } catch (error) {
      console.error('获取合成目录列表失败:', error);
      Message.error('获取合成目录列表失败');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  // 初始化加载
  useEffect(() => {
    fetchCatalogs();
  }, [fetchCatalogs]);

  // 查询
  const handleSearch = () => {
    const values = form.getFieldsValue();
    setCurrentPage(1);
    fetchCatalogs(values);
  };

  // 重置
  const handleReset = () => {
    form.resetFields();
    setCurrentPage(1);
    fetchCatalogs();
  };

  // 刷新
  const handleRefresh = () => {
    const values = form.getFieldsValue();
    fetchCatalogs(values);
  };

  // 开始训练
  const handleStartTraining = async (catalog: CatalogDto) => {
    try {
      const response = await CatalogService.startTraining(catalog.modelId);
      if (response.success) {
        Message.success('开始训练模型成功');
        handleRefresh();
      } else {
        Message.error(response.message || '开始训练模型失败');
      }
    } catch (error) {
      console.error('开始训练模型失败:', error);
      Message.error('开始训练模型失败');
    }
  };

  // 停止训练
  const handleStopTraining = async (catalog: CatalogDto) => {
    try {
      const response = await CatalogService.stopTraining(catalog.modelId);
      if (response.success) {
        Message.success('停止训练模型成功');
        handleRefresh();
      } else {
        Message.error(response.message || '停止训练模型失败');
      }
    } catch (error) {
      console.error('停止训练模型失败:', error);
      Message.error('停止训练模型失败');
    }
  };

  // 重新训练
  const handleRetryTraining = async (catalog: CatalogDto) => {
    try {
      const response = await CatalogService.retryTraining(catalog.modelId);
      if (response.success) {
        Message.success('重新训练模型成功');
        handleRefresh();
      } else {
        Message.error(response.message || '重新训练模型失败');
      }
    } catch (error) {
      console.error('重新训练模型失败:', error);
      Message.error('重新训练模型失败');
    }
  };

  // 查看合成目录
  const handleViewCatalog = (catalog: CatalogDto) => {
    setSelectedCatalog(catalog);
    setViewModalVisible(true);
  };

  // 申请使用合成模型
  const handleApplyCatalog = (catalog: CatalogDto) => {
    setSelectedCatalog(catalog);
    setApplyModalVisible(true);
  };

  // 删除合成目录
  const handleDeleteCatalog = async (catalog: CatalogDto) => {
    try {
      const response = await CatalogService.deleteCatalog(catalog.modelId);
      if (response.success) {
        Message.success('删除合成目录成功');
        handleRefresh();
      } else {
        Message.error(response.message || '删除合成目录失败');
      }
    } catch (error) {
      console.error('删除合成目录失败:', error);
      Message.error('删除合成目录失败');
    }
  };

  // 导出合成目录
  const handleExportCatalog = async (catalog: CatalogDto) => {
    try {
      const blob = await CatalogService.exportCatalog(catalog.modelId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `catalog_${catalog.modelName}_${new Date().getTime()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      Message.success('导出合成目录成功');
    } catch (error) {
      console.error('导出合成目录失败:', error);
      Message.error('导出合成目录失败');
    }
  };

  // 分页变化
  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  // 渲染状态标签
  const renderStateTag = (state: string) => {
    let color = 'gray';
    let text = state;
    
    switch (state) {
      case 'TRAINING':
        color = 'blue';
        text = '训练中';
        break;
      case 'COMPLETED':
        color = 'green';
        text = '已完成';
        break;
      case 'FAILED':
        color = 'red';
        text = '失败';
        break;
      default:
        break;
    }
    
    return (
      <Tag color={color} size="small">
        {text}
      </Tag>
    );
  };

  // 渲染操作按钮
  const renderActions = (record: CatalogDto) => {
    const actions = [];
    
    // 查看按钮
    actions.push(
      <Tooltip key="view" content="查看">
        <Button
          type="text"
          size="small"
          icon={<IconEye />}
          onClick={() => handleViewCatalog(record)}
        />
      </Tooltip>
    );
    
    // 编辑按钮
    if (record.canEdit) {
      actions.push(
        <Tooltip key="edit" content="申请">
          <Button
            type="text"
            size="small"
            icon={<IconEdit />}
            onClick={() => handleApplyCatalog(record)}
          />
        </Tooltip>
      );
    }
    
    // 训练相关按钮
    if (record.state === 'TRAINING') {
      actions.push(
        <Popconfirm
          key="stop"
          title="确定要停止训练吗？"
          onOk={() => handleStopTraining(record)}
        >
          <Tooltip content="停止训练">
            <Button
              type="text"
              size="small"
              status="warning"
              icon={<IconPause />}
            />
          </Tooltip>
        </Popconfirm>
      );
    } else if (record.state === 'FAILED') {
      actions.push(
        <Popconfirm
          key="retry"
          title="确定要重新训练吗？"
          onOk={() => handleRetryTraining(record)}
        >
          <Tooltip content="重新训练">
            <Button
              type="text"
              size="small"
              status="success"
              icon={<IconReload />}
            />
          </Tooltip>
        </Popconfirm>
      );
    } else if (record.state === 'COMPLETED') {
      actions.push(
        <Tooltip key="export" content="导出">
          <Button
            type="text"
            size="small"
            icon={<IconDownload />}
            onClick={() => handleExportCatalog(record)}
          />
        </Tooltip>
      );
    }
    

    
    return <Space>{actions}</Space>;
  };

  // 表格列定义
  const columns = [

    {
      title: '模型名称',
      dataIndex: 'modelName',
      width: 150,
    },
    {
      title: '模型描述',
      dataIndex: 'modelDesc',
      width: 200,
      render: (desc: string) => (
        <Tooltip content={desc || '-'}>
          <span className={styles.ellipsis}>{desc || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '关联表',
      dataIndex: 'tabName',
      width: 120,
      render: (tabName: string) => tabName || '-',
    },
    {
      title: '创建人',
      dataIndex: 'createUser',
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
      title: '操作',
      dataIndex: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: CatalogDto) => renderActions(record),
    },
  ];

  return (
    <div className={styles.catalogManagement}>
      {/* 查询表单 */}
      <Card className={styles.queryForm}>
        <Form form={form}>
          <div className={styles.formRow}>
            <div className={styles.formItem}>
              <FormItem field="name" label="模型名称" className={styles.arcoFormItem}>
                <Input placeholder="请输入模型名称" allowClear />
              </FormItem>
            </div>
            <div className={styles.formItem}>
              <FormItem field="tabName" label="关联表" className={styles.arcoFormItem}>
                <Input placeholder="请输入关联表名称" allowClear />
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

      {/* 合成目录表格 */}
      <Card className={styles.catalogTable}>
        <div className={styles.tableHeader}>
          <div className={styles.tableTitle}>合成目录列表</div>
          <div className={styles.tableActions}>
            <Button icon={<IconRefresh />} onClick={handleRefresh}>
              刷新
            </Button>
          </div>
        </div>
        <Table
          columns={columns}
          data={catalogs}
          loading={loading}
          pagination={false}
          scroll={{ x: 1200 }}
          rowKey="modelId"
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

      {/* 新增合成目录模态框 */}
      <CreateCatalogModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={() => {
          setCreateModalVisible(false);
          handleRefresh();
        }}
      />

      {/* 申请使用合成模型模态框 */}
      <ApplyModal
        visible={applyModalVisible}
        catalog={selectedCatalog}
        onCancel={() => {
          setApplyModalVisible(false);
          setSelectedCatalog(null);
        }}
        onSuccess={() => {
          setApplyModalVisible(false);
          setSelectedCatalog(null);
          handleRefresh();
        }}
      />

      {/* 查看合成目录模态框 */}
      <ViewCatalogModal
        visible={viewModalVisible}
        catalog={selectedCatalog}
        onCancel={() => {
          setViewModalVisible(false);
          setSelectedCatalog(null);
        }}
      />
    </div>
  );
};

export default CatalogManagement;