import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import UserAvatar from '@/components/UserAvatar';
import {
    Button,
    Card,
    Drawer,
    Empty,
    Input,
    Layout,
    Message,
    Modal,
    Popconfirm,
    Result,
    Select,
    Space,
    Spin,
    Tag,
    Tooltip,
    Typography,
    Pagination,
    Grid,
} from '@arco-design/web-react';
import {
    IconDelete,
    IconEdit,
    IconFilter,
    IconPlus,
    IconRefresh,
    IconSearch,
    IconStorage,
} from '@arco-design/web-react/icon';
import AddEditKnowledgeSetModal from './components/AddEditKnowledgeSetModal';
import SearchDrawer from './components/SearchDrawer';
import KnowledgeSourceManager from '../KnowledgeSource';
import { deleteKnowledgeSet, getKnowledgeSetById, getKnowledgeSetList } from './api';
import renderDate from '@/utils/timeUtil';
import './style/index.less';

const { Content } = Layout;
const { useBreakpoint } = Grid;

type StatusType = 'ENABLED' | 'DISABLED' | undefined;
type VisibilityType = 'PUBLIC' | 'PRIVATE' | undefined;

interface QueryFilters {
    keyWord?: string;
    status?: StatusType;
    visibility?: VisibilityType;
}

const DEFAULT_PAGE_SIZE = 10;

