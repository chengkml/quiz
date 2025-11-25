import React, {useEffect, useRef, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {Button, Dropdown, Form, Input, Layout, Menu, Message, Spin, Table, Tree, Typography} from '@arco-design/web-react';
import {IconList} from '@arco-design/web-react/icon';
import FilterForm from '@/components/FilterForm';
import {getFunctionPointTree, getDocFunctionPoints, generateProcessDescription, generateFlow, generateInf} from './api';
import './style/index.less';

const {Sider, Content} = Layout;
const {Title, Text} = Typography;

export default function DocInfoFeatures() {
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


    // 获取文档功能点树
    const fetchFunctionPointTree = async () => {
        if (!id) return;
        try {
            setTreeLoading(true);
            const response = await getFunctionPointTree(id);
            const treeNodes = convertToTreeNodes(response.data || []);
            setTreeData(treeNodes);
            setFilteredTreeData(treeNodes);
            // 默认展开第一级节点
            const firstLevelKeys = treeNodes.map(node => node.key);
            setExpandedKeys(firstLevelKeys);
            // 不默认选中任何节点
            // 加载功能点数据
            fetchFunctionPoints(1, 20);
        } catch (error) {
            Message.error('获取功能点树失败');
        } finally {
            setTreeLoading(false);
        }
    };

    // 获取文档功能点
    const fetchFunctionPoints = async (pageNum: number = 1, pageSize: number = 20, params: any = {}) => {
        if (!id) return;
        try {
            setTableLoading(true);
            const {keyWord = '', parentId = ''} = params;
            const response = await getDocFunctionPoints(id, pageNum - 1, pageSize, keyWord, parentId);
            setTableData(response.data.content || []);
            setPagination({
                current: pageNum,
                pageSize,
                total: response.data.totalElements || 0
            });
        } catch (error) {
            Message.error('获取功能点失败');
        } finally {
            setTableLoading(false);
        }
    };

    // 搜索表格数据
    const searchTableData = (params = {}) => {
        setPagination(prev => ({...prev, current: 1}));
        // 优先使用params中的parentId，如果没有则使用selectedTreeNode
        fetchFunctionPoints(1, 20, {
            ...params,
            parentId: params.parentId || selectedTreeNode
        });
    };

    // 转换数据为Tree组件需要的格式
    const convertToTreeNodes = (functionPoints: any[]): any[] => {
        // 根据后端FunctionPointTreeDto结构进行转换
        return functionPoints.map(item => ({
            key: item.id,
            title: `${item.level === 1 ? '📑' : item.level === 2 ? '📄' : '📌'} ${item.name}`,
            children: item.children && item.children.length > 0 ? convertToTreeNodes(item.children) : undefined
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

    // 处理功能点树节点选择
    const handleTreeSelect = (selectedKeys: string[], info: any) => {
        if (selectedKeys.length > 0) {
            const key = selectedKeys[0];
            setSelectedTreeNode(key);
            // 直接传入key作为parentId，避免状态更新异步导致的延迟问题
            fetchFunctionPoints(1, 20, {parentId: key});
        }
    };

    // 处理分页变化
    const handlePageChange = (pageNum: number, pageSize: number) => {
        const formValues = filterFormRef.current?.getReportFiltersValue() || {};
        fetchFunctionPoints(pageNum, pageSize, {
            ...formValues,
            parentId: selectedTreeNode
        });
    };

    // 处理功能点搜索
    const handleFunctionPointSearch = (value: string) => {
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
        fetchFunctionPointTree();
    }, [id]);

    // 表格列定义
    // 智能补全功能
    const handleSmartComplete = async (record: any) => {
        try {
            Message.info('正在生成流程说明...');
            const response = await generateProcessDescription(record.id);
            const result = response.data;
            
            // 更新表格数据
            setTableData(prevData => 
                prevData.map(item => 
                    item.id === record.id 
                        ? { 
                            ...item,
                            processSummary: result.processSummary || item.processSummary,
                            processDetail: result.processDetail || item.processDetail,
                            businessDesc: result.businessDesc || item.businessDesc,
                            functionDesc: result.functionDesc || item.functionDesc
                          }
                        : item
                )
            );
            
            Message.success('流程说明生成成功');
        } catch (error) {
            console.error('智能补全失败:', error);
            Message.error('流程说明生成失败，请重试');
        }
    };

    // 生成流程图功能
    const handleGenerateFlow = async (record: any) => {
        try {
            Message.info('正在生成流程图...');
            const response = await generateFlow(record.id);
            const mermaidBase64 = response.data; // 后端直接返回 Base64 编码字符串

            if (mermaidBase64) {
                const mermaidUrl = `https://mermaid.ink/img/${mermaidBase64}`;
                window.open(mermaidUrl, '_blank');
            }

            Message.success('流程图生成成功');
        } catch (error) {
            console.error('流程图生成失败:', error);
            Message.error('流程图生成失败，请重试');
        }
    };

    // 生成接口说明功能
    const handleGenerateInf = async (record: any) => {
        try {
            Message.info('正在生成接口说明...');
            const response = await generateInf(record.id);
            const result = response.data;
            
            // 更新表格数据中的接口说明
            setTableData(prevData => 
                prevData.map(item => 
                    item.id === record.id 
                        ? { 
                            ...item,
                            infDesc: result.infDesc || item.infDesc,
                            infDetail: result.infDetail || item.infDetail
                          }
                        : item
                )
            );
            
            Message.success('接口说明生成成功');
        } catch (error) {
            console.error('接口说明生成失败:', error);
            Message.error('接口说明生成失败，请重试');
        }
    };


    const columns = [
        {
            title: '子模块名称',
            dataIndex: 'parentName',
            key: 'parentName',
            width: 170,
        },
        {
            title: '功能点名称',
            dataIndex: 'name',
            key: 'name',
            width: 170,
        },
        {
            title: '业务说明',
            dataIndex: 'businessDesc',
            key: 'businessDesc',
            ellipsis: true,
            tooltip: (text: string) => text,
        },
        {
            title: '流程简述',
            dataIndex: 'processSummary',
            key: 'processSummary',
            ellipsis: true,
            tooltip: (text: string) => text,
        },
        {
            title: '流程步骤',
            dataIndex: 'processDetail',
            key: 'processDetail',
            ellipsis: true,
            tooltip: (text: string) => text,
        },
        {
            title: '功能描述',
            dataIndex: 'functionDesc',
            key: 'functionDesc',
            ellipsis: true,
            tooltip: (text: string) => text,
        },
        {            title: '流程图代码',            dataIndex: 'mermaidCode',            key: 'mermaidCode',            ellipsis: true,            tooltip: (text: string) => text,        },        {            title: '接口描述',            dataIndex: 'infDesc',            key: 'infDesc',            ellipsis: true,            tooltip: (text: string) => text,        },        {            title: '接口详情',            dataIndex: 'infDetail',            key: 'infDetail',            ellipsis: true,            tooltip: (text: string) => text,        },
        {
            title: '操作',
            key: 'action',
            width: 100,
            fixed: 'right',
            align: 'center',
            render: (text: string, record: any) => (
                <Dropdown
                        droplist={
                            <Menu>
                                    <Menu.Item key="smartComplete" onClick={() => handleSmartComplete(record)}>
                                        智能补全
                                    </Menu.Item>
                                    <Menu.Item key="generateFlow" onClick={() => handleGenerateFlow(record)}>
                                        生成流程图
                                    </Menu.Item>
                                    <Menu.Item key="generateInf" onClick={() => handleGenerateInf(record)}>
                                        生成接口说明
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
                            placeholder="搜索功能点标题"
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
                                    暂无功能点数据
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
                       <Form.Item label="功能点搜索" field="keyWord" initialValue={nodeSearchKeyword}>
                        <Input.Search
                            placeholder="请输入功能点名称进行搜索"
                            allowClear
                            onPressEnter={handleFunctionPointSearch}
                            onSearch={handleFunctionPointSearch}
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