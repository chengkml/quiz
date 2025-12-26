import React, {useEffect, useRef, useState} from 'react';
import UserAvatar from '@/components/UserAvatar';
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
    Card,
    Tag,
    Upload,
    Spin,
    Empty,
    Typography
} from '@arco-design/web-react';
import './style/index.less';
import {
    createSubject,
    deleteSubject,
    getSubjectList,
    updateSubject
} from './api';
import {
    IconDelete,
    IconEdit,
    IconList,
    IconPlus,
    IconSearch
} from '@arco-design/web-react/icon';

const {TextArea} = Input;
const {Content} = Layout;
const {Row, Col} = Grid;

function SubjectManager() {
    // 状态管理 (保持不变)
    const [tableData, setTableData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);
    const [tableScrollHeight, setTableScrollHeight] = useState(200);

    // 对话框状态 (保持不变)
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    // const [importModalVisible, setImportModalVisible] = useState(false);
    // const [uploading, setUploading] = useState(false);
    // const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [currentRecord, setCurrentRecord] = useState(null);

    // 表单引用 (保持不变)
    const filterFormRef = useRef<any>();
    const addFormRef = useRef<any>();
    const editFormRef = useRef<any>();

    // 分页配置 (保持不变)
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0,
        showTotal: true,
        showJumper: true,
        showPageSize: true,
    });

    // 提取原有的时间格式化逻辑
    const renderTimeText = (value) => {
        if (!value) return '--';
        const now = new Date();
        const date = new Date(value);
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
            return `昨天 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        } else {
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }
    };

    // 获取数据逻辑 (保持不变)
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

    const searchTableData = (params) => {
        fetchTableData(params, pagination.pageSize, 1);
    };

    const handleMenuClick = (key, e, record) => {
        e.stopPropagation();
        switch (key) {
            case 'edit': handleEdit(record); break;
            case 'delete': handleDelete(record); break;
        }
    };

    const handleAdd = () => { setAddModalVisible(true); addFormRef.current?.resetFields(); };
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
        } catch (error) { Message.error('新增学科失败'); } finally { setLoading(false); }
    };

    const handleEdit = (record) => { setCurrentRecord(record); setEditModalVisible(true); };
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
        } catch (error) { Message.error('编辑学科失败'); } finally { setLoading(false); }
    };

    const handleDelete = (record) => { setCurrentRecord(record); setDeleteModalVisible(true); };
    const handleDeleteConfirm = async () => {
        try {
            setLoading(true);
            const response = await deleteSubject(currentRecord.id);
            if (response.data) {
                Message.success('删除学科成功');
                setDeleteModalVisible(false);
                fetchTableData();
            }
        } catch (error) { Message.error('删除学科失败'); } finally { setLoading(false); }
    };



    useEffect(() => {
        const calculateTableHeight = () => {
            const windowHeight = window.innerHeight;
            const otherElementsHeight = 250;
            const newHeight = Math.max(200, windowHeight - otherElementsHeight);
            setTableScrollHeight(newHeight);
        };
        calculateTableHeight();
        fetchTableData();
        window.addEventListener('resize', calculateTableHeight);
        return () => window.removeEventListener('resize', calculateTableHeight);
    }, []);

    return (
        <Layout className="subject-manager">
            <Content>
                {/* 筛选表单 (保持不变) */}
                <Form ref={filterFormRef} layout="horizontal" className="filter-form" style={{marginTop: '10px'}}
                      onValuesChange={() => {
                          const values = filterFormRef.current?.getFieldsValue?.() || {};
                          searchTableData(values);
                      }}>
                    <Row gutter={16}>
                        <Col span={6}>
                            <Form.Item field="subjectName" label="名称">
                                <Input placeholder="请输入学科名称"/>
                            </Form.Item>
                        </Col>
                        <Col span={6} style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '16px' }}>
                            <Space>
                                <Button type="primary" icon={<IconSearch/>} onClick={() => searchTableData(filterFormRef.current?.getFieldsValue())}>搜索</Button>
                                <Button type="primary" icon={<IconPlus/>} status="success" onClick={handleAdd}>新增</Button>
                                {/* <Button type="default" icon={<IconUpload/>} onClick={handleImportModal}>导入</Button> */}
                                {/* <Button type="default" icon={<IconDownload/>} onClick={handleExport}>导出</Button> */}
                            </Space>
                        </Col>
                    </Row>
                </Form>

                {/* --- 表格替换为卡片展示区 --- */}
                <div className="card-container" style={{ height: tableScrollHeight, overflowY: 'auto' }}>
                    <Spin loading={tableLoading} style={{ width: '100%' }}>
                        {tableData.length > 0 ? (
                            <Row gutter={[16, 16]} style={{width: '100%'}}>
                                {tableData.map((item: any) => (
                                    <Col xs={24} sm={12} md={8} lg={6} xl={6} key={item.id}>
                                        <Card
                                            hoverable
                                            className="subject-card"
                                            title={<Tag color="blue" bordered>{item.name}</Tag>}
                                            extra={
                                                <Dropdown
                                                    droplist={
                                                        <Menu onClickMenuItem={(key, e) => handleMenuClick(key, e, item)}>
                                                            <Menu.Item key="edit"><IconEdit style={{marginRight: 8}}/>编辑</Menu.Item>
                                                            <Menu.Item key="delete"><IconDelete style={{marginRight: 8}}/>删除</Menu.Item>
                                                        </Menu>
                                                    }
                                                >
                                                    <Button type="text" icon={<IconList />} size="mini" />
                                                </Dropdown>
                                            }
                                        >
                                            <div className="card-content">
                                                <Typography.Paragraph 
                                                    className="card-desc" 
                                                    ellipsis={{ rows: 3, showTooltip: true }}
                                                >
                                                    {item.description || '暂无描述'}
                                                </Typography.Paragraph>
                                                <div className="card-footer">
                                                    <UserAvatar name={item.createUserName || (item?.createUser ?? '')} showName />
                                                    <span className="time">{renderTimeText(item.createDate)}</span>
                                                </div>
                                            </div>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        ) : (
                            !tableLoading && <Empty style={{ marginTop: 60 }} />
                        )}
                    </Spin>
                </div>

                {/* 分页 (保持不变) */}
                <div className="pagination-wrapper">
                    <Pagination
                        {...pagination}
                        onChange={(current, pageSize) => fetchTableData({}, pageSize, current)}
                    />
                </div>

                {/* 所有的 Modal (保持不变) */}
                <Modal title="新增学科" visible={addModalVisible} onOk={handleAddConfirm} confirmLoading={loading} onCancel={() => setAddModalVisible(false)}>
                    <Form ref={addFormRef} layout="vertical">
                        <Form.Item label="学科名称" field="name" rules={[{required: true, message: '请输入名称'}, {maxLength: 64}]}><Input placeholder="请输入学科名称"/></Form.Item>
                        <Form.Item label="学科描述" field="description" rules={[{maxLength: 255}]}><TextArea placeholder="请输入学科描述" autoSize={{minRows: 3, maxRows: 6}}/></Form.Item>
                    </Form>
                </Modal>

                <Modal title="编辑学科" visible={editModalVisible} onOk={handleEditConfirm} confirmLoading={loading} onCancel={() => setEditModalVisible(false)} unmountOnExit>
                    <Form ref={editFormRef} layout="vertical" initialValues={currentRecord}>
                        <Form.Item label="学科名称" field="name" rules={[{required: true, message: '请输入名称'}, {maxLength: 64}]}><Input placeholder="请输入学科名称"/></Form.Item>
                        <Form.Item label="学科描述" field="description" rules={[{maxLength: 255}]}><TextArea placeholder="请输入学科描述" autoSize={{minRows: 3, maxRows: 6}}/></Form.Item>
                    </Form>
                </Modal>

                <Modal title="删除学科" visible={deleteModalVisible} onOk={handleDeleteConfirm} confirmLoading={loading} onCancel={() => setDeleteModalVisible(false)}>
                    <p>确定要删除学科 <strong>{currentRecord?.name}</strong> 吗？</p>
                    <p style={{color: 'red'}}>删除后不可恢复，请谨慎操作！</p>
                </Modal>

                {/* 导入学科 Modal 已移除 */}
            </Content>
        </Layout>
    );
}

export default SubjectManager;