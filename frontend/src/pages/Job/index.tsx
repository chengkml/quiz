import React, {useEffect, useRef, useState} from 'react';
import {
    Button,
    DatePicker,
    Dropdown,
    Form,
    Grid,
    Input,
    InputNumber,
    Layout,
    Menu,
    Message,
    Modal,
    Pagination,
    Select,
    Space,
    Table,
    Tag,
    Drawer,
} from '@arco-design/web-react';
import {
    IconDelete,
    IconEdit,
    IconInfo,
    IconList,
    IconPlus,
    IconRefresh,
    IconSearch,
    IconStop
} from '@arco-design/web-react/icon';
import {useNavigate} from 'react-router-dom';
import './style/index.less';
import {addJob, deleteJob, getJobOptions, getQueueList, retryJob, searchJobs, stopJob,} from './api';
import LogDetails from './components/logDetails/index';

const {Content} = Layout;
const {TextArea} = Input;
const {Option} = Select;
const {Row, Col} = Grid;

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
    });
    const [tableScrollHeight, setTableScrollHeight] = useState(420);

    // 当前记录与弹窗
    const [currentRecord, setCurrentRecord] = useState<any | null>(null);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [stopModalVisible, setStopModalVisible] = useState(false);
    const [retryModalVisible, setRetryModalVisible] = useState(false);
    const [logModalVisible, setLogModalVisible] = useState(false);
    const [currentJobId, setCurrentJobId] = useState<string>('');

    // 表单引用
    const addFormRef = useRef<any>(null);
    const filterFormRef = useRef<any>(null);

    // 选项
    const [jobOptions, setJobOptions] = useState([]);
    const [queueOptions, setQueueOptions] = useState([]);
    const [statusOptions] = useState([
        {label: '待处理', value: 'PENDING'},
        {label: '处理中', value: 'IN_PROGRESS'},
        {label: '已完成', value: 'COMPLETED'},
        {label: '失败', value: 'FAILED'},
        {label: '已停止', value: 'STOPPED'},
    ]);

    // 时间格式化
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
            return `${year}-${month}-${day} ${hours}:${minutes}`;
        }
    };

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
                    QUEUE_CRON: '定时队列触发'
                };
                return map[triggerType] || triggerType;
            },
        },
        {
            title: '开始时间',
            dataIndex: 'startTime',
            width: 180,
            render: (value: string) => formatDateTime(value),
        },
        {
            title: '状态',
            dataIndex: 'state',
            align: 'center',
            width: 120,
            render: (state: string) => {
                const map: Record<string, any> = {
                    RUNNING: {color: 'blue', text: '运行中'},
                    SUCCESS: {color: 'green', text: '成功'},
                    FAILED: {color: 'red', text: '失败'},
                    PENDING: {color: 'gray', text: '待执行'},
                };
                const it = map[state] || {color: 'arcoblue', text: state};
                return <Tag color={it.color} bordered>{it.text}</Tag>;
            },
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
                            <Menu onClickMenuItem={(key, e) => handleMenuClick(key, e, record)}
                                      className="handle-dropdown-menu">
                                {record.state !== 'COMPLETED' && record.state !== 'STOPPED' && (
                                    <Menu.Item key="stop">
                                        <IconStop style={{marginRight: 5}}/>
                                        停止
                                    </Menu.Item>
                                )}
                                {record.state === 'FAILED' && (
                                    <Menu.Item key="retry">
                                        <IconRefresh style={{marginRight: 5}}/>
                                        重试
                                    </Menu.Item>
                                )}
                                <Menu.Item key="log">
                                <IconInfo style={{marginRight: 5}}/>
                                日志
                            </Menu.Item>
                            <Menu.Item key="delete">
                                <IconDelete style={{marginRight: 5}}/>
                                删除
                            </Menu.Item>
                            </Menu>
                        }
                    >
                        <Button type="text" className="more-btn" onClick={(e) => e.stopPropagation()}>
                            <IconList/>
                        </Button>
                    </Dropdown>
                </Space>
            ),
        },
    ];

    // 菜单点击处理
    const handleMenuClick = (key: string, _: any, record: any) => {
        setCurrentRecord(record);
        switch (key) {
            case 'stop':
                setStopModalVisible(true);
                break;
            case 'retry':
                setRetryModalVisible(true);
                break;
            case 'log':
                setCurrentJobId(record.id);
                setLogModalVisible(true);
                break;
            case 'delete':
                setDeleteModalVisible(true);
                break;
            default:
                break;
        }
    };

    // 分页变化
    const handlePageChange = (page, pageSize) => {
        setPagination(prev => ({
            ...prev,
            current: page,
            pageSize: pageSize,
        }));
        const values = filterFormRef.current?.getFieldsValue?.() || {};
        fetchTableData({
            ...values,
            offset: (page - 1) * pageSize,
            limit: pageSize,
        });
    };

    // 获取表格数据
    const fetchTableData = async (params) => {
        try {
            setTableLoading(true);
            const response = await searchJobs(params);
            setTableData(response.data.content || []);
            setPagination(prev => ({
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
    const searchTableData = (params) => {
        setPagination(prev => ({
            ...prev,
            current: 1,
        }));
        fetchTableData({
            ...params,
            offset: 0,
            limit: pagination.pageSize,
        });
    };

    // 新增按钮点击
    const handleAdd = () => {
        setAddModalVisible(true);
    };

    // 新增确认
    const handleAddConfirm = async () => {
        try {
            const values = addFormRef.current?.getFieldsValue?.() || {};
            await addJob(values);
            Message.success('新增作业成功');
            setAddModalVisible(false);
            // 刷新表格
            const filterValues = filterFormRef.current?.getFieldsValue?.() || {};
            searchTableData(filterValues);
        } catch (error) {
            Message.error('新增作业失败');
        }
    };



    // 删除确认
    const handleDeleteConfirm = async () => {
        try {
            await deleteJob(currentRecord?.id || '');
            Message.success('删除作业成功');
            setDeleteModalVisible(false);
            // 刷新表格
            const filterValues = filterFormRef.current?.getFieldsValue?.() || {};
            searchTableData(filterValues);
        } catch (error) {
            Message.error('删除作业失败');
        }
    };

    // 停止作业确认
    const handleStopConfirm = async () => {
        try {
            await stopJob(currentRecord?.id || '');
            Message.success('停止作业成功');
            setStopModalVisible(false);
            // 刷新表格
            const filterValues = filterFormRef.current?.getFieldsValue?.() || {};
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
            const filterValues = filterFormRef.current?.getFieldsValue?.() || {};
            searchTableData(filterValues);
        } catch (error) {
            Message.error('重试作业失败');
        }
    };

    // 初始化与高度自适应
    useEffect(() => {
        const calculateTableHeight = () => {
            const windowHeight = window.innerHeight;
            const otherElementsHeight = 240;
            const newHeight = Math.max(200, windowHeight - otherElementsHeight);
            setTableScrollHeight(newHeight);
        };
        calculateTableHeight();

        // 获取作业类型选项
        const fetchJobOptions = async () => {
            try {
                const response = await getJobOptions();
                setJobOptions(response.data || []);
            } catch (error) {
                Message.error('获取作业选项失败');
            }
        };
        fetchJobOptions();

        // 获取队列列表
        const fetchQueueList = async () => {
            try {
                const response = await getQueueList();
                setQueueOptions(response.data || []);
            } catch (error) {
                Message.error('获取队列列表失败');
            }
        };
        fetchQueueList();

        // 默认查询所有作业
        const defaultParams = {};
        fetchTableData(defaultParams);
        // 设置表单默认值
        setTimeout(() => {
            filterFormRef.current?.setFieldsValue?.(defaultParams);
        }, 50);
        const handleResize = () => calculateTableHeight();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="job-manager">
            <Layout>
                <Content>
                    {/* 筛选表单 */}
                    <Form
                        ref={filterFormRef}
                        layout="horizontal"
                        className="filter-form"
                        style={{marginTop: '10px'}}
                        onValuesChange={() => {
                            const values = filterFormRef.current?.getFieldsValue?.() || {};
                            searchTableData(values);
                        }}
                    >
                        <Row gutter={16}>
                            <Col span={6}>
                                <Form.Item field="taskClass" label="任务">
                                    <Select placeholder="请选择任务类名" allowClear>
                                        {jobOptions.map(opt => (
                                            <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item field="queueName" label="队列">
                                    <Select placeholder="请选择队列名称" allowClear>
                                        {queueOptions.map(opt => (
                                            <Option key={opt.id} value={opt.queueName}>{opt.queueLabel || opt.queueName}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>

                            <Col span={6}>
                                <Form.Item field="state" label="状态">
                                    <Select placeholder="请选择状态" allowClear>
                                        {statusOptions.map(opt => (
                                            <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={6} style={{
                                display: 'flex',
                                justifyContent: 'flex-start',
                                alignItems: 'flex-end',
                                paddingBottom: '16px'
                            }}>
                                <Space>
                                    <Button type="primary" icon={<IconSearch/>} onClick={() => {
                                        const values = filterFormRef.current?.getFieldsValue?.() || {};
                                        searchTableData(values);
                                    }}>
                                        搜索
                                    </Button>
                                    <Button type="primary" status="success" icon={<IconPlus/>} onClick={handleAdd}>
                                        新增
                                    </Button>
                                </Space>
                            </Col>
                        </Row>
                    </Form>

                    {/* 表格 */}
                    <Table
                        columns={columns}
                        data={tableData}
                        loading={tableLoading}
                        pagination={false}
                        scroll={{y: tableScrollHeight}}
                        rowKey="id"
                    />

                    {/* 分页 */}
                    <div className="pagination-wrapper">
                        <Pagination
                            {...pagination}
                            onChange={handlePageChange}
                        />
                    </div>

                    {/* 新增对话框 */}
                    <Modal
                        title="新增作业"
                        visible={addModalVisible}
                        onOk={handleAddConfirm}
                        onCancel={() => setAddModalVisible(false)}
                        width={600}
                    >
                        <div style={{maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px'}}>
                            <Form ref={addFormRef} layout="vertical" className="modal-form">
                                <Form.Item
                                    label="任务类名"
                                    field="taskClass"
                                    rules={[{required: true, message: '请选择任务类名'}]}
                                >
                                    <Select placeholder="请选择任务类名">
                                        {jobOptions.map(opt => (
                                            <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                                <Form.Item
                                    label="队列名称"
                                    field="queueName"
                                    rules={[{required: true, message: '请选择队列'}]}
                                >
                                    <Select placeholder="请选择队列">
                                        {queueOptions.map(opt => (
                                            <Option key={opt.id} value={opt.queueName}>{opt.queueLabel || opt.queueName}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                                <Form.Item label="参数" field="taskParams">
                                    <TextArea placeholder="请输入作业参数（JSON格式）"
                                              autoSize={{minRows: 3, maxRows: 6}}/>
                                </Form.Item>
                                <Form.Item label="优先级" field="priority">
                                    <InputNumber style={{width: '100%'}} min={0} max={10} defaultValue={0}/>
                                </Form.Item>
                            </Form>
                        </div>
                    </Modal>



                    {/* 删除确认 */}
                    <Modal
                        title="确认删除"
                        visible={deleteModalVisible}
                        onOk={handleDeleteConfirm}
                        onCancel={() => setDeleteModalVisible(false)}
                    >
                        <div className="delete-modal">确定要删除该作业吗？此操作不可恢复。</div>
                    </Modal>

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
                        <div style={{height: '100%'}}>
                            <LogDetails jobId={currentJobId} />
                        </div>
                    </Drawer>

                </Content>
            </Layout>
        </div>
    );
}

export default JobManager;