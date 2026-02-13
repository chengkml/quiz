import React, { useEffect, useRef, useState } from 'react';
import { Button, Form, Grid, Input, Message, Modal, Popconfirm, Select, Space, Tag, Tooltip } from '@arco-design/web-react';
import { IconDelete, IconEdit, IconPlus, IconRefresh } from '@arco-design/web-react/icon';
import { DataManager } from '@/components/DataManager';
import FilterForm from '@/components/FilterForm';
import { FormFieldConfig } from '@/components/types/types';
import './style/index.less';
import { getCronTaskList, deleteCronTask, saveCronTask, triggerCronTask, getTaskOptions, CronTaskDto } from './api';
import { getQueueList } from '../Job/api';
import renderDate from '@/utils/timeUtil';

const { TextArea } = Input;
const { Option } = Select;
const { Row, Col } = Grid;

function CronTaskManager() {
  // 表格数据与状态
  const [tableData, setTableData] = useState<CronTaskDto[]>([]);
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

  // 当前记录与弹窗
  const [currentRecord, setCurrentRecord] = useState<CronTaskDto | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [triggerModalVisible, setTriggerModalVisible] = useState(false);

  // 表单引用
  const addFormRef = useRef<any>(null);
  const filterFormRef = useRef<any>(null);

  // 选项
  const [statusOptions] = useState([
    { label: '启用', value: 'ENABLED' },
    { label: '禁用', value: 'DISABLED' },
  ]);

  // 队列选项
  const [queueOptions, setQueueOptions] = useState<any[]>([]);
  // 任务类型选项
  const [taskOptions, setTaskOptions] = useState<any[]>([]);

  // 筛选表单字段配置
  const [filterFormFields, setFilterFormFields] = useState<FormFieldConfig[]>([]);

  // 表格列定义
  const columns = [
    { title: '任务名称', dataIndex: 'label', width: 120, ellipsis: true },
    { title: '任务类名', dataIndex: 'taskClass', width: 250, ellipsis: true },
    { title: '队列名称', dataIndex: 'queueName', width: 180, ellipsis: true },
    { title: 'Cron表达式', dataIndex: 'cronExpression', width: 180, ellipsis: true },
    { title: '状态', dataIndex: 'state', width: 120, render: (state: string) => {
      const map = {
        ENABLED: { color: 'green', text: '启用' },
        DISABLED: { color: 'gray', text: '禁用' },
      };
      const it = map[state] || { color: 'gray', text: state };
      return <Tag color={it.color} bordered>{it.text}</Tag>;
    } },
    { title: '下次运行时间', dataIndex: 'nextFireTime', width: 180, render: (value: string) => renderDate(value) },
    { title: '操作', width: 140, align: 'center', fixed: 'right' as any, render: (_: any, record: CronTaskDto) => (
      <Space size="small" className="table-btn-group">
        <Tooltip title="编辑">
          <Button
            type="text"
            size="small"
            icon={<IconEdit />}
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(record);
            }}
          />
        </Tooltip>
        
        <Tooltip title="触发">
          <Button
            type="text"
            size="small"
            icon={<IconRefresh />}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentRecord(record);
              setTriggerModalVisible(true);
            }}
          />
        </Tooltip>
        
        <Popconfirm
          title="确认删除该定时任务吗？"
          onOk={() => {
            setCurrentRecord(record);
            setDeleteModalVisible(true);
          }}
        >
          <Tooltip title="删除">
            <Button
              type="text"
              size="small"
              status="danger"
              icon={<IconDelete />}
              onClick={(e) => e.stopPropagation()}
            />
          </Tooltip>
        </Popconfirm>
      </Space>
    ) },
  ];

  // 加载表格数据
  const loadTableData = async (values?: any) => {
    setTableLoading(true);
    try {
      const formValues = values || filterFormRef.current?.getFieldsValue?.() || {};
      const params = {
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize,
        ...formValues,
      };
      const res = await getCronTaskList(params);
      setTableData(res.data.content || []);
      setPagination(prev => ({ ...prev, total: res.data.totalElements || 0 }));
    } catch (error) {
      Message.error('加载数据失败');
      console.error('加载数据失败:', error);
    } finally {
      setTableLoading(false);
    }
  };

  // 搜索
  const handleSearch = (values?: any) => {
    setPagination(prev => ({ ...prev, current: 1 }));
    loadTableData(values);
  };

  // 重置
  const handleReset = () => {
    filterFormRef.current?.resetForm();
    handleSearch({});
  };

  // 分页变化
  const handlePageChange = (current: number, pageSize: number) => {
    setPagination(prev => ({ ...prev, current, pageSize }));
  };

  const handlePaginationChange = (nextPagination: any) => {
    setPagination(prev => ({
      ...prev,
      current: nextPagination.current,
      pageSize: nextPagination.pageSize,
    }));
  };

  // 新增
  const handleAdd = () => {
    setCurrentRecord(null);
    setAddModalVisible(true);
    setTimeout(() => {
      addFormRef.current?.resetFields();
    }, 100);
  };

  // 编辑
  const handleEdit = (record: CronTaskDto) => {
    setCurrentRecord(record);
    setAddModalVisible(true);
    setTimeout(() => {
      addFormRef.current?.setFieldsValue(record);
    }, 100);
  };

  // 已移除 handleMenuClick，操作按钮已改为直接调用

  // 删除
  const handleDelete = (record: CronTaskDto) => {
    setCurrentRecord(record);
    setDeleteModalVisible(true);
  };

  // 触发
  const handleTrigger = (record: CronTaskDto) => {
    setCurrentRecord(record);
    setTriggerModalVisible(true);
  };

  // 保存新增/编辑
  const handleSave = async () => {
    const formData = addFormRef.current?.getFieldsValue();
    if (!formData.taskClass || !formData.queueName || !formData.cronExpression) {
      Message.error('请填写必填字段');
      return;
    }

    try {
      const data = { ...currentRecord, ...formData };
      await saveCronTask(data);
      Message.success('保存成功');
      setAddModalVisible(false);
      loadTableData();
    } catch (error) {
      Message.error('保存失败');
      console.error('保存失败:', error);
    }
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!currentRecord?.id) return;

    try {
      await deleteCronTask([currentRecord.id]);
      Message.success('删除成功');
      setDeleteModalVisible(false);
      loadTableData();
    } catch (error) {
      Message.error('删除失败');
      console.error('删除失败:', error);
    }
  };

  // 确认触发
  const handleConfirmTrigger = async () => {
    if (!currentRecord?.id) return;

    try {
      await triggerCronTask(currentRecord.id);
      Message.success('触发成功');
      setTriggerModalVisible(false);
      loadTableData();
    } catch (error) {
      Message.error('触发失败');
      console.error('触发失败:', error);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadTableData();
    // 获取队列列表
    const fetchQueueList = async () => {
      try {
        const response = await getQueueList();
        const queues = response.data || [];
        setQueueOptions(queues);
        
        // 更新筛选表单字段（依赖队列数据）
        updateFilterFormFields(statusOptions, queues, taskOptions);
      } catch (error) {
        Message.error('获取队列列表失败');
      }
    };
    
    // 获取任务类型选项
    const fetchTaskOptions = async () => {
      try {
        const response = await getTaskOptions();
        const tasks = response.data || [];
        setTaskOptions(tasks);
        
        // 更新筛选表单字段（依赖任务类型数据）
        updateFilterFormFields(statusOptions, queueOptions, tasks);
      } catch (error) {
        Message.error('获取任务类型选项失败');
      }
    };
    
    fetchQueueList();
    fetchTaskOptions();
  }, []);

  // 更新筛选表单字段配置
  const updateFilterFormFields = (status: any[], queues: any[], tasks: any[]) => {
    const fields: FormFieldConfig[] = [
      {
        field: 'keyWord',
        label: '关键词',
        type: 'input',
        placeholder: '请输入关键词',
        span: 8,
      },
      {
        field: 'queueName',
        label: '队列',
        type: 'select',
        placeholder: '请选择队列名称',
        span: 6,
        allowClear: true,
        options: queues.map(opt => ({
          label: opt.queueLabel || opt.queueName,
          value: opt.queueName,
        })),
      },
      {
        field: 'state',
        label: '状态',
        type: 'select',
        placeholder: '请选择状态',
        span: 6,
        allowClear: true,
        options: status,
      },
    ];
    setFilterFormFields(fields);
  };

  // 初始化表格高度并监听窗口变化
  useEffect(() => {
    const calculateTableHeight = () => {
      const windowHeight = window.innerHeight;
      const otherElementsHeight = 250;
      const newHeight = Math.max(100, windowHeight - otherElementsHeight);
      setTableScrollHeight(newHeight);
    };

    calculateTableHeight();

    const handleResize = () => calculateTableHeight();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filterContent = (
    <FilterForm
      ref={filterFormRef}
      formFields={filterFormFields}
      min={3}
      onSearch={handleSearch}
      onReset={handleReset}
    />
  );

  return (
    <div className="cron-task-manager">
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

      {/* 新增/编辑弹窗 */}
      <Modal
        title={currentRecord ? '编辑定时任务' : '新增定时任务'}
        visible={addModalVisible}
        onOk={handleSave}
        onCancel={() => setAddModalVisible(false)}
      >
        <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
          <Form ref={addFormRef} layout="vertical" className="modal-form">
            <Form.Item label="任务编码" field="name" rules={[{ required: true, message: '请填写任务名称' }]}>
              <Input placeholder="请输入任务编码" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="任务名称" field="label" rules={[{ required: true, message: '请填写任务名称' }]}>
              <Input placeholder="请输入任务名称" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="任务类名" field="taskClass" rules={[{ required: true, message: '请选择任务类名' }]}>
              <Select placeholder="请选择任务类名">
                {taskOptions.map(opt => (
                  <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="队列名称" field="queueName" rules={[{ required: true, message: '请选择队列名称' }]}>
              <Select placeholder="请选择队列名称">
                {queueOptions.map(opt => (
                  <Option key={opt.id} value={opt.queueName}>{opt.queueLabel || opt.queueName}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="Cron表达式" field="cronExpression" rules={[{ required: true, message: '请填写Cron表达式' }]}>
              <Input placeholder="例如: 0 0 12 * * ?" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="触发参数" field="fireParams">
              <TextArea placeholder="请输入触发参数(JSON格式，可选)" rows={3} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="状态" field="state">
              <Select defaultValue="ENABLED">
                {statusOptions.map(option => (
                  <Option key={option.value} value={option.value}>{option.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {/* 删除弹窗 */}
      <Modal
        title="删除定时任务"
        visible={deleteModalVisible}
        onOk={handleConfirmDelete}
        onCancel={() => setDeleteModalVisible(false)}
        okButtonProps={{ status: 'danger' }}
      >
        <p>确定要删除任务 <strong>{currentRecord?.taskClass}</strong> 吗？</p>
      </Modal>

      {/* 触发弹窗 */}
      <Modal
        title="触发定时任务"
        visible={triggerModalVisible}
        onOk={handleConfirmTrigger}
        onCancel={() => setTriggerModalVisible(false)}
      >
        <p>确定要触发任务 <strong>{currentRecord?.taskClass}</strong> 吗？</p>
      </Modal>
    </div>
  );
}

export default CronTaskManager;
