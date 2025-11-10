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
    Table,
    Tag,
} from '@arco-design/web-react';
import './style/index.less';
import {deleteExamHistory, getExamHistoryList} from './api';
import {IconDelete, IconEye, IconList, IconSearch} from '@arco-design/web-react/icon';
import {useNavigate} from 'react-router-dom';

const {Row, Col} = Grid;

const {Content} = Layout;

function ExamHistoryManager() {
    // 导航
    const navigate = useNavigate();

    // 状态管理
    const [tableData, setTableData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);
    const [tableScrollHeight, setTableScrollHeight] = useState(200);

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
    const fetchTableData = async (params = {}, pageSize = pagination.pageSize, current = pagination.current) => {
        setTableLoading(true);
        try {
            const targetParams = {
                ...params,
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
        fetchTableData(params, pagination.pageSize, 1);
    };

    // 处理下拉菜单点击
    const handleMenuClick = (key, e, record) => {
        e.stopPropagation();
        switch (key) {
            case 'detail':
                navigate(`/quiz/frame/history/result/${record.resultId}`);
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
                fetchTableData();
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
                navigate(`/quiz/frame/history/result/${lastSubmittedResultId}`);
                // 清除sessionStorage中的记录，避免下次进入时再次自动打开
                sessionStorage.removeItem('lastSubmittedResultId');
            }
            setHasCheckedLastResult(true);
        }
    }, [hasCheckedLastResult]);


    // 筛选表单配置已移除，直接在Form组件中定义

    useEffect(() => {
        const calculateTableHeight = () => {
            const windowHeight = window.innerHeight;
            const otherElementsHeight = 240;
            const newHeight = Math.max(200, windowHeight - otherElementsHeight);
            setTableScrollHeight(newHeight);
        };
        calculateTableHeight();
        fetchTableData();
        const handleResize = () => calculateTableHeight();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <Layout className="exam-history-manager">
            <Content>
                {showDetailPage && currentResultId ? (
                    <></>
                ) : (
                    <>
                        {/* 筛选表单 */}
                        <Form ref={filterFormRef} layout="horizontal" className="filter-form"
                              style={{marginTop: '10px'}}>
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
                                    fetchTableData({}, pageSize, current);
                                }}
                            />
                        </div>
                    </>
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