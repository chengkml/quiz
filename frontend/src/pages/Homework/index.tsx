import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Button,
    Form,
    Input,
    Message,
    Modal,
    Popconfirm,
    Select,
    Space,
    Tag,
    Tooltip,
} from '@arco-design/web-react';
import {
    IconDelete,
    IconEdit,
    IconRobot,
} from '@arco-design/web-react/icon';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DataManager from '@/components/DataManager';
import FilterForm from '@/components/FilterForm';
import { FormFieldConfig } from '@/components/types/types';
import renderDate from '@/utils/timeUtil';
import {
    createHomework,
    deleteHomework,
    generateTodos,
    getHomeworkList,
    HomeworkCreateDto,
    HomeworkDto,
    HomeworkUpdateDto,
    updateHomework,
} from './api';
import './style/index.less';

const { Option } = Select;

const STATUS_OPTIONS = [
    { label: '未开始', value: 'NOT_STARTED', color: 'gray' },
    { label: '进行中', value: 'IN_PROGRESS', color: 'blue' },
    { label: '已完成', value: 'COMPLETED', color: 'green' },
];

const getStatusLabel = (status: string) => {
    return STATUS_OPTIONS.find((o) => o.value === status)?.label || status;
};
const getStatusColor = (status: string) => {
    return STATUS_OPTIONS.find((o) => o.value === status)?.color || 'gray';
};

