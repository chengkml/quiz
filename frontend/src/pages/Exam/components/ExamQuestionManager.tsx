import React, {useEffect, useRef, useState} from 'react';
import {
    Button,
    Form,
    Input,
    InputNumber,
    Message,
    Modal,
    Select,
    Space,
    Table,
    Tag,
    Tooltip,
} from '@arco-design/web-react';
import {
    IconDelete,
    IconEdit,
    IconPlus,
    IconUp,
    IconDown,
} from '@arco-design/web-react/icon';
import {
    addQuestionToExam,
    removeQuestionFromExam,
    updateExamQuestion,
} from '../api';
import {getQuestionList} from '../../Question/api';

interface ExamQuestionManagerProps {
    examId: string;
    questions: any[];
    onQuestionsChange: () => void;
}

const ExamQuestionManager: React.FC<ExamQuestionManagerProps> = ({
    examId,
    questions,
    onQuestionsChange,
}) => {
    const [addQuestionModalVisible, setAddQuestionModalVisible] = useState(false);
    const [editQuestionModalVisible, setEditQuestionModalVisible] = useState(false);
    const [availableQuestions, setAvailableQuestions] = useState([]);
    const [currentEditQuestion, setCurrentEditQuestion] = useState(null);
    const [loading, setLoading] = useState(false);

    const addFormRef = useRef();
    const editFormRef = useRef();

    // 获取可用题目列表
    const fetchAvailableQuestions = async () => {
        try {
            const response = await getQuestionList({pageNum: 0, pageSize: 1000});
            if (response.data) {
                // 过滤掉已经在试卷中的题目
                const existingQuestionIds = questions.map(q => q.question?.id);
                const available = response.data.content.filter(
                    q => !existingQuestionIds.includes(q.id)
                );
                setAvailableQuestions(available);
            }
        } catch (error) {
            Message.error('获取题目列表失败');
        }
    };

    // 添加题目到试卷
    const handleAddQuestion = async () => {
        try {
            const values = await addFormRef.current?.validate();
            if (values) {
                setLoading(true);
                await addQuestionToExam(examId, {
                    questionId: values.questionId,
                    orderNo: values.orderNo,
                    score: values.score,
                });
                Message.success('题目添加成功');
                setAddQuestionModalVisible(false);
                addFormRef.current?.resetFields();
                onQuestionsChange();
            }
        } catch (error) {
            Message.error('题目添加失败');
        } finally {
            setLoading(false);
        }
    };

    // 编辑题目信息
    const handleEditQuestion = async () => {
        try {
            const values = await editFormRef.current?.validate();
            if (values) {
                setLoading(true);
                await updateExamQuestion(examId, currentEditQuestion.question.id, {
                    orderNo: values.orderNo,
                    score: values.score,
                });
                Message.success('题目更新成功');
                setEditQuestionModalVisible(false);
                editFormRef.current?.resetFields();
                onQuestionsChange();
            }
        } catch (error) {
            Message.error('题目更新失败');
        } finally {
            setLoading(false);
        }
    };

    // 删除题目
    const handleDeleteQuestion = async (questionId) => {
        Modal.confirm({
            title: '删除题目',
            content: '确定要从试卷中删除这道题目吗？',
            onOk: async () => {
                try {
                    await removeQuestionFromExam(examId, questionId);
                    Message.success('题目删除成功');
                    onQuestionsChange();
                } catch (error) {
                    Message.error('题目删除失败');
                }
            },
        });
    };

    // 移动题目顺序
    const handleMoveQuestion = async (question, direction) => {
        const currentIndex = questions.findIndex(q => q.question.id === question.question.id);
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        
        if (targetIndex < 0 || targetIndex >= questions.length) {
            return;
        }

        const targetQuestion = questions[targetIndex];
        
        try {
            // 交换两个题目的顺序
            await updateExamQuestion(examId, question.question.id, {
                orderNo: targetQuestion.orderNo,
                score: question.score,
            });
            await updateExamQuestion(examId, targetQuestion.question.id, {
                orderNo: question.orderNo,
                score: targetQuestion.score,
            });
            Message.success('题目顺序调整成功');
            onQuestionsChange();
        } catch (error) {
            Message.error('题目顺序调整失败');
        }
    };

    // 打开编辑模态框
    const openEditModal = (question) => {
        setCurrentEditQuestion(question);
        setEditQuestionModalVisible(true);
        setTimeout(() => {
            editFormRef.current?.setFieldsValue({
                orderNo: question.orderNo,
                score: question.score,
            });
        }, 100);
    };

    // 表格列配置
    const columns = [
        {
            title: '顺序',
            dataIndex: 'orderNo',
            width: 80,
            align: 'center',
            render: (value) => <Tag color="blue">第{value}题</Tag>,
        },
        {
            title: '题目类型',
            dataIndex: 'question',
            width: 100,
            render: (question) => {
                const typeMap = {
                    'SINGLE': '单选题',
                    'MULTIPLE': '多选题',
                    'BLANK': '填空题',
                    'SHORT_ANSWER': '简答题'
                };
                return <Tag color="cyan">{typeMap[question?.type] || question?.type}</Tag>;
            },
        },
        {
            title: '题目内容',
            dataIndex: 'question',
            minWidth: 300,
            ellipsis: true,
            render: (question) => (
                <Tooltip content={question?.content}>
                    <div style={{overflow: 'hidden', textOverflow: 'ellipsis'}}>
                        {question?.content}
                    </div>
                </Tooltip>
            ),
        },
        {
            title: '分值',
            dataIndex: 'score',
            width: 80,
            align: 'center',
            render: (value) => <Tag color="green">{value}分</Tag>,
        },
        {
            title: '难度等级',
            dataIndex: 'question',
            width: 100,
            align: 'center',
            render: (question) => (
                <Tag color={question?.difficultyLevel <= 2 ? 'green' : 
                           question?.difficultyLevel <= 4 ? 'orange' : 'red'}>
                    难度: {question?.difficultyLevel}级
                </Tag>
            ),
        },
        {
            title: '操作',
            width: 200,
            align: 'center',
            render: (_, record, index) => (
                <Space>
                    <Button
                        type="text"
                        size="small"
                        icon={<IconUp/>}
                        disabled={index === 0}
                        onClick={() => handleMoveQuestion(record, 'up')}
                    >
                        上移
                    </Button>
                    <Button
                        type="text"
                        size="small"
                        icon={<IconDown/>}
                        disabled={index === questions.length - 1}
                        onClick={() => handleMoveQuestion(record, 'down')}
                    >
                        下移
                    </Button>
                    <Button
                        type="text"
                        size="small"
                        icon={<IconEdit/>}
                        onClick={() => openEditModal(record)}
                    >
                        编辑
                    </Button>
                    <Button
                        type="text"
                        size="small"
                        status="danger"
                        icon={<IconDelete/>}
                        onClick={() => handleDeleteQuestion(record.question.id)}
                    >
                        删除
                    </Button>
                </Space>
            ),
        },
    ];

    useEffect(() => {
        if (addQuestionModalVisible) {
            fetchAvailableQuestions();
        }
    }, [addQuestionModalVisible, questions]);

    return (
        <div>
            <div style={{marginBottom: 16}}>
                <Button
                    type="primary"
                    icon={<IconPlus/>}
                    onClick={() => setAddQuestionModalVisible(true)}
                >
                    添加题目
                </Button>
            </div>

            <Table
                columns={columns}
                data={questions}
                pagination={false}
                rowKey={(record) => record.question?.id}
            />

            {/* 添加题目模态框 */}
            <Modal
                title="添加题目"
                visible={addQuestionModalVisible}
                onOk={handleAddQuestion}
                onCancel={() => {
                    setAddQuestionModalVisible(false);
                    addFormRef.current?.resetFields();
                }}
                confirmLoading={loading}
                autoFocus={false}
                focusLock={true}
            >
                <Form ref={addFormRef} layout="vertical">
                    <Form.Item
                        label="选择题目"
                        field="questionId"
                        rules={[{required: true, message: '请选择题目'}]}
                    >
                        <Select
                            placeholder="请选择题目"
                            showSearch
                            filterOption={(inputValue, option) =>
                                option.props.children.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0
                            }
                        >
                            {availableQuestions.map(question => (
                                <Select.Option key={question.id} value={question.id}>
                                    [{question.type === 'SINGLE' ? '单选' : 
                                      question.type === 'MULTIPLE' ? '多选' :
                                      question.type === 'BLANK' ? '填空' : '简答'}] {question.content}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label="题目顺序"
                        field="orderNo"
                        rules={[{required: true, message: '请输入题目顺序'}]}
                    >
                        <InputNumber
                            placeholder="请输入题目顺序"
                            min={1}
                            max={100}
                            style={{width: '100%'}}
                        />
                    </Form.Item>
                    <Form.Item
                        label="分值"
                        field="score"
                        rules={[{required: true, message: '请输入分值'}]}
                    >
                        <InputNumber
                            placeholder="请输入分值"
                            min={1}
                            max={100}
                            style={{width: '100%'}}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 编辑题目模态框 */}
            <Modal
                title="编辑题目"
                visible={editQuestionModalVisible}
                onOk={handleEditQuestion}
                onCancel={() => {
                    setEditQuestionModalVisible(false);
                    editFormRef.current?.resetFields();
                }}
                confirmLoading={loading}
                autoFocus={false}
                focusLock={true}
            >
                <Form ref={editFormRef} layout="vertical">
                    <Form.Item
                        label="题目顺序"
                        field="orderNo"
                        rules={[{required: true, message: '请输入题目顺序'}]}
                    >
                        <InputNumber
                            placeholder="请输入题目顺序"
                            min={1}
                            max={100}
                            style={{width: '100%'}}
                        />
                    </Form.Item>
                    <Form.Item
                        label="分值"
                        field="score"
                        rules={[{required: true, message: '请输入分值'}]}
                    >
                        <InputNumber
                            placeholder="请输入分值"
                            min={1}
                            max={100}
                            style={{width: '100%'}}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ExamQuestionManager;