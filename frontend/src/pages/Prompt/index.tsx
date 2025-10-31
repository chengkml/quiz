import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Button, Form, Input, Layout, Message, Popconfirm, Space, Table} from '@arco-design/web-react';
import {IconDelete, IconEdit, IconEye, IconPlus} from '@arco-design/web-react/icon';
import FilterForm from '@/components/FilterForm';
import {deletePromptTemplate, getPromptTemplateList} from './api';
import AddPromptTemplateModal from './components/AddPromptTemplateModal';
import EditPromptTemplateModal from './components/EditPromptTemplateModal';
import DetailPromptTemplateModal from './components/DetailPromptTemplateModal';
import './style/index.less';

const PromptTemplateManagement: React.FC = () => {
    // 处理Modal成功回调
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });
    const filterFormRef = useRef(null);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<any>(null);

    // 获取提示词模板列表
    const fetchData = useCallback(async (params = {}) => {
        try {
            setLoading(true);
            const queryParams = {
                ...params,
                page: pagination.current,
                pageSize: pagination.pageSize
            };

            const response = await getPromptTemplateList(queryParams);
            // 假设后端返回的是Page对象，包含content数组和totalElements属性
            setData(response.data?.content || response.data?.items || []);
            setPagination(prev => ({
                ...prev,
                total: response.data?.totalElements || response.data?.total || 0
            }));
        } catch (error) {
            console.error('获取提示词模板列表失败:', error);
            Message.error('获取提示词模板列表失败');
        } finally {
            setLoading(false);
        }
    }, [pagination.current, pagination.pageSize]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // 处理分页变化
    const handlePaginationChange = (page: number, pageSize: number) => {
        setPagination(prev => ({
            ...prev,
            current: page,
            pageSize
        }));
        // 获取过滤条件
        const formValues = filterFormRef.current?.getReportFiltersValue() || {};
        fetchData(formValues);
    };

    // 搜索表格数据
    const searchTableData = (params) => {
        setPagination(prev => ({...prev, current: 1}));
        fetchData(params);
    };



    // 处理删除
    const handleDelete = async (id: number) => {
        try {
            await deletePromptTemplate(id);
            Message.success('删除成功');
            fetchData();
        } catch (error) {
            console.error('删除失败:', error);
            Message.error('删除失败');
        }
    };

    // 打开编辑模态框
    const handleEdit = (record: any) => {
        setCurrentRecord(record);
        setEditModalVisible(true);
    };

    // 打开详情模态框
    const handleDetail = (record: any) => {
        setCurrentRecord(record);
        setDetailModalVisible(true);
    };

    const columns = [
        {
            title: '模板名称',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            tooltip: true
        },
        {
            title: '变量列表',
            dataIndex: 'variables',
            key: 'variables',
            ellipsis: true,
            tooltip: true
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            tooltip: true
        },
        {
            title: '创建人',
            dataIndex: 'createUser',
            key: 'createUser',
            ellipsis: true
        },
        {
            title: '创建时间',
            dataIndex: 'createDate',
            key: 'createDate',
            ellipsis: true
        },
        {
            title: '操作',
            key: 'action',
            render: (_, record) => (
                <Space size="small">
                    <Button
                        size="small"
                        type="text"
                        icon={<IconEye/>}
                        onClick={() => handleDetail(record)}
                    >
                        详情
                    </Button>
                    <Button
                        size="small"
                        type="text"
                        icon={<IconEdit/>}
                        onClick={() => handleEdit(record)}
                    >
                        编辑
                    </Button>
                    <Popconfirm
                        title="确认删除"
                        description="确定要删除这个提示词模板吗？"
                        onConfirm={() => handleDelete(record.id)}
                    >
                        <Button
                            size="small"
                            type="text"
                            icon={<IconDelete/>}
                            status="danger"
                        >
                            删除
                        </Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div className="prompt-template-manager">
            <div className="content-wrapper">
                <FilterForm ref={filterFormRef} onSearch={searchTableData} onReset={searchTableData}>
                    <Form.Item label="模板名称" field="name">
                        <Input placeholder="请输入模板名称"/>
                    </Form.Item>
                    <Form.Item label="创建人" field="createUser">
                        <Input placeholder="请输入创建人"/>
                    </Form.Item>
                </FilterForm>
                <div className="action-buttons">
                    <Button
                        type="primary"
                        icon={<IconPlus/>}
                        onClick={() => setAddModalVisible(true)}
                    >
                        新增模板
                    </Button>
                </div>
                <Table
                    columns={columns}
                    data={data}
                    loading={loading}
                    pagination={{
                        ...pagination,
                        onChange: handlePaginationChange,
                        showTotal: true
                    }}
                    rowKey="id"
                />
            </div>
            <AddPromptTemplateModal
                visible={addModalVisible}
                onCancel={() => setAddModalVisible(false)}
                onSuccess={() => {
                    setAddModalVisible(false);
                    fetchData();
                }}
            />
            <EditPromptTemplateModal
                visible={editModalVisible}
                record={currentRecord}
                onCancel={() => setEditModalVisible(false)}
                onSuccess={() => {
                    setEditModalVisible(false);
                    fetchData();
                }}
            />
            <DetailPromptTemplateModal
                visible={detailModalVisible}
                record={currentRecord}
                onCancel={() => setDetailModalVisible(false)}
            />
        </div>
    );
};

export default PromptTemplateManagement;