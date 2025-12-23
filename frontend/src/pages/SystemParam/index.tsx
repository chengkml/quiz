import React, { useEffect, useRef, useState } from 'react';
import {
    Button,
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
    Switch,
    Table,
    Tag,
} from '@arco-design/web-react';
import {
    IconDelete,
    IconEdit,
    IconPlus,
    IconRefresh,
    IconSearch,
    IconUndo,
} from '@arco-design/web-react/icon';
import './style/index.less';
import {
    createParam,
    updateParam,
    deleteParam,
    searchParams,
    resetParamToDefault,
} from './api';
import { SystemParamDto, ParamType, ParamStatus } from '@/types/systemParam';

const { Content } = Layout;
const { TextArea } = Input;
const { Option } = Select;
const { Row, Col } = Grid;

function SystemParamManager() {
    // 表格数据与状态
    const [tableData, setTableData] = useState<SystemParamDto[]>([]);
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
    const [currentRecord, setCurrentRecord] = useState<SystemParamDto | null>(null);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);

    // 表单引用
    const addFormRef = useRef<any>(null);
    const editFormRef = useRef<any>(null);
    const filterFormRef = useRef<any>(null);

    // 参数类型选项
    const paramTypeOptions = [
        { label: '字符串', value: ParamType.STRING },
        { label: '数字', value: ParamType.NUMBER },
        { label: '布尔值', value: ParamType.BOOLEAN },
        { label: 'JSON', value: ParamType.JSON },
        { label: '列表', value: ParamType.LIST },
    ];

    // 状态选项
    const statusOptions = [
        { label: '启用', value: ParamStatus.ACTIVE },
        { label: '禁用', value: ParamStatus.INACTIVE },
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
            return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        } else {
            return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
    };

    // 表格列定义
    const columns = [
        {
            title: '参数键',
            dataIndex: 'paramKey',
            width: 200,
            ellipsis: true,
        },
        {
            title: '参数名称',
            dataIndex: 'paramName',
            width: 200,
            ellipsis: true,
        },
        {
            title: '参数值',
            dataIndex: 'paramValue',
            width: 250,
            ellipsis: true,
            render: (value: string, record: SystemParamDto) => {
                if (record.isEncrypted) {
                    return '******';
                }
                return value || '-';
            },
        },
        {
            title: '类型',
            dataIndex: 'paramType',
            width: 100,
            align: 'center',
            render: (type: string) => {
                const map: Record<string, { label: string; color: string }> = {
                    STRING: { label: '字符串', color: 'blue' },
                    NUMBER: { label: '数字', color: 'green' },
                    BOOLEAN: { label: '布尔', color: 'purple' },
                    JSON: { label: 'JSON', color: 'orange' },
                    LIST: { label: '列表', color: 'cyan' },
                };
                const item = map[type] || { label: type, color: 'gray' };
                return <Tag color={item.color} bordered>{item.label}</Tag>;
            },
        },
        {
            title: '分类',
            dataIndex: 'category',
            width: 120,
            ellipsis: true,
        },
        {
            title: '状态',
            dataIndex: 'status',
            width: 100,
            align: 'center',
            render: (status: string) => {
                const map: Record<string, { label: string; color: string }> = {
                    ACTIVE: { label: '启用', color: 'green' },
                    INACTIVE: { label: '禁用', color: 'gray' },
                };
                const item = map[status] || { label: status, color: 'gray' };
                return <Tag color={item.color} bordered>{item.label}</Tag>;
            },
        },
        {
            title: '只读',
            dataIndex: 'isReadonly',
            width: 80,
            align: 'center',
            render: (readonly: boolean) => readonly ? <Tag color="red">是</Tag> : <Tag>否</Tag>,
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
            align: 'center',
            fixed: 'right' as any,
            render: (_: any, record: SystemParamDto) => (
                <Space size="large" className="table-btn-group">
                    <Dropdown
                        position="bl"
                        droplist={
                            <Menu onClickMenuItem={(key) => handleMenuClick(key, _, record)}>
                                {!record.isReadonly && (
                                    <Menu.Item key="edit">
                                        <IconEdit /> 编辑
                                    </Menu.Item>
                                )}
                                {!record.isReadonly && (
                                    <Menu.Item key="reset">
                                        <IconUndo /> 重置
                                    </Menu.Item>
                                )}
                                {!record.isReadonly && (
                                    <Menu.Item key="delete">
                                        <IconDelete /> 删除
                                    </Menu.Item>
                                )}
                            </Menu>
                        }
                    >
                        <Button type="text" size="small">
                            操作
                        </Button>
                    </Dropdown>
                </Space>
            ),
        },
    ];

    // 菜单点击处理
    const handleMenuClick = (key: string, _: any, record: SystemParamDto) => {
        setCurrentRecord(record);
        switch (key) {
            case 'edit':
                editFormRef.current?.setFieldsValue(record);
                setEditModalVisible(true);
                break;
            case 'reset':
                Modal.confirm({
                    title: '确认重置',
                    content: `确定要将参数"${record.paramName}"重置为默认值吗？`,
                    onOk: async () => {
                        try {
                            await resetParamToDefault(record.id);
                            Message.success('重置成功');
                            const filterValues = filterFormRef.current?.getFieldsValue?.() || {};
                            searchTableData(filterValues);
                        } catch (error) {
                            Message.error('重置失败');
                        }
                    },
                });
                break;
            case 'delete':
                setDeleteModalVisible(true);
                break;
            default:
                break;
        }
    };

    // 分页变化
    const handlePageChange = (page: number, pageSize: number) => {
        setPagination(prev => ({
            ...prev,
            current: page,
            pageSize: pageSize,
        }));
        const values = filterFormRef.current?.getFieldsValue?.() || {};
        fetchTableData({
            ...values,
            page: page - 1,
            size: pageSize,
        });
    };

    // 获取表格数据
    const fetchTableData = async (params: any) => {
        try {
            setTableLoading(true);
            const response = await searchParams(params);
            setTableData(response.content || []);
            setPagination(prev => ({
                ...prev,
                total: response.totalElements || 0,
            }));
        } catch (error) {
            Message.error('获取参数数据失败');
        } finally {
            setTableLoading(false);
        }
    };

    // 搜索表格数据
    const searchTableData = (params: any) => {
        setPagination(prev => ({
            ...prev,
            current: 1,
        }));
        fetchTableData({
            ...params,
            page: 0,
            size: pagination.pageSize,
        });
    };

    // 新增按钮点击
    const handleAdd = () => {
        setAddModalVisible(true);
    };

    // 新增确认
    const handleAddConfirm = async () => {
        try {
            const values = await addFormRef.current?.validate?.();
            await createParam(values);
            Message.success('新增参数成功');
            setAddModalVisible(false);
            addFormRef.current?.resetFields?.();
            const filterValues = filterFormRef.current?.getFieldsValue?.() || {};
            searchTableData(filterValues);
        } catch (error: any) {
            if (error?.fields) return; // 表单校验错误
            Message.error(error?.message || '新增参数失败');
        }
    };

    // 编辑确认
    const handleEditConfirm = async () => {
        try {
            const values = await editFormRef.current?.validate?.();
            await updateParam({ ...values, id: currentRecord?.id });
            Message.success('更新参数成功');
            setEditModalVisible(false);
            const filterValues = filterFormRef.current?.getFieldsValue?.() || {};
            searchTableData(filterValues);
        } catch (error: any) {
            if (error?.fields) return; // 表单校验错误
            Message.error(error?.message || '更新参数失败');
        }
    };

    // 删除确认
    const handleDeleteConfirm = async () => {
        try {
            if (currentRecord) {
                await deleteParam(currentRecord.id);
                Message.success('删除参数成功');
                setDeleteModalVisible(false);
                const filterValues = filterFormRef.current?.getFieldsValue?.() || {};
                searchTableData(filterValues);
            }
        } catch (error: any) {
            Message.error(error?.message || '删除参数失败');
        }
    };

    // 初始化与高度自适应
    useEffect(() => {
        const calculateTableHeight = () => {
            const windowHeight = window.innerHeight;
            const otherElementsHeight = 250;
            const newHeight = Math.max(100, windowHeight - otherElementsHeight);
            setTableScrollHeight(newHeight);
        };
        calculateTableHeight();

        // 默认查询所有参数
        const defaultParams = { page: 0, size: pagination.pageSize };
        fetchTableData(defaultParams);

        const handleResize = () => calculateTableHeight();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="system-param-manager">
            <Layout>
                <Content>
                    {/* 筛选表单 */}
                    <Form
                        ref={filterFormRef}
                        layout="horizontal"
                        className="filter-form"
                        style={{ marginTop: '10px' }}
                    >
                        <Row gutter={16}>
                            <Col span={6}>
                                <Form.Item field="paramKey" label="参数键">
                                    <Input placeholder="请输入参数键" allowClear />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item field="paramName" label="参数名称">
                                    <Input placeholder="请输入参数名称" allowClear />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item field="category" label="分类">
                                    <Input placeholder="请输入分类" allowClear />
                                </Form.Item>
                            </Col>
                            <Col span={6} style={{
                                display: 'flex',
                                justifyContent: 'flex-start',
                                alignItems: 'flex-end',
                                paddingBottom: '16px'
                            }}>
                                <Space>
                                    <Button type="primary" icon={<IconSearch />} onClick={() => {
                                        const values = filterFormRef.current?.getFieldsValue?.() || {};
                                        searchTableData(values);
                                    }}>
                                        搜索
                                    </Button>
                                    <Button type="primary" status="success" icon={<IconPlus />} onClick={handleAdd}>
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
                        scroll={{ y: tableScrollHeight }}
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
                        title="新增参数"
                        visible={addModalVisible}
                        onOk={handleAddConfirm}
                        onCancel={() => {
                            setAddModalVisible(false);
                            addFormRef.current?.resetFields?.();
                        }}
                        width={600}
                    >
                        <Form ref={addFormRef} layout="vertical" className="modal-form">
                            <Form.Item
                                label="参数键"
                                field="paramKey"
                                rules={[{ required: true, message: '请输入参数键' }]}
                            >
                                <Input placeholder="请输入参数键（唯一标识）" />
                            </Form.Item>
                            <Form.Item
                                label="参数名称"
                                field="paramName"
                                rules={[{ required: true, message: '请输入参数名称' }]}
                            >
                                <Input placeholder="请输入参数名称" />
                            </Form.Item>
                            <Form.Item
                                label="参数类型"
                                field="paramType"
                                rules={[{ required: true, message: '请选择参数类型' }]}
                                initialValue={ParamType.STRING}
                            >
                                <Select placeholder="请选择参数类型">
                                    {paramTypeOptions.map(opt => (
                                        <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            <Form.Item label="参数值" field="paramValue">
                                <TextArea placeholder="请输入参数值" autoSize={{ minRows: 2, maxRows: 4 }} />
                            </Form.Item>
                            <Form.Item label="默认值" field="defaultValue">
                                <TextArea placeholder="请输入默认值" autoSize={{ minRows: 2, maxRows: 4 }} />
                            </Form.Item>
                            <Form.Item label="分类" field="category">
                                <Input placeholder="请输入分类" />
                            </Form.Item>
                            <Form.Item label="描述" field="description">
                                <TextArea placeholder="请输入描述" autoSize={{ minRows: 2, maxRows: 4 }} />
                            </Form.Item>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label="是否加密" field="isEncrypted" initialValue={false}>
                                        <Switch />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="是否只读" field="isReadonly" initialValue={false}>
                                        <Switch />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Form.Item label="状态" field="status" initialValue={ParamStatus.ACTIVE}>
                                <Select placeholder="请选择状态">
                                    {statusOptions.map(opt => (
                                        <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            <Form.Item label="排序号" field="sortOrder" initialValue={0}>
                                <InputNumber style={{ width: '100%' }} min={0} />
                            </Form.Item>
                        </Form>
                    </Modal>

                    {/* 编辑对话框 */}
                    <Modal
                        title="编辑参数"
                        visible={editModalVisible}
                        onOk={handleEditConfirm}
                        onCancel={() => setEditModalVisible(false)}
                        width={600}
                    >
                        <Form ref={editFormRef} layout="vertical" className="modal-form">
                            <Form.Item
                                label="参数名称"
                                field="paramName"
                                rules={[{ required: true, message: '请输入参数名称' }]}
                            >
                                <Input placeholder="请输入参数名称" />
                            </Form.Item>
                            <Form.Item label="参数值" field="paramValue">
                                <TextArea placeholder="请输入参数值" autoSize={{ minRows: 2, maxRows: 4 }} />
                            </Form.Item>
                            <Form.Item label="默认值" field="defaultValue">
                                <TextArea placeholder="请输入默认值" autoSize={{ minRows: 2, maxRows: 4 }} />
                            </Form.Item>
                            <Form.Item label="分类" field="category">
                                <Input placeholder="请输入分类" />
                            </Form.Item>
                            <Form.Item label="描述" field="description">
                                <TextArea placeholder="请输入描述" autoSize={{ minRows: 2, maxRows: 4 }} />
                            </Form.Item>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label="是否加密" field="isEncrypted">
                                        <Switch />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="是否只读" field="isReadonly">
                                        <Switch />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Form.Item label="状态" field="status">
                                <Select placeholder="请选择状态">
                                    {statusOptions.map(opt => (
                                        <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            <Form.Item label="排序号" field="sortOrder">
                                <InputNumber style={{ width: '100%' }} min={0} />
                            </Form.Item>
                        </Form>
                    </Modal>

                    {/* 删除确认 */}
                    <Modal
                        title="确认删除"
                        visible={deleteModalVisible}
                        onOk={handleDeleteConfirm}
                        onCancel={() => setDeleteModalVisible(false)}
                    >
                        <div className="delete-modal">
                            确定要删除参数"{currentRecord?.paramName}"吗？此操作不可恢复。
                        </div>
                    </Modal>
                </Content>
            </Layout>
        </div>
    );
}

export default SystemParamManager;
