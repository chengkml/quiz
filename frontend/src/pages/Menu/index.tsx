import React, {useEffect, useRef, useState} from 'react';
import {
    Button,
    Collapse,
    Dropdown,
    Form,
    Input,
    Layout,
    Menu,
    Message,
    Modal,
    Pagination,
    Select,
    Space,
    Spin,
    Table,
    Tag,
    Tooltip,
    Tree,
} from '@arco-design/web-react';
import './style/index.less';
import {
    createMenu,
    deleteMenu,
    getMenuList,
    updateMenu,
    enableMenu,
    disableMenu,
    getMenuTree,
} from './api';
import {IconDelete, IconEdit, IconEye, IconList, IconPlus, IconMenu} from '@arco-design/web-react/icon';
import FilterForm from '@/components/FilterForm';

const {TextArea} = Input;
const {Content} = Layout;

function MenuManager() {
    // 状态管理
    const [tableData, setTableData] = useState([]);
    const [tableLoading, setTableLoading] = useState(false);
    const [tableScrollHeight, setTableScrollHeight] = useState(200);

    // 对话框状态
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [currentMenu, setCurrentMenu] = useState(null);

    // 分页状态
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0,
        showTotal: true,
        showJumper: true,
        showPageSize: true,
        pageSizeOptions: ['10', '20', '50', '100'],
    });

    // 查询条件
    const [searchParams, setSearchParams] = useState({
        menuName: '',
        menuType: '',
        state: '',
        parentId: '',
    });

    // 表单引用
    const [addForm] = Form.useForm();
    const [editForm] = Form.useForm();
    const [searchForm] = Form.useForm();

    // 菜单类型选项
    const menuTypeOptions = [
        {label: '目录', value: 'DIRECTORY'},
        {label: '菜单', value: 'MENU'},
        {label: '按钮', value: 'BUTTON'},
    ];

    // 菜单状态选项
    const menuStateOptions = [
        {label: '启用', value: 'ENABLED'},
        {label: '禁用', value: 'DISABLED'},
    ];

    // 表格列定义
    const columns = [
        {
            title: '菜单名称',
            dataIndex: 'menuName',
            key: 'menuName',
            width: 150,
        },
        {
            title: '显示名称',
            dataIndex: 'menuLabel',
            key: 'menuLabel',
            width: 150,
        },
        {
            title: '菜单类型',
            dataIndex: 'menuType',
            key: 'menuType',
            width: 100,
            render: (type) => {
                const typeMap = {
                    'DIRECTORY': {color: 'blue', text: '目录'},
                    'MENU': {color: 'green', text: '菜单'},
                    'BUTTON': {color: 'orange', text: '按钮'},
                };
                const config = typeMap[type] || {color: 'gray', text: type};
                return <Tag color={config.color}>{config.text}</Tag>;
            },
        },
        {
            title: '路由地址',
            dataIndex: 'url',
            key: 'url',
            width: 200,
            ellipsis: true,
        },
        {
            title: '图标',
            dataIndex: 'menuIcon',
            key: 'menuIcon',
            width: 80,
        },
        {
            title: '排序',
            dataIndex: 'seq',
            key: 'seq',
            width: 80,
        },
        {
            title: '状态',
            dataIndex: 'state',
            key: 'state',
            width: 80,
            render: (state) => {
                const stateMap = {
                    'ENABLED': {color: 'green', text: '启用'},
                    'DISABLED': {color: 'red', text: '禁用'},
                };
                const config = stateMap[state] || {color: 'gray', text: state};
                return <Tag color={config.color}>{config.text}</Tag>;
            },
        },
        {
            title: '创建时间',
            dataIndex: 'createDate',
            key: 'createDate',
            width: 180,
            render: (date) => date ? new Date(date).toLocaleString() : '-',
        },
        {
            title: '操作',
            key: 'action',
            width: 200,
            fixed: 'right',
            render: (_, record) => (
                <Space>
                    <Tooltip content="查看详情">
                        <Button
                            type="text"
                            size="small"
                            icon={<IconEye />}
                            onClick={() => handleView(record)}
                        />
                    </Tooltip>
                    <Tooltip content="编辑">
                        <Button
                            type="text"
                            size="small"
                            icon={<IconEdit />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip content={record.state === 'ENABLED' ? '禁用' : '启用'}>
                        <Button
                            type="text"
                            size="small"
                            status={record.state === 'ENABLED' ? 'warning' : 'success'}
                            onClick={() => handleToggleState(record)}
                        >
                            {record.state === 'ENABLED' ? '禁用' : '启用'}
                        </Button>
                    </Tooltip>
                    <Tooltip content="删除">
                        <Button
                            type="text"
                            size="small"
                            status="danger"
                            icon={<IconDelete />}
                            onClick={() => handleDelete(record)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    // 获取菜单列表
    const fetchMenuList = async (params = {}) => {
        setTableLoading(true);
        try {
            const queryParams = {
                ...searchParams,
                ...params,
                pageNum: pagination.current - 1,
                pageSize: pagination.pageSize,
            };
            
            const response = await getMenuList(queryParams);
            if (response.data) {
                setTableData(response.data.content || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.totalElements || 0,
                }));
            }
        } catch (error) {
            Message.error('获取菜单列表失败');
            console.error('获取菜单列表失败:', error);
        } finally {
            setTableLoading(false);
        }
    };

    // 处理搜索
    const handleSearch = (values) => {
        setSearchParams(values);
        setPagination(prev => ({...prev, current: 1}));
        fetchMenuList(values);
    };

    // 处理重置
    const handleReset = () => {
        searchForm.resetFields();
        const resetParams = {
            menuName: '',
            menuType: '',
            state: '',
            parentId: '',
        };
        setSearchParams(resetParams);
        setPagination(prev => ({...prev, current: 1}));
        fetchMenuList(resetParams);
    };

    // 处理分页变化
    const handleTableChange = (pagination) => {
        setPagination(prev => ({...prev, ...pagination}));
        fetchMenuList();
    };

    // 处理新增
    const handleAdd = () => {
        setCurrentMenu(null);
        addForm.resetFields();
        setAddModalVisible(true);
    };

    // 处理编辑
    const handleEdit = (record) => {
        setCurrentMenu(record);
        editForm.setFieldsValue(record);
        setEditModalVisible(true);
    };

    // 处理查看
    const handleView = (record) => {
        setCurrentMenu(record);
        setViewModalVisible(true);
    };

    // 处理删除
    const handleDelete = (record) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除菜单"${record.menuLabel || record.menuName}"吗？`,
            onOk: async () => {
                try {
                    await deleteMenu(record.menuId);
                    Message.success('删除成功');
                    fetchMenuList();
                } catch (error) {
                    Message.error('删除失败');
                    console.error('删除菜单失败:', error);
                }
            },
        });
    };

    // 处理状态切换
    const handleToggleState = async (record) => {
        try {
            if (record.state === 'ENABLED') {
                await disableMenu(record.menuId);
                Message.success('禁用成功');
            } else {
                await enableMenu(record.menuId);
                Message.success('启用成功');
            }
            fetchMenuList();
        } catch (error) {
            Message.error('操作失败');
            console.error('切换菜单状态失败:', error);
        }
    };

    // 处理新增提交
    const handleAddSubmit = async (values) => {
        try {
            await createMenu(values);
            Message.success('创建成功');
            setAddModalVisible(false);
            fetchMenuList();
        } catch (error) {
            Message.error('创建失败');
            console.error('创建菜单失败:', error);
        }
    };

    // 处理编辑提交
    const handleEditSubmit = async (values) => {
        try {
            await updateMenu(currentMenu.menuId, values);
            Message.success('更新成功');
            setEditModalVisible(false);
            fetchMenuList();
        } catch (error) {
            Message.error('更新失败');
            console.error('更新菜单失败:', error);
        }
    };

    // 初始化
    useEffect(() => {
        fetchMenuList();
    }, []);

    // 搜索表单配置
    const searchFormItems = [
        {
            label: '菜单名称',
            field: 'menuName',
            component: <Input placeholder="请输入菜单名称" />,
        },
        {
            label: '菜单类型',
            field: 'menuType',
            component: (
                <Select placeholder="请选择菜单类型" allowClear>
                    {menuTypeOptions.map(option => (
                        <Select.Option key={option.value} value={option.value}>
                            {option.label}
                        </Select.Option>
                    ))}
                </Select>
            ),
        },
        {
            label: '状态',
            field: 'state',
            component: (
                <Select placeholder="请选择状态" allowClear>
                    {menuStateOptions.map(option => (
                        <Select.Option key={option.value} value={option.value}>
                            {option.label}
                        </Select.Option>
                    ))}
                </Select>
            ),
        },
    ];

    return (
        <div className="menu-manager">
            <Layout>
                <Content>
                    {/* 搜索区域 */}
                    <div className="search-section">
                        <FilterForm
                            form={searchForm}
                            items={searchFormItems}
                            onSearch={handleSearch}
                            onReset={handleReset}
                        />
                    </div>

                    {/* 操作按钮区域 */}
                    <div className="action-section">
                        <Space>
                            <Button
                                type="primary"
                                icon={<IconPlus />}
                                onClick={handleAdd}
                            >
                                新增菜单
                            </Button>
                        </Space>
                    </div>

                    {/* 表格区域 */}
                    <div className="table-section">
                        <Table
                            columns={columns}
                            data={tableData}
                            loading={tableLoading}
                            pagination={pagination}
                            onChange={handleTableChange}
                            scroll={{
                                x: 1200,
                                y: tableScrollHeight,
                            }}
                            rowKey="menuId"
                        />
                    </div>
                </Content>
            </Layout>

            {/* 新增菜单对话框 */}
            <Modal
                title="新增菜单"
                visible={addModalVisible}
                onCancel={() => setAddModalVisible(false)}
                onOk={() => addForm.submit()}
                width={600}
            >
                <Form
                    form={addForm}
                    layout="vertical"
                    onSubmit={handleAddSubmit}
                >
                    <Form.Item
                        label="菜单名称"
                        field="menuName"
                        rules={[{required: true, message: '请输入菜单名称'}]}
                    >
                        <Input placeholder="请输入菜单名称" />
                    </Form.Item>
                    <Form.Item
                        label="显示名称"
                        field="menuLabel"
                        rules={[{required: true, message: '请输入显示名称'}]}
                    >
                        <Input placeholder="请输入显示名称" />
                    </Form.Item>
                    <Form.Item
                        label="菜单类型"
                        field="menuType"
                        rules={[{required: true, message: '请选择菜单类型'}]}
                    >
                        <Select placeholder="请选择菜单类型">
                            {menuTypeOptions.map(option => (
                                <Select.Option key={option.value} value={option.value}>
                                    {option.label}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item label="父菜单ID" field="parentId">
                        <Input placeholder="请输入父菜单ID（可选）" />
                    </Form.Item>
                    <Form.Item label="路由地址" field="url">
                        <Input placeholder="请输入路由地址" />
                    </Form.Item>
                    <Form.Item label="菜单图标" field="menuIcon">
                        <Input placeholder="请输入菜单图标" />
                    </Form.Item>
                    <Form.Item label="排序号" field="seq">
                        <Input placeholder="请输入排序号" />
                    </Form.Item>
                    <Form.Item label="菜单描述" field="menuDescr">
                        <TextArea placeholder="请输入菜单描述" rows={3} />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 编辑菜单对话框 */}
            <Modal
                title="编辑菜单"
                visible={editModalVisible}
                onCancel={() => setEditModalVisible(false)}
                onOk={() => editForm.submit()}
                width={600}
            >
                <Form
                    form={editForm}
                    layout="vertical"
                    onSubmit={handleEditSubmit}
                >
                    <Form.Item
                        label="菜单名称"
                        field="menuName"
                        rules={[{required: true, message: '请输入菜单名称'}]}
                    >
                        <Input placeholder="请输入菜单名称" />
                    </Form.Item>
                    <Form.Item
                        label="显示名称"
                        field="menuLabel"
                        rules={[{required: true, message: '请输入显示名称'}]}
                    >
                        <Input placeholder="请输入显示名称" />
                    </Form.Item>
                    <Form.Item
                        label="菜单类型"
                        field="menuType"
                        rules={[{required: true, message: '请选择菜单类型'}]}
                    >
                        <Select placeholder="请选择菜单类型">
                            {menuTypeOptions.map(option => (
                                <Select.Option key={option.value} value={option.value}>
                                    {option.label}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item label="父菜单ID" field="parentId">
                        <Input placeholder="请输入父菜单ID（可选）" />
                    </Form.Item>
                    <Form.Item label="路由地址" field="url">
                        <Input placeholder="请输入路由地址" />
                    </Form.Item>
                    <Form.Item label="菜单图标" field="menuIcon">
                        <Input placeholder="请输入菜单图标" />
                    </Form.Item>
                    <Form.Item label="排序号" field="seq">
                        <Input placeholder="请输入排序号" />
                    </Form.Item>
                    <Form.Item label="菜单描述" field="menuDescr">
                        <TextArea placeholder="请输入菜单描述" rows={3} />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 查看菜单详情对话框 */}
            <Modal
                title="菜单详情"
                visible={viewModalVisible}
                onCancel={() => setViewModalVisible(false)}
                footer={null}
                width={600}
            >
                {currentMenu && (
                    <div className="menu-detail">
                        <div className="detail-item">
                            <span className="label">菜单ID：</span>
                            <span className="value">{currentMenu.menuId}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">菜单名称：</span>
                            <span className="value">{currentMenu.menuName}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">显示名称：</span>
                            <span className="value">{currentMenu.menuLabel}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">菜单类型：</span>
                            <span className="value">
                                <Tag color={
                                    currentMenu.menuType === 'DIRECTORY' ? 'blue' :
                                    currentMenu.menuType === 'MENU' ? 'green' : 'orange'
                                }>
                                    {currentMenu.menuType === 'DIRECTORY' ? '目录' :
                                     currentMenu.menuType === 'MENU' ? '菜单' : '按钮'}
                                </Tag>
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="label">父菜单ID：</span>
                            <span className="value">{currentMenu.parentId || '-'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">路由地址：</span>
                            <span className="value">{currentMenu.url || '-'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">菜单图标：</span>
                            <span className="value">{currentMenu.menuIcon || '-'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">排序号：</span>
                            <span className="value">{currentMenu.seq || '-'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">状态：</span>
                            <span className="value">
                                <Tag color={currentMenu.state === 'ENABLED' ? 'green' : 'red'}>
                                    {currentMenu.state === 'ENABLED' ? '启用' : '禁用'}
                                </Tag>
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="label">菜单描述：</span>
                            <span className="value">{currentMenu.menuDescr || '-'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">创建时间：</span>
                            <span className="value">
                                {currentMenu.createDate ? new Date(currentMenu.createDate).toLocaleString() : '-'}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="label">创建人：</span>
                            <span className="value">{currentMenu.createUser || '-'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">更新时间：</span>
                            <span className="value">
                                {currentMenu.updateDate ? new Date(currentMenu.updateDate).toLocaleString() : '-'}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="label">更新人：</span>
                            <span className="value">{currentMenu.updateUser || '-'}</span>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default MenuManager;