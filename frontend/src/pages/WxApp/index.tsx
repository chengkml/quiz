import React, {useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {
    Button,
    Form,
    Grid,
    Input,
    Layout,
    Message,
    Modal,
    Select,
    Space,
    Table,
    Tag,
    Dropdown,
    Menu
} from '@arco-design/web-react';
import {
    IconDelete,
    IconEdit,
    IconList,
    IconPlus,
    IconSearch,
    IconUser
} from '@arco-design/web-react/icon';
import { DataManager } from '@/components/DataManager';
import './style/index.less';
import {createWxApp, deleteWxApp, getWxAppList, updateWxApp, getWxAppUsers, WxAppResponse, WxAppQueryParams, WxAppUserResponse} from './api';

const {Content} = Layout;
const {TextArea} = Input;
const {Option} = Select;
const {Row, Col} = Grid;

function WxAppManager() {
    const navigate = useNavigate();

    // 表格数据与状态
    const [tableData, setTableData] = useState<WxAppResponse[]>([]);
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
    const [currentRecord, setCurrentRecord] = useState<WxAppResponse | null>(null);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    // 用户列表相关状态
    const [usersModalVisible, setUsersModalVisible] = useState(false);
    const [usersList, setUsersList] = useState<WxAppUserResponse[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);

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

    // 获取表格数据
    const fetchTableData = async (params: WxAppQueryParams = {}, pageSize: number = pagination.pageSize, current: number = pagination.current) => {
        setTableLoading(true);
        try {
            // 构建与后端接口匹配的参数
            const targetParams = {
                // 转换分页参数：offset = (current - 1) * pageSize
                offset: (current - 1) * pageSize,
                limit: pageSize,
                // 映射搜索字段
                name: params.appName,
            };
            const response = await getWxAppList(targetParams);
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
            Message.error('获取微信小程序数据失败');
        } finally {
            setTableLoading(false);
        }
    };

    // 搜索
    const searchTableData = (params: any) => {
        fetchTableData(params, pagination.pageSize, 1);
    };

    // 分页变化
    const handlePaginationChange = (nextPagination: any) => {
        setPagination(prev => ({
            ...prev,
            current: nextPagination.current,
            pageSize: nextPagination.pageSize,
        }));
        const filterParams = filterFormRef.current?.getFieldsValue?.() || {};
        fetchTableData(filterParams, nextPagination.pageSize, nextPagination.current);
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
                await createWxApp(values);
                Message.success('微信小程序创建成功');
                setAddModalVisible(false);
                addFormRef.current?.resetFields?.();
                fetchTableData();
            }
        } catch (error) {
            if (error?.fields) return; // 表单校验错误
            Message.error('微信小程序创建失败');
        }
    };

    // 编辑
    const handleEdit = (record: WxAppResponse) => {
        setCurrentRecord(record);
        setEditModalVisible(true);
        setTimeout(() => {
            editFormRef.current?.setFieldsValue?.({
                appId: record.appId,
                appName: record.appName,
                appSecret: record.appSecret,
                appDescr: record.appDescr,
                // 移除不再需要的字段，与后端WxAppDto保持一致
            });
        }, 50);
    };

    const handleEditConfirm = async () => {
        try {
            const values = await editFormRef.current?.validate?.();
            if (values && currentRecord) {
                // 确保id被保留作为更新的标识符，而不是appId
                // 仅包含必要的字段，与后端WxAppDto保持一致
                const payload: any = {
                    ...values,
                    id: currentRecord.id,
                };
                
                // 如果appSecret为空，则不包含在更新payload中（表示不修改）
                if (!payload.appSecret) {
                    delete payload.appSecret;
                }
                
                await updateWxApp(payload);
                Message.success('微信小程序更新成功');
                setEditModalVisible(false);
                editFormRef.current?.resetFields?.();
                fetchTableData();
            }
        } catch (error) {
            if (error?.fields) return;
            Message.error('微信小程序更新失败');
        }
    };

    // 清理用户列表状态
    const clearUsersState = () => {
        setUsersList([]);
        setUsersLoading(false);
    };

    // 查看用户列表
    const handleViewUsers = async (record: WxAppResponse) => {
        setCurrentRecord(record);
        clearUsersState();
        setUsersLoading(true);
        try {
            const response = await getWxAppUsers(record.appId);
            // 确保data是数组
            setUsersList(Array.isArray(response.data) ? response.data : []);
            setUsersModalVisible(true);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || '获取用户列表失败';
            Message.error(`获取用户列表失败: ${errorMessage}`);
        } finally {
            setUsersLoading(false);
        }
    };

    // 删除
    const handleDelete = (record: WxAppResponse) => {
        setCurrentRecord(record);
        setDeleteModalVisible(true);
    };

    const handleDeleteConfirm = async () => {
        if (!currentRecord) return;
        try {
            await deleteWxApp(currentRecord.id);
            Message.success('微信小程序删除成功');
            setDeleteModalVisible(false);
            fetchTableData();
        } catch (error) {
            Message.error('微信小程序删除失败');
        }
    };

    // 菜单点击
    const handleMenuClick = (key: string, e: React.MouseEvent, record: WxAppResponse) => {
        e.stopPropagation();
        if (key === 'edit') {
            handleEdit(record);
        } else if (key === 'delete') {
            handleDelete(record);
        } else if (key === 'users') {
            handleViewUsers(record);
        }
    };

    // 列配置 - 与后端WxAppDto保持一致
    const columns = [
        {
            title: 'ID',
            dataIndex: 'appId',
            ellipsis: true,
            width: 200,
        },
        {
            title: '名称',
            dataIndex: 'appName',
            ellipsis: true,
            width: 200,
        },
        {
            title: '描述',
            dataIndex: 'appDescr',
            ellipsis: true,
        },
        {
            title: '创建时间',
            dataIndex: 'createDate',
            width: 180,
            render: (value: string) => formatDateTime(value),
        },
        {
            title: '更新时间',
            dataIndex: 'updateDate',
            width: 180,
            render: (value: string) => formatDateTime(value),
        },
        {
            title: '操作',
            width: 100,
            align: 'center' as const,
            fixed: 'right' as const,
            render: (_: any, record: WxAppResponse) => (
                <Space size="large" className="table-btn-group">
                    <Dropdown
                        position="bl"
                        droplist={
                            <Menu onClickMenuItem={(key, e) => handleMenuClick(key, e, record)}
                                      className="handle-dropdown-menu">
                                <Menu.Item key="users">
                                    <IconUser style={{marginRight: 5}}/>
                                    查看用户
                                </Menu.Item>
                                <Menu.Item key="edit">
                                    <IconEdit style={{marginRight: 5}}/>
                                    编辑
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

    // 初始化与高度自适应
    useEffect(() => {
        const calculateTableHeight = () => {
            const windowHeight = window.innerHeight;
            const otherElementsHeight = 240;
            const newHeight = Math.max(200, windowHeight - otherElementsHeight);
            setTableScrollHeight(newHeight);
        };
        calculateTableHeight();
        fetchTableData();
        const handleResize = () => calculateTableHeight();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const filterContent = (
        <Form
            ref={filterFormRef}
            layout="horizontal"
            className="filter-form"
            onValuesChange={() => {
                const values = filterFormRef.current?.getFieldsValue?.() || {};
                searchTableData(values);
            }}
        >
            <Row gutter={16}>
                <Col span={6}>
                    <Form.Item field="appName" label="名称">
                        <Input placeholder="请输入小程序名称"/>
                    </Form.Item>
                </Col>
                <Col
                    span={6}
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        alignItems: 'flex-end',
                        paddingBottom: '16px',
                    }}
                >
                    <Space>
                        <Button
                            type="primary"
                            icon={<IconSearch/>}
                            onClick={() => {
                                const values = filterFormRef.current?.getFieldsValue?.() || {};
                                searchTableData(values);
                            }}
                        >
                            搜索
                        </Button>
                        <Button
                            type="primary"
                            status="success"
                            icon={<IconPlus/>}
                            onClick={handleAdd}
                        >
                            新增
                        </Button>
                    </Space>
                </Col>
            </Row>
        </Form>
    );

    return (
        <div className="wxapp-manager">
            <Layout>
                <Content>
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

                    {/* 新增对话框 */}
                    <Modal
                        title="新增微信小程序"
                        visible={addModalVisible}
                        onOk={handleAddConfirm}
                        onCancel={() => setAddModalVisible(false)}
                    >
                        <div style={{maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px'}}>
                            <Form ref={addFormRef} layout="vertical" className="modal-form">
                                <Form.Item label="小程序ID" field="appId" rules={[{required: true, message: '请输入小程序ID'}]}>
                                    <Input placeholder="请输入小程序ID"/>
                                </Form.Item>
                                <Form.Item label="小程序名称" field="appName" rules={[{required: true, message: '请输入小程序名称'}]}>
                                    <Input placeholder="请输入小程序名称"/>
                                </Form.Item>
                                <Form.Item label="小程序密钥" field="appSecret" rules={[{required: true, message: '请输入小程序密钥'}]}>
                                    <Input.Password placeholder="请输入小程序密钥"/>
                                </Form.Item>
                                <Form.Item label="描述" field="appDescr">
                                    <TextArea placeholder="请输入描述" autoSize={{minRows: 3, maxRows: 6}}/>
                                </Form.Item>
                            </Form>
                        </div>
                    </Modal>

                    {/* 编辑对话框 */}
                    <Modal
                        title="编辑微信小程序"
                        visible={editModalVisible}
                        onOk={handleEditConfirm}
                        onCancel={() => setEditModalVisible(false)}
                    >
                        <div style={{maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px'}}>
                            <Form ref={editFormRef} layout="vertical" className="modal-form">
                                <Form.Item label="小程序ID" field="appId" rules={[{required: true, message: '请输入小程序ID'}]}>
                                    <Input placeholder="请输入小程序ID" disabled/>
                                </Form.Item>
                                <Form.Item label="小程序名称" field="appName" rules={[{required: true, message: '请输入小程序名称'}]}>
                                    <Input placeholder="请输入小程序名称"/>
                                </Form.Item>
                                <Form.Item label="小程序密钥" field="appSecret">
                                    <Input.Password placeholder="请输入小程序密钥（留空则不修改）" allowClear/>
                                </Form.Item>
                                <Form.Item label="描述" field="appDescr">
                                    <TextArea placeholder="请输入描述" autoSize={{minRows: 3, maxRows: 6}}/>
                                </Form.Item>
                            </Form>
                        </div>
                    </Modal>

                    {/* 用户列表模态框 */}
                    <Modal
                        title="小程序用户列表"
                        visible={usersModalVisible}
                        onCancel={() => {
                            setUsersModalVisible(false);
                            // 延迟清理状态，避免动画过程中数据闪烁
                            setTimeout(() => clearUsersState(), 300);
                        }}
                        style={{width: '60%'}}
                        footer={null}
                    >
                        <div style={{maxHeight: '60vh', overflowY: 'auto'}}>
                            <Table
                                columns={[
                                    {
                                        title: '用户ID',
                                        dataIndex: 'userId',
                                        ellipsis: true,
                                        width: 150,
                                    },
                                    {
                                        title: '用户名称',
                                        dataIndex: 'userName',
                                        ellipsis: true,
                                        width: 150,
                                    },
                                    {
                                        title: 'OpenID',
                                        dataIndex: 'openId',
                                        ellipsis: true,
                                        width: 250,
                                    },
                                    {
                                        title: '绑定时间',
                                        dataIndex: 'createTime',
                                        width: 180,
                                        render: (value: string) => formatDateTime(value),
                                    },
                                ]}
                                data={usersList}
                                loading={usersLoading}
                                pagination={false}
                                rowKey="userId"
                            />
                            {!usersLoading && usersList.length === 0 && (
                                <div style={{textAlign: 'center', padding: '60px 0', color: 'var(--color-text-4)'}}>
                                    <IconUser style={{fontSize: 48, marginBottom: 16, opacity: 0.5}} />
                                    <p>暂无绑定用户</p>
                                </div>
                            )}
                        </div>
                    </Modal>

                    {/* 删除确认 */}
                    <Modal
                        title="确认删除"
                        visible={deleteModalVisible}
                        onOk={handleDeleteConfirm}
                        onCancel={() => setDeleteModalVisible(false)}
                    >
                        <div className="delete-modal">
                            <p>确定要删除微信小程序吗？此操作不可恢复。</p>
                            {currentRecord && (
                                <p style={{marginTop: 8}}>小程序ID：{currentRecord.appId}</p>
                            )}
                            {currentRecord && (
                                <p>小程序名称：{currentRecord.appName}</p>
                            )}
                        </div>
                    </Modal>

                </Content>
            </Layout>
        </div>
    );
}

export default WxAppManager;
