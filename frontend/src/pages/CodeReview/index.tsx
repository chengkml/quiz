import React, { useEffect, useRef, useState } from 'react';
import {
    Button,
    Empty,
    Form,
    Input,
    Message,
    Modal,
    Pagination,
    Popconfirm,
    Select,
    Table,
    Tag,
    Tooltip,
} from '@arco-design/web-react';
import {
    IconCheckCircle,
    IconDelete,
    IconEdit,
    IconEye,
    IconLaunch,
    IconPlayArrow,
    IconRefresh,
} from '@arco-design/web-react/icon';
import DataManager from '@/components/DataManager';
import FilterForm from '@/components/FilterForm';
import { FormFieldConfig } from '@/components/types/types';
import renderDate from '@/utils/timeUtil';
import {
    completeCodeReviewTask,
    convertToRequirement,
    createCodeReviewIssue,
    createCodeReviewTask,
    deleteCodeReviewIssue,
    deleteCodeReviewTask,
    getCodeReviewIssueList,
    getCodeReviewTaskById,
    getCodeReviewTaskHistoryOptions,
    getCodeReviewTaskList,
    startCodeReviewTask,
    updateCodeReviewIssue,
    updateCodeReviewTask,
} from './api';
import './style/index.less';

const { Option } = Select;
const { TextArea } = Input;

const DEFAULT_BRANCH = 'main';
const DEFAULT_REVIEW_STANDARD = 'DUOWENSPEC';

type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED';
type IssueSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type IssueStatus = 'OPEN' | 'TRIAGED' | 'CONVERTED' | 'RESOLVED' | 'IGNORED';

interface TaskRecord {
    id: string;
    title: string;
    projectName?: string;
    gitUrl?: string;
    branch?: string;
    targetPage: string;
    reviewStandard?: string;
    descr?: string;
    status: TaskStatus;
    createDate?: string;
}

interface IssueRecord {
    id: string;
    taskId?: string;
    title: string;
    projectName?: string;
    moduleName?: string;
    filePath?: string;
    lineNo?: number;
    severity?: IssueSeverity;
    status?: IssueStatus;
    source?: string;
    issueDetail?: string;
    suggestion?: string;
    requirementId?: string;
    createDate?: string;
}

