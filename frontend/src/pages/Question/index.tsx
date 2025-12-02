import React, {useEffect, useRef, useState} from 'react';
import {
    Button,
    Cascader,
    Checkbox,
    Collapse,
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
    Spin,
    Table,
    Tag,
    Tooltip,
    Tree,
} from '@arco-design/web-react';
import './style/index.less';
import {
    associateKnowledge,
    batchCreateQuestion,
    deleteQuestion,
    generateQuestions,
    getAllSubjects,
    getCategoriesBySubjectId,
    getQuestionList,
    getSubjectCategoryTree,
    updateQuestion,
} from './api';
import {IconDelete, IconEdit, IconEye, IconList, IconPlus, IconSearch} from '@arco-design/web-react/icon';
import DynamicQuestionForm from '@/components/DynamicQuestionForm';
import Sider from '@arco-design/web-react/es/Layout/sider';
import {createKnowledge} from '../Knowledge/api';
import renderDate from "@/utils/timeUtil";

const {TextArea} = Input;
const {Content} = Layout;
const {Row, Col} = Grid;

function QuestionManager() {
    // 状态管理
    const [tableData, setTableData] = useState([]);
    const [tableLoading, setTableLoading] = useState(false);
    const [tableScrollHeight, setTableScrollHeight] = useState(200);

    // 对话框状态
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [generateModalVisible, setGenerateModalVisible] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);

    // AI生成题目相关状态
    const [generatedQuestions, setGeneratedQuestions] = useState([]);
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [showGeneratedQuestions, setShowGeneratedQuestions] = useState(false);
    const [generateLoading, setGenerateLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [knowledge, setKnowledge] = useState('');
    const [knowledgeDescrDisabled, setKnowledgeDescrDisabled] = useState(false);
    const [editKnowledgeDescrDisabled, setEditKnowledgeDescrDisabled] = useState(false);

    // 查看详情相关状态
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [detailRecord, setDetailRecord] = useState(null);

    // 学科和分类相关状态
    const [subjects, setSubjects] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subjectsLoading, setSubjectsLoading] = useState(false);
    // 知识点下拉选项（按学科/分类过滤）
    const [categoriesLoading, setCategoriesLoading] = useState(false);

    // 左侧树相关状态
    const [treeData, setTreeData] = useState([]);
    const [filteredTreeData, setFilteredTreeData] = useState([]);
    const [treeLoading, setTreeLoading] = useState(false);
    const [selectedTreeNode, setSelectedTreeNode] = useState(null);
    const [expandedKeys, setExpandedKeys] = useState([]);
    const [searchKeyword, setSearchKeyword] = useState('');

    const [currentTreeNode, setCurrentTreeNode] = useState(null);

    // AI生成时选择的学科和分类信息
    const [selectedSubjectForGenerate, setSelectedSubjectForGenerate] = useState(null);
    const [selectedCategoryForGenerate, setSelectedCategoryForGenerate] = useState(null);

    // 表单引用
    const filterFormRef = useRef();
    const editFormRef = useRef();
    const generateFormRef = useRef();

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
        const params = inParams || filterFormRef.current?.getFieldsValue?.();
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
        fetchTableData();
        fetchSubjects();
        fetchSubjectCategoryTree();
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
            // 减去页面其他元素的高度，如头部、筛选区域、分页等
            // 这里可以根据实际页面布局调整计算逻辑
            const otherElementsHeight = 250; // 预估其他元素占用的高度
            const newHeight = Math.max(100, windowHeight - otherElementsHeight);
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

            const response = await generateQuestions(values);
            if (response.data && response.data.length > 0) {
                setGeneratedQuestions(response.data);
                setSelectedQuestions([]);
                setShowGeneratedQuestions(true);
                setGenerateModalVisible(false);
                generateFormRef.current?.resetFields();
                Message.success(`成功生成${response.data.length}道题目，请选择要保存的题目`);
            } else {
                Message.warning('未生成任何题目');
            }
        } catch (error) {
            Message.error('生成题目失败');
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
    };

    // 渲染题目选项
    const renderQuestionOptions = (options, questionType) => {
        if (!options || options === '') return null;

        // 如果是字符串格式的选项（如 "A. 选项1;B. 选项2"）
        if (typeof options === 'string' && options.includes(';')) {
            const optionsList = options.split(';').map(opt => opt.trim());
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
                                    <strong>{key}:</strong> {value}
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
            <div style={{marginTop: 8, color: '#165DFF'}}>
                <strong>答案:</strong> {displayAnswer}
            </div>
        );
    };

    return (
        <div className="question-manager">
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
                                            const selectedKey = selectedKeys[0];
                                            const nodeInfo = findNodeInTree(treeData, selectedKey);
                                            const collectChildCategoryIds = (treeNode) => {
                                                let categoryIds = [];
                                                if (treeNode.children && treeNode.children.length > 0) {
                                                    treeNode.children.forEach((child) => {
                                                        if(child.categoryId) {
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
                    <Form ref={filterFormRef} layout="horizontal" className="filter-form" style={{marginTop: '10px'}}
                          onValuesChange={(params) => {
                              fetchTableData(params)
                          }}>
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item field="content" label="关键字">
                                    <Input placeholder="请输入题干内容关键词"/>
                                </Form.Item>
                            </Col>
                            <Col span={8} style={{
                                display: 'flex',
                                justifyContent: 'flex-start',
                                alignItems: 'flex-end',
                                paddingBottom: '16px'
                            }}>
                                <Space>
                                    <Button type="primary" icon={<IconSearch/>} onClick={(params) => {
                                        fetchTableData()
                                    }}>
                                        搜索
                                    </Button>
                                    <Button type="primary" status="success" icon={<IconPlus/>} onClick={handleGenerate}>
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

                    {/* 分页 */}
                    <div className="pagination-wrapper">
                        <Pagination
                            {...pagination}
                            onChange={(current, pageSize) => {
                                fetchTableData(null, pageSize, current);
                            }}
                        />
                    </div>
                </Content>

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
                    visible={generateModalVisible}
                    onCancel={() => setGenerateModalVisible(false)}
                    afterOpen={() => {
                        if (currentTreeNode && generateFormRef.current) {
                            setTimeout(() => {
                                if (generateFormRef.current) {
                                    generateFormRef.current.setFieldValue('subjectId', currentTreeNode.subjectId);
                                    setKnowledgeDescrDisabled(false);

                                    // 加载分类
                                    fetchCategoriesBySubject(currentTreeNode.subjectId);
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
                {showGeneratedQuestions && generatedQuestions.length > 0 && (
                    <Modal
                        title={`AI生成的题目 (${generatedQuestions.length}道)`}
                        visible={showGeneratedQuestions}
                        onCancel={handleCancelSave}
                        footer={
                            <div style={{textAlign: 'right'}}>
                                <Button onClick={handleCancelSave} style={{marginRight: 8}}>
                                    取消
                                </Button>
                                <Button
                                    type="primary"
                                    onClick={handleSaveSelectedQuestions}
                                    disabled={selectedQuestions.length === 0}
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
                                backgroundColor: '#f7f8fa',
                                borderRadius: 6,
                                border: '1px solid #e5e6eb'
                            }}>
                                <div style={{fontWeight: 'bold', marginBottom: 8, color: '#1d2129'}}>
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

                        <div style={{marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f0f0f0'}}>
                            <Checkbox
                                checked={selectedQuestions.length === generatedQuestions.length}
                                indeterminate={selectedQuestions.length > 0 && selectedQuestions.length < generatedQuestions.length}
                                onChange={handleSelectAll}
                            >
                                全选
                            </Checkbox>
                        </div>
                        <div style={{maxHeight: '60vh', overflowY: 'auto'}}>
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
                                                        {typeMap[question.type] || question.type}
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
                                                        backgroundColor: '#f7f8fa',
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
                                                        <div style={{marginTop: 4, color: '#666'}}>
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
                                    backgroundColor: '#f0f9ff',
                                    borderRadius: 6,
                                    color: '#666',
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
                                        backgroundColor: '#f7f8fa',
                                        borderRadius: 6,
                                        color: '#666',
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
                                    color: '#86909c',
                                    fontSize: 14
                                }}>
                                    <span>创建人: {detailRecord.createUserName || '--'}</span>
                                    <span>创建时间: {renderDate(detailRecord.createDate)}</span>
                                </div>
                            </div>
                        </div>
                    </Modal>
                )}

            </Layout>
        </div>
    );
}

export default QuestionManager;