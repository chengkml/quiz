import React, { useRef, useState } from 'react';
import { Button, Link, Message, Modal, Tag, Space, Tooltip, Popconfirm } from '@arco-design/web-react';
import { IconDelete, IconArchive, IconRefresh } from '@arco-design/web-react/icon';
import DataManager from '@/components/DataManager';
import FilterForm from '@/components/FilterForm';
import AddEditModal from './components/AddEditModal';
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
    const [refreshKey, setRefreshKey] = useState(0);
    const [tableData, setTableData] = useState<VocabularyCardDto[]>([]);
    const [tableLoading, setTableLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0,
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
        },
    ];

    React.useEffect(() => {
        loadTableData();
    }, [refreshKey, pagination.current, pagination.pageSize, JSON.stringify(searchParams)]);

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

    const handleDelete = (record: VocabularyCardDto) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除单词 "${record.word}" 吗？`,
            onOk: async () => {
                try {
                    await deleteVocabulary(record.id);
                    Message.success('删除成功');
                    setRefreshKey(prev => prev + 1);
                } catch (error: any) {
                    Message.error(error.response?.data?.message || '删除失败');
                }
            }
        });
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

    const columns = [
        {
            title: '单词',
            dataIndex: 'word',
            width: 150,
            render: (word: string, record: VocabularyCardDto) => (
                <Space>
                    <Link 
                        onClick={() => handleEdit(record)}
                        style={{ textDecoration: 'underline' }}
                    >
                        <strong>{word}</strong>
                    </Link>
                    {record.archived && <Tag color="gray">已归档</Tag>}
                </Space>
            )
        },
        {
            title: 'Markdown释义',
            dataIndex: 'mdDefinition',
            ellipsis: true,
            render: (text: string) => (
                <div className="md-preview" style={{ maxHeight: 100, overflow: 'auto' }}>
                    <ReactMarkdown>{text || '无释义'}</ReactMarkdown>
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
            width: 130,
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
            title: '标签',
            dataIndex: 'tags',
            width: 150,
            render: (tags: string) => {
                if (!tags) return '-';
                return tags.split(',').map((tag, idx) => (
                    <Tag key={idx} style={{ marginRight: 4 }}>{tag}</Tag>
                ));
            }
        },
        {
            title: '扩展操作',
            width: 150,
            fixed: 'right' as const,
            align: 'center' as const,
            render: (_: any, record: VocabularyCardDto) => (
                <Space size="small">
                    <Popconfirm
                        title="确认重置"
                        content="确定要重置学习状态吗？"
                        onOk={() => handleResetCard(record)}
                    >
                        <Tooltip title="重置">
                            <Button 
                                type="text" 
                                size="small" 
                                status="warning"
                                icon={<IconRefresh />}
                            />
                        </Tooltip>
                    </Popconfirm>
                    <Tooltip title={record.archived ? '取消归档' : '归档'}>
                        <Button 
                            type="text" 
                            size="small"
                            icon={<IconArchive />}
                            onClick={() => handleArchive(record)}
                        />
                    </Tooltip>
                </Space>
            )
        }
    ];

    return (
        <div className="vocabulary-manager">
            <FilterForm
                ref={filterFormRef}
                fields={searchFormFields}
                onSearch={handleSearch}
                onReset={handleReset}
            />

            <DataManager
                key={refreshKey}
                data={tableData}
                loading={tableLoading}
                pagination={pagination}
                onPaginationChange={handlePaginationChange}
                actions={{
                    onAdd: handleAdd,
                    onEdit: handleEdit,
                    onDelete: handleDelete,
                }}
                config={{
                    showModeToggle: false,
                    displayMode: "table",
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
        </div>
    );
};

export default VocabularyPage;
