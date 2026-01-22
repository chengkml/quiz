import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import UserAvatar from '@/components/UserAvatar';
import { Button, Card, Dropdown, Layout, Menu, Message, Modal, Space, Tag, Typography } from '@arco-design/web-react';
import { IconDelete, IconEdit, IconList, IconFile, IconStorage } from '@arco-design/web-react/icon';
import { DataManager } from '@/components/DataManager';
import FilterForm from '@/components/FilterForm';
import { FormFieldConfig } from '@/components/types/types';
import AddEditKnowledgeSourceModal from './components/AddEditKnowledgeSourceModal';
import { deleteKnowledgeSource, getKnowledgeSourceById, getKnowledgeSourceList } from './api';
import './style/index.less';

const { Content } = Layout;

function KnowledgeSourceManager({ knowledgeSetId }: { knowledgeSetId?: string }) {
    const { id } = useParams<{ id: string }>();
    const effectiveKnowledgeSetId = knowledgeSetId || id;

    // State
    const [tableData, setTableData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tableScrollHeight, setTableScrollHeight] = useState(200);
    
    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);

    // Form ref
    const filterFormRef = useRef<any>();

    // Pagination
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
        showTotal: true,
        showJumper: true,
        showPageSize: true,
    });

    // Time format
    const renderTimeText = (value: string) => {
        if (!value) return '--';
        const now = new Date();
        const date = new Date(value);
        const diffMs = now.getTime() - date.getTime();
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays === 0) {
            if (diffSeconds < 60) return `${diffSeconds}秒前`;
            if (diffMinutes < 60) return `${diffMinutes}分钟前`;
            return `${diffHours}小时前`;
        } else if (diffDays === 1) {
            return `昨天 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        } else {
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }
    };

    // Columns
    const tableColumns = [
        {
            title: '名称',
            dataIndex: 'name',
            width: 150,
        },
        {
            title: '类型',
            dataIndex: 'type',
            width: 100,
            render: (text: string) => {
                if (text === 'FILE') return <Tag icon={<IconFile />}>文件</Tag>;
                if (text === 'DB') return <Tag icon={<IconStorage />}>数据库表</Tag>;
                return <Tag>{text}</Tag>;
            }
        },
        {
            title: '描述',
            dataIndex: 'descr',
            width: 200,
            render: (text: string) => text || '--',
        },
        {
            title: '状态',
            dataIndex: 'status',
            width: 100,
            render: (text: string) => text === 'ENABLE' ? <Tag color="green">启用</Tag> : <Tag>{text}</Tag>,
        },
        {
            title: '创建人',
            dataIndex: 'createUserName',
            width: 100,
            render: (text: string, record: any) => (
                <UserAvatar name={text || (record?.createUser ?? '')} showName />
            ),
        },
        {
            title: '创建时间',
            dataIndex: 'createDate',
            width: 170,
        },
    ];

    // Search fields
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
            ],
        },
        {
            label: '状态',
            field: 'status',
            type: 'select',
            placeholder: '请选择状态',
            options: [
                { label: '启用', value: 'ENABLE' },
                { label: '禁用', value: 'DISABLE' },
            ],
        },
    ];

    // Fetch data
    const fetchTableData = async (params = {}, page?: number, pageSize?: number) => {
        setLoading(true);
        try {
            const queryParams = {
                pageNum: (page ?? pagination.current) - 1,
                pageSize: pageSize ?? pagination.pageSize,
                knowledgeSetId: effectiveKnowledgeSetId, // Add knowledgeSetId filter
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
        } catch (error) {
            console.error('获取列表失败:', error);
            Message.error('获取列表失败');
        } finally {
            setLoading(false);
        }
    };

    // Init
    useEffect(() => {
        fetchTableData();
    }, [effectiveKnowledgeSetId]); // Reload when knowledgeSetId changes

    // Resize
    useEffect(() => {
        const calculateTableHeight = () => {
            const windowHeight = window.innerHeight;
            const otherElementsHeight = 250;
            setTableScrollHeight(Math.max(200, windowHeight - otherElementsHeight));
        };
        calculateTableHeight();
        window.addEventListener('resize', calculateTableHeight);
        return () => window.removeEventListener('resize', calculateTableHeight);
    }, []);

    // Handlers
    const handleAdd = () => {
        setCurrentRecord(null);
        setModalVisible(true);
    };

    const handleEdit = async (record: any) => {
        try {
            const response = await getKnowledgeSourceById(record.id);
            setCurrentRecord(response.data);
            setModalVisible(true);
        } catch (error) {
            Message.error('获取详情失败');
        }
    };

    const handleDelete = (record: any) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除 "${record.name}" 吗？`,
            onOk: async () => {
                try {
                    await deleteKnowledgeSource(record.id);
                    Message.success('删除成功');
                    const values = filterFormRef.current?.getFilterValues?.() || {};
                    fetchTableData(values);
                } catch (error) {
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

    const renderShortCard = (item: any, index: number, actions: any) => {
        return (
            <Card
                className="knowledge-card"
                hoverable
                style={{ cursor: 'pointer', height: '100%' }}
                onClick={() => handleEdit(item)}
                title={
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }} title={item.name}>
                            {item.name}
                        </div>
                        <Space size={4}>
                            {item.status === 'ENABLE' ? <Tag color="green" size="small">启用</Tag> : <Tag size="small">{item.status}</Tag>}
                        </Space>
                    </div>
                }
                extra={
                    <Dropdown
                        droplist={
                            <Menu onClickMenuItem={(key, e) => {
                                e.stopPropagation();
                                if (key === 'edit') {
                                    actions.onEdit(item);
                                } else if (key === 'delete') {
                                    actions.onDelete(item);
                                }
                            }}>
                                <Menu.Item key="edit"><IconEdit style={{ marginRight: 8 }} />编辑</Menu.Item>
                                <Menu.Item key="delete"><IconDelete style={{ marginRight: 8 }} />删除</Menu.Item>
                            </Menu>
                        }
                    >
                        <Button type="text" icon={<IconList />} size="mini" onClick={(e) => e.stopPropagation()} />
                    </Dropdown>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ marginBottom: 12 }}>
                        {item.type === 'FILE' ? <Tag icon={<IconFile />}>文件</Tag> : (item.type === 'DB' ? <Tag icon={<IconStorage />}>数据库表</Tag> : <Tag>{item.type}</Tag>)}
                    </div>
                    <Typography.Paragraph
                        style={{ marginBottom: 12, color: 'var(--color-text-2)', fontSize: 14, minHeight: 42 }}
                        ellipsis={{ rows: 2, showTooltip: true }}
                    >
                        {item.descr || '暂无描述'}
                    </Typography.Paragraph>
                    
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--color-text-3)' }}>
                        <UserAvatar name={item.createUserName || item.createUser} size={20} showName />
                        <span>{renderTimeText(item.createDate)}</span>
                    </div>
                </div>
            </Card>
        );
    };

    return (
        <div className="knowledge-source-manager">
            <Layout>
                <Content>
                    <DataManager
                        data={tableData}
                        loading={loading}
                        pagination={pagination}
                        onPaginationChange={handlePaginationChange}
                        actions={{
                            onAdd: handleAdd,
                            onEdit: handleEdit,
                            onDelete: handleDelete,
                        }}
                        config={{
                            displayMode: 'shortCard',
                            showModeToggle: true,
                            tableColumns: tableColumns,
                            renderShortCard: renderShortCard,
                            showFilterForm: true,
                            filterContent: filterContent,
                            searchPlaceholder: '请输入名称搜索', // Add this if needed by DataManager
                        }}
                        tableScrollHeight={tableScrollHeight}
                        cardColumns={4}
                        cardGutter={16}
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
