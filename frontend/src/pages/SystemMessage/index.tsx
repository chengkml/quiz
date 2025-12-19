import React, {useEffect, useRef, useState} from 'react';
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
    Select,
    Space,
    Table,
    Tag,
} from '@arco-design/web-react';
import {
    IconCheck,
    IconDelete,
    IconList,
    IconSearch,
    IconEmail,
} from '@arco-design/web-react/icon';
import './style/index.less';
import {
    getMessageList,
    getUnreadMessages,
    markAsRead,
    markAllAsRead,
    deleteMessage,
    deleteAllMessages,
} from './api';

const {Content} = Layout;
const {Row, Col} = Grid;

function SystemMessageManager() {
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
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);

    // 表单引用
    const filterFormRef = useRef<any>(null);

    // 消息类型选项
    const messageTypeOptions = [
        {label: '通知', value: 'NOTIFICATION'},
        {label: '警告', value: 'WARNING'},
        {label: '系统', value: 'SYSTEM'},
    ];

    // 已读状态选项
    const readStatusOptions = [
        {label: '未读', value: false},
        {label: '已读', value: true},
    ];

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

    // 获取表格数据
    const fetchTableData = async (params: any = {}, pageSize: number = pagination.pageSize, current: number = pagination.current) => {
        setTableLoading(true);
        try {
            const targetParams = {
                page: current - 1,
                size: pageSize,
            };

            let response;
            if (params.unread === true) {
                // 只查询未读消息
                response = await getUnreadMessages(targetParams);
            } else {
                // 查询所有消息
                response = await getMessageList(targetParams);
            }

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
            Message.error('获取消息列表失败');
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

    // 查看详情
    const handleViewDetail = (record: any) => {
        setCurrentRecord(record);
        setDetailModalVisible(true);

        // 如果消息未读，标记为已读
        if (!record.read) {
            markAsRead(record.id).then(() => {
                // 更新本地数据
                setTableData(prev => prev.map(item =>
                    item.id === record.id ? {...item, read: true} : item
                ));
                // 更新当前记录
                setCurrentRecord({...record, read: true});
            }).catch(() => {
                Message.error('标记已读失败');
            });
        }
    };

    // 标记为已读
    const handleMarkAsRead = async (record: any) => {
        try {
            await markAsRead(record.id);
            Message.success('已标记为已读');
            // 更新本地数据
            setTableData(prev => prev.map(item =>
                item.id === record.id ? {...item, read: true} : item
            ));
        } catch (error) {
            Message.error('标记失败');
        }
    };

    // 标记所有为已读
    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            Message.success('已标记所有消息为已读');
            fetchTableData();
        } catch (error) {
            Message.error('操作失败');
        }
    };

    // 删除消息
    const handleDelete = (record: any) => {
        setCurrentRecord(record);
        setDeleteModalVisible(true);
    };

    const handleDeleteConfirm = async () => {
        if (!currentRecord) return;
        try {
            await deleteMessage(currentRecord.id);
            Message.success('消息删除成功');
            setDeleteModalVisible(false);
            fetchTableData();
        } catch (error) {
            Message.error('删除失败');
        }
    };

    // 删除所有消息
    const handleDeleteAll = () => {
        Modal.confirm({
            title: '确认删除',
            content: '确定要删除所有消息吗？此操作不可恢复。',
            onOk: async () => {
                try {
                    await deleteAllMessages();
                    Message.success('已删除所有消息');
                    fetchTableData();
                } catch (error) {
                    Message.error('删除失败');
                }
            },
        });
    };

    // 菜单点击
    const handleMenuClick = (key: string, e: React.MouseEvent, record: any) => {
        e.stopPropagation();
        if (key === 'view') {
            handleViewDetail(record);
        } else if (key === 'markRead') {
            handleMarkAsRead(record);
        } else if (key === 'delete') {
            handleDelete(record);
        }
    };

    // 列配置
    const columns = [
        {
            title: '状态',
            dataIndex: 'read',
            width: 80,
            render: (read: boolean) => (
                <div style={{textAlign: 'center'}}>
                    {!read && <span className="unread-dot"></span>}
                </div>
            ),
        },
        {
            title: '标题',
            dataIndex: 'title',
            ellipsis: true,
            render: (title: string, record: any) => (
                <div style={{fontWeight: record.read ? 'normal' : 'bold'}}>
                    {title}
                </div>
            ),
        },
        {
            title: '内容',
            dataIndex: 'content',
            ellipsis: true,
            render: (content: string) => (
                <div className="message-content">{content}</div>
            ),
        },
        {
            title: '类型',
            dataIndex: 'type',
            width: 120,
            render: (type: string) => {
                const map: Record<string, any> = {
                    NOTIFICATION: {color: 'blue', text: '通知'},
                    WARNING: {color: 'orange', text: '警告'},
                    SYSTEM: {color: 'gray', text: '系统'},
                };
                const it = map[type] || {color: 'arcoblue', text: type};
                return <Tag color={it.color} bordered>{it.text}</Tag>;
            },
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
                                <Menu.Item key="view">
                                    <IconEmail style={{marginRight: 5}}/>
                                    查看
                                </Menu.Item>
                                {!record.read && (
                                    <Menu.Item key="markRead">
                                        <IconCheck style={{marginRight: 5}}/>
                                        标记已读
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
            const otherElementsHeight = 250;
            const newHeight = Math.max(200, windowHeight - otherElementsHeight);
            setTableScrollHeight(newHeight);
        };
        calculateTableHeight();
        fetchTableData();

        const handleResize = () => calculateTableHeight();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="system-message-manager">
            <Layout>
                <Content>
                    {/* 筛选表单 */}
                    <Form ref={filterFormRef} layout="horizontal" className="filter-form" style={{marginTop: '10px'}} onValuesChange={() => {
                        const values = filterFormRef.current?.getFieldsValue?.() || {};
                        searchTableData(values);
                    }}>
                        <Row gutter={16}>
                            <Col span={6}>
                                <Form.Item field="unread" label="状态">
                                    <Select placeholder="请选择状态" allowClear>
                                        {readStatusOptions.map(opt => (
                                            <Select.Option key={String(opt.value)} value={opt.value}>{opt.label}</Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12} style={{display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', paddingBottom: '16px'}}>
                                <Space>
                                    <Button type="primary" icon={<IconSearch/>} onClick={() => {
                                        const values = filterFormRef.current?.getFieldsValue?.() || {};
                                        searchTableData(values);
                                    }}>
                                        搜索
                                    </Button>
                                    <Button type="primary" status="success" icon={<IconCheck/>} onClick={handleMarkAllAsRead}>
                                        全部已读
                                    </Button>
                                    <Button type="primary" status="danger" icon={<IconDelete/>} onClick={handleDeleteAll}>
                                        清空消息
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

                    {/* 消息详情对话框 */}
                    <Modal
                        title="消息详情"
                        visible={detailModalVisible}
                        onCancel={() => setDetailModalVisible(false)}
                        footer={
                            <Button type="primary" onClick={() => setDetailModalVisible(false)}>
                                关闭
                            </Button>
                        }
                    >
                        {currentRecord && (
                            <div className="message-detail">
                                <div className="detail-item">
                                    <label>标题：</label>
                                    <span>{currentRecord.title}</span>
                                </div>
                                <div className="detail-item">
                                    <label>类型：</label>
                                    <span>
                                        {messageTypeOptions.find(opt => opt.value === currentRecord.type)?.label || currentRecord.type}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <label>状态：</label>
                                    <span>{currentRecord.read ? '已读' : '未读'}</span>
                                </div>
                                <div className="detail-item">
                                    <label>内容：</label>
                                    <div className="content-text">{currentRecord.content}</div>
                                </div>
                                <div className="detail-item">
                                    <label>创建时间：</label>
                                    <span>{formatDateTime(currentRecord.createDate)}</span>
                                </div>
                                {currentRecord.readDate && (
                                    <div className="detail-item">
                                        <label>已读时间：</label>
                                        <span>{formatDateTime(currentRecord.readDate)}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </Modal>

                    {/* 删除确认 */}
                    <Modal
                        title="确认删除"
                        visible={deleteModalVisible}
                        onOk={handleDeleteConfirm}
                        onCancel={() => setDeleteModalVisible(false)}
                    >
                        <div className="delete-modal">确定要删除该消息吗？此操作不可恢复。</div>
                    </Modal>

                </Content>
            </Layout>
        </div>
    );
}

export default SystemMessageManager;
