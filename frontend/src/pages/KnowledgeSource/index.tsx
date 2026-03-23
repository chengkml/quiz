import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import UserAvatar from '@/components/UserAvatar';
import { Button, Card, Layout, Message, Modal, Space, Tag, Tooltip, Typography } from '@arco-design/web-react';
import { IconDelete, IconEdit, IconFile, IconStorage } from '@arco-design/web-react/icon';
import { DataManager } from '@/components/DataManager';
import FilterForm from '@/components/FilterForm';
import { FormFieldConfig } from '@/components/types/types';
import AddEditKnowledgeSourceModal from './components/AddEditKnowledgeSourceModal';
import { deleteKnowledgeSource, getKnowledgeSourceById, getKnowledgeSourceList } from './api';
import renderDate from '@/utils/timeUtil';
import './style/index.less';

const { Content } = Layout;
const { Text, Paragraph } = Typography;

type KnowledgeSourceRecord = {
    id: string;
    name: string;
    type?: string;
    status?: string;
    content?: string;
    descr?: string;
    createUser?: string;
    createUserName?: string;
    createDate?: string;
};

const SOURCE_TYPE_CONFIG: Record<string, { label: string; icon?: React.ReactNode }> = {
    FILE: { label: '文件', icon: <IconFile /> },
    DB: { label: '数据库表', icon: <IconStorage /> },
    MARKDOWN: { label: 'Markdown' },
    MIND_MAP: { label: '思维导图' },
    MERMAID: { label: '流程图' },
};

const SOURCE_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    PENDING: { label: '等待中', color: 'gold' },
    PARSING: { label: '解析中', color: 'arcoblue' },
    SUCCESS: { label: '成功', color: 'green' },
    FAILED: { label: '失败', color: 'red' },
    ENABLED: { label: '启用', color: 'green' },
    DISABLED: { label: '禁用', color: 'gray' },
};

