import React, {useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {
    Button,
    Dropdown,
    Form,
    Grid,
    Input,
    Layout,
    Menu,
    Message,
    Modal,
    Pagination,
    Space,
    Table
} from '@arco-design/web-react';
import {IconDelete, IconEdit, IconList} from '@arco-design/web-react/icon';
import './style/index.less';
import {createMindMap, deleteMindMap, getMindMapList, updateMindMapBasicInfo} from './api/mindMapService';
import {MindMapDto, PaginationConfig} from './types';

const {Content} = Layout;
const {Row, Col} = Grid;

const MindMapListPage: React.FC = () => {
    const navigate = useNavigate();

    // 状态管理
    const [tableData, setTableData] = useState<MindMapDto[]>([]);
    const [tableLoading, setTableLoading] = useState<boolean>(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
    const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
    const [currentRecord, setCurrentRecord] = useState<MindMapDto | null>(null);
    const [showMyMaps, setShowMyMaps] = useState<boolean>(true);
    const [showSharedMaps, setShowSharedMaps] = useState<boolean>(true);
    const [searchKeyword, setSearchKeyword] = useState<string>('');
    const [createForm] = Form.useForm();

    // 表单引用
    const filterFormRef = useRef(null);
    
    // 表格高度状态
    const [tableScrollHeight, setTableScrollHeight] = useState<number>(420);

    // 分页配置
    const [pagination, setPagination] = useState<PaginationConfig>({
        current: 1,
        pageSize: 20,
        total: 0,
        showTotal: true,
        showJumper: true,
        showPageSize: true,
    });

    // 加载思维导图列表
    const loadMindMaps = async () => {
        try {
            setTableLoading(true);
            let result;

            result = await getMindMapList({
                pageNum: pagination.current - 1,
                pageSize: pagination.pageSize,
                mapName: searchKeyword
            });

            // 处理返回结果
            if (result.data?.content || Array.isArray(result.data)) {
                const data = Array.isArray(result.data) ? result.data : result.data.content;

                setTableData(data);
                // 设置总数（如果是分页查询则使用返回的总数，否则使用数组长度）
                setPagination(prev => ({
                    ...prev,
                    total: Array.isArray(result.data) ? result.data.length : result.data.totalElements || 0
                }));
            } else {
                setTableData([]);
                setPagination({...pagination, total: 0});
            }
        } catch (error) {
            console.error('加载思维导图列表失败:', error);
            Message.error('加载思维导图列表失败');
            setTableData([]);
            setPagination({...pagination, total: 0});
        } finally {
            setTableLoading(false);
        }
    };

    // 计算表格高度的函数
    const calculateTableHeight = () => {
        const windowHeight = window.innerHeight;
        const otherElementsHeight = 190; // 其他元素占用的高度
        const newHeight = Math.max(200, windowHeight - otherElementsHeight);
        setTableScrollHeight(newHeight);
    };

    // 初始加载和高度自适应
    useEffect(() => {
        loadMindMaps();
        calculateTableHeight(); // 初始化计算高度
        
        // 添加窗口大小改变事件监听
        const handleResize = () => calculateTableHeight();
        window.addEventListener('resize', handleResize);
        
        // 清理函数
        return () => window.removeEventListener('resize', handleResize);
    }, [pagination.current, pagination.pageSize]);

    // 处理搜索
    const handleSearch = (values: any) => {
        setSearchKeyword(values.mapName || '');
        setPagination(prev => ({...prev, current: 1}));
        loadMindMaps();
    };


    // 处理创建新思维导图
    const handleCreate = () => {
        createForm.resetFields();
        setCreateModalVisible(true);
    };

    // 处理创建提交
    const handleCreateSubmit = async () => {
        try {
            // 获取表单值并触发表单验证
            const values = createForm.getFieldsValue();

            // 移除isShared字段，确保不提交共享相关信息
            const {isShared, ...createData} = values;

            setTableLoading(true);
            await createMindMap(createData);
            Message.success('创建成功');
            setCreateModalVisible(false);
            createForm.resetFields();
            // 重新加载列表
            loadMindMaps();
        } catch (error) {
            // 验证失败时不显示错误消息，因为表单会自动提示
            if (error && typeof error === 'object' && 'message' in error && !String(error.message).includes('validate')) {
                console.error('创建思维导图失败:', error);
                Message.error('创建失败');
            }
        } finally {
            setTableLoading(false);
        }
    };

    // 处理下拉菜单点击
    const handleMenuClick = (key: string, e: React.MouseEvent, record: MindMapDto) => {
        e.stopPropagation();
        switch (key) {
            case 'edit':
                handleEditInfo(record);
                break;
            case 'draw':
                handleDraw(record);
                break;
            case 'delete':
                confirmDelete(record);
                break;
            default:
                break;
        }
    };

    // 处理编辑思维导图信息（名称和描述）
    const handleEditInfo = (record: MindMapDto) => {
        setCurrentRecord(record);
        editForm.setFieldsValue({
            mapName: record.mapName,
            description: record.description || ''
        });
        setEditModalVisible(true);
    };

    // 处理点击思维导图名称进行编辑
    const handleEdit = (record: MindMapDto) => {
        handleEditInfo(record);
    };

    // 处理绘图（导航到绘图页面）
    const handleDraw = (record: MindMapDto) => {
        navigate(`/quiz/frame/mindmap/edit/${record.id}`);
    };

    // 编辑表单
    const [editForm] = Form.useForm();
    const [editModalVisible, setEditModalVisible] = useState<boolean>(false);

    // 处理编辑提交
    const handleEditSubmit = async () => {
        if (!currentRecord?.id) return;

        try {
            const values = editForm.getFieldsValue();
            setTableLoading(true);
            // 调用更新思维导图基本信息的API
            await updateMindMapBasicInfo({id: currentRecord.id, ...values});
            Message.success('更新成功');
            setEditModalVisible(false);
            // 重新加载列表
            loadMindMaps();
        } catch (error) {
            console.error('更新思维导图失败:', error);
            Message.error('更新失败');
        } finally {
            setTableLoading(false);
        }
    };

    // 处理删除思维导图
    const handleDelete = async () => {
        if (!currentRecord?.id) return;

        try {
            setTableLoading(true);
            console.log('删除思维导图ID:', currentRecord.id);
            const response = await deleteMindMap(currentRecord.id);
            console.log('删除响应:', response);
            Message.success('删除成功');
            setDeleteModalVisible(false);
            // 重新加载列表
            loadMindMaps();
        } catch (error) {
            console.error('删除思维导图失败:', error);
            // 显示更详细的错误信息
            const errorMessage = error && typeof error === 'object' && 'message' in error ? String(error.message) : '删除失败';
            Message.error(errorMessage);
        } finally {
            setTableLoading(false);
        }
    };

    // 确认删除
    const confirmDelete = (record: MindMapDto) => {
        setCurrentRecord(record);
        setDeleteModalVisible(true);
    };

    // 表格列配置
    const columns = [
        {
            title: '思维导图名称',
            dataIndex: 'mapName',
            key: 'mapName',
            ellipsis: true,
            render: (text: string, record: MindMapDto) => (
                <span style={{cursor: 'pointer'}} onClick={() => handleEdit(record)}>
          {text}
        </span>
            ),
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: '创建人',
            dataIndex: 'createUserName',
            key: 'createUserName',
        },
        {
            title: '创建时间',
            dataIndex: 'createDate',
            key: 'createDate',
            render: (value) => {
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
                    const seconds = String(date.getSeconds()).padStart(2, '0');
                    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
                }
            },
        },
        {
            title: '操作',
            width: 80,
            align: 'center',
            fixed: 'right',
            render: (_: any, record: MindMapDto) => (
                <Dropdown
                    position="bl"
                    droplist={
                        <Menu
                            onClickMenuItem={(key, e) => {
                                handleMenuClick(key as string, e as React.MouseEvent, record);
                            }}
                            className="handle-dropdown-menu"
                        >
                            <Menu.Item key="draw">
                                <IconEdit style={{marginRight: '5px'}}/>
                                绘图
                            </Menu.Item>
                            <Menu.Item key="edit">
                                <IconEdit style={{marginRight: '5px'}}/>
                                编辑
                            </Menu.Item>
                            <Menu.Item key="delete">
                                <IconDelete style={{marginRight: '5px'}}/>
                                删除
                            </Menu.Item>
                        </Menu>
                    }
                >
                    <Button
                        type="text"
                        className="more-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                    >
                        <IconList/>
                    </Button>
                </Dropdown>
            ),
        },
    ];

    return (
        <Layout className="mindmap-list-page">
            <Content className="mindmap-list-content">
                {/* 筛选表单和操作按钮 */}
                <Form ref={filterFormRef} layout="horizontal" className="filter-form" style={{marginTop: '10px'}}>
                    <Row gutter={16}>
                        <Col span={6}>
                            <Form.Item field="mapName" label="名称">
                                <Input placeholder="请输入导图名称"/>
                            </Form.Item>
                        </Col>
                        <Col span={6} style={{
                            display: 'flex',
                            justifyContent: 'flex-start',
                            alignItems: 'flex-end',
                            paddingBottom: '16px'
                        }}>
                            <Space>
                                <Button type="primary" onClick={() => {
                                    const values = filterFormRef.current?.getFieldsValue?.() || {};
                                    handleSearch(values);
                                }}>
                                    搜索
                                </Button>
                                <Button type="primary" status="success" onClick={handleCreate}>
                                    新建
                                </Button>
                            </Space>
                        </Col>
                    </Row>
                </Form>

                <Table
                    columns={columns}
                    data={tableData}
                    loading={tableLoading}
                    rowKey="id"
                    pagination={false}
                    tableLayout="auto"
                    scroll={{
                        y: tableScrollHeight,
                    }}
                />
                {/* 分页 */}
                <div className="pagination-wrapper">
                    <Pagination
                        {...pagination}
                        onChange={(current, pageSize) => {
                            setPagination(prev => ({
                                ...prev,
                                current,
                                pageSize
                            }));
                        }}
                    />
                </div>

                {/* 创建思维导图模态框 */}
                <Modal
                    title="创建思维导图"
                    visible={createModalVisible}
                    onOk={handleCreateSubmit}
                    onCancel={() => setCreateModalVisible(false)}
                    okText="确定"
                    cancelText="取消"
                    confirmLoading={tableLoading}
                >
                    <Form
                        form={createForm}
                        layout="vertical"
                        onFinish={handleCreateSubmit}
                        autoComplete="off"
                    >
                        <Form.Item
                            label="思维导图名称"
                            field="mapName"
                            rules={[{required: true, message: '请输入思维导图名称'}]}
                        >
                            <Input placeholder="请输入思维导图名称"/>
                        </Form.Item>
                        <Form.Item
                            label="描述"
                            field="description"
                        >
                            <Input.TextArea
                                placeholder="请输入描述（可选）"
                                rows={4}
                            />
                        </Form.Item>
                    </Form>
                </Modal>

                {/* 编辑思维导图信息模态框 */}
                <Modal
                    title="编辑思维导图信息"
                    visible={editModalVisible}
                    onOk={handleEditSubmit}
                    onCancel={() => setEditModalVisible(false)}
                    okText="确定"
                    cancelText="取消"
                    confirmLoading={tableLoading}
                >
                    <Form
                        form={editForm}
                        layout="vertical"
                        onFinish={handleEditSubmit}
                        autoComplete="off"
                    >
                        <Form.Item
                            label="思维导图名称"
                            field="mapName"
                            rules={[{required: true, message: '请输入思维导图名称'}]}
                        >
                            <Input placeholder="请输入思维导图名称"/>
                        </Form.Item>
                        <Form.Item
                            label="描述"
                            field="description"
                        >
                            <Input.TextArea
                                placeholder="请输入描述（可选）"
                                rows={4}
                            />
                        </Form.Item>
                    </Form>
                </Modal>

                {/* 删除确认对话框 */}
                <Modal
                    title="删除确认"
                    visible={deleteModalVisible}
                    onOk={handleDelete}
                    onCancel={() => setDeleteModalVisible(false)}
                    okText="确认删除"
                    cancelText="取消"
                    okButtonProps={{danger: true}}
                    confirmLoading={tableLoading}
                >
                    <p>确定要删除思维导图「{currentRecord?.mapName}」吗？</p>
                    <p style={{color: '#ff4d4f', marginTop: 8}}>删除后将无法恢复，请谨慎操作。</p>
                </Modal>
            </Content>
        </Layout>
    );
};

export default MindMapListPage;