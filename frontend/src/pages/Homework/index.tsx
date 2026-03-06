import React, { useCallback, useEffect, useState } from 'react';
import {
    Button,
    Drawer,
    Form,
    Input,
    Message,
    Modal,
    Popconfirm,
    Select,
    Space,
    Spin,
    Table,
    Tag,
    Tooltip,
} from '@arco-design/web-react';
import {
    IconDelete,
    IconEdit,
    IconRobot,
    IconPlus,
    IconSearch,
} from '@arco-design/web-react/icon';
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

const { TextArea } = Input;
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

const HomeworkPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<HomeworkDto[]>([]);
    const [total, setTotal] = useState(0);
    const [pageNum, setPageNum] = useState(0);
    const [pageSize] = useState(20);

    // Search
    const [searchTitle, setSearchTitle] = useState('');

    // Edit / Create drawer
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<HomeworkDto | null>(null);
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);

    // Detail view modal
    const [detailVisible, setDetailVisible] = useState(false);
    const [detailItem, setDetailItem] = useState<HomeworkDto | null>(null);

    // AI generate todos
    const [generatingId, setGeneratingId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res: any = await getHomeworkList({
                title: searchTitle || undefined,
                pageNum,
                pageSize,
            });
            const page = res?.data || res;
            setData(page?.content || []);
            setTotal(page?.totalElements || 0);
        } catch (e: any) {
            Message.error(e?.message || '加载失败');
        } finally {
            setLoading(false);
        }
    }, [searchTitle, pageNum, pageSize]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAdd = () => {
        setEditingItem(null);
        form.resetFields();
        setDrawerVisible(true);
    };

    const handleEdit = (record: HomeworkDto) => {
        setEditingItem(record);
        form.setFieldsValue({
            title: record.title,
            content: record.content,
            status: record.status,
        });
        setDrawerVisible(true);
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
            setDrawerVisible(false);
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
                    {content ? content.slice(0, 80) + (content.length > 80 ? '...' : '') : '-'}
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

    return (
        <div className="homework-manager" style={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* 搜索栏 */}
            <div style={{ display: 'flex', gap: 8, background: '#fff', padding: '12px 16px', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                <Input
                    style={{ width: 220 }}
                    prefix={<IconSearch />}
                    placeholder="搜索标题"
                    value={searchTitle}
                    onChange={setSearchTitle}
                    onPressEnter={() => { setPageNum(0); fetchData(); }}
                    allowClear
                />
                <Button type="primary" icon={<IconSearch />} onClick={() => { setPageNum(0); fetchData(); }}>
                    搜索
                </Button>
                <div style={{ flex: 1 }} />
                <Button type="primary" icon={<IconPlus />} onClick={handleAdd}>
                    新建作业
                </Button>
            </div>

            {/* 表格 */}
            <div style={{ flex: 1, overflow: 'auto', background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                <Table
                    loading={loading}
                    columns={columns}
                    data={data}
                    rowKey="id"
                    pagination={{
                        total,
                        current: pageNum + 1,
                        pageSize,
                        showTotal: true,
                        onChange: (page) => setPageNum(page - 1),
                    }}
                    onRow={(record) => ({
                        onClick: () => handleRowClick(record),
                        style: { cursor: 'pointer' },
                    })}
                    scroll={{ x: 900 }}
                />
            </div>

            {/* 编辑/新建 Drawer */}
            <Drawer
                title={editingItem ? '编辑作业' : '新建作业'}
                visible={drawerVisible}
                onCancel={() => setDrawerVisible(false)}
                footer={
                    <Space>
                        <Button onClick={() => setDrawerVisible(false)}>取消</Button>
                        <Button type="primary" loading={saving} onClick={handleSave}>
                            保存
                        </Button>
                    </Space>
                }
                width={640}
            >
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
                        <TextArea
                            placeholder="请输入作业内容（支持 Markdown 格式）"
                            autoSize={{ minRows: 12, maxRows: 30 }}
                        />
                    </Form.Item>
                </Form>
            </Drawer>

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
                        <div
                            style={{
                                background: 'var(--color-fill-2)',
                                borderRadius: 6,
                                padding: 16,
                                minHeight: 120,
                                maxHeight: 500,
                                overflowY: 'auto',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                fontSize: 14,
                                lineHeight: 1.8,
                            }}
                        >
                            {detailItem.content || '（暂无内容）'}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default HomeworkPage;