const normalizePreviewText = (text?: string) =>
    (text || '')
        .replace(/[#>*`[\]()!_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const getSourceSummaryLabel = (type?: string) => {
    if (type === 'FILE') {
        return '文件路径';
    }
    if (type === 'DB') {
        return '连接信息';
    }
    if (type === 'MARKDOWN') {
        return '内容摘要';
    }
    return '内容概览';
};

const getSourceSummary = (record: KnowledgeSourceRecord) => {
    if (record.type === 'DB') {
        try {
            const config = JSON.parse(record.content || '{}');
            const driver = config.driver || '数据库';
            const database = config.database || '未配置库名';
            const host = config.host || '未配置主机';
            const port = config.port ? `:${config.port}` : '';
            return `${driver} · ${database} @ ${host}${port}`;
        } catch {
            return '数据库连接配置';
        }
    }

    const preview = normalizePreviewText(record.content);
    if (!preview) {
        if (record.type === 'FILE') {
            return '未配置文件路径';
        }
        if (record.type === 'MARKDOWN') {
            return '暂无 Markdown 内容';
        }
        return '暂无内容';
    }

    return preview;
};

const renderTypeTag = (type?: string) => {
    const config = SOURCE_TYPE_CONFIG[type || ''] || { label: type || '未知类型' };
    return (
        <Tag size='small' bordered icon={config.icon}>
            {config.label}
        </Tag>
    );
};

const renderStatusTag = (status?: string) => {
    if (status === 'SUCCESS' || status === 'FAILED') {
        return null;
    }

    const config = SOURCE_STATUS_CONFIG[status || ''];
    if (!config) {
        return (
            <Tag size='small' bordered>
                {status || '未知状态'}
            </Tag>
        );
    }

    return (
        <Tag size='small' color={config.color} bordered>
            {config.label}
        </Tag>
    );
};

function KnowledgeSourceManager({
    knowledgeSetId,
    readOnly = false,
}: {
    knowledgeSetId?: string;
    readOnly?: boolean;
}) {
    const { id } = useParams<{ id: string }>();
    const effectiveKnowledgeSetId = knowledgeSetId || id;
    const isEmbedded = Boolean(knowledgeSetId);

    const [tableData, setTableData] = useState<KnowledgeSourceRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<KnowledgeSourceRecord | null>(null);

    const filterFormRef = useRef<any>();

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
        showTotal: true,
        showJumper: true,
        showPageSize: true,
    });

    const searchFormFields: FormFieldConfig[] = [
        {
            label: '名称',
            field: 'keyWord',
            type: 'input',
            placeholder: '请输入名称',
        },
        {
            label: '类型',
            field: 'type',
            type: 'select',
            placeholder: '请选择类型',
            options: [
                { label: '文件', value: 'FILE' },
                { label: '数据库表', value: 'DB' },
                { label: 'Markdown', value: 'MARKDOWN' },
                { label: '思维导图', value: 'MIND_MAP' },
                { label: '流程图', value: 'MERMAID' },
            ],
        },
        {
            label: '状态',
            field: 'status',
            type: 'select',
            placeholder: '请选择状态',
            options: [
                { label: '成功', value: 'SUCCESS' },
                { label: '失败', value: 'FAILED' },
                { label: '启用', value: 'ENABLED' },
                { label: '禁用', value: 'DISABLED' },
                { label: '解析中', value: 'PARSING' },
                { label: '等待中', value: 'PENDING' },
            ],
        },
    ];

    const fetchTableData = async (params = {}, page?: number, pageSize?: number) => {
        setLoading(true);
        try {
            const queryParams = {
                pageNum: (page ?? pagination.current) - 1,
                pageSize: pageSize ?? pagination.pageSize,
                knowledgeSetId: effectiveKnowledgeSetId,
                ...params,
            };

            const response = await getKnowledgeSourceList(queryParams);
            const { content = [], totalElements = 0 } = response.data || {};

            setTableData(content);
            setPagination(prev => ({
                ...prev,
                current: (queryParams.pageNum || 0) + 1,
                pageSize: queryParams.pageSize || prev.pageSize,
                total: totalElements,
            }));
        } catch {
            Message.error('获取列表失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTableData();
    }, [effectiveKnowledgeSetId]);

    const handleAdd = () => {
        if (readOnly) {
            return;
        }
        setCurrentRecord(null);
        setModalVisible(true);
    };

    const handleEdit = async (record: KnowledgeSourceRecord) => {
        if (readOnly) {
            return;
        }
        try {
            const response = await getKnowledgeSourceById(record.id);
            setCurrentRecord(response.data);
            setModalVisible(true);
        } catch {
            Message.error('获取详情失败');
        }
    };

    const handleDelete = (record: KnowledgeSourceRecord) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除 "${record.name}" 吗？`,
            onOk: async () => {
                try {
                    await deleteKnowledgeSource(record.id);
                    Message.success('删除成功');
                    const values = filterFormRef.current?.getFilterValues?.() || {};
                    fetchTableData(values);
                } catch {
                    Message.error('删除失败');
                }
            },
        });
    };

    const handlePaginationChange = (p: any) => {
        setPagination(p);
        const values = filterFormRef.current?.getFilterValues?.() || {};
        fetchTableData(values, p.current, p.pageSize);
    };

    const handleModalSuccess = () => {
        setModalVisible(false);
        setCurrentRecord(null);
        const values = filterFormRef.current?.getFilterValues?.() || {};
        fetchTableData(values);
    };

    const handleModalCancel = () => {
        setModalVisible(false);
        setCurrentRecord(null);
    };

    const filterContent = (
        <FilterForm
            ref={filterFormRef}
            initialValues={{ keyWord: '', status: undefined, type: undefined }}
            formFields={searchFormFields}
            onSearch={(values) => fetchTableData(values, 1)}
            onReset={() => fetchTableData({}, 1)}
            min={3}
        />
    );

    const renderShortCard = (item: KnowledgeSourceRecord) => {
        return (
            <Card
                className={`knowledge-source-card${readOnly ? ' knowledge-source-card--readonly' : ''}`}
                hoverable={!readOnly}
                onClick={() => handleEdit(item)}
                title={
                    <div className='knowledge-source-card__header'>
                        <Text className='knowledge-source-card__title' ellipsis={{ showTooltip: true }}>
                            {item.name}
                        </Text>
                        <div className='knowledge-source-card__tags'>
                            {renderTypeTag(item.type)}
                            {renderStatusTag(item.status)}
                        </div>
                    </div>
                }
                extra={
                    readOnly ? null : (
                        <Space size='small'>
                            <Tooltip content='编辑'>
                                <Button
                                    type='text'
                                    size='small'
                                    icon={<IconEdit />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEdit(item);
                                    }}
                                />
                            </Tooltip>
                            <Tooltip content='删除'>
                                <Button
                                    type='text'
                                    size='small'
                                    status='danger'
                                    icon={<IconDelete />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(item);
                                    }}
                                />
                            </Tooltip>
                        </Space>
                    )
                }
            >
                <div className='knowledge-source-card__body'>
                    <div className='knowledge-source-card__section'>
                        <div className='knowledge-source-card__label'>描述</div>
                        <Paragraph
                            className='knowledge-source-card__description'
                            ellipsis={{ rows: 2, showTooltip: true }}
                        >
                            {item.descr || '暂无描述'}
                        </Paragraph>
                    </div>

                    <div className='knowledge-source-card__section knowledge-source-card__section--summary'>
                        <div className='knowledge-source-card__label'>{getSourceSummaryLabel(item.type)}</div>
                        <Paragraph
                            className='knowledge-source-card__summary'
                            ellipsis={{ rows: 3, showTooltip: true }}
                        >
                            {getSourceSummary(item)}
                        </Paragraph>
                    </div>

                    <div className='knowledge-source-card__footer'>
                        <UserAvatar name={item.createUserName || item.createUser || '未知用户'} size={20} showName />
                        <div className='knowledge-source-card__time'>
                            <span>创建于</span>
                            <span>{renderDate(item.createDate)}</span>
                        </div>
                    </div>
                </div>
            </Card>
        );
    };

    return (
        <div className={`knowledge-source-manager${isEmbedded ? ' knowledge-source-manager--embedded' : ''}`}>
            <Layout>
                <Content>
                    <DataManager
                        data={tableData}
                        loading={loading}
                        pagination={pagination}
                        onPaginationChange={handlePaginationChange}
                        actions={readOnly ? {} : { onAdd: handleAdd }}
                        config={{
                            displayMode: 'shortCard',
                            showModeToggle: false,
                            renderShortCard: renderShortCard,
                            filterContent: filterContent,
                        }}
                        cardColumns={1}
                        cardGutter={16}
                        cardSize='medium'
                    />
                </Content>
            </Layout>
            <AddEditKnowledgeSourceModal
                visible={modalVisible}
                record={currentRecord}
                onOk={handleModalSuccess}
                onCancel={handleModalCancel}
                knowledgeSetId={effectiveKnowledgeSetId}
            />
        </div>
    );
}

export default KnowledgeSourceManager;
