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
    Link,
    Menu,
    Message,
    Modal,
    Popconfirm,
    Select,
    Space,
    Spin,
    Switch,
    Tag,
    Tooltip,
    Tree,
} from '@arco-design/web-react';
import './style/index.less';
import {
    archiveExam,
    autoGenerateExam,
    deleteExam,
    getExamById,
    getExamList,
    publishExam,
} from './api';
import {
    IconArchive,
    IconDelete,
    IconEye,
    IconList,
    IconPlus,
    IconPublic,
    IconSearch,
    IconSettings,
} from '@arco-design/web-react/icon';

import ExamQuestionManager from './components/ExamQuestionManager';
import {getAllSubjects} from '../Subject/api';
import {getCategoriesBySubjectId} from '../Category/api';
import {ExamDto, ExamQueryDto, ExamStatus, FormRef, PaginationConfig, StatusOption} from './types';
import { DataManager } from '../../components/DataManager';
import FilterForm from '@/components/FilterForm';
import { FormFieldConfig } from '@/components/types/types';
import renderDate from '@/utils/timeUtil';

const {TextArea} = Input;
const {Row, Col} = Grid;

 function ExamManager(): React.ReactElement {
    const navigate = useNavigate();
    // 表格数据与状态
    const [tableData, setTableData] = useState<ExamDto[]>([]);
    const [tableLoading, setTableLoading] = useState<boolean>(false);
    const [tableScrollHeight, setTableScrollHeight] = useState<number>(420);

    // 搜索条件
    const [searchParams, setSearchParams] = useState({
        name: '',
        status: '',
    });

    // 对话框状态
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

    // 左侧树相关状态
    const [treeData, setTreeData] = useState<any[]>([]);
    const [filteredTreeData, setFilteredTreeData] = useState<any[]>([]);
    const [treeLoading, setTreeLoading] = useState(false);
    const [selectedTreeNode, setSelectedTreeNode] = useState<any>(null);
    const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [currentTreeNode, setCurrentTreeNode] = useState<any>(null);

    // 表单引用
    const filterFormRef = useRef<any>(null);

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
            render: (value, record) => (
                <Link
                    style={{ textDecoration: 'underline' }}
                    onClick={() => handleManageQuestions(record)}
                >
                    {value}
                </Link>
            ),
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
            title: '题目数量',
            dataIndex: 'questionNum',
            width: 100,
            align: 'center',
            render: (value) => (
                <span>{value || 0}题</span>
            ),
        },
        {
            title: '创建时间',
            dataIndex: 'createDate',
            width: 170,
            render: (value: string) => renderDate(value),
        },
        {
            title: '操作',
            width: 120,
            align: 'center',
            fixed: 'right',
            render: (_, record) => (
                <Space size="medium" className="table-btn-group">
                    {record.status === 'PUBLISHED' && (
                        <Tooltip content="开始考试">
                            <Button
                                type="text"
                                size="small"
                                icon={<IconEye />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleMenuClick('start', e, record);
                                }}
                            />
                        </Tooltip>
                    )}
                    {record.status === 'DRAFT' && (
                        <Tooltip content="发布">
                            <Button
                                type="text"
                                size="small"
                                icon={<IconPublic />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleMenuClick('publish', e, record);
                                }}
                            />
                        </Tooltip>
                    )}
                    <Popconfirm
                        title="确认删除该试卷吗？"
                        onOk={(e) => {
                            if (e) e.stopPropagation();
                            handleMenuClick('delete', e as React.MouseEvent, record);
                        }}
                    >
                        <Tooltip content="删除">
                            <Button
                                type="text"
                                size="small"
                                status="danger"
                                icon={<IconDelete />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                            />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // 获取表格数据
    const fetchTableData = async (
        params: any = searchParams,
        pageSize: number = pagination.pageSize,
        current: number = pagination.current,
        subjectId?: number
    ): Promise<void> => {
        setTableLoading(true);
        try {
            const targetParams: ExamQueryDto = {
                keyWord: params?.name,
                status: params?.status,
                pageNum: current - 1,
                pageSize: pageSize,
                subjectId: subjectId !== undefined ? subjectId : currentTreeNode?.subjectId,
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

    // 搜索处理
    const handleSearch = (values: any) => {
        const filterValues = Object.fromEntries(
            Object.entries(values).filter(([_, v]) => v !== '' && v !== undefined)
        );
        setSearchParams((prev) => ({ ...prev, ...filterValues }));
        setPagination((prev) => ({ ...prev, current: 1 }));
        // 保留当前选中的学科过滤
        fetchTableData(filterValues, pagination.pageSize, 1, currentTreeNode?.subjectId);
    };

    // 分页变化
    const handlePaginationChange = (nextPagination: any) => {
        fetchTableData(searchParams, nextPagination.pageSize, nextPagination.current, currentTreeNode?.subjectId);
    };

    // 获取学科树（只加载subject节点）
    const fetchSubjectCategoryTree = async () => {
        try {
            setTreeLoading(true);
            const response = await getAllSubjects();
            if (response.data) {
                const treeData = response.data.map((subject: any) => ({
                    key: `subject-${subject.id}`,
                    title: subject.name,
                    subjectId: subject.id,
                    categoryId: null,
                }));
                setTreeData(treeData);
                setFilteredTreeData(treeData);
                setExpandedKeys(treeData.map((item: any) => item.key));
            }
        } catch (error) {
            console.error('获取学科树失败:', error);
            Message.error('获取学科树失败');
        } finally {
            setTreeLoading(false);
        }
    };

    const findNodeInTree = (treeData: any[], key: string) => {
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

    const findNodeInTreeRecursive = (children: any[], key: string, parent: any) => {
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

    // 搜索过滤树数据
    const filterTreeData = (data: any[], keyword: string) => {
        if (!keyword) return data;

        const filterNode = (node: any) => {
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
    const handleSearchChange = (value: string) => {
        setSearchKeyword(value);
        const filtered = filterTreeData(treeData, value);
        setFilteredTreeData(filtered);

        if (value) {
            const getAllKeys = (nodes: any[]) => {
                let keys: string[] = [];
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
            setExpandedKeys(treeData.map((item: any) => item.key));
        }
    };

    // 处理菜单点击
    const handleMenuClick = async (key: string, e: React.MouseEvent, record: ExamDto): Promise<void> => {
        e.stopPropagation();
        setCurrentRecord(record);

        switch (key) {
            case 'detail':
                navigate(`/frame/exam/detail/${record.id}`);
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
                navigate(`/frame/exam/take/${record.id}`);
                break;
            case 'delete':
                await handleDeleteConfirm();
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

    // 确认删除
    const handleDeleteConfirm = async (): Promise<void> => {
        try {
            await deleteExam(currentRecord.id);
            Message.success('试卷删除成功');
            setDeleteModalVisible(false);
            fetchTableData(searchParams, pagination.pageSize, Math.max(1, pagination.current - 1));
        } catch (error) {
            Message.error('试卷删除失败');
        }
    };

    // 计算表格高度的函数
    const calculateTableHeight = () => {
        const windowHeight = window.innerHeight;
        const otherElementsHeight = 250;
        const newHeight = Math.max(200, windowHeight - otherElementsHeight);
        setTableScrollHeight(newHeight);
    };

    // 初始化数据
    useEffect(() => {
        fetchTableData(searchParams);
        fetchSubjectCategoryTree();
        calculateTableHeight();
        const handleResize = () => calculateTableHeight();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    // 搜索表单字段配置
    const searchFormFields: FormFieldConfig[] = [
        {
            field: 'name',
            label: '名称',
            type: 'input',
            placeholder: '请输入试卷名称',
            span: 6,
        },
        {
            field: 'status',
            label: '状态',
            type: 'select',
            placeholder: '请选择试卷状态',
            options: statusOptions,
            span: 6,
            allowClear: true,
        },
    ];

    const filterContent = (
        <FilterForm
            ref={filterFormRef}
            formFields={searchFormFields}
            onSearch={handleSearch}
        />
    );

    return (
        <div className="exam-manager">
            <DataManager
                data={tableData}
                loading={tableLoading}
                pagination={pagination}
                onPaginationChange={handlePaginationChange}
                actions={{ onAdd: openSmartGenerateModal }}
                config={{
                    displayMode: 'table',
                    showModeToggle: false,
                    tableColumns: columns,
                    filterContent,
                    showTree: true,
                    treeContent: (
                        <div style={{height: '100%'}} className="tree-container">
                            <div style={{paddingBottom: '12px'}}>
                                <Input.Search
                                    placeholder="搜索学科"
                                    allowClear
                                    style={{width: '100%'}}
                                    value={searchKeyword}
                                    onChange={handleSearchChange}
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
                                                    setCurrentTreeNode(nodeInfo);
                                                    // 重置搜索条件和分页，按学科过滤
                                                    const emptyParams = { name: '', status: '' };
                                                    setSearchParams(emptyParams);
                                                    setPagination(prev => ({ ...prev, current: 1 }));
                                                    if (nodeInfo) {
                                                        fetchTableData(emptyParams, pagination.pageSize, 1, nodeInfo.subjectId);
                                                    } else {
                                                        fetchTableData(emptyParams, pagination.pageSize, 1);
                                                    }
                                                } else {
                                                    setSelectedTreeNode(null);
                                                    setCurrentTreeNode(null);
                                                    // 清空树选择时，也重置搜索条件
                                                    const emptyParams = { name: '', status: '' };
                                                    setSearchParams(emptyParams);
                                                    setPagination(prev => ({ ...prev, current: 1 }));
                                                    fetchTableData(emptyParams, pagination.pageSize, 1);
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
                    tableProps: {
                        onRow: (record) => ({
                            onClick: () => navigate(`/frame/exam/detail/${record.id}`),
                            style: { cursor: 'pointer' }
                        }),
                        scroll: { x: '100%' }
                    }
                }}
                tableScrollHeight={tableScrollHeight}
            />

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
            </div>
        );
    }

export default ExamManager;
