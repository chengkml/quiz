import React, {useEffect, useRef, useState} from 'react';
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
    Spin,
    Table,
    Tag,
    Tree,
} from '@arco-design/web-react';
import './style/index.less';
import {deleteExamHistory, getExamHistoryList, getSubjectCategoryTree} from './api';
import {IconDelete, IconEye, IconList, IconSearch} from '@arco-design/web-react/icon';
import {useNavigate} from 'react-router-dom';

const {Row, Col} = Grid;

const {Content, Sider} = Layout;

function ExamHistoryManager() {
    // 导航
    const navigate = useNavigate();

    // 状态管理
    const [tableData, setTableData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);
    const [tableScrollHeight, setTableScrollHeight] = useState(200);

    // 左侧树相关状态
    const [treeData, setTreeData] = useState([]);
    const [treeLoading, setTreeLoading] = useState(false);
    const [selectedTreeNode, setSelectedTreeNode] = useState(null);
    const [expandedKeys, setExpandedKeys] = useState([]);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [filteredTreeData, setFilteredTreeData] = useState([]);

    // 对话框状态
    const [showDetailPage, setShowDetailPage] = useState(false);
    const [currentResultId, setCurrentResultId] = useState<string | null>(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [hasCheckedLastResult, setHasCheckedLastResult] = useState(false);

    // 分页配置
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0,
        showTotal: true,
        showJumper: true,
        showPageSize: true,
    });

    // 当前操作的记录
    const [currentRecord, setCurrentRecord] = useState(null);

    // 表单引用
    const filterFormRef = useRef();

    // 表格列配置
    const columns = [
        {
            title: '试卷名称',
            dataIndex: 'examName',
            key: 'examName',
            ellipsis: true,
        },
        {
            title: '总分',
            dataIndex: 'totalScore',
            key: 'totalScore',
            align: 'center',
            width: 100,
            render: (value) => (
                <Tag color="blue" bordered>{value}分</Tag>
            ),
        },
        {
            title: '得分',
            dataIndex: 'userScore',
            key: 'userScore',
            align: 'center',
            width: 100,
            render: (value, record) => {
                // 根据得分比例显示不同颜色的标签
                const scoreRatio = value / record.totalScore;
                let color = 'red';
                if (scoreRatio >= 0.9) {
                    color = 'green';
                } else if (scoreRatio >= 0.6) {
                    color = 'blue';
                } else if (scoreRatio >= 0.3) {
                    color = 'orange';
                }
                return <Tag color={color} bordered>{value}分</Tag>;
            },
        },
        {
            title: '正确题数',
            dataIndex: 'correctCount',
            key: 'correctCount',
            align: 'center',
            width: 120,
            render: (value) => (
                <span>{value}题</span>
            ),
        },
        {
            title: '提交时间',
            dataIndex: 'submitTime',
            key: 'submitTime',
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
        {
            title: '操作',
            width: 180,
            align: 'center',
            fixed: 'right',
            render: (_, record) => (
                <Dropdown
                    position="bl"
                    droplist={
                        <Menu
                            onClickMenuItem={(key, e) => {
                                handleMenuClick(key, e, record);
                            }}
                            className="handle-dropdown-menu"
                        >
                            <Menu.Item key="detail">
                                <IconEye style={{marginRight: '5px'}}/>
                                查看详情
                            </Menu.Item>
                            <Menu.Item key="delete">
                                <IconDelete style={{marginRight: '5px'}}/>
                                删除
                            </Menu.Item>
                        </Menu>
                    }
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

    // 获取表格数据
    const fetchTableData = async (params = {}, pageSize = pagination.pageSize, current = pagination.current, subjectId = selectedTreeNode) => {
        setTableLoading(true);
        try {
            const targetParams = {
                ...params,
                subjectId,
                pageNum: current - 1,
                pageSize: pageSize,
            };
            const response = await getExamHistoryList(targetParams);
            if (response.data) {
                setTableData(response.data.content || []);
                setPagination(prev => ({
                    ...prev,
                    current,
                    pageSize,
                    total: response.data.totalElements || 0,
                }));
            }
        } catch (error) {
            Message.error('获取历史答卷数据失败');
        } finally {
            setTableLoading(false);
        }
    };

    // 搜索表格数据
    const searchTableData = (params) => {
        fetchTableData(params, pagination.pageSize, 1, selectedTreeNode);
    };

    // 处理下拉菜单点击
    const handleMenuClick = (key, e, record) => {
        e.stopPropagation();
        switch (key) {
            case 'detail':
                navigate(`/frame/history/result/${record.resultId}`);
                break;
            case 'delete':
                handleDelete(record);
                break;
            default:
                break;
        }
    };


    // 返回历史列表
    const handleBackToList = () => {
        setShowDetailPage(false);
        setCurrentResultId(null);
    };

    // 处理删除
    const handleDelete = (record) => {
        setCurrentRecord(record);
        setDeleteModalVisible(true);
    };

    // 处理删除确认
    const handleDeleteConfirm = async () => {
        try {
            setLoading(true);
            const response = await deleteExamHistory(currentRecord.resultId);
            if (response.data) {
                Message.success('删除历史答卷成功');
                setDeleteModalVisible(false);
                fetchTableData({}, pagination.pageSize, pagination.current, selectedTreeNode);
            }
        } catch (error) {
            Message.error('删除历史答卷失败');
        } finally {
            setLoading(false);
        }
    };

    // 检查是否有最近提交的考试结果需要自动打开详情
    useEffect(() => {
        // 只检查一次，避免页面刷新时重复打开
        if (!hasCheckedLastResult) {
            const lastSubmittedResultId = sessionStorage.getItem('lastSubmittedResultId');
            if (lastSubmittedResultId) {
                // 跳转到详情页
                navigate(`/frame/history/result/${lastSubmittedResultId}`);
                // 清除sessionStorage中的记录，避免下次进入时再次自动打开
                sessionStorage.removeItem('lastSubmittedResultId');
            }
            setHasCheckedLastResult(true);
        }
    }, [hasCheckedLastResult]);

    // 获取学科分类树数据
    const fetchSubjectCategoryTreeData = async () => {
        try {
            setTreeLoading(true);
            const response = await getSubjectCategoryTree();
            if (response.data) {
                // 只保留第一层subject节点，类似试题管理页面的逻辑
                const treeData = response.data.map(subject => ({
                    key: subject.id,
                    title: subject.name,
                    subjectId: subject.id,
                    children: []
                }));
                setTreeData(treeData);
                setFilteredTreeData(treeData);
                setExpandedKeys(treeData.map(item => item.key));
            }
        } catch (error) {
            console.error('获取学科数据失败:', error);
            Message.error('获取学科数据失败');
        } finally {
            setTreeLoading(false);
        }
    };

    // 搜索过滤树数据
    const filterTreeData = (data, keyword) => {
        if (!keyword) return data;
        return data.filter(node => node.title.toLowerCase().includes(keyword.toLowerCase()));
    };

    // 处理搜索输入变化
    const handleSearchChange = (value) => {
        setSearchKeyword(value);
        const filtered = filterTreeData(treeData, value);
        setFilteredTreeData(filtered);
    };

    useEffect(() => {
        const calculateTableHeight = () => {
            const windowHeight = window.innerHeight;
            const otherElementsHeight = 250;
            const newHeight = Math.max(200, windowHeight - otherElementsHeight);
            setTableScrollHeight(newHeight);
        };
        calculateTableHeight();
        fetchTableData();
        fetchSubjectCategoryTreeData();
        const handleResize = () => calculateTableHeight();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <Layout className="exam-history-manager" style={{ height: '100%' }}>
            <Content style={{ height: '100%' }}>
                {showDetailPage && currentResultId ? (
                    <></>
                ) : (
                    <Layout style={{ height: '100%', flexDirection: 'row' }}>
                        {/* 左侧侧边栏 */}
                        <Sider
                            width={280}
                            style={{
                                marginRight: 16,
                                background: 'var(--color-bg-2)',
                                height: '100%',
                                overflow: 'hidden',
                                borderRadius: '4px'
                            }}
                        >
                            <div style={{ padding: '12px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ paddingBottom: '12px' }}>
                                    <Input.Search
                                        placeholder="搜索学科"
                                        allowClear
                                        value={searchKeyword}
                                        onChange={handleSearchChange}
                                    />
                                </div>
                                <div style={{ flex: 1, overflow: 'auto' }}>
                                    <Spin loading={treeLoading} block>
                                        {filteredTreeData.length > 0 ? (
                                            <Tree
                                                treeData={filteredTreeData}
                                                expandedKeys={expandedKeys}
                                                selectedKeys={selectedTreeNode ? [selectedTreeNode] : []}
                                                onExpand={setExpandedKeys}
                                                onSelect={(keys) => {
                                                    const key = keys.length > 0 ? keys[0] : null;
                                                    setSelectedTreeNode(key);
                                                    fetchTableData(undefined, 1, undefined, key);
                                                }}
                                                blockNode
                                                showLine
                                            />
                                        ) : (
                                            <div style={{ textAlign: 'center', color: 'var(--color-text-2)', padding: '20px' }}>
                                                暂无数据
                                            </div>
                                        )}
                                    </Spin>
                                </div>
                            </div>
                        </Sider>

                        {/* 右侧内容 */}
                        <Content style={{ background: 'var(--color-bg-2)', padding: '16px', overflow: 'auto', borderRadius: '4px' }}>
                            <Form ref={filterFormRef} layout="horizontal" className="filter-form">
                                <Row gutter={16}>
                                    <Col span={6}>
                                        <Form.Item field="examName" label="名称">
                                            <Input placeholder="请输入试卷名称"/>
                                        </Form.Item>
                                    </Col>
                                    <Col span={6} style={{
                                        display: 'flex',
                                        justifyContent: 'flex-start',
                                        alignItems: 'flex-end',
                                        paddingBottom: '16px'
                                    }}>
                                        <Button type="primary" icon={<IconSearch/>} onClick={() => {
                                            const values = filterFormRef.current?.getFieldsValue?.() || {};
                                            searchTableData(values);
                                        }}>
                                            搜索
                                        </Button>
                                    </Col>
                                </Row>
                            </Form>
                            <Table
                                columns={columns}
                                data={tableData}
                                loading={tableLoading}
                                pagination={false}
                                scroll={{
                                    y: tableScrollHeight,
                                }}
                                rowKey="resultId"
                            />

                            {/* 分页 */}
                            <div className="pagination-wrapper">
                                <Pagination
                                    {...pagination}
                                    onChange={(current, pageSize) => {
                                        fetchTableData({}, pageSize, current, selectedTreeNode);
                                    }}
                                />
                            </div>
                        </Content>
                    </Layout>
                )}

                {/* 删除确认对话框 */}
                <Modal
                    title="删除历史答卷"
                    visible={deleteModalVisible}
                    onOk={handleDeleteConfirm}
                    onCancel={() => setDeleteModalVisible(false)}
                    confirmLoading={loading}
                >
                    <p>确定要删除试卷 <strong>{currentRecord?.examName}</strong> 的历史答卷吗？</p>
                    <p style={{color: '#f53f3f'}}>删除后不可恢复，请谨慎操作！</p>
                </Modal>
            </Content>
        </Layout>
    );
}

export default ExamHistoryManager;