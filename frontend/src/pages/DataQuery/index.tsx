import React, { useState, useEffect } from 'react';
import {
    Layout,
    Tree,
    Select,
    Button,
    Table,
    Message,
    Input,
    Space,
    ResizeBox,
    Card,
    Typography,
    Empty,
    Spin,
    Tag,
    Grid,
    Drawer,
} from '@arco-design/web-react';
import {
    IconPlayArrow,
    IconStorage,
    IconApps,
    IconThunderbolt,
    IconSearch,
    IconMenu,
} from '@arco-design/web-react/icon';
import { getDatasourceList, getSchemas, executeSqlQuery } from '../Datasource/api';
import './style/index.less';

const { Sider, Content } = Layout;
const { Row, Col } = Grid;
const { useBreakpoint } = Grid;

const DataQuery: React.FC = () => {
    const screens = useBreakpoint();
    const isMobile = !screens.md; // md is 768px

    const [datasources, setDatasources] = useState<any[]>([]);
    const [selectedDs, setSelectedDs] = useState<string>('');
    const [schemaLoading, setSchemaLoading] = useState(false);
    const [treeData, setTreeData] = useState<any[]>([]);
    const [sql, setSql] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);

    useEffect(() => {
        fetchDatasources();
    }, []);

    const fetchDatasources = async () => {
        try {
            const res = await getDatasourceList({ pageNum: 0, pageSize: 100 });
            const list = res?.data?.content || [];
            setDatasources(list);
            if (list.length > 0) {
                // Not selecting by default to avoid heavy loading
            }
        } catch (e: any) {
            Message.error('加载并获取数据源失败');
        }
    };

    const handleDsChange = async (value: string) => {
        setSelectedDs(value);
        setSchemaLoading(true);
        try {
            const res = await getSchemas(value);
            const tables = res?.data?.tables || [];
            const nodes = tables.map((t: any) => ({
                title: t.tableName,
                key: t.tableName,
                icon: <IconApps />,
                isLeaf: true,
            }));
            setTreeData([
                {
                    title: 'Tables',
                    key: 'tables-root',
                    icon: <IconStorage />,
                    children: nodes,
                },
            ]);
        } catch (e: any) {
            Message.error('获取架构失败');
        } finally {
            setSchemaLoading(false);
        }
    };

    const handleExecute = async () => {
        if (!selectedDs) {
            Message.warning('请先选择数据源');
            return;
        }
        if (!sql.trim()) {
            Message.warning('请输入SQL语句');
            return;
        }

        setLoading(true);
        try {
            const res = await executeSqlQuery(selectedDs, sql);
            if (res.data?.success) {
                setResults(res.data);
                Message.success('执行成功');
                // On mobile, maybe scroll to results?
            } else {
                setResults({ error: res.data?.error || '未知错误' });
                Message.error(res.data?.error || '执行失败');
            }
        } catch (e: any) {
            Message.error('请求执行失败');
        } finally {
            setLoading(false);
        }
    };

    const renderResults = () => {
        if (!results) {
            return (
                <div className="empty-results">
                    <Empty description="暂无执行结果" />
                </div>
            );
        }

        if (results.error) {
            return (
                <div className="error-results">
                    <Typography.Text type="error" copyable>
                        {results.error}
                    </Typography.Text>
                </div>
            );
        }

        if (results.type === 'SELECT') {
            const columns = (results.columns || []).map((col: string) => ({
                title: col,
                dataIndex: col,
                key: col,
                ellipsis: true,
                width: 150,
            }));

            return (
                <Table
                    size="small"
                    scroll={{ x: true, y: 400 }}
                    columns={columns}
                    data={results.data}
                    pagination={{ sizeCanChange: true, showTotal: true, pageSize: 20 }}
                />
            );
        }

        return (
            <div className="impact-results">
                <Tag color="green">
                    受影响行数: {results.affectedRows}
                </Tag>
            </div>
        );
    };

    const SiderContent = (
        <div className="query-sider-inner" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
             <div className="sider-header" style={{ padding: '10px' }}>
                <Select
                    placeholder="选择数据源"
                    value={selectedDs}
                    onChange={handleDsChange}
                    style={{ width: '100%' }}
                >
                    {datasources.map(ds => (
                        <Select.Option key={ds.id} value={ds.id}>
                            {ds.name} ({ds.type})
                        </Select.Option>
                    ))}
                </Select>
            </div>
            <div className="sider-content" style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
                <Spin loading={schemaLoading} style={{ display: 'block' }}>
                    {treeData.length > 0 ? (
                        <Tree
                            treeData={treeData}
                            showLine
                            onSelect={(selectedKeys) => {
                                if (selectedKeys.length > 0 && selectedKeys[0] !== 'tables-root') {
                                    setSql(`SELECT * FROM ${selectedKeys[0]} LIMIT 10;`);
                                    if(isMobile) setMobileDrawerVisible(false);
                                }
                            }}
                        />
                    ) : (
                        <div className="tree-empty" style={{ textAlign: 'center', marginTop: 20 }}>
                            <IconStorage style={{ fontSize: 32, color: 'var(--color-text-4)' }} />
                            <p style={{ color: 'var(--color-text-4)' }}>未加载表结构</p>
                        </div>
                    )}
                </Spin>
            </div>
        </div>
    );

    return (
        <div className="data-query-page">
            <Layout style={{ height: 'calc(100vh - 64px)' }}>
                {!isMobile && (
                    <Sider width={280} className="query-sider">
                        {SiderContent}
                    </Sider>
                )}

                {isMobile && (
                    <Drawer
                        width="80%"
                        title="数据源 & 表"
                        visible={mobileDrawerVisible}
                        onCancel={() => setMobileDrawerVisible(false)}
                        footer={null}
                        placement="left"
                    >
                        {SiderContent}
                    </Drawer>
                )}

                <Content style={{ padding: 0 }}>
                     {isMobile && (
                        <div style={{ padding: '8px', background: 'var(--color-bg-2)', borderBottom: '1px solid var(--color-border-2)' }}>
                            <Button icon={<IconMenu />} onClick={() => setMobileDrawerVisible(true)}>
                                选择数据源
                            </Button>
                        </div>
                    )}

                    {isMobile ? (
                        <div style={{ height: 'calc(100% - 48px)', display: 'flex', flexDirection: 'column' }}>
                             <div className="editor-container" key="editor" style={{ flex: '0 0 40%', display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--color-border-2)' }}>
                                <div className="editor-toolbar" style={{ padding: '8px' }}>
                                    <Space size={16}>
                                        <Button
                                            type="primary"
                                            size="small"
                                            icon={<IconPlayArrow />}
                                            loading={loading}
                                            onClick={handleExecute}
                                        >
                                            运行
                                        </Button>
                                        <Button
                                            size="small"
                                            icon={<IconThunderbolt />}
                                            onClick={() => setSql(sql + '\n')}
                                        >
                                            美化
                                        </Button>
                                    </Space>
                                </div>
                                <Input.TextArea
                                    className="sql-editor"
                                    placeholder="输入SQL语句..."
                                    value={sql}
                                    onChange={setSql}
                                    style={{ flex: 1, resize: 'none', border: 'none', borderRadius: 0 }}
                                />
                            </div>
                            <div className="results-container" key="results" style={{ flex: 1, overflow: 'hidden' }}>
                                <Card
                                    title="执行结果"
                                    size="small"
                                    bordered={false}
                                    style={{ height: '100%' }}
                                    bodyStyle={{ height: 'calc(100% - 40px)', padding: 0, overflow: 'auto' }}
                                    extra={results?.data?.length ? <Typography.Text style={{fontSize: 12}}>{results.data.length} 条记录</Typography.Text> : null}
                                >
                                    <div style={{ padding: 12 }}>
                                        {renderResults()}
                                    </div>
                                </Card>
                            </div>
                        </div>
                    ) : (
                        <ResizeBox.Split
                            direction="vertical"
                            style={{ height: '100%' }}
                            panes={[
                                <div className="editor-container" key="editor" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <div className="editor-toolbar" style={{ padding: '10px' }}>
                                        <Space size={16}>
                                            <Button
                                                type="primary"
                                                icon={<IconPlayArrow />}
                                                loading={loading}
                                                onClick={handleExecute}
                                            >
                                                运行
                                            </Button>
                                            <Button
                                                icon={<IconThunderbolt />}
                                                onClick={() => setSql(sql + '\n')}
                                            >
                                                美化 (Mock)
                                            </Button>
                                        </Space>
                                    </div>
                                    <Input.TextArea
                                        className="sql-editor"
                                        placeholder="输入SQL语句... (Ctrl + Enter 运行)"
                                        value={sql}
                                        onChange={setSql}
                                        style={{ flex: 1, resize: 'none', border: 'none', padding: 10 }}
                                        onKeyDown={(e) => {
                                            if (e.ctrlKey && e.key === 'Enter') {
                                                handleExecute();
                                            }
                                        }}
                                    />
                                </div>,
                                <div className="results-container" key="results" style={{ height: '100%', overflow: 'hidden' }}>
                                    <Card
                                        title="执行结果"
                                        size="small"
                                        bordered={false}
                                        style={{ height: '100%' }}
                                        bodyStyle={{ height: 'calc(100% - 48px)', overflow: 'auto' }}
                                        extra={results?.data?.length ? <Typography.Text style={{fontSize: 12}}>{results.data.length} 条记录</Typography.Text> : null}
                                    >
                                        {renderResults()}
                                    </Card>
                                </div>
                            ]}
                        />
                    )}
                </Content>
            </Layout>
        </div>
    );
};

export default DataQuery;
