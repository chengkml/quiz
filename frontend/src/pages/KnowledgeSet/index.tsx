import React, { useEffect, useRef, useState } from 'react';
import UserAvatar from '@/components/UserAvatar';
import {
    Button,
    Drawer,
    Message,
    Modal,
    Popconfirm,
    Space,
    Tag,
    Tooltip,
} from '@arco-design/web-react';
import {
    IconDelete,
    IconEdit,
    IconSearch,
    IconStorage,
} from '@arco-design/web-react/icon';
import DataManager from '@/components/DataManager';
import FilterForm from '@/components/FilterForm';
import { FormFieldConfig } from '@/components/types/types';
import AddEditKnowledgeSetModal from './components/AddEditKnowledgeSetModal';
import SearchDrawer from './components/SearchDrawer';
import KnowledgeSourceManager from '../KnowledgeSource';
import { deleteKnowledgeSet, getKnowledgeSetById, getKnowledgeSetList } from './api';
import renderDate from '@/utils/timeUtil';
import './style/index.less';

type KnowledgeSetRecord = {
    id: string;
    name: string;
    descr?: string;
    visibility?: string;
    status?: string;
    isSystem?: boolean;
    createUser?: string;
    createUserName?: string;
    createDate?: string;
};

function KnowledgeSetManager() {
    const [tableData, setTableData] = useState<KnowledgeSetRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [tableScrollHeight, setTableScrollHeight] = useState(420);

    const [modalVisible, setModalVisible] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<KnowledgeSetRecord | null>(null);

    const [sourceDrawerVisible, setSourceDrawerVisible] = useState(false);
    const [drawerKnowledgeSetId, setDrawerKnowledgeSetId] = useState<string | null>(null);
    const [drawerReadonly, setDrawerReadonly] = useState(false);

    const [searchDrawerVisible, setSearchDrawerVisible] = useState(false);
    const [searchKnowledgeSetId, setSearchKnowledgeSetId] = useState<string | null>(null);

    const filterFormRef = useRef<any>(null);

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
        showTotal: true,
        showJumper: true,
        showPageSize: true,
    });

    const [searchParams, setSearchParams] = useState({
        keyWord: null,
        status: null,
    });

    const searchFormFields: FormFieldConfig[] = [
        {
            field: 'keyWord',
            label: '关键字',
            type: 'input',
            placeholder: '请输入名称或描述',
            span: 8,
        },
        {
            field: 'status',
            label: '状态',
            type: 'select',
            placeholder: '请选择状态',
            options: [
                { label: '启用', value: 'ENABLED' },
                { label: '禁用', value: 'DISABLED' },
            ],
            span: 8,
            allowClear: true,
        },
    ];

    const columns = [
        {
            title: '名称',
            dataIndex: 'name',
            ellipsis: true,
            width: 220,
        },
        {
            title: '描述',
            dataIndex: 'descr',
            ellipsis: true,
        },
        {
            title: '可见性',
            dataIndex: 'visibility',
            align: 'center',
            width: 110,
            render: (value: string) =>
                value === 'PUBLIC' ? <Tag color='green' bordered>公开</Tag> : <Tag color='red' bordered>私有</Tag>,
        },
        {
            title: '状态',
            dataIndex: 'status',
            align: 'center',
            width: 110,
            render: (value: string) =>
                value === 'ENABLED' ? <Tag color='green' bordered>启用</Tag> : <Tag color='red' bordered>禁用</Tag>,
        },
        {
            title: '系统内置',
            dataIndex: 'isSystem',
            align: 'center',
            width: 110,
            render: (value: boolean) =>
                value ? <Tag color='arcoblue' bordered>内置</Tag> : <Tag bordered>自定义</Tag>,
        },
        {
            title: '创建人',
            dataIndex: 'createUserName',
            width: 170,
            render: (_: string, record: any) => (
                <UserAvatar name={record.createUserName || record.createUser} size={20} showName />
            ),
        },
        {
            title: '创建时间',
            dataIndex: 'createDate',
            width: 180,
            render: (value: string) => renderDate(value),
        },
        {
            title: '操作',
            width: 180,
            align: 'center',
            fixed: 'right',
            render: (_: any, record: KnowledgeSetRecord) => (
                <div className='table-btn-group'>
                    <Tooltip content={record.isSystem ? '查看来源' : '来源'}>
                        <Button
                            type='text'
                            size='small'
                            icon={<IconStorage />}
                            onClick={(e) => {
                                e.stopPropagation();
                                setDrawerKnowledgeSetId(record.id);
                                setDrawerReadonly(Boolean(record.isSystem));
                                setSourceDrawerVisible(true);
                            }}
                        />
                    </Tooltip>
                    {!record.isSystem && (
                        <Tooltip content='检索测试'>
                            <Button
                                type='text'
                                size='small'
                                icon={<IconSearch />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSearchKnowledgeSetId(record.id);
                                    setSearchDrawerVisible(true);
                                }}
                            />
                        </Tooltip>
                    )}
                    {!record.isSystem && (
                        <Tooltip content='编辑'>
                            <Button
                                type='text'
                                size='small'
                                icon={<IconEdit />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(record);
                                }}
                            />
                        </Tooltip>
                    )}
                    {!record.isSystem && (
                        <Popconfirm title='确认删除该知识集吗？' onOk={() => handleDelete(record)}>
                            <Tooltip content='删除'>
                                <Button
                                    type='text'
                                    size='small'
                                    status='danger'
                                    icon={<IconDelete />}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </Tooltip>
                        </Popconfirm>
                    )}
                    {record.isSystem && (
                        <Tag size='small' color='arcoblue' bordered>
                            仅查看
                        </Tag>
                    )}
                </div>
            ),
        },
    ];

    const fetchTableData = async (
        params: any = searchParams,
        pageSize: number = pagination.pageSize,
        current: number = pagination.current
    ) => {
        setLoading(true);
        try {
            const targetParams = {
                ...params,
                pageNum: current - 1,
                pageSize,
            };
            const response = await getKnowledgeSetList(targetParams);
            if (response.data) {
                setTableData(response.data.content || []);
                setPagination((prev) => ({
                    ...prev,
                    current,
                    pageSize,
                    total: response.data.totalElements || 0,
                }));
            }
        } catch (error) {
            Message.error('获取知识集数据失败');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (values: any) => {
        const filterValues = Object.fromEntries(
            Object.entries(values).filter(([_, v]) => v !== '' && v !== undefined && v !== null)
        );
        setSearchParams(filterValues as any);
        setPagination((prev) => ({ ...prev, current: 1 }));
    };

    const handleReset = () => {
        const defaultParams = {};
        setSearchParams(defaultParams as any);
        setPagination((prev) => ({ ...prev, current: 1 }));
        fetchTableData(defaultParams, pagination.pageSize, 1);
    };

    const handlePaginationChange = (nextPagination: any) => {
        fetchTableData(searchParams, nextPagination.pageSize, nextPagination.current);
    };

    const handleAdd = () => {
        setCurrentRecord(null);
        setModalVisible(true);
    };

    const handleEdit = async (record: KnowledgeSetRecord) => {
        try {
            const response = await getKnowledgeSetById(record.id);
            setCurrentRecord(response.data);
            setModalVisible(true);
        } catch {
            Message.error('获取详情失败');
        }
    };

    const handleDelete = async (record: KnowledgeSetRecord) => {
        try {
            await deleteKnowledgeSet(record.id);
            Message.success('删除成功');
            fetchTableData();
        } catch {
            Message.error('删除失败');
        }
    };

    const handleModalSuccess = () => {
        setModalVisible(false);
        setCurrentRecord(null);
        fetchTableData();
    };

    useEffect(() => {
        const calculateTableHeight = () => {
            const windowHeight = window.innerHeight;
            const otherElementsHeight = 330;
            const nextHeight = Math.max(120, windowHeight - otherElementsHeight);
            setTableScrollHeight((prev) => (prev === nextHeight ? prev : nextHeight));
        };

        calculateTableHeight();
        window.addEventListener('resize', calculateTableHeight);
        return () => window.removeEventListener('resize', calculateTableHeight);
    }, []);

    useEffect(() => {
        fetchTableData(searchParams, pagination.pageSize, pagination.current);
    }, [searchParams, pagination.current, pagination.pageSize]);

    const filterContent = (
        <FilterForm
            ref={filterFormRef}
            formFields={searchFormFields}
            onSearch={handleSearch}
            onReset={handleReset}
            initialValues={{}}
        />
    );

    return (
        <div className='knowledge-set-manager'>
            <DataManager
                data={tableData}
                loading={loading}
                pagination={pagination}
                onPaginationChange={handlePaginationChange}
                actions={{ onAdd: handleAdd }}
                config={{
                    showModeToggle: false,
                    displayMode: 'table',
                    filterContent,
                    tableColumns: columns,
                    tableProps: {
                        scroll: { x: 1350, y: tableScrollHeight },
                    },
                }}
                tableScrollHeight={tableScrollHeight}
            />

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
                width='50%'
                title='知识来源'
                visible={sourceDrawerVisible}
                onCancel={() => {
                    setSourceDrawerVisible(false);
                    setDrawerKnowledgeSetId(null);
                    setDrawerReadonly(false);
                }}
                footer={null}
                unmountOnClose
            >
                {drawerKnowledgeSetId && (
                    <KnowledgeSourceManager knowledgeSetId={drawerKnowledgeSetId} readOnly={drawerReadonly} />
                )}
            </Drawer>

            <SearchDrawer
                visible={searchDrawerVisible}
                knowledgeSetId={searchKnowledgeSetId}
                onCancel={() => {
                    setSearchDrawerVisible(false);
                    setSearchKnowledgeSetId(null);
                }}
            />
        </div>
    );
}

export default KnowledgeSetManager;
