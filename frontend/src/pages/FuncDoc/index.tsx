import React, {useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {
    Button,
    Dropdown,
    Form,
    Grid,
    Input,
    Layout,
    Menu,
    Message,
    Modal,
    Pagination,
    Space,
    Table,
    Tree
} from '@arco-design/web-react';
import {IconDelete, IconEdit, IconFile, IconList, IconPlus, IconSearch} from '@arco-design/web-react/icon';
import AddDocInfoModal from './components/AddDocInfoModal';
import EditDocInfoModal from './components/EditDocInfoModal';
import DetailDocInfoModal from './components/DetailDocInfoModal';

import {
    deleteDocInfo,
    exportHeadingsToDocx,
    exportInfToExcel,
    getDocHeadingTree,
    getDocInfoById,
    getDocInfoList
} from './api';
import './index.less';

const {Content} = Layout;
const {Row, Col} = Grid;

function DocInfoManager() {
    const navigate = useNavigate();

    // 表格数据状态
    const [tableData, setTableData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tableScrollHeight, setTableScrollHeight] = useState(420);

    // 模态框状态
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [headingTreeModalVisible, setHeadingTreeModalVisible] = useState(false);

    const [currentRecord, setCurrentRecord] = useState<any>(null);
    const [headingTreeData, setHeadingTreeData] = useState<any[]>([]);
    const [headingTreeLoading, setHeadingTreeLoading] = useState(false);

    // 表单引用
    const filterFormRef = useRef<any>();

    // 分页配置
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0,
        showTotal: true,
        showJumper: true,
        showPageSize: true,
    });

    // 获取文档列表
    const fetchDocInfoList = async (params = {}) => {
        setLoading(true);
        try {
            const response = await getDocInfoList({
                ...params,
                pageNum: pagination.current - 1,
                pageSize: pagination.pageSize
            });

            setTableData(response.data.content || []);
            setPagination(prev => ({
                ...prev,
                total: response.data.totalElements || 0
            }));
        } catch (error) {
            console.error('获取文档列表失败:', error);
            Message.error('获取文档列表失败');
        } finally {
            setLoading(false);
        }
    };

    // 初始加载
    useEffect(() => {
        fetchDocInfoList();
    }, []);

    // 处理分页变化
    const handlePaginationChange = (page: number, pageSize: number) => {
        setPagination(prev => ({
            ...prev,
            current: page,
            pageSize
        }));

        // 获取过滤条件
        const formValues = filterFormRef.current?.getFieldsValue() || {};
        fetchDocInfoList({
            ...formValues,
            pageNum: page,
            pageSize
        });
    };

    // 搜索表格数据
    const searchTableData = (params = {}) => {
        setPagination(prev => ({...prev, current: 1}));
        fetchDocInfoList({
            ...params,
            pageNum: 1,
            pageSize: pagination.pageSize
        });
    };

    // 处理添加
    const handleAdd = () => {
        setAddModalVisible(true);
    };

    // 处理查看详情
    const handleDetail = (record: any) => {
        setCurrentRecord(record);
        setDetailModalVisible(true);
    };

    // 处理编辑
    const handleEdit = async (record: any) => {
        try {
            const detail = await getDocInfoById(record.id);
            setCurrentRecord(detail.data);
            setEditModalVisible(true);
        } catch (error) {
            console.error('获取文档详情失败:', error);
            Message.error('获取文档详情失败');
        }
    };

    // 处理查看标题树
    const handleViewHeadingTree = async (record: any) => {
        setCurrentRecord(record);
        setHeadingTreeLoading(true);
        try {
            const response = await getDocHeadingTree(record.id);
            // 转换标题树数据为Tree组件需要的格式
            const formatTreeData = (data: any[]): any[] => {
                return data.map(item => ({
                    key: item.id,
                    title: `${item.headingLevel === 1 ? '📑' : item.headingLevel === 2 ? '📄' : '📌'} ${item.headingText}`,
                    children: item.children ? formatTreeData(item.children) : undefined
                }));
            };
            setHeadingTreeData(formatTreeData(response.data));
            setHeadingTreeModalVisible(true);
        } catch (error) {
            console.error('获取文档标题树失败:', error);
            Message.error('获取文档标题树失败');
        } finally {
            setHeadingTreeLoading(false);
        }
    };

    // 处理删除
    const handleDelete = async (record: any) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除文档「${record.fileName}」吗？此操作不可恢复。`,
            async onOk() {
                try {
                    await deleteDocInfo(record.id);
                    Message.success('文档删除成功');
                    fetchDocInfoList();
                } catch (error) {
                    console.error('文档删除失败:', error);
                    Message.error('文档删除失败');
                }
            }
        });
    };

    // 处理导出标题到docx
    const handleExportHeadings = async (record: any) => {
        try {
            const response = await exportHeadingsToDocx(record.id);

            // 创建下载链接
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            // 使用文档名称作为下载文件名
            const fileName = record.fileName ? `${record.fileName}_标题.docx` : `文档标题_${Date.now()}.docx`;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();

            // 清理
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            Message.success('标题导出成功');
        } catch (error) {
            console.error('标题导出失败:', error);
            Message.error('标题导出失败，请重试');
        }
    };

    // 处理导出接口信息到Excel
    const handleExportInf = async (record: any) => {
        try {
            const response = await exportInfToExcel(record.id);

            // 创建下载链接
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            // 使用文档名称作为下载文件名
            const fileName = record.fileName ? `${record.fileName}_接口信息.xlsx` : `接口信息_${Date.now()}.xlsx`;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();

            // 清理
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            Message.success('接口信息导出成功');
        } catch (error) {
            console.error('接口信息导出失败:', error);
            Message.error('接口信息导出失败，请重试');
        }
    };

    // 刷新列表
    const handleRefresh = () => {
        fetchDocInfoList();
    };

    // 表格列配置
    const columns = [
        {
            title: '文件名',
            dataIndex: 'fileName',
            key: 'fileName',
            width: 200,
        },
        {
            title: '文件MD5',
            dataIndex: 'fileMd5',
            key: 'fileMd5',
            width: 250,
            ellipsis: true,
            tooltip: (text: string) => text,
        },
        {
            title: '上传用户',
            dataIndex: 'uploadUserName',
            key: 'uploadUserName',
            width: 120,
            render: (text: string) => text || '--',
        },
        {
            title: '上传时间',
            dataIndex: 'uploadTime',
            key: 'uploadTime',
            width: 180,
            render: (value: string) => {
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
                    return `${year}-${month}-${day} ${hours}:${minutes}`;
                }
            },
        },
        {
            title: '操作',
            width: 100,
            align: 'center',
            fixed: 'right',
            render: (_, record) => (
                <Dropdown
                    droplist={
                        <Menu>
                            <Menu.Item key="detail" onClick={() => navigate(`/quiz/frame/funcDoc/detail/${record.id}`)}>
                                <IconFile style={{marginRight: 8}}/>
                                查看详情
                            </Menu.Item>
                            <Menu.Item key="features"
                                       onClick={() => navigate(`/quiz/frame/funcDoc/features/${record.id}`)}>
                                <IconSearch style={{marginRight: 8}}/>
                                查看功能点
                            </Menu.Item>
                            <Menu.Item key="headingTree" onClick={() => handleViewHeadingTree(record)}>
                                <IconList style={{marginRight: 8}}/>
                                标题树
                            </Menu.Item>
                            <Menu.Item key="exportHeadings" onClick={() => handleExportHeadings(record)}>
                                <IconFile style={{marginRight: 8}}/>
                                导出标题
                            </Menu.Item>
                            <Menu.Item key="exportInf" onClick={() => handleExportInf(record)}>
                                <IconFile style={{marginRight: 8}}/>
                                导出接口信息
                            </Menu.Item>
                            <Menu.Item key="edit" onClick={() => handleEdit(record)}>
                                <IconEdit style={{marginRight: 8}}/>
                                编辑
                            </Menu.Item>
                            <Menu.Item key="delete" onClick={() => handleDelete(record)}>
                                <IconDelete style={{marginRight: 8}}/>
                                删除
                            </Menu.Item>
                        </Menu>
                    }
                    position="bl"
                >
                    <Button
                        type="text"
                        className="more-btn"
                        onClick={e => {
                            e.stopPropagation();
                        }}
                    >
                        <IconList/>
                    </Button>
                </Dropdown>
            ),
        },
    ];

    // 监听窗口大小变化，动态调整表格高度
    useEffect(() => {
        const calculateTableHeight = () => {
            const windowHeight = window.innerHeight;
            // 减去页面其他元素的高度，如头部、筛选区域、分页等
            const otherElementsHeight = 245; // 预估其他元素占用的高度
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

    return (
        <Layout className="docinfo-manager">
            <Content>
                {/* 筛选表单 */}
                <Form
                    ref={filterFormRef}
                    layout="horizontal"
                    className="filter-form"
                    style={{marginTop: '10px'}}
                    onValuesChange={() => {
                        const values = filterFormRef.current?.getFieldsValue?.() || {};
                        searchTableData(values);
                    }}
                >
                    <Row gutter={16}>
                        <Col span={6}>
                            <Form.Item field="fileName" label="文件名">
                                <Input placeholder="请输入文件名"/>
                            </Form.Item>
                        </Col>
                        <Col
                            span={6}
                            style={{
                                display: 'flex',
                                justifyContent: 'flex-start',
                                alignItems: 'flex-end',
                                paddingBottom: '16px'
                            }}
                        >
                            <Space>
                                <Button
                                    type="primary"
                                    icon={<IconSearch/>}
                                    onClick={() => {
                                        const values = filterFormRef.current?.getFieldsValue?.() || {};
                                        searchTableData(values);
                                    }}
                                >
                                    搜索
                                </Button>
                                <Button
                                    type="primary"
                                    status="success"
                                    icon={<IconPlus/>}
                                    onClick={handleAdd}
                                >
                                    新增
                                </Button>
                            </Space>
                        </Col>
                    </Row>
                </Form>

                {/* 表格 */}
                <Table
                    columns={columns}
                    data={tableData}
                    loading={loading}
                    pagination={false}
                    rowKey="id"
                    scroll={{y: tableScrollHeight}}
                />

                {/* 分页 */}
                <div className="pagination-wrapper">
                    <Pagination
                        {...pagination}
                        onChange={handlePaginationChange}
                    />
                </div>

                {/* 添加文档模态框 */}
                <AddDocInfoModal
                    visible={addModalVisible}
                    onCancel={() => setAddModalVisible(false)}
                    onSuccess={handleRefresh}
                />

                {/* 编辑文档模态框 */}
                <EditDocInfoModal
                    visible={editModalVisible}
                    record={currentRecord}
                    onCancel={() => {
                        setEditModalVisible(false);
                        setCurrentRecord(null);
                    }}
                    onSuccess={handleRefresh}
                />

                {/* 文档详情模态框 */}
                <DetailDocInfoModal
                    visible={detailModalVisible}
                    record={currentRecord}
                    onCancel={() => {
                        setDetailModalVisible(false);
                        setCurrentRecord(null);
                    }}
                />

                {/* 文档标题树模态框 */}
                <Modal
                    title={`${currentRecord?.fileName || '文档'} - 标题树`}
                    visible={headingTreeModalVisible}
                    onCancel={() => {
                        setHeadingTreeModalVisible(false);
                        setHeadingTreeData([]);
                    }}
                    width={600}
                    footer={null}
                >
                    <div style={{maxHeight: '500px', overflow: 'auto'}}>
                        {headingTreeLoading ? (
                            <div style={{textAlign: 'center', padding: '40px 0'}}>加载中...</div>
                        ) : headingTreeData.length > 0 ? (
                            <Tree
                                treeData={headingTreeData}
                                defaultExpandAll
                                style={{marginTop: 16}}
                            />
                        ) : (
                            <div style={{textAlign: 'center', padding: '40px 0', color: 'var(--color-text-secondary)'}}>
                                暂无标题数据
                            </div>
                        )}
                    </div>
                </Modal>

            </Content>
        </Layout>
    );
}

export default DocInfoManager;