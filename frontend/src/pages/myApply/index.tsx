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
  DatePicker,
} from '@arco-design/web-react';
import {
  IconPlus,
  IconRefresh,
  IconEye
} from '@arco-design/web-react/icon';
import { ApplyDto, ApplyQueryParams } from '../../types/apply';
import { ApplyService } from '../../services/applyService';
import { ViewApplyModal } from './components';
import styles from './index.module.css';

const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;
const Option = Select.Option;
const RangePicker = DatePicker.RangePicker;

const MyApplyManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [applies, setApplies] = useState<ApplyDto[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchParams, setSearchParams] = useState<any>({});
  
  // 模态框状态
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedApply, setSelectedApply] = useState<ApplyDto | null>(null);

  // 状态选项
  const stateOptions = [
    { label: '全部', value: '' },
    { label: '待处理', value: 0 },
    { label: '已批准', value: 1 },
    { label: '已拒绝', value: 2 },
  ];

  // 获取申请列表
  const fetchApplies = useCallback(async (params?: Partial<ApplyQueryParams>) => {
    setLoading(true);
    try {
      // 使用getMyApplies获取当前用户的申请
      const currentUser = 'admin'; // 这里应该从用户上下文获取当前用户
      const finalParams = params || searchParams;
      const response = await ApplyService.getMyApplies(currentUser, currentPage - 1, pageSize, finalParams);
      if (response.success) {
        // 后端返回的数据结构是嵌套的：{success: true, data: {content: [...], totalElements: ...}}
        const responseData = response.data;
        setApplies(responseData.content || []);
        setTotal(responseData.totalElements || 0);
      } else {
        Message.error('获取申请列表失败');
      }
    } catch (error) {
      console.error('获取申请列表失败:', error);
      Message.error('获取申请列表失败');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchParams]);

  // 初始化加载
  useEffect(() => {
    fetchApplies();
  }, [fetchApplies]);

  // 查询
  const handleSearch = () => {
    const values = form.getFieldsValue();
    const newSearchParams: any = {};
    
    // 合并申请标题和模型名称到keyword进行模糊搜索
    const keywordParts = [];
    if (values.applyTitle) {
      keywordParts.push(values.applyTitle);
    }
    if (values.modelName) {
      keywordParts.push(values.modelName);
    }
    if (keywordParts.length > 0) {
      newSearchParams.keyword = keywordParts.join(' '); // 用空格连接多个关键词
    }
    
    if (values.jobCode) {
      newSearchParams.jobCode = values.jobCode;
    }
    if (values.state && values.state !== '') {
      newSearchParams.states = [values.state];
    }
    if (values.applyType && values.applyType !== '') {
      newSearchParams.applyType = values.applyType;
    }
    
    setSearchParams(newSearchParams);
    setCurrentPage(1);
    fetchApplies(newSearchParams);
  };

  // 重置
  const handleReset = () => {
    form.resetFields();
    setSearchParams({});
    setCurrentPage(1);
    fetchApplies({});
  };

  // 刷新
  const handleRefresh = () => {
    fetchApplies(searchParams);
  };

  // 查看申请详情
  const handleViewApply = (apply: ApplyDto) => {
    setSelectedApply(apply);
    setViewModalVisible(true);
  };









  // 分页变化
  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    if (size !== pageSize) {
      setPageSize(size);
    }
  };

  // 渲染状态标签
  const renderStateTag = (state: string | number) => {
    let color = 'gray';
    let text = String(state);
    
    switch (Number(state)) {
      case 0:
        color = 'orange';
        text = '待处理';
        break;
      case 1:
        color = 'green';
        text = '已批准';
        break;
      case 2:
        color = 'red';
        text = '已拒绝';
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
  const renderActions = (record: ApplyDto) => {
    const actions = [];
    
    // 查看按钮
    actions.push(
      <Tooltip key="view" content="查看">
        <Button
          type="text"
          size="small"
          icon={<IconEye />}
          onClick={() => handleViewApply(record)}
        />
      </Tooltip>
    );
    
    return <Space>{actions}</Space>;
  };

  // 表格列定义
  const columns = [
    {
      title: '申请标题',
      dataIndex: 'applyTitle',
      width: 200,
      render: (title: string) => (
        <Tooltip content={title || '-'}>
          <span className={styles.ellipsis}>{title || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '申请人',
      dataIndex: 'applyUser',
      width: 100,
    },
    {
      title: '任务编码',
      dataIndex: 'jobCode',
      width: 120,
      render: (jobCode: string) => jobCode || '-',
    },
    {
      title: '模型名称',
      dataIndex: 'modelName',
      width: 150,
      render: (modelName: string) => modelName || '-',
    },
    {
      title: '申请类型',
      dataIndex: 'applyType',
      width: 100,
      render: (applyType: string) => {
        if (!applyType) return '-';
        return (
          <Tag color={applyType === 'once' ? 'blue' : 'green'} size="small">
            {applyType === 'once' ? '一次性' : '周期性'}
          </Tag>
        );
      },
    },
    {
      title: '周期类型',
      dataIndex: 'cycleType',
      width: 100,
      render: (cycleType: string, record: ApplyDto) => {
        if (!cycleType || record.applyType !== 'cycle') return '-';
        return (
          <Tag color={cycleType === 'day' ? 'orange' : 'purple'} size="small">
            {cycleType === 'day' ? '每日' : '每月'}
          </Tag>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'state',
      width: 100,
      render: (state: string) => renderStateTag(state),
    },
    {
      title: '申请时间',
      dataIndex: 'applyTime',
      width: 170,
      render: (applyTime: string) => {
        if (!applyTime) return '-';
        const date = new Date(applyTime);
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
      title: '申请理由',
      dataIndex: 'applyDescr',
      width: 200,
      render: (descr: string) => (
        <Tooltip content={descr || '-'}>
          <span className={styles.ellipsis}>{descr || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: 250,
      fixed: 'right' as const,
      render: (_: any, record: ApplyDto) => renderActions(record),
    },
  ];

  return (
    <div className={styles.myApplyManagement}>
      {/* 查询表单 */}
      <Card className={styles.queryForm}>
        <Form form={form}>
          <div className={styles.formRow}>
            <div className={styles.formItem}>
              <FormItem field="applyTitle" label="申请标题" className={styles.arcoFormItem}>
                <Input placeholder="请输入申请标题" allowClear />
              </FormItem>
            </div>
            <div className={styles.formItem}>
              <FormItem field="jobCode" label="任务编码" className={styles.arcoFormItem}>
                <Input placeholder="请输入任务编码" allowClear />
              </FormItem>
            </div>
            <div className={styles.formItem}>
              <FormItem field="state" label="状态" className={styles.arcoFormItem}>
                <Select placeholder="请选择状态" allowClear>
                  {stateOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </FormItem>
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formItem}>
              <FormItem field="modelName" label="模型名称" className={styles.arcoFormItem}>
                <Input placeholder="请输入模型名称" allowClear />
              </FormItem>
            </div>
            <div className={styles.formItem}>
              <FormItem field="applyType" label="申请类型" className={styles.arcoFormItem}>
                <Select placeholder="请选择申请类型" allowClear>
                  <Option value="">全部</Option>
                  <Option value="once">一次性</Option>
                  <Option value="cycle">周期性</Option>
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

      {/* 申请列表表格 */}
      <Card className={styles.applyTable}>
        <div className={styles.tableHeader}>
          <div className={styles.tableTitle}>申请列表</div>
          <div className={styles.tableActions}>
         
            <Button icon={<IconRefresh />} onClick={handleRefresh}>
              刷新
            </Button>
          </div>
        </div>
        <Table
          columns={columns}
          data={applies}
          loading={loading}
          pagination={false}
          scroll={{ x: 1600 }}
          rowKey="applyId"
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

      {/* 查看申请模态框 */}
      <ViewApplyModal
        visible={viewModalVisible}
        apply={selectedApply}
        onCancel={() => {
          setViewModalVisible(false);
          setSelectedApply(null);
        }}
      />


    </div>
  );
};

export default MyApplyManagement;