import React, {useEffect, useRef, useState} from 'react';
import { 
    Button, 
    Dropdown, 
    Form, 
    Grid, 
    Input, 
    InputNumber, 
    Checkbox, 
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
import {IconDelete, IconEdit, IconList, IconLock, IconPlus, IconSearch, IconUnlock} from '@arco-design/web-react/icon';
import './style/index.less';
import {
    createScriptInfo,
    deleteScriptInfo,
    disableScript,
    enableScript,
    getScriptInfoList,
    updateScriptInfo
} from './api';

const {Content} = Layout;
const {TextArea} = Input;
const {Option} = Select;
const {Row, Col} = Grid;

function ScriptManager() {
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
    const [isRemoteAdd, setIsRemoteAdd] = useState(true);
    const [isRemoteEdit, setIsRemoteEdit] = useState(true);

    // 当前记录与弹窗
    const [currentRecord, setCurrentRecord] = useState<any | null>(null);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);

    // 表单引用
    const addFormRef = useRef<any>(null);
    const editFormRef = useRef<any>(null);
    const filterFormRef = useRef<any>(null);

    // 脚本状态选项
    const stateOptions = [
        {label: '启用', value: 'ENABLED'},
        {label: '禁用', value: 'DISABLED'},
    ];
    // 脚本类型选项
    const scriptTypeOptions = [
        {label: 'Python', value: 'PYTHON'},
        {label: 'Python3', value: 'PYTHON3'},
        {label: 'Shell', value: 'SHELL'},
        {label: 'Node.js', value: 'NODE'},
        {label: 'Java Jar', value: 'JAVA_JAR'},
        {label: 'Java Class', value: 'JAVA_CLASS'},
        {label: 'HTTP', value: 'HTTP'},
        {label: 'Command', value: 'COMMAND'},
        {label: 'Remote SSH', value: 'REMOTE_SSH'},
        {label: 'Other', value: 'OTHER'},
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
            // 转换参数名称以匹配后端
            const paramMap: Record<string, string> = {
                code: 'scriptCode',
                name: 'scriptName',
                type: 'scriptType',
                status: 'state'
            };

            const convertedParams: any = {};
            for (const [key, value] of Object.entries(params)) {
                const mappedKey = paramMap[key] || key;
                convertedParams[mappedKey] = value;
            }

            const targetParams = {
                ...convertedParams,
                pageNum: current,
                pageSize: pageSize,
            };
            const response = await getScriptInfoList(targetParams);
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
            Message.error('获取脚本数据失败');
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
        setIsRemoteAdd(true);
        setTimeout(() => {
            addFormRef.current?.resetFields?.();
            addFormRef.current?.setFieldsValue?.({ remoteScript: true });
        }, 50);
    };

    const handleAddConfirm = async () => {
        try {
            const values = await addFormRef.current?.validate?.();
            if (values) {
                // 将remoteScript转换为字符串格式
                const formData = {
                    ...values,
                    remoteScript: values.remoteScript ? 'true' : 'false'
                };
                const response = await createScriptInfo(formData);
                if (response.data) {
                    Message.success('添加成功');
                    setAddModalVisible(false);
                    setIsRemoteAdd(true);
                    addFormRef.current?.resetFields?.();
                    // 重新加载数据
                    const filterParams = filterFormRef.current?.getFieldsValue?.() || {};
                    fetchTableData(filterParams);
                }
            }
        } catch (error) {
            if (error?.fields) return; // 表单校验错误
            Message.error('添加失败');
        }
    };

    // 编辑
    const handleEdit = (record: any) => {
        setCurrentRecord(record);
        setEditModalVisible(true);
        setTimeout(() => {
            const formValues: any = {
                id: record.id,
                code: record.scriptCode || record.code || '',
                name: record.scriptName || record.name || '',
                type: record.scriptType || record.type || '',
                content: record.content || '',
                execEntry: record.execEntry || '',
                filePath: record.filePath || '',
                execCmd: record.execCmd || '',
                remoteScript: !!record.remoteScript && record.remoteScript !== 'false' && record.remoteScript !== '0',
                host: record.host || '',
                port: record.port || 22,
                username: record.username || '',
                password: record.password || ''
            };

            const {content, ...otherValues} = formValues;
            editFormRef.current?.setFieldsValue?.(otherValues);
            setIsRemoteEdit(otherValues.remoteScript);
        }, 50);
    };

    const handleEditConfirm = async () => {
        try {
            const values = await editFormRef.current?.validate?.();
            if (values && currentRecord) {
                // 将表单字段名转换为后端需要的格式
                const payload = {
                id: currentRecord.id,
                scriptCode: values.code || '',
                scriptName: values.name || '',
                scriptType: values.type || '',
                execEntry: values.execEntry || '',
                filePath: values.filePath || '',
                execCmd: values.execCmd || '',
                remoteScript: values.remoteScript ? 'true' : 'false',
                host: values.host,
                port: values.port,
                username: values.username,
                    password: values.password
                };
                await updateScriptInfo(payload);
                Message.success('更新成功');
                setEditModalVisible(false);
                editFormRef.current?.resetFields?.();
                // 重新加载数据，保持筛选条件
                const filterParams = filterFormRef.current?.getFieldsValue?.() || {};
                fetchTableData(filterParams);
            }
        } catch (error) {
            if (error?.fields) return;
            Message.error('更新失败');
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
            await deleteScriptInfo(currentRecord.id);
            Message.success('脚本删除成功');
            setDeleteModalVisible(false);
            // 重新加载数据，保持筛选条件
            const filterParams = filterFormRef.current?.getFieldsValue?.() || {};
            fetchTableData(filterParams);
        } catch (error) {
            Message.error('脚本删除失败');
        }
    };

    // 启用脚本
    const handleEnable = async (record: any) => {
        try {
            await enableScript(record.id);
            Message.success('脚本启用成功');
            const filterParams = filterFormRef.current?.getFieldsValue?.() || {};
            fetchTableData(filterParams);
        } catch (error) {
            Message.error('脚本启用失败');
        }
    };

    // 禁用脚本
    const handleDisable = async (record: any) => {
        try {
            await disableScript(record.id);
            Message.success('脚本禁用成功');
            const filterParams = filterFormRef.current?.getFieldsValue?.() || {};
            fetchTableData(filterParams);
        } catch (error) {
            Message.error('脚本禁用失败');
        }
    };

    // 菜单点击
    const handleMenuClick = (key: string, e: React.MouseEvent, record: any) => {
        e.stopPropagation();
        switch (key) {
            case 'edit':
                handleEdit(record);
                break;
            case 'delete':
                handleDelete(record);
                break;
            case 'enable':
                handleEnable(record);
                break;
            case 'disable':
                handleDisable(record);
                break;
            default:
                break;
        }
    };

    // 列配置
    const columns = [
        {
            title: '脚本编码',
            dataIndex: 'scriptCode',
            ellipsis: true,
            render: (text: string, record: any) => record.scriptCode || record.code || '-',
        },
        {
            title: '脚本名称',
            dataIndex: 'scriptName',
            ellipsis: true,
            render: (text: string, record: any) => record.scriptName || record.name || '-',
        },
        {
            title: '状态',
            dataIndex: 'state',
            width: 120,
            render: (state: string) => {
                const map: Record<string, any> = {
                    ENABLED: {color: 'green', text: '启用'},
                    DISABLED: {color: 'gray', text: '禁用'},
                };
                const it = map[state] || {color: 'arcoblue', text: state};
                return <Tag color={it.color} bordered>{it.text}</Tag>;
            },
        },
        {
            title: '是否远程',
            dataIndex: 'remoteScript',
            width: 100,
            render: (remoteScript: any) => {
                const isRemote = remoteScript === true || remoteScript === 'true';
                return isRemote ? <Tag color="blue">是</Tag> : <Tag color="gray">否</Tag>;
            },
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
            width: 120,
            align: 'center',
            fixed: 'right' as any,
            render: (_: any, record: any) => (
                <Space size="large" className="table-btn-group">
                    <Dropdown
                        position="bl"
                        droplist={
                            <Menu onClickMenuItem={(key, e) => handleMenuClick(key, e, record)}
                                  className="handle-dropdown-menu">
                                {/* 编辑按钮 */}
                                <Menu.Item key="edit">
                                    <IconEdit style={{marginRight: 5}}/>
                                    编辑
                                </Menu.Item>
                                {/* 根据状态显示启用/禁用按钮 */}
                                {record.state === 'DISABLED' && (
                                    <Menu.Item key="enable">
                                        <IconUnlock style={{marginRight: 5}}/>
                                        启用
                                    </Menu.Item>
                                )}
                                {record.state === 'ENABLED' && (
                                    <Menu.Item key="disable">
                                        <IconLock style={{marginRight: 5}}/>
                                        禁用
                                    </Menu.Item>
                                )}
                                {/* 删除按钮 */}
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
        // 默认查询所有脚本
        fetchTableData({});
        const handleResize = () => calculateTableHeight();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="script-manager">
            <Layout>
                <Content>
                    {/* 筛选表单 */}
                    <Form ref={filterFormRef} layout="horizontal" className="filter-form" style={{marginTop: '10px'}}
                          onValuesChange={() => {
                              const values = filterFormRef.current?.getFieldsValue?.() || {};
                              searchTableData(values);
                          }}>
                        <Row gutter={16}>

                            <Col span={6}>
                                <Form.Item field="scriptName" label="名称">
                                    <Input placeholder="请输入脚本名称关键字"/>
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item field="state" label="状态">
                                    <Select placeholder="请选择状态" allowClear>
                                        {stateOptions.map(opt => (
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
                        title="新增脚本"
                        visible={addModalVisible}
                        onOk={handleAddConfirm}
                        onCancel={() => setAddModalVisible(false)}
                        okButtonProps={{loading: tableLoading}}
                        footer={(
                            <>
                                <Button onClick={() => setAddModalVisible(false)}>取消</Button>
                                <Button type="primary" onClick={handleAddConfirm} loading={tableLoading}>确定</Button>
                            </>
                        )}
                    >
                        <div style={{maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px'}}>
                            <Form ref={addFormRef} layout="vertical" className="modal-form" initialValues={{ remoteScript: true }}>
                                <Form.Item label="脚本编码" field="scriptCode"
                                           rules={[{required: true, message: '请输入脚本编码'}]}>
                                    <Input placeholder="请输入脚本编码"/>
                                </Form.Item>
                                <Form.Item label="脚本名称" field="scriptName"
                                           rules={[{required: true, message: '请输入脚本名称'}]}>
                                    <Input placeholder="请输入脚本名称"/>
                                </Form.Item>

                                <Form.Item label="是否远程脚本" field="remoteScript" valuePropName="checked" rules={[{required: true, message: '请选择是否为远程脚本'}]}>
                                    <Switch checked={isRemoteAdd} onChange={(checked) => {
                                        setIsRemoteAdd(checked);
                                        addFormRef.current?.setFieldsValue?.({ remoteScript: checked });
                                    }} />
                                </Form.Item>
                                {isRemoteAdd && (
                                    <>
                                        <Form.Item label="远程主机" field="host" rules={[{required: true, message: '请输入远程主机地址'}]}>
                                            <Input placeholder="请输入远程主机地址" />
                                        </Form.Item>
                                        <Form.Item label="端口" field="port" initialValue={22} rules={[{required: true, message: '请输入端口'}]}>
                                            <InputNumber min={1} max={65535} />
                                        </Form.Item>
                                        <Form.Item label="用户名" field="username" rules={[{required: true, message: '请输入远程用户名'}]}>
                                            <Input placeholder="请输入远程用户名" />
                                        </Form.Item>
                                        <Form.Item label="密码" field="password" rules={[{required: true, message: '请输入远程密码'}]}>
                                            <Input.Password placeholder="请输入远程密码" />
                                        </Form.Item>
                                    </>
                                )}

                                <Form.Item label="执行命令" field="execCmd"
                                           rules={[{required: true, message: '请输入执行命令'}]}>
                                    <Input
                                        placeholder="示例：python {entry} --config={file_path}/config.yaml"
                                    />
                                </Form.Item>
                            </Form>
                        </div>
                    </Modal>

                    {/* 编辑对话框 */}
                    <Modal
                        title="编辑脚本"
                        visible={editModalVisible}
                        onOk={handleEditConfirm}
                        onCancel={() => setEditModalVisible(false)}
                        okButtonProps={{loading: tableLoading}}
                        footer={(
                            <>
                                <Button onClick={() => setEditModalVisible(false)}>取消</Button>
                                <Button type="primary" onClick={handleEditConfirm} loading={tableLoading}>确定</Button>
                            </>
                        )}
                    >
                        <div style={{maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px'}}>
                            <Form ref={editFormRef} layout="vertical" className="modal-form">
                                <Form.Item label="脚本编码" field="code"
                                           rules={[{required: true, message: '请输入脚本编码'}]}>
                                    <Input placeholder="请输入脚本编码"/>
                                </Form.Item>
                                <Form.Item label="脚本名称" field="name"
                                           rules={[{required: true, message: '请输入脚本名称'}]}>
                                    <Input placeholder="请输入脚本名称"/>
                                </Form.Item>
                                <Form.Item label="是否远程脚本" field="remoteScript" valuePropName="checked" rules={[{required: true, message: '请选择是否为远程脚本'}]}>
                                    <Switch checked={isRemoteEdit} onChange={(checked) => {
                                        setIsRemoteEdit(checked);
                                        editFormRef.current?.setFieldsValue?.({ remoteScript: checked });
                                    }} />
                                </Form.Item>
                                {isRemoteEdit && (
                                    <>
                                        <Form.Item label="远程主机" field="host" rules={[{required: true, message: '请输入远程主机地址'}]}>
                                            <Input placeholder="请输入远程主机地址" />
                                        </Form.Item>
                                        <Form.Item label="端口" field="port" initialValue={22} rules={[{required: true, message: '请输入端口'}]}>
                                            <InputNumber min={1} max={65535} />
                                        </Form.Item>
                                        <Form.Item label="用户名" field="username" rules={[{required: true, message: '请输入远程用户名'}]}>
                                            <Input placeholder="请输入远程用户名" />
                                        </Form.Item>
                                        <Form.Item label="密码" field="password" rules={[{required: true, message: '请输入远程密码'}]}>
                                            <Input.Password placeholder="请输入远程密码" />
                                        </Form.Item>
                                    </>
                                )}

                                <Form.Item label="执行命令" field="execCmd"
                                           rules={[{required: true, message: '请输入执行命令'}]}>
                                    <Input
                                        placeholder="示例：python {entry} --config={file_path}/config.yaml"
                                    />
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
                        okButtonProps={{loading: tableLoading}}
                    >
                        <div className="delete-modal">确定要删除该脚本吗？此操作不可恢复。</div>
                    </Modal>
                </Content>
            </Layout>
        </div>
    );
}

// 导出组件作为默认导出
export default ScriptManager;