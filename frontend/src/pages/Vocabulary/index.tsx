import React, { useRef, useState } from 'react';
import { Button, Drawer, Link, Message, Tag, Tooltip, Popconfirm } from '@arco-design/web-react';
import { IconDelete, IconArchive, IconRefresh, IconEdit, IconPlayArrow } from '@arco-design/web-react/icon';
import DataManager from '@/components/DataManager';
import FilterForm from '@/components/FilterForm';
import AddEditModal from './components/AddEditModal';
import ReviewPage from './Review';
import { FormFieldConfig } from '@/components/types/types';
import { 
    VocabularyCardDto, 
    getVocabularyList, 
    deleteVocabulary, 
    archiveVocabulary, 
    resetVocabulary
} from './api';
import renderDate from '@/utils/timeUtil';
import ReactMarkdown from 'react-markdown';
import './style/index.less';

/**
 * 单词管理页面
 */
const VocabularyPage: React.FC = () => {
    const filterFormRef = useRef<any>(null);
    
    const [visible, setVisible] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<VocabularyCardDto | null>(null);
    const [detailVisible, setDetailVisible] = useState(false);
    const [reviewVisible, setReviewVisible] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [tableData, setTableData] = useState<VocabularyCardDto[]>([]);
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
    
    // 搜索参数
    const [searchParams, setSearchParams] = useState({
        keyword: '',
        archived: undefined,
    });

    // 搜索表单配置
    const searchFormFields: FormFieldConfig[] = [
        {
            field: 'keyword',
            label: '关键词',
            type: 'input',
            placeholder: '搜索单词或释义...',
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
            onChange: (value: any, allValues: any) => {
                // Select 变化时立即触发搜索
                handleSearch({ ...searchParams, archived: value });
            },
        },
    ];

    React.useEffect(() => {
        loadTableData();
    }, [refreshKey, pagination.current, pagination.pageSize, JSON.stringify(searchParams)]);

    // 计算表格高度自适应
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
            
            // 添加搜索条件
            if (params.keyword?.trim()) {
                queryParams.keyword = params.keyword.trim();
            }
            if (params.archived !== '' && params.archived !== undefined) {
                queryParams.archived = params.archived;
            }
            
            const res = await getVocabularyList(queryParams);
            setTableData(res.data.content || []);
            setPagination(prev => ({
                ...prev,
                current: typeof res.data.number === 'number' ? res.data.number + 1 : prev.current,
                pageSize: typeof res.data.size === 'number' ? res.data.size : prev.pageSize,
                total: res.data.totalElements || 0,
            }));
        } catch (error) {
            console.error('加载数据失败:', error);
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
        setPagination(prev => ({ ...prev, current: 1 }));
        loadTableData(filterValues as any);
    };

    const handleReset = () => {
        const defaultParams = { keyword: '', archived: undefined };
        setSearchParams(defaultParams);
        setPagination(prev => ({ ...prev, current: 1 }));
        filterFormRef.current?.resetFields?.();
        loadTableData(defaultParams);
    };

    const handleAdd = () => {
        setCurrentRecord(null);
        setVisible(true);
    };

    const handleEdit = (record: VocabularyCardDto) => {
        setCurrentRecord(record);
        setVisible(true);
    };

    const handleDetail = (record: VocabularyCardDto) => {
        setCurrentRecord(record);
        setDetailVisible(true);
    };

    const handleReviewOpen = () => {
        setReviewVisible(true);
    };

    const handleReviewClose = () => {
        setReviewVisible(false);
        setRefreshKey(prev => prev + 1);
    };

    const handleDelete = async (record: VocabularyCardDto) => {
        try {
            await deleteVocabulary(record.id);
            Message.success('删除成功');
            setRefreshKey(prev => prev + 1);
        } catch (error: any) {
            Message.error(error.response?.data?.message || '删除失败');
        }
    };

    const handleArchive = async (record: VocabularyCardDto) => {
        try {
            await archiveVocabulary(record.id, !record.archived);
            Message.success(record.archived ? '已取消归档' : '已归档');
            setRefreshKey(prev => prev + 1);
        } catch (error: any) {
            Message.error(error.response?.data?.message || '操作失败');
        }
    };

    const handleResetCard = async (record: VocabularyCardDto) => {
        try {
            await resetVocabulary(record.id);
            Message.success('重置成功');
            setRefreshKey(prev => prev + 1);
        } catch (error: any) {
            Message.error(error.response?.data?.message || '重置失败');
        }
    };

    const getRepetitionColor = (repetition: number) => {
        if (repetition === 0) return 'red';
        if (repetition <= 2) return 'orange';
        if (repetition <= 5) return 'blue';
        return 'green';
    };

    // FilterForm组件配置
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
            title: '单词',
            dataIndex: 'word',
            width: 150,
            render: (word: string, record: VocabularyCardDto) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Link 
                        onClick={() => handleDetail(record)}
                        style={{ textDecoration: 'underline' }}
                    >
                        <strong>{word}</strong>
                    </Link>
                    {record.archived && <Tag color="gray">已归档</Tag>}
                </div>
            )
        },
        {
            title: '熟练度',
            dataIndex: 'repetition',
            width: 100,
            align: 'center' as const,
            render: (n: number) => (
                <Tag color={getRepetitionColor(n)}>连对{n}次</Tag>
            )
        },
        {
            title: '下次复习',
            dataIndex: 'nextReviewDate',
            width: 180,
            ellipsis: true,
            render: (date: string) => date ? renderDate(date) : '-'
        },
        {
            title: '间隔(天)',
            dataIndex: 'interval',
            width: 100,
            align: 'center' as const
        },
        {
            title: '简易度',
            dataIndex: 'easinessFactor',
            width: 100,
            align: 'center' as const,
            render: (ef: number) => ef?.toFixed(2)
        },
        {
            title: '复习次数',
            dataIndex: 'totalReviewCount',
            width: 100,
            align: 'center' as const
        },
        {
            title: '操作',
            width: 180,
            fixed: 'right' as const,
            align: 'center' as const,
            render: (_: any, record: VocabularyCardDto) => (
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
                            title={record.archived ? '确认取消归档吗？' : '确认归档该单词吗？'}
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
                            title={`确认删除单词 "${record.word}" 吗？`}
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
            )
        }
    ];

    return (
        <div className="vocabulary-manager">
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
                actionButtons={(
                    <Button type="primary" icon={<IconPlayArrow />} onClick={handleReviewOpen}>
                        复习
                    </Button>
                )}
                config={{
                    showModeToggle: false,
                    displayMode: "table",
                    filterContent,
                    tableColumns: columns,
                }}
            />

            <AddEditModal
                visible={visible}
                record={currentRecord}
                onOk={() => {
                    setVisible(false);
                    setRefreshKey(prev => prev + 1);
                }}
                onCancel={() => setVisible(false)}
            />

            <Drawer
                title={currentRecord?.word ? `释义 - ${currentRecord.word}` : '释义'}
                visible={detailVisible}
                width={560}
                onCancel={() => setDetailVisible(false)}
                footer={null}
                bodyStyle={{ padding: '12px 16px 0', overflow: 'auto' }}
            >
                <div className="md-preview" style={{ marginBottom: 0 }}>
                    <ReactMarkdown>{currentRecord?.mdDefinition || '无释义'}</ReactMarkdown>
                </div>
            </Drawer>

            <Drawer
                title="单词复习"
                visible={reviewVisible}
                width={980}
                onCancel={handleReviewClose}
                footer={null}
                className="review-drawer"
                bodyStyle={{ padding: 0, overflow: 'hidden' }}
            >
                <ReviewPage embedded onExit={handleReviewClose} />
            </Drawer>
        </div>
    );
};

export default VocabularyPage;
