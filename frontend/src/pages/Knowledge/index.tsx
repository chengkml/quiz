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
    Spin,
    Table,
    Tree,
} from '@arco-design/web-react';
import './style/index.less';
import {
    createKnowledge,
    deleteKnowledge,
    getAllCategories,
    getAllSubjects,
    getCategoriesBySubjectId,
    getKnowledgeList,
    getKnowledgeQuestions,
    getSubjectCategoryTree,
    updateKnowledge,
} from './api';
import {IconDelete, IconEdit, IconList, IconPlus, IconSearch} from '@arco-design/web-react/icon';
import Sider from '@arco-design/web-react/es/Layout/sider';

const {TextArea} = Input;
const {Content} = Layout;
const {Row, Col} = Grid;

function KnowledgeManager() {
    const [tableScrollHeight, setTableScrollHeight] = useState(200);
    // 状态管理
    const [tableData, setTableData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);

    // 左侧树相关状态
    const [treeData, setTreeData] = useState([]);
    const [filteredTreeData, setFilteredTreeData] = useState([]);
    const [treeLoading, setTreeLoading] = useState(false);
    const [selectedTreeNode, setSelectedTreeNode] = useState(null);
    const [expandedKeys, setExpandedKeys] = useState([]);
    const [searchKeyword, setSearchKeyword] = useState('');

    // 当前选中的过滤条件
    const [currentSubjectId, setCurrentSubjectId] = useState(null);
    const [currentCategoryId, setCurrentCategoryId] = useState(null);

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

    // 关联问题相关状态
    const [questionsModalVisible, setQuestionsModalVisible] = useState(false);
    const [relatedQuestions, setRelatedQuestions] = useState([]);
    const [questionsLoading, setQuestionsLoading] = useState(false);

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
            title: '知识点',
            dataIndex: 'name',
            ellipsis: true,
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
                </Space>
            ),
        },
    ];

    // 获取表格数据
    const fetchTableData = async (params = {}, pageSize = pagination.pageSize, current = pagination.current, subjectId = currentSubjectId, categoryId = currentCategoryId) => {
        setTableLoading(true);
        try {
            const targetParams = {
                ...params,
                pageNum: current - 1,
                pageSize: pageSize,
                subjectId: subjectId,  // 根据选中的学科过滤
                categoryId: categoryId,  // 根据选中的分类过滤
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

    // 处理查看关联问题
    const handleViewQuestions = async (record) => {
        setCurrentRecord(record);
        setQuestionsLoading(true);
        try {
            const response = await getKnowledgeQuestions(record.id);
            if (response.data) {
                setRelatedQuestions(response.data);
            }
        } catch (error) {
            Message.error('获取关联问题失败');
        } finally {
            setQuestionsLoading(false);
            setQuestionsModalVisible(true);
        }
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
        } else if (key === 'questions') {
            handleViewQuestions(record);
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
            await updateKnowledge({...values, id: currentRecord.id});
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
        const filterParams = filterFormRef.current?.getFieldsValue?.() || {};
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

    // 获取学科分类树数据
    const fetchSubjectCategoryTree = async () => {
        try {
            setTreeLoading(true);
            const res = await getSubjectCategoryTree();
            if (res?.data) {

                // 递归构造 Tree 节点
                const buildCategoryTree = (list = []) => {
                    return list.map(item => ({
                        key: item.id,
                        title: item.name,
                        children: item.children ? buildCategoryTree(item.children) : []
                    }));
                };

                const transformData = res.data.map(subject => ({
                    key: subject.id,
                    title: subject.name,
                    children: buildCategoryTree(subject.categories || [])
                }));

                setTreeData(transformData);
                setFilteredTreeData(transformData);

                // 默认展开第一层（subject）
                if (transformData.length > 0) {
                    setExpandedKeys(transformData.map(item => item.key));
                }
            }
        } catch (error) {
            Message.error('获取学科分类树失败');
        } finally {
            setTreeLoading(false);
        }
    };


    // 处理搜索关键字变化
    const handleSearchChange = (value) => {
        setSearchKeyword(value);
        if (!value) {
            setFilteredTreeData(treeData);
            return;
        }

        // 简单的树结构搜索实现
        const searchInTree = (tree, keyword) => {
            const filtered = [];
            for (const node of tree) {
                const matched = node.title.toLowerCase().includes(keyword.toLowerCase());
                const children = node.children ? searchInTree(node.children, keyword) : [];

                if (matched || children.length > 0) {
                    filtered.push({
                        ...node,
                        children: children.length > 0 ? children : (matched ? node.children || [] : [])
                    });
                }
            }
            return filtered;
        };

        const filtered = searchInTree(treeData, value);
        setFilteredTreeData(filtered);
    };

    // 处理树节点选择
    const handleTreeNodeSelect = (selectedKeys, info) => {
        if (selectedKeys.length > 0) {
            setSelectedTreeNode(selectedKeys[0]);

            // 解析选中的节点，判断是学科还是分类
            const selectedKey = selectedKeys[0];
            const node = info.node;

            let subjectId = null;
            let categoryId = null;

            // 根据树的层级结构判断：第一级是学科，第二级及以下是分类
            if (!info.node.parent) {
                // 学科节点
                subjectId = selectedKey;
                setCurrentSubjectId(selectedKey);
                setCurrentCategoryId(null);
            } else {
                // 分类节点，找到对应的父学科
                categoryId = selectedKey;
                setCurrentCategoryId(selectedKey);
                // 查找父学科ID
                const findParentSubject = (tree, childKey) => {
                    for (const subject of tree) {
                        if (subject.children?.some(cat => cat.key === childKey)) {
                            return subject.key;
                        }
                    }
                    return null;
                };
                const parentSubjectId = findParentSubject(treeData, selectedKey);
                subjectId = parentSubjectId;
                setCurrentSubjectId(parentSubjectId);
            }

            // 重新加载表格数据，直接传递最新的学科ID和分类ID，避免状态更新的异步问题
            fetchTableData(null, pagination.pageSize, pagination.current, subjectId, categoryId);
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

    // 监听窗口大小变化，动态调整表格高度和初始化数据
    useEffect(() => {
        const calculateTableHeight = () => {
            const windowHeight = window.innerHeight;
            const otherElementsHeight = 250; // 预估其他元素占用的高度
            const newHeight = Math.max(200, windowHeight - otherElementsHeight);
            setTableScrollHeight(newHeight);
        };
        calculateTableHeight();

        // 初始化数据
        fetchTableData();
        fetchSubjects();
        fetchSubjectCategoryTree();

        // 设置表单默认值
        setTimeout(() => {
            filterFormRef.current?.setFieldsValue?.({});
        }, 50);

        // 监听窗口大小变化
        const handleResize = () => calculateTableHeight();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="knowledge-manager">
            <Layout>
                <Sider
                    resizeDirections={['right']}
                    style={{
                        minWidth: 200,
                        maxWidth: 400,
                        height: '100%',
                        backgroundColor: '#fff',
                        borderRight: '1px solid #e5e6eb',
                    }}
                >
                    <div style={{padding: '12px', borderBottom: '1px solid #e5e6eb'}}>
                        <Input.Search
                            placeholder="搜索学科分类"
                            allowClear
                            style={{width: '100%'}}
                            value={searchKeyword}
                            onChange={(value) => {
                                handleSearchChange(value);
                            }}
                        />
                    </div>
                    <div style={{padding: '12px', height: 'calc(100% - 60px)', overflow: 'auto'}}>
                        <Spin loading={treeLoading}>
                            {filteredTreeData.length > 0 ? (
                                <Tree
                                    treeData={filteredTreeData}
                                    expandedKeys={expandedKeys}
                                    selectedKeys={selectedTreeNode ? [selectedTreeNode] : []}
                                    onExpand={(expandedKeys) => {
                                        setExpandedKeys(expandedKeys);
                                    }}
                                    onSelect={(selectedKeys, info) => {
                                        if (selectedKeys.length > 0) {
                                            setSelectedTreeNode(selectedKeys[0]);

                                            // 解析选中的节点，判断是学科还是分类
                                            const selectedKey = selectedKeys[0];
                                            const node = info.node;

                                            // 根据树的层级结构判断：第一级是学科，第二级及以下是分类
                                            // 通过查找父节点来确定层级
                                            const findNodeInTree = (treeData, key) => {
                                                for (const item of treeData) {
                                                    if (item.key === key) {
                                                        return {node: item, parent: null};
                                                    }
                                                    if (item.children) {
                                                        const result = findNodeInTreeRecursive(item.children, key, item);
                                                        if (result) return result;
                                                    }
                                                }
                                                return null;
                                            };

                                            const findNodeInTreeRecursive = (children, key, parent) => {
                                                for (const child of children) {
                                                    if (child.key === key) {
                                                        return {node: child, parent};
                                                    }
                                                    if (child.children) {
                                                        const result = findNodeInTreeRecursive(child.children, key, child);
                                                        if (result) return result;
                                                    }
                                                }
                                                return null;
                                            };

                                            const nodeInfo = findNodeInTree(treeData, selectedKey);

                                            if (nodeInfo && nodeInfo.parent) {
                                                // 这是一个分类节点
                                                const categoryId = selectedKey;
                                                const subjectId = nodeInfo.parent.key;

                                                setCurrentSubjectId(subjectId);
                                                setCurrentCategoryId(categoryId);

                                                console.log('选中分类:', {
                                                    subjectId,
                                                    categoryId,
                                                    categoryName: nodeInfo.node.title,
                                                    subjectName: nodeInfo.parent.title
                                                });
                                                fetchTableData(null, pagination.pageSize, pagination.current, subjectId, categoryId);
                                            } else {
                                                // 这是一个学科节点
                                                const subjectId = selectedKey;

                                                setCurrentSubjectId(subjectId);
                                                setCurrentCategoryId(null);

                                                console.log('选中学科:', {
                                                    subjectId,
                                                    subjectName: nodeInfo?.node.title
                                                });
                                                fetchTableData(null, pagination.pageSize, pagination.current, subjectId, null);

                                            }
                                            // 重新获取表格数据
                                        } else {
                                            setSelectedTreeNode(null);
                                            setCurrentSubjectId(null);
                                            setCurrentCategoryId(null);
                                            fetchTableData();
                                        }
                                    }}
                                    blockNode
                                    showLine
                                    style={{
                                        backgroundColor: 'transparent',
                                    }}
                                />
                            ) : (
                                <div style={{
                                    textAlign: 'center',
                                    color: '#86909c',
                                    padding: '20px 0',
                                    fontSize: '14px'
                                }}>
                                    暂无数据
                                </div>
                            )}
                        </Spin>
                    </div>
                </Sider>
                <Content>
                    {/* 筛选表单 */}
                    <Form ref={filterFormRef} layout="horizontal" className="filter-form"
                          style={{marginTop: '10px'}}
                          onValuesChange={() => {
                              const values = filterFormRef.current?.getFieldsValue?.() || {};
                              searchTableData(values);
                          }}>
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item field="knowledgeName" label="关键字">
                                    <Input placeholder="请输入关键字"/>
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
                    <Table
                        columns={columns}
                        data={tableData}
                        loading={tableLoading}
                        pagination={false}
                        scroll={{y: tableScrollHeight}}
                        rowKey="id"
                    />
                    <div className="pagination-wrapper">
                        <Pagination
                            {...pagination}
                            onChange={handlePageChange}
                        />
                    </div>

                    {/* 新增对话框 */}
                    <Modal
                        title="新增知识点"
                        visible={addModalVisible}
                        onOk={confirmAdd}
                        onCancel={() => {
                            setAddModalVisible(false);
                            addFormRef.current?.resetFields();
                        }}
                    >
                        <div style={{maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px'}}>
                            <Form ref={addFormRef} className="modal-form" layout="vertical">
                                <Form.Item
                                    label="知识点名称"
                                    field="name"
                                    rules={[
                                        {required: true, message: '请输入知识点名称'},
                                        {maxLength: 64, message: '知识点名称不能超过64个字符'},
                                    ]}
                                >
                                    <Input.TextArea placeholder="请输入知识点名称"/>
                                </Form.Item>
                                <Form.Item
                                    label="所属学科"
                                    field="subjectId"
                                    rules={[{required: true, message: '请选择所属学科'}]}
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
                                    rules={[{required: true, message: '请选择所属分类'}]}
                                >
                                    <Select
                                        placeholder="请选择所属分类"
                                        options={categories}
                                        loading={categoriesLoading}
                                        allowClear
                                        disabled={!addFormRef.current?.getFieldValue('subjectId')}
                                    />
                                </Form.Item>
                            </Form>
                        </div>
                    </Modal>

                    {/* 编辑对话框 */}
                    <Modal
                        title="编辑知识点"
                        visible={editModalVisible}
                        onCancel={() => {
                            setEditModalVisible(false);
                            editFormRef.current?.resetFields();
                        }}
                        onOk={confirmEdit}
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
                        <div style={{maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px'}}>
                            <Form ref={editFormRef} className="modal-form" layout="vertical">
                                <Form.Item
                                    label="知识点名称"
                                    field="name"
                                    rules={[
                                        {required: true, message: '请输入知识点名称'},
                                        {maxLength: 64, message: '知识点名称不能超过64个字符'},
                                    ]}
                                >
                                    <Input.TextArea placeholder="请输入知识点名称"/>
                                </Form.Item>
                                <Form.Item
                                    label="所属学科"
                                    field="subjectId"
                                    rules={[{required: true, message: '请选择所属学科'}]}
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
                                    rules={[{required: true, message: '请选择所属分类'}]}
                                >
                                    <Select
                                        placeholder="请选择所属分类"
                                        options={categories}
                                        loading={categoriesLoading}
                                        allowClear
                                        disabled={!editFormRef.current?.getFieldValue('subjectId')}
                                    />
                                </Form.Item>
                            </Form>
                        </div>
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

                </Content>
            </Layout>
        </div>
    );
}

export default KnowledgeManager;