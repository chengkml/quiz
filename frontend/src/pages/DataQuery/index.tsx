import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Tooltip,
} from '@arco-design/web-react';
import {
  IconPlayArrow,
  IconStorage,
  IconApps,
  IconRefresh,
  IconPlus,
  IconDelete,
} from '@arco-design/web-react/icon';
import {
  getDatasourceList,
  getSchemas,
  collectSchema,
  executeSqlQuery,
  createDatasource,
  validateConnection,
} from '../Datasource/api';
import './style/index.less';

const { Sider, Content } = Layout;
const Option = Select.Option;

interface DatasourceItem {
  id: string;
  name: string;
  type?: string;
}

interface TableSchemaItem {
  tableName: string;
  remarks?: string;
  tableCat?: string;
  tableSchem?: string;
}

interface QueryResult {
  success?: boolean;
  type?: string;
  columns?: string[];
  data?: Array<Record<string, any>>;
  affectedRows?: number;
  error?: string;
  executedAt?: number;
}

const DATASOURCE_TYPES = [
  {
    label: 'MySQL',
    value: 'MYSQL',
    driver: 'com.mysql.cj.jdbc.Driver',
    urlTemplate: 'jdbc:mysql://localhost:3306/db?useSSL=false&serverTimezone=UTC',
  },
  {
    label: 'PostgreSQL',
    value: 'POSTGRESQL',
    driver: 'org.postgresql.Driver',
    urlTemplate: 'jdbc:postgresql://localhost:5432/db',
  },
  {
    label: 'Oracle',
    value: 'ORACLE',
    driver: 'oracle.jdbc.OracleDriver',
    urlTemplate: 'jdbc:oracle:thin:@localhost:1521:xe',
  },
  {
    label: 'SQL Server',
    value: 'SQLSERVER',
    driver: 'com.microsoft.sqlserver.jdbc.SQLServerDriver',
    urlTemplate: 'jdbc:sqlserver://localhost:1433;databaseName=db',
  },
  {
    label: 'ClickHouse',
    value: 'CLICKHOUSE',
    driver: 'com.clickhouse.jdbc.ClickHouseDriver',
    urlTemplate: 'jdbc:clickhouse://localhost:8123/default',
  },
  {
    label: 'MariaDB',
    value: 'MARIADB',
    driver: 'org.mariadb.jdbc.Driver',
    urlTemplate: 'jdbc:mariadb://localhost:3306/db',
  },
  {
    label: 'SQLite',
    value: 'SQLITE',
    driver: 'org.sqlite.JDBC',
    urlTemplate: 'jdbc:sqlite:data.db',
  },
  {
    label: 'DM (达梦)',
    value: 'DM',
    driver: 'dm.jdbc.driver.DmDriver',
    urlTemplate: 'jdbc:dm://localhost:5236',
  },
];

