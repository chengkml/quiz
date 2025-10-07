import React, {useEffect, useRef, useState} from 'react';
import {
    Button,
    Checkbox,
    Collapse,
    Dropdown,
    Form,
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
} from '@arco-design/web-react';
import './style/index.less';
import {
    associateKnowledge,
    batchCreateQuestion,
    createQuestion,
    deleteQuestion,
    generateQuestions,
    getQuestionKnowledge,
    getQuestionList,
    updateQuestion,
} from './api';
import {getKnowledgeList} from '../Knowledge/api';
import {IconDelete, IconEdit, IconEye, IconList, IconPlus, IconRobot,} from '@arco-design/web-react/icon';
import FilterForm from '@/components/FilterForm';
import DynamicQuestionForm from '@/components/DynamicQuestionForm';
import Sider from '@arco-design/web-react/es/Layout/sider';

const {TextArea} = Input;
const {Content} = Layout;

function QuestionManager() {
    // 状态管理
    const [tableData, setTableData] = useState([]);
    const [tableLoading, setTableLoading] = useState(false);
    const [tableScrollHeight, setTableScrollHeight] = useState(200);

    // 对话框状态
    const [addModalVisible, setAddModalVisible] = useState(false);
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

    // 查看详情相关状态
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [detailRecord, setDetailRecord] = useState(null);

    // 知识点关联相关状态
    const [knowledgeModalVisible, setKnowledgeModalVisible] = useState(false);
    const [knowledgeList, setKnowledgeList] = useState([]);
    const [selectedKnowledge, setSelectedKnowledge] = useState([]);
    const [currentQuestionKnowledge, setCurrentQuestionKnowledge] = useState([]);
    const [knowledgeLoading, setKnowledgeLoading] = useState(false);

    // 表单引用
    const filterFormRef = useRef();
    const addFormRef = useRef();
    const editFormRef = useRef();
    const generateFormRef = useRef();

    // 动态表单数据状态
    const [addDynamicFormData, setAddDynamicFormData] = useState({options: {}, answer: {}});
    const [editDynamicFormData, setEditDynamicFormData] = useState({options: {}, answer: {}});
    const [addQuestionType, setAddQuestionType] = useState('');
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
        {label: '填空题', value: 'BLANK'},
        {label: '简答题', value: 'SHORT_ANSWER'},
    ];

    // 难度等级选项
    const difficultyOptions = [
        {label: '1级', value: 1},
        {label: '2级', value: 2},
        {label: '3级', value: 3},
        {label: '4级', value: 4},
        {label: '5级', value: 5},
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
                    'MULTIPLE': '多选题',
                    'BLANK': '填空题',
                    'SHORT_ANSWER': '简答题'
                };
                return <Tag color="blue">{typeMap[value] || value}</Tag>;
            },
        },
        {
            title: '关联知识点',
            dataIndex: 'knowledgePoints',
            width: 200,
            ellipsis: true,
            render: (value, record) => {
                if (!value || value.length === 0) {
                    return <span style={{color: '#999'}}>未关联</span>;
                }
                return (
                    <div>
                        {value.slice(0, 2).map((knowledge, index) => (
                            <Tag key={index} color="cyan" style={{marginBottom: 2}}>
                                {knowledge.name}
                            </Tag>
                        ))}
                        {value.length > 2 && (
                            <Tag color="gray">+{value.length - 2}</Tag>
                        )}
                    </div>
                );
            },
        },
        {
            title: '题干内容',
            dataIndex: 'content',
            minWidth: 300,
            ellipsis: true,
            render: (value) => (
                <div style={{overflow: 'hidden', textOverflow: 'ellipsis'}}>
                    {value}
                </div>
            ),
        },
        {
            title: '难度等级',
            dataIndex: 'difficultyLevel',
            width: 100,
            align: 'center',
            render: (value) => (
                <Tag color={value <= 2 ? 'green' : value <= 4 ? 'orange' : 'red'}>
                    难度: {value}级
                </Tag>
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
                <Space size="large" className="dropdown-demo table-btn-group">
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
                                <Menu.Item key="knowledge">
                                    <IconList style={{marginRight: '5px'}}/>
                                    关联知识点
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
    const fetchTableData = async (params = {}, pageSize = pagination.pageSize, current = pagination.current) => {
        setTableLoading(true);
        try {
            const targetParams = {
                ...params,
                pageNum: current - 1,
                pageSize: pageSize,
            };
            const response = await getQuestionList(targetParams);
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
            Message.error('获取题目数据失败');
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

    // 处理AI生成题目
    const handleGenerate = () => {
        setGenerateModalVisible(true);
    };

    // 处理查看详情
    const handleDetail = (record) => {
        setDetailRecord(record);
        setDetailModalVisible(true);
    };

    // 处理知识点关联
    const handleKnowledgeAssociation = async (record) => {
        setCurrentRecord(record);
        setKnowledgeLoading(true);
        try {
            // 获取所有知识点列表
            const knowledgeResponse = await getKnowledgeList({
                pageNum: 0,
                pageSize: 1000
            });
            if (knowledgeResponse.data) {
                setKnowledgeList(knowledgeResponse.data.content || []);
            }

            // 获取当前问题已关联的知识点
            const currentKnowledgeResponse = await getQuestionKnowledge(record.id);
            if (currentKnowledgeResponse.data) {
                const currentKnowledgeIds = currentKnowledgeResponse.data.map(k => k.id);
                setCurrentQuestionKnowledge(currentKnowledgeResponse.data);
                setSelectedKnowledge(currentKnowledgeIds);
            }
        } catch (error) {
            Message.error('获取知识点数据失败');
        } finally {
            setKnowledgeLoading(false);
            setKnowledgeModalVisible(true);
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
        } else if (key === 'knowledge') {
            handleKnowledgeAssociation(record);
        }
    };

    // 初始化数据
    useEffect(() => {
        fetchTableData();
    }, []);

    // 监听窗口大小变化，动态调整表格高度
    useEffect(() => {
        const calculateTableHeight = () => {
            const windowHeight = window.innerHeight;
            // 减去页面其他元素的高度，如头部、筛选区域、分页等
            // 这里可以根据实际页面布局调整计算逻辑
            const otherElementsHeight = 240; // 预估其他元素占用的高度
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

    // 提交新增表单
    const handleAddSubmit = async (values) => {
        try {
            setSaveLoading(true);
            // 将动态表单数据转换为JSON格式
            const submitData = {
                ...values,
                options: Object.keys(addDynamicFormData.options).length > 0
                    ? JSON.stringify(addDynamicFormData.options)
                    : null,
                answer: addDynamicFormData.answer
                    ? JSON.stringify(addDynamicFormData.answer)
                    : null
            };

            await createQuestion(submitData);
            Message.success('新增成功');
            setAddModalVisible(false);
            addFormRef.current?.resetFields();
            setAddDynamicFormData({options: {}, answer: {}});
            setAddQuestionType('');
            fetchTableData();
        } catch (error) {
            Message.error('新增失败');
        } finally {
            setSaveLoading(false);
        }
    };

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

            await updateQuestion(submitData);
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

    // 设置编辑表单初始值
    useEffect(() => {
        if (editModalVisible && currentRecord && editFormRef.current) {
            // 解析JSON数据
            let parsedOptions = {};
            let parsedAnswer = '';

            try {
                if (currentRecord.options) {
                    parsedOptions = typeof currentRecord.options === 'string'
                        ? JSON.parse(currentRecord.options)
                        : currentRecord.options;
                }
                if (currentRecord.answer) {
                    parsedAnswer = typeof currentRecord.answer === 'string'
                        ? JSON.parse(currentRecord.answer)
                        : currentRecord.answer;
                }
            } catch (error) {
                console.error('解析JSON数据失败:', error);
            }

            editFormRef.current.setFieldsValue({
                type: currentRecord.type,
                content: currentRecord.content,
                explanation: currentRecord.explanation,
                difficultyLevel: currentRecord.difficultyLevel,
            });

            setEditQuestionType(currentRecord.type);
            setEditDynamicFormData({
                options: parsedOptions,
                answer: parsedAnswer
            });
        }
    }, [editModalVisible, currentRecord]);

    const getDefaultAnswer = (type: string) => {
        switch (type) {
            case 'SINGLE':
            case 'BLANK':
            case 'SHORT_ANSWER':
                return '';
            case 'MULTIPLE':
                return [];
            default:
                return '';
        }
    };

    // 处理新增表单题目类型变化
    const handleAddTypeChange = (type) => {
        setAddQuestionType(type);
        setAddDynamicFormData({options: {}, answer: getDefaultAnswer(type)});
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
            const questionsToSave = selectedQuestions.map(index => {
                const question = generatedQuestions[index];
                return {
                    ...question,
                    // 对于AI生成的题目，options和answer已经是正确格式，不需要再次JSON.stringify
                    options: question.options || null,
                    answer: question.answer || null
                };
            });

            // 使用批量创建接口
            await batchCreateQuestion(questionsToSave);
            Message.success(`成功保存${selectedQuestions.length}道题目`);

            // 重置状态
            setGeneratedQuestions([]);
            setSelectedQuestions([]);
            setShowGeneratedQuestions(false);

            // 刷新表格数据
            fetchTableData();
        } catch (error) {
            Message.error('保存题目失败');
        } finally {
            setSaveLoading(false);
        }
    };

    // 取消保存生成的题目
    const handleCancelSave = () => {
        setGeneratedQuestions([]);
        setSelectedQuestions([]);
        setShowGeneratedQuestions(false);
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
                        minWidth: 150,
                        maxWidth: 500,
                        height: '100%',
                    }}
                >
                    Sider
                </Sider>
                <Content>
                    <FilterForm
                        ref={filterFormRef}
                        onSearch={searchTableData}
                        onReset={() => fetchTableData()}
                    >
                        <Form.Item field='type' label='题目类型'>
                            <Select allowClear
                                    placeholder='请选择题目类型'
                                    options={questionTypeOptions}
                            />
                        </Form.Item>
                        <Form.Item field='content' label='题干内容'>
                            <Input
                                placeholder='请输入题干内容关键词'
                            />
                        </Form.Item>
                        <Form.Item field='difficultyLevel' label='难度等级'>
                            <Select allowClear
                                    placeholder='请选择难度等级'
                                    options={difficultyOptions}
                            />
                        </Form.Item>
                    </FilterForm>

                    {/* 表格 */}
                    <div className="action-buttons">
                        <Button type="primary" icon={<IconPlus/>} onClick={handleAdd}>
                            新增题目
                        </Button>
                        <Button type="outline" icon={<IconRobot/>} onClick={handleGenerate}>
                            AI生成题目
                        </Button>
                    </div>
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
                                fetchTableData({}, pageSize, current);
                            }}
                        />
                    </div>
                </Content>

                {/* 新增对话框 */}
                <Modal
                    title="新增题目"
                    visible={addModalVisible}
                    footer={
                        <div style={{textAlign: 'right'}}>
                            <Button onClick={() => {
                                setAddModalVisible(false);
                                setAddDynamicFormData({options: {}, answer: {}});
                                setAddQuestionType('');
                            }} style={{marginRight: 8}}>
                                取消
                            </Button>
                            <Button
                                type="primary"
                                loading={saveLoading}
                                onClick={() => addFormRef.current?.submit()}
                            >
                                确定
                            </Button>
                        </div>
                    }
                >
                    <Form
                        ref={addFormRef}
                        layout="vertical"
                        onSubmit={handleAddSubmit}
                        className="modal-form"
                    >
                        <Form.Item
                            label="题目类型"
                            field="type"
                            rules={[{required: true, message: '请选择题目类型'}]}
                        >
                            <Select
                                options={questionTypeOptions}
                                placeholder="请选择题目类型"
                                onChange={handleAddTypeChange}
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
                        {addQuestionType && (
                            <div style={{marginBottom: 20}}>
                                <DynamicQuestionForm
                                    questionType={addQuestionType}
                                    value={addDynamicFormData}
                                    onChange={setAddDynamicFormData}
                                />
                            </div>
                        )}

                        <Form.Item
                            label="解析说明"
                            field="explanation"
                        >
                            <TextArea placeholder="请输入解析说明" rows={3}/>
                        </Form.Item>
                        <Form.Item
                            label="难度等级"
                            field="difficultyLevel"
                            initialValue={1}
                            rules={[{required: true, message: '请选择难度等级'}]}
                        >
                            <Select options={difficultyOptions} placeholder="请选择难度等级"/>
                        </Form.Item>
                    </Form>
                </Modal>

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
                    width={800}
                >
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
                        <Form.Item
                            label="难度等级"
                            field="difficultyLevel"
                            rules={[{required: true, message: '请选择难度等级'}]}
                        >
                            <Select options={difficultyOptions} placeholder="请选择难度等级"/>
                        </Form.Item>
                    </Form>
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

                {/* AI生成题目对话框 */}
                <Modal
                    title="AI生成题目"
                    visible={generateModalVisible}
                    footer={
                        <div style={{textAlign: 'right'}}>
                            <Button onClick={() => setGenerateModalVisible(false)} style={{marginRight: 8}}>
                                取消
                            </Button>
                            <Button
                                type="primary"
                                onClick={() => generateFormRef.current?.submit()}
                                loading={generateLoading}
                            >
                                确定
                            </Button>
                        </div>
                    }
                >
                    <Spin loading={generateLoading} style={{width: '100%'}}>
                        <Form
                            ref={generateFormRef}
                            layout="vertical"
                            onSubmit={handleGenerateSubmit}
                            className="modal-form"
                        >
                            <Form.Item
                                label="知识点描述"
                                field="knowledgeDescr"
                                rules={[{required: true, message: '请输入知识点描述'}]}
                            >
                                <TextArea
                                    placeholder="请输入知识点描述，AI将根据此描述生成相关题目"
                                    rows={4}
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
                                        'MULTIPLE': '多选题',
                                        'BLANK': '填空题',
                                        'SHORT_ANSWER': '简答题'
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
                                                    <Tag color="blue" style={{marginRight: 8}}>
                                                        {typeMap[question.type] || question.type}
                                                    </Tag>
                                                    <Tag
                                                        color={question.difficultyLevel <= 2 ? 'green' : question.difficultyLevel <= 4 ? 'orange' : 'red'}
                                                        style={{marginRight: 8}}
                                                    >
                                                        {question.difficultyLevel}级
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
                        width={800}
                    >
                        <div style={{padding: '16px 0'}}>
                            <div style={{marginBottom: 16}}>
                                <div style={{display: 'flex', gap: 12, marginBottom: 12}}>
                                    <Tag color="blue">
                                        {detailRecord.type === 'SINGLE' ? '单选题' :
                                            detailRecord.type === 'MULTIPLE' ? '多选题' :
                                                detailRecord.type === 'BLANK' ? '填空题' : '简答题'}
                                    </Tag>
                                    <Tag
                                        color={detailRecord.difficultyLevel <= 2 ? 'green' : detailRecord.difficultyLevel <= 4 ? 'orange' : 'red'}>
                                        难度: {detailRecord.difficultyLevel}级
                                    </Tag>
                                </div>
                            </div>

                            <div style={{marginBottom: 16}}>
                                <strong style={{fontSize: 16}}>题干:</strong>
                                <div style={{
                                    marginTop: 8,
                                    padding: '12px 16px',
                                    backgroundColor: '#f7f8fa',
                                    borderRadius: 6,
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
                                        backgroundColor: '#f0f9ff',
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
                                    <span>创建时间: {detailRecord.createDate || '--'}</span>
                                </div>
                            </div>
                        </div>
                    </Modal>
                )}

                {/* 知识点关联模态框 */}
                <Modal
                    title={`关联知识点 - ${currentRecord?.content?.substring(0, 30)}...`}
                    visible={knowledgeModalVisible}
                    onCancel={() => {
                        setKnowledgeModalVisible(false);
                        setSelectedKnowledge([]);
                        setCurrentQuestionKnowledge([]);
                    }}
                    onOk={async () => {
                        try {
                            setKnowledgeLoading(true);
                            await associateKnowledge({
                                questionId: currentRecord.id,
                                knowledgeIds: selectedKnowledge
                            });
                            Message.success('知识点关联成功');
                            setKnowledgeModalVisible(false);
                            fetchTableData(); // 刷新表格数据
                        } catch (error) {
                            Message.error('知识点关联失败');
                        } finally {
                            setKnowledgeLoading(false);
                        }
                    }}
                    confirmLoading={knowledgeLoading}
                    width={600}
                >
                    <div style={{maxHeight: 400, overflowY: 'auto'}}>
                        <div style={{marginBottom: 16}}>
                            <strong>当前已关联的知识点:</strong>
                            <div style={{marginTop: 8}}>
                                {currentQuestionKnowledge.length > 0 ? (
                                    currentQuestionKnowledge.map(knowledge => (
                                        <Tag key={knowledge.id} color="cyan" style={{margin: '2px 4px 2px 0'}}>
                                            {knowledge.name}
                                        </Tag>
                                    ))
                                ) : (
                                    <span style={{color: '#999'}}>暂无关联知识点</span>
                                )}
                            </div>
                        </div>

                        <div>
                            <strong>选择要关联的知识点:</strong>
                            <Checkbox.Group
                                value={selectedKnowledge}
                                onChange={setSelectedKnowledge}
                                style={{marginTop: 8, width: '100%'}}
                            >
                                <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px'}}>
                                    {knowledgeList.map(knowledge => (
                                        <Checkbox key={knowledge.id} value={knowledge.id}>
                                            <div style={{display: 'flex', flexDirection: 'column'}}>
                                                <span style={{fontWeight: 500}}>{knowledge.name}</span>
                                                {knowledge.description && (
                                                    <span style={{fontSize: 12, color: '#999', marginTop: 2}}>
                                                    {knowledge.description.substring(0, 50)}...
                                                </span>
                                                )}
                                            </div>
                                        </Checkbox>
                                    ))}
                                </div>
                            </Checkbox.Group>
                        </div>
                    </div>
                </Modal>
            </Layout>
        </div>
    );
}

export default QuestionManager;