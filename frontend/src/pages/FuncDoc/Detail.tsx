import React, {useEffect, useRef, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {Form, Input, Layout, Message, Spin, Table, Tree, Typography} from '@arco-design/web-react';
import FilterForm from '@/components/FilterForm';
import {getDocHeadingTree, getDocProcessNodes} from './api';
import './style/index.less';

const {Sider, Content} = Layout;
const {Title, Text} = Typography;

export default function DocInfoDetail() {
    const navigate = useNavigate();
    const {id} = useParams<{ id: string }>();

    const [treeData, setTreeData] = useState<any[]>([]);
    const [tableScrollHeight, setTableScrollHeight] = useState(200);
    const [treeLoading, setTreeLoading] = useState(false);
    const [selectedTreeNode, setSelectedTreeNode] = useState<string>('');
    const [tableData, setTableData] = useState<any[]>([]);
    const [tableLoading, setTableLoading] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [filteredTreeData, setFilteredTreeData] = useState<any[]>([]);
    const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
    const [nodeSearchKeyword, setNodeSearchKeyword] = useState('');
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0
    });

    // 筛选表单引用
    const filterFormRef = useRef(null);


    // 获取文档标题树
    const fetchHeadingTree = async () => {
        if (!id) return;
        try {
            setTreeLoading(true);
            const response = await getDocHeadingTree(id);
            const treeNodes = convertToTreeNodes(response.data || []);
            setTreeData(treeNodes);
            setFilteredTreeData(treeNodes);
            // 默认展开第一级节点
            const firstLevelKeys = treeNodes.map(node => node.key);
            setExpandedKeys(firstLevelKeys);
            // 不默认选中任何节点
            // 加载流程节点数据
            fetchProcessNodes(1, 20);
        } catch (error) {
            Message.error('获取标题树失败');
        } finally {
            setTreeLoading(false);
        }
    };

    // 获取文档流程节点
    const fetchProcessNodes = async (pageNum: number = 1, pageSize: number = 20, params: any = {}) => {
        if (!id) return;
        try {
            setTableLoading(true);
            const {keyWord = '', headingId = ''} = params;
            const response = await getDocProcessNodes(id, pageNum - 1, pageSize, keyWord, headingId);
            setTableData(response.data.content || []);
            setPagination({
                current: pageNum,
                pageSize,
                total: response.data.totalElements || 0
            });
        } catch (error) {
            Message.error('获取流程节点失败');
        } finally {
            setTableLoading(false);
        }
    };

    // 搜索表格数据
    const searchTableData = (params: any = {}) => {
        setPagination(prev => ({...prev, current: 1}));
        // 优先使用params中的headingId，如果没有则使用selectedTreeNode
        fetchProcessNodes(1, 20, {
            ...params,
            headingId: params.headingId || selectedTreeNode
        });
    };

    // 转换数据为Tree组件需要的格式
    const convertToTreeNodes = (headings: any[]): any[] => {
        // 参考index.tsx中的formatTreeData函数实现
        return headings.map(item => ({
            key: item.id,
            title: `${item.headingLevel === 1 ? '📑' : item.headingLevel === 2 ? '📄' : '📌'} ${item.headingText}`,
            children: item.children ? convertToTreeNodes(item.children) : undefined
        }));
    };

    // 搜索过滤树数据
    const filterTreeData = (data: any[], keyword: string): any[] => {
        if (!keyword) return data;

        const filterNode = (node: any): any => {
            const titleMatch = node.title.toLowerCase().includes(keyword.toLowerCase());
            const filteredChildren = node.children
                ? node.children.map(filterNode).filter(Boolean)
                : [];

            if (titleMatch || filteredChildren.length > 0) {
                return {
                    ...node,
                    children: filteredChildren,
                };
            }
            return null;
        };

        return data.map(filterNode).filter(Boolean);
    };

    // 处理搜索输入变化
    const handleSearchChange = (value: string) => {
        setSearchKeyword(value);
        const filtered = filterTreeData(treeData, value);
        setFilteredTreeData(filtered);

        // 如果有搜索关键字，展开所有匹配的节点
        if (value) {
            const getAllKeys = (nodes: any[]): string[] => {
                let keys: string[] = [];
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
            // 没有搜索关键字时，只展开第一级
            setExpandedKeys(treeData.map(item => item.key));
        }
    };

    // 处理树节点选择
    const handleTreeSelect = (selectedKeys: string[], info: any) => {
        if (selectedKeys.length > 0) {
            const key = selectedKeys[0];
            setSelectedTreeNode(key);
            // 直接传入key作为headingId，避免状态更新异步导致的延迟问题
            fetchProcessNodes(1, 20, {headingId: key});
        }
    };

    // 处理分页变化
    const handlePageChange = (pageNum: number, pageSize: number) => {
        const formValues = filterFormRef.current?.getReportFiltersValue() || {};
        fetchProcessNodes(pageNum, pageSize, {
            ...formValues,
            headingId: selectedTreeNode
        });
    };

    // 处理流程节点搜索
    const handleNodeSearch = (value: string) => {
        setNodeSearchKeyword(value);
        searchTableData({keyWord: value});
    };

    // 监听窗口大小变化，动态调整表格高度
    useEffect(() => {
        const calculateTableHeight = () => {
            const windowHeight = window.innerHeight;
            // 减去页面其他元素的高度，如头部、筛选区域、分页等
            // 这里可以根据实际页面布局调整计算逻辑
            const otherElementsHeight = 200; // 预估其他元素占用的高度
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

    // 初始化数据
    useEffect(() => {
        fetchHeadingTree();
    }, [id]);

    // 表格列定义
    const columns = [
        {
            title: '标题',
            dataIndex: 'headingText',
            key: 'headingText',
            width: 170,
        },
        {
            title: '序号',
            dataIndex: 'sequenceNo',
            key: 'sequenceNo',
            align: 'center',
            width: 80,
        },
        {
            title: '内容',
            dataIndex: 'content',
            key: 'content',
            ellipsis: true,
            tooltip: (text: string) => text,
        }
    ];

    return (
        <div className="docinfo-manager">
            <Layout>
                <Sider
                    resizeDirections={['right']}
                    style={{
                        minWidth: 200,
                        maxWidth: 400,
                        height: '100%',
                        backgroundColor: '#fff',
                        borderRight: '1px solid #e5e6eb',
                    }}
                >
                    <div style={{padding: '12px', borderBottom: '1px solid #e5e6eb'}}>
                        <Input.Search
                            placeholder="搜索标题"
                            allowClear
                            value={searchKeyword}
                            onChange={(value) => handleSearchChange(value)}
                        />
                    </div>
                    <div style={{padding: '12px', height: 'calc(100% - 60px)', overflow: 'auto'}}>
                        <Spin loading={treeLoading}>
                            {filteredTreeData.length > 0 ? (
                                <Tree
                                    treeData={filteredTreeData}
                                    expandedKeys={expandedKeys}
                                    selectedKeys={selectedTreeNode ? [selectedTreeNode] : []}
                                    onSelect={handleTreeSelect}
                                    onExpand={(keys) => setExpandedKeys(keys)}
                                    style={{
                                        backgroundColor: 'transparent',
                                    }}
                                    blockNode
                                />
                            ) : (
                                <div style={{textAlign: 'center', color: '#86909c', padding: '40px 0'}}>
                                    暂无标题数据
                                </div>
                            )}
                        </Spin>
                    </div>
                </Sider>
                <Content>
                    <FilterForm
                        ref={filterFormRef}
                        onSearch={searchTableData}
                        onReset={searchTableData}
                    >
                        <Form.Item label="节点内容" field="keyWord">
                            <Input
                                placeholder="请输入节点内容关键字"
                                allowClear
                            />
                        </Form.Item>
                    </FilterForm>
                    <Table
                        columns={columns}
                        data={tableData}
                        loading={tableLoading}
                        rowKey="id"
                        pagination={{
                            ...pagination,
                            onChange: handlePageChange,
                            showSizeChanger: true,
                            showTotal: (total) => `共 ${total} 条数据`
                        }}
                        scroll={{
                            y: tableScrollHeight,
                        }}
                    />
                </Content>
            </Layout>
        </div>
    );
}