import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Button, Dropdown, Form, Grid, Input, Layout, Menu, Message, Popconfirm, Space, Table, Pagination} from '@arco-design/web-react';
import {IconDelete, IconEdit, IconEye, IconList, IconPlus, IconSearch} from '@arco-design/web-react/icon';
import {deletePromptTemplate, getPromptTemplateList} from './api';
import UserAvatar from '@/components/UserAvatar';
import AddPromptTemplateModal from './components/AddPromptTemplateModal';
import EditPromptTemplateModal from './components/EditPromptTemplateModal';
import './style/index.less';

const { Row, Col } = Grid;

const PromptTemplateManagement: React.FC = () => {
    // 处理Modal成功回调
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
            current: 1,
            pageSize: 20,
            total: 0,
            showTotal: true,
            showJumper: true,
            showPageSize: true,
        });
    // 表格高度自适应
    const [tableScrollHeight, setTableScrollHeight] = useState(420);
    const filterFormRef = useRef(null);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<any>(null);

    // 获取提示词模板列表
    const fetchData = useCallback(async (params = {}, page?: number, pageSize?: number) => {
        try {
            setLoading(true);
            const queryParams = {
                ...params,
                page: page ?? pagination.current,
                pageSize: pageSize ?? pagination.pageSize
            };

            const response = await getPromptTemplateList(queryParams);
            // 假设后端返回的是Page对象，包含content数组和totalElements属性
            setData(response.data?.content || response.data?.items || []);
            setPagination(prev => ({
                ...prev,
                current: queryParams.page,
                pageSize: queryParams.pageSize,
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

    // 高度自适应
    useEffect(() => {
        const calculateTableHeight = () => {
            const windowHeight = window.innerHeight;
            const otherElementsHeight = 250; // 预留顶部筛选等区域高度
            const newHeight = Math.max(100, windowHeight - otherElementsHeight);
            setTableScrollHeight(newHeight);
        };
        calculateTableHeight();
        const handleResize = () => calculateTableHeight();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 处理分页变化（独立分页组件）
    const handlePageChange = (page: number, pageSize: number) => {
        const formValues = filterFormRef.current?.getFieldsValue?.() || {};
        fetchData(formValues, page, pageSize);
    };

    // 搜索表格数据
    const searchTableData = (params) => {
        fetchData(params, 1, pagination.pageSize);
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



    // 时间格式化（与其它页面一致的相对/绝对展示）
    const formatDateTime = (value?: string) => {
        if (!value) return '-';
        const date = new Date(value);
        if (isNaN(date.getTime())) return '-';
        const now = new Date();
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
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `昨天 ${hours}:${minutes}`;
        } else {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }
    };

    // 菜单点击
    const handleMenuClick = (key: string, _: React.MouseEvent, record: any) => {
        if (key === 'edit') {
            handleEdit(record);
        }
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
            title: '模板内容',
            dataIndex: 'content',
            key: 'content',
            ellipsis: true,
            tooltip: true
        },
        {
            title: '创建人',
            dataIndex: 'createUserName',
            key: 'createUserName',
            ellipsis: true,
            render: (name, record) => (
                <UserAvatar name={name || (record?.createUser ?? '')} showName />
            )
        },
        {
            title: '创建时间',
            width: 180,
            dataIndex: 'createDate',
            key: 'createDate',
            ellipsis: true,
            render: (value: string) => formatDateTime(value)
        },
        {
            title: '操作',
            key: 'action',
            width: 100,
            render: (_, record) => (
                <Dropdown
                    position="bl"
                    droplist={
                        <Menu onClickMenuItem={(key, e) => handleMenuClick(key, e, record)} className="handle-dropdown-menu">
                            <Menu.Item key="edit">
                                <IconEdit style={{marginRight: 5}} />
                                编辑
                            </Menu.Item>
                            <Menu.Item key="delete">
                                <Popconfirm
                                    title="确认删除"
                                    description="确定要删除这个提示词模板吗？"
                                    onConfirm={() => handleDelete(record.id)}
                                >
                                    <div style={{display: 'flex', alignItems: 'center'}}>
                                        <IconDelete style={{marginRight: 5}} />
                                        删除
                                    </div>
                                </Popconfirm>
                            </Menu.Item>
                        </Menu>
                    }
                >
                    <Button type="text" className="more-btn" onClick={(e) => e.stopPropagation()}>
                        <IconList />
                    </Button>
                </Dropdown>
            )
        }
    ];

    return (
        <div className="prompt-template-manager">
            <div className="content-wrapper">
                <Form ref={filterFormRef} layout="horizontal" className="filter-form" style={{marginTop: '10px'}} onValuesChange={() => {
                    const values = filterFormRef.current?.getFieldsValue?.() || {};
                    searchTableData(values);
                }}>
                    <Row gutter={16}>
                        <Col span={6}>
                            <Form.Item label="名称" field="name">
                                <Input placeholder="请输入模板名称" />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Space>
                                <Button type="primary" icon={<IconSearch/>} onClick={() => {
                                    const values = filterFormRef.current?.getFieldsValue?.() || {};
                                    searchTableData(values);
                                }}>
                                    搜索
                                </Button>
                                <Button
                                    type="primary"
                                    status="success"
                                    icon={<IconPlus/>}
                                    onClick={() => setAddModalVisible(true)}
                                >
                                    新增
                                </Button>
                            </Space>
                        </Col>
                    </Row>
                </Form>
                <Table
                    columns={columns}
                    data={data}
                    loading={loading}
                    scroll={{ y: tableScrollHeight }}
                    pagination={false}
                    rowKey="id"
                />
                <div className="pagination-wrapper">
                    <Pagination
                        {...pagination}
                        onChange={handlePageChange}
                        showTotal
                    />
                </div>
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

        </div>
    );
};

export default PromptTemplateManagement;