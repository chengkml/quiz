import React, { useEffect, useRef, useState } from 'react';
import UserAvatar from '@/components/UserAvatar';
import {
    Button,
    Dropdown,
    Drawer,
    Form,
    Input,
    Layout,
    Menu,
    Message,
    Modal,
    Popconfirm,
    Select,
    Space,
    Spin,
    Tag,
    Tooltip,
    Tree,
} from '@arco-design/web-react';
import './style/index.less';
import {
    KnowledgeDto,
    createKnowledge,
    deleteKnowledge,
    getAllCategories,
    getAllSubjects,
    getKnowledgeList,
    getKnowledgeQuestions,
    archiveKnowledge,
    resetKnowledge,
    updateKnowledge,
    streamPolishKnowledgeUrl,
    getSubjectCategoryTree,
    getCategoriesBySubjectId,
    createCategory,
    updateCategory,
    deleteCategory,
} from './api';
import { DataManager } from '../../components/DataManager';
import renderDate from '@/utils/timeUtil';
import { IconArchive, IconDelete, IconEdit, IconList, IconPlus, IconPlayArrow, IconRefresh, IconMoreVertical } from '@arco-design/web-react/icon';
import FilterForm from '@/components/FilterForm';
import { CKEditor } from 'ckeditor4-react';
import { getLLMModelsByType } from '@/services/llmModelService';
import ReviewPage from './Review';

declare const __APP_BASE_PATH__: string;

