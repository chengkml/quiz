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
    const [detailModalVisible, setDetailModalVisible] = useState(false);
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
    const [detailRecord, setDetailRecord] = useState(null);

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
            title: '考生姓名',
            dataIndex: 'userName',
            key: 'userName',
            width: 120,
            ellipsis: true,
        },
        {
            title: '总分',
            dataIndex: 'totalScore',
            key: 'totalScore',
            width: 100,
            render: (value) => (
                <Tag color="blue" className="score-tag">{value}</Tag>
            ),
        },
        {
            title: '正确题数',
            dataIndex: 'correctCount',
            key: 'correctCount',
            width: 120,
        },
        {
            title: '错误题数',
            dataIndex: 'wrongCount',
            key: 'wrongCount',
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
                page: current - 1,
                size: pageSize,
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
    const handleDetail = async (record) => {
        try {
            setLoading(true);
            const response = await getExamHistoryDetail(record.resultId);
            if (response.data) {
                setDetailRecord(response.data);
                setDetailModalVisible(true);
            }
        } catch (error) {
            Message.error('获取答卷详情失败');
        } finally {
            setLoading(false);
        }
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

    // 跳转到完整的答卷结果页面
    const handleViewFullResult = (record) => {
        navigate(`/quiz/frame/exam/result/${record.resultId}`);
    };

    // 筛选表单配置

    useEffect(() => {
        fetchTableData();
    }, []);

    return (
        <Layout className="exam-history-manager">
            <Content>
                {/* 筛选表单 */}
                <div className="filter-form-wrapper">
                    <Form
                        ref={filterFormRef}
                        layout="inline"
                        style={{ marginBottom: 16 }}
                    >
                        <Form.Item field='examName' label='试卷名称'>
                            <Input
                                placeholder='请输入试卷名称'
                            />
                        </Form.Item>
                        <Form.Item field='userName' label='考生姓名'>
                            <Input
                                placeholder='请输入考生姓名'
                            />
                        </Form.Item>
                    </Form>
                </div>

                <div className="action-buttons">
                    <Space>
                        <Button type="primary" icon={<IconSearch/>} onClick={() => {
                            const formData = filterFormRef.current?.getFieldsValue();
                            searchTableData(formData);
                        }}>
                            搜索
                        </Button>
                        <Button icon={<IconPlus/>} onClick={() => {
                            filterFormRef.current?.resetFields();
                            fetchTableData();
                        }}>
                            重置
                        </Button>
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

                {/* 详情对话框 */}
                <Modal
                    title="答卷详情"
                    visible={detailModalVisible}
                    onCancel={() => setDetailModalVisible(false)}
                    footer={null}
                    width={700}
                >
                    {detailRecord && (
                        <div className="exam-detail">
                            <div className="detail-item">
                                <label>试卷名称：</label>
                                <span>{detailRecord.examName}</span>
                            </div>
                            <div className="detail-item">
                                <label>考生姓名：</label>
                                <span>{detailRecord.userName}</span>
                            </div>
                            <div className="detail-item">
                                <label>总分：</label>
                                <span>{detailRecord.totalScore}</span>
                            </div>
                            <div className="detail-item">
                                <label>正确题数：</label>
                                <span>{detailRecord.correctCount}</span>
                            </div>
                            <div className="detail-item">
                                <label>错误题数：</label>
                                <span>{detailRecord.wrongCount}</span>
                            </div>
                            <div className="detail-item">
                                <label>提交时间：</label>
                                <span>{detailRecord.submitTime || '--'}</span>
                            </div>
                            <div className="detail-item">
                                <label>用时：</label>
                                <span>{detailRecord.duration ? `${detailRecord.duration}分钟` : '--'}</span>
                            </div>
                            <div className="detail-item">
                                <label>答题情况：</label>
                                <div>
                                    <Tag color="green">正确: {detailRecord.correctCount}题</Tag>
                                    <Tag color="red" style={{marginLeft: '8px'}}>错误: {detailRecord.wrongCount}题</Tag>
                                </div>
                            </div>
                            <div style={{marginTop: '20px', textAlign: 'center'}}>
                                <Button type="primary" onClick={() => handleViewFullResult(detailRecord)}>
                                    查看完整答卷
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal>

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