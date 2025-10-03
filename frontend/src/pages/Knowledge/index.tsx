import React, { useEffect, useRef, useState } from 'react';
import {
    Button,
    Dropdown,
    Form,
    Input,
    Layout,
    Menu,
    Message,
    Modal,
    Select,
    Space,
    Table,
    Tag,
} from '@arco-design/web-react';
import './style/index.less';
import {
    createKnowledge,
    deleteKnowledge,
    getKnowledgeList,
    updateKnowledge,
    checkKnowledgeNameExists,
    getAllCategories,
    getAllSubjects,
    getCategoriesBySubjectId,
} from './api';
import { IconDelete, IconEdit, IconEye, IconList, IconPlus } from '@arco-design/web-react/icon';
import FilterForm from '@/components/FilterForm';

const { TextArea } = Input;
const { Content } = Layout;

function KnowledgeManager() {
    // 状态管理
    const [tableData, setTableData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);

    // 下拉选项数据
    const [categories, setCategories] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [subjectsLoading, setSubjectsLoading] = useState(false);

    // 对话框状态
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
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

    // 难度等级选项
    const difficultyOptions = [
        { label: '1级', value: 1 },
        { label: '2级', value: 2 },
        { label: '3级', value: 3 },
        { label: '4级', value: 4 },
        { label: '5级', value: 5 },
    ];

    // 表格列配置
    const columns = [
        {
            title: '知识点名称',
            dataIndex: 'name',
            width: 200,
            ellipsis: true,
            render: (value) => (
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {value}
                </div>
            ),
        },
        {
            title: '描述',
            dataIndex: 'description',
            minWidth: 300,
            ellipsis: true,
            render: (value) => (
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {value || '--'}
                </div>
            ),
        },
        {
            title: '所属分类',
            dataIndex: 'categoryName',
            width: 150,
            ellipsis: true,
            render: (value) => value || '--',
        },
        {
            title: '所属学科',
            dataIndex: 'subjectName',
            width: 150,
            ellipsis: true,
            render: (value) => value || '--',
        },
        {
            title: '难度等级',
            dataIndex: 'difficultyLevel',
            width: 100,
            align: 'center',
            render: (value) => {
                if (!value) return '--';
                const colorClass = value <= 2 ? 'level-1' : value <= 3 ? 'level-3' : 'level-4';
                return (
                    <Tag className={`difficulty-tag ${colorClass}`}>
                        难度: {value}级
                    </Tag>
                );
            },
        },
        {
            title: '创建人',
            dataIndex: 'createUserName',
            width: 120,
            ellipsis: true,
            render: (value) => value || '--',
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
                <Space size="large" className="table-btn-group">
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
                                    <IconEye style={{ marginRight: '5px' }} />
                                    查看详情
                                </Menu.Item>
                                <Menu.Item key="edit">
                                    <IconEdit style={{ marginRight: '5px' }} />
                                    编辑
                                </Menu.Item>
                                <Menu.Item key="delete">
                                    <IconDelete style={{ marginRight: '5px' }} />
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
                            <IconList />
                        </Button>
                    </Dropdown>
                </Space>
            ),
        },
    ];

    // 获取表格数据
    const fetchTableData = async (params = {}, pageSize = pagination.pageSize, current = pagination.current) => {
        setTableLoading(true);
        try {
            const targetParams = {
                ...params,
                pageNum: current - 1,
                pageSize: pageSize,
            };
            const response = await getKnowledgeList(targetParams);
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
            Message.error('获取知识点数据失败');
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
    const confirmAdd = async () => {
        try {
            const values = await addFormRef.current.validate();
            setLoading(true);
            await createKnowledge(values);
            Message.success('知识点创建成功');
            setAddModalVisible(false);
            addFormRef.current.resetFields();
            fetchTableData();
        } catch (error) {
            if (error.fields) {
                Message.error('请检查表单输入');
            } else {
                Message.error('创建知识点失败');
            }
        } finally {
            setLoading(false);
        }
    };

    // 确认编辑
    const confirmEdit = async () => {
        try {
            const values = await editFormRef.current.validate();
            setLoading(true);
            await updateKnowledge({ ...values, id: currentRecord.id });
            Message.success('知识点更新成功');
            setEditModalVisible(false);
            editFormRef.current.resetFields();
            fetchTableData();
        } catch (error) {
            if (error.fields) {
                Message.error('请检查表单输入');
            } else {
                Message.error('更新知识点失败');
            }
        } finally {
            setLoading(false);
        }
    };

    // 确认删除
    const confirmDelete = async () => {
        try {
            setLoading(true);
            await deleteKnowledge(currentRecord.id);
            Message.success('知识点删除成功');
            setDeleteModalVisible(false);
            fetchTableData();
        } catch (error) {
            Message.error('删除知识点失败');
        } finally {
            setLoading(false);
        }
    };

    // 分页变化处理
    const handlePageChange = (current, pageSize) => {
        const filterParams = filterFormRef.current?.getFieldsValue() || {};
        fetchTableData(filterParams, pageSize, current);
    };

    // 获取分类列表
    const fetchCategories = async () => {
        try {
            setCategoriesLoading(true);
            const response = await getAllCategories();
            if (response.data) {
                setCategories(response.data.map(item => ({
                    label: item.name,
                    value: item.id
                })));
            }
        } catch (error) {
            console.error('获取分类列表失败:', error);
            Message.error('获取分类列表失败');
        } finally {
            setCategoriesLoading(false);
        }
    };

    // 根据学科ID获取分类列表
    const fetchCategoriesBySubject = async (subjectId) => {
        if (!subjectId) {
            setCategories([]);
            return;
        }
        try {
            setCategoriesLoading(true);
            const response = await getCategoriesBySubjectId(subjectId);
            if (response.data) {
                setCategories(response.data.map(item => ({
                    label: item.name,
                    value: item.id
                })));
            }
        } catch (error) {
            console.error('获取分类列表失败:', error);
            Message.error('获取分类列表失败');
            setCategories([]);
        } finally {
            setCategoriesLoading(false);
        }
    };

    // 获取学科列表
    const fetchSubjects = async () => {
        try {
            setSubjectsLoading(true);
            const response = await getAllSubjects();
            if (response.data) {
                setSubjects(response.data.map(item => ({
                    label: item.name,
                    value: item.id
                })));
            }
        } catch (error) {
            console.error('获取学科列表失败:', error);
            Message.error('获取学科列表失败');
        } finally {
            setSubjectsLoading(false);
        }
    };

    // 初始化数据
    useEffect(() => {
        fetchTableData();
        fetchSubjects();
        // 初始时不加载分类，等用户选择学科后再加载
    }, []);

    // 筛选表单配置
    const filterFormConfig = [
        {
            label: '知识点名称',
            field: 'name',
            type: 'input',
            placeholder: '请输入知识点名称',
        },
        {
            label: '难度等级',
            field: 'difficultyLevel',
            type: 'select',
            placeholder: '请选择难度等级',
            options: difficultyOptions,
        },
    ];

    return (
        <Layout className="knowledge-manager">
            <Content>
                {/* 筛选区域 */}
                <div className="filter-section">
                    <FilterForm
                        ref={filterFormRef}
                        config={filterFormConfig}
                        onSearch={searchTableData}
                        onReset={() => fetchTableData()}
                    />
                </div>

                {/* 表格区域 */}
                <div className="table-section">
                    <div className="table-header">
                        <div className="table-title">知识点列表</div>
                        <div className="table-actions">
                            <Button type="primary" icon={<IconPlus />} onClick={handleAdd}>
                                新增知识点
                            </Button>
                        </div>
                    </div>
                    <div className="table-content">
                        <Table
                            columns={columns}
                            data={tableData}
                            loading={tableLoading}
                            pagination={{
                                ...pagination,
                                onChange: handlePageChange,
                            }}
                            scroll={{ x: 1200 }}
                            rowKey="id"
                        />
                    </div>
                </div>

                {/* 新增对话框 */}
                <Modal
                    title="新增知识点"
                    visible={addModalVisible}
                    onCancel={() => {
                        setAddModalVisible(false);
                        addFormRef.current?.resetFields();
                    }}
                    footer={null}
                    width={600}
                >
                    <Form ref={addFormRef} className="modal-form" layout="vertical">
                        <Form.Item
                            label="知识点名称"
                            field="name"
                            rules={[
                                { required: true, message: '请输入知识点名称' },
                                { maxLength: 64, message: '知识点名称不能超过64个字符' },
                            ]}
                        >
                            <Input placeholder="请输入知识点名称" />
                        </Form.Item>
                        <Form.Item
                            label="描述"
                            field="description"
                            rules={[
                                { maxLength: 255, message: '描述不能超过255个字符' },
                            ]}
                        >
                            <TextArea
                                placeholder="请输入知识点描述"
                                rows={4}
                                maxLength={255}
                                showWordLimit
                            />
                        </Form.Item>
                        <Form.Item
                            label="所属学科"
                            field="subjectId"
                            rules={[{ required: true, message: '请选择所属学科' }]}
                        >
                            <Select 
                                placeholder="请选择所属学科" 
                                options={subjects}
                                loading={subjectsLoading}
                                allowClear
                                onChange={(value) => {
                                    // 当学科改变时，清空分类选择并重新加载分类列表
                                    addFormRef.current?.setFieldValue('categoryId', undefined);
                                    fetchCategoriesBySubject(value);
                                }}
                            />
                        </Form.Item>
                        <Form.Item
                            label="所属分类"
                            field="categoryId"
                            rules={[{ required: true, message: '请选择所属分类' }]}
                        >
                            <Select 
                                placeholder="请选择所属分类" 
                                options={categories}
                                loading={categoriesLoading}
                                allowClear
                                disabled={!addFormRef.current?.getFieldValue('subjectId')}
                            />
                        </Form.Item>
                        <Form.Item
                            label="难度等级"
                            field="difficultyLevel"
                            rules={[{ required: true, message: '请选择难度等级' }]}
                        >
                            <Select placeholder="请选择难度等级" options={difficultyOptions} />
                        </Form.Item>
                        <div className="form-actions">
                            <Button
                                onClick={() => {
                                    setAddModalVisible(false);
                                    addFormRef.current?.resetFields();
                                }}
                            >
                                取消
                            </Button>
                            <Button type="primary" loading={loading} onClick={confirmAdd}>
                                确定
                            </Button>
                        </div>
                    </Form>
                </Modal>

                {/* 编辑对话框 */}
                <Modal
                    title="编辑知识点"
                    visible={editModalVisible}
                    onCancel={() => {
                        setEditModalVisible(false);
                        editFormRef.current?.resetFields();
                    }}
                    footer={null}
                    width={600}
                    afterOpen={() => {
                        if (currentRecord) {
                            editFormRef.current?.setFieldsValue({
                                name: currentRecord.name,
                                description: currentRecord.description,
                                categoryId: currentRecord.categoryId,
                                subjectId: currentRecord.subjectId,
                                difficultyLevel: currentRecord.difficultyLevel,
                            });
                            // 编辑时根据当前记录的学科ID加载对应的分类列表
                            if (currentRecord.subjectId) {
                                fetchCategoriesBySubject(currentRecord.subjectId);
                            }
                        }
                    }}
                >
                    <Form ref={editFormRef} className="modal-form" layout="vertical">
                        <Form.Item
                            label="知识点名称"
                            field="name"
                            rules={[
                                { required: true, message: '请输入知识点名称' },
                                { maxLength: 64, message: '知识点名称不能超过64个字符' },
                            ]}
                        >
                            <Input placeholder="请输入知识点名称" />
                        </Form.Item>
                        <Form.Item
                            label="描述"
                            field="description"
                            rules={[
                                { maxLength: 255, message: '描述不能超过255个字符' },
                            ]}
                        >
                            <TextArea
                                placeholder="请输入知识点描述"
                                rows={4}
                                maxLength={255}
                                showWordLimit
                            />
                        </Form.Item>
                        <Form.Item
                            label="所属学科"
                            field="subjectId"
                            rules={[{ required: true, message: '请选择所属学科' }]}
                        >
                            <Select 
                                placeholder="请选择所属学科" 
                                options={subjects}
                                loading={subjectsLoading}
                                allowClear
                                onChange={(value) => {
                                    // 当学科改变时，清空分类选择并重新加载分类列表
                                    editFormRef.current?.setFieldValue('categoryId', undefined);
                                    fetchCategoriesBySubject(value);
                                }}
                            />
                        </Form.Item>
                        <Form.Item
                            label="所属分类"
                            field="categoryId"
                            rules={[{ required: true, message: '请选择所属分类' }]}
                        >
                            <Select 
                                placeholder="请选择所属分类" 
                                options={categories}
                                loading={categoriesLoading}
                                allowClear
                                disabled={!editFormRef.current?.getFieldValue('subjectId')}
                            />
                        </Form.Item>
                        <Form.Item
                            label="难度等级"
                            field="difficultyLevel"
                            rules={[{ required: true, message: '请选择难度等级' }]}
                        >
                            <Select placeholder="请选择难度等级" options={difficultyOptions} />
                        </Form.Item>
                        <div className="form-actions">
                            <Button
                                onClick={() => {
                                    setEditModalVisible(false);
                                    editFormRef.current?.resetFields();
                                }}
                            >
                                取消
                            </Button>
                            <Button type="primary" loading={loading} onClick={confirmEdit}>
                                确定
                            </Button>
                        </div>
                    </Form>
                </Modal>

                {/* 删除确认对话框 */}
                <Modal
                    title="删除知识点"
                    visible={deleteModalVisible}
                    onCancel={() => setDeleteModalVisible(false)}
                    onOk={confirmDelete}
                    confirmLoading={loading}
                >
                    <p>确定要删除知识点 "{currentRecord?.name}" 吗？此操作不可撤销。</p>
                </Modal>

                {/* 详情对话框 */}
                <Modal
                    title="知识点详情"
                    visible={detailModalVisible}
                    onCancel={() => setDetailModalVisible(false)}
                    footer={
                        <Button onClick={() => setDetailModalVisible(false)}>
                            关闭
                        </Button>
                    }
                    width={600}
                >
                    <div className="detail-modal">
                        <div className="detail-item">
                            <div className="detail-label">知识点名称：</div>
                            <div className="detail-value">{detailRecord?.name}</div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">描述：</div>
                            <div className="detail-value">{detailRecord?.description || '--'}</div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">所属分类：</div>
                            <div className="detail-value">{detailRecord?.categoryName || '--'}</div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">所属学科：</div>
                            <div className="detail-value">{detailRecord?.subjectName || '--'}</div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">难度等级：</div>
                            <div className="detail-value">
                                {detailRecord?.difficultyLevel ? `${detailRecord.difficultyLevel}级` : '--'}
                            </div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">创建人：</div>
                            <div className="detail-value">{detailRecord?.createUserName || '--'}</div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">创建时间：</div>
                            <div className="detail-value">
                                {detailRecord?.createDate ? new Date(detailRecord.createDate).toLocaleString() : '--'}
                            </div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">更新人：</div>
                            <div className="detail-value">{detailRecord?.updateUserName || '--'}</div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">更新时间：</div>
                            <div className="detail-value">
                                {detailRecord?.updateDate ? new Date(detailRecord.updateDate).toLocaleString() : '--'}
                            </div>
                        </div>
                    </div>
                </Modal>
            </Content>
        </Layout>
    );
}

export default KnowledgeManager;