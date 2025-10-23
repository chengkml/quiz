import React, {useEffect, useRef, useState} from 'react';
import {
    Button,
    Dropdown,
    Form,
    Input,
    Layout,
    Menu,
    Message,
    Modal,
    Pagination,
    Select,
    Space,
    Table,
    Tag,
} from '@arco-design/web-react';
import './style/index.less';
import {
    getExamHistoryList,
    getExamHistoryDetail,
    deleteExamHistory
} from './api';
import {IconDelete, IconEdit, IconEye, IconList, IconPlus, IconSearch} from '@arco-design/web-react/icon';
import {useNavigate} from 'react-router-dom';
import FilterForm from '@/components/FilterForm';
import ExamResultDetailPage from '@/pages/Exam/Result';

const {Content} = Layout;
const {Option} = Select;
const {TextArea} = Input;

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
        },
        {
            title: '得分',
            dataIndex: 'userScore',
            key: 'userScore',
            align: 'center',
            width: 100,
        },
        {
            title: '正确题数',
            dataIndex: 'correctCount',
            key: 'correctCount',
            align: 'center',
            width: 120,
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
                handleDetail(record);
                break;
            case 'delete':
                handleDelete(record);
                break;
            default:
                break;
        }
    };

    // 处理详情
    const handleDetail = (record) => {
        setCurrentResultId(record.resultId);
        setShowDetailPage(true);
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



    // 筛选表单配置
    const filterFormConfig = [
        {
            type: 'input',
            field: 'examName',
            label: '试卷名称',
            placeholder: '请输入试卷名称',
            span: 6,
        }
    ];

    useEffect(() => {
        const calculateTableHeight = () => {
            const windowHeight = window.innerHeight;
            const otherElementsHeight = 225;
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
                    <div className="exam-result-detail-container">
                        <ExamResultDetailPage resultId={currentResultId} onBackToHistory={handleBackToList} />
                    </div>
                ) : (
                    <>
                        {/* 筛选表单 */}
                        <FilterForm
                            ref={filterFormRef}
                            config={filterFormConfig}
                            onSearch={searchTableData}
                            onReset={() => fetchTableData()}
                        >
                            <Form.Item field='examName' label='试卷名称'>
                                <Input
                                    placeholder='请输入试卷名称'
                                />
                            </Form.Item>
                        </FilterForm>

                        <div className="action-buttons">
                            <Space>
                                {/* 搜索和重置按钮已在 FilterForm 组件中包含 */}
                            </Space>
                        </div>
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