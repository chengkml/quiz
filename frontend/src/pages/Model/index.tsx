import React, {useEffect, useRef, useState} from 'react';
import {
    Button,
    Form,
    Input,
    InputNumber,
    Modal,
    Pagination,
    Select,
    Space,
    Spin,
    Table,
    Tag,
    Tooltip,
    Switch
} from '@arco-design/web-react';
import './index.less';
import {
    createModel,
    deleteModel,
    getActiveModels,
    getDefaultModel,
    getModelById,
    getModelList,
    setDefaultModel,
    updateModel
} from './api';
import {IconDelete, IconEdit, IconEye, IconPlus, IconSetDefault} from '@arco-design/web-react/icon';
import Message from '@arco-design/web-react/es/Message';

const {TextArea} = Input;

// 模型类型枚举
const ModelType = {
    TEXT: 'TEXT',
    CHAT: 'CHAT',
    EMBEDDING: 'EMBEDDING',
    MULTIMODAL: 'MULTIMODAL'
} as const;

// 模型状态枚举
const ModelStatus = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE'
} as const;

// 类型定义
type ModelType = typeof ModelType[keyof typeof ModelType];
type ModelStatus = typeof ModelStatus[keyof typeof ModelStatus];

interface ModelRecord {
    id: string;
    name: string;
    provider: string;
    type: ModelType;
    description?: string;
    apiEndpoint: string;
    contextWindow?: number;
    inputPricePer1k: number;
    outputPricePer1k: number;
    isDefault: boolean;
    status: ModelStatus;
    config?: string;
    createDate: string;
    createUser: string;
    createUserName?: string;
    updateDate: string;
    updateUser: string;
}

interface ModelCreateForm {
    name: string;
    provider: string;
    type: ModelType;
    description?: string;
    apiKey: string;
    apiEndpoint: string;
    contextWindow?: number;
    inputPricePer1k: number;
    outputPricePer1k: number;
    isDefault: boolean;
    config?: string;
}

interface ModelUpdateForm {
    id: string;
    name?: string;
    description?: string;
    apiKey?: string;
    apiEndpoint?: string;
    contextWindow?: number;
    inputPricePer1k?: number;
    outputPricePer1k?: number;
    isDefault?: boolean;
    status?: ModelStatus;
    config?: string;
}

