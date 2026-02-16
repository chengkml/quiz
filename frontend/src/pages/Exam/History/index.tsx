import React, {useEffect, useRef, useState} from 'react';
import {
    Button,
    Input,
    Message,
    Spin,
    Tag,
    Tree,
    Tooltip,
    Popconfirm,
} from '@arco-design/web-react';
import './style/index.less';
import {deleteExamHistory, getExamHistoryList, getSubjectCategoryTree} from './api';
import {IconDelete} from '@arco-design/web-react/icon';
import {useNavigate} from 'react-router-dom';
import DataManager from '@/components/DataManager';
import FilterForm from '@/components/FilterForm';
import { FormFieldConfig } from '@/components/types/types';
import renderDate from '@/utils/timeUtil';

function ExamHistoryManager() {
    // 导航
    const navigate = useNavigate();

    // 状态管理
    const [tableData, setTableData] = useState([]);
    const [tableLoading, setTableLoading] = useState(false);
    const [tableScrollHeight, setTableScrollHeight] = useState(200);

    // 左侧树相关状态
    const [treeData, setTreeData] = useState([]);
    const [treeLoading, setTreeLoading] = useState(false);
    const [selectedTreeNode, setSelectedTreeNode] = useState(null);
    const [expandedKeys, setExpandedKeys] = useState([]);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [filteredTreeData, setFilteredTreeData] = useState([]);
    const [currentTreeNode, setCurrentTreeNode] = useState(null);

    // 对话框状态
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

    // 表单引用
    const filterFormRef = useRef();

    // 搜索条件
    const [searchParams, setSearchParams] = useState({
        examName: null,
    });

    const searchFormFields: FormFieldConfig[] = [
        {
            field: 'examName',
            label: '名称',
            type: 'input',
            placeholder: '请输入试卷名称',
            span: 6,
        },
    ];

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
            render: (value) => renderDate(value),
        },
        {
            title: '操作',
            width: 120,
            fixed: 'right',
            render: (_, record) => (
                <Popconfirm
                    title="确认删除该答卷吗？"
                    onOk={() => handleDelete(record)}
                >
                    <Tooltip content="删除">
                        <Button
                            type="text"
                            size="small"
                            status="danger"
                            icon={<IconDelete />}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </Tooltip>
                </Popconfirm>
            ),
        },
    ];

    // 获取表格数据
    const fetchTableData = async (
        params = searchParams,
        pageSize = pagination.pageSize,
        current = pagination.current,
        subjectId = currentTreeNode?.subjectId
    ) => {
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

    // 搜索处理
    const handleSearch = (values) => {
        const filterValues = Object.fromEntries(
            Object.entries(values).filter(([_, v]) => v !== '' && v !== undefined && v !== null)
        );
        setSearchParams(filterValues);
        setPagination(prev => ({ ...prev, current: 1 }));
        fetchTableData(filterValues, pagination.pageSize, 1);
    };

    // 重置处理
    const handleReset = () => {
        const defaultParams = {};
        setSearchParams(defaultParams);
        setPagination(prev => ({ ...prev, current: 1 }));
        fetchTableData(defaultParams, pagination.pageSize, 1);
    };

    // 处理删除
    const handleDelete = async (record) => {
        try {
            const response = await deleteExamHistory(record.resultId);
            if (response.data) {
                Message.success('删除历史答卷成功');
                fetchTableData();
            }
        } catch (error) {
            Message.error('删除历史答卷失败');
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
                const convertCategoriesToTreeNodes = (categories) => {
                    if (!categories || !Array.isArray(categories)) return [];
                    return categories.map(category => ({
                        key: category.id,
                        title: category.name,
                        subjectId: category.subjectId,
                        categoryId: category.id,
                        children: convertCategoriesToTreeNodes(category.children)
                    }));
                };

                const treeData = response.data.map(subject => ({
                    key: subject.id,
                    title: subject.name,
                    subjectId: subject.id,
                    categoryId: null,
                    children: convertCategoriesToTreeNodes(subject.categories)
                }));
                const rootNode = {
                    key: 'all',
                    title: '全部',
                    subjectId: null,
                    categoryId: null,
                    children: treeData,
                };
                const treeWithRoot = [rootNode];
                setTreeData(treeWithRoot);
                setFilteredTreeData(treeWithRoot);
                setExpandedKeys(['all', ...treeData.map(item => item.key)]);
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

        const filterNode = (node) => {
            const titleMatch = node.title.toLowerCase().includes(keyword.toLowerCase());
            const filteredChildren = node.children ? node.children.map(filterNode).filter(Boolean) : [];

            if (titleMatch || filteredChildren.length > 0) {
                return {
                    ...node,
                    children: filteredChildren
                };
            }
            return null;
        };

        return data.map(filterNode).filter(Boolean);
    };

    // 处理搜索输入变化
    const handleSearchChange = (value) => {
        setSearchKeyword(value);
        const filtered = filterTreeData(treeData, value);
        setFilteredTreeData(filtered);

        if (value) {
            const getAllKeys = (nodes) => {
                let keys = [];
                nodes.forEach(node => {
                    keys.push(node.key);
                    if (node.children && node.children.length > 0) {
                        keys = keys.concat(getAllKeys(node.children));
                    }
                });
                return keys;
            };
            setExpandedKeys(getAllKeys(filtered));
        } else {
            const rootNode = treeData[0];
            const firstLevelKeys = rootNode?.children
                ? rootNode.children.map(item => item.key)
                : [];
            setExpandedKeys(['all', ...firstLevelKeys]);
        }
    };

    const findNodeInTree = (data, key) => {
        for (const item of data) {
            if (item.key === key) {
                return item;
            }
            if (item.children && item.children.length > 0) {
                const result = findNodeInTree(item.children, key);
                if (result) return result;
            }
        }
        return null;
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

    const filterContent = (
        <FilterForm
            ref={filterFormRef}
            formFields={searchFormFields}
            onSearch={handleSearch}
            onReset={handleReset}
        />
    );

    return (
        <div className="exam-history-manager">
            <DataManager
                data={tableData}
                loading={tableLoading}
                pagination={pagination}
                onPaginationChange={(nextPagination) => {
                    fetchTableData(searchParams, nextPagination.pageSize, nextPagination.current);
                }}
                config={{
                    displayMode: 'table',
                    showModeToggle: false,
                    filterContent,
                    showTree: true,
                    treeContent: (
                        <div style={{height: '100%'}} className="tree-container">
                            <div style={{paddingBottom: '12px'}}>
                                <Input.Search
                                    placeholder="搜索学科分类"
                                    allowClear
                                    style={{width: '100%'}}
                                    value={searchKeyword}
                                    onChange={handleSearchChange}
                                />
                            </div>
                            <div style={{height: 'calc(100% - 50px)'}}>
                                <Spin loading={treeLoading}>
                                    {filteredTreeData.length > 0 ? (
                                        <Tree
                                            treeData={filteredTreeData}
                                            expandedKeys={expandedKeys}
                                            selectedKeys={selectedTreeNode ? [selectedTreeNode] : []}
                                            onExpand={(keys) => {
                                                setExpandedKeys(keys);
                                            }}
                                            onSelect={(keys) => {
                                                if (keys.length > 0) {
                                                    const selectedKey = keys[0];
                                                    setSelectedTreeNode(selectedKey);
                                                    if (selectedKey === 'all') {
                                                        setCurrentTreeNode(null);
                                                        fetchTableData();
                                                        return;
                                                    }
                                                    const nodeInfo = findNodeInTree(treeData, selectedKey);
                                                    setCurrentTreeNode(nodeInfo);
                                                    fetchTableData(undefined, undefined, undefined, nodeInfo?.subjectId);
                                                } else {
                                                    setSelectedTreeNode(null);
                                                    setCurrentTreeNode(null);
                                                    fetchTableData();
                                                }
                                            }}
                                            blockNode
                                            showLine
                                            style={{
                                                backgroundColor: 'transparent',
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                textAlign: 'center',
                                                color: 'var(--color-text-2)',
                                                padding: '20px 0',
                                                fontSize: '14px',
                                            }}
                                        >
                                            暂无数据
                                        </div>
                                    )}
                                </Spin>
                            </div>
                        </div>
                    ),
                    tableColumns: columns,
                    tableProps: {
                        onRow: (record) => ({
                            onClick: () => navigate(`/frame/history/result/${record.resultId}`),
                            style: { cursor: 'pointer' },
                        }),
                    },
                }}
                tableScrollHeight={tableScrollHeight}
            />
        </div>
    );
}

export default ExamHistoryManager;