const DataQuery: React.FC = () => {
  const [datasources, setDatasources] = useState<DatasourceItem[]>([]);
  const [selectedDs, setSelectedDs] = useState<string>('');

  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaList, setSchemaList] = useState<string[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<string | undefined>(undefined);

  const [tableKeyword, setTableKeyword] = useState('');
  const [tables, setTables] = useState<TableSchemaItem[]>([]);

  const [sql, setSql] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<QueryResult | null>(null);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addForm] = Form.useForm();

  const tableCacheRef = useRef<Map<string, TableSchemaItem[]>>(new Map());

  const getCacheKey = (dsId: string, schema?: string) => `${dsId}::${schema || '__all__'}`;

  const fetchDatasources = useCallback(async () => {
    try {
      const res = await getDatasourceList({ pageNum: 0, pageSize: 100, active: true });
      const list = (res?.data?.content || []) as DatasourceItem[];
      setDatasources(list);
      return list;
    } catch {
      Message.error('加载并获取数据源失败');
      setDatasources([]);
      return [] as DatasourceItem[];
    }
  }, []);

  const loadTables = useCallback(async (dsId: string, schema?: string, force = false) => {
    const cacheKey = getCacheKey(dsId, schema);
    if (!force && tableCacheRef.current.has(cacheKey)) {
      setTables(tableCacheRef.current.get(cacheKey) || []);
      return;
    }

    const res = await collectSchema(dsId, schema);
    const list = (res?.data?.tables || []) as TableSchemaItem[];
    tableCacheRef.current.set(cacheKey, list);
    setTables(list);
  }, []);

  const handleDsChange = useCallback(
    async (value?: string) => {
      const dsId = (value || '') as string;
      setSelectedDs(dsId);
      setSelectedSchema(undefined);
      setSchemaList([]);
      setTableKeyword('');
      setTables([]);
      setSql('');
      setResults(null);

      if (!dsId) return;

      setSchemaLoading(true);
      try {
        const schemaRes = await getSchemas(dsId);
        const schemas = Array.isArray(schemaRes?.data)
          ? schemaRes.data.filter((item: unknown): item is string => !!item)
          : [];
        setSchemaList(schemas);

        const nextSchema = schemas.length > 0 ? schemas[0] : undefined;
        setSelectedSchema(nextSchema);
        await loadTables(dsId, nextSchema, false);
      } catch (e: any) {
        Message.error(e?.message || '获取表结构失败');
      } finally {
        setSchemaLoading(false);
      }
    },
    [loadTables]
  );

  const handleSchemaChange = useCallback(
    async (value?: string) => {
      if (!selectedDs) return;
      setSelectedSchema(value);
      setSchemaLoading(true);
      try {
        await loadTables(selectedDs, value, false);
      } catch (e: any) {
        Message.error(e?.message || '加载表结构失败');
      } finally {
        setSchemaLoading(false);
      }
    },
    [loadTables, selectedDs]
  );

  const handleRefreshSchema = useCallback(async () => {
    if (!selectedDs) {
      Message.warning('请先选择数据源');
      return;
    }

    setSchemaLoading(true);
    try {
      const cacheKey = getCacheKey(selectedDs, selectedSchema);
      tableCacheRef.current.delete(cacheKey);
      await loadTables(selectedDs, selectedSchema, true);
      Message.success('表结构已刷新');
    } catch (e: any) {
      Message.error(e?.message || '刷新失败');
    } finally {
      setSchemaLoading(false);
    }
  }, [loadTables, selectedDs, selectedSchema]);

  const handleExecute = async () => {
    if (!selectedDs) {
      Message.warning('请先选择数据源');
      return;
    }

    const trimmedSql = sql.trim();
    if (!trimmedSql) {
      Message.warning('请输入SQL语句');
      return;
    }

    setLoading(true);
    try {
      const res = await executeSqlQuery(selectedDs, trimmedSql);
      const payload = res?.data || {};
      if (payload.success) {
        setResults({ ...payload, executedAt: Date.now() });
        Message.success('执行成功');
      } else {
        setResults({ error: payload.error || '未知错误' });
        Message.error(payload.error || '执行失败');
      }
    } catch (e: any) {
      const errMsg = e?.message || '请求执行失败';
      setResults({ error: errMsg });
      Message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleInsertSelectTemplate = (tableName: string) => {
    if (!tableName) return;
    setSql(`SELECT *\nFROM ${tableName}\nLIMIT 10;`);
  };

  const filteredTables = useMemo(() => {
    const keyword = tableKeyword.trim().toLowerCase();
    if (!keyword) return tables;
    return tables.filter(
      (table) =>
        table.tableName?.toLowerCase().includes(keyword) ||
        table.remarks?.toLowerCase().includes(keyword)
    );
  }, [tableKeyword, tables]);

  const treeData = useMemo(() => {
    const nodes = filteredTables.map((table) => ({
      title: (
        <div className="table-node" title={table.remarks || table.tableName}>
          <span className="table-node-name">{table.tableName}</span>
          {table.remarks ? (
            <span className="table-node-remark">{table.remarks}</span>
          ) : null}
        </div>
      ),
      key: table.tableName,
      icon: <IconApps />,
      isLeaf: true,
    }));

    return [
      {
        title: `Tables (${filteredTables.length})`,
        key: 'tables-root',
        icon: <IconStorage />,
        children: nodes,
      },
    ];
  }, [filteredTables]);

  const resultCount = Array.isArray(results?.data) ? results?.data.length || 0 : 0;

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
      const columns = (results.columns || []).map((col) => ({
        title: col,
        dataIndex: col,
        key: col,
        ellipsis: true,
        width: 180,
      }));

      return (
        <Table
          rowKey={(_, index) => `row-${index}`}
          size="small"
          scroll={{ x: true, y: 420 }}
          columns={columns}
          data={results.data || []}
          pagination={{ sizeCanChange: true, showTotal: true, pageSize: 20 }}
        />
      );
    }

    return (
      <div className="impact-results">
        <Tag color="green">受影响行数: {results.affectedRows ?? 0}</Tag>
      </div>
    );
  };

  useEffect(() => {
    fetchDatasources();
  }, [fetchDatasources]);

  return (
    <div className="data-query-page">
      <Layout style={{ height: 'calc(100vh - 64px)' }}>
        <Sider width={320} className="query-sider">
          <div className="sider-header">
            <Space style={{ width: '100%' }}>
              <Select
                placeholder="选择数据源"
                value={selectedDs}
                onChange={(v) => handleDsChange(v as string)}
                style={{ flex: 1 }}
                allowClear
              >
                {datasources.map((ds) => (
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

          <div className="sider-filters">
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              <Space style={{ width: '100%' }}>
                <Select
                  allowClear
                  disabled={!selectedDs || schemaList.length === 0}
                  placeholder={schemaList.length ? '选择 schema' : '无 schema，可直接查询'}
                  value={selectedSchema}
                  onChange={(v) => handleSchemaChange(v as string | undefined)}
                  style={{ flex: 1 }}
                >
                  {schemaList.map((schema) => (
                    <Option key={schema} value={schema}>
                      {schema}
                    </Option>
                  ))}
                </Select>
                <Tooltip title="刷新表结构">
                  <Button icon={<IconRefresh />} onClick={handleRefreshSchema} />
                </Tooltip>
              </Space>

              <Input
                placeholder="搜索表名/备注"
                value={tableKeyword}
                allowClear
                onChange={setTableKeyword}
              />
            </Space>
          </div>

          <div className="sider-content">
            <Spin loading={schemaLoading} block>
              {selectedDs ? (
                filteredTables.length > 0 ? (
                  <Tree
                    treeData={treeData}
                    showLine
                    onSelect={(selectedKeys) => {
                      if (selectedKeys.length > 0 && selectedKeys[0] !== 'tables-root') {
                        handleInsertSelectTemplate(String(selectedKeys[0]));
                      }
                    }}
                  />
                ) : (
                  <div className="tree-empty">
                    <IconStorage style={{ fontSize: 32, color: 'var(--color-text-4)' }} />
                    <p>{tableKeyword ? '未匹配到表' : '暂无表结构数据'}</p>
                  </div>
                )
              ) : (
                <div className="tree-empty">
                  <IconStorage style={{ fontSize: 32, color: 'var(--color-text-4)' }} />
                  <p>请选择数据源</p>
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
                  <Space size={8}>
                    <Button
                      type="primary"
                      icon={<IconPlayArrow />}
                      loading={loading}
                      onClick={handleExecute}
                      disabled={!selectedDs || !sql.trim()}
                    >
                      运行
                    </Button>
                    <Button icon={<IconDelete />} onClick={() => setSql('')}>
                      清空SQL
                    </Button>
                  </Space>
                  <Typography.Text type="secondary" className="toolbar-tip">
                    Ctrl + Enter 快速执行
                  </Typography.Text>
                </div>

                <Input.TextArea
                  className="sql-editor"
                  placeholder="输入SQL语句..."
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
                  extra={
                    results ? (
                      <Space size={12}>
                        {results.executedAt ? (
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {new Date(results.executedAt).toLocaleTimeString()}
                          </Typography.Text>
                        ) : null}
                        {results.type === 'SELECT' ? (
                          <Typography.Text style={{ fontSize: 12 }}>{resultCount} 条记录</Typography.Text>
                        ) : null}
                      </Space>
                    ) : null
                  }
                >
                  {renderResults()}
                </Card>
              </div>,
            ]}
          />
        </Content>
      </Layout>

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
            <Button
              type="primary"
              onClick={async () => {
                try {
                  const values = await addForm.validate();
                  const res = await createDatasource(values);
                  const createdId = res?.data?.id as string | undefined;
                  Message.success('创建成功');
                  setAddModalVisible(false);

                  await fetchDatasources();
                  if (createdId) {
                    await handleDsChange(createdId);
                  }
                } catch (e: any) {
                  if (e?.errorFields) return;
                  Message.error(e?.message || '创建失败');
                }
              }}
            >
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
              const typeCfg = DATASOURCE_TYPES.find((t) => t.value === changedValues.type);
              if (typeCfg) {
                addForm.setFieldsValue({
                  driver: typeCfg.driver,
                  jdbcUrl: typeCfg.urlTemplate,
                });
              }
            }
          }}
        >
          <Form.Item label="名称" field="name" rules={[{ required: true, message: '请输入名称' }]}>
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
            <Input.TextArea placeholder="备注信息" maxLength={500} showWordLimit />
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
