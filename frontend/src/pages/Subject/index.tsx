import React, {useEffect, useRef, useState} from 'react';
import {
    Button,
    Dropdown,
    Form,
    Input,
    Layout,
    Menu,
    Message,
    Modal,
    Pagination,
    Table,
    Tag,
} from '@arco-design/web-react';
import './style/index.less';
import {checkSubjectName, createSubject, deleteSubject, getSubjectList, updateSubject,} from './api';
import {IconDelete, IconEdit, IconEye, IconList, IconPlus} from '@arco-design/web-react/icon';
import FilterForm from '@/components/FilterForm';

const {TextArea} = Input;
const {Content} = Layout;

function SubjectManager() {
    // 状态管理
    const [tableData, setTableData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);
    const [tableScrollHeight, setTableScrollHeight] = useState(200);

    // 对话框状态
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);

    // 查看详情相关状态
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [detailRecord, setDetailRecord] = useState(null);

    // 表单引用
    const filterFormRef = useRef();
    const addFormRef = useRef();
    const editFormRef = useRef();

    // 分页配置
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0,
        showTotal: true,
        showJumper: true,
        showPageSize: true,
    });

    // 表格列配置
    const columns = [
        {
            title: '学科名称',
            dataIndex: 'name',
            width: 200,
            ellipsis: true,
            render: (value) => (
                <div style={{overflow: 'hidden', textOverflow: 'ellipsis'}}>
                    <Tag color="blue" bordered>{value}</Tag>
                </div>
            ),
        },
        {
            title: '学科描述',
            dataIndex: 'description',
            minWidth: 300,
            ellipsis: true,
            render: (value) => (
                <div style={{overflow: 'hidden', textOverflow: 'ellipsis'}}>
                    {value || '--'}
                </div>
            ),
        },
        {
            title: '创建人',
            dataIndex: 'createUserName',
            width: 120,
            ellipsis: true,
        },
        {
            title: '创建时间',
            dataIndex: 'createDate',
            width: 170,
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
            width: 100,
            align: 'center',
            fixed: 'right',
            render: (_, record) => (
                <Dropdown
                    position="bl"
                    droplist={
                        <Menu
                            onClickMenuItem={(key, e) => {
                                handleMenuClick(key, e, record);
                            }}
                            className="handle-dropdown-menu"
                        >
                            <Menu.Item key="detail">
                                <IconEye style={{marginRight: '5px'}}/>
                                查看详情
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
                        onClick={e => {
                            e.stopPropagation();
                        }}
                    >
                        <IconList/>
                    </Button>
                </Dropdown>
            ),
        },
    ];

    // 获取表格数据
    const fetchTableData = async (params = {}, pageSize = pagination.pageSize, current = pagination.current) => {
        setTableLoading(true);
        try {
            const targetParams = {
                ...params,
                page: current - 1,
                size: pageSize,
            };
            const response = await getSubjectList(targetParams);
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
            Message.error('获取学科数据失败');
        } finally {
            setTableLoading(false);
        }
    };

    // 搜索表格数据
    const searchTableData = (params) => {
        fetchTableData(params, pagination.pageSize, 1);
    };

    // 处理新增
    const handleAdd = () => {
        setCurrentRecord(null);
        setAddModalVisible(true);
    };

    // 处理编辑
    const handleEdit = (record) => {
        setCurrentRecord(record);
        setEditModalVisible(true);
    };

    // 处理删除
    const handleDelete = (record) => {
        setCurrentRecord(record);
        setDeleteModalVisible(true);
    };

    // 处理查看详情
    const handleDetail = (record) => {
        setDetailRecord(record);
        setDetailModalVisible(true);
    };

    // 处理菜单点击
    const handleMenuClick = (key, event, record) => {
        event.stopPropagation();
        if (key === 'edit') {
            handleEdit(record);
        } else if (key === 'delete') {
            handleDelete(record);
        } else if (key === 'detail') {
            handleDetail(record);
        }
    };

    // 确认新增
    const handleAddConfirm = async () => {
        try {
            const values = await addFormRef.current.validate();
            setLoading(true);

            // 检查学科名称是否已存在
            const checkResponse = await checkSubjectName({subjectName: values.name});
            if (checkResponse.data === true) {
                Message.error('学科名称已存在，请使用其他名称');
                return;
            }

            await createSubject(values);
            Message.success('学科创建成功');
            setAddModalVisible(false);
            addFormRef.current.resetFields();
            fetchTableData();
        } catch (error) {
            if (error.fields) {
                // 表单验证错误
                return;
            }
            Message.error('学科创建失败');
        } finally {
            setLoading(false);
        }
    };

    // 确认编辑
    const handleEditConfirm = async () => {
        try {
            const values = await editFormRef.current.validate();
            setLoading(true);

            // 检查学科名称是否已存在（排除当前记录）
            if (values.name !== currentRecord.name) {
                const checkResponse = await checkSubjectName({
                    subjectName: values.name,
                    excludeSubjectId: currentRecord.id
                });
                if (checkResponse.data === true) {
                    Message.error('学科名称已存在，请使用其他名称');
                    return;
                }
            }

            await updateSubject({...values, id: currentRecord.id});
            Message.success('学科更新成功');
            setEditModalVisible(false);
            editFormRef.current.resetFields();
            fetchTableData();
        } catch (error) {
            if (error.fields) {
                // 表单验证错误
                return;
            }
            Message.error('学科更新失败');
        } finally {
            setLoading(false);
        }
    };

    // 确认删除
    const handleDeleteConfirm = async () => {
        try {
            setLoading(true);
            await deleteSubject(currentRecord.id);
            Message.success('学科删除成功');
            setDeleteModalVisible(false);
            fetchTableData();
        } catch (error) {
            Message.error('学科删除失败');
        } finally {
            setLoading(false);
        }
    };

    // 监听窗口大小变化，动态调整表格高度
    useEffect(() => {
        const calculateTableHeight = () => {
            const windowHeight = window.innerHeight;
            // 减去页面其他元素的高度，如头部、筛选区域、分页等
            // 这里可以根据实际页面布局调整计算逻辑
            const otherElementsHeight = 235; // 预估其他元素占用的高度
            const newHeight = Math.max(200, windowHeight - otherElementsHeight);
            setTableScrollHeight(newHeight);
        };

        // 初始计算
        calculateTableHeight();

        // 监听窗口大小变化
        const handleResize = () => {
            calculateTableHeight();
        };

        window.addEventListener('resize', handleResize);

        // 清理事件监听器
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // 初始化数据
    useEffect(() => {
        fetchTableData();
    }, []);

    // 筛选表单配置
    const filterFormConfig = [
        {
            type: 'input',
            field: 'subjectName',
            label: '学科名称',
            placeholder: '请输入学科名称',
            span: 6,
        },
    ];

    return (
        <Layout className="subject-manager">
            <Content>
                {/* 筛选表单 */}
                <FilterForm
                    ref={filterFormRef}
                    config={filterFormConfig}
                    onSearch={searchTableData}
                    onReset={() => fetchTableData()}
                >
                    <Form.Item field='subjectName' label='关键字'>
                        <Input
                            placeholder='请输入关键字'
                        />
                    </Form.Item>
                </FilterForm>

                <div className="action-buttons">
                    <Button type="primary" icon={<IconPlus/>} onClick={handleAdd}>
                        新增学科
                    </Button>
                </div>
                <Table
                    columns={columns}
                    data={tableData}
                    loading={tableLoading}
                    pagination={false}
                    scroll={{
                        y: tableScrollHeight,
                    }}
                    rowKey="id"
                />

                {/* 分页 */}
                <div className="pagination-wrapper">
                    <Pagination
                        {...pagination}
                        onChange={(current, pageSize) => {
                            fetchTableData({}, pageSize, current);
                        }}
                    />
                </div>

                {/* 新增对话框 */}
                <Modal
                    title="新增学科"
                    visible={addModalVisible}
                    onOk={handleAddConfirm}
                    onCancel={() => {
                        setAddModalVisible(false);
                        addFormRef.current?.resetFields();
                    }}
                    confirmLoading={loading}
                    width={600}
                >
                    <Form ref={addFormRef} layout="vertical">
                        <Form.Item
                            label="学科名称"
                            field="name"
                            rules={[
                                {required: true, message: '请输入学科名称'},
                                {maxLength: 64, message: '学科名称长度不能超过64个字符'}
                            ]}
                        >
                            <Input placeholder="请输入学科名称"/>
                        </Form.Item>
                        <Form.Item
                            label="学科描述"
                            field="description"
                            rules={[
                                {maxLength: 255, message: '学科描述长度不能超过255个字符'}
                            ]}
                        >
                            <TextArea
                                placeholder="请输入学科描述"
                                autoSize={{minRows: 3, maxRows: 6}}
                            />
                        </Form.Item>
                    </Form>
                </Modal>

                {/* 编辑对话框 */}
                <Modal
                    title="编辑学科"
                    visible={editModalVisible}
                    onOk={handleEditConfirm}
                    onCancel={() => {
                        setEditModalVisible(false);
                        editFormRef.current?.resetFields();
                    }}
                    confirmLoading={loading}
                    width={600}
                >
                    <Form
                        ref={editFormRef}
                        layout="vertical"
                        initialValues={currentRecord}
                    >
                        <Form.Item
                            label="学科名称"
                            field="name"
                            rules={[
                                {required: true, message: '请输入学科名称'},
                                {maxLength: 64, message: '学科名称长度不能超过64个字符'}
                            ]}
                        >
                            <Input placeholder="请输入学科名称"/>
                        </Form.Item>
                        <Form.Item
                            label="学科描述"
                            field="description"
                            rules={[
                                {maxLength: 255, message: '学科描述长度不能超过255个字符'}
                            ]}
                        >
                            <TextArea
                                placeholder="请输入学科描述"
                                autoSize={{minRows: 3, maxRows: 6}}
                            />
                        </Form.Item>
                    </Form>
                </Modal>

                {/* 删除确认对话框 */}
                <Modal
                    title="删除学科"
                    visible={deleteModalVisible}
                    onOk={handleDeleteConfirm}
                    onCancel={() => setDeleteModalVisible(false)}
                    confirmLoading={loading}
                >
                    <p>确定要删除学科 <strong>{currentRecord?.name}</strong> 吗？</p>
                    <p style={{color: '#f53f3f'}}>删除后不可恢复，请谨慎操作！</p>
                </Modal>

                {/* 详情对话框 */}
                <Modal
                    title="学科详情"
                    visible={detailModalVisible}
                    onCancel={() => setDetailModalVisible(false)}
                    footer={null}
                    width={600}
                >
                    {detailRecord && (
                        <div className="subject-detail">
                            <div className="detail-item">
                                <label>学科名称：</label>
                                <span>{detailRecord.name}</span>
                            </div>
                            <div className="detail-item">
                                <label>学科描述：</label>
                                <span>{detailRecord.description || '--'}</span>
                            </div>
                            <div className="detail-item">
                                <label>创建人：</label>
                                <span>{detailRecord.createUserName || '--'}</span>
                            </div>
                            <div className="detail-item">
                                <label>创建时间：</label>
                                <span>{detailRecord.createDate || '--'}</span>
                            </div>
                            <div className="detail-item">
                                <label>更新人：</label>
                                <span>{detailRecord.updateUser || '--'}</span>
                            </div>
                            <div className="detail-item">
                                <label>更新时间：</label>
                                <span>{detailRecord.updateDate || '--'}</span>
                            </div>
                        </div>
                    )}
                </Modal>
            </Content>
        </Layout>
    );
}

export default SubjectManager;