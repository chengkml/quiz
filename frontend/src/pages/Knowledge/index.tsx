import React, { useEffect, useRef, useState } from 'react';
import UserAvatar from '@/components/UserAvatar';
import {
    Button,
    Drawer,
    Dropdown,
    Form,
    Input,
    Layout,
    Menu,
    Message,
    Modal,
    Select,
    Space,
    Spin,
    Tree,
} from '@arco-design/web-react';
import './style/index.less';
import {
    createKnowledge,
    deleteKnowledge,
    getAllCategories,
    getAllSubjects,
    getKnowledgeList,
    getKnowledgeQuestions,
    updateKnowledge,
    streamPolishKnowledgeUrl,
    getSubjectCategoryTree,
} from './api';
import { DataManager } from '../../components/DataManager';
import { IconDelete, IconEdit, IconList, IconPlus } from '@arco-design/web-react/icon';
import FilterForm from '@/components/FilterForm';
import { CKEditor } from 'ckeditor4-react';

declare const __APP_BASE_PATH__: string;

function KnowledgeManager() {
    const editorScriptUrl = `${(__APP_BASE_PATH__ || '/').replace(/\/$/, '')}/ckeditor/ckeditor.js`;
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
    const [currentCategoryIds, setCurrentCategoryIds] = useState(null);

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

    const deriveNameFromContent = (html: string) => {
        if (!html) return '未命名知识点';
        const container = document.createElement('div');
        container.innerHTML = html;
        const text = (container.textContent || '').trim();
        if (!text) return '未命名知识点';
        return text.slice(0, 64);
    };

    // 表单引用
    const filterFormRef = useRef<any>();
    const addFormRef = useRef();
    const editFormRef = useRef();
    const addEditorRef = useRef(null);
    const editEditorRef = useRef(null);

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
            render: (value, record) => (
                <UserAvatar name={value || (record?.createUser ?? '')} showName />
            ),
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
                            onClick={(e) => {
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
    const fetchTableData = async (params = {}, pageSize = pagination.pageSize, current = pagination.current, subjectId = currentSubjectId, categoryIds = currentCategoryIds) => {
        setTableLoading(true);
        try {
            const targetParams = {
                ...params,
                pageNum: current - 1,
                pageSize: pageSize,
                subjectId,
                categoryIds,
            };
            const response = await getKnowledgeList(targetParams);
            if (response.data) {
                setTableData(response.data.content || []);
                setPagination((prev) => ({
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

    // AI 润色相关
    const [polishModalVisible, setPolishModalVisible] = useState(false);
    const [polishContent, setPolishContent] = useState('');
    const [polishLoading, setPolishLoading] = useState(false);
    const polishEventSourceRef = useRef(null);
    const [targetEditor, setTargetEditor] = useState(null);

    const handlePolish = (editor) => {
        const content = editor.getData();
        if (!content) {
            Message.warning('请先输入内容');
            return;
        }
        setPolishContent('');
        setPolishLoading(true);
        setPolishModalVisible(true);
        setTargetEditor(editor);

        if (polishEventSourceRef.current) {
            polishEventSourceRef.current.close();
        }

        const url = streamPolishKnowledgeUrl(content);
        // @ts-ignore
        const es = new EventSource(url);
        polishEventSourceRef.current = es;

        es.onmessage = (event) => {
            if (event.data === '[DONE]') {
                es.close();
                setPolishLoading(false);
                return;
            }
            if (event.data.startsWith('[ERROR]')) {
                Message.error(event.data);
                es.close();
                setPolishLoading(false);
                return;
            }
            setPolishContent((prev) => prev + event.data);
        };

        es.onerror = (err) => {
            console.error('SSE Error', err);
            es.close();
            setPolishLoading(false);
        };
    };

    const applyPolish = () => {
        if (targetEditor) {
            targetEditor.setData(polishContent);
            Message.success('已应用润色内容');
            setPolishModalVisible(false);
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
            await createKnowledge({
                ...values,
            });
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
            await updateKnowledge({
                ...values,
                id: currentRecord.id,
            });
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
                setCategories(response.data.map((item) => ({
                    label: item.name,
                    value: item.id,
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
            // 通过知识点分页接口按学科筛选，获取较大页以填充下拉
            const response = await getKnowledgeList({ subjectId, pageNum: 0, pageSize: 1000 });
            const list = response.data?.content || [];
            setCategories(list.map((item: any) => ({
                label: item.categoryName,
                value: item.categoryId,
            })));
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
                // 递归构造 Tree 节点，并为每个节点绑定 subjectId
                const buildCategoryTreeWithSubjectId = (list = [], subjectId) => {
                    return list.map((item) => ({
                        key: item.id,
                        title: item.name,
                        subjectId, // ✅ 关键：记录所属学科ID
                        children: item.children
                            ? buildCategoryTreeWithSubjectId(item.children, subjectId)
                            : [],
                    }));
                };

                const transformData = res.data.map((subject) => ({
                    key: subject.id,
                    title: subject.name,
                    subjectId: subject.id, // 学科节点自身也带 subjectId
                    children: buildCategoryTreeWithSubjectId(subject.categories || [], subject.id),
                }));

                setTreeData(transformData);
                setFilteredTreeData(transformData);

                // 默认展开第一层（学科）
                if (transformData.length > 0) {
                    setExpandedKeys(transformData.map((item) => item.key));
                }
            }
        } catch (error) {
            console.error('获取学科分类树失败:', error);
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

        const searchInTree = (tree, keyword) => {
            const filtered = [];
            for (const node of tree) {
                const matched = node.title.toLowerCase().includes(keyword.toLowerCase());
                const children = node.children ? searchInTree(node.children, keyword) : [];

                if (matched || children.length > 0) {
                    filtered.push({
                        ...node,
                        children: children.length > 0 ? children : (matched ? node.children || [] : []),
                    });
                }
            }
            return filtered;
        };

        const filtered = searchInTree(treeData, value);
        setFilteredTreeData(filtered);
    };

    // 获取学科列表
    const fetchSubjects = async () => {
        try {
            setSubjectsLoading(true);
            const response = await getAllSubjects();
            if (response.data) {
                setSubjects(response.data.map((item) => ({
                    label: item.name,
                    value: item.id,
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
            const otherElementsHeight = 330; // 与待办页面一致的占位高度
            const newHeight = Math.max(100, windowHeight - otherElementsHeight);
            setTableScrollHeight((prev) => (prev === newHeight ? prev : newHeight));
        };
        calculateTableHeight();

        fetchTableData();
        fetchSubjects();
        fetchSubjectCategoryTree();

        const handleResize = () => calculateTableHeight();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const searchFormFields = [
        {
            field: 'knowledgeName',
            label: '关键字',
            type: 'input',
            placeholder: '请输入关键字',
            span: 8,
        },
        {
            field: 'subjectId',
            label: '学科',
            type: 'select',
            options: subjects,
            allowClear: true,
            span: 8,
        },
        {
            field: 'categoryId',
            label: '分类',
            type: 'select',
            options: categories,
            allowClear: true,
            disabled: !filterFormRef.current?.getFilterValues?.()?.subjectId,
            span: 8,
        },
    ];

    const filterContent = (
        <FilterForm
            ref={filterFormRef}
            formFields={searchFormFields}
            onValuesChange={(changeValue: any, values: any) => {
                // 当学科变更时，联动分类下拉并清空已选分类
                if (Object.prototype.hasOwnProperty.call(changeValue, 'subjectId')) {
                    const subjectId = changeValue.subjectId;
                    setCurrentSubjectId(subjectId || null);
                    filterFormRef.current?.setFieldsValue?.({ categoryId: undefined });
                    fetchCategoriesBySubject(subjectId);
                }
                searchTableData(values);
            }}
            onSearch={(values: any) => {
                searchTableData(values);
            }}
            onReset={() => {
                setCurrentSubjectId(null);
                setCurrentCategoryIds(null);
                setCategories([]);
                fetchTableData();
            }}
        />
    );

    const treeContent = (
        <div style={{ height: '100%' }}>
            <div style={{ paddingBottom: '12px' }}>
                <Input.Search
                    placeholder="搜索学科分类"
                    allowClear
                    style={{ width: '100%' }}
                    value={searchKeyword}
                    onChange={(value) => {
                        handleSearchChange(value);
                    }}
                />
            </div>
            <div style={{ height: 'calc(100% - 50px)' }}>
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
                                    const node = info.node;

                                    const subjectId = node.props.subjectId;
                                    const isSubjectNode = node.key === node.props.subjectId;
                                    const categoryId = isSubjectNode ? null : node.key;

                                    const collectChildCategoryIds = (treeNode) => {
                                        let ids = [];
                                        if (treeNode.children && treeNode.children.length > 0) {
                                            treeNode.children.forEach((child) => {
                                                ids.push(child.key);
                                                ids = ids.concat(collectChildCategoryIds(child));
                                            });
                                        }
                                        return ids;
                                    };

                                    let categoryIds = [];
                                    if (!isSubjectNode) {
                                        categoryIds.push(categoryId);
                                        categoryIds = categoryIds.concat(collectChildCategoryIds(node));
                                    }

                                    setSelectedTreeNode(selectedKeys[0]);
                                    setCurrentSubjectId(subjectId);
                                    setCurrentCategoryIds(categoryIds);

                                    fetchTableData(
                                        null,
                                        pagination.pageSize,
                                        pagination.current,
                                        subjectId,
                                        categoryIds.length > 0 ? categoryIds : null
                                    );
                                } else {
                                    setSelectedTreeNode(null);
                                    setCurrentSubjectId(null);
                                    setCurrentCategoryIds([]);
                                    fetchTableData();
                                }
                            }}
                            blockNode
                            showLine
                            style={{ backgroundColor: 'transparent' }}
                        />
                    ) : (
                        <div
                            style={{
                                textAlign: 'center',
                                color: '#86909c',
                                padding: '20px 0',
                                fontSize: '14px',
                            }}
                        >
                            暂无数据
                        </div>
                    )}
                </Spin>
            </div>
        </div>
    );

    return (
        <div className="knowledge-manager">
            <DataManager
                data={tableData}
                loading={tableLoading}
                pagination={pagination}
                onPaginationChange={(p) => {
                    setPagination(p);
                    const values = filterFormRef.current?.getFieldsValue?.() || {};
                    fetchTableData(values, p.pageSize, p.current);
                }}
                actions={{ onAdd: handleAdd }}
                config={{
                    displayMode: 'table',
                    showModeToggle: false,
                    tableColumns: columns,
                    filterContent,
                    showTree: true,
                    treeContent,
                }}
                tableScrollHeight={tableScrollHeight}
            />

            {/* 新增对话框 */}
            <Drawer
                title="新增知识点"
                visible={addModalVisible}
                width={1000}
                onOk={confirmAdd}
                onCancel={() => {
                    setAddModalVisible(false);
                    addFormRef.current?.resetFields();
                }}
            >
                <div style={{ maxHeight: '100vh', overflowY: 'auto', paddingRight: '10px' }}>
                    <Form ref={addFormRef} className="modal-form" layout="vertical">
                                <Form.Item
                                    label="知识点标题"
                                    field="name"
                                    rules={[{ required: true, message: '请输入知识点标题' }]}
                                >
                                    <Input
                                        placeholder="请输入知识点标题"
                                        maxLength={512}
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
                                    label="知识点内容"
                                    field="content"
                                    triggerPropName="initData"
                                    trigger="onChange"
                                    normalize={(value) => {
                                        return value?.editor?.getData?.() || value;
                                    }}
                                    rules={[{ required: true, message: '请输入知识点内容' }]}
                                >
                                    <CKEditor
                                        editorUrl={editorScriptUrl}
                                        config={{
                                            height: 300,
                                            // 允许源码编辑
                                            allowedContent: true,
                                            extraPlugins: 'sourcearea',
                                            versionCheck: false,
                                        }}
                                    />
                                </Form.Item>
                            </Form>
                        </div>
                    </Drawer>
            <Modal
                title="AI 智能润色"
                visible={polishModalVisible}
                onOk={applyPolish}
                onCancel={() => {
                    setPolishModalVisible(false);
                    if (polishEventSourceRef.current) {
                        // @ts-ignore
                        polishEventSourceRef.current.close();
                    }
                }}
                okText="应用"
                cancelText="取消"
                style={{ width: 800 }}
            >
                <div style={{ height: '400px', overflow: 'auto', border: '1px solid #e5e6eb', padding: '10px', borderRadius: '4px', position: 'relative' }}>
                    {polishContent ? (
                        <div dangerouslySetInnerHTML={{ __html: polishContent }} />
                    ) : (
                        <div style={{ textAlign: 'center', marginTop: 150, color: '#86909c' }}>
                            {polishLoading ? 'AI 正在思考中...' : '等待生成...'}
                        </div>
                    )}
                    {polishLoading && (
                        <div style={{ position: 'absolute', right: 10, top: 10 }}>
                            <Spin />
                        </div>
                    )}
                </div>
            </Modal>

            {/* 编辑对话框 */}
            <Drawer
                title="编辑知识点"
                visible={editModalVisible}
                width={1000}
                onCancel={() => {
                    setEditModalVisible(false);
                    editFormRef.current?.resetFields();
                }}
                onOk={confirmEdit}
                afterOpen={() => {
                    if (currentRecord) {
                        editFormRef.current?.setFieldsValue({
                            name: currentRecord.name,
                            categoryId: currentRecord.categoryId,
                            subjectId: currentRecord.subjectId,
                            content: currentRecord.content,
                        });
                        if (currentRecord.subjectId) {
                            fetchCategoriesBySubject(currentRecord.subjectId);
                        }
                        // 等待编辑器实例准备好后设置内容
                        if (editEditorRef.current && currentRecord.content) {
                            setTimeout(() => {
                                editEditorRef.current?.setData(currentRecord.content);
                            }, 100);
                        }
                    }
                }}
            >
                <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
                    <Form ref={editFormRef} className="modal-form" layout="vertical">
                                <Form.Item
                                    label="知识点标题"
                                    field="name"
                                    rules={[{ required: true, message: '请输入知识点标题' }]}
                                >
                                    <Input
                                        placeholder="请输入知识点标题"
                                        maxLength={512}
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
                                    label={
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>知识点内容</span>
                                            <Button
                                                type="text"
                                                size="mini"
                                                style={{ padding: '0 5px' }}
                                                onClick={() => {
                                                    const editor = editEditorRef.current;
                                                    if (editor) {
                                                        handlePolish(editor);
                                                    } else {
                                                        Message.warning('编辑器未初始化');
                                                    }
                                                }}
                                            >
                                                AI 润色
                                            </Button>
                                        </div>
                                    }
                                    field="content"
                                    triggerPropName="initData"
                                    trigger="onChange"
                                    normalize={(value) => {
                                        return value?.editor?.getData?.() || value;
                                    }}
                                    rules={[{ required: true, message: '请输入知识点内容' }]}
                                >
                                    <CKEditor
                                        editorUrl={editorScriptUrl}
                                        onInstanceReady={({ editor }) => {
                                            editEditorRef.current = editor;
                                            if (currentRecord?.content) {
                                                editor.setData(currentRecord.content);
                                            }
                                        }}
                                        config={{
                                            height: 300,
                                            allowedContent: true,
                                            extraPlugins: 'sourcearea',
                                            versionCheck: false,
                                        }}
                                    />
                                </Form.Item>
                            </Form>
                        </div>
                    </Drawer>

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
                footer={null}
                style={{ width: '800px' }}
            >
                {detailRecord && (
                    <div>
                        <h3>{detailRecord.name}</h3>
                        <div style={{ marginBottom: 16 }}>
                            <Space>
                                <span>学科: {detailRecord.subjectName || '--'}</span>
                                <span>分类: {detailRecord.categoryName || '--'}</span>
                                <span>创建时间: {detailRecord.createDate}</span>
                            </Space>
                        </div>
                        <div
                            className="knowledge-content"
                            style={{
                                border: '1px solid #e5e6eb',
                                padding: '16px',
                                borderRadius: '4px',
                                minHeight: '200px',
                                background: '#f7f8fa'
                            }}
                            dangerouslySetInnerHTML={{ __html: detailRecord.content || '暂无内容' }}
                        />
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default KnowledgeManager;
