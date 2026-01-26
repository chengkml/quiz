import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '@/components/UserAvatar';
import { Button, Card, Dropdown, Layout, Menu, Message, Modal, Space, Tag, Typography } from '@arco-design/web-react';
import { IconDelete, IconEdit, IconList, IconStorage } from '@arco-design/web-react/icon';
import { DataManager } from '@/components/DataManager';
import FilterForm from '@/components/FilterForm';
import { FormFieldConfig } from '@/components/types/types';
import AddEditKnowledgeSetModal from './components/AddEditKnowledgeSetModal';
import { deleteKnowledgeSet, getKnowledgeSetById, getKnowledgeSetList } from './api';
import './style/index.less';

const { Content } = Layout;

function KnowledgeSetManager() {
    const navigate = useNavigate();
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
            title: '描述',
            dataIndex: 'descr',
            width: 200,
            render: (text: string) => text || '--',
        },
        {
            title: '标签',
            dataIndex: 'tags',
            width: 150,
            render: (text: string) => text ? text.split(',').map((tag: string) => <Tag key={tag} style={{marginRight: 4}} bordered>{tag}</Tag>) : '--',
        },
        {
            title: '可见性',
            dataIndex: 'visibility',
            width: 100,
            render: (text: string) => text === 'PUBLIC' ? <Tag color="green" bordered>公开</Tag> : <Tag color="red" bordered>私有</Tag>,
        },
        {
            title: '状态',
            dataIndex: 'status',
            width: 100,
            render: (text: string) => text === 'ENABLE' ? <Tag color="green" bordered>启用</Tag> : <Tag color="red" bordered>禁用</Tag>,
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
            label: '状态',
            field: 'status',
            type: 'select',
            placeholder: '请选择状态',
            options: [
                { label: '启用', value: 'ENABLE' },
                { label: '禁用', value: 'DISABLE' },
            ],
        },
        {
            label: '可见性',
            field: 'visibility',
            type: 'select',
            placeholder: '请选择可见性',
            options: [
                { label: '公开', value: 'PUBLIC' },
                { label: '私有', value: 'PRIVATE' },
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
                ...params,
            };

            const response = await getKnowledgeSetList(queryParams);
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
    }, []);

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
            const response = await getKnowledgeSetById(record.id);
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
                    await deleteKnowledgeSet(record.id);
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
            initialValues={{ keyWord: '', status: undefined, visibility: undefined }}
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
                            {item.visibility === 'PUBLIC' ? <Tag color="green" size="small" bordered>公开</Tag> : <Tag color="red" size="small" bordered>私有</Tag>}
                            {item.status === 'ENABLE' ? <Tag color="green" size="small" bordered>启用</Tag> : <Tag color="red" size="small" bordered>禁用</Tag>}
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
                                } else if (key === 'source') {
                                    navigate(`/frame/knowledge-set/${item.id}/sources`);
                                }
                            }}>
                                <Menu.Item key="source"><IconStorage style={{ marginRight: 8 }} />知识来源</Menu.Item>
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
                    <Typography.Paragraph
                        style={{ marginBottom: 12, color: 'var(--color-text-2)', fontSize: 14, minHeight: 42 }}
                        ellipsis={{ rows: 2, showTooltip: true }}
                    >
                        {item.descr || '暂无描述'}
                    </Typography.Paragraph>
                    
                    <div style={{ marginBottom: 12, height: 24, overflow: 'hidden' }}>
                        {item.tags ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {item.tags.split(',').slice(0, 3).map((tag: string) => (
                                    <Tag key={tag} size="small" bordered>{tag}</Tag>
                                ))}
                                {item.tags.split(',').length > 3 && <Tag size="small" bordered>...</Tag>}
                            </div>
                        ) : (
                            <span style={{ color: 'var(--color-text-3)', fontSize: 12 }}>无标签</span>
                        )}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
                        <UserAvatar name={item.createUserName || item.createUser} showName />
                        <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{renderTimeText(item.createDate)}</span>
                    </div>
                </div>
            </Card>
        );
    };

    return (
        <Layout className="knowledge-set-manager">
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
                        filterContent,
                        tableColumns: tableColumns,
                        showModeToggle: true,
                        renderShortCard,
                        cardColumns: 4,
                        cardGutter: 16
                    }}
                    tableScrollHeight={tableScrollHeight}
                />
                <AddEditKnowledgeSetModal
                    visible={modalVisible}
                    currentRecord={currentRecord}
                    onCancel={handleModalCancel}
                    onSuccess={handleModalSuccess}
                />
            </Content>
        </Layout>
    );
}

export default KnowledgeSetManager;
