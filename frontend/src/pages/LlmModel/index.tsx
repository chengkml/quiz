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
    Switch,
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
import {
    createModel,
    deleteModel,
    getModelList,
    getModelById,
    updateModel,
    setDefaultModel,
} from './api';
import dayjs from 'dayjs';

const {Content} = Layout;
const {TextArea} = Input;
const {Option} = Select;
const {Row, Col} = Grid;

function LlmModelManager() {
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

    // 提供者与模型类型示例选项（可根据后端实际值调整）
    const providerOptions = [
        {label: 'OpenAI', value: 'OPENAI'},
        {label: 'Local', value: 'LOCAL'},
    ];
    const typeOptions = [
        {label: '文本', value: 'TEXT'},
        {label: '视觉', value: 'VISION'},
        {label: '语音', value: 'VOICE'},
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
                page: current - 1,
                size: pageSize,
            };
            const response = await getModelList(targetParams);
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
            Message.error('获取模型数据失败');
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
                };
                await createModel(payload);
                Message.success('模型创建成功');
                setAddModalVisible(false);
                addFormRef.current?.resetFields?.();
                fetchTableData();
            }
        } catch (error) {
            if ((error as any)?.fields) return; // 表单校验错误
            Message.error('模型创建失败');
        }
    };

    // 编辑
    const handleEdit = (record: any) => {
        setCurrentRecord(record);
        setEditModalVisible(true);
        setTimeout(() => {
            editFormRef.current?.setFieldsValue?.({
                id: record.id,
                name: record.name,
                provider: record.provider,
                type: record.type,
                apiEndpoint: record.apiEndpoint,
                apiKey: '',
                contextWindow: record.contextWindow,
                inputPricePer1k: record.inputPricePer1k,
                outputPricePer1k: record.outputPricePer1k,
                description: record.description,
                config: record.config,
            });
        }, 50);
    };

    const handleEditConfirm = async () => {
        try {
            const values = await editFormRef.current?.validate?.();
            if (values && currentRecord) {
                const newPayload = {
                    id: currentRecord.id,
                    name: values.name,
                    description: values.description,
                    apiKey: values.apiKey,
                    apiEndpoint: values.apiEndpoint,
                    contextWindow: values.contextWindow,
                    inputPricePer1k: values.inputPricePer1k,
                    outputPricePer1k: values.outputPricePer1k,
                    config: values.config,
                };
                await updateModel(newPayload);
                Message.success('模型更新成功');
                setEditModalVisible(false);
                editFormRef.current?.resetFields?.();
                fetchTableData();
            }
        } catch (error) {
            if ((error as any)?.fields) return;
            Message.error('模型更新失败');
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
            await deleteModel(currentRecord.id);
            Message.success('模型删除成功');
            setDeleteModalVisible(false);
            fetchTableData();
        } catch (error) {
            Message.error('模型删除失败');
        }
    };


    // （不再支持的旧操作占位）
    const handleAnalyze = async (record: any) => {
        Message.info('该操作不可用');
    };

    const handleComplete = async (record: any) => {
        Message.info('该操作不可用');
    };

    // 菜单点击
    const handleMenuClick = (key: string, e: React.MouseEvent, record: any) => {
        e.stopPropagation();
        if (key === 'edit') {
            handleEdit(record);
        } else if (key === 'delete') {
            handleDelete(record);
        } else if (key === 'set-default') {
            setDefaultModel(record.id).then(() => {
                Message.success('已设置为默认模型');
                fetchTableData();
            }).catch(() => Message.error('设置默认模型失败'));
        }
    };

    // 类型映射与颜色
    const typeMap: Record<string, { label: string; color: string }> = {
        'TEXT': { label: '文本', color: 'blue' },
        'VISION': { label: '视觉', color: 'green' },
        'VOICE': { label: '语音', color: 'purple' },
    };

    // 列配置（模型管理）
    const columns = [
        { title: '名称', dataIndex: 'name', ellipsis: true },
        { title: '提供者', dataIndex: 'provider', width: 140 },
        { title: '类型', dataIndex: 'type', width: 120, render: (v: any) => {
            const typeInfo = typeMap[v];
            return typeInfo ? <Tag color={typeInfo.color} bordered>{typeInfo.label}</Tag> : <Tag>{v}</Tag>;
        } },
        {
            title: '默认',
            dataIndex: 'isDefault',
            width: 100,
            render: (v: any) => (v === '1' || v === 1 || v === true) ? <Tag color="green" bordered>默认</Tag> : <Tag color="gray" bordered>非默认</Tag>
        },
        { title: 'API 端点', dataIndex: 'apiEndpoint', width: 240, ellipsis: true },
        { title: '创建人', dataIndex: 'createUserName', width: 140, render: (_: any, record: any) => record.createUserName || record.createUser || '-' },
        { title: '创建时间', dataIndex: 'createDate', width: 180, render: (value: string) => formatDateTime(value) },
        {
            title: '操作',
            width: 120,
            align: 'center' as any,
            fixed: 'right' as any,
            render: (_: any, record: any) => (
                <Space size="large" className="table-btn-group">
                    <Dropdown
                        position="bl"
                        droplist={
                            <Menu onClickMenuItem={(key, e) => handleMenuClick(key, e, record)} className="handle-dropdown-menu">
                                <Menu.Item key="edit"><IconEdit style={{marginRight: 5}}/> 编辑</Menu.Item>
                                <Menu.Item key="set-default"><IconCheck style={{marginRight: 5}}/> 设为默认</Menu.Item>
                                <Menu.Item key="delete"><IconDelete style={{marginRight: 5}}/> 删除</Menu.Item>
                            </Menu>
                        }
                    >
                        <Button type="text" className="more-btn" onClick={(e) => e.stopPropagation()}><IconList/></Button>
                    </Dropdown>
                </Space>
            ),
        },
    ];

    // 初始化与高度自适应
    useEffect(() => {
        const calculateTableHeight = () => {
            const windowHeight = window.innerHeight;
            const otherElementsHeight = 250;
            const newHeight = Math.max(200, windowHeight - otherElementsHeight);
            setTableScrollHeight(newHeight);
        };
        calculateTableHeight();
        const defaultParams = {};
        fetchTableData(defaultParams);
        setTimeout(() => {
            filterFormRef.current?.setFieldsValue?.(defaultParams);
        }, 50);
        const handleResize = () => calculateTableHeight();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="llm-model-manager">
            <Layout>
                <Content>
                    {/* 筛选表单 */}
                    <Form ref={filterFormRef} layout="horizontal" className="filter-form" style={{marginTop: '10px'}} onValuesChange={() => {
                        const values = filterFormRef.current?.getFieldsValue?.() || {};
                        searchTableData(values);
                    }}>
                        <Row gutter={16}>
                            <Col span={6}>
                                <Form.Item field="name" label="名称">
                                    <Input placeholder="请输入名称关键字"/>
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item field="provider" label="提供者">
                                    <Input placeholder="请输入提供者" />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item field="type" label="类型">
                                    <Select placeholder="请选择类型" allowClear>
                                        {typeOptions.map(opt => (
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
                                    }}>搜索</Button>
                                    <Button type="primary" status="success" icon={<IconPlus/>} onClick={handleAdd}>新增</Button>
                                </Space>
                            </Col>
                        </Row>
                    </Form>

                    {/* 表格 */}
                    <Table columns={columns} data={tableData} loading={tableLoading} pagination={false} scroll={{y: tableScrollHeight}} rowKey="id" />

                    {/* 分页 */}
                    <div className="pagination-wrapper">
                        <Pagination {...pagination} onChange={handlePageChange} />
                    </div>

                    {/* 新增对话框 */}
                    <Modal title="新增模型" visible={addModalVisible} onOk={handleAddConfirm} onCancel={() => setAddModalVisible(false)}>
                        <div style={{maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px'}}>
                            <Form ref={addFormRef} layout="vertical" className="modal-form">
                                <Form.Item label="名称" field="name" rules={[{required: true, message: '请输入名称'}]}>
                                    <Input placeholder="请输入名称" />
                                </Form.Item>
                                <Form.Item label="提供者" field="provider" rules={[{required: true, message: '请输入提供者'}]}>
                                    <Input placeholder="请输入提供者" />
                                </Form.Item>
                                <Form.Item label="类型" field="type" rules={[{required: true, message: '请选择类型'}]}>
                                    <Select placeholder="请选择类型" allowClear>{typeOptions.map(opt => <Option key={opt.value} value={opt.value}>{opt.label}</Option>)}</Select>
                                </Form.Item>
                                <Form.Item label="API Key" field="apiKey" rules={[{required: true, message: '请输入 API Key'}]}>
                                    <Input placeholder="请输入 API Key" />
                                </Form.Item>
                                <Form.Item label="API 端点" field="apiEndpoint" rules={[{required: true, message: '请输入 API 端点'}]}>
                                    <Input placeholder="请输入 API 端点" />
                                </Form.Item>
                                <Form.Item label="上下文窗口" field="contextWindow">
                                    <Input placeholder="上下文窗口大小（整数）" />
                                </Form.Item>
                                <Form.Item label="输入单价(分/千token)" field="inputPricePer1k" rules={[{required: true, message: '请输入输入单价'}]}>
                                    <Input placeholder="输入单价" />
                                </Form.Item>
                                <Form.Item label="输出单价(分/千token)" field="outputPricePer1k" rules={[{required: true, message: '请输入输出单价'}]}>
                                    <Input placeholder="输出单价" />
                                </Form.Item>
                                <Form.Item label="描述" field="description">
                                    <TextArea placeholder="请输入描述" autoSize={{minRows: 3, maxRows: 6}} />
                                </Form.Item>
                            </Form>
                        </div>
                    </Modal>

                    {/* 编辑对话框 */}
                    <Modal title="编辑模型" visible={editModalVisible} onOk={handleEditConfirm} onCancel={() => setEditModalVisible(false)}>
                        <div style={{maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px'}}>
                            <Form ref={editFormRef} layout="vertical" className="modal-form">
                                <Form.Item label="名称" field="name" rules={[{required: true, message: '请输入名称'}]}>
                                    <Input placeholder="请输入名称" />
                                </Form.Item>
                                <Form.Item label="提供者" field="provider">
                                    <Input placeholder="请输入提供者" disabled />
                                </Form.Item>
                                <Form.Item label="类型" field="type">
                                    <Select placeholder="请选择类型" allowClear disabled>{typeOptions.map(opt => <Option key={opt.value} value={opt.value}>{opt.label}</Option>)}</Select>
                                </Form.Item>
                                <Form.Item label="API Key" field="apiKey">
                                    <Input placeholder="API Key（可选更新）" />
                                </Form.Item>
                                <Form.Item label="API 端点" field="apiEndpoint">
                                    <Input placeholder="请输入 API 端点" />
                                </Form.Item>
                                <Form.Item label="上下文窗口" field="contextWindow">
                                    <Input placeholder="上下文窗口大小（整数）" />
                                </Form.Item>
                                <Form.Item label="输入单价(分/千token)" field="inputPricePer1k">
                                    <Input placeholder="输入单价" />
                                </Form.Item>
                                <Form.Item label="输出单价(分/千token)" field="outputPricePer1k">
                                    <Input placeholder="输出单价" />
                                </Form.Item>
                                <Form.Item label="描述" field="description">
                                    <TextArea placeholder="请输入描述" autoSize={{minRows: 3, maxRows: 6}} />
                                </Form.Item>
                                <Form.Item label="配置(JSON)" field="config">
                                    <TextArea placeholder='可选 JSON 配置' autoSize={{minRows: 2, maxRows: 6}} />
                                </Form.Item>
                            </Form>
                        </div>
                    </Modal>

                    {/* 删除确认 */}
                    <Modal title="确认删除" visible={deleteModalVisible} onOk={handleDeleteConfirm} onCancel={() => setDeleteModalVisible(false)}>
                        <div className="delete-modal">确定要删除该模型吗？此操作不可恢复。</div>
                    </Modal>

                </Content>
            </Layout>
        </div>
    );
}

export default LlmModelManager;