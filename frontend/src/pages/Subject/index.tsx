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
    Upload,
} from '@arco-design/web-react';
import './style/index.less';
import {
    createSubject,
    deleteSubject,
    downloadTemplate,
    exportSubjects,
    getSubjectList,
    importSubjects,
    updateSubject
} from './api';
import {IconDelete, IconDownload, IconEdit, IconEye, IconList, IconPlus, IconUpload} from '@arco-design/web-react/icon';
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
    const [importModalVisible, setImportModalVisible] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
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

    // 处理下拉菜单点击
    const handleMenuClick = (key, e, record) => {
        e.stopPropagation();
        switch (key) {
            case 'detail':
                handleDetail(record);
                break;
            case 'edit':
                handleEdit(record);
                break;
            case 'delete':
                handleDelete(record);
                break;
            default:
                break;
        }
    };

    // 处理新增
    const handleAdd = () => {
        setAddModalVisible(true);
        addFormRef.current?.resetFields();
    };

    // 处理新增确认
    const handleAddConfirm = async () => {
        try {
            const formData = addFormRef.current?.getFieldsValue();
            setLoading(true);
            const response = await createSubject(formData);
            if (response.data) {
                Message.success('新增学科成功');
                setAddModalVisible(false);
                fetchTableData();
            }
        } catch (error) {
            Message.error('新增学科失败');
        } finally {
            setLoading(false);
        }
    };

    // 处理编辑
    const handleEdit = (record) => {
        setCurrentRecord(record);
        setEditModalVisible(true);
    };

    // 处理编辑确认
    const handleEditConfirm = async () => {
        try {
            const formData = editFormRef.current?.getFieldsValue();
            setLoading(true);
            const response = await updateSubject({...formData, id: currentRecord.id});
            if (response.data) {
                Message.success('编辑学科成功');
                setEditModalVisible(false);
                fetchTableData();
            }
        } catch (error) {
            Message.error('编辑学科失败');
        } finally {
            setLoading(false);
        }
    };

    // 处理删除
    const handleDelete = (record) => {
        setCurrentRecord(record);
        setDeleteModalVisible(true);
    };

    // 处理删除确认
    const handleDeleteConfirm = async () => {
        try {
            setLoading(true);
            const response = await deleteSubject(currentRecord.id);
            if (response.data) {
                Message.success('删除学科成功');
                setDeleteModalVisible(false);
                fetchTableData();
            }
        } catch (error) {
            Message.error('删除学科失败');
        } finally {
            setLoading(false);
        }
    };

    // 处理详情
    const handleDetail = (record) => {
        setDetailRecord(record);
        setDetailModalVisible(true);
    };

    // 处理导出
    const handleExport = () => {
        try {
            exportSubjects();
            Message.success('导出成功');
        } catch (error) {
            Message.error('导出失败，请稍后重试');
        }
    };

    // 打开导入模态框
    const handleImportModal = () => {
        setImportModalVisible(true);
        setSelectedFile(null);
    };

    // 处理导入确认
    const handleImportConfirm = async () => {
        if (!selectedFile) {
            Message.warning('请先选择文件');
            return;
        }

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await importSubjects(formData);
            if (response.data) {
                const { successCount, errorCount, errorMessages, message } = response.data;
                
                if (errorCount > 0) {
                    // 显示导入结果详情
                    Modal.info({
                        title: '导入结果',
                        content: (
                            <div>
                                <p style={{ marginBottom: '12px' }}>{message}</p>
                                {errorMessages && errorMessages.length > 0 && (
                                    <div>
                                        <p style={{ color: '#ff4d4f', marginBottom: '8px' }}>失败详情：</p>
                                        <ul style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            {errorMessages.map((msg: string, index: number) => (
                                                <li key={index} style={{ color: '#ff4d4f', fontSize: '14px', marginBottom: '4px' }}>
                                                    {msg}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ),
                        onOk: () => {
                            fetchTableData();
                            setImportModalVisible(false);
                        }
                    });
                } else {
                    Message.success(message);
                    fetchTableData();
                    setImportModalVisible(false);
                }
            }
        } catch (error: any) {
            Message.error(error.message || '导入失败，请稍后重试');
        } finally {
            setUploading(false);
        }
    };

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

    useEffect(() => {
        const calculateTableHeight = () => {
            const windowHeight = window.innerHeight;
            const otherElementsHeight = 235;
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
                    <Button type="default" icon={<IconUpload/>} onClick={handleImportModal} style={{marginLeft: '12px'}}>
                        导入学科
                    </Button>
                    <Button type="default" icon={<IconDownload/>} onClick={handleExport} style={{marginLeft: '12px'}}>
                        导出学科
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

                {/* 导入模态框 */}
                <Modal
                    title="导入学科"
                    visible={importModalVisible}
                    onOk={handleImportConfirm}
                    onCancel={() => {
                        setImportModalVisible(false);
                        setSelectedFile(null);
                    }}
                    okText="确认导入"
                    cancelText="取消"
                    okLoading={uploading}
                >
                    <div style={{marginBottom: '20px'}}>
                        <Upload
                            accept=".xlsx"
                            multiple={false}
                            beforeUpload={(file) => {
                                setSelectedFile(file as File);
                                return false; // 阻止自动上传
                            }}
                            fileList={selectedFile ? [{ uid: '1', name: selectedFile.name, status: 'done' }] : []}
                        >
                            <Button type="default">选择文件</Button>
                        </Upload>
                    </div>
                    
                    <div style={{marginTop: '16px'}}>
                        <Button 
                            type="default" 
                            icon={<IconDownload />} 
                            onClick={downloadTemplate}
                        >
                            下载导入模板
                        </Button>
                    </div>
                </Modal>
            </Content>
        </Layout>
    );
}

export default SubjectManager;