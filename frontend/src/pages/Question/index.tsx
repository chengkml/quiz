import React, {useEffect, useRef, useState} from 'react';
import {
    Button,
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
    Table,
    Tag,
} from '@arco-design/web-react';
import './style/index.less';
import {createQuestion, deleteQuestion, generateQuestions, getQuestionList, updateQuestion,} from './api';
import {IconDelete, IconEdit, IconList, IconPlus, IconRobot,} from '@arco-design/web-react/icon';
import FilterForm from '@/components/FilterForm';
import DynamicQuestionForm from '@/components/DynamicQuestionForm';

const {TextArea} = Input;
const {Content} = Layout;

function QuestionManager() {
    // 状态管理
    const [tableData, setTableData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);

    // 对话框状态
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [generateModalVisible, setGenerateModalVisible] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);

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
            title: '题干内容',
            dataIndex: 'content',
            minWidth: 300,
            ellipsis: true,
            render: (value) => (
                <div style={{maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis'}}>
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
                    {value}级
                </Tag>
            ),
        },
        {
            title: '创建人',
            dataIndex: 'createUser',
            width: 120,
            ellipsis: true,
        },
        {
            title: '创建时间',
            dataIndex: 'createDate',
            width: 180,
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
            width: 120,
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
                                <Menu.Item key="edit">
                                    <IconEdit/>
                                    编辑
                                </Menu.Item>
                                <Menu.Item key="delete">
                                    <IconDelete/>
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

    // 处理菜单点击
    const handleMenuClick = (key, event, record) => {
        event.stopPropagation();
        if (key === 'edit') {
            handleEdit(record);
        } else if (key === 'delete') {
            handleDelete(record);
        }
    };

    // 初始化数据
    useEffect(() => {
        fetchTableData();
    }, []);

    // 提交新增表单
    const handleAddSubmit = async (values) => {
        try {
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
        try {
            const response = await generateQuestions(values);
            if (response.data && response.data.length > 0) {
                Message.success(`成功生成${response.data.length}道题目`);
                setGenerateModalVisible(false);
                generateFormRef.current?.resetFields();
                fetchTableData();
            } else {
                Message.warning('未生成任何题目');
            }
        } catch (error) {
            Message.error('生成题目失败');
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

    return (
        <div className="question-manager">
            <Content style={{padding: '16px'}}>
                {/* 搜索表单 */}
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

                {/* 操作按钮 */}
                <div className="action-buttons">
                    <Button type="primary" icon={<IconPlus/>} onClick={handleAdd}>
                        新增题目
                    </Button>
                    <Button type="outline" icon={<IconRobot/>} onClick={handleGenerate}>
                        AI生成题目
                    </Button>
                </div>

                {/* 表格 */}
                <div className="table-container">
                    <Table
                        columns={columns}
                        data={tableData}
                        loading={tableLoading}
                        pagination={false}
                        scroll={{x: 1200}}
                        rowKey="id"
                    />
                </div>

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
                onCancel={() => {
                    setAddModalVisible(false);
                    setAddDynamicFormData({options: {}, answer: {}});
                    setAddQuestionType('');
                }}
                onOk={() => addFormRef.current?.submit()}
                width={800}
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
                onCancel={() => setGenerateModalVisible(false)}
                onOk={() => generateFormRef.current?.submit()}
                width={600}
            >
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
            </Modal>
        </div>
    );
}

export default QuestionManager;