const buildContentPreview = (content?: string) => {
    if (!content) {
        return '-';
    }
    const plainText = content
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/[`*_>#~\-|]/g, ' ')
        .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
    if (!plainText) {
        return '-';
    }
    return plainText.length > 80 ? `${plainText.slice(0, 80)}...` : plainText;
};

const HomeworkPage: React.FC = () => {
    const pageRef = useRef<HTMLDivElement | null>(null);

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<HomeworkDto[]>([]);
    const [tableScrollHeight, setTableScrollHeight] = useState(420);

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0,
        showTotal: true,
        showJumper: true,
        showPageSize: true,
    });

    const [searchParams, setSearchParams] = useState<{ title?: string; status?: string }>({});
    const filterFormRef = useRef<any>(null);

    // Edit / Create modal
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<HomeworkDto | null>(null);
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);
    const [mdContent, setMdContent] = useState('');

    // Detail view modal
    const [detailVisible, setDetailVisible] = useState(false);
    const [detailItem, setDetailItem] = useState<HomeworkDto | null>(null);

    // AI generate todos
    const [generatingId, setGeneratingId] = useState<string | null>(null);

    const fetchData = useCallback(
        async (
            params: { title?: string; status?: string } = searchParams,
            pageSize: number = pagination.pageSize,
            current: number = pagination.current
        ) => {
            setLoading(true);
            try {
                const query: any = {
                    pageNum: current - 1,
                    pageSize,
                    ...params,
                };
                if (query.title === '') {
                    delete query.title;
                }
                if (query.status === '') {
                    delete query.status;
                }

                const res: any = await getHomeworkList(query);
                const page = res?.data || res;
                setData(page?.content || []);
                setPagination((prev) => ({
                    ...prev,
                    current,
                    pageSize,
                    total: page?.totalElements || 0,
                }));
            } catch (e: any) {
                Message.error(e?.message || '加载失败');
            } finally {
                setLoading(false);
            }
        },
        [searchParams, pagination.current, pagination.pageSize]
    );

    useEffect(() => {
        fetchData(searchParams, pagination.pageSize, pagination.current);
    }, []);

    const handleAdd = () => {
        setEditingItem(null);
        form.resetFields();
        setMdContent('');
        form.setFieldValue('content', '');
        setEditModalVisible(true);
    };

    const handleEdit = (record: HomeworkDto) => {
        const nextContent = record.content || '';
        setEditingItem(record);
        setMdContent(nextContent);
        form.setFieldsValue({
            title: record.title,
            content: nextContent,
            status: record.status,
        });
        setEditModalVisible(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteHomework(id);
            Message.success('删除成功');
            fetchData();
        } catch (e: any) {
            Message.error(e?.message || '删除失败');
        }
    };

    const handleCloseEditModal = () => {
        setEditModalVisible(false);
        setEditingItem(null);
        form.resetFields();
        setMdContent('');
    };

    const handleSave = async () => {
        const values = await form.validate();
        setSaving(true);
        try {
            if (editingItem) {
                const dto: HomeworkUpdateDto = { id: editingItem.id, ...values };
                await updateHomework(dto);
                Message.success('更新成功');
            } else {
                const dto: HomeworkCreateDto = { ...values };
                await createHomework(dto);
                Message.success('创建成功');
            }
            handleCloseEditModal();
            fetchData();
        } catch (e: any) {
            Message.error(e?.message || '保存失败');
        } finally {
            setSaving(false);
        }
    };

    const handleGenerateTodos = async (id: string) => {
        setGeneratingId(id);
        try {
            const res: any = await generateTodos(id);
            Message.success(res?.data || res || 'AI 生成待办成功');
        } catch (e: any) {
            Message.error(e?.message || 'AI 生成待办失败');
        } finally {
            setGeneratingId(null);
        }
    };

    const handleRowClick = (record: HomeworkDto) => {
        setDetailItem(record);
        setDetailVisible(true);
    };

    const handleSearch = (values: { title?: string; status?: string }) => {
        const cleaned = Object.fromEntries(
            Object.entries(values).filter(([, value]) => value !== '' && value !== undefined && value !== null)
        ) as { title?: string; status?: string };
        setSearchParams(cleaned);
        fetchData(cleaned, pagination.pageSize, 1);
    };

    const handleReset = () => {
        const defaults = {};
        setSearchParams(defaults);
        fetchData(defaults, pagination.pageSize, 1);
    };

    const handlePaginationChange = (nextPagination: any) => {
        fetchData(searchParams, nextPagination.pageSize, nextPagination.current);
    };

    const searchFormFields: FormFieldConfig[] = [
        {
            field: 'title',
            label: '标题',
            type: 'input',
            placeholder: '请输入作业标题',
            span: 8,
        },
        {
            field: 'status',
            label: '状态',
            type: 'select',
            options: STATUS_OPTIONS,
            placeholder: '请选择状态',
            span: 8,
            allowClear: true,
        },
    ];

    const filterContent = (
        <FilterForm
            ref={filterFormRef}
            formFields={searchFormFields}
            initialValues={{ title: '', status: '' }}
            onSearch={handleSearch}
            onReset={handleReset}
        />
    );

    const columns = [
        {
            title: '标题',
            dataIndex: 'title',
            ellipsis: true,
            width: 220,
        },
        {
            title: '状态',
            dataIndex: 'status',
            width: 100,
            render: (status: string) => (
                <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
            ),
        },
        {
            title: '内容摘要',
            dataIndex: 'content',
            ellipsis: true,
            render: (content: string) => (
                <span style={{ color: 'var(--color-text-2)', fontSize: 13 }}>
                    {buildContentPreview(content)}
                </span>
            ),
        },
        {
            title: '创建人',
            dataIndex: 'createUserName',
            width: 100,
        },
        {
            title: '创建时间',
            dataIndex: 'createDate',
            width: 160,
            render: (v) => renderDate(v),
        },
        {
            title: '操作',
            fixed: 'right' as const,
            width: 160,
            render: (_: any, record: HomeworkDto) => (
                <Space>
                    <Tooltip content="AI 生成待办">
                        <Button
                            type="text"
                            size="small"
                            icon={<IconRobot />}
                            loading={generatingId === record.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateTodos(record.id);
                            }}
                        />
                    </Tooltip>
                    <Tooltip content="编辑">
                        <Button
                            type="text"
                            size="small"
                            icon={<IconEdit />}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(record);
                            }}
                        />
                    </Tooltip>
                    <Tooltip content="删除">
                        <Popconfirm
                            title="确认删除该作业吗？"
                            onOk={() => handleDelete(record.id)}
                        >
                            <Button
                                type="text"
                                size="small"
                                status="danger"
                                icon={<IconDelete />}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const calculateTableScrollHeight = useCallback(() => {
        const container = pageRef.current;
        if (!container) {
            return;
        }

        const content = container.querySelector('.data-manager-content') as HTMLElement | null;
        let nextHeight = 420;

        if (content && content.clientHeight > 0) {
            nextHeight = Math.max(260, content.clientHeight - 20);
        } else {
            const header = container.querySelector('.data-manager-header') as HTMLElement | null;
            const footer = container.querySelector('.data-manager-footer') as HTMLElement | null;
            const occupiedHeight = (header?.offsetHeight || 0) + (footer?.offsetHeight || 0) + 28;
            nextHeight = Math.max(260, container.clientHeight - occupiedHeight);
        }

        setTableScrollHeight((prev) => (prev === nextHeight ? prev : nextHeight));
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => calculateTableScrollHeight(), 0);
        const onResize = () => calculateTableScrollHeight();
        window.addEventListener('resize', onResize);

        let observer: ResizeObserver | null = null;
        if (pageRef.current && 'ResizeObserver' in window) {
            observer = new ResizeObserver(() => calculateTableScrollHeight());
            observer.observe(pageRef.current);
        }

        return () => {
            window.clearTimeout(timer);
            window.removeEventListener('resize', onResize);
            observer?.disconnect();
        };
    }, [calculateTableScrollHeight]);

    useEffect(() => {
        const timer = window.setTimeout(() => calculateTableScrollHeight(), 0);
        return () => window.clearTimeout(timer);
    }, [data.length, pagination.current, pagination.pageSize, calculateTableScrollHeight]);

    return (
        <div className="homework-manager" ref={pageRef}>
            <DataManager
                data={data}
                loading={loading}
                pagination={pagination}
                onPaginationChange={handlePaginationChange}
                actions={{
                    onAdd: handleAdd,
                }}
                config={{
                    showModeToggle: false,
                    displayMode: 'table',
                    filterContent,
                    tableColumns: columns,
                    tableProps: {
                        onRow: (record: HomeworkDto) => ({
                            onClick: () => handleRowClick(record),
                            style: { cursor: 'pointer' },
                        }),
                        scroll: { x: 900, y: tableScrollHeight },
                    },
                }}
                tableScrollHeight={tableScrollHeight}
            />

            {/* 编辑/新建 Modal */}
            <Modal
                title={editingItem ? '编辑作业' : '新建作业'}
                visible={editModalVisible}
                onCancel={handleCloseEditModal}
                footer={
                    <Space>
                        <Button onClick={handleCloseEditModal}>取消</Button>
                        <Button type="primary" loading={saving} onClick={handleSave}>
                            保存
                        </Button>
                    </Space>
                }
                style={{ width: 720 }}
                maskClosable={false}
            >
                <div className="homework-edit-modal-body">
                    <Form form={form} layout="vertical">
                        <Form.Item label="标题" field="title">
                            <Input placeholder="留空则自动生成标题" allowClear />
                        </Form.Item>
                        <Form.Item label="状态" field="status" initialValue="NOT_STARTED">
                            <Select placeholder="请选择状态">
                                {STATUS_OPTIONS.map((o) => (
                                    <Option key={o.value} value={o.value}>
                                        {o.label}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item label="内容（Markdown）" field="content">
                            <div className="homework-edit-modal-editor" data-color-mode="light">
                                <MDEditor
                                    value={mdContent}
                                    onChange={(val) => {
                                        const nextContent = val || '';
                                        setMdContent(nextContent);
                                        form.setFieldValue('content', nextContent);
                                    }}
                                    height={380}
                                    preview="live"
                                />
                            </div>
                        </Form.Item>
                    </Form>
                </div>
            </Modal>

            {/* 详情 Modal */}
            <Modal
                title={detailItem?.title || '作业详情'}
                visible={detailVisible}
                onCancel={() => setDetailVisible(false)}
                footer={
                    <Space>
                        <Button
                            type="primary"
                            icon={<IconRobot />}
                            loading={generatingId === detailItem?.id}
                            onClick={() => detailItem && handleGenerateTodos(detailItem.id)}
                        >
                            AI 生成待办
                        </Button>
                        <Button
                            icon={<IconEdit />}
                            onClick={() => {
                                setDetailVisible(false);
                                if (detailItem) handleEdit(detailItem);
                            }}
                        >
                            编辑
                        </Button>
                        <Button onClick={() => setDetailVisible(false)}>关闭</Button>
                    </Space>
                }
                style={{ width: 700 }}
            >
                {detailItem && (
                    <div>
                        <Space style={{ marginBottom: 12 }}>
                            <Tag color={getStatusColor(detailItem.status)}>{getStatusLabel(detailItem.status)}</Tag>
                            <span style={{ color: 'var(--color-text-3)', fontSize: 12 }}>
                                创建时间：{renderDate(detailItem.createDate)}
                            </span>
                            {detailItem.createUserName && (
                                <span style={{ color: 'var(--color-text-3)', fontSize: 12 }}>
                                    创建人：{detailItem.createUserName}
                                </span>
                            )}
                        </Space>
                        <div className="md-preview md-detail-preview">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {detailItem.content || '（暂无内容）'}
                            </ReactMarkdown>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default HomeworkPage;
