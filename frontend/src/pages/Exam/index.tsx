import React, {useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {
    Button,
    Card,
    Drawer,
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
    Switch,
    Table,
    Tag,
} from '@arco-design/web-react';
import './style/index.less';
import {
    archiveExam,
    autoGenerateExam,
    deleteExam,
    getExamById,
    getExamList,
    publishExam,
    updateExam,
} from './api';
import {
    IconArchive,
    IconDelete,
    IconEdit,
    IconEye,
    IconList,
    IconPlus,
    IconPublic,
    IconSettings,
} from '@arco-design/web-react/icon';

import ExamQuestionManager from './components/ExamQuestionManager';
import {getAllSubjects} from '../Subject/api';
import {getCategoriesBySubjectId} from '../Category/api';
import {ExamDto, ExamQueryDto, ExamStatus, FormRef, PaginationConfig, StatusOption} from './types';

const {TextArea} = Input;
const {Content} = Layout;
const {Row, Col} = Grid;

 function ExamManager(): React.ReactElement {
    const navigate = useNavigate();
    // 状态管理
    const [tableData, setTableData] = useState<ExamDto[]>([]);
    const [tableLoading, setTableLoading] = useState<boolean>(false);
    const [tableScrollHeight, setTableScrollHeight] = useState<number>(420);

    // 对话框状态
    const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
    const [currentRecord, setCurrentRecord] = useState<ExamDto | null>(null);

    // 查看详情相关状态
    const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
    const [detailRecord, setDetailRecord] = useState<ExamDto | null>(null);

    // 题目管理相关状态
    const [questionManagerVisible, setQuestionManagerVisible] = useState<boolean>(false);
    const [currentExamForQuestions, setCurrentExamForQuestions] = useState<ExamDto | null>(null);

    // 智能生成相关状态
    const [smartGenerateModalVisible, setSmartGenerateModalVisible] = useState<boolean>(false);
    const smartGenerateFormRef = useRef<FormRef['current']>();
    const [subjects, setSubjects] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [smartGenerating, setSmartGenerating] = useState<boolean>(false);

    // 表单引用
    const filterFormRef = useRef<FormRef['current']>();
    const editFormRef = useRef<FormRef['current']>();

    // 分页配置
    const [pagination, setPagination] = useState<PaginationConfig>({
        current: 1,
        pageSize: 20,
        total: 0,
        showTotal: true,
        showJumper: true,
        showPageSize: true,
    });

    // 试卷状态选项
    const statusOptions: StatusOption[] = [
        {label: '草稿', value: ExamStatus.DRAFT},
        {label: '已发布', value: ExamStatus.PUBLISHED},
        {label: '已归档', value: ExamStatus.ARCHIVED},
    ];

    // 表格列配置
    const columns = [
        {
            title: '试卷名称',
            dataIndex: 'name',
            width: 300,
            ellipsis: true,
        },
        {
            title: '所属学科',
            dataIndex: 'subjectName',
            width: 150,
            ellipsis: true,
        },
        {
            title: '总分',
            dataIndex: 'totalScore',
            width: 100,
            align: 'center',
            render: (value) => (
                <Tag bordered color="blue">{value}分</Tag>
            ),
        },
        {
            title: '考试时长',
            dataIndex: 'durationMinutes',
            width: 120,
            align: 'center',
            render: (value) => (
                <span>{value ? `${value}分钟` : '--'}</span>
            ),
        },
        {
            title: '状态',
            dataIndex: 'status',
            width: 100,
            align: 'center',
            render: (value) => {
                const statusMap = {
                    'DRAFT': {text: '草稿', color: 'gray'},
                    'PUBLISHED': {text: '已发布', color: 'green'},
                    'ARCHIVED': {text: '已归档', color: 'orange'}
                };
                const status = statusMap[value] || {text: value, color: 'gray'};
                return <Tag bordered color={status.color}>{status.text}</Tag>;
            },
        },
        {
            title: '题目数量',
            dataIndex: 'questionNum',
            width: 100,
            align: 'center',
            render: (value) => (
                <span>{value || 0}题</span>
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
                                {record.status === 'PUBLISHED' && (
                                    <Menu.Item key="start">
                                        <IconEye style={{marginRight: '5px'}}/>
                                        开始考试
                                    </Menu.Item>
                                )}
                                <Menu.Item key="detail">
                                    <IconEye style={{marginRight: '5px'}}/>
                                    查看详情
                                </Menu.Item>
                                <Menu.Item key="edit">
                                    <IconEdit style={{marginRight: '5px'}}/>
                                    编辑
                                </Menu.Item>
                                <Menu.Item key="questions">
                                    <IconSettings style={{marginRight: '5px'}}/>
                                    管理题目
                                </Menu.Item>
                                {record.status === 'DRAFT' && (
                                    <Menu.Item key="publish">
                                        <IconPublic style={{marginRight: '5px'}}/>
                                        发布
                                    </Menu.Item>
                                )}
                                {record.status === 'PUBLISHED' && (
                                    <Menu.Item key="archive">
                                        <IconArchive style={{marginRight: '5px'}}/>
                                        归档
                                    </Menu.Item>
                                )}
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
    const fetchTableData = async (params: Partial<ExamQueryDto> = {}, pageSize: number = pagination.pageSize, current: number = pagination.current): Promise<void> => {
        setTableLoading(true);
        try {
            const targetParams: ExamQueryDto = {
                ...params,
                pageNum: current - 1,
                pageSize: pageSize,
            };
            const response = await getExamList(targetParams);
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
            Message.error('获取试卷数据失败');
        } finally {
            setTableLoading(false);
        }
    };

    // 搜索表格数据
    const searchTableData = (params: any): void => {
        // 将筛选表单的 name 映射为后端的 keyWord
        const mapped: Partial<ExamQueryDto> = {
            keyWord: params?.name,
            status: params?.status,
            subjectId: params?.subjectId,
        };
        fetchTableData(mapped, pagination.pageSize, 1);
    };

    // 处理菜单点击
    const handleMenuClick = async (key: string, e: React.MouseEvent, record: ExamDto): Promise<void> => {
        e.stopPropagation();
        setCurrentRecord(record);

        switch (key) {
            case 'detail':
                navigate(`/quiz/frame/exam/detail/${record.id}`);
                break;
            case 'edit':
                handleEdit(record);
                break;
            case 'questions':
                handleManageQuestions(record);
                break;
            case 'publish':
                await handlePublish(record);
                break;
            case 'archive':
                await handleArchive(record);
                break;
            case 'start':
                navigate(`/quiz/frame/exam/take/${record.id}`);
                break;
            case 'delete':
                setDeleteModalVisible(true);
                break;
            default:
                break;
        }
    };


    // 管理题目
    const handleManageQuestions = async (record: ExamDto): Promise<void> => {
        try {
            const response = await getExamById(record.id);
            if (response.data) {
                setCurrentExamForQuestions(response.data);
                setQuestionManagerVisible(true);
            }
        } catch (error) {
            Message.error('获取试卷信息失败');
        }
    };

    // 题目变化回调
    const handleQuestionsChange = async (): Promise<void> => {
        if (currentExamForQuestions) {
            try {
                const response = await getExamById(currentExamForQuestions.id);
                if (response.data) {
                    setCurrentExamForQuestions(response.data);
                }
                // 刷新列表数据
                fetchTableData();
            } catch (error) {
                Message.error('刷新试卷信息失败');
            }
        }
    };

    // 编辑试卷
    const handleEdit = (record: ExamDto): void => {
        setCurrentRecord(record);
        setEditModalVisible(true);
        setTimeout(() => {
            editFormRef.current?.setFieldsValue({
                name: record.name,
                description: record.description,
                subjectId: record.subjectId,
                totalScore: record.totalScore,
                durationMinutes: record.durationMinutes,
            });
        }, 100);
    };

    // 发布试卷
    const handlePublish = async (record: ExamDto): Promise<void> => {
        try {
            await publishExam(record.id);
            Message.success('试卷发布成功');
            fetchTableData();
        } catch (error) {
            Message.error('试卷发布失败');
        }
    };

    // 归档试卷
    const handleArchive = async (record: ExamDto): Promise<void> => {
        try {
            await archiveExam(record.id);
            Message.success('试卷归档成功');
            fetchTableData();
        } catch (error) {
            Message.error('试卷归档失败');
        }
    };



    // 打开智能生成试卷弹窗
    const openSmartGenerateModal = async (): Promise<void> => {
        setSmartGenerateModalVisible(true);
        try {
            const res = await getAllSubjects();
            setSubjects(res?.data || []);
        } catch (e) {
            Message.error('获取学科列表失败');
        }
    };

    // 执行智能生成试卷
    const handleSmartGenerate = async (): Promise<void> => {
        try {
            const values = await smartGenerateFormRef.current?.validate();
            setSmartGenerating(true);
            const payload = {
                name: values?.name,
                description: values?.description,
                questionCount: values?.questionCount,
                totalScore: values?.totalScore,
                subjectId: values?.subjectId,
                categoryId: values?.categoryId,
                durationMinutes: values?.durationMinutes,
                publishImmediately: values?.publishImmediately ?? false,
            };
            const res = await autoGenerateExam(payload);
            setSmartGenerating(false);
            if (res?.data) {
                Message.success('智能生成试卷成功');
                setSmartGenerateModalVisible(false);
                smartGenerateFormRef.current?.resetFields();
                fetchTableData();
            } else {
                Message.error(res?.message || '智能生成失败');
            }
        } catch (e: any) {
            setSmartGenerating(false);
            if (e?.errors) {
                return;
            }
            Message.error(e?.message || '智能生成失败');
        }
    };

    // 确认编辑
    const handleEditConfirm = async (): Promise<void> => {
        try {
            const values = await editFormRef.current?.validate();
            if (values && currentRecord) {
                await updateExam({
                    id: currentRecord.id,
                    ...values,
                });
                Message.success('试卷更新成功');
                setEditModalVisible(false);
                editFormRef.current?.resetFields();
                fetchTableData();
            }
        } catch (error) {
            Message.error('试卷更新失败');
        }
    };

    // 确认删除
    const handleDeleteConfirm = async (): Promise<void> => {
        try {
            await deleteExam(currentRecord.id);
            Message.success('试卷删除成功');
            setDeleteModalVisible(false);
            fetchTableData();
        } catch (error) {
            Message.error('试卷删除失败');
        }
    };

    // 分页变化
    const handlePaginationChange = (current: number, pageSize: number): void => {
        fetchTableData({}, pageSize, current);
    };

    // 计算表格高度的函数
    const calculateTableHeight = () => {
        const windowHeight = window.innerHeight;
        const otherElementsHeight = 190; // 其他元素占用的高度
        const newHeight = Math.max(200, windowHeight - otherElementsHeight);
        setTableScrollHeight(newHeight);
    };

    // 初始化数据
    useEffect(() => {
        fetchTableData();
        // 加载学科列表
        loadSubjects();
        
        // 初始化表格高度
        calculateTableHeight();
        // 添加窗口大小改变事件监听
        const handleResize = () => calculateTableHeight();
        window.addEventListener('resize', handleResize);
        
        // 清理函数
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    // 加载学科列表
    const loadSubjects = async (): Promise<void> => {
        try {
            const res = await getAllSubjects();
            setSubjects(res?.data || []);
        } catch (e) {
            Message.error('获取学科列表失败');
        }
    };



    return (
        <Layout className="exam-manager">
            <Content>
                {/* 筛选表单 */}
                <Form ref={filterFormRef} layout="horizontal" className="filter-form" style={{marginTop: '10px'}} onValuesChange={() => {
                    const values = filterFormRef.current?.getFieldsValue?.() || {};
                    searchTableData(values);
                }}>
                    <Row gutter={16}>
                        <Col span={5}>
                            <Form.Item field="name" label="名称">
                                <Input placeholder="请输入试卷名称"/>
                            </Form.Item>
                        </Col>
                        <Col span={5}>
                            <Form.Item field="status" label="状态">
                                <Select placeholder="请选择试卷状态" allowClear>
                                    {statusOptions.map(opt => (
                                        <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={5}>
                            <Form.Item field="subjectId" label="学科">
                                <Select placeholder="请选择学科" allowClear>
                                    {subjects.map((s: any) => (
                                        <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col span={5} style={{display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', paddingBottom: '16px'}}>
                            <Space>
                                    <Button type="primary" onClick={() => {
                                        const values = filterFormRef.current?.getFieldsValue?.() || {};
                                        searchTableData(values);
                                    }}>
                                        搜索
                                    </Button>
                                    <Button type="primary" status="success" onClick={openSmartGenerateModal}>
                                        新建
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
                        onChange={handlePaginationChange}
                    />
                </div>
                </Content>


                {/* 智能生成试卷模态框 */}
                <Modal
                    title="智能生成试卷"
                    visible={smartGenerateModalVisible}
                    onOk={handleSmartGenerate}
                    onCancel={() => setSmartGenerateModalVisible(false)}
                    okButtonProps={{ loading: smartGenerating }}
                    autoFocus={false}
                    focusLock={true}
                    maskClosable={false}
                >
                    <div style={{maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px'}}>
                        <Form
                            ref={smartGenerateFormRef}
                            layout="vertical"
                            initialValues={{ questionCount: 20, totalScore: 100, durationMinutes: 60, publishImmediately: true }}
                        >
                            <Form.Item label="试卷名称" field="name">
                                <Input placeholder="留空则自动生成名称" allowClear />
                            </Form.Item>
                            <Form.Item label="试卷描述" field="description">
                                <TextArea placeholder="可选" maxLength={200} />
                            </Form.Item>
                            <Form.Item label="学科" field="subjectId" rules={[{ required: true, message: '请选择学科' }]}>
                                <Select placeholder="请选择学科" allowClear>
                                    {subjects.map((s: any) => (
                                        <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            <Form.Item label="题目数量" field="questionCount" rules={[{ required: true, type: 'number', min: 1, message: '请输入题目数量' }]}>
                                <InputNumber min={1} placeholder="题目数量" style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item label="总分" field="totalScore" rules={[{ required: true, type: 'number', min: 1, message: '请输入总分' }]}>
                                <InputNumber min={1} placeholder="总分" style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item label="时长（分钟）" field="durationMinutes" rules={[{ type: 'number', min: 1, message: '请输入有效时长' }]}>
                                <InputNumber min={1} placeholder="可选" style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item label="生成后立即发布" field="publishImmediately" triggerPropName="checked">
                                <Switch />
                            </Form.Item>
                        </Form>
                    </div>
                </Modal>

                {/* 编辑试卷模态框 */}
                <Modal
                    title="编辑试卷"
                    visible={editModalVisible}
                    onOk={handleEditConfirm}
                    onCancel={() => {
                        setEditModalVisible(false);
                        editFormRef.current?.resetFields();
                    }}
                    autoFocus={false}
                    focusLock={true}
                >
                    <div style={{maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px'}}>
                        <Form ref={editFormRef} layout="vertical">
                            <Form.Item
                                label="试卷名称"
                                field="name"
                                rules={[{required: true, message: '请输入试卷名称'}]}
                            >
                                <Input placeholder="请输入试卷名称"/>
                            </Form.Item>
                            <Form.Item label="试卷描述" field="description">
                                <TextArea
                                    placeholder="请输入试卷描述"
                                    autoSize={{minRows: 3, maxRows: 6}}
                                />
                            </Form.Item>
                            <Form.Item
                                label="学科"
                                field="subjectId"
                                rules={[{required: true, message: '请选择学科'}]}
                            >
                                <Select placeholder="请选择学科">
                                    {subjects.map((s: any) => (
                                        <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            <Form.Item
                                label="总分"
                                field="totalScore"
                                rules={[{required: true, message: '请输入总分'}]}
                            >
                                <InputNumber
                                    placeholder="请输入总分"
                                    min={1}
                                    max={1000}
                                    style={{width: '100%'}}
                                />
                            </Form.Item>
                            <Form.Item label="考试时长（分钟）" field="durationMinutes">
                                <InputNumber
                                    placeholder="请输入考试时长"
                                    min={1}
                                    max={600}
                                    style={{width: '100%'}}
                                />
                            </Form.Item>
                        </Form>
                    </div>
                </Modal>

                {/* 删除确认模态框 */}
                <Modal
                    title="删除试卷"
                    visible={deleteModalVisible}
                    onOk={handleDeleteConfirm}
                    onCancel={() => setDeleteModalVisible(false)}
                    autoFocus={false}
                    focusLock={true}
                >
                    <p>确定要删除试卷 "{currentRecord?.name}" 吗？此操作不可恢复。</p>
                </Modal>

                {/* 题目管理抽屉 */}
                <Drawer
                    title={`管理题目 - ${currentExamForQuestions?.name}`}
                    visible={questionManagerVisible}
                    placement="right"
                    width={900}
                    onCancel={() => setQuestionManagerVisible(false)}
                >
                    {currentExamForQuestions && (
                        <ExamQuestionManager
                            examId={currentExamForQuestions.id}
                            questions={currentExamForQuestions.questions || []}
                            onQuestionsChange={handleQuestionsChange}
                        />
                    )}
                </Drawer>
        </Layout>
    );
}

export default ExamManager;