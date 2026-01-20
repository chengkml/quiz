import React, {useEffect, useRef, useState} from 'react';
import UserAvatar from '@/components/UserAvatar';
import {
    Button,
    Cascader,
    Checkbox,
    Collapse,
    Dropdown,
    Form,
    Input,
    InputNumber,
    Menu,
    Message,
    Modal,
    Select,
    Spin,
    Tag,
    Tooltip,
    Tree,
} from '@arco-design/web-react';
import './style/index.less';
import {
    associateKnowledge,
    batchCreateQuestion,
    deleteQuestion,
    generateQuestionsStreamUrl,
    getAllSubjects,
    getCategoriesBySubjectId,
    getQuestionList,
    getSubjectCategoryTree,
    getModelsByType,
    updateQuestion,
} from './api';
import {IconDelete, IconEdit, IconEye, IconList} from '@arco-design/web-react/icon';
import DynamicQuestionForm from '@/components/DynamicQuestionForm';
import { DataManager } from '../../components/DataManager';
import {createKnowledge} from '../Knowledge/api';
import renderDate from "@/utils/timeUtil";
import FilterForm from '@/components/FilterForm';
import { FormFieldConfig } from '@/components/types/types';

const {TextArea} = Input;

function QuestionManager() {
    // 状态管理
    const [tableData, setTableData] = useState<any[]>([]);
    const [tableLoading, setTableLoading] = useState(false);
    const [tableScrollHeight, setTableScrollHeight] = useState(200);

    // 对话框状态
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [generateModalVisible, setGenerateModalVisible] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<any>(null);

    // AI生成题目相关状态
    const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
    const [selectedQuestions, setSelectedQuestions] = useState<any[]>([]);
    const [showGeneratedQuestions, setShowGeneratedQuestions] = useState(false);
    const [generateLoading, setGenerateLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [knowledge, setKnowledge] = useState('');
    const [knowledgeDescrDisabled, setKnowledgeDescrDisabled] = useState(false);
    const [editKnowledgeDescrDisabled, setEditKnowledgeDescrDisabled] = useState(false);
    // 文本模型列表（用于AI生成题目时选择模型）
    const [textModels, setTextModels] = useState<any[]>([]);
    const [modelsLoading, setModelsLoading] = useState(false);
    // 流式生成过程中的内容展示
    const [streamingContent, setStreamingContent] = useState('');
    const [isStreamingComplete, setIsStreamingComplete] = useState(false);
    // 控制生成日志是否在题目展示时可见（默认展示，生成结束后自动隐藏）
    const [showStreamLogVisible, setShowStreamLogVisible] = useState(true);
    // 回看日志的弹窗
    const [streamLogModalVisible, setStreamLogModalVisible] = useState(false);
    // 标记是否已收到第一条SSE消息（用于显示初始loading）
    const [sseFirstMessageReceived, setSseFirstMessageReceived] = useState(false);
    const streamingContainerRef = useRef<HTMLDivElement | null>(null);
    const generatedListRef = useRef<HTMLDivElement | null>(null);

    // 当流式内容更新时，自动滚动到底部
    useEffect(() => {
        if (streamingContainerRef.current) {
            // 等待 DOM 更新
            setTimeout(() => {
                try {
                    streamingContainerRef.current!.scrollTop = streamingContainerRef.current!.scrollHeight;
                } catch (e) {
                    // ignore
                }
            }, 0);
        }
    }, [streamingContent]);

    // 转义 HTML，防止注入；并将换行转为 <br/>
    const escapeHtml = (unsafe: string) => {
        if (!unsafe) return '';
        return unsafe.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    const formatDataToHtml = (data: string) => {
        if (!data) return '';
        const trimmed = data.trim();
        if (trimmed.startsWith('[RETRY]')) {
            // 用红色强调重试起始信息
            const rest = trimmed.substring('[RETRY]'.length);
            const html = '<span style="color:var(--color-danger-6);font-weight:600">' + escapeHtml('[RETRY]' + rest) + '</span>';
            // 保留原始换行
            return html + '<br/>';
        }
        // 普通流式内容，转义并保留换行
        return escapeHtml(data).replace(/\n/g, '<br/>');
    };

    // 当生成的题目列表更新时，自动滚动列表到底部
    useEffect(() => {
        if (generatedListRef.current) {
            setTimeout(() => {
                try {
                    generatedListRef.current!.scrollTop = generatedListRef.current!.scrollHeight;
                } catch (e) {
                    // ignore
                }
            }, 0);
        }
    }, [generatedQuestions]);

    // 当流式解析阶段完成并且已收到至少一道题目时，自动隐藏生成日志
    useEffect(() => {
        if (isStreamingComplete && generatedQuestions && generatedQuestions.length > 0) {
            setShowStreamLogVisible(false);
        }
    }, [isStreamingComplete, generatedQuestions]);

    // 查看详情相关状态
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [detailRecord, setDetailRecord] = useState<any>(null);

    // 学科和分类相关状态
    const [subjects, setSubjects] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [subjectsLoading, setSubjectsLoading] = useState(false);
    // 知识点下拉选项（按学科/分类过滤）
    const [categoriesLoading, setCategoriesLoading] = useState(false);

    // 左侧树相关状态
    const [treeData, setTreeData] = useState<any[]>([]);
    const [filteredTreeData, setFilteredTreeData] = useState<any[]>([]);
    const [treeLoading, setTreeLoading] = useState(false);
    const [selectedTreeNode, setSelectedTreeNode] = useState<any>(null);
    const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
    const [searchKeyword, setSearchKeyword] = useState('');

    const [currentTreeNode, setCurrentTreeNode] = useState<any>(null);

    // AI生成时选择的学科和分类信息
    const [selectedSubjectForGenerate, setSelectedSubjectForGenerate] = useState<any>(null);
    const [selectedCategoryForGenerate, setSelectedCategoryForGenerate] = useState<any>(null);

    // 表单引用
    const filterFormRef = useRef<any>();
    const editFormRef = useRef<any>();
    const generateFormRef = useRef<any>();
    const generateEventSourceRef = useRef<EventSource | null>(null);
    // 缓存流式生成过程中的最后一次错误（中间重试不直接展示）
    const lastStreamErrorRef = useRef<string | null>(null);
    // 标记是否至少收到过一道解析成功的题目
    const hasReceivedQuestionRef = useRef<boolean>(false);

    // 动态表单数据状态
    const [editDynamicFormData, setEditDynamicFormData] = useState({options: {}, answer: {}});
    const [editQuestionType, setEditQuestionType] = useState('');

    // 分页配置
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0,
        showTotal: true,
        showJumper: true,
        showPageSize: true,
    });

    // 题目类型选项
    const questionTypeOptions = [
        {label: '单选题', value: 'SINGLE'},
        {label: '多选题', value: 'MULTIPLE'},
    ];

    // 表格列配置
    const columns = [
        {
            title: '题目类型',
            dataIndex: 'type',
            width: 100,
            render: (value) => {
                const typeMap = {
                    'SINGLE': '单选题',
                    'MULTIPLE': '多选题'
                };
                return <Tag color="blue" bordered>{typeMap[value] || value}</Tag>;
            },
        },
        {
            title: '题干内容',
            dataIndex: 'content',
            minWidth: 300,
            ellipsis: true,
        },
        {
            title: '创建人',
            dataIndex: 'createUserName',
            width: 120,
            ellipsis: true,
            render: (name, record) => (
                <UserAvatar name={name || (record?.createUser ?? '')} showName />
            ),
        },
        {
            title: '创建时间',
            dataIndex: 'createDate',
            width: 170,
            render: (value) => {
                return renderDate(value);
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
                                详情
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
    const fetchTableData = async (inParams, inPageSize, inPageNum , inSubjectId , inCategoryIds) => {
        const params = inParams || filterFormRef.current?.getFilterValues?.() || {};
        const pageSize = inPageSize || pagination.pageSize;
        const pageNum = inPageNum || pagination.current;
        const subjectId = inSubjectId || currentTreeNode?.subjectId;
        const categoryIds = inCategoryIds || currentTreeNode?.categoryIds;
        setTableLoading(true);
        try {
            const targetParams = {
                ...params,
                subjectId,
                categoryIds,
                pageNum: pageNum - 1,
                pageSize: pageSize,
            };

            const response = await getQuestionList(targetParams);
            if (response.data) {
                if (response.data.content.length === 0 && response.data.totalElements > 0) {
                    fetchTableData(inParams, inPageSize, 1 , inSubjectId , inCategoryIds);
                } else {
                    setTableData(response.data.content || []);
                    setPagination(prev => ({
                        ...prev,
                        current: pageNum,
                        pageSize,
                        total: response.data.totalElements || 0,
                    }));
                }
            }
        } catch (error) {
            Message.error('获取题目数据失败');
        } finally {
            setTableLoading(false);
        }
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

    // 处理AI生成题目
    const handleGenerate = () => {
        setGenerateModalVisible(true);
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

    // 初始化数据
    useEffect(() => {
        fetchTableData({}, 20, 1);
        fetchSubjects();
        fetchSubjectCategoryTree();
    }, []);

    // 组件卸载时关闭可能未关闭的 SSE 连接
    useEffect(() => {
        return () => {
            if (generateEventSourceRef.current) {
                try {
                    generateEventSourceRef.current.close();
                } catch (e) {
                    // ignore
                }
                generateEventSourceRef.current = null;
            }
        };
    }, []);

    const fetchSubjectCategoryTree = async () => {
        try {
            setTreeLoading(true);
            const response = await getSubjectCategoryTree();
            if (response.data) {
                // 递归转换分类数据为Tree组件需要的格式
                const convertCategoriesToTreeNodes = (categories) => {
                    if (!categories || !Array.isArray(categories)) return [];
                    return categories.map(category => ({
                        key: category.id,
                        title: category.name,
                        subjectId: category.subjectId,
                        categoryId: category.id,
                        children: convertCategoriesToTreeNodes(category.children)
                    }));
                };
                const treeData = response.data.map(subject => ({
                    key: subject.id,
                    title: subject.name,
                    subjectId: subject.id,
                    categoryId: null,
                    children: convertCategoriesToTreeNodes(subject.categories)
                }));
                setTreeData(treeData);
                setFilteredTreeData(treeData);
                setExpandedKeys(treeData.map(item => item.key));
            }
        } catch (error) {
            console.error('获取学科分类树失败:', error);
            Message.error('获取学科分类树失败');
        } finally {
            setTreeLoading(false);
        }
    };

    // 搜索过滤树数据
    const filterTreeData = (data, keyword) => {
        if (!keyword) return data;

        const filterNode = (node) => {
            const titleMatch = node.title.toLowerCase().includes(keyword.toLowerCase());
            const filteredChildren = node.children ? node.children.map(filterNode).filter(Boolean) : [];

            if (titleMatch || filteredChildren.length > 0) {
                return {
                    ...node,
                    children: filteredChildren
                };
            }
            return null;
        };

        return data.map(filterNode).filter(Boolean);
    };

    // 处理搜索输入变化
    const handleSearchChange = (value) => {
        setSearchKeyword(value);
        const filtered = filterTreeData(treeData, value);
        setFilteredTreeData(filtered);

        // 如果有搜索关键字，展开所有匹配的节点
        if (value) {
            const getAllKeys = (nodes) => {
                let keys = [];
                nodes.forEach(node => {
                    keys.push(node.key);
                    if (node.children && node.children.length > 0) {
                        keys = keys.concat(getAllKeys(node.children));
                    }
                });
                return keys;
            };
            setExpandedKeys(getAllKeys(filtered));
        } else {
            // 没有搜索关键字时，只展开第一级
            setExpandedKeys(treeData.map(item => item.key));
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

    // 获取文本模型列表（返回原始模型对象数组）
    const fetchTextModels = async () => {
        try {
            setModelsLoading(true);
            const resp = await getModelsByType('TEXT');
            const list = resp?.data || [];
            setTextModels(list);
            return list;
        } catch (e) {
            console.error('获取文本模型列表失败', e);
            setTextModels([]);
            return [];
        } finally {
            setModelsLoading(false);
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
                const flatList = response.data;

                // 构建树形结构
                const idMap = {};
                const tree = [];

                // 先构造映射
                flatList.forEach(item => {
                    idMap[item.id] = {
                        label: item.name,
                        value: item.id,
                        parentId: item.parentId,
                        children: []
                    };
                });

                // 组装 parent -> children
                flatList.forEach(item => {
                    const node = idMap[item.id];
                    if (item.parentId && idMap[item.parentId]) {
                        idMap[item.parentId].children.push(node);
                    } else {
                        // parentId 为 null 或未找到父节点 → 顶级节点
                        tree.push(node);
                    }
                });

                if (generateFormRef.current && currentTreeNode && currentTreeNode.categoryId) {
                    const path = findPathById(tree, currentTreeNode.categoryId);
                    if (path) {
                        generateFormRef.current.setFieldValue('categoryIds', path);
                    }
                }

                if (editFormRef.current && currentRecord && currentRecord.categoryId) {
                    const path = findPathById(tree, currentRecord.categoryId);
                    if (path) {
                        editFormRef.current.setFieldValue('categoryIds', path);
                    }
                }

                setCategories(tree);
            }
        } catch (error) {
            console.error('获取分类列表失败:', error);
            Message.error('获取分类列表失败');
            setCategories([]);
        } finally {
            setCategoriesLoading(false);
        }
    };


    // 监听窗口大小变化，动态调整表格高度
    useEffect(() => {
        const calculateTableHeight = () => {
            const windowHeight = window.innerHeight;
            const otherElementsHeight = 330; // 与待办页面一致的占位高度
            const newHeight = Math.max(100, windowHeight - otherElementsHeight);
            setTableScrollHeight((prev) => (prev === newHeight ? prev : newHeight));
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

    // 提交编辑表单
    const handleEditSubmit = async (values) => {
        try {
            // 将动态表单数据转换为JSON格式
            const submitData = {
                ...values,
                id: currentRecord.id,
                options: Object.keys(editDynamicFormData.options).length > 0
                    ? JSON.stringify(editDynamicFormData.options)
                    : null,
                answer: editDynamicFormData.answer
                    ? JSON.stringify(editDynamicFormData.answer)
                    : null
            };
            submitData.categoryId = submitData.categoryIds[submitData.categoryIds.length - 1];
            delete submitData.categoryIds;

            await updateQuestion(submitData);
            // 编辑后处理知识点关联：优先使用选择的知识点，其次使用输入的知识点
            try {
                if (values?.knowledgeId) {
                    await associateKnowledge({questionId: currentRecord.id, knowledgeIds: [values.knowledgeId]});
                } else if (values?.knowledge && values?.subjectId && values?.categoryId) {
                    // 创建新知识点再关联
                    const createResp = await createKnowledge({
                        name: values.knowledge,
                        description: values.knowledge,
                        subjectId: values.subjectId,
                        categoryId: values.categoryId,

                    });
                    const newKnowledgeId = createResp?.data?.id || createResp?.id;
                    if (newKnowledgeId) {
                        await associateKnowledge({questionId: currentRecord.id, knowledgeIds: [newKnowledgeId]});
                    }
                }
            } catch (e) {
                console.error('编辑关联知识点失败', e);
            }
            Message.success('编辑成功');
            setEditModalVisible(false);
            editFormRef.current?.resetFields();
            setEditDynamicFormData({options: {}, answer: {}});
            setEditQuestionType('');
            fetchTableData();
        } catch (error) {
            Message.error('编辑失败');
        }
    };

    const findPathById = (tree, targetId, path = []) => {
        for (const node of tree) {
            const newPath = [...path, node.value];
            if (node.value === targetId) {
                return newPath;
            }
            if (node.children) {
                const result = findPathById(node.children, targetId, newPath);
                if (result) return result;
            }
        }
        return null;
    };


    // 确认删除
    const handleDeleteConfirm = async () => {
        try {
            await deleteQuestion(currentRecord.id);
            Message.success('删除成功');
            setDeleteModalVisible(false);
            fetchTableData();
        } catch (error) {
            Message.error('删除失败');
        }
    };

    // 提交AI生成表单
    const handleGenerateSubmit = async (values) => {
        setGenerateLoading(true);
        try {
            values.categoryId = values.categoryIds[values.categoryIds.length - 1];
            delete values.categoryIds;
            // 保存生成时选择的学科和分类信息
            setSelectedSubjectForGenerate(values.subjectId);
            setSelectedCategoryForGenerate(values.categoryId);

            // 清空之前的生成结果
            setGeneratedQuestions([]);
            setSelectedQuestions([]);
            setStreamingContent('');
            setIsStreamingComplete(false);
            setSseFirstMessageReceived(false);

            // 构造 SSE URL 并建立连接
            const url = generateQuestionsStreamUrl(values);
            if (generateEventSourceRef.current) {
                generateEventSourceRef.current.close();
                generateEventSourceRef.current = null;
            }
            const es = new EventSource(url);
            generateEventSourceRef.current = es;

            let isParsingResult = false; // 标记是否开始解析最终结果
            let parseResultBuffer = ''; // 缓冲区，用于处理可能分散的 [PARSE_RESULT] 分隔符

            // 重置本次生成的临时状态
            lastStreamErrorRef.current = null;
            hasReceivedQuestionRef.current = false;
            // 生成开始时强制显示日志区
            setShowStreamLogVisible(true);
            setStreamLogModalVisible(false);

            es.onmessage = (event) => {
                const data = event.data;
                
                // 标记已收到第一条消息
                if (!sseFirstMessageReceived) {
                    setSseFirstMessageReceived(true);
                }

                // 如果还未进入解析阶段，检查是否收到分隔符
                if (!isParsingResult) {
                    // 检查是否包含 [PARSE_RESULT]
                    if (data.includes('[PARSE_RESULT]')) {
                        isParsingResult = true;
                        setIsStreamingComplete(true); // 标记流式内容已完成，开始接收解析结果
                        // 如果分隔符后还有内容，则该内容为题目数据
                        const parseIndex = data.indexOf('[PARSE_RESULT]');
                        const afterSeparator = data.substring(parseIndex + '[PARSE_RESULT]'.length).trim();
                        if (afterSeparator && afterSeparator.startsWith('[QUESTION]')) {
                            // 处理该题目数据
                            const jsonStr = afterSeparator.substring('[QUESTION]'.length);
                            if (jsonStr) {
                                try {
                                    const item = JSON.parse(jsonStr);
                                    // 记录已成功接收到题目，供最终错误判断使用
                                    hasReceivedQuestionRef.current = true;
                                    setGeneratedQuestions(prev => [...prev, item]);
                                } catch (e) {
                                    console.error('Failed to parse question JSON:', jsonStr, e);
                                }
                            }
                        }
                        return;
                    } else {
                            // 在解析前，接收的是流式内容（token 级别），实时累积显示
                            setStreamingContent(prev => prev + formatDataToHtml(data));
                    }
                } else {
                    // 已进入解析阶段，接收 [QUESTION]... 格式的完整题目对象
                    const trimmedData = data.trim();
                        if (trimmedData) {
                        if (trimmedData.startsWith('[QUESTION]')) {
                            const jsonStr = trimmedData.substring('[QUESTION]'.length);
                            try {
                                const item = JSON.parse(jsonStr);
                                // 记录已成功接收到题目，供错误展示判断使用
                                hasReceivedQuestionRef.current = true;
                                setGeneratedQuestions(prev => [...prev, item]);
                            } catch (e) {
                                console.error('Failed to parse question JSON:', jsonStr, e);
                            }
                        } else if (trimmedData.startsWith('[ERROR]')) {
                            // 缓存错误信息，但不在中间重试阶段展示；仅在最终失败时展示
                            const errorMsg = trimmedData.substring('[ERROR]'.length);
                            console.error('Backend error (buffered):', errorMsg);
                            lastStreamErrorRef.current = errorMsg;
                        }
                    }
                }
            };

            es.onerror = (err) => {
                console.error('SSE error:', err);
                // 连接错误或服务端结束时关闭连接
                try {
                    es.close();
                } catch (e) {
                    // ignore
                }
                generateEventSourceRef.current = null;

                // 只有在未成功接收到任何题目时，才展示最终失败信息
                setTimeout(() => {
                    if (!hasReceivedQuestionRef.current) {
                        const finalMsg = lastStreamErrorRef.current ? ('生成失败: ' + lastStreamErrorRef.current) : '生成题目失败';
                        Message.error(finalMsg);
                    }
                }, 50);
            };

            setShowGeneratedQuestions(true);
            setGenerateModalVisible(false);
            generateFormRef.current?.resetFields();
        } catch (error) {
            Message.error('生成题目失败');
            if (generateEventSourceRef.current) {
                generateEventSourceRef.current.close();
                generateEventSourceRef.current = null;
            }
        } finally {
            setGenerateLoading(false);
        }
    };

    // 解析非JSON格式的选项字符串，如：
    // "A.读（r）权限;B.写（w）权限;C.执行（x）权限;D.读和执行（rx）权限"
    // 返回：{ A: '读（r）权限', B: '写（w）权限', C: '执行（x）权限', D: '读和执行（rx）权限' }
    const parseOptionsText = (text: string): Record<string, string> => {
        if (!text || typeof text !== 'string') return {};
        const result: Record<string, string> = {};
        // 按中文/英文分号或换行切分
        const segments = text.split(/[；;\n]+/).map(s => s.trim()).filter(Boolean);
        segments.forEach(seg => {
            // 匹配形如 "A. 内容"、"B: 内容"、"C、内容" 等
            const match = seg.match(/^\s*([A-Z])\s*[\.\u3002、:：]?\s*(.+)$/);
            if (match) {
                const key = match[1].toUpperCase();
                const value = match[2].trim();
                if (key) {
                    result[key] = value;
                }
            }
        });
        return result;
    };

    // 处理编辑表单题目类型变化
    const handleEditTypeChange = (type) => {
        setEditQuestionType(type);
        setEditDynamicFormData({options: {}, answer: {}});
    };

    // 处理生成题目的选择
    const handleQuestionSelect = (questionId, checked) => {
        if (checked) {
            setSelectedQuestions([...selectedQuestions, questionId]);
        } else {
            setSelectedQuestions(selectedQuestions.filter(id => id !== questionId));
        }
    };

    // 全选/取消全选生成的题目
    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedQuestions(generatedQuestions.map((_, index) => index));
        } else {
            setSelectedQuestions([]);
        }
    };

    // 批量保存选中的题目
    const handleSaveSelectedQuestions = async () => {
        if (selectedQuestions.length === 0) {
            Message.warning('请至少选择一道题目');
            return;
        }

        setSaveLoading(true);
        try {
            // 使用状态中保存的学科和分类信息
            const subjectId = selectedSubjectForGenerate;
            const categoryId = selectedCategoryForGenerate;

            const questionsToSave = selectedQuestions.map(index => {
                const question = generatedQuestions[index];
                return {
                    ...question,
                    // 添加学科和分类信息
                    subjectId: subjectId,
                    categoryId: categoryId,
                    // 对于AI生成的题目，options和answer已经是正确格式，不需要再次JSON.stringify
                    options: question.options || null,
                    answer: question.answer || null,
                    knowledge: knowledge
                };
            });

            // 使用批量创建接口
            await batchCreateQuestion(questionsToSave);
            Message.success(`成功保存${selectedQuestions.length}道题目`);

            // 重置状态
            setGeneratedQuestions([]);
            setSelectedQuestions([]);
            setShowGeneratedQuestions(false);
            setSelectedSubjectForGenerate(null);
            setSelectedCategoryForGenerate(null);

            // 刷新表格数据
            fetchTableData();
        } catch (error) {
            Message.error('保存题目失败');
        } finally {
            setSaveLoading(false);
        }
    };

    const findNodeInTree = (treeData, key) => {
        for (const item of treeData) {
            if (item.key === key) {
                return item;
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
                return child;
            }
            if (child.children) {
                const result = findNodeInTreeRecursive(child.children, key, child);
                if (result) return result;
            }
        }
        return null;
    };

    // 取消保存生成的题目
    const handleCancelSave = () => {
        setGeneratedQuestions([]);
        setSelectedQuestions([]);
        setShowGeneratedQuestions(false);
        setSelectedSubjectForGenerate(null);
        setSelectedCategoryForGenerate(null);
        setStreamingContent('');
        setIsStreamingComplete(false);
        setSseFirstMessageReceived(false);
    };

    // 渲染题目选项
    const renderQuestionOptions = (options, questionType) => {
        if (!options || options === '') return null;

        // 如果是字符串格式的选项（如 "A. 选项1;B. 选项2" 或 "A. 选项1；B. 选项2"）
        if (typeof options === 'string' && (options.includes(';') || options.includes('；'))) {
            // 支持中英文分号分隔
            const optionsList = options.split(/[;；]/).map(opt => opt.trim()).filter(Boolean);
            return (
                <div style={{marginTop: 8}}>
                    <strong>选项:</strong>
                    <div style={{marginTop: 4, paddingLeft: 16}}>
                        {optionsList.map((option, index) => (
                            <div key={index} style={{marginBottom: 4}}>
                                {option}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // 如果是对象格式的选项（兼容原有格式）
        try {
            const optionsObj = typeof options === 'string' ? JSON.parse(options) : options;
            if (typeof optionsObj === 'object' && optionsObj !== null) {
                return (
                    <div style={{marginTop: 8}}>
                        <strong>选项:</strong>
                        <div style={{marginTop: 4, paddingLeft: 16}}>
                            {Object.entries(optionsObj).map(([key, value]) => (
                                <div key={key} style={{marginBottom: 4}}>
                                    <strong>{key}:</strong> {String(value)}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }
        } catch (e) {
            // 如果解析失败，直接显示原始字符串
            return (
                <div style={{marginTop: 8}}>
                    <strong>选项:</strong>
                    <div style={{marginTop: 4, paddingLeft: 16}}>
                        {options}
                    </div>
                </div>
            );
        }

        return null;
    };

    // 渲染题目答案
    const renderQuestionAnswer = (answer) => {
        if (!answer) return null;

        // 直接显示答案，不需要解析
        let displayAnswer = answer;

        // 如果是字符串格式的多选答案（如 "A,C"），格式化显示
        if (typeof answer === 'string' && answer.includes(',')) {
            displayAnswer = answer.split(',').map(a => a.trim()).join(', ');
        }

        return (
            <div style={{marginTop: 8, color: 'var(--color-primary-6)'}}>
                <strong>答案:</strong> {displayAnswer}
            </div>
        );
    };

    // 搜索表单配置
    const searchFormFields: FormFieldConfig[] = [
        {
            field: 'content',
            label: '关键字',
            type: 'input',
            placeholder: '请输入题干内容关键词',
            span: 8,
        },
    ];

    // 搜索处理
    const handleSearch = (values: any) => {
        fetchTableData(values, pagination.pageSize, 1);
    };

    // 重置处理
    const handleReset = () => {
        fetchTableData({}, pagination.pageSize, 1);
    };

    const filterContent = (
        <FilterForm
            ref={filterFormRef}
            formFields={searchFormFields}
            onSearch={handleSearch}
            onReset={handleReset}
        />
    );

    return (
        <div className="question-manager">
            <DataManager
                data={tableData}
                loading={tableLoading}
                pagination={pagination}
                onPaginationChange={(p) => {
                    fetchTableData(null, p.pageSize, p.current);
                }}
                actions={{
                    onAdd: handleGenerate,
                }}
                config={{
                    displayMode: 'table',
                    showModeToggle: false,
                    filterContent,
                    showTree: true,
                    treeContent: (
                        <div style={{height: '100%'}} className="tree-container">
                            <div style={{paddingBottom: '12px'}}>
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
                            <div style={{height: 'calc(100% - 50px)'}}>
                                <Spin loading={treeLoading}>
                                    {filteredTreeData.length > 0 ? (
                                        <Tree
                                            treeData={filteredTreeData}
                                            expandedKeys={expandedKeys}
                                            selectedKeys={selectedTreeNode ? [selectedTreeNode] : []}
                                            onExpand={(keys) => {
                                                setExpandedKeys(keys as string[]);
                                            }}
                                            onSelect={(selectedKeys) => {
                                                if (selectedKeys.length > 0) {
                                                    setSelectedTreeNode(selectedKeys[0]);
                                                    const selectedKey = selectedKeys[0];
                                                    const nodeInfo = findNodeInTree(treeData, selectedKey);
                                                    const collectChildCategoryIds = (treeNode) => {
                                                        let categoryIds = [];
                                                        if (treeNode.children && treeNode.children.length > 0) {
                                                            treeNode.children.forEach((child) => {
                                                                if (child.categoryId) {
                                                                    categoryIds.push(child.categoryId);
                                                                    categoryIds = categoryIds.concat(collectChildCategoryIds(child));
                                                                }
                                                            });
                                                        }
                                                        return categoryIds;
                                                    };
                                                    let categoryIds = [];
                                                    if (nodeInfo.categoryId) {
                                                        categoryIds.push(nodeInfo.categoryId);
                                                        categoryIds = categoryIds.concat(collectChildCategoryIds(nodeInfo));
                                                    }
                                                    nodeInfo.categoryIds = categoryIds;
                                                    setCurrentTreeNode(nodeInfo);
                                                    if (nodeInfo) {
                                                            fetchTableData(null, null, null, nodeInfo.subjectId, categoryIds);
                                                    } else {
                                                            fetchTableData();
                                                    }
                                                } else {
                                                    setSelectedTreeNode(null);
                                                    setCurrentTreeNode(null);
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
                                        <div
                                            style={{
                                                textAlign: 'center',
                                                color: 'var(--color-text-2)',
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
                    ),
                    tableColumns: columns,
                }}
                tableScrollHeight={tableScrollHeight}
            />

                {/* 编辑对话框 */}
                <Modal
                    title="编辑题目"
                    visible={editModalVisible}
                    onCancel={() => {
                        setEditModalVisible(false);
                        setEditDynamicFormData({options: {}, answer: {}});
                        setEditQuestionType('');
                    }}
                    onOk={() => editFormRef.current?.submit()}
                    afterOpen={() => {
                        if (currentRecord && editFormRef.current) {
                            setTimeout(() => {
                                if (editFormRef.current) {
                                    let parsedOptions = {};
                                    let parsedAnswer = '';
                                    // 解析选项：兼容 JSON 与 文本串 两种格式
                                    if (currentRecord.options) {
                                        if (typeof currentRecord.options === 'string') {
                                            try {
                                                parsedOptions = JSON.parse(currentRecord.options);
                                            } catch (e) {
                                                // 回退到文本解析
                                                parsedOptions = parseOptionsText(currentRecord.options);
                                            }
                                        } else {
                                            parsedOptions = currentRecord.options;
                                        }
                                    }

                                    // 解析答案：保持原有逻辑，优先尝试 JSON
                                    if (currentRecord.answer) {
                                        if (typeof currentRecord.answer === 'string') {
                                            try {
                                                parsedAnswer = JSON.parse(currentRecord.answer);
                                            } catch (e) {
                                                parsedAnswer = currentRecord.answer;
                                            }
                                        } else {
                                            parsedAnswer = currentRecord.answer;
                                        }
                                    }

                                    const {
                                        type,
                                        subjectId,
                                        content,
                                        explanation,
                                        difficultyLevel
                                    } = currentRecord;

                                    // 先设置除了 categoryId 之外的所有字段
                                    editFormRef.current.setFieldsValue({
                                        type,
                                        subjectId,
                                        content,
                                        explanation,
                                        difficultyLevel,
                                    });
                                    setEditQuestionType(type);
                                    setEditDynamicFormData({
                                        options: parsedOptions,
                                        answer: parsedAnswer
                                    });
                                    if (subjectId) {
                                        fetchCategoriesBySubject(subjectId);
                                    }
                                }
                            }, 0);
                        }
                    }}
                    afterClose={() => {
                        // 清理
                        setCurrentRecord(null);
                    }}
                >
                    <div style={{maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px'}}>
                        <Form
                            ref={editFormRef}
                            layout="vertical"
                            onSubmit={handleEditSubmit}
                            className="modal-form"
                            initialValues={currentRecord || {}}
                        >
                            <Form.Item
                                label="题目类型"
                                field="type"
                                rules={[{required: true, message: '请选择题目类型'}]}
                            >
                                <Select
                                    options={questionTypeOptions}
                                    placeholder="请选择题目类型"
                                    onChange={handleEditTypeChange}
                                />
                            </Form.Item>
                            <Form.Item
                                label="学科"
                                field="subjectId"
                                rules={[{required: true, message: '请选择学科'}]}
                            >
                                <Select
                                    options={subjects}
                                    placeholder="请选择学科"
                                    loading={subjectsLoading}
                                    onChange={(value) => {
                                        // 清空分类选择
                                        editFormRef.current?.setFieldValue('categoryId', undefined);
                                        setCategories([]);
                                        // 清空知识点选择与输入
                                        editFormRef.current?.setFieldValue('knowledgeId', undefined);
                                        editFormRef.current?.setFieldValue('knowledge', undefined);
                                        setEditKnowledgeDescrDisabled(false);
                                        // 获取该学科下的分类
                                        fetchCategoriesBySubject(value);
                                    }}
                                />
                            </Form.Item>
                            <Form.Item
                                label="分类"
                                field="categoryIds"
                                rules={[{required: true, message: '请选择分类'}]}
                            >
                                <Cascader
                                    placeholder='请先选择学科'
                                    options={categories}
                                    loading={categoriesLoading}
                                    disabled={categories.length === 0}
                                    changeOnSelect
                                    allowClear
                                />
                            </Form.Item>
                            <Form.Item
                                label="题干内容"
                                field="content"
                                rules={[{required: true, message: '请输入题干内容'}]}
                            >
                                <TextArea placeholder="请输入题干内容" rows={4}/>
                            </Form.Item>

                            {/* 动态表单区域 */}
                            {editQuestionType && (
                                <div style={{marginBottom: 20}}>
                                    <DynamicQuestionForm
                                        questionType={editQuestionType}
                                        value={editDynamicFormData}
                                        onChange={setEditDynamicFormData}
                                    />
                                </div>
                            )}

                            <Form.Item
                                label="解析说明"
                                field="explanation"
                            >
                                <TextArea placeholder="请输入解析说明" rows={3}/>
                            </Form.Item>

                        </Form>
                    </div>
                </Modal>

                {/* 删除确认对话框 */}
                <Modal
                    title="删除确认"
                    visible={deleteModalVisible}
                    onCancel={() => setDeleteModalVisible(false)}
                    onOk={handleDeleteConfirm}
                    className="delete-modal"
                >
                    <div className="delete-content">
                        <div className="delete-text">
                            确定要删除题目 "{currentRecord?.content?.substring(0, 50)}..." 吗？
                            <br/>
                            删除后将无法恢复。
                        </div>
                    </div>
                </Modal>

                <Modal
                    title="AI生成题目"
                    style={{width: '50%'}}
                    visible={generateModalVisible}
                    onCancel={() => setGenerateModalVisible(false)}
                    afterOpen={() => {
                        if (currentTreeNode && generateFormRef.current) {
                            setTimeout(async () => {
                                if (generateFormRef.current) {
                                    generateFormRef.current.setFieldValue('subjectId', currentTreeNode.subjectId);
                                    setKnowledgeDescrDisabled(false);

                                    // 加载分类
                                    fetchCategoriesBySubject(currentTreeNode.subjectId);

                                    // 加载文本模型列表并设置默认模型
                                    try {
                                        const list = await fetchTextModels();
                                        const defaultModel = list.find(m => m.isDefault === '1' || m.isDefault === 1);
                                        if (defaultModel) {
                                            generateFormRef.current.setFieldValue('modelName', defaultModel.name);
                                        }
                                    } catch (e) {
                                        // ignore
                                    }
                                }
                            }, 0);
                        } else {
                            // 若未在树上选择，仍尝试加载模型以便用户选择
                            setTimeout(async () => {
                                try {
                                    const list = await fetchTextModels();
                                    const defaultModel = list.find(m => m.isDefault === '1' || m.isDefault === 1);
                                    if (defaultModel && generateFormRef.current) {
                                        generateFormRef.current.setFieldValue('modelName', defaultModel.name);
                                    }
                                } catch (e) {
                                }
                            }, 0);
                        }
                    }}
                    footer={
                        <div style={{textAlign: 'right'}}>
                            <Button onClick={() => setGenerateModalVisible(false)} style={{marginRight: 8}}>
                                取消
                            </Button>
                            <Button
                                type="primary"
                                onClick={() => {
                                    setKnowledge(generateFormRef.current.getFieldValue('knowledgeDescr'));
                                    generateFormRef.current?.submit()
                                }}
                                loading={generateLoading}
                            >
                                确定
                            </Button>
                        </div>
                    }
                >
                    <Spin loading={generateLoading} style={{width: '100%'}}>
                        <div style={{maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px'}}>
                            <Form
                                ref={generateFormRef}
                                layout="vertical"
                                onSubmit={handleGenerateSubmit}
                                className="modal-form"
                            >
                                <Form.Item
                                    label="学科"
                                    field="subjectId"
                                    rules={[{required: true, message: '请选择学科'}]}
                                >
                                    <Select
                                        options={subjects}
                                        placeholder="请选择学科"
                                        loading={subjectsLoading}
                                        allowClear
                                        onChange={(value) => {
                                            // 清空分类选择
                                            generateFormRef.current?.setFieldValue('categoryIds', []);
                                            setCategories([]);
                                            setKnowledgeDescrDisabled(false);
                                            // 获取该学科下的分类
                                            fetchCategoriesBySubject(value);
                                        }}
                                    />
                                </Form.Item>
                                <Form.Item
                                    label="分类"
                                    field="categoryIds"
                                    rules={[{required: true, message: '请选择分类'}]}
                                >
                                    <Cascader
                                        placeholder='请先选择学科'
                                        options={categories}
                                        loading={categoriesLoading}
                                        disabled={categories.length === 0}
                                        changeOnSelect
                                        allowClear
                                    />
                                </Form.Item>
                                <Form.Item
                                    label="知识点"
                                    field="knowledgeDescr"
                                    rules={[{required: true, message: '请输入知识点'}]}
                                >
                                    <TextArea
                                        placeholder="请输入知识点描述，AI将根据此描述生成相关题目"
                                        rows={4}
                                        disabled={knowledgeDescrDisabled}
                                    />
                                </Form.Item>
                                <Form.Item
                                    label="模型"
                                    field="modelName"
                                >
                                    <Select
                                        placeholder="请选择文本生成模型"
                                        options={textModels.map(m => ({label: m.name, value: m.name}))}
                                        loading={modelsLoading}
                                        allowClear
                                    />
                                </Form.Item>
                                <Form.Item
                                    label="生成数量"
                                    field="num"
                                    initialValue={3}
                                    rules={[{required: true, message: '请输入生成数量'}]}
                                >
                                    <InputNumber
                                        min={1}
                                        max={10}
                                        placeholder="请输入生成题目数量（1-10）"
                                        style={{width: '100%'}}
                                    />
                                </Form.Item>
                            </Form>
                        </div>
                    </Spin>
                </Modal>

                {/* AI生成题目展示 */}
                {showGeneratedQuestions && (
                    <Modal
                        title={`AI生成的题目 (${generatedQuestions.length}道)`}
                        visible={showGeneratedQuestions}
                        onCancel={handleCancelSave}
                        style={{width: '50%'}}
                        footer={
                            <div style={{textAlign: 'right'}}>
                                <Button onClick={handleCancelSave} style={{marginRight: 8}}>
                                    取消
                                </Button>
                                <Button
                                    type="primary"
                                    onClick={handleSaveSelectedQuestions}
                                    disabled={selectedQuestions.length === 0 || !isStreamingComplete}
                                    loading={saveLoading}
                                >
                                    保存选中题目 ({selectedQuestions.length})
                                </Button>
                            </div>
                        }
                    >
                        {/* 显示选择的学科和分类信息 */}
                        {(selectedSubjectForGenerate || selectedCategoryForGenerate) && (
                            <div style={{
                                marginBottom: 16,
                                padding: 12,
                                backgroundColor: 'var(--color-fill-2)',
                                borderRadius: 6,
                                border: '1px solid #e5e6eb'
                            }}>
                                <div style={{fontWeight: 'bold', marginBottom: 8, color: 'var(--color-text-1)'}}>
                                    生成信息:
                                </div>
                                <div style={{display: 'flex', gap: 12}}>
                                    {selectedSubjectForGenerate && (
                                        <Tag color="blue" bordered>
                                            学科: {subjects.find(s => s.value === selectedSubjectForGenerate)?.label || selectedSubjectForGenerate}
                                        </Tag>
                                    )}
                                    {selectedCategoryForGenerate && (
                                        <Tag color="green" bordered>
                                            分类: {categories.find(c => c.value === selectedCategoryForGenerate)?.label || selectedCategoryForGenerate}
                                        </Tag>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 生成完成后提供回看入口（生成过程中不显示此入口） */}
                        {!showStreamLogVisible && (streamingContent || lastStreamErrorRef.current) && (
                            <div style={{marginBottom: 8, textAlign: 'right'}}>
                                <Button type="text" onClick={() => setStreamLogModalVisible(true)}>
                                    查看生成日志
                                </Button>
                            </div>
                        )}

                        {/* 流式内容展示区 */}
                        {showStreamLogVisible && !isStreamingComplete && (
                            <div style={{
                                marginBottom: 16,
                                padding: 12,
                                backgroundColor: 'var(--color-info-light-1)',
                                borderRadius: 6,
                                border: '1px solid #b6e3ff',
                                maxHeight: 200,
                                overflowY: 'auto'
                            }}>
                                {!sseFirstMessageReceived ? (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '20px',
                                        color: 'var(--color-primary-6)'
                                    }}>
                                        <Spin />
                                        <span style={{marginLeft: 12}}>正在连接AI模型，准备生成题目...</span>
                                    </div>
                                ) : streamingContent ? (
                                    <div ref={streamingContainerRef} style={{
                                        fontSize: 12,
                                        color: 'var(--color-text-3)',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        fontFamily: 'monospace'
                                    }} dangerouslySetInnerHTML={{__html: streamingContent}}>
                                    </div>
                                ) : null}
                            </div>
                        )}

                        {/* 生成日志回看弹窗 */}
                        <Modal
                            title="生成日志"
                            visible={streamLogModalVisible}
                            style={{width: '50%'}}
                            onCancel={() => setStreamLogModalVisible(false)}
                            footer={null}
                        >
                            <div style={{maxHeight: '60vh', overflowY: 'auto', padding: 12, background: '#fafafa'}}>
                                <div style={{fontSize: 12, color: 'var(--color-text-3)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace'}}
                                     dangerouslySetInnerHTML={{__html: streamingContent}}>
                                </div>
                            </div>
                        </Modal>

                        {/* 题目列表 */}
                        {generatedQuestions.length > 0 && (
                            <>
                                <div style={{marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f0f0f0'}}>
                                    <Checkbox
                                        checked={selectedQuestions.length === generatedQuestions.length}
                                        indeterminate={selectedQuestions.length > 0 && selectedQuestions.length < generatedQuestions.length}
                                        onChange={handleSelectAll}
                                    >
                                        全选 ({generatedQuestions.length}道)
                                    </Checkbox>
                                </div>
                                <div ref={generatedListRef} style={{maxHeight: '60vh', overflowY: 'auto'}}>
                                    <Collapse
                                        defaultActiveKey={generatedQuestions.map((_, index) => index.toString())}
                                    >
                                        {generatedQuestions.map((question, index) => {
                                            const typeMap = {
                                                'SINGLE': '单选题',
                                                'MULTIPLE': '多选题'
                                            };

                                            return (
                                                <Collapse.Item
                                                    key={index}
                                                    name={index.toString()}
                                                    header={
                                                        <div style={{display: 'flex', alignItems: 'center', width: '100%'}}>
                                                            <Checkbox
                                                                checked={selectedQuestions.includes(index)}
                                                                onChange={(checked) => handleQuestionSelect(index, checked)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                style={{marginRight: 12}}
                                                            />
                                                            <Tag color="blue" style={{marginRight: 8}} bordered>
                                                                {typeMap[question.type as keyof typeof typeMap] || question.type}
                                                            </Tag>
                                                            <Tooltip content={question.content}>
                                                            <span style={{
                                                                flex: 1,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}>
                                                                {question.content}
                                                            </span>
                                                            </Tooltip>
                                                        </div>
                                                    }
                                                >
                                                    <div style={{padding: '0 16px'}}>
                                                        <div style={{marginBottom: 12}}>
                                                            <strong>题干:</strong>
                                                            <div style={{
                                                                marginTop: 4,
                                                                padding: '8px 12px',
                                                                backgroundColor: 'var(--color-fill-2)',
                                                                borderRadius: 4
                                                            }}>
                                                                {question.content}
                                                            </div>
                                                        </div>

                                                        {question.options && renderQuestionOptions(question.options, question.type)}
                                                        {question.answer && renderQuestionAnswer(question.answer)}

                                                        {question.explanation && (
                                                            <div style={{marginTop: 8}}>
                                                                <strong>解析:</strong>
                                                                <div style={{marginTop: 4, color: 'var(--color-text-3)'}}>
                                                                    {question.explanation}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </Collapse.Item>
                                            );
                                        })}
                                    </Collapse>
                                </div>
                            </>
                        )}
                    </Modal>
                )}

                {/* 查看详情对话框 */}
                {detailModalVisible && detailRecord && (
                    <Modal
                        title="题目详情"
                        visible={detailModalVisible}
                        onCancel={() => setDetailModalVisible(false)}
                        footer={null}
                    >
                        <div style={{paddingTop: '16px'}}>
                            <div style={{marginBottom: 16}}>
                                <div style={{display: 'flex', gap: 12, marginBottom: 12}}>
                                    <Tag color="blue" bordered>
                                        {detailRecord.type === 'SINGLE' ? '单选题' : '多选题'}
                                    </Tag>
                                </div>
                            </div>

                            <div style={{marginBottom: 16}}>
                                <strong style={{fontSize: 16}}>题干:</strong>
                                <div style={{
                                    marginTop: 8,
                                    padding: '12px 16px',
                                    backgroundColor: 'var(--color-info-light-1)',
                                    borderRadius: 6,
                                    color: 'var(--color-text-3)',
                                    lineHeight: 1.6
                                }}>
                                    {detailRecord.content}
                                </div>
                            </div>

                            {detailRecord.options && renderQuestionOptions(detailRecord.options, detailRecord.type)}
                            {detailRecord.answer && renderQuestionAnswer(detailRecord.answer)}

                            {detailRecord.explanation && (
                                <div style={{marginTop: 16}}>
                                    <strong style={{fontSize: 16}}>解析:</strong>
                                    <div style={{
                                        marginTop: 8,
                                        padding: '12px 16px',
                                        backgroundColor: 'var(--color-fill-2)',
                                        borderRadius: 6,
                                        color: 'var(--color-text-3)',
                                        lineHeight: 1.6
                                    }}>
                                        {detailRecord.explanation}
                                    </div>
                                </div>
                            )}

                            <div style={{marginTop: 16, padding: '12px 0', borderTop: '1px solid #e5e6eb'}}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    color: 'var(--color-text-2)',
                                    fontSize: 14
                                }}>
                                    <span>创建人: <UserAvatar name={detailRecord.createUserName || ''} showName /></span>
                                    <span>创建时间: {renderDate(detailRecord.createDate)}</span>
                                </div>
                            </div>
                        </div>
                    </Modal>
                )}

        </div>
    );
}

export default QuestionManager;