function CodeReviewPage() {
    const [tableData, setTableData] = useState<TaskRecord[]>([]);
    const [tableLoading, setTableLoading] = useState(false);
    const [tableScrollHeight, setTableScrollHeight] = useState(420);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0,
        showTotal: true,
        showJumper: true,
        showPageSize: true,
    });

    const [searchParams, setSearchParams] = useState<any>({});
    const [historyOptions, setHistoryOptions] = useState<{
        projectNames: string[];
        gitUrls: string[];
        branches: string[];
    }>({
        projectNames: [],
        gitUrls: [],
        branches: [],
    });

    const [currentTask, setCurrentTask] = useState<TaskRecord | null>(null);
    const [currentIssue, setCurrentIssue] = useState<IssueRecord | null>(null);

    const [taskModalVisible, setTaskModalVisible] = useState(false);
    const [taskModalMode, setTaskModalMode] = useState<'create' | 'edit'>('create');
    const [detailVisible, setDetailVisible] = useState(false);
    const [issueModalVisible, setIssueModalVisible] = useState(false);
    const [issueModalMode, setIssueModalMode] = useState<'create' | 'edit'>('create');

    const [taskDescr, setTaskDescr] = useState('');
    const [issueDetailValue, setIssueDetailValue] = useState('');
    const [issueSuggestionValue, setIssueSuggestionValue] = useState('');

    const [issueTableData, setIssueTableData] = useState<IssueRecord[]>([]);
    const [issueLoading, setIssueLoading] = useState(false);
    const [issuePagination, setIssuePagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0,
    });

    const taskFormRef = useRef<any>(null);
    const issueFormRef = useRef<any>(null);
    const filterFormRef = useRef<any>(null);

    const severityOptions = [
        { label: '低', value: 'LOW' },
        { label: '中', value: 'MEDIUM' },
        { label: '高', value: 'HIGH' },
        { label: '严重', value: 'CRITICAL' },
    ];

    const issueStatusOptions = [
        { label: '待处理', value: 'OPEN' },
        { label: '已分拣', value: 'TRIAGED' },
        { label: '已转需求', value: 'CONVERTED' },
        { label: '已解决', value: 'RESOLVED' },
        { label: '忽略', value: 'IGNORED' },
    ];

    const taskStatusOptions = [
        { label: '待处理', value: 'OPEN' },
        { label: '处理中', value: 'IN_PROGRESS' },
        { label: '已完成', value: 'COMPLETED' },
        { label: '已关闭', value: 'CLOSED' },
    ];

    const severityColor: Record<string, string> = {
        LOW: 'arcoblue',
        MEDIUM: 'orange',
        HIGH: 'orangered',
        CRITICAL: 'red',
    };

    const issueStatusColor: Record<string, string> = {
        OPEN: 'blue',
        TRIAGED: 'purple',
        CONVERTED: 'green',
        RESOLVED: 'gray',
        IGNORED: 'gray',
    };

    const taskStatusColor: Record<string, string> = {
        OPEN: 'blue',
        IN_PROGRESS: 'orange',
        COMPLETED: 'green',
        CLOSED: 'gray',
    };

    const projectNameFilterOptions = historyOptions.projectNames.map((item) => ({
        label: item,
        value: item,
    }));

    const renderSelectOptions = (values: string[]) => values.map((item) => (
        <Option key={item} value={item}>
            {item}
        </Option>
    ));

    const branchOptions = historyOptions.branches.includes(DEFAULT_BRANCH)
        ? historyOptions.branches
        : [DEFAULT_BRANCH, ...historyOptions.branches];

    const fetchHistoryOptions = async () => {
        try {
            const response = await getCodeReviewTaskHistoryOptions();
            const data = response?.data || {};
            setHistoryOptions({
                projectNames: Array.isArray(data.projectNames) ? data.projectNames : [],
                gitUrls: Array.isArray(data.gitUrls) ? data.gitUrls : [],
                branches: Array.isArray(data.branches) ? data.branches : [],
            });
        } catch {
            setHistoryOptions({ projectNames: [], gitUrls: [], branches: [] });
        }
    };

    const fetchTableData = async (
        params: any = searchParams,
        pageSize: number = pagination.pageSize,
        current: number = pagination.current,
    ) => {
        setTableLoading(true);
        try {
            const query = {
                ...params,
                pageNum: current,
                pageSize,
            };
            const response = await getCodeReviewTaskList(query);
            const data = response?.data || {};
            setTableData(data.content || []);
            setPagination((prev) => ({
                ...prev,
                current,
                pageSize,
                total: data.totalElements || 0,
            }));
        } catch {
            Message.error('获取评审任务列表失败');
        } finally {
            setTableLoading(false);
        }
    };

    const fetchTaskDetail = async (taskId: string) => {
        const response = await getCodeReviewTaskById(taskId);
        setCurrentTask((response?.data || null) as TaskRecord | null);
    };

    const fetchIssueData = async (
        taskId: string,
        current: number = issuePagination.current,
        pageSize: number = issuePagination.pageSize,
    ) => {
        setIssueLoading(true);
        try {
            const response = await getCodeReviewIssueList({
                taskId,
                pageNum: Math.max(current - 1, 0),
                pageSize,
            });
            const data = response?.data || {};
            setIssueTableData(data.content || []);
            setIssuePagination((prev) => ({
                ...prev,
                current,
                pageSize,
                total: data.totalElements || 0,
            }));
        } catch {
            Message.error('获取审核明细失败');
        } finally {
            setIssueLoading(false);
        }
    };

    useEffect(() => {
        fetchHistoryOptions();
        fetchTableData();
    }, []);

    useEffect(() => {
        const calcHeight = () => {
            const h = Math.max(320, window.innerHeight - 260);
            setTableScrollHeight(h);
        };
        calcHeight();
        window.addEventListener('resize', calcHeight);
        return () => window.removeEventListener('resize', calcHeight);
    }, []);

    const refreshCurrentTask = async (taskId?: string) => {
        const targetId = taskId || currentTask?.id;
        if (!targetId) {
            return;
        }
        await Promise.all([
            fetchTaskDetail(targetId),
            fetchIssueData(targetId, issuePagination.current, issuePagination.pageSize),
        ]);
        fetchTableData(searchParams, pagination.pageSize, pagination.current);
    };

    const handleSearch = (values: any) => {
        const filtered = Object.fromEntries(Object.entries(values).filter(([_, v]) => v !== '' && v !== null && v !== undefined));
        setSearchParams(filtered);
        setPagination((prev) => ({ ...prev, current: 1 }));
        fetchTableData(filtered, pagination.pageSize, 1);
    };

    const handleReset = () => {
        const defaults = {};
        setSearchParams(defaults);
        setPagination((prev) => ({ ...prev, current: 1 }));
        fetchTableData(defaults, pagination.pageSize, 1);
    };

    const handlePaginationChange = (nextPagination: any) => {
        fetchTableData(searchParams, nextPagination.pageSize, nextPagination.current);
    };

    const openCreateTaskModal = async () => {
        await fetchHistoryOptions();
        setCurrentTask(null);
        setTaskModalMode('create');
        setTaskDescr('');
        setTaskModalVisible(true);
        setTimeout(() => {
            taskFormRef.current?.resetFields?.();
            taskFormRef.current?.setFieldsValue?.({
                branch: DEFAULT_BRANCH,
                reviewStandard: DEFAULT_REVIEW_STANDARD,
                status: 'OPEN',
                descr: '',
            });
        }, 50);
    };

    const openEditTaskModal = async (record: TaskRecord) => {
        await fetchHistoryOptions();
        setCurrentTask(record);
        setTaskModalMode('edit');
        setTaskDescr(record?.descr || '');
        setTaskModalVisible(true);
        setTimeout(() => {
            taskFormRef.current?.setFieldsValue?.({
                ...record,
            });
        }, 50);
    };

    const handleTaskModalOk = async () => {
        try {
            const values = await taskFormRef.current?.validate?.();
            const payload = {
                ...values,
                descr: taskDescr,
                branch: values?.branch || DEFAULT_BRANCH,
                reviewStandard: values?.reviewStandard || DEFAULT_REVIEW_STANDARD,
                status: values?.status || 'OPEN',
            };
            if (taskModalMode === 'create') {
                await createCodeReviewTask(payload);
                Message.success('评审任务创建成功');
            } else {
                await updateCodeReviewTask({
                    ...payload,
                    id: currentTask?.id,
                });
                Message.success('评审任务更新成功');
            }
            setTaskModalVisible(false);
            fetchTableData(searchParams, pagination.pageSize, pagination.current);
            if (currentTask?.id) {
                refreshCurrentTask(currentTask.id);
            }
        } catch (e: any) {
            if (e?.fields) return;
            Message.error(taskModalMode === 'create' ? '评审任务创建失败' : '评审任务更新失败');
        }
    };

    const handleDeleteTask = async (record: TaskRecord) => {
        try {
            await deleteCodeReviewTask(record.id);
            Message.success('评审任务删除成功');
            fetchTableData(searchParams, pagination.pageSize, pagination.current);
            if (detailVisible && currentTask?.id === record.id) {
                setDetailVisible(false);
                setCurrentTask(null);
                setIssueTableData([]);
            }
        } catch (e: any) {
            Message.error(e?.response?.data?.message || '评审任务删除失败');
        }
    };

    const handleStartTask = async (record: TaskRecord) => {
        try {
            await startCodeReviewTask(record.id);
            Message.success('任务已开始处理');
            fetchTableData(searchParams, pagination.pageSize, pagination.current);
            if (detailVisible && currentTask?.id === record.id) {
                refreshCurrentTask(record.id);
            }
        } catch (e: any) {
            Message.error(e?.response?.data?.message || '任务开始处理失败');
        }
    };

    const handleCompleteTask = async (record: TaskRecord) => {
        try {
            await completeCodeReviewTask(record.id);
            Message.success('任务已完成');
            fetchTableData(searchParams, pagination.pageSize, pagination.current);
            if (detailVisible && currentTask?.id === record.id) {
                refreshCurrentTask(record.id);
            }
        } catch (e: any) {
            Message.error(e?.response?.data?.message || '任务完成失败');
        }
    };

    const openTaskDetail = async (record: TaskRecord) => {
        setDetailVisible(true);
        setCurrentTask(record);
        setIssueTableData([]);
        setIssuePagination((prev) => ({ ...prev, current: 1 }));
        try {
            await Promise.all([
                fetchTaskDetail(record.id),
                fetchIssueData(record.id, 1, issuePagination.pageSize),
            ]);
        } catch {
            Message.error('加载任务详情失败');
        }
    };

    const openCreateIssueModal = () => {
        if (!currentTask?.id) {
            Message.warning('请先选择评审任务');
            return;
        }
        setCurrentIssue(null);
        setIssueModalMode('create');
        setIssueDetailValue('');
        setIssueSuggestionValue('');
        setIssueModalVisible(true);
        setTimeout(() => {
            issueFormRef.current?.resetFields?.();
            issueFormRef.current?.setFieldsValue?.({
                taskId: currentTask.id,
                projectName: currentTask.projectName,
                severity: 'MEDIUM',
                status: 'OPEN',
                source: 'OPENCLAW',
                issueDetail: '',
                suggestion: '',
            });
        }, 50);
    };

    const openEditIssueModal = (record: IssueRecord) => {
        setCurrentIssue(record);
        setIssueModalMode('edit');
        setIssueDetailValue(record?.issueDetail || '');
        setIssueSuggestionValue(record?.suggestion || '');
        setIssueModalVisible(true);
        setTimeout(() => {
            issueFormRef.current?.setFieldsValue?.({
                ...record,
                taskId: record.taskId || currentTask?.id,
            });
        }, 50);
    };

    const handleIssueModalOk = async () => {
        if (!currentTask?.id) {
            Message.warning('缺少任务上下文，无法保存审核明细');
            return;
        }
        try {
            const values = await issueFormRef.current?.validate?.();
            const payload = {
                ...values,
                taskId: currentTask.id,
                projectName: values?.projectName || currentTask.projectName,
                issueDetail: issueDetailValue,
                suggestion: issueSuggestionValue,
                severity: values?.severity || 'MEDIUM',
                status: values?.status || 'OPEN',
                source: values?.source || 'OPENCLAW',
            };
            if (issueModalMode === 'create') {
                await createCodeReviewIssue(payload);
                Message.success('审核明细创建成功');
            } else {
                await updateCodeReviewIssue({
                    ...payload,
                    id: currentIssue?.id,
                });
                Message.success('审核明细更新成功');
            }
            setIssueModalVisible(false);
            fetchIssueData(currentTask.id, issuePagination.current, issuePagination.pageSize);
        } catch (e: any) {
            if (e?.fields) return;
            Message.error(issueModalMode === 'create' ? '审核明细创建失败' : '审核明细更新失败');
        }
    };

    const handleDeleteIssue = async (record: IssueRecord) => {
        try {
            await deleteCodeReviewIssue(record.id);
            Message.success('审核明细删除成功');
            if (currentTask?.id) {
                fetchIssueData(currentTask.id, issuePagination.current, issuePagination.pageSize);
            }
        } catch {
            Message.error('审核明细删除失败');
        }
    };

    const handleConvertIssue = async (record: IssueRecord) => {
        try {
            await convertToRequirement(record.id);
            Message.success('已转为需求');
            if (currentTask?.id) {
                fetchIssueData(currentTask.id, issuePagination.current, issuePagination.pageSize);
            }
        } catch (e: any) {
            Message.error(e?.response?.data?.message || '转需求失败');
        }
    };

    const taskColumns = [
        {
            title: '任务标题',
            dataIndex: 'title',
            width: 240,
            ellipsis: true,
            render: (value: string, record: TaskRecord) => (
                <button type="button" className="code-review-link-button" onClick={() => openTaskDetail(record)}>
                    {value || '-'}
                </button>
            ),
        },
        { title: '项目名称', dataIndex: 'projectName', width: 140, render: (v: string) => v || '-' },
        {
            title: '目标页面',
            dataIndex: 'targetPage',
            width: 220,
            ellipsis: true,
            render: (v: string) => v || '-',
        },
        { title: '分支', dataIndex: 'branch', width: 120, render: (v: string) => v || '-' },
        {
            title: '评审规范',
            dataIndex: 'reviewStandard',
            width: 140,
            render: (v: string) => <Tag color="arcoblue">{v || DEFAULT_REVIEW_STANDARD}</Tag>,
        },
        {
            title: '状态',
            dataIndex: 'status',
            width: 120,
            render: (v: string) => <Tag color={taskStatusColor[v] || 'gray'}>{v}</Tag>,
        },
        {
            title: '创建时间',
            dataIndex: 'createDate',
            width: 180,
            render: (v: string) => (v ? renderDate(v) : '-'),
        },
        {
            title: '操作',
            width: 240,
            fixed: 'right' as const,
            render: (_: any, record: TaskRecord) => (
                <div className="code-review-actions-inline">
                    <Tooltip content="查看详情">
                        <Button type="text" size="small" icon={<IconEye />} onClick={() => openTaskDetail(record)} />
                    </Tooltip>
                    <Tooltip content="编辑任务">
                        <Button type="text" size="small" icon={<IconEdit />} onClick={() => openEditTaskModal(record)} />
                    </Tooltip>
                    <Tooltip content="开始处理">
                        <Button
                            type="text"
                            size="small"
                            icon={<IconPlayArrow />}
                            disabled={record.status !== 'OPEN'}
                            onClick={() => handleStartTask(record)}
                        />
                    </Tooltip>
                    <Tooltip content="标记完成">
                        <Button
                            type="text"
                            size="small"
                            icon={<IconCheckCircle />}
                            disabled={record.status !== 'IN_PROGRESS'}
                            onClick={() => handleCompleteTask(record)}
                        />
                    </Tooltip>
                    <Popconfirm title="确认删除该评审任务吗？" onOk={() => handleDeleteTask(record)}>
                        <Tooltip content="删除任务">
                            <Button type="text" size="small" status="danger" icon={<IconDelete />} />
                        </Tooltip>
                    </Popconfirm>
                </div>
            ),
        },
    ];

    const issueColumns = [
        {
            title: '问题标题',
            dataIndex: 'title',
            width: 220,
            ellipsis: true,
        },
        {
            title: '文件',
            dataIndex: 'filePath',
            width: 220,
            ellipsis: true,
            render: (v: string) => v || '-',
        },
        {
            title: '行号',
            dataIndex: 'lineNo',
            width: 80,
            render: (v: number) => v ?? '-',
        },
        {
            title: '级别',
            dataIndex: 'severity',
            width: 100,
            render: (v: string) => <Tag color={severityColor[v] || 'gray'}>{v || '-'}</Tag>,
        },
        {
            title: '状态',
            dataIndex: 'status',
            width: 110,
            render: (v: string) => <Tag color={issueStatusColor[v] || 'gray'}>{v || '-'}</Tag>,
        },
        {
            title: '需求ID',
            dataIndex: 'requirementId',
            width: 180,
            render: (v: string) => v || '-',
        },
        {
            title: '创建时间',
            dataIndex: 'createDate',
            width: 180,
            render: (v: string) => (v ? renderDate(v) : '-'),
        },
        {
            title: '操作',
            width: 180,
            fixed: 'right' as const,
            render: (_: any, record: IssueRecord) => (
                <div className="code-review-actions-inline">
                    <Tooltip content="转需求">
                        <Button
                            type="text"
                            size="small"
                            icon={<IconLaunch />}
                            disabled={!!record.requirementId}
                            onClick={() => handleConvertIssue(record)}
                        />
                    </Tooltip>
                    <Tooltip content="编辑明细">
                        <Button type="text" size="small" icon={<IconEdit />} onClick={() => openEditIssueModal(record)} />
                    </Tooltip>
                    <Popconfirm title="确认删除该审核明细吗？" onOk={() => handleDeleteIssue(record)}>
                        <Tooltip content="删除明细">
                            <Button type="text" size="small" status="danger" icon={<IconDelete />} />
                        </Tooltip>
                    </Popconfirm>
                </div>
            ),
        },
    ];

    const searchFormFields: FormFieldConfig[] = [
        { field: 'keyWord', label: '关键词', type: 'input', placeholder: '任务标题 / 页面 / 分支', span: 8 },
        {
            field: 'projectName',
            label: '项目名',
            type: 'select',
            placeholder: '请选择项目名',
            options: projectNameFilterOptions,
            span: 6,
            allowClear: true,
            showSearch: true,
        },
        {
            field: 'status',
            label: '状态',
            type: 'select',
            options: taskStatusOptions,
            span: 6,
            allowClear: true,
        },
    ];

    const filterContent = (
        <FilterForm
            ref={filterFormRef}
            formFields={searchFormFields}
            onSearch={handleSearch}
            onReset={handleReset}
        />
    );

    const renderTaskForm = () => (
        <Form ref={taskFormRef} layout="vertical">
            <Form.Item field="title" label="任务标题" rules={[{ required: true, message: '请输入任务标题' }]}>
                <Input placeholder="例如：Quiz 首页代码审核" />
            </Form.Item>
            <Form.Item field="projectName" label="项目名称">
                <Select placeholder="请选择或输入项目名称" showSearch allowClear allowCreate>
                    {renderSelectOptions(historyOptions.projectNames)}
                </Select>
            </Form.Item>
            <Form.Item field="gitUrl" label="Git 仓库地址">
                <Select placeholder="请选择或输入 Git 仓库地址" showSearch allowClear allowCreate>
                    {renderSelectOptions(historyOptions.gitUrls)}
                </Select>
            </Form.Item>
            <Form.Item field="branch" label="分支名称" initialValue={DEFAULT_BRANCH}>
                <Select placeholder="请选择或输入分支名称" showSearch allowClear allowCreate>
                    {renderSelectOptions(branchOptions)}
                </Select>
            </Form.Item>
            <Form.Item field="targetPage" label="目标页面" rules={[{ required: true, message: '请输入目标页面' }]}>
                <Input placeholder="例如：/frame/code-review" />
            </Form.Item>
            <Form.Item field="reviewStandard" label="评审规范" initialValue={DEFAULT_REVIEW_STANDARD}>
                <Select placeholder="请选择或输入评审规范" showSearch allowClear allowCreate>
                    <Option value={DEFAULT_REVIEW_STANDARD}>{DEFAULT_REVIEW_STANDARD}</Option>
                </Select>
            </Form.Item>
            <Form.Item field="descr" label="任务描述">
                <TextArea
                    autoSize={{ minRows: 4, maxRows: 8 }}
                    placeholder="补充本次代码审核任务背景、范围和重点关注项"
                    value={taskDescr}
                    onChange={(value) => {
                        setTaskDescr(value);
                        taskFormRef.current?.setFieldsValue?.({ descr: value });
                    }}
                />
            </Form.Item>
            <Form.Item field="status" label="状态" initialValue="OPEN">
                <Select placeholder="请选择状态">
                    {taskStatusOptions.map((item) => (
                        <Option key={item.value} value={item.value}>{item.label}</Option>
                    ))}
                </Select>
            </Form.Item>
        </Form>
    );

    const renderIssueForm = () => (
        <Form ref={issueFormRef} layout="vertical">
            <Form.Item field="title" label="问题标题" rules={[{ required: true, message: '请输入问题标题' }]}>
                <Input placeholder="例如：接口错误未透出" />
            </Form.Item>
            <Form.Item field="projectName" label="项目名">
                <Input placeholder="默认沿用任务项目名" />
            </Form.Item>
            <Form.Item field="moduleName" label="模块名">
                <Input placeholder="例如：frontend/code-review" />
            </Form.Item>
            <Form.Item field="filePath" label="文件路径">
                <Input placeholder="例如：frontend/src/pages/CodeReview/index.tsx" />
            </Form.Item>
            <Form.Item field="lineNo" label="行号">
                <Input type="number" placeholder="可选" />
            </Form.Item>
            <Form.Item field="severity" label="严重级别" initialValue="MEDIUM">
                <Select placeholder="请选择严重级别">
                    {severityOptions.map((item) => (
                        <Option key={item.value} value={item.value}>{item.label}</Option>
                    ))}
                </Select>
            </Form.Item>
            <Form.Item field="status" label="状态" initialValue="OPEN">
                <Select placeholder="请选择状态">
                    {issueStatusOptions.map((item) => (
                        <Option key={item.value} value={item.value}>{item.label}</Option>
                    ))}
                </Select>
            </Form.Item>
            <Form.Item field="source" label="来源" initialValue="OPENCLAW">
                <Input placeholder="OPENCLAW" />
            </Form.Item>
            <Form.Item field="issueDetail" label="问题描述">
                <TextArea
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    placeholder="请描述审核发现的问题"
                    value={issueDetailValue}
                    onChange={(value) => {
                        setIssueDetailValue(value);
                        issueFormRef.current?.setFieldsValue?.({ issueDetail: value });
                    }}
                />
            </Form.Item>
            <Form.Item field="suggestion" label="修复建议">
                <TextArea
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    placeholder="建议如何修复"
                    value={issueSuggestionValue}
                    onChange={(value) => {
                        setIssueSuggestionValue(value);
                        issueFormRef.current?.setFieldsValue?.({ suggestion: value });
                    }}
                />
            </Form.Item>
        </Form>
    );

    return (
        <div className="code-review-page">
            <DataManager
                data={tableData}
                loading={tableLoading}
                pagination={pagination}
                onPaginationChange={handlePaginationChange}
                actions={{ onAdd: openCreateTaskModal }}
                config={{
                    displayMode: 'table',
                    showModeToggle: false,
                    filterContent,
                    tableColumns: taskColumns,
                    tableProps: {
                        rowKey: 'id',
                        scroll: { x: 1600, y: tableScrollHeight },
                    },
                }}
                tableScrollHeight={tableScrollHeight}
            />

            <Modal
                title={taskModalMode === 'create' ? '新增代码审核任务' : '编辑代码审核任务'}
                visible={taskModalVisible}
                onOk={handleTaskModalOk}
                onCancel={() => {
                    setTaskModalVisible(false);
                    setTaskDescr('');
                }}
                unmountOnExit
                style={{ width: 760 }}
                bodyStyle={{ maxHeight: '80vh', overflowY: 'auto' }}
            >
                {renderTaskForm()}
            </Modal>

            <Modal
                title={currentTask?.title ? `审核任务详情 - ${currentTask.title}` : '审核任务详情'}
                visible={detailVisible}
                footer={null}
                onCancel={() => {
                    setDetailVisible(false);
                    setCurrentTask(null);
                    setIssueTableData([]);
                }}
                style={{ width: 1180 }}
                bodyStyle={{ maxHeight: '82vh', overflowY: 'auto' }}
            >
                {currentTask ? (
                    <div className="code-review-detail">
                        <div className="code-review-detail-card">
                            <div className="code-review-detail-head">
                                <div>
                                    <div className="code-review-detail-title">{currentTask.title}</div>
                                    <div className="code-review-detail-subtitle">
                                        <Tag color={taskStatusColor[currentTask.status] || 'gray'}>{currentTask.status}</Tag>
                                        <Tag color="arcoblue">{currentTask.reviewStandard || DEFAULT_REVIEW_STANDARD}</Tag>
                                    </div>
                                </div>
                                <div className="code-review-detail-actions">
                                    <Button
                                        icon={<IconPlayArrow />}
                                        disabled={currentTask.status !== 'OPEN'}
                                        onClick={() => handleStartTask(currentTask)}
                                    >
                                        开始处理
                                    </Button>
                                    <Button
                                        type="primary"
                                        status="success"
                                        icon={<IconCheckCircle />}
                                        disabled={currentTask.status !== 'IN_PROGRESS'}
                                        onClick={() => handleCompleteTask(currentTask)}
                                    >
                                        标记完成
                                    </Button>
                                    <Button icon={<IconEdit />} onClick={() => openEditTaskModal(currentTask)}>
                                        编辑任务
                                    </Button>
                                    <Button icon={<IconRefresh />} onClick={() => refreshCurrentTask(currentTask.id)}>
                                        刷新
                                    </Button>
                                </div>
                            </div>

                            <div className="code-review-task-meta-grid">
                                <div className="code-review-meta-item">
                                    <div className="label">项目名称</div>
                                    <div className="value">{currentTask.projectName || '-'}</div>
                                </div>
                                <div className="code-review-meta-item">
                                    <div className="label">Git 仓库</div>
                                    <div className="value">{currentTask.gitUrl || '-'}</div>
                                </div>
                                <div className="code-review-meta-item">
                                    <div className="label">分支</div>
                                    <div className="value">{currentTask.branch || '-'}</div>
                                </div>
                                <div className="code-review-meta-item code-review-meta-item-highlight">
                                    <div className="label">目标页面</div>
                                    <div className="value">{currentTask.targetPage || '-'}</div>
                                </div>
                            </div>

                            <div className="code-review-descr-block">
                                <div className="label">任务描述</div>
                                <div className="value pre-wrap">{currentTask.descr || '-'}</div>
                            </div>
                        </div>

                        <div className="code-review-detail-card">
                            <div className="code-review-issue-head">
                                <div className="code-review-section-title">审核明细</div>
                                <Button type="primary" onClick={openCreateIssueModal}>新增审核明细</Button>
                            </div>

                            <Table
                                rowKey="id"
                                columns={issueColumns}
                                data={issueTableData}
                                loading={issueLoading}
                                pagination={false}
                                scroll={{ x: 1400, y: 420 }}
                            />

                            {issueTableData.length === 0 && !issueLoading && (
                                <div className="code-review-empty-wrap">
                                    <Empty description="该任务下暂无审核明细" />
                                </div>
                            )}

                            <div className="code-review-pagination-wrap">
                                <Pagination
                                    current={issuePagination.current}
                                    pageSize={issuePagination.pageSize}
                                    total={issuePagination.total}
                                    showTotal
                                    showJumper
                                    showPageSize
                                    onChange={(page, pageSize) => {
                                        if (!currentTask?.id) return;
                                        fetchIssueData(currentTask.id, page, pageSize || issuePagination.pageSize);
                                    }}
                                    onPageSizeChange={(pageSize) => {
                                        if (!currentTask?.id) return;
                                        fetchIssueData(currentTask.id, 1, pageSize);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <Empty description="暂无任务详情" />
                )}
            </Modal>

            <Modal
                title={issueModalMode === 'create' ? '新增审核明细' : '编辑审核明细'}
                visible={issueModalVisible}
                onOk={handleIssueModalOk}
                onCancel={() => {
                    setIssueModalVisible(false);
                    setIssueDetailValue('');
                    setIssueSuggestionValue('');
                }}
                unmountOnExit
                style={{ width: 760 }}
                bodyStyle={{ maxHeight: '80vh', overflowY: 'auto' }}
            >
                {renderIssueForm()}
            </Modal>
        </div>
    );
}

export default CodeReviewPage;
