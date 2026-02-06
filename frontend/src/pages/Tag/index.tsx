import React, { useEffect, useRef, useState } from 'react';
import UserAvatar from '@/components/UserAvatar';
import { Layout, Message, Modal, Tag as ArcoTag } from '@arco-design/web-react';
import AddTagModal from './components/AddTagModal';
import EditTagModal from './components/EditTagModal';
import DataManager from '@/components/DataManager';
import FilterForm from '@/components/FilterForm';
import { FormFieldConfig } from '@/components/types/types';

import { deleteTag, getTagById, getTagList, TagDto } from './api';
import './style/index.less';

const { Content } = Layout;

function TagManager() {
    // 表格数据状态
    const [tableData, setTableData] = useState<TagDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [tableScrollHeight, setTableScrollHeight] = useState(200);

    // 模态框状态
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<TagDto | null>(null);

    // 表单引用
    const filterFormRef = useRef<any>();

    // 分页配置
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
        showTotal: true,
        showJumper: true,
        showPageSize: true,
    });

    // 表格列配置
    const tableColumns = [
        {
            title: '标签名称',
            dataIndex: 'name',
            key: 'name',
            width: 150,
        },
        {
            title: '显示名',
            dataIndex: 'label',
            key: 'label',
            width: 150,
            render: (text: string, record: TagDto) => (
                <ArcoTag color={record.color}>{text}</ArcoTag>
            ),
        },
        {
            title: '类型',
            dataIndex: 'type',
            key: 'type',
            width: 120,
            render: (text: string) => text || '--',
        },
        {
            title: '颜色',
            dataIndex: 'color',
            key: 'color',
            width: 100,
            render: (color: string) => (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div
                        style={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            backgroundColor: color,
                            marginRight: 8,
                            border: '1px solid #eee'
                        }}
                    />
                    {color}
                </div>
            ),
        },
        {
            title: '描述',
            dataIndex: 'descr',
            key: 'descr',
            width: 200,
            render: (text: string) => text || '--',
        },
        {
            title: '创建人',
            dataIndex: 'createUserName',
            key: 'createUserName',
            width: 120,
            render: (text: string, record: TagDto) => (
                <UserAvatar name={text || (record.createUser ?? '')} showName />
            ),
        },
        {
            title: '创建时间',
            dataIndex: 'createDate',
            width: 170,
            render: (value: string) => {
                if (!value) return '--';
                const date = new Date(value);
                return date.toLocaleString();
            },
        },
    ];

    const searchFormFields: FormFieldConfig[] = [
        {
            field: 'name',
            label: '名称',
            type: 'input',
            placeholder: '请输入标签名称',
            span: 8,
        },
        {
            field: 'label',
            label: '显示名',
            type: 'input',
            placeholder: '请输入显示名',
            span: 8,
        },
        {
            field: 'type',
            label: '类型',
            type: 'input',
            placeholder: '请输入分类',
            span: 8,
        },
    ];

    // 获取表格数据
    const fetchTableData = async (params = {}, page?: number, pageSize?: number) => {
        try {
            setLoading(true);
            const queryParams = {
                pageNum: (page ?? pagination.current) - 1,
                pageSize: pageSize ?? pagination.pageSize,
                ...params,
            };

            const response = await getTagList(queryParams);
            const { content = [], totalElements = 0 } = response.data || {};

            setTableData(content);
            setPagination(prev => ({
                ...prev,
                current: (queryParams.pageNum || 0) + 1,
                pageSize: queryParams.pageSize || prev.pageSize,
                total: totalElements,
            }));
        } catch (error) {
            console.error('获取标签列表失败:', error);
            Message.error('获取标签列表失败');
        } finally {
            setLoading(false);
        }
    };

    // 页面初始化
    useEffect(() => {
        fetchTableData();
    }, []);

    // 监听窗口大小
    useEffect(() => {
        const calculateTableHeight = () => {
            const windowHeight = window.innerHeight;
            // 减去页面其他元素高度
            const otherElementsHeight = 250;
            const newHeight = Math.max(200, windowHeight - otherElementsHeight);
            setTableScrollHeight(newHeight);
        };

        calculateTableHeight();
        window.addEventListener('resize', calculateTableHeight);
        return () => {
            window.removeEventListener('resize', calculateTableHeight);
        };
    }, []);

    // 处理新增
    const handleAdd = () => {
        setAddModalVisible(true);
    };

    // 处理编辑
    const handleEdit = async (record: TagDto) => {
        try {
            const response = await getTagById(record.id);
            setCurrentRecord(response.data);
            setEditModalVisible(true);
        } catch (error) {
            console.error('获取标签详情失败:', error);
            Message.error('获取标签详情失败');
        }
    };

    // 处理删除
    const handleDelete = (record: TagDto) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除标签"${record.label}"吗？`,
            onOk: async () => {
                try {
                    await deleteTag(record.id);
                    Message.success('删除成功');
                    const values = filterFormRef.current?.getFilterValues?.() || {};
                    fetchTableData(values);
                } catch (error) {
                    console.error('删除标签失败:', error);
                    Message.error('删除失败');
                }
            },
        });
    };

    const filterContent = (
        <FilterForm
            ref={filterFormRef}
            initialValues={{ name: '', label: '', type: '' }}
            formFields={searchFormFields}
            onSearch={(values) => fetchTableData(values, 1)}
            onReset={() => fetchTableData({}, 1)}
            min={3}
        />
    );

    const handlePaginationChange = (p: any) => {
        setPagination(p);
        const values = filterFormRef.current?.getFilterValues?.() || {};
        fetchTableData(values, p.current, p.pageSize);
    };

    // 模态框回调
    const handleModalSuccess = () => {
        setAddModalVisible(false);
        setEditModalVisible(false);
        setCurrentRecord(null);
        const values = filterFormRef.current?.getFilterValues?.() || {};
        fetchTableData(values);
    };

    const handleModalCancel = () => {
        setAddModalVisible(false);
        setEditModalVisible(false);
        setCurrentRecord(null);
    };

    return (
        <Layout className="tag-manager">
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
                        displayMode: 'table',
                        filterContent,
                        tableColumns: tableColumns,
                        showModeToggle: false,
                    }}
                    tableScrollHeight={tableScrollHeight}
                />
                <AddTagModal
                    visible={addModalVisible}
                    onCancel={handleModalCancel}
                    onSuccess={handleModalSuccess}
                />
                <EditTagModal
                    visible={editModalVisible}
                    record={currentRecord}
                    onCancel={handleModalCancel}
                    onSuccess={handleModalSuccess}
                />
            </Content>
        </Layout>
    );
}

export default TagManager;
