import React, { useEffect, useRef, useState } from 'react';
import {
    Button,
    Form,
    Input,
    Message,
    Modal,
    Popconfirm,
    Select,
    Tag,
    Tooltip,
} from '@arco-design/web-react';
import { IconEdit, IconDelete, IconLaunch } from '@arco-design/web-react/icon';
import DataManager from '@/components/DataManager';
import FilterForm from '@/components/FilterForm';
import { FormFieldConfig } from '@/components/types/types';
import renderDate from '@/utils/timeUtil';
import {
    createCodeReviewIssue,
    deleteCodeReviewIssue,
    getCodeReviewIssueList,
    updateCodeReviewIssue,
    convertToRequirement,
} from './api';
import './style/index.less';

const { Option } = Select;
const { TextArea } = Input;

function CodeReviewPage() {
    const [tableData, setTableData] = useState<any[]>([]);
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
    const [currentRecord, setCurrentRecord] = useState<any | null>(null);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const addFormRef = useRef<any>(null);
    const editFormRef = useRef<any>(null);
    const filterFormRef = useRef<any>(null);

    const severityOptions = [
        { label: '低', value: 'LOW' },
        { label: '中', value: 'MEDIUM' },
        { label: '高', value: 'HIGH' },
        { label: '严重', value: 'CRITICAL' },
    ];

    const statusOptions = [
        { label: '待处理', value: 'OPEN' },
        { label: '已分拣', value: 'TRIAGED' },
        { label: '已转需求', value: 'CONVERTED' },
        { label: '已解决', value: 'RESOLVED' },
        { label: '忽略', value: 'IGNORED' },
    ];

    const fetchTableData = async (params: any = searchParams, pageSize = pagination.pageSize, current = pagination.current) => {
        setTableLoading(true);
        try {
            const query = {
                ...params,
                pageNum: current,
                pageSize,
            };
            const response = await getCodeReviewIssueList(query);
            const data = response?.data || {};
            setTableData(data.content || []);
            setPagination((prev) => ({
                ...prev,
                current,
                pageSize,
                total: data.totalElements || 0,
            }));
        } catch (e) {
            Message.error('获取评审问题列表失败');
        } finally {
            setTableLoading(false);
        }
    };

    useEffect(() => {
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

    const handleAdd = () => {
        setCurrentRecord(null);
        setAddModalVisible(true);
        setTimeout(() => addFormRef.current?.resetFields?.(), 50);
    };

    const handleAddConfirm = async () => {
        try {
            const values = await addFormRef.current?.validate?.();
            await createCodeReviewIssue(values);
            Message.success('创建成功');
            setAddModalVisible(false);
            fetchTableData();
        } catch (e: any) {
            if (e?.fields) return;
            Message.error('创建失败');
        }
    };

    const handleEdit = (record: any) => {
        setCurrentRecord(record);
        setEditModalVisible(true);
        setTimeout(() => editFormRef.current?.setFieldsValue?.(record), 50);
    };

    const handleEditConfirm = async () => {
        try {
            const values = await editFormRef.current?.validate?.();
            await updateCodeReviewIssue({ ...values, id: currentRecord.id });
            Message.success('更新成功');
            setEditModalVisible(false);
            fetchTableData();
        } catch (e: any) {
            if (e?.fields) return;
            Message.error('更新失败');
        }
    };

    const handleDelete = async (record: any) => {
        try {
            await deleteCodeReviewIssue(record.id);
            Message.success('删除成功');
            fetchTableData();
        } catch (e) {
            Message.error('删除失败');
        }
    };

    const handleConvert = async (record: any) => {
        try {
            await convertToRequirement(record.id);
            Message.success('已转为需求');
            fetchTableData();
        } catch (e: any) {
            Message.error(e?.response?.data?.message || '转需求失败');
        }
    };

    const severityColor: Record<string, string> = {
        LOW: 'arcoblue',
        MEDIUM: 'orange',
        HIGH: 'orangered',
        CRITICAL: 'red',
    };

    const statusColor: Record<string, string> = {
        OPEN: 'blue',
        TRIAGED: 'purple',
        CONVERTED: 'green',
        RESOLVED: 'gray',
        IGNORED: 'gray',
    };

    const columns = [
        { title: '标题', dataIndex: 'title', width: 220, ellipsis: true },
        { title: '项目', dataIndex: 'projectName', width: 120 },
        { title: '模块', dataIndex: 'moduleName', width: 120 },
        { title: '文件', dataIndex: 'filePath', width: 220, ellipsis: true },
        { title: '行号', dataIndex: 'lineNo', width: 80 },
        {
            title: '级别',
            dataIndex: 'severity',
            width: 100,
            render: (v: string) => <Tag color={severityColor[v] || 'gray'}>{v}</Tag>,
        },
        {
            title: '状态',
            dataIndex: 'status',
            width: 110,
            render: (v: string) => <Tag color={statusColor[v] || 'gray'}>{v}</Tag>,
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
            render: (v: string) => renderDate(v),
        },
        {
            title: '操作',
            width: 180,
            fixed: 'right',
            render: (_: any, record: any) => (
                <div style={{ display: 'flex', gap: 8 }}>
                    <Tooltip content="转需求">
                        <Button
                            type="text"
                            size="small"
                            icon={<IconLaunch />}
                            disabled={!!record.requirementId}
                            onClick={() => handleConvert(record)}
                        />
                    </Tooltip>
                    <Tooltip content="编辑">
                        <Button type="text" size="small" icon={<IconEdit />} onClick={() => handleEdit(record)} />
                    </Tooltip>
                    <Popconfirm title="确认删除该问题吗？" onOk={() => handleDelete(record)}>
                        <Tooltip content="删除">
                            <Button type="text" size="small" status="danger" icon={<IconDelete />} />
                        </Tooltip>
                    </Popconfirm>
                </div>
            ),
        },
    ];

    const searchFormFields: FormFieldConfig[] = [
        { field: 'keyWord', label: '关键词', type: 'input', placeholder: '标题/项目/模块/文件', span: 8 },
        { field: 'projectName', label: '项目', type: 'input', placeholder: '项目名', span: 6 },
        { field: 'moduleName', label: '模块', type: 'input', placeholder: '模块名', span: 6 },
        { field: 'status', label: '状态', type: 'select', options: statusOptions, span: 4, allowClear: true },
    ];

    const filterContent = (
        <FilterForm
            ref={filterFormRef}
            formFields={searchFormFields}
            onSearch={handleSearch}
            onReset={handleReset}
        />
    );

    const renderIssueForm = (formRef: React.MutableRefObject<any>) => (
        <Form ref={formRef} layout="vertical">
            <Form.Item field="title" label="问题标题" rules={[{ required: true, message: '请输入问题标题' }]}>
                <Input placeholder="例如：向量检索结果为空" />
            </Form.Item>
            <Form.Item field="projectName" label="项目名">
                <Input placeholder="quiz" />
            </Form.Item>
            <Form.Item field="moduleName" label="模块名">
                <Input placeholder="knowledgeset" />
            </Form.Item>
            <Form.Item field="filePath" label="文件路径">
                <Input placeholder="backend/src/main/java/..." />
            </Form.Item>
            <Form.Item field="lineNo" label="行号">
                <Input type="number" placeholder="可选" />
            </Form.Item>
            <Form.Item field="severity" label="严重级别" initialValue="MEDIUM">
                <Select allowClear placeholder="选择级别">
                    {severityOptions.map((it) => (
                        <Option key={it.value} value={it.value}>{it.label}</Option>
                    ))}
                </Select>
            </Form.Item>
            <Form.Item field="status" label="状态" initialValue="OPEN">
                <Select allowClear placeholder="选择状态">
                    {statusOptions.map((it) => (
                        <Option key={it.value} value={it.value}>{it.label}</Option>
                    ))}
                </Select>
            </Form.Item>
            <Form.Item field="source" label="来源" initialValue="OPENCLAW">
                <Input placeholder="OPENCLAW" />
            </Form.Item>
            <Form.Item field="issueDetail" label="问题描述">
                <TextArea autoSize={{ minRows: 3, maxRows: 8 }} placeholder="评审发现的问题详情" />
            </Form.Item>
            <Form.Item field="suggestion" label="修复建议">
                <TextArea autoSize={{ minRows: 3, maxRows: 8 }} placeholder="建议如何修改" />
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
                actions={{ onAdd: handleAdd }}
                config={{
                    displayMode: 'table',
                    showModeToggle: false,
                    filterContent,
                    tableColumns: columns,
                    tableProps: {
                        rowKey: 'id',
                        scroll: { x: 1600, y: tableScrollHeight },
                    },
                }}
                tableScrollHeight={tableScrollHeight}
            />

            <Modal
                title="新增评审问题"
                visible={addModalVisible}
                onOk={handleAddConfirm}
                onCancel={() => setAddModalVisible(false)}
                unmountOnExit
                style={{ width: 760 }}
            >
                {renderIssueForm(addFormRef)}
            </Modal>

            <Modal
                title="编辑评审问题"
                visible={editModalVisible}
                onOk={handleEditConfirm}
                onCancel={() => setEditModalVisible(false)}
                unmountOnExit
                style={{ width: 760 }}
            >
                {renderIssueForm(editFormRef)}
            </Modal>
        </div>
    );
}

export default CodeReviewPage;
