import React, {useEffect, useRef, useState} from 'react';
import {
    Button,
    Form,
    Grid,
    Input,
    Layout,
    Message,
    Modal,
    Pagination,
    Select,
    Space,
    Table,
    Tag
} from '@arco-design/web-react';
import {IconDelete, IconEdit, IconPlus, IconSearch} from '@arco-design/web-react/icon';
import './style/index.less';

const {Content} = Layout;
const {TextArea} = Input;
const {Option} = Select;
const {Row, Col} = Grid;

// 文档类型选项
const docTypeOptions = [
    {label: '文档', value: 'DOC'},
    {label: '图片', value: 'IMAGE'},
    {label: 'PDF', value: 'PDF'},
    {label: '其他', value: 'OTHER'},
];

// 文档状态选项
const docStatusOptions = [
    {label: '草稿', value: 'DRAFT'},
    {label: '已发布', value: 'PUBLISHED'},
    {label: '已归档', value: 'ARCHIVED'},
];

function DocManager() {
    // 表格数据与状态
    const [tableData, setTableData] = useState<any[]>([]);
    // 模拟数据状态（用于增删改操作）
    const [mockData, setMockData] = useState<any[]>([...mockDocData]);
    const [tableLoading, setTableLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0,
        showTotal: true,
        showJumper: true,
        showPageSize: true,
    });

    // 当前记录与弹窗
    const [currentRecord, setCurrentRecord] = useState<any | null>(null);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);

    // 表单引用
    const addFormRef = useRef<any>(null);
    const editFormRef = useRef<any>(null);
    const filterFormRef = useRef<any>(null);

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
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }
    };

    // 获取文档类型标签样式
    const getDocTypeTag = (type: string) => {
        switch (type) {
            case 'DOC':
                return <Tag className="doc-type-tag type-doc">文档</Tag>;
            case 'IMAGE':
                return <Tag className="doc-type-tag type-image">图片</Tag>;
            case 'PDF':
                return <Tag className="doc-type-tag type-pdf">PDF</Tag>;
            default:
                return <Tag className="doc-type-tag type-other">其他</Tag>;
        }
    };

    // 模拟文档数据 - 定义在组件外部，确保初始化时可用
    const mockDocData = [
        {
            id: '1',
            title: '项目需求文档',
            type: 'DOC',
            status: 'PUBLISHED',
            description: '详细的项目需求规格说明',
            content: '这是一个详细的项目需求文档...',
            createDate: new Date(Date.now() - 86400000 * 3).toISOString(),
            updateDate: new Date(Date.now() - 86400000).toISOString(),
            creator: '张三'
        },
        {
            id: '2',
            title: '系统架构图',
            type: 'IMAGE',
            status: 'PUBLISHED',
            description: '系统整体架构设计图',
            content: '',
            createDate: new Date(Date.now() - 86400000 * 5).toISOString(),
            updateDate: new Date(Date.now() - 86400000 * 2).toISOString(),
            creator: '李四'
        },
        {
            id: '3',
            title: '用户指南.pdf',
            type: 'PDF',
            status: 'DRAFT',
            description: '用户操作手册初稿',
            content: '',
            createDate: new Date(Date.now() - 86400000).toISOString(),
            updateDate: new Date(Date.now() - 3600000).toISOString(),
            creator: '王五'
        },
        {
            id: '4',
            title: '技术方案讨论',
            type: 'DOC',
            status: 'ARCHIVED',
            description: '技术选型讨论记录',
            content: '会议讨论内容...',
            createDate: new Date(Date.now() - 86400000 * 10).toISOString(),
            updateDate: new Date(Date.now() - 86400000 * 8).toISOString(),
            creator: '赵六'
        },
        {
            id: '5',
            title: '演示视频',
            type: 'OTHER',
            status: 'PUBLISHED',
            description: '产品功能演示视频',
            content: '',
            createDate: new Date(Date.now() - 86400000 * 2).toISOString(),
            updateDate: new Date(Date.now() - 86400000).toISOString(),
            creator: '孙七'
        }
    ];

    // 获取表格数据
    const fetchTableData = async (params: any = {}, pageSize: number = pagination.pageSize, current: number = pagination.current) => {
        setTableLoading(true);
        try {
            // 模拟API调用延迟
            await new Promise(resolve => setTimeout(resolve, 500));

            // 过滤数据 - 添加安全检查
            let filteredData = Array.isArray(mockData) ? [...mockData] : [];
            // 确保所有项都有id属性
            filteredData = filteredData.filter(item => item && typeof item === 'object' && item.id !== undefined);

            if (params.title) {
                filteredData = filteredData.filter(item => item.title && item.title.includes(params.title));
            }
            if (params.type) {
                filteredData = filteredData.filter(item => item.type === params.type);
            }
            if (params.status) {
                filteredData = filteredData.filter(item => item.status === params.status);
            }

            // 分页处理
            const startIndex = Math.max(0, (current - 1) * pageSize);
            const endIndex = startIndex + pageSize;
            const paginatedData = filteredData.slice(startIndex, endIndex);

            setTableData(paginatedData || []);
            setPagination(prev => ({
                ...prev,
                current,
                pageSize,
                total: filteredData.length,
            }));


            // 实际API调用代码（注释掉，使用模拟数据）
            /*
            const targetParams = {
                ...params,
                pageNum: current - 1,
                pageSize: pageSize,
                sortColumn: 'createDate',
                sortType: 'desc',
            };
            const response = await getDocList(targetParams);
            if (response.data) {
                setTableData(response.data.content || []);
                setPagination(prev => ({
                    ...prev,
                    current,
                    pageSize,
                    total: response.data.totalElements || 0,
                }));
            }
            */
        } catch (error) {
            Message.error('获取文档数据失败');
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
                // 模拟创建文档
                const newDoc = {
                    id: Date.now().toString(),
                    ...values,
                    createDate: new Date().toISOString(),
                    updateDate: new Date().toISOString(),
                    creator: '当前用户' // 模拟当前登录用户
                };

                // 更新模拟数据
                setMockData(prevData => [newDoc, ...prevData]);

                Message.success('文档创建成功');
                setAddModalVisible(false);
                addFormRef.current?.resetFields?.();
                fetchTableData();

                // 实际API调用（注释掉）
                // await createDoc(values);
            }
        } catch (error) {
            if (error?.fields) return; // 表单校验错误
            Message.error('文档创建失败');
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
                content: record.content,
                type: record.type,
                status: record.status,
                description: record.description,
            });
        }, 50);
    };

    const handleEditConfirm = async () => {
        try {
            const values = await editFormRef.current?.validate?.();
            if (values && currentRecord) {
                // 模拟更新文档
                setMockData(prevData =>
                    prevData.map(doc =>
                        doc.id === currentRecord.id
                            ? {...doc, ...values, updateDate: new Date().toISOString()}
                            : doc
                    )
                );

                Message.success('文档更新成功');
                setEditModalVisible(false);
                fetchTableData();

                // 实际API调用（注释掉）
                /*
                const payload = {
                    ...values,
                    id: currentRecord.id
                };
                await updateDoc(payload);
                */
            }
        } catch (error) {
            if (error?.fields) return; // 表单校验错误
            Message.error('文档更新失败');
        }
    };

    // 删除
    const handleDelete = (record: any) => {
        setCurrentRecord(record);
        setDeleteModalVisible(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            if (currentRecord) {
                // 模拟删除文档
                setMockData(prevData => prevData.filter(doc => doc.id !== currentRecord.id));

                Message.success('文档删除成功');
                setDeleteModalVisible(false);
                fetchTableData();

                // 实际API调用（注释掉）
                // await deleteDoc(currentRecord.id);
            }
        } catch (error) {
            Message.error('文档删除失败');
        }
    };

    // 表格列定义
    const columns = [
        {
            title: '文档名称',
            dataIndex: 'title',
            key: 'title',
            ellipsis: true,
            width: 200,
        },
        {
            title: '类型',
            dataIndex: 'type',
            key: 'type',
            width: 100,
            render: (type: string) => getDocTypeTag(type),
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: string) => {
                const option = docStatusOptions.find(opt => opt.value === status);
                let tagClass = '';
                switch (status) {
                    case 'DRAFT':
                        tagClass = 'doc-status-tag status-draft';
                        break;
                    case 'PUBLISHED':
                        tagClass = 'doc-status-tag status-published';
                        break;
                    case 'ARCHIVED':
                        tagClass = 'doc-status-tag status-archived';
                        break;
                }
                return option ? <Tag className={tagClass}>{option.label}</Tag> : status;
            },
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            width: 300,
        },
        {
            title: '创建时间',
            dataIndex: 'createDate',
            key: 'createDate',
            width: 180,
            render: (date: string) => formatDateTime(date),
        },
        {
            title: '更新时间',
            dataIndex: 'updateDate',
            key: 'updateDate',
            width: 150,
            render: (date: string) => formatDateTime(date),
        },
        {
            title: '创建者',
            dataIndex: 'creator',
            key: 'creator',
            width: 100,
            ellipsis: true,
        },
        {
            title: '操作',
            key: 'action',
            width: 120,
            render: (_, record: any) => (
                <Space size={8}>
                    <Button size="small" icon={<IconEdit/>} onClick={() => handleEdit(record)}>编辑</Button>
                    <Button size="small" danger icon={<IconDelete/>} onClick={() => handleDelete(record)}>删除</Button>
                </Space>
            ),
        },
    ];

    // 初始加载数据
    useEffect(() => {
        fetchTableData();
    }, []);

    return (
        <div className="doc-manager">
            <Layout>
                <Content style={{padding: 0}}>
                    {/* 搜索和操作栏 */}
                    <Row gutter={16} className="action-buttons">
                        <Col span={24}>
                            <Form
                                ref={filterFormRef}
                                layout="inline"
                                style={{width: '100%'}}
                                onValuesChange={(changedValues) => {
                                    if (changedValues.title || changedValues.type || changedValues.status) {
                                        searchTableData(filterFormRef.current?.getFieldsValue?.() || {});
                                    }
                                }}
                            >
                                <Form.Item name="title" label="文档名称">
                                    <Input placeholder="请输入文档名称" allowClear style={{width: 200}}/>
                                </Form.Item>
                                <Form.Item name="type" label="文档类型">
                                    <Select placeholder="请选择文档类型" allowClear style={{width: 120}}>
                                        {docTypeOptions.map(option => (
                                            <Option key={option.value} value={option.value}>{option.label}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                                <Space>
                                    <Form.Item>
                                        <Button type="primary" icon={<IconSearch/>}>
                                            搜索
                                        </Button>
                                    </Form.Item>
                                    <Button type="primary" icon={<IconPlus/>} onClick={handleAdd}>
                                        新增文档
                                    </Button>
                                </Space>
                            </Form>
                        </Col>
                    </Row>

                    {/* 文档列表 */}
                    <div style={{position: 'relative', height: 'calc(100% - 120px)'}}>
                        <Table
                            columns={columns}
                            data={tableData}
                            loading={tableLoading}
                            pagination={false}
                            rowKey="id"
                            scroll={{y: 'calc(100% - 40px)'}}
                        />
                        {pagination.total > 0 && (
                            <div className="pagination-wrapper">
                                <Pagination
                                    {...pagination}
                                    onChange={handlePageChange}
                                    onPageSizeChange={handlePageChange}
                                />
                            </div>
                        )}
                    </div>
                </Content>
            </Layout>

            {/* 新增文档弹窗 */}
            <Modal
                title="新增文档"
                open={addModalVisible}
                onOk={handleAddConfirm}
                onCancel={() => setAddModalVisible(false)}
                okText="确认"
                cancelText="取消"
                width={600}
            >
                <Form
                    ref={addFormRef}
                    layout="vertical"
                    className="modal-form"
                >
                    <Form.Item
                        label="文档名称"
                        field="title"
                        rules={[{required: true, message: '请输入文档名称'}]}
                    >
                        <Input placeholder="请输入文档名称"/>
                    </Form.Item>
                    <Form.Item
                        label="文档类型"
                        field="type"
                        rules={[{required: true, message: '请选择文档类型'}]}
                    >
                        <Select placeholder="请选择文档类型">
                            {docTypeOptions.map(option => (
                                <Option key={option.value} value={option.value}>{option.label}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label="文档状态"
                        field="status"
                        initialValue="DRAFT"
                    >
                        <Select placeholder="请选择文档状态">
                            {docStatusOptions.map(option => (
                                <Option key={option.value} value={option.value}>{option.label}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label="文档描述"
                        field="description"
                    >
                        <Input placeholder="请输入文档描述"/>
                    </Form.Item>
                    <Form.Item
                        label="文档内容"
                        field="content"
                    >
                        <TextArea placeholder="请输入文档内容" rows={6}/>
                    </Form.Item>
                </Form>
            </Modal>

            {/* 编辑文档弹窗 */}
            <Modal
                title="编辑文档"
                open={editModalVisible}
                onOk={handleEditConfirm}
                onCancel={() => setEditModalVisible(false)}
                okText="确认"
                cancelText="取消"
                width={600}
            >
                <Form
                    ref={editFormRef}
                    layout="vertical"
                    className="modal-form"
                >
                    <Form.Item
                        label="文档名称"
                        field="title"
                        rules={[{required: true, message: '请输入文档名称'}]}
                    >
                        <Input placeholder="请输入文档名称"/>
                    </Form.Item>
                    <Form.Item
                        label="文档类型"
                        field="type"
                        rules={[{required: true, message: '请选择文档类型'}]}
                    >
                        <Select placeholder="请选择文档类型">
                            {docTypeOptions.map(option => (
                                <Option key={option.value} value={option.value}>{option.label}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label="文档状态"
                        field="status"
                    >
                        <Select placeholder="请选择文档状态">
                            {docStatusOptions.map(option => (
                                <Option key={option.value} value={option.value}>{option.label}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label="文档描述"
                        field="description"
                    >
                        <Input placeholder="请输入文档描述"/>
                    </Form.Item>
                    <Form.Item
                        label="文档内容"
                        field="content"
                    >
                        <TextArea placeholder="请输入文档内容" rows={6}/>
                    </Form.Item>
                </Form>
            </Modal>

            {/* 删除确认弹窗 */}
            <Modal
                title="删除确认"
                open={deleteModalVisible}
                onOk={handleDeleteConfirm}
                onCancel={() => setDeleteModalVisible(false)}
                okText="确认删除"
                cancelText="取消"
                okButtonProps={{danger: true}}
                className="delete-modal"
            >
                <p>确定要删除文档「{currentRecord?.title}」吗？此操作不可撤销。</p>
            </Modal>
        </div>
    );
}

export default DocManager;