function ModelManager() {
    // 状态管理
    const [tableData, setTableData] = useState<ModelRecord[]>([]);
    const [tableLoading, setTableLoading] = useState(false);

    // 对话框状态
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<ModelRecord | null>(null);

    // 表单引用
    const addFormRef = useRef<FormInstance>(null);
    const editFormRef = useRef<FormInstance>(null);
    const searchFormRef = useRef<FormInstance>(null);

    // 分页配置
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0,
        showTotal: true,
        showJumper: true,
        showPageSize: true,
    });

    // 搜索条件
    const [searchParams, setSearchParams] = useState({
        name: '',
        provider: '',
        type: undefined as ModelType | undefined,
        status: undefined as ModelStatus | undefined,
        isDefault: undefined as boolean | undefined
    });

    // 模型类型选项
    const modelTypeOptions = [
        {label: '文本模型', value: ModelType.TEXT},
        {label: '聊天模型', value: ModelType.CHAT},
        {label: '嵌入模型', value: ModelType.EMBEDDING},
        {label: '多模态模型', value: ModelType.MULTIMODAL}
    ];

    // 模型状态选项
    const modelStatusOptions = [
        {label: '激活', value: ModelStatus.ACTIVE},
        {label: '停用', value: ModelStatus.INACTIVE}
    ];

    // 加载模型列表
    const loadModelList = async () => {
        setTableLoading(true);
        try {
            const params = {
                ...searchParams,
                pageNum: pagination.current - 1,
                pageSize: pagination.pageSize,
                sortColumn: 'create_date',
                sortType: 'desc'
            };
            const response = await getModelList(params);
            const data = response.data;
            setTableData(data.content || []);
            setPagination(prev => ({
                ...prev,
                total: data.totalElements || 0
            }));
        } catch (error) {
            Message.error('获取模型列表失败');
        } finally {
            setTableLoading(false);
        }
    };

    // 初始化加载
    useEffect(() => {
        loadModelList();
    }, [pagination.current, pagination.pageSize]);

    // 渲染创建时间
    const renderCreateDate = (value: string) => {
        if (!value) return '--';

        const now = new Date();
        const date = new Date(value);
        const diffMs = now.getTime() - date.getTime();
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        // 今天
        if (diffDays === 0) {
            if (diffSeconds < 60) {
                return `${diffSeconds}秒前`;
            } else if (diffMinutes < 60) {
                return `${diffMinutes}分钟前`;
            } else {
                return `${diffHours}小时前`;
            }
        }
        // 昨天
        else if (diffDays === 1) {
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `昨天 ${hours}:${minutes}`;
        }
        // 昨天之前
        else {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}`;
        }
    };

    // 渲染模型类型
    const renderModelType = (value: ModelType) => {
        const typeMap = {
            [ModelType.TEXT]: {text: '文本模型', color: 'blue'},
            [ModelType.CHAT]: {text: '聊天模型', color: 'purple'},
            [ModelType.EMBEDDING]: {text: '嵌入模型', color: 'green'},
            [ModelType.MULTIMODAL]: {text: '多模态模型', color: 'orange'}
        };
        const config = typeMap[value];
        return <Tag color={config.color} bordered>{config.text}</Tag>;
    };

    // 渲染模型状态
    const renderModelStatus = (value: ModelStatus) => {
        const statusMap = {
            [ModelStatus.ACTIVE]: {text: '激活', color: 'green'},
            [ModelStatus.INACTIVE]: {text: '停用', color: 'gray'}
        };
        const config = statusMap[value];
        return <Tag color={config.color} bordered>{config.text}</Tag>;
    };

    // 渲染是否默认
    const renderIsDefault = (value: boolean) => {
        return value ? (
            <Tag color="red" bordered>默认</Tag>
        ) : null;
    };

    // 表格列配置
    const columns = [
        {
            title: '模型名称',
            dataIndex: 'name',
            minWidth: 200,
            ellipsis: true,
        },
        {
            title: '提供商',
            dataIndex: 'provider',
            width: 150,
        },
        {
            title: '模型类型',
            dataIndex: 'type',
            width: 120,
            render: renderModelType,
        },
        {
            title: '输入价格(分/千token)',
            dataIndex: 'inputPricePer1k',
            width: 150,
            render: (value: number) => <span className="price-display">{value}</span>,
        },
        {
            title: '输出价格(分/千token)',
            dataIndex: 'outputPricePer1k',
            width: 150,
            render: (value: number) => <span className="price-display">{value}</span>,
        },
        {
            title: '状态',
            dataIndex: 'status',
            width: 100,
            render: renderModelStatus,
        },
        {
            title: '默认',
            dataIndex: 'isDefault',
            width: 80,
            render: renderIsDefault,
        },
        {
            title: '创建时间',
            dataIndex: 'createDate',
            width: 160,
            render: renderCreateDate,
        },
        {
            title: '创建人',
            dataIndex: 'createUser',
            width: 120,
        },
        {
            title: '操作',
            width: 200,
            render: (_, record: ModelRecord) => (
                <Space className="action-column">
                    <Tooltip title="查看详情">
                        <Button
                            size="small"
                            icon={<IconEye />}
                            onClick={() => handleViewDetail(record)}
                        />
                    </Tooltip>
                    <Tooltip title="编辑">
                        <Button
                            size="small"
                            icon={<IconEdit />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    {record.status === ModelStatus.ACTIVE && !record.isDefault && (
                        <Tooltip title="设为默认">
                            <Button
                                size="small"
                                icon={<IconSetDefault />}
                                onClick={() => handleSetDefault(record.id)}
                            />
                        </Tooltip>
                    )}
                    <Tooltip title="删除">
                        <Button
                            size="small"
                            icon={<IconDelete />}
                            status="danger"
                            onClick={() => handleDelete(record)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    // 处理搜索
    const handleSearch = () => {
        setPagination(prev => ({...prev, current: 1}));
    };

    // 处理重置搜索
    const handleReset = () => {
        searchFormRef.current?.resetFields();
        setSearchParams({
            name: '',
            provider: '',
            type: undefined,
            status: undefined,
            isDefault: undefined
        });
    };

    // 处理添加模型
    const handleAdd = () => {
        addFormRef.current?.resetFields();
        setAddModalVisible(true);
    };

    // 处理编辑模型
    const handleEdit = (record: ModelRecord) => {
        setCurrentRecord(record);
        editFormRef.current?.setFieldsValue({
            id: record.id,
            name: record.name,
            description: record.description,
            apiEndpoint: record.apiEndpoint,
            contextWindow: record.contextWindow,
            inputPricePer1k: record.inputPricePer1k,
            outputPricePer1k: record.outputPricePer1k,
            isDefault: record.isDefault,
            status: record.status,
            config: record.config
        });
        setEditModalVisible(true);
    };

    // 处理删除模型
    const handleDelete = (record: ModelRecord) => {
        setCurrentRecord(record);
        setDeleteModalVisible(true);
    };

    // 处理查看详情
    const handleViewDetail = async (record: ModelRecord) => {
        try {
            const response = await getModelById(record.id);
            setCurrentRecord(response.data);
            setDetailModalVisible(true);
        } catch (error) {
            Message.error('获取模型详情失败');
        }
    };

    // 处理设为默认
    const handleSetDefault = async (modelId: string) => {
        Modal.confirm({
            title: '确认操作',
            content: '确定要将该模型设为默认模型吗？',
            onOk: async () => {
                try {
                    await setDefaultModel(modelId);
                    Message.success('设置默认模型成功');
                    loadModelList();
                } catch (error) {
                    Message.error('设置默认模型失败');
                }
            }
        });
    };

    // 提交添加表单
    const handleAddSubmit = async () => {
        if (!addFormRef.current) return;
        try {
            const values = await addFormRef.current.validateFields() as ModelCreateForm;
            await createModel(values);
            Message.success('创建模型成功');
            setAddModalVisible(false);
            loadModelList();
        } catch (error) {
            // 表单验证失败或提交失败
            console.error('创建模型失败:', error);
        }
    };

    // 提交编辑表单
    const handleEditSubmit = async () => {
        if (!editFormRef.current) return;
        try {
            const values = await editFormRef.current.validateFields() as ModelUpdateForm;
            await updateModel(values);
            Message.success('更新模型成功');
            setEditModalVisible(false);
            loadModelList();
        } catch (error) {
            // 表单验证失败或提交失败
            console.error('更新模型失败:', error);
        }
    };

    // 确认删除
    const handleDeleteConfirm = async () => {
        if (!currentRecord) return;
        try {
            await deleteModel(currentRecord.id);
            Message.success('删除模型成功');
            setDeleteModalVisible(false);
            loadModelList();
        } catch (error) {
            Message.error('删除模型失败');
        }
    };

    return (
        <div className="model-manager">
            <div className="arco-layout">
                <div className="arco-layout-content">
                    {/* 搜索表单 */}
                    <Form
                        ref={searchFormRef}
                        className="search-form"
                        initialValues={searchParams}
                        onValuesChange={(_, values) => setSearchParams(values as any)}
                    >
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px'}}>
                            <Form.Item field="name" label="模型名称">
                                <Input placeholder="请输入模型名称" />
                            </Form.Item>
                            <Form.Item field="provider" label="提供商">
                                <Input placeholder="请输入提供商" />
                            </Form.Item>
                            <Form.Item field="type" label="模型类型">
                                <Select
                                    placeholder="请选择模型类型"
                                    options={modelTypeOptions}
                                />
                            </Form.Item>
                            <Form.Item field="status" label="状态">
                                <Select
                                    placeholder="请选择状态"
                                    options={modelStatusOptions}
                                />
                            </Form.Item>
                            <Form.Item field="isDefault" label="是否默认">
                                <Select
                                    placeholder="请选择"
                                    options={[
                                        {label: '是', value: true},
                                        {label: '否', value: false}
                                    ]}
                                />
                            </Form.Item>
                        </div>
                        <div style={{display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '16px'}}>
                            <Button onClick={handleReset}>重置</Button>
                            <Button type="primary" onClick={handleSearch}>搜索</Button>
                        </div>
                    </Form>

                    {/* 操作按钮 */}
                    <div className="action-buttons">
                        <Button type="primary" icon={<IconPlus />} onClick={handleAdd}>
                            添加模型
                        </Button>
                    </div>

                    {/* 表格 */}
                    <div className="table-container">
                        <Table
                            columns={columns}
                            data={tableData}
                            loading={tableLoading}
                            rowKey="id"
                            pagination={false}
                            scroll={{y: 'calc(100vh - 400px)'}}
                        />
                    </div>

                    {/* 分页 */}
                    <div className="pagination-wrapper">
                        <Pagination
                            {...pagination}
                            onChange={(page, pageSize) => {
                                setPagination(prev => ({
                                    ...prev,
                                    current: page,
                                    pageSize
                                }));
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* 添加模型对话框 */}
            <Modal
                title="添加模型"
                open={addModalVisible}
                onOk={handleAddSubmit}
                onCancel={() => setAddModalVisible(false)}
                okText="确定"
                cancelText="取消"
                width={800}
            >
                <Form ref={addFormRef} layout="vertical">
                    <div className="form-container">
                        <Form.Item
                            field="name"
                            label="模型名称"
                            rules={[{required: true, message: '请输入模型名称'}]}
                        >
                            <Input placeholder="请输入模型名称" />
                        </Form.Item>
                        <Form.Item
                            field="provider"
                            label="提供商"
                            rules={[{required: true, message: '请输入提供商'}]}
                        >
                            <Input placeholder="请输入提供商" />
                        </Form.Item>
                        <Form.Item
                            field="type"
                            label="模型类型"
                            rules={[{required: true, message: '请选择模型类型'}]}
                        >
                            <Select
                                placeholder="请选择模型类型"
                                options={modelTypeOptions}
                            />
                        </Form.Item>
                        <Form.Item field="description" label="模型描述">
                            <TextArea placeholder="请输入模型描述" rows={3} />
                        </Form.Item>
                        <Form.Item
                            field="apiKey"
                            label="API 密钥"
                            rules={[{required: true, message: '请输入API密钥'}]}
                        >
                            <Input.Password placeholder="请输入API密钥" />
                        </Form.Item>
                        <Form.Item
                            field="apiEndpoint"
                            label="API 端点"
                            rules={[{required: true, message: '请输入API端点'}]}
                        >
                            <Input placeholder="请输入API端点" />
                        </Form.Item>
                        <Form.Item field="contextWindow" label="上下文窗口大小">
                            <InputNumber placeholder="请输入上下文窗口大小" />
                        </Form.Item>
                        <Form.Item
                            field="inputPricePer1k"
                            label="输入价格(分/千token)"
                            rules={[{required: true, message: '请输入输入价格'}]}
                        >
                            <InputNumber
                                placeholder="请输入输入价格"
                                precision={6}
                                min={0}
                            />
                        </Form.Item>
                        <Form.Item
                            field="outputPricePer1k"
                            label="输出价格(分/千token)"
                            rules={[{required: true, message: '请输入输出价格'}]}
                        >
                            <InputNumber
                                placeholder="请输入输出价格"
                                precision={6}
                                min={0}
                            />
                        </Form.Item>
                        <Form.Item field="isDefault" label="设为默认模型">
                            <Switch />
                        </Form.Item>
                        <Form.Item field="config" label="配置信息（JSON格式）">
                            <TextArea placeholder="请输入JSON格式的配置信息" rows={4} />
                        </Form.Item>
                    </div>
                </Form>
            </Modal>

            {/* 编辑模型对话框 */}
            <Modal
                title="编辑模型"
                open={editModalVisible}
                onOk={handleEditSubmit}
                onCancel={() => setEditModalVisible(false)}
                okText="确定"
                cancelText="取消"
                width={800}
            >
                <Form ref={editFormRef} layout="vertical">
                    <Form.Item field="id" hidden>
                        <Input />
                    </Form.Item>
                    <div className="form-container">
                        <Form.Item field="name" label="模型名称">
                            <Input placeholder="请输入模型名称" />
                        </Form.Item>
                        <Form.Item field="description" label="模型描述">
                            <TextArea placeholder="请输入模型描述" rows={3} />
                        </Form.Item>
                        <Form.Item field="apiKey" label="API 密钥">
                            <Input.Password placeholder="请输入API密钥（为空则保持不变）" />
                        </Form.Item>
                        <Form.Item field="apiEndpoint" label="API 端点">
                            <Input placeholder="请输入API端点" />
                        </Form.Item>
                        <Form.Item field="contextWindow" label="上下文窗口大小">
                            <InputNumber placeholder="请输入上下文窗口大小" />
                        </Form.Item>
                        <Form.Item field="inputPricePer1k" label="输入价格(分/千token)">
                            <InputNumber
                                placeholder="请输入输入价格"
                                precision={6}
                                min={0}
                            />
                        </Form.Item>
                        <Form.Item field="outputPricePer1k" label="输出价格(分/千token)">
                            <InputNumber
                                placeholder="请输入输出价格"
                                precision={6}
                                min={0}
                            />
                        </Form.Item>
                        <Form.Item field="status" label="状态">
                            <Select
                                placeholder="请选择状态"
                                options={modelStatusOptions}
                            />
                        </Form.Item>
                        <Form.Item field="isDefault" label="设为默认模型">
                            <Switch />
                        </Form.Item>
                        <Form.Item field="config" label="配置信息（JSON格式）">
                            <TextArea placeholder="请输入JSON格式的配置信息" rows={4} />
                        </Form.Item>
                    </div>
                </Form>
            </Modal>

            {/* 删除确认对话框 */}
            <Modal
                title="删除确认"
                open={deleteModalVisible}
                onOk={handleDeleteConfirm}
                onCancel={() => setDeleteModalVisible(false)}
                okText="确认删除"
                cancelText="取消"
                okButtonProps={{status: 'danger'}}
            >
                <p>确定要删除模型 "{currentRecord?.name}" 吗？</p>
            </Modal>

            {/* 模型详情对话框 */}
            <Modal
                title="模型详情"
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setDetailModalVisible(false)}>
                        关闭
                    </Button>
                ]}
                width={800}
            >
                {currentRecord && (
                    <div className="form-container">
                        <div style={{marginBottom: '16px'}}>
                            <label style={{display: 'inline-block', width: '100px', fontWeight: '500'}}>
                                模型名称：
                            </label>
                            <span>{currentRecord.name}</span>
                        </div>
                        <div style={{marginBottom: '16px'}}>
                            <label style={{display: 'inline-block', width: '100px', fontWeight: '500'}}>
                                提供商：
                            </label>
                            <span>{currentRecord.provider}</span>
                        </div>
                        <div style={{marginBottom: '16px'}}>
                            <label style={{display: 'inline-block', width: '100px', fontWeight: '500'}}>
                                模型类型：
                            </label>
                            {renderModelType(currentRecord.type)}
                        </div>
                        <div style={{marginBottom: '16px'}}>
                            <label style={{display: 'inline-block', width: '100px', fontWeight: '500'}}>
                                描述：
                            </label>
                            <span>{currentRecord.description || '-'}</span>
                        </div>
                        <div style={{marginBottom: '16px'}}>
                            <label style={{display: 'inline-block', width: '100px', fontWeight: '500'}}>
                                API 端点：
                            </label>
                            <span>{currentRecord.apiEndpoint}</span>
                        </div>
                        <div style={{marginBottom: '16px'}}>
                            <label style={{display: 'inline-block', width: '100px', fontWeight: '500'}}>
                                上下文窗口：
                            </label>
                            <span>{currentRecord.contextWindow || '-'}</span>
                        </div>
                        <div style={{marginBottom: '16px'}}>
                            <label style={{display: 'inline-block', width: '100px', fontWeight: '500'}}>
                                输入价格：
                            </label>
                            <span className="price-display">{currentRecord.inputPricePer1k} 分/千token</span>
                        </div>
                        <div style={{marginBottom: '16px'}}>
                            <label style={{display: 'inline-block', width: '100px', fontWeight: '500'}}>
                                输出价格：
                            </label>
                            <span className="price-display">{currentRecord.outputPricePer1k} 分/千token</span>
                        </div>
                        <div style={{marginBottom: '16px'}}>
                            <label style={{display: 'inline-block', width: '100px', fontWeight: '500'}}>
                                状态：
                            </label>
                            {renderModelStatus(currentRecord.status)}
                        </div>
                        <div style={{marginBottom: '16px'}}>
                            <label style={{display: 'inline-block', width: '100px', fontWeight: '500'}}>
                                默认：
                            </label>
                            {renderIsDefault(currentRecord.isDefault)}
                        </div>
                        <div style={{marginBottom: '16px'}}>
                            <label style={{display: 'inline-block', width: '100px', fontWeight: '500'}}>
                                创建时间：
                            </label>
                            <span>{currentRecord.createDate}</span>
                        </div>
                        <div style={{marginBottom: '16px'}}>
                            <label style={{display: 'inline-block', width: '100px', fontWeight: '500'}}>
                                创建人：
                            </label>
                            <span>{currentRecord.createUser}</span>
                        </div>
                        <div style={{marginBottom: '16px'}}>
                            <label style={{display: 'inline-block', width: '100px', fontWeight: '500'}}>
                                更新时间：
                            </label>
                            <span>{currentRecord.updateDate}</span>
                        </div>
                        <div style={{marginBottom: '16px'}}>
                            <label style={{display: 'inline-block', width: '100px', fontWeight: '500'}}>
                                更新人：
                            </label>
                            <span>{currentRecord.updateUser}</span>
                        </div>
                        {currentRecord.config && (
                            <div>
                                <label style={{display: 'block', fontWeight: '500', marginBottom: '8px'}}>
                                    配置信息：
                                </label>
                                <pre style={{background: '#f5f5f5', padding: '12px', borderRadius: '4px', whiteSpace: 'pre-wrap'}}>
                                    {currentRecord.config}
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default ModelManager;