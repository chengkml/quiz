import React, { useEffect, useRef, useState } from 'react';
import {
    Button,
    Drawer,
    Form,
    Grid,
    Input,
    InputNumber,
    Message,
    Modal,
    Popconfirm,
    Select,
    Space,
    Tag,
    Tooltip,
} from '@arco-design/web-react';
import {
    IconDelete,
    IconInfo,
    IconStop,
} from '@arco-design/web-react/icon';
import { useNavigate } from 'react-router-dom';
import FilterForm from '@/components/FilterForm';
import { FormFieldConfig } from '@/components/types/types';
import './style/index.less';
import {
    addJob,
    deleteJob,
    getJobOptions,
    getQueueList,
    retryJob,
    searchJobs,
    stopJob,
} from './api';
import LogDetails from './components/logDetails/index';
import renderDate from '@/utils/timeUtil';
import { DataManager } from '../../components/DataManager';

const { TextArea } = Input;
const { Option } = Select;

function JobManager() {
    const navigate = useNavigate();

    // 表格数据与状态
    const [tableData, setTableData] = useState<any[]>([]);
    const [tableLoading, setTableLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0,
        showTotal: true,
        showJumper: true,
        showPageSize: true,
        pageSizeOptions: [10, 20, 50, 100],
    });
    const [tableScrollHeight, setTableScrollHeight] = useState(420);

    // 当前记录与弹窗
    const [currentRecord, setCurrentRecord] = useState<any | null>(null);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [stopModalVisible, setStopModalVisible] = useState(false);
    const [retryModalVisible, setRetryModalVisible] = useState(false);
    const [logModalVisible, setLogModalVisible] = useState(false);
    const [currentJobId, setCurrentJobId] = useState<string>('');

    // 动态参数定义
    const [selectedParamDef, setSelectedParamDef] = useState<Record<string, any>>({});

    // 表单引用
    const addFormRef = useRef<any>(null);
    const filterFormRef = useRef<any>(null);

    // 选项
    const [jobOptions, setJobOptions] = useState<any[]>([]);
    const [queueOptions, setQueueOptions] = useState<any[]>([]);
    const [statusOptions] = useState([
        { label: '待处理', value: 'PENDING' },
        { label: '处理中', value: 'IN_PROGRESS' },
        { label: '已完成', value: 'COMPLETED' },
        { label: '失败', value: 'FAILED' },
        { label: '已停止', value: 'STOPPED' },
    ]);

    // 筛选表单字段配置
    const [filterFormFields, setFilterFormFields] = useState<FormFieldConfig[]>([]);

    // 已移除 handleMenuClick，操作按钮已改为直接调用

    // 表格列定义
    const columns = [
        {
            title: '作业ID',
            dataIndex: 'id',
            ellipsis: true,
        },
        {
            title: '任务类名',
            dataIndex: 'taskClass',
            ellipsis: true,
        },
        {
            title: '队列名称',
            dataIndex: 'queueLabel',
            width: 120,
            ellipsis: true,
        },
        {
            title: '触发类型',
            dataIndex: 'triggerType',
            width: 120,
            align: 'center',
            render: (triggerType: string) => {
                const map: Record<string, string> = {
                    HAND: '手工触发',
                    CRON: '定时触发',
                    QUEUE_CRON: '定时队列触发',
                };
                return map[triggerType] || triggerType;
            },
        },
        {
            title: '开始时间',
            dataIndex: 'startTime',
            width: 180,
            render: (value: string) => renderDate(value),
        },
        {
            title: '状态',
            dataIndex: 'state',
            align: 'center',
            width: 120,
            render: (state: string) => {
                const map: Record<string, any> = {
                    RUNNING: { color: 'blue', text: '运行中' },
                    SUCCESS: { color: 'green', text: '成功' },
                    FAILED: { color: 'red', text: '失败' },
                    STOPPED: { color: 'gold', text: '已终止' },
                    PENDING: { color: 'gray', text: '待执行' },
                };
                const it = map[state] || { color: 'arcoblue', text: state };
                return <Tag color={it.color} bordered>{it.text}</Tag>;
            },
        },
        {
            title: '操作',
            width: 150,
            align: 'center',
            fixed: 'right' as const,
            render: (_: any, record: any) => (
                <Space size="small" className="table-btn-group">
                    {record.state === 'RUNNING' && (
                        <Tooltip title="停止">
                            <Button
                                type="text"
                                size="small"
                                icon={<IconStop />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentRecord(record);
                                    setStopModalVisible(true);
                                }}
                            />
                        </Tooltip>
                    )}
                    
                    <Tooltip title="日志">
                        <Button
                            type="text"
                            size="small"
                            icon={<IconInfo />}
                            onClick={(e) => {
                                e.stopPropagation();
                                setCurrentJobId(record.id);
                                setLogModalVisible(true);
                            }}
                        />
                    </Tooltip>
                    
                    {['RUNNING'].indexOf(record.state) === -1 && (
                        <Popconfirm
                            title="确认删除该作业吗？"
                            onOk={async () => {
                                try {
                                    await deleteJob(record.id);
                                    Message.success('删除作业成功');
                                    const filterValues = filterFormRef.current?.getFilterValues?.() || {};
                                    searchTableData(filterValues);
                                } catch (error) {
                                    Message.error('删除作业失败');
                                }
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
                    )}
                </Space>
            ),
        },
    ];

    // 获取表格数据
    const fetchTableData = async (params: any) => {
        try {
            setTableLoading(true);
            const response = await searchJobs(params);
            setTableData(response.data.content || []);
            setPagination((prev) => ({
                ...prev,
                total: response.data.totalElements || 0,
            }));
        } catch (error) {
            Message.error('获取作业数据失败');
        } finally {
            setTableLoading(false);
        }
    };

    // 搜索表格数据
    const searchTableData = (params: any) => {
        setPagination((prev) => ({
            ...prev,
            current: 1,
        }));
        fetchTableData({
            ...params,
            offset: 0,
            limit: pagination.pageSize,
        });
    };

    // 分页变化
    const handlePaginationChange = (newPagination: any) => {
        setPagination(newPagination);
        const values = filterFormRef.current?.getFilterValues?.() || {};
        fetchTableData({
            ...values,
            offset: (newPagination.current - 1) * newPagination.pageSize,
            limit: newPagination.pageSize,
        });
    };

    // 搜索
    const handleSearch = (values: any) => {
        searchTableData(values);
    };

    // 重置
    const handleReset = () => {
        searchTableData({});
    };

    // 新增按钮点击
    const handleAdd = () => {
        setAddModalVisible(true);
    };

    // 新增确认
    const handleAddConfirm = async () => {
        try {
            const values = addFormRef.current?.getFieldsValue?.() || {};
            const { taskClass, queueName, priority, ...rest } = values;

            // 组装 taskParams
            const paramObj: Record<string, any> = {};
            Object.keys(selectedParamDef || {}).forEach((key) => {
                const def = selectedParamDef[key] || {};
                const fieldName = `params_${key}`;
                let val = rest[fieldName];

                if (
                    def.type === 'number' &&
                    val !== undefined &&
                    val !== null &&
                    val !== ''
                ) {
                    val = Number(val);
                }

                if (def.type === 'array') {
                    if (Array.isArray(val)) {
                        paramObj[key] = val;
                    } else if (typeof val === 'string' && val.trim()) {
                        try {
                            const parsed = JSON.parse(val);
                            paramObj[key] = Array.isArray(parsed) ? parsed : [parsed];
                        } catch (e) {
                            paramObj[key] = val
                                .split(/[,\n]/)
                                .map((s: string) => s.trim())
                                .filter(Boolean);
                        }
                    } else {
                        paramObj[key] = [];
                    }
                } else if (val !== undefined) {
                    paramObj[key] = val;
                }
            });

            const payload = {
                taskClass,
                queueName,
                priority: priority ?? 0,
                taskParams: JSON.stringify(paramObj || {}),
            };

            await addJob(payload);
            Message.success('新增作业成功');
            setAddModalVisible(false);
            // 刷新表格
            const filterValues = filterFormRef.current?.getFilterValues?.() || {};
            searchTableData(filterValues);
        } catch (error) {
            Message.error('新增作业失败');
        }
    };

    const handleTaskClassChange = (value: string) => {
        const option = jobOptions.find((opt: any) => opt.value === value);
        setSelectedParamDef(option?.paramDef || {});

        if (addFormRef.current) {
            const resetValues: Record<string, any> = { taskClass: value };
            Object.keys(selectedParamDef || {}).forEach((key) => {
                resetValues[`params_${key}`] = undefined;
            });
            addFormRef.current.setFieldsValue(resetValues);
        }
    };

    // 删除确认
    // 删除逻辑已移至表格操作列的 Popconfirm 中

    // 停止作业确认
    const handleStopConfirm = async () => {
        try {
            await stopJob(currentRecord?.id || '');
            Message.success('停止作业成功');
            setStopModalVisible(false);
            // 刷新表格
            const filterValues = filterFormRef.current?.getFilterValues?.() || {};
            searchTableData(filterValues);
        } catch (error) {
            Message.error('停止作业失败');
        }
    };

    // 重试作业确认
    const handleRetryConfirm = async () => {
        try {
            await retryJob(currentRecord?.id || '');
            Message.success('重试作业成功');
            setRetryModalVisible(false);
            // 刷新表格
            const filterValues = filterFormRef.current?.getFilterValues?.() || {};
            searchTableData(filterValues);
        } catch (error) {
            Message.error('重试作业失败');
        }
    };

    // 初始化与高度自适应
    useEffect(() => {
        const calculateTableHeight = () => {
            const windowHeight = window.innerHeight;
            const otherElementsHeight = 330;
            const newHeight = Math.max(100, windowHeight - otherElementsHeight);
            setTableScrollHeight(newHeight);
        };
        calculateTableHeight();

        // 获取作业类型选项
        const fetchJobOptions = async () => {
            try {
                const response = await getJobOptions();
                const jobs = response.data || [];
                setJobOptions(jobs);
                
                // 更新筛选表单字段
                updateFilterFormFields(jobs, queueOptions, statusOptions);
            } catch (error) {
                Message.error('获取作业选项失败');
            }
        };

        // 获取队列列表
        const fetchQueueList = async () => {
            try {
                const response = await getQueueList();
                const queues = response.data || [];
                setQueueOptions(queues);
                
                // 更新筛选表单字段
                updateFilterFormFields(jobOptions, queues, statusOptions);
            } catch (error) {
                Message.error('获取队列列表失败');
            }
        };

        fetchJobOptions();
        fetchQueueList();

        // 默认查询所有作业
        const defaultParams = {};
        fetchTableData(defaultParams);
        
        const handleResize = () => calculateTableHeight();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 更新筛选表单字段配置
    const updateFilterFormFields = (jobs: any[], queues: any[], status: any[]) => {
        const fields: FormFieldConfig[] = [
            {
                field: 'taskClass',
                label: '任务',
                type: 'select',
                placeholder: '请选择任务类名',
                span: { xs: 24, sm: 12, md: 8, lg: 6 },
                allowClear: true,
                options: jobs.map(opt => ({
                    label: opt.label,
                    value: opt.value,
                })),
            },
            {
                field: 'queueName',
                label: '队列',
                type: 'select',
                placeholder: '请选择队列名称',
                span: { xs: 24, sm: 12, md: 8, lg: 6 },
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
                span: { xs: 24, sm: 12, md: 8, lg: 6 },
                allowClear: true,
                options: status,
            },
        ];
        setFilterFormFields(fields);
    };

    const filterContent = (
        <FilterForm
            ref={filterFormRef}
            formFields={filterFormFields}
            min={3}
            onSearch={handleSearch}
            onReset={handleReset}
        />
    );

    // 渲染移动端卡片视图
    const renderShortCard = (item) => {
        const stateMap = {
            RUNNING: { color: 'blue', text: '运行中' },
            SUCCESS: { color: 'green', text: '成功' },
            FAILED: { color: 'red', text: '失败' },
            STOPPED: { color: 'gold', text: '已终止' },
            PENDING: { color: 'gray', text: '待执行' },
        };
        const stateConfig = stateMap[item.state] || { color: 'arcoblue', text: item.state };

        const triggerTypeMap = {
            HAND: '手工触发',
            CRON: '定时触发',
            QUEUE_CRON: '定时队列触发',
        };

        return (
            <div
                className="job-card"
                style={{
                    border: '1px solid var(--color-border-2)',
                    borderRadius: 4,
                    padding: 12,
                    marginBottom: 12,
                    background: 'var(--color-bg-2)',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 'bold', fontSize: 14 }}>{item.taskClass}</span>
                    <Tag color={stateConfig.color} size="small" bordered>{stateConfig.text}</Tag>
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginBottom: 4 }}>
                    ID: {item.id}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginBottom: 4 }}>
                    队列: {item.queueLabel || item.queueName}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginBottom: 4 }}>
                    触发类型: {triggerTypeMap[item.triggerType] || item.triggerType}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginBottom: 8 }}>
                    开始时间: {renderDate(item.startTime)}
                </div>
                <div style={{ borderTop: '1px solid var(--color-border-2)', paddingTop: 8, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    {item.state === 'RUNNING' && (
                        <Button
                            type="text"
                            size="small"
                            icon={<IconStop />}
                            onClick={(e) => {
                                e.stopPropagation();
                                setCurrentRecord(item);
                                setStopModalVisible(true);
                            }}
                        >停止</Button>
                    )}
                    <Button
                        type="text"
                        size="small"
                        icon={<IconInfo />}
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrentJobId(item.id);
                            setLogModalVisible(true);
                        }}
                    >日志</Button>
                    {['RUNNING'].indexOf(item.state) === -1 && (
                        <Popconfirm
                            title="确认删除该作业吗？"
                            onOk={async () => {
                                try {
                                    await deleteJob(item.id);
                                    Message.success('删除作业成功');
                                    const filterValues = filterFormRef.current?.getFilterValues?.() || {};
                                    searchTableData(filterValues);
                                } catch (error) {
                                    Message.error('删除作业失败');
                                }
                            }}
                        >
                            <Button
                                type="text"
                                size="small"
                                status="danger"
                                icon={<IconDelete />}
                                onClick={(e) => e.stopPropagation()}
                            >删除</Button>
                        </Popconfirm>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="job-manager">
            <DataManager
                data={tableData}
                loading={tableLoading}
                pagination={pagination}
                onPaginationChange={handlePaginationChange}
                actions={{
                    onAdd: handleAdd,
                }}
                config={{
                    displayMode: 'table',
                    showModeToggle: true,
                    renderShortCard,
                    tableColumns: columns,
                    filterContent: filterContent,
                }}
                tableScrollHeight={tableScrollHeight}
            />

            {/* 新增对话框 */}
            <Modal
                title="新增作业"
                visible={addModalVisible}
                onOk={handleAddConfirm}
                onCancel={() => setAddModalVisible(false)}
            >
                <div
                    style={{
                        maxHeight: '60vh',
                        overflowY: 'auto',
                        paddingRight: '10px',
                    }}
                >
                    <Form ref={addFormRef} layout="vertical" className="modal-form">
                        <Form.Item
                            label="任务类型"
                            field="taskClass"
                            rules={[{ required: true, message: '请选择任务类型' }]}
                        >
                            <Select
                                placeholder="请选择任务类型"
                                onChange={handleTaskClassChange}
                                allowClear
                            >
                                {jobOptions.map((opt: any) => (
                                    <Option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item label="队列名称" field="queueName">
                            <Select placeholder="请选择队列" allowClear>
                                {queueOptions.map((opt) => (
                                    <Option key={opt.id} value={opt.queueName}>
                                        {opt.queueLabel || opt.queueName}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                        {Object.keys(selectedParamDef || {}).map((key) => {
                            const def = selectedParamDef[key] || {};
                            const fieldName = `params_${key}`;
                            const requiredRule = def.required
                                ? [{ required: true, message: `请输入${def.label || key}` }]
                                : [];
                            if (def.type === 'number') {
                                return (
                                    <Form.Item
                                        key={key}
                                        label={def.label || key}
                                        field={fieldName}
                                        rules={requiredRule}
                                        initialValue={def.default}
                                    >
                                        <InputNumber
                                            style={{ width: '100%' }}
                                            placeholder={def.placeholder || '请输入数字'}
                                        />
                                    </Form.Item>
                                );
                            }
                            if (def.type === 'array') {
                                return (
                                    <Form.Item
                                        key={key}
                                        label={def.label || key}
                                        field={fieldName}
                                        rules={requiredRule}
                                    >
                                        <TextArea
                                            placeholder={
                                                def.placeholder ||
                                                '请输入数组，支持JSON或逗号/换行分隔'
                                            }
                                            autoSize={{ minRows: 3, maxRows: 6 }}
                                        />
                                    </Form.Item>
                                );
                            }
                            return (
                                <Form.Item
                                    key={key}
                                    label={def.label || key}
                                    field={fieldName}
                                    rules={requiredRule}
                                    initialValue={def.default}
                                >
                                    <Input placeholder={def.placeholder || '请输入内容'} />
                                </Form.Item>
                            );
                        })}
                        <Form.Item label="优先级" field="priority" initialValue={0}>
                            <InputNumber style={{ width: '100%' }} min={0} max={10} />
                        </Form.Item>
                    </Form>
                </div>
            </Modal>

            {/* 删除确认已改为 Popconfirm，无需 Modal */}

            {/* 停止作业确认 */}
            <Modal
                title="确认停止"
                visible={stopModalVisible}
                onOk={handleStopConfirm}
                onCancel={() => setStopModalVisible(false)}
            >
                <div className="delete-modal">确定要停止该作业吗？</div>
            </Modal>

            {/* 重试作业确认 */}
            <Modal
                title="确认重试"
                visible={retryModalVisible}
                onOk={handleRetryConfirm}
                onCancel={() => setRetryModalVisible(false)}
            >
                <div className="delete-modal">确定要重试该作业吗？</div>
            </Modal>

            {/* 日志查看 */}
            <Drawer
                title="作业日志"
                visible={logModalVisible}
                onCancel={() => setLogModalVisible(false)}
                width={800}
                placement="right"
                footer={null}
            >
                <div style={{ height: '100%' }}>
                    <LogDetails jobId={currentJobId} />
                </div>
            </Drawer>
        </div>
    );
}

export default JobManager;