function KnowledgeSetManager() {
    const breakpoints = useBreakpoint();
    const [searchParams, setSearchParams] = useSearchParams();

    const [tableData, setTableData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorText, setErrorText] = useState<string>('');

    const [modalVisible, setModalVisible] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<any>(null);

    const [sourceDrawerVisible, setSourceDrawerVisible] = useState(false);
    const [drawerKnowledgeSetId, setDrawerKnowledgeSetId] = useState<string | null>(null);

    const [searchDrawerVisible, setSearchDrawerVisible] = useState(false);
    const [searchKnowledgeSetId, setSearchKnowledgeSetId] = useState<string | null>(null);

    const [advancedFilterVisible, setAdvancedFilterVisible] = useState(false);

    const [queryFilters, setQueryFilters] = useState<QueryFilters>({
        keyWord: '',
        status: undefined,
        visibility: undefined,
    });

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: DEFAULT_PAGE_SIZE,
        total: 0,
        showTotal: true,
        showJumper: true,
        showPageSize: true,
    });

    const parseParams = () => {
        const keyWord = searchParams.get('keyWord') || '';
        const status = (searchParams.get('status') as StatusType) || undefined;
        const visibility = (searchParams.get('visibility') as VisibilityType) || undefined;
        const current = Number(searchParams.get('page') || 1);
        const pageSize = Number(searchParams.get('pageSize') || DEFAULT_PAGE_SIZE);

        return {
            filters: { keyWord, status, visibility },
            paging: {
                current: Number.isNaN(current) ? 1 : current,
                pageSize: Number.isNaN(pageSize) ? DEFAULT_PAGE_SIZE : pageSize,
            },
        };
    };

    const syncToUrl = (filters: QueryFilters, current: number, pageSize: number) => {
        const params = new URLSearchParams();
        if (filters.keyWord) params.set('keyWord', filters.keyWord);
        if (filters.status) params.set('status', filters.status);
        if (filters.visibility) params.set('visibility', filters.visibility);
        if (current > 1) params.set('page', String(current));
        if (pageSize !== DEFAULT_PAGE_SIZE) params.set('pageSize', String(pageSize));
        setSearchParams(params, { replace: true });
    };

    const fetchTableData = async (filters: QueryFilters, page: number, pageSize: number) => {
        setLoading(true);
        setErrorText('');
        try {
            const queryParams = {
                pageNum: page - 1,
                pageSize,
                keyWord: filters.keyWord?.trim() || undefined,
                status: filters.status,
                visibility: filters.visibility,
            };

            const response = await getKnowledgeSetList(queryParams);
            const { content = [], totalElements = 0 } = response.data || {};

            setTableData(content);
            setPagination((prev) => ({
                ...prev,
                current: page,
                pageSize,
                total: totalElements,
            }));
        } catch (error: any) {
            const message = error?.response?.data?.message || error?.message || '获取列表失败';
            setErrorText(message);
            setTableData([]);
            Message.error(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const { filters, paging } = parseParams();
        setQueryFilters(filters);
        setPagination((prev) => ({ ...prev, current: paging.current, pageSize: paging.pageSize }));
        fetchTableData(filters, paging.current, paging.pageSize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const applyFilters = (nextFilters: QueryFilters, nextPage = 1, nextPageSize = pagination.pageSize) => {
        setQueryFilters(nextFilters);
        syncToUrl(nextFilters, nextPage, nextPageSize);
        fetchTableData(nextFilters, nextPage, nextPageSize);
    };

    const handleDelete = (record: any) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除 "${record.name}" 吗？`,
            onOk: async () => {
                try {
                    await deleteKnowledgeSet(record.id);
                    Message.success('删除成功');
                    fetchTableData(queryFilters, pagination.current, pagination.pageSize);
                } catch {
                    Message.error('删除失败');
                }
            },
        });
    };

    const handleEdit = async (record: any) => {
        try {
            const response = await getKnowledgeSetById(record.id);
            setCurrentRecord(response.data);
            setModalVisible(true);
        } catch {
            Message.error('获取详情失败');
        }
    };

    const handleAdd = () => {
        setCurrentRecord(null);
        setModalVisible(true);
    };

    const handleModalSuccess = () => {
        setModalVisible(false);
        setCurrentRecord(null);
        fetchTableData(queryFilters, pagination.current, pagination.pageSize);
    };

    const handleQuickStatus = (value?: StatusType) => {
        applyFilters({ ...queryFilters, status: value }, 1);
    };

    const handleQuickVisibility = (value?: VisibilityType) => {
        applyFilters({ ...queryFilters, visibility: value }, 1);
    };

    const handleClearAll = () => {
        const resetFilters: QueryFilters = { keyWord: '', status: undefined, visibility: undefined };
        applyFilters(resetFilters, 1, DEFAULT_PAGE_SIZE);
    };

    const activeChips = useMemo(() => {
        const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];
        if (queryFilters.keyWord) {
            chips.push({
                key: 'keyWord',
                label: `关键词: ${queryFilters.keyWord}`,
                onRemove: () => applyFilters({ ...queryFilters, keyWord: '' }, 1),
            });
        }
        if (queryFilters.status) {
            chips.push({
                key: 'status',
                label: `状态: ${queryFilters.status === 'ENABLED' ? '启用' : '禁用'}`,
                onRemove: () => applyFilters({ ...queryFilters, status: undefined }, 1),
            });
        }
        if (queryFilters.visibility) {
            chips.push({
                key: 'visibility',
                label: `可见性: ${queryFilters.visibility === 'PUBLIC' ? '公开' : '私有'}`,
                onRemove: () => applyFilters({ ...queryFilters, visibility: undefined }, 1),
            });
        }
        return chips;
    }, [queryFilters]);

    const isMobile = !breakpoints.md;

    const renderContentState = () => {
        if (loading) {
            return (
                <div className="knowledge-set-content-state">
                    <Spin tip="加载中..." />
                </div>
            );
        }

        if (errorText) {
            return (
                <Result
                    status="error"
                    title="加载失败"
                    subTitle={errorText}
                    extra={
                        <Button type="primary" icon={<IconRefresh />} onClick={() => fetchTableData(queryFilters, pagination.current, pagination.pageSize)}>
                            重新加载
                        </Button>
                    }
                />
            );
        }

        if (!tableData.length) {
            return <Empty description="暂无知识集数据" />;
        }

        return (
            <div className="knowledge-set-card-grid">
                {tableData.map((item) => (
                    <Card
                        key={item.id}
                        className="knowledge-set-card"
                        hoverable
                        title={
                            <div className="knowledge-set-card-title" title={item.name}>
                                <span>{item.name}</span>
                            </div>
                        }
                        extra={
                            <Space size={4}>
                                <Tooltip content="来源">
                                    <Button
                                        type="text"
                                        size="mini"
                                        icon={<IconStorage />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDrawerKnowledgeSetId(item.id);
                                            setSourceDrawerVisible(true);
                                        }}
                                    />
                                </Tooltip>
                                <Tooltip content="检索测试">
                                    <Button
                                        type="text"
                                        size="mini"
                                        icon={<IconSearch />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSearchKnowledgeSetId(item.id);
                                            setSearchDrawerVisible(true);
                                        }}
                                    />
                                </Tooltip>
                                <Tooltip content="编辑">
                                    <Button
                                        type="text"
                                        size="mini"
                                        icon={<IconEdit />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(item);
                                        }}
                                    />
                                </Tooltip>
                                <Popconfirm title="确认删除该知识集吗?" onOk={() => handleDelete(item)}>
                                    <Tooltip content="删除">
                                        <Button
                                            type="text"
                                            size="mini"
                                            status="danger"
                                            icon={<IconDelete />}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </Tooltip>
                                </Popconfirm>
                            </Space>
                        }
                        onClick={() => handleEdit(item)}
                    >
                        <div className="knowledge-set-card-tags">
                            {item.visibility === 'PUBLIC' ? <Tag color="green" bordered>公开</Tag> : <Tag color="red" bordered>私有</Tag>}
                            {item.status === 'ENABLED' ? <Tag color="green" bordered>启用</Tag> : <Tag color="red" bordered>禁用</Tag>}
                            {item.tags
                                ? item.tags.split(',').slice(0, 2).map((tag: string) => (
                                      <Tag key={tag} bordered>{tag}</Tag>
                                  ))
                                : null}
                        </div>
                        <Typography.Paragraph ellipsis={{ rows: 2, showTooltip: true }} className="knowledge-set-card-desc">
                            {item.descr || '暂无描述'}
                        </Typography.Paragraph>
                        <div className="knowledge-set-card-footer">
                            <UserAvatar name={item.createUserName || item.createUser || ''} showName />
                            <span>{renderDate(item.createDate)}</span>
                        </div>
                    </Card>
                ))}
            </div>
        );
    };

    return (
        <Layout className="knowledge-set-manager">
            <Content>
                <div className="knowledge-set-page">
                    <div className="knowledge-set-toolbar-layer">
                        <div className="toolbar-main-row">
                            <Input.Search
                                value={queryFilters.keyWord}
                                onChange={(value) => setQueryFilters((prev) => ({ ...prev, keyWord: value }))}
                                onSearch={() => applyFilters({ ...queryFilters }, 1)}
                                placeholder="搜索知识集名称或描述"
                                allowClear
                                className="knowledge-set-search-input"
                            />
                            <Space wrap>
                                <Button type="primary" icon={<IconSearch />} onClick={() => applyFilters({ ...queryFilters }, 1)}>
                                    搜索
                                </Button>
                                <Button icon={<IconFilter />} onClick={() => setAdvancedFilterVisible(true)}>
                                    高级筛选
                                </Button>
                                <Button icon={<IconPlus />} onClick={handleAdd}>
                                    新建知识集
                                </Button>
                            </Space>
                        </div>

                        <div className="toolbar-quick-row">
                            <Space wrap>
                                <span className="quick-label">状态:</span>
                                <Button size="small" type={!queryFilters.status ? 'primary' : 'secondary'} onClick={() => handleQuickStatus(undefined)}>全部</Button>
                                <Button size="small" type={queryFilters.status === 'ENABLED' ? 'primary' : 'secondary'} onClick={() => handleQuickStatus('ENABLED')}>启用</Button>
                                <Button size="small" type={queryFilters.status === 'DISABLED' ? 'primary' : 'secondary'} onClick={() => handleQuickStatus('DISABLED')}>禁用</Button>
                            </Space>
                            <Space wrap>
                                <span className="quick-label">可见性:</span>
                                <Button size="small" type={!queryFilters.visibility ? 'primary' : 'secondary'} onClick={() => handleQuickVisibility(undefined)}>全部</Button>
                                <Button size="small" type={queryFilters.visibility === 'PUBLIC' ? 'primary' : 'secondary'} onClick={() => handleQuickVisibility('PUBLIC')}>公开</Button>
                                <Button size="small" type={queryFilters.visibility === 'PRIVATE' ? 'primary' : 'secondary'} onClick={() => handleQuickVisibility('PRIVATE')}>私有</Button>
                            </Space>
                        </div>

                        <div className="toolbar-chip-row">
                            <Space wrap>
                                {activeChips.length > 0 ? (
                                    activeChips.map((chip) => (
                                        <Tag key={chip.key} closable onClose={chip.onRemove}>
                                            {chip.label}
                                        </Tag>
                                    ))
                                ) : (
                                    <span className="no-chip-text">当前未选择筛选条件</span>
                                )}
                            </Space>
                            <Button size="small" type="text" onClick={handleClearAll} disabled={activeChips.length === 0 && pagination.current === 1 && pagination.pageSize === DEFAULT_PAGE_SIZE}>
                                一键清空
                            </Button>
                        </div>
                    </div>

                    <div className="knowledge-set-result-layer">
                        <div className="result-meta">
                            <Typography.Text type="secondary">
                                共 {pagination.total} 条结果
                            </Typography.Text>
                        </div>
                        <Pagination
                            {...pagination}
                            size={isMobile ? 'small' : 'default'}
                            onChange={(page, pageSize) => {
                                const nextPageSize = pageSize || pagination.pageSize;
                                setPagination((prev) => ({ ...prev, current: page, pageSize: nextPageSize }));
                                syncToUrl(queryFilters, page, nextPageSize);
                                fetchTableData(queryFilters, page, nextPageSize);
                            }}
                            onPageSizeChange={(pageSize) => {
                                setPagination((prev) => ({ ...prev, current: 1, pageSize }));
                                syncToUrl(queryFilters, 1, pageSize);
                                fetchTableData(queryFilters, 1, pageSize);
                            }}
                        />
                    </div>

                    <div className="knowledge-set-content-layer">
                        {renderContentState()}
                    </div>
                </div>

                <AddEditKnowledgeSetModal
                    visible={modalVisible}
                    currentRecord={currentRecord}
                    onCancel={() => {
                        setModalVisible(false);
                        setCurrentRecord(null);
                    }}
                    onSuccess={handleModalSuccess}
                />

                <Drawer
                    width={isMobile ? '100%' : '50%'}
                    title="知识来源"
                    visible={sourceDrawerVisible}
                    onCancel={() => {
                        setSourceDrawerVisible(false);
                        setDrawerKnowledgeSetId(null);
                    }}
                    footer={null}
                    unmountOnClose
                >
                    {drawerKnowledgeSetId && <KnowledgeSourceManager knowledgeSetId={drawerKnowledgeSetId} />}
                </Drawer>

                <SearchDrawer
                    visible={searchDrawerVisible}
                    knowledgeSetId={searchKnowledgeSetId}
                    onCancel={() => {
                        setSearchDrawerVisible(false);
                        setSearchKnowledgeSetId(null);
                    }}
                />

                <Drawer
                    width={isMobile ? '100%' : 420}
                    title="高级筛选"
                    visible={advancedFilterVisible}
                    onCancel={() => setAdvancedFilterVisible(false)}
                    unmountOnClose
                    footer={
                        <Space>
                            <Button
                                onClick={() => {
                                    setQueryFilters((prev) => ({ ...prev, status: undefined, visibility: undefined }));
                                }}
                            >
                                重置
                            </Button>
                            <Button
                                type="primary"
                                onClick={() => {
                                    applyFilters(queryFilters, 1);
                                    setAdvancedFilterVisible(false);
                                }}
                            >
                                应用
                            </Button>
                        </Space>
                    }
                >
                    <div className="knowledge-set-advanced-filter">
                        <div className="filter-item">
                            <div className="filter-label">状态</div>
                            <Select
                                allowClear
                                placeholder="全部状态"
                                value={queryFilters.status}
                                onChange={(value) => setQueryFilters((prev) => ({ ...prev, status: value as StatusType }))}
                            >
                                <Select.Option value="ENABLED">启用</Select.Option>
                                <Select.Option value="DISABLED">禁用</Select.Option>
                            </Select>
                        </div>
                        <div className="filter-item">
                            <div className="filter-label">可见性</div>
                            <Select
                                allowClear
                                placeholder="全部可见性"
                                value={queryFilters.visibility}
                                onChange={(value) => setQueryFilters((prev) => ({ ...prev, visibility: value as VisibilityType }))}
                            >
                                <Select.Option value="PUBLIC">公开</Select.Option>
                                <Select.Option value="PRIVATE">私有</Select.Option>
                            </Select>
                        </div>
                    </div>
                </Drawer>
            </Content>
        </Layout>
    );
}

export default KnowledgeSetManager;
