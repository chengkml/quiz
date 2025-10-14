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
    Tag,
    Tooltip,
} from '@arco-design/web-react';
import {
    IconDelete,
    IconEdit,
    IconPlus,
} from '@arco-design/web-react/icon';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
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
    const [orderedQuestions, setOrderedQuestions] = useState<any[]>([]);

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

    // 拖拽排序相关
    const DragHandle = SortableHandle(() => (
        <span style={{ cursor: 'grab', userSelect: 'none' }}>⋮⋮</span>
    ));

    const SortableItem = SortableElement(({ item }: { item: any }) => (
        <div
            style={{
                display: 'flex',
                padding: '10px 12px',
                borderBottom: '1px solid #f0f0f0',
                alignItems: 'center',
                background: '#fff',
            }}
        >
            <div style={{ width: 40, textAlign: 'center' }}>
                <DragHandle />
            </div>
            <div style={{ width: 90, textAlign: 'center' }}>
                <Tag color="blue">第{item.orderNo}题</Tag>
            </div>
            <div style={{ width: 120 }}>
                <Tag color="cyan">
                    {item.question?.type === 'SINGLE'
                        ? '单选题'
                        : item.question?.type === 'MULTIPLE'
                        ? '多选题'
                        : item.question?.type === 'BLANK'
                        ? '填空题'
                        : '简答题'}
                </Tag>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
                <Tooltip content={item.question?.content}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.question?.content}
                    </div>
                </Tooltip>
            </div>
            <div style={{ width: 100, textAlign: 'center' }}>
                <Tag color="green">{item.score}分</Tag>
            </div>
            <div style={{ width: 140, textAlign: 'center' }}>
                <Tag
                    color={item.question?.difficultyLevel <= 2 ? 'green' : item.question?.difficultyLevel <= 4 ? 'orange' : 'red'}
                >
                    难度: {item.question?.difficultyLevel}级
                </Tag>
            </div>
            <div style={{ width: 200, textAlign: 'center' }}>
                <Space>
                    <Button type="text" size="small" icon={<IconEdit />} onClick={() => openEditModal(item)}>
                        编辑
                    </Button>
                    <Button
                        type="text"
                        size="small"
                        status="danger"
                        icon={<IconDelete />}
                        onClick={() => handleDeleteQuestion(item.question.id)}
                    >
                        删除
                    </Button>
                </Space>
            </div>
        </div>
    ));

    const SortableList = SortableContainer(({ items }: { items: any[] }) => {
        return (
            <div style={{ border: '1px solid #f0f0f0', borderRadius: 4, background: '#fff' }}>
                {/* 表头 */}
                <div
                    style={{
                        display: 'flex',
                        padding: '8px 12px',
                        background: '#fafafa',
                        borderBottom: '1px solid #f0f0f0',
                        fontWeight: 500,
                    }}
                >
                    <div style={{ width: 40 }} />
                    <div style={{ width: 90, textAlign: 'center' }}>顺序</div>
                    <div style={{ width: 120 }}>题目类型</div>
                    <div style={{ flex: 1, minWidth: 200 }}>题目内容</div>
                    <div style={{ width: 100, textAlign: 'center' }}>分值</div>
                    <div style={{ width: 140, textAlign: 'center' }}>难度等级</div>
                    <div style={{ width: 200, textAlign: 'center' }}>操作</div>
                </div>
                {items.map((item, idx) => (
                    <SortableItem key={item.question?.id} index={idx} item={item} />
                ))}
            </div>
        );
    });

    const arrayMoveCustom = (arr: any[], from: number, to: number) => {
        const newArr = arr.slice();
        const [item] = newArr.splice(from, 1);
        newArr.splice(to, 0, item);
        return newArr;
    };

    const handleSortEnd = async ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => {
        if (oldIndex === newIndex) return;
        const newOrder = arrayMoveCustom(orderedQuestions, oldIndex, newIndex);
        setOrderedQuestions(newOrder);
        try {
            setLoading(true);
            // 将顺序标准化为从1开始的连续值
            for (let i = 0; i < newOrder.length; i++) {
                const q = newOrder[i];
                await updateExamQuestion(examId, q.question.id, {
                    orderNo: i + 1,
                    score: q.score,
                });
            }
            Message.success('题目顺序调整成功');
            onQuestionsChange();
        } catch (error) {
            Message.error('题目顺序调整失败');
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


    useEffect(() => {
        if (addQuestionModalVisible) {
            fetchAvailableQuestions();
        }
    }, [addQuestionModalVisible, questions]);

    useEffect(() => {
        // 根据 orderNo 排序，初始化拖拽列表
        const sorted = [...(questions || [])].sort((a, b) => (a.orderNo || 0) - (b.orderNo || 0));
        setOrderedQuestions(sorted);
    }, [questions]);

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

            <SortableList
                items={orderedQuestions}
                onSortEnd={handleSortEnd}
                useDragHandle
                helperClass="dragging-row"
                distance={5}
                disabled={loading}
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