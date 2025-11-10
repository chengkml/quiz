import React, {useEffect, useRef, useState} from 'react';
import {
    Button,
    DatePicker,
    Dropdown,
    Form,
    Grid,
    Input,
    Layout,
    Menu,
    Message,
    Modal,
    Pagination,
    Select,
    Space,
    Table,
    Tag,
} from '@arco-design/web-react';
import {
    IconCheck,
    IconDelete,
    IconEdit,
    IconList,
    IconMindMapping,
    IconPlus,
    IconSearch
} from '@arco-design/web-react/icon';
import {useNavigate} from 'react-router-dom';
import './style/index.less';
import {createTodo, deleteTodo, getTodoList, initMindMap, updateTodo} from './api';
import dayjs from 'dayjs';

const {Content} = Layout;
const {TextArea} = Input;
const {Option} = Select;
const {Row, Col} = Grid;

function TodoManager() {
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
    const [analyzeLoading, setAnalyzeLoading] = useState(false);

    // 当前记录与弹窗
    const [currentRecord, setCurrentRecord] = useState<any | null>(null);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);

    // 表单引用
    const addFormRef = useRef<any>(null);
    const editFormRef = useRef<any>(null);
    const filterFormRef = useRef<any>(null);

    // 状态与优先级选项
    const statusOptions = [
        {label: '待处理', value: 'PENDING'},
        {label: '处理中', value: 'IN_PROGRESS'},
        {label: '已完成', value: 'COMPLETED'},
    ];
    const priorityOptions = [
        {label: '低', value: 'LOW'},
        {label: '中', value: 'MEDIUM'},
        {label: '高', value: 'HIGH'},
    ];

    // 时间格式化（与其它页面一致的相对/绝对展示）
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
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }
    };

    // 获取表格数据
    const fetchTableData = async (params: any = {}, pageSize: number = pagination.pageSize, current: number = pagination.current) => {
        setTableLoading(true);
        try {
            const targetParams = {
                ...params,
                pageNum: current - 1,
                pageSize: pageSize,
                sortColumn: 'create_date',
                sortType: 'desc',
            };
            const response = await getTodoList(targetParams);
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
            Message.error('获取待办数据失败');
        } finally {
            setTableLoading(false);
        }
    };

    // 搜索
    const searchTableData = (params: any) => {
        fetchTableData(params, pagination.pageSize, 1);
    };

    // 分页变化
    const handlePageChange = (current: number, pageSize: number) => {
        const filterParams = filterFormRef.current?.getFieldsValue?.() || {};
        fetchTableData(filterParams, pageSize, current);
    };

    // 新增
    const handleAdd = () => {
        setCurrentRecord(null);
        setAddModalVisible(true);
        setTimeout(() => addFormRef.current?.resetFields?.(), 50);
    };

    const handleAddConfirm = async () => {
        try {
            const values = await addFormRef.current?.validate?.();
            if (values) {
                const payload = {
                    ...values,
                    // 统一转换为 LocalDateTime 可解析格式
                    dueDate: values.dueDate ? dayjs(values.dueDate).format('YYYY-MM-DDTHH:mm:ss') : null,
                };
                await createTodo(payload);
                Message.success('待办创建成功');
                setAddModalVisible(false);
                addFormRef.current?.resetFields?.();
                fetchTableData();
            }
        } catch (error) {
            if (error?.fields) return; // 表单校验错误
            Message.error('待办创建失败');
        }
    };

    // 编辑
    const handleEdit = (record: any) => {
        setCurrentRecord(record);
        setEditModalVisible(true);
        setTimeout(() => {
            editFormRef.current?.setFieldsValue?.({
                id: record.id,
                title: record.title,
                description: record.description,
                status: record.status,
                priority: record.priority,
                dueDate: record.dueDate ? dayjs(record.dueDate) : null,
            });
        }, 50);
    };

    const handleEditConfirm = async () => {
        try {
            const values = await editFormRef.current?.validate?.();
            if (values && currentRecord) {
                const payload = {
                    id: currentRecord.id,
                    title: values.title,
                    description: values.description,
                    status: values.status,
                    priority: values.priority,
                    dueDate: values.dueDate ? dayjs(values.dueDate).format('YYYY-MM-DDTHH:mm:ss') : null,
                };
                await updateTodo(payload);
                Message.success('待办更新成功');
                setEditModalVisible(false);
                editFormRef.current?.resetFields?.();
                fetchTableData();
            }
        } catch (error) {
            if (error?.fields) return;
            Message.error('待办更新失败');
        }
    };

    // 删除
    const handleDelete = (record: any) => {
        setCurrentRecord(record);
        setDeleteModalVisible(true);
    };

    const handleDeleteConfirm = async () => {
        if (!currentRecord) return;
        try {
            await deleteTodo(currentRecord.id);
            Message.success('待办删除成功');
            setDeleteModalVisible(false);
            fetchTableData();
        } catch (error) {
            Message.error('待办删除失败');
        }
    };


    // 分析待办，生成思维导图
    const handleAnalyze = async (record: any) => {
        setAnalyzeLoading(true);
        try {
            const response = await initMindMap(record.id);
            if (response.data) {
                const mindMap = response.data;
                // 导航到思维导图编辑页面
                navigate(`/quiz/frame/mindmap/edit/${mindMap.id}`);
            }
        } catch (error) {
            Message.error('思维导图初始化失败');
        } finally {
            setAnalyzeLoading(false);
        }
    };

    // 完成待办
    const handleComplete = async (record: any) => {
        try {
            const payload = {
                id: record.id,
                status: 'COMPLETED'
            };
            await updateTodo(payload);
            Message.success('待办已完成');
            fetchTableData();
        } catch (error) {
            Message.error('完成待办失败');
        }
    };

    // 菜单点击
    const handleMenuClick = (key: string, e: React.MouseEvent, record: any) => {
        e.stopPropagation();
        if (key === 'edit') {
            handleEdit(record);
        } else if (key === 'delete') {
            handleDelete(record);
        } else if (key === 'analyze') {
            handleAnalyze(record);
        } else if (key === 'complete') {
            handleComplete(record);
        }
    };

    // 列配置
    const columns = [
        {
            title: '标题',
            dataIndex: 'title',
            ellipsis: true,
        },
        {
            title: '状态',
            dataIndex: 'status',
            width: 120,
            render: (status: string) => {
                const map: Record<string, any> = {
                    PENDING: {color: 'gray', text: '待处理'},
                    IN_PROGRESS: {color: 'blue', text: '处理中'},
                    COMPLETED: {color: 'green', text: '已完成'},
                };
                const it = map[status] || {color: 'arcoblue', text: status};
                return <Tag color={it.color} bordered>{it.text}</Tag>;
            },
        },
        {
            title: '优先级',
            dataIndex: 'priority',
            width: 120,
            render: (priority: string) => {
                const map: Record<string, any> = {
                    LOW: {color: 'green', text: '低'},
                    MEDIUM: {color: 'orange', text: '中'},
                    HIGH: {color: 'red', text: '高'},
                };
                const it = map[priority] || {color: 'arcoblue', text: priority};
                return <Tag color={it.color} bordered>{it.text}</Tag>;
            },
        },
        {
            title: '截止时间',
            dataIndex: 'dueDate',
            width: 180,
            render: (value: string) => formatDateTime(value),
        },
        {
            title: '创建人',
            dataIndex: 'createUserName',
            width: 140,
            render: (_: any, record: any) => record.createUserName || record.createUser || '-',
        },
        {
            title: '创建时间',
            dataIndex: 'createDate',
            width: 180,
            render: (value: string) => formatDateTime(value),
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
                                <Menu.Item key="analyze">
                                    <IconMindMapping style={{marginRight: 5}}/>
                                    分析
                                </Menu.Item>
                                <Menu.Item key="edit">
                                    <IconEdit style={{marginRight: 5}}/>
                                    编辑
                                </Menu.Item>
                                {record.status !== 'COMPLETED' && (
                                    <Menu.Item key="complete">
                                        <IconCheck style={{marginRight: 5}}/>
                                        完成
                                    </Menu.Item>
                                )}
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

    // 初始化与高度自适应
    useEffect(() => {
        const calculateTableHeight = () => {
            const windowHeight = window.innerHeight;
            const otherElementsHeight = 190;
            const newHeight = Math.max(200, windowHeight - otherElementsHeight);
            setTableScrollHeight(newHeight);
        };
        calculateTableHeight();
        // 默认查询待处理状态的任务
        const defaultParams = { status: 'PENDING' };
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
        <div className="todo-manager">
            <Layout>
                <Content>
                    {/* 筛选表单 */}
                    <Form ref={filterFormRef} layout="horizontal" className="filter-form" style={{marginTop: '10px'}} onValuesChange={() => {
                        const values = filterFormRef.current?.getFieldsValue?.() || {};
                        searchTableData(values);
                    }}>
                        <Row gutter={16}>
                            <Col span={6}>
                                <Form.Item field="title" label="标题">
                                    <Input placeholder="请输入标题关键字"/>
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item field="status" label="状态">
                                    <Select placeholder="请选择状态" allowClear>
                                        {statusOptions.map(opt => (
                                            <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item field="priority" label="优先级">
                                    <Select placeholder="请选择优先级" allowClear>
                                        {priorityOptions.map(opt => (
                                            <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={6} style={{display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', paddingBottom: '16px'}}>
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
                        title="新增待办"
                        visible={addModalVisible}
                        onOk={handleAddConfirm}
                        onCancel={() => setAddModalVisible(false)}
                    >
                        <div style={{maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px'}}>
                            <Form ref={addFormRef} layout="vertical" className="modal-form">
                                <Form.Item label="标题" field="title" rules={[{required: true, message: '请输入标题'}]}>
                                    <Input placeholder="请输入标题"/>
                                </Form.Item>
                                <Form.Item label="详细描述" field="description">
                                    <TextArea placeholder="请输入详细描述" autoSize={{minRows: 3, maxRows: 6}}/>
                                </Form.Item>
                                <Form.Item label="状态" field="status">
                                    <Select placeholder="请选择状态" allowClear>
                                        {statusOptions.map(opt => (
                                            <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                                <Form.Item label="优先级" field="priority">
                                    <Select placeholder="请选择优先级" allowClear>
                                        {priorityOptions.map(opt => (
                                            <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                                <Form.Item label="截止时间" field="dueDate">
                                    <DatePicker showTime style={{width: '100%'}}/>
                                </Form.Item>
                            </Form>
                        </div>
                    </Modal>

                    {/* 编辑对话框 */}
                    <Modal
                        title="编辑待办"
                        visible={editModalVisible}
                        onOk={handleEditConfirm}
                        onCancel={() => setEditModalVisible(false)}
                    >
                        <div style={{maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px'}}>
                            <Form ref={editFormRef} layout="vertical" className="modal-form">
                                <Form.Item label="标题" field="title" rules={[{required: true, message: '请输入标题'}]}>
                                    <Input placeholder="请输入标题"/>
                                </Form.Item>
                                <Form.Item label="详细描述" field="description">
                                    <TextArea placeholder="请输入详细描述" autoSize={{minRows: 3, maxRows: 6}}/>
                                </Form.Item>
                                <Form.Item label="状态" field="status">
                                    <Select placeholder="请选择状态" allowClear>
                                        {statusOptions.map(opt => (
                                            <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                                <Form.Item label="优先级" field="priority">
                                    <Select placeholder="请选择优先级" allowClear>
                                        {priorityOptions.map(opt => (
                                            <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                                <Form.Item label="截止时间" field="dueDate">
                                    <DatePicker showTime style={{width: '100%'}}/>
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
                        <div className="delete-modal">确定要删除该待办吗？此操作不可恢复。</div>
                    </Modal>


                </Content>
            </Layout>
        </div>
    );
}

export default TodoManager;