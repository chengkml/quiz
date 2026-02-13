import React, { useState, useEffect, useRef } from 'react';
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
    Modal,
    Form,
    Tooltip
} from '@arco-design/web-react';
import {
    IconPlayArrow,
    IconStorage,
    IconApps,
    IconThunderbolt,
    IconPlus,
} from '@arco-design/web-react/icon';
import {
    getDatasourceList,
    getSchemas,
    executeSqlQuery,
    createDatasource,
    validateConnection
} from '../Datasource/api';
import './style/index.less';

const { Sider, Content } = Layout;
const Option = Select.Option;

const DATASOURCE_TYPES = [
    { label: 'MySQL', value: 'MYSQL', driver: 'com.mysql.cj.jdbc.Driver', urlTemplate: 'jdbc:mysql://localhost:3306/db?useSSL=false&serverTimezone=UTC' },
    { label: 'PostgreSQL', value: 'POSTGRESQL', driver: 'org.postgresql.Driver', urlTemplate: 'jdbc:postgresql://localhost:5432/db' },
    { label: 'Oracle', value: 'ORACLE', driver: 'oracle.jdbc.OracleDriver', urlTemplate: 'jdbc:oracle:thin:@localhost:1521:xe' },
    { label: 'SQL Server', value: 'SQLSERVER', driver: 'com.microsoft.sqlserver.jdbc.SQLServerDriver', urlTemplate: 'jdbc:sqlserver://localhost:1433;databaseName=db' },
    { label: 'ClickHouse', value: 'CLICKHOUSE', driver: 'com.clickhouse.jdbc.ClickHouseDriver', urlTemplate: 'jdbc:clickhouse://localhost:8123/default' },
    { label: 'MariaDB', value: 'MARIADB', driver: 'org.mariadb.jdbc.Driver', urlTemplate: 'jdbc:mariadb://localhost:3306/db' },
    { label: 'SQLite', value: 'SQLITE', driver: 'org.sqlite.JDBC', urlTemplate: 'jdbc:sqlite:data.db' },
    { label: 'DM (达梦)', value: 'DM', driver: 'dm.jdbc.driver.DmDriver', urlTemplate: 'jdbc:dm://localhost:5236' },
];