function KnowledgeManager() {
    const editorScriptUrl = `${(__APP_BASE_PATH__ || '/').replace(/\/$/, '')}/ckeditor/ckeditor.js`;
    const [tableScrollHeight, setTableScrollHeight] = useState(200);
    // 状态管理
    const [tableData, setTableData] = useState<KnowledgeDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);

    // 左侧树相关状态
    const [treeData, setTreeData] = useState([]);
    const [filteredTreeData, setFilteredTreeData] = useState([]);
    const [treeLoading, setTreeLoading] = useState(false);
    const [selectedTreeNode, setSelectedTreeNode] = useState(null);
    const [expandedKeys, setExpandedKeys] = useState([]);
    const [searchKeyword, setSearchKeyword] = useState('');

    const [treeCategoryModalVisible, setTreeCategoryModalVisible] = useState(false);
    const [treeCategoryMode, setTreeCategoryMode] = useState<'create' | 'edit'>('create');
    const [treeCategoryNode, setTreeCategoryNode] = useState<any>(null);
    const [treeCategorySubmitting, setTreeCategorySubmitting] = useState(false);
    const [treeCategoryForm] = Form.useForm();

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
    const [reviewVisible, setReviewVisible] = useState(false);
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
            render: (value, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Button
                        type="text"
                        style={{
                            color: '#4080FF',
                            padding: 0,
                            textDecoration: 'underline',
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDetail(record);
                        }}
                    >
                        {value}
                    </Button>
                    {record.archived && <Tag color="gray">已归档</Tag>}
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
            title: '复习次数',
            dataIndex: 'totalReviewCount',
            width: 100,
            align: 'center'
        },
        {
            title: '创建时间',
            dataIndex: 'createDate',
            width: 170,
            render: (value) => renderDate(value),
        },
        {
            title: '操作',
            width: 200,
            align: 'center',
            fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="编辑">
                        <Button
                            type="text"
                            size="small"
                            icon={<IconEdit />}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(record);
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="重置">
                        <Popconfirm
                            title="确认重置学习状态吗？"
                            onOk={() => handleResetCard(record)}
                            onCancel={(e) => e?.stopPropagation?.()}
                        >
                            <Button
                                type="text"
                                size="small"
                                status="warning"
                                icon={<IconRefresh />}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </Popconfirm>
                    </Tooltip>
                    <Tooltip title={record.archived ? '取消归档' : '归档'}>
                        <Popconfirm
                            title={record.archived ? '确认取消归档吗？' : '确认归档该知识点吗？'}
                            onOk={() => handleArchive(record)}
                            onCancel={(e) => e?.stopPropagation?.()}
                        >
                            <Button
                                type="text"
                                size="small"
                                icon={<IconArchive />}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </Popconfirm>
                    </Tooltip>
                    <Popconfirm
                        title="确认删除该知识点吗？"
                        onOk={() => handleDelete(record)}
                    >
                        <Tooltip title="删除">
                            <Button
                                type="text"
                                size="small"
                                status="danger"
                                icon={<IconDelete />}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </Tooltip>
                    </Popconfirm>
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

    const handleReviewOpen = () => {
        setReviewVisible(true);
    };

    const handleReviewClose = () => {
        setReviewVisible(false);
        const values = filterFormRef.current?.getFieldsValue?.() || {};
        fetchTableData(values, pagination.pageSize, pagination.current);
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

    const handleArchive = async (record) => {
        try {
            await archiveKnowledge(record.id, !record.archived);
            Message.success(record.archived ? '已取消归档' : '已归档');
            const values = filterFormRef.current?.getFieldsValue?.() || {};
            fetchTableData(values, pagination.pageSize, pagination.current);
        } catch (error: any) {
            Message.error(error.response?.data?.message || '操作失败');
        }
    };

    const handleResetCard = async (record) => {
        try {
            await resetKnowledge(record.id);
            Message.success('重置成功');
            const values = filterFormRef.current?.getFieldsValue?.() || {};
            fetchTableData(values, pagination.pageSize, pagination.current);
        } catch (error: any) {
            Message.error(error.response?.data?.message || '重置失败');
        }
    };

    // AI 润色相关
    const [polishModalVisible, setPolishModalVisible] = useState(false);
    const [polishContent, setPolishContent] = useState('');
    const [polishLoading, setPolishLoading] = useState(false);
    const polishEventSourceRef = useRef(null);
    const [targetEditor, setTargetEditor] = useState(null);
    const [models, setModels] = useState<any[]>([]);
    const [modelsLoading, setModelsLoading] = useState(false);
    const [currentModel, setCurrentModel] = useState('');

    // CKEditor 工具栏配置
    const editorToolbarConfig = [
        { name: 'document', items: ['Source', '-', 'Preview', '-', 'Templates'] },
        { name: 'clipboard', items: ['Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo'] },
        { name: 'editing', items: ['Find', 'Replace', '-', 'SelectAll'] },
        '/',
        { name: 'basicstyles', items: ['Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'RemoveFormat'] },
        { name: 'paragraph', items: ['NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock'] },
        { name: 'links', items: ['Link', 'Unlink'] },
        { name: 'insert', items: ['Image', 'Table', 'HorizontalRule', 'SpecialChar'] },
        '/',
        { name: 'styles', items: ['Styles', 'Format', 'Font', 'FontSize'] },
        { name: 'colors', items: ['TextColor', 'BGColor'] },
        { name: 'tools', items: ['Maximize', 'ShowBlocks', 'AiPolish'] } // 显式添加 AiPolish 按钮
    ];

    // 注册 CKEditor 插件
    const handleNamespaceLoaded = (CKEDITOR) => {
        if (!CKEDITOR.plugins.get('aiPolish')) {
            CKEDITOR.plugins.add('aiPolish', {
                init: function (editor) {
                    editor.addCommand('aiPolish', {
                        exec: function (editor) {
                            editor.fire('aiPolishEvent');
                        }
                    });
                    editor.ui.addButton('AiPolish', {
                        label: 'AI 智能润色',
                        command: 'aiPolish',
                        // toolbar property removed as we are using explicit toolbar config
                    });
                    
                    // 注入图标样式
                    const style = document.createElement('style');
                    style.innerHTML = `
                        .cke_button__aipolish_icon {
                            background-image: url("data:image/svg+xml;charset=utf-8;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEyIDRMMTAuMzg1MiA5LjYxNDgxTDQuOCAxMi40TDEwLjM4NTIgMTUuMTg1MkwxMiAyMC44TDEzLjYxNDggMTUuMTg1MkwxOS4yIDEyLjRMMTMuNjE0OCA5LjYxNDgxTDEyIDRaIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTUgMkw0LjIzNTggMy41MjgzTDIsNC42TDQuMjM1OCA1LjY3MTdMNSA3.2TDUuNzY0MiA1LjY3MTdMNyw0LjZMNS43NjQyIDMuNTI4M0w1IDJaIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJNMTkgMTdMMTguMjM1OCAxOC41MjgzTDE2LDE5LjZMMTguMjM1OCAyMC42NzE3TDE5IDIyLjJMMTkuNzY0MiAyMC42NzE3TDIyLDE5LjZMMTkuNzY0MiAxOC41MjgzTDE5IDE3WiIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+") !important;
                            background-size: 16px !important;
                            background-repeat: no-repeat;
                            background-position: center;
                        }
                    `;
                    document.head.appendChild(style);
                }
            });
        }
    };

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

        const url = streamPolishKnowledgeUrl(content, currentModel || undefined);
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
            const response = await getCategoriesBySubjectId(subjectId);
            const list = response.data?.content || [];
            setCategories(list.map((item: any) => ({
                label: item.name,
                value: item.id,
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
                const buildCategoryTreeWithSubjectId = (list = [], subjectId, subjectName, level = 2) => {
                    return list.map((item) => ({
                        key: item.id,
                        title: item.name,
                        id: item.id,
                        name: item.name,
                        description: item.description,
                        parentId: item.parentId,
                        subjectId, // ✅ 关键：记录所属学科ID
                        subjectName,
                        level,
                        children: item.children
                            ? buildCategoryTreeWithSubjectId(item.children, subjectId, subjectName, level + 1)
                            : [],
                    }));
                };

                const transformData = res.data.map((subject) => ({
                    key: subject.id,
                    title: subject.name,
                    id: subject.id,
                    name: subject.name,
                    subjectId: subject.id, // 学科节点自身也带 subjectId
                    subjectName: subject.name,
                    level: 1,
                    children: buildCategoryTreeWithSubjectId(subject.categories || [], subject.id, subject.name, 2),
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

    const loadModels = async () => {
        setModelsLoading(true);
        try {
            const res = await getLLMModelsByType('TEXT');
            if (res.data && Array.isArray(res.data)) {
                setModels(res.data);
                const defaultModel = res.data.find((m: any) => m.isDefault === '1' || m.isDefault === 1);
                if (defaultModel) setCurrentModel(defaultModel.name);
                else if (res.data.length > 0) setCurrentModel(res.data[0].name);
            }
        } catch (error) {
            console.error('获取模型列表失败:', error);
            Message.error('获取模型列表失败');
        } finally {
            setModelsLoading(false);
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

    const handleTreeCategoryCreate = (node) => {
        const nodeData = node?.props || node;
        setTreeCategoryMode('create');
        setTreeCategoryNode(nodeData);
        treeCategoryForm.setFieldsValue({
            name: '',
            description: '',
        });
        setTreeCategoryModalVisible(true);
    };

    const handleTreeCategoryEdit = (node) => {
        const nodeData = node?.props || node;
        setTreeCategoryMode('edit');
        setTreeCategoryNode(nodeData);
        treeCategoryForm.setFieldsValue({
            name: nodeData.title,
            description: nodeData.description || '',
        });
        setTreeCategoryModalVisible(true);
    };

    const handleTreeCategoryDelete = (node) => {
        const nodeData = node?.props || node;
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除分类 "${nodeData.title}" 吗？`,
            onOk: async () => {
                try {
                    await deleteCategory(nodeData.id || nodeData.key);
                    Message.success('删除成功');
                    setSelectedTreeNode(null);
                    setCurrentCategoryIds([]);
                    fetchSubjectCategoryTree();
                    if (currentSubjectId) {
                        fetchCategoriesBySubject(currentSubjectId);
                    }
                    fetchTableData();
                } catch (error: any) {
                    Message.error(error.response?.data?.message || '删除失败');
                }
            },
        });
    };

    const handleTreeCategorySubmit = async () => {
        try {
            const values = await treeCategoryForm.validate();
            setTreeCategorySubmitting(true);

            if (treeCategoryMode === 'create') {
                await createCategory({
                    name: values.name,
                    description: values.description,
                    subjectId: treeCategoryNode?.subjectId,
                    parentId: treeCategoryNode?.id || treeCategoryNode?.key,
                });
                Message.success('分类创建成功');
            } else {
                await updateCategory({
                    id: treeCategoryNode?.id || treeCategoryNode?.key,
                    name: values.name,
                    description: values.description,
                    subjectId: treeCategoryNode?.subjectId,
                    parentId: treeCategoryNode?.parentId,
                });
                Message.success('分类更新成功');
            }

            setTreeCategoryModalVisible(false);
            fetchSubjectCategoryTree();
            if (currentSubjectId) {
                fetchCategoriesBySubject(currentSubjectId);
            }
        } catch (error: any) {
            if (error?.errorFields) {
                return;
            }
            Message.error(error.response?.data?.message || '操作失败');
        } finally {
            setTreeCategorySubmitting(false);
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
        loadModels();

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
                            renderExtra={(node) => {
                                const nodeData = node?.props || node;
                                console.log('renderExtra called:', nodeData?.title, 'level:', nodeData?.level, 'nodeData:', nodeData);
                                
                                // 只有分类节点（level >= 2）才显示操作
                                if (!nodeData || nodeData.level < 2) {
                                    return null;
                                }
                                
                                return (
                                    <Dropdown
                                        trigger="click"
                                        droplist={(
                                            <Menu>
                                                <Menu.Item
                                                    key="add"
                                                    onClick={(event) => {
                                                        event?.stopPropagation?.();
                                                        handleTreeCategoryCreate(node);
                                                    }}
                                                >
                                                    <IconPlus style={{ marginRight: 8 }} />新增子分类
                                                </Menu.Item>
                                                <Menu.Item
                                                    key="edit"
                                                    onClick={(event) => {
                                                        event?.stopPropagation?.();
                                                        handleTreeCategoryEdit(node);
                                                    }}
                                                >
                                                    <IconEdit style={{ marginRight: 8 }} />编辑
                                                </Menu.Item>
                                                <Menu.Item
                                                    key="delete"
                                                    onClick={(event) => {
                                                        event?.stopPropagation?.();
                                                        handleTreeCategoryDelete(node);
                                                    }}
                                                >
                                                    <IconDelete style={{ marginRight: 8 }} />删除
                                                </Menu.Item>
                                            </Menu>
                                        )}
                                    >
                                        <span
                                            className="knowledge-tree-actions"
                                            onClick={(event) => event.stopPropagation()}
                                        >
                                            <IconMoreVertical />
                                        </span>
                                    </Dropdown>
                                );
                            }}
                            blockNode
                            showLine
                            className="knowledge-tree"
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
                actionButtons={(
                    <Button type="primary" icon={<IconPlayArrow />} onClick={handleReviewOpen}>
                        复习
                    </Button>
                )}
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

            <Modal
                title={treeCategoryMode === 'create' ? '新增子分类' : '编辑分类'}
                visible={treeCategoryModalVisible}
                onOk={handleTreeCategorySubmit}
                onCancel={() => setTreeCategoryModalVisible(false)}
                confirmLoading={treeCategorySubmitting}
            >
                <Form form={treeCategoryForm} layout="vertical">
                    <Form.Item label="所属学科">
                        <Input value={treeCategoryNode?.subjectName || ''} disabled />
                    </Form.Item>
                    <Form.Item label="父分类">
                        <Input value={treeCategoryNode?.title || ''} disabled />
                    </Form.Item>
                    <Form.Item
                        label="分类名称"
                        field="name"
                        rules={[{ required: true, message: '请输入分类名称' }, { maxLength: 50, message: '分类名称不能超过50个字符' }]}
                    >
                        <Input placeholder="请输入分类名称" />
                    </Form.Item>
                    <Form.Item
                        label="分类描述"
                        field="description"
                        rules={[{ maxLength: 200, message: '描述不能超过200个字符' }]}
                    >
                        <Input.TextArea rows={3} placeholder="请输入分类描述（可选）" />
                    </Form.Item>
                </Form>
            </Modal>

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
                                        onNamespaceLoaded={handleNamespaceLoaded}
                                        onInstanceReady={({ editor }) => {
                                            addEditorRef.current = editor;
                                            editor.on('aiPolishEvent', () => handlePolish(editor));
                                        }}
                                        config={{
                                            height: 300,
                                            // 允许源码编辑
                                            allowedContent: true,
                                            extraPlugins: 'sourcearea,aiPolish',
                                            versionCheck: false,
                                            toolbar: editorToolbarConfig
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
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600 }}>模型</span>
                    <Select
                        placeholder="选择模型"
                        style={{ minWidth: 240 }}
                        loading={modelsLoading}
                        value={currentModel || undefined}
                        allowClear
                        onChange={(value) => setCurrentModel(value)}
                        options={models.map((model: any) => ({
                            label: model.name,
                            value: model.name,
                        }))}
                    />
                </div>
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
                <div style={{ maxHeight: '100vh', overflowY: 'auto', paddingRight: '10px' }}>
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
                                        onNamespaceLoaded={handleNamespaceLoaded}
                                        onInstanceReady={({ editor }) => {
                                            editEditorRef.current = editor;
                                            editor.on('aiPolishEvent', () => handlePolish(editor));
                                            if (currentRecord?.content) {
                                                editor.setData(currentRecord.content);
                                            }
                                        }}
                                        config={{
                                            height: 300,
                                            allowedContent: true,
                                            extraPlugins: 'sourcearea,aiPolish',
                                            versionCheck: false,
                                            toolbar: editorToolbarConfig
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

            {/* 详情抽屉 */}
            <Drawer
                title="知识点详情"
                visible={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={null}
                width={800}
            >
                {detailRecord && (
                    <div>
                        <h3 style={{ marginBottom: 16, fontSize: '18px', fontWeight: 'bold' }}>
                            {detailRecord.name}
                        </h3>
                        <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #e5e6eb' }}>
                            <Space size="large">
                                <span>学科: <strong>{detailRecord.subjectName || '--'}</strong></span>
                                <span>分类: <strong>{detailRecord.categoryName || '--'}</strong></span>
                                <span>创建时间: <strong>{renderDate(detailRecord.createDate)}</strong></span>
                            </Space>
                        </div>
                        <div
                            className="knowledge-content"
                            style={{
                                border: '1px solid #e5e6eb',
                                padding: '16px',
                                borderRadius: '4px',
                                minHeight: '400px',
                                background: '#f7f8fa',
                                lineHeight: '1.6'
                            }}
                            dangerouslySetInnerHTML={{ __html: detailRecord.content || '暂无内容' }}
                        />
                    </div>
                )}
            </Drawer>

            <Drawer
                title="知识点复习"
                visible={reviewVisible}
                width={980}
                onCancel={handleReviewClose}
                footer={null}
                className="review-drawer"
                bodyStyle={{ padding: 0, overflow: 'hidden' }}
            >
                <ReviewPage embedded onExit={handleReviewClose} />
            </Drawer>
        </div>
    );
}

export default KnowledgeManager;
