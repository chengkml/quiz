import React, { useRef, useState } from 'react';
import { Button, Drawer, Link, Message, Tag, Tooltip, Popconfirm } from '@arco-design/web-react';
import { IconDelete, IconArchive, IconRefresh, IconEdit } from '@arco-design/web-react/icon';
import ReactMarkdown from 'react-markdown';
import DataManager from '@/components/DataManager';
import FilterForm from '@/components/FilterForm';
import { FormFieldConfig } from '@/components/types/types';
import renderDate from '@/utils/timeUtil';
import AddEditModal from './components/AddEditModal';
import {
    archivePoetry,
    deletePoetry,
    getPoetryList,
    PoetryCardDto,
    resetPoetry,
} from './api';
import './style/index.less';

const PoetryPage: React.FC = () => {
    const filterFormRef = useRef<any>(null);

    const [visible, setVisible] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<PoetryCardDto | null>(null);
    const [detailVisible, setDetailVisible] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [tableData, setTableData] = useState<PoetryCardDto[]>([]);
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

    const [searchParams, setSearchParams] = useState({
        keyword: '',
        archived: undefined,
    });

    const searchFormFields: FormFieldConfig[] = [
        {
            field: 'keyword',
            label: '关键词',
            type: 'input',
            placeholder: '搜索标题、作者或正文...',
            span: 8,
        },
        {
            field: 'archived',
            label: '状态',
            type: 'select',
            placeholder: '全部',
            options: [
                { label: '全部', value: '' },
                { label: '未归档', value: false },
                { label: '已归档', value: true },
            ],
            span: 6,
            allowClear: true,
            onChange: (value: any) => {
                handleSearch({ ...searchParams, archived: value });
            },
        },
    ];

    React.useEffect(() => {
        loadTableData();
    }, [refreshKey, pagination.current, pagination.pageSize, JSON.stringify(searchParams)]);

    React.useEffect(() => {
        const calculateTableHeight = () => {
            const windowHeight = window.innerHeight;
            const otherElementsHeight = 330;
            const newHeight = Math.max(100, windowHeight - otherElementsHeight);
            setTableScrollHeight((prev) => (prev === newHeight ? prev : newHeight));
        };

        calculateTableHeight();
    }, []);

    const loadTableData = async (params = searchParams) => {
        try {
            setTableLoading(true);
            const queryParams: any = {
                page: pagination.current - 1,
                size: pagination.pageSize,
            };

            if (params.keyword?.trim()) {
                queryParams.keyword = params.keyword.trim();
            }
            if (params.archived !== '' && params.archived !== undefined) {
                queryParams.archived = params.archived;
            }

            const res = await getPoetryList(queryParams);
            setTableData(res.data.content || []);
            setPagination((prev) => ({
                ...prev,
                current: typeof res.data.number === 'number' ? res.data.number + 1 : prev.current,
                pageSize: typeof res.data.size === 'number' ? res.data.size : prev.pageSize,
                total: res.data.totalElements || 0,
            }));
        } catch (error) {
            Message.error('加载数据失败');
        } finally {
            setTableLoading(false);
        }
    };

    const handlePaginationChange = (newPagination: any) => {
        setPagination(newPagination);
    };

    const handleSearch = (values: any) => {
        const filterValues = Object.fromEntries(
            Object.entries(values).filter(([_, v]) => v !== '' && v !== undefined && v !== null)
        );
        setSearchParams(filterValues as any);
        setPagination((prev) => ({ ...prev, current: 1 }));
        loadTableData(filterValues as any);
    };

    const handleReset = () => {
        const defaultParams = { keyword: '', archived: undefined };
        setSearchParams(defaultParams);
        setPagination((prev) => ({ ...prev, current: 1 }));
        filterFormRef.current?.resetFields?.();
        loadTableData(defaultParams);
    };

    const handleAdd = () => {
        setCurrentRecord(null);
        setVisible(true);
    };

    const handleEdit = (record: PoetryCardDto) => {
        setCurrentRecord(record);
        setVisible(true);
    };

    const handleDetail = (record: PoetryCardDto) => {
        setCurrentRecord(record);
        setDetailVisible(true);
    };

    const handleDelete = async (record: PoetryCardDto) => {
        try {
            await deletePoetry(record.id);
            Message.success('删除成功');
            setRefreshKey((prev) => prev + 1);
        } catch (error: any) {
            Message.error(error.response?.data?.message || '删除失败');
        }
    };

    const handleArchive = async (record: PoetryCardDto) => {
        try {
            await archivePoetry(record.id, !record.archived);
            Message.success(record.archived ? '已取消归档' : '已归档');
            setRefreshKey((prev) => prev + 1);
        } catch (error: any) {
            Message.error(error.response?.data?.message || '操作失败');
        }
    };

    const handleResetCard = async (record: PoetryCardDto) => {
        try {
            await resetPoetry(record.id);
            Message.success('重置成功');
            setRefreshKey((prev) => prev + 1);
        } catch (error: any) {
            Message.error(error.response?.data?.message || '重置失败');
        }
    };

    const filterContent = (
        <FilterForm
            ref={filterFormRef}
            formFields={searchFormFields}
            onSearch={handleSearch}
            onReset={handleReset}
        />
    );

    const columns = [
        {
            title: '标题',
            dataIndex: 'title',
            width: 200,
            render: (title: string, record: PoetryCardDto) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Link onClick={() => handleDetail(record)} style={{ textDecoration: 'underline' }}>
                        <strong>{title}</strong>
                    </Link>
                    {record.archived && <Tag color="gray">已归档</Tag>}
                </div>
            ),
        },
        {
            title: '作者',
            dataIndex: 'author',
            width: 120,
            render: (value: string) => value || '-',
        },
        {
            title: '朝代',
            dataIndex: 'dynasty',
            width: 100,
            render: (value: string) => value || '-',
        },
        {
            title: '最近更新',
            dataIndex: 'updateDate',
            width: 180,
            render: (value: string) => (value ? renderDate(value) : '-'),
        },
        {
            title: '操作',
            width: 180,
            fixed: 'right' as const,
            align: 'center' as const,
            render: (_: any, record: PoetryCardDto) => (
                <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
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
                    <Tooltip content="重置">
                        <Popconfirm
                            title="确认重置学习状态吗？"
                            onOk={() => handleResetCard(record)}
                            onCancel={(e) => e?.stopPropagation?.()}
                        >
                            <Button
                                type="text"
                                size="small"
                                status="warning"
                                icon={<IconRefresh />}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </Popconfirm>
                    </Tooltip>
                    <Tooltip content={record.archived ? '取消归档' : '归档'}>
                        <Popconfirm
                            title={record.archived ? '确认取消归档吗？' : '确认归档该诗词吗？'}
                            onOk={() => handleArchive(record)}
                            onCancel={(e) => e?.stopPropagation?.()}
                        >
                            <Button
                                type="text"
                                size="small"
                                icon={<IconArchive />}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </Popconfirm>
                    </Tooltip>
                    <Tooltip content="删除">
                        <Popconfirm
                            title={`确认删除诗词 "${record.title}" 吗？`}
                            onOk={() => handleDelete(record)}
                            onCancel={(e) => e?.stopPropagation?.()}
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
                </div>
            ),
        },
    ];

    return (
        <div className="poetry-manager">
            <DataManager
                key={refreshKey}
                data={tableData}
                loading={tableLoading}
                pagination={pagination}
                onPaginationChange={handlePaginationChange}
                tableScrollHeight={tableScrollHeight}
                actions={{
                    onAdd: handleAdd,
                }}
                config={{
                    showModeToggle: false,
                    displayMode: 'table',
                    filterContent,
                    tableColumns: columns,
                }}
            />

            <AddEditModal
                visible={visible}
                record={currentRecord}
                onOk={() => {
                    setVisible(false);
                    setRefreshKey((prev) => prev + 1);
                }}
                onCancel={() => setVisible(false)}
            />

            <Drawer
                title={currentRecord?.title ? `诗词详情 - ${currentRecord.title}` : '诗词详情'}
                visible={detailVisible}
                width={640}
                onCancel={() => setDetailVisible(false)}
                footer={null}
                bodyStyle={{ padding: '12px 16px 0', overflow: 'auto' }}
            >
                <div className="poetry-meta">
                    <div><strong>作者：</strong>{currentRecord?.author || '-'}</div>
                    <div><strong>朝代：</strong>{currentRecord?.dynasty || '-'}</div>
                </div>
                <div className="poetry-content">{currentRecord?.content || '无正文'}</div>
                <div className="md-preview" style={{ marginBottom: 0 }}>
                    <ReactMarkdown>{currentRecord?.mdAnalysis || '无赏析'}</ReactMarkdown>
                </div>
            </Drawer>
        </div>
    );
};

export default PoetryPage;