const DataQuery: React.FC = () => {
    const [datasources, setDatasources] = useState<any[]>([]);
    const [selectedDs, setSelectedDs] = useState<string>('');
    const [schemaLoading, setSchemaLoading] = useState(false);
    const [treeData, setTreeData] = useState<any[]>([]);
    const [sql, setSql] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(null);

    // Add Datasource Modal State
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [addForm] = Form.useForm();

    useEffect(() => {
        fetchDatasources();
    }, []);

    const fetchDatasources = async () => {
        try {
            const res = await getDatasourceList({ pageNum: 0, pageSize: 100, active: true });
            const list = res?.data?.content || [];
            setDatasources(list);
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

    const handleAddSubmit = async () => {
        try {
            const values = await addForm.validate();
            await createDatasource(values);
            Message.success('创建成功');
            setAddModalVisible(false);
            fetchDatasources(); // Refresh list
        } catch (e: any) {
            if (e?.errorFields) return;
            Message.error(e?.message || '创建失败');
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

    return (
        <div className="data-query-page">
            <Layout style={{ height: 'calc(100vh - 64px)' }}>
                <Sider width={280} className="query-sider">
                    <div className="sider-header">
                        <Space style={{ width: '100%' }}>
                            <Select
                                placeholder="选择数据源"
                                value={selectedDs}
                                onChange={handleDsChange}
                                style={{ flex: 1 }}
                            >
                                {datasources.map(ds => (
                                    <Select.Option key={ds.id} value={ds.id}>
                                        {ds.name} ({ds.type})
                                    </Select.Option>
                                ))}
                            </Select>
                            <Tooltip title="新增数据源">
                                <Button
                                    icon={<IconPlus />}
                                    onClick={() => {
                                        addForm.resetFields();
                                        addForm.setFieldsValue({ active: true });
                                        setAddModalVisible(true);
                                    }}
                                />
                            </Tooltip>
                        </Space>
                    </div>
                    <div className="sider-content">
                        <Spin loading={schemaLoading}>
                            {treeData.length > 0 ? (
                                <Tree
                                    treeData={treeData}
                                    showLine
                                    onSelect={(selectedKeys) => {
                                        if (selectedKeys.length > 0 && selectedKeys[0] !== 'tables-root') {
                                            setSql(`SELECT * FROM ${selectedKeys[0]} LIMIT 10;`);
                                        }
                                    }}
                                />
                            ) : (
                                <div className="tree-empty">
                                    <IconStorage style={{ fontSize: 32, color: 'var(--color-text-4)' }} />
                                    <p>{selectedDs ? '暂无表结构数据' : '请选择数据源'}</p>
                                </div>
                            )}
                        </Spin>
                    </div>
                </Sider>
                <Content>
                    <ResizeBox.Split
                        direction="vertical"
                        style={{ height: '100%' }}
                        panes={[
                            <div className="editor-container" key="editor">
                                <div className="editor-toolbar">
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
                                    onKeyDown={(e) => {
                                        if (e.ctrlKey && e.key === 'Enter') {
                                            handleExecute();
                                        }
                                    }}
                                />
                            </div>,
                            <div className="results-container" key="results">
                                <Card
                                    title="执行结果"
                                    size="small"
                                    bordered={false}
                                    extra={results?.data?.length ? <Typography.Text style={{fontSize: 12}}>{results.data.length} 条记录</Typography.Text> : null}
                                >
                                    {renderResults()}
                                </Card>
                            </div>
                        ]}
                    />
                </Content>
            </Layout>

            {/* 新增数据源弹窗 */}
            <Modal
                title="新增数据源"
                visible={addModalVisible}
                onCancel={() => setAddModalVisible(false)}
                footer={
                    <Space>
                        <Button onClick={() => setAddModalVisible(false)}>取消</Button>
                        <Button
                            onClick={async () => {
                                try {
                                    const values = await addForm.validate();
                                    const res = await validateConnection(values);
                                    const ok = res?.data?.success ?? true;
                                    Message[ok ? 'success' : 'error'](
                                        res?.data?.message || (ok ? '连接成功' : '连接失败')
                                    );
                                } catch (e: any) {
                                    if (e?.errorFields) return;
                                    Message.error(e?.message || '配置校验失败');
                                }
                            }}
                        >
                            测试连接
                        </Button>
                        <Button type="primary" onClick={handleAddSubmit}>
                            保存
                        </Button>
                    </Space>
                }
            >
                <Form
                    form={addForm}
                    layout="vertical"
                    onValuesChange={(changedValues) => {
                        if (changedValues.type) {
                            const typeCfg = DATASOURCE_TYPES.find(
                                (t) => t.value === changedValues.type
                            );
                            if (typeCfg) {
                                addForm.setFieldsValue({
                                    driver: typeCfg.driver,
                                    jdbcUrl: typeCfg.urlTemplate,
                                });
                            }
                        }
                    }}
                >
                    <Form.Item
                        label="名称"
                        field="name"
                        rules={[{ required: true, message: '请输入名称' }]}
                    >
                        <Input placeholder="数据源名称" />
                    </Form.Item>
                    <Form.Item
                        label="数据源类型"
                        field="type"
                        rules={[{ required: true, message: '请选择数据源类型' }]}
                    >
                        <Select placeholder="请选择数据库类型">
                            {DATASOURCE_TYPES.map((t) => (
                                <Option key={t.value} value={t.value}>
                                    {t.label}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item label="驱动类名" field="driver">
                        <Input placeholder="可选，例：com.mysql.cj.jdbc.Driver" />
                    </Form.Item>
                    <Form.Item
                        label="JDBC URL"
                        field="jdbcUrl"
                        rules={[{ required: true, message: '请输入JDBC URL' }]}
                    >
                        <Input placeholder="例：jdbc:mysql://host:3306/db" />
                    </Form.Item>
                    <Form.Item label="用户名" field="username">
                        <Input placeholder="数据库用户名" />
                    </Form.Item>
                    <Form.Item label="密码" field="password">
                        <Input placeholder="数据库密码" type="password" />
                    </Form.Item>
                    <Form.Item label="描述" field="description">
                        <Input.TextArea
                            placeholder="备注信息"
                            maxLength={500}
                            showWordLimit
                        />
                    </Form.Item>
                    <Form.Item label="是否启用" field="active" initialValue={true} hidden>
                        <Select>
                            <Option value={true}>启用</Option>
                            <Option value={false}>禁用</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default DataQuery;
