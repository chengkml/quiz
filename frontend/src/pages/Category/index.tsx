import React, {useEffect, useRef, useState} from 'react';
import UserAvatar from '@/components/UserAvatar';
import { Layout, Message, Modal } from '@arco-design/web-react';
import AddCategoryModal from './components/AddCategoryModal';
import EditCategoryModal from './components/EditCategoryModal';
import { DataManager } from '@/components/DataManager';
import FilterForm from '@/components/FilterForm';
import { FormFieldConfig } from '@/components/types/types';

import {deleteCategory, getCategoryById, getCategoryList} from './api';
import {getAllSubjects} from '../Subject/api';
import './index.less';

const {Content} = Layout;

function CategoryManager() {
    // 表格数据状态
    const [tableData, setTableData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tableScrollHeight, setTableScrollHeight] = useState(200);

    // 模态框状态
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);

    // 表单引用
    const filterFormRef = useRef();

    // 分页配置
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
        showTotal: true,
        showJumper: true,
        showPageSize: true,
    });

    // 学科选项
    const [subjectOptions, setSubjectOptions] = useState([]);



    // 表格列配置
    const tableColumns = [
        {
            title: '分类名称',
            dataIndex: 'name',
            key: 'name',
            width: 150,
        },
        {
            title: '父分类',
            dataIndex: 'parentName',
            key: 'parentName',
            width: 120,
            render: (text) => text || '--',
        },
        {
            title: '所属学科',
            dataIndex: 'subjectName',
            key: 'subjectName',
            width: 120,
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
            width: 200,
            render: (text) => text || '--',
        },
        {
            title: '创建人',
            dataIndex: 'createUserName',
            key: 'createUserName',
            width: 100,
            render: (text, record) => (
                <UserAvatar name={text || (record?.createUser ?? '')} showName />
            ),
        },
        {
            title: '创建时间',
            dataIndex: 'createDate',
            width: 170,
            render: (value) => {
                if (!value) return '--';

                const now = new Date();
                const date = new Date(value);
                const diffMs = now.getTime() - date.getTime();
                const diffSeconds = Math.floor(diffMs / 1000);
                const diffMinutes = Math.floor(diffSeconds / 60);
                const diffHours = Math.floor(diffMinutes / 60);
                const diffDays = Math.floor(diffHours / 24);

                // 今天
                if (diffDays === 0) {
                    if (diffSeconds < 60) {
                        return `${diffSeconds}秒前`;
                    } else if (diffMinutes < 60) {
                        return `${diffMinutes}分钟前`;
                    } else {
                        return `${diffHours}小时前`;
                    }
                }
                // 昨天
                else if (diffDays === 1) {
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    return `昨天 ${hours}:${minutes}`;
                }
                // 昨天之前
                else {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    const seconds = String(date.getSeconds()).padStart(2, '0');
                    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
                }
            },
        },
    ];

    const searchFormFields: FormFieldConfig[] = [
        {
            field: 'name',
            label: '名称',
            type: 'input',
            placeholder: '请输入分类名称',
            span: 8,
        },
        {
            field: 'subjectId',
            label: '学科',
            type: 'select',
            placeholder: '请选择学科',
            allowClear: true,
            options: subjectOptions.map((subject: any) => ({ label: subject.name, value: subject.id })),
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

            const response = await getCategoryList(queryParams);
            const {content = [], totalElements = 0} = response.data || {};

            setTableData(content);
            setPagination(prev => ({
                ...prev,
                current: (queryParams.pageNum || 0) + 1,
                pageSize: queryParams.pageSize || prev.pageSize,
                total: totalElements,
            }));
        } catch (error) {
            console.error('获取分类列表失败:', error);
            Message.error('获取分类列表失败');
        } finally {
            setLoading(false);
        }
    };


    // 获取学科选项
    const fetchSubjectOptions = async () => {
        try {
            const response = await getAllSubjects();
            setSubjectOptions(response.data || []);
        } catch (error) {
            console.error('获取学科列表失败:', error);
        }
    };

    // 页面初始化
    useEffect(() => {
        fetchTableData();
        fetchSubjectOptions();
    }, []);

    // 监听窗口大小变化，动态调整表格高度
    useEffect(() => {
        const calculateTableHeight = () => {
            const windowHeight = window.innerHeight;
            // 减去页面其他元素的高度，如头部、筛选区域、分页等
            // 这里可以根据实际页面布局调整计算逻辑
            const otherElementsHeight = 250; // 预估其他元素占用的高度
            const newHeight = Math.max(200, windowHeight - otherElementsHeight);
            setTableScrollHeight(newHeight);
        };

        // 初始计算
        calculateTableHeight();

        // 监听窗口大小变化
        const handleResize = () => {
            calculateTableHeight();
        };

        window.addEventListener('resize', handleResize);

        // 清理事件监听器
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);


    // 处理新增
    const handleAdd = () => {
        setAddModalVisible(true);
    };

    // 处理编辑
    const handleEdit = async (record) => {
        try {
            const response = await getCategoryById(record.id);
            setCurrentRecord(response.data);
            setEditModalVisible(true);
        } catch (error) {
            console.error('获取分类详情失败:', error);
            Message.error('获取分类详情失败');
        }
    };

    // 处理删除
    const handleDelete = (record) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除分类"${record.name}"吗？`,
            onOk: async () => {
                try {
                    await deleteCategory(record.id);
                    Message.success('删除成功');
                    const values = filterFormRef.current?.getFilterValues?.() || {};
                    fetchTableData(values);
                } catch (error) {
                    console.error('删除分类失败:', error);
                    Message.error('删除失败');
                }
            },
        });
    };

    const filterContent = (
        <FilterForm
            ref={filterFormRef}
            initialValues={{ name: '', subjectId: undefined }}
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



    // 模态框成功回调
    const handleModalSuccess = () => {
        setAddModalVisible(false);
        setEditModalVisible(false);
        setCurrentRecord(null);
        const values = filterFormRef.current?.getFilterValues?.() || {};
        fetchTableData(values);
    };

    // 模态框取消回调
    const handleModalCancel = () => {
        setAddModalVisible(false);
        setEditModalVisible(false);
        setCurrentRecord(null);
    };

    return (
        <Layout className="category-manager">
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
                <AddCategoryModal
                    visible={addModalVisible}
                    onCancel={handleModalCancel}
                    onSuccess={handleModalSuccess}
                />
                <EditCategoryModal
                    visible={editModalVisible}
                    record={currentRecord}
                    onCancel={handleModalCancel}
                    onSuccess={handleModalSuccess}
                />
            </Content>
        </Layout>
    );
}

export default CategoryManager;
