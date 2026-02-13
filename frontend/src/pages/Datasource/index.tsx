import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  Form,
  Input,
  Message,
  Modal,
  Select,
  Space,
  Tag,
  Table,
  Popconfirm,
  Tooltip,
} from '@arco-design/web-react';
import {
  IconEdit,
  IconDelete,
  IconRefresh,
  IconStorage,
  IconPlus,
} from '@arco-design/web-react/icon';
import { DataManager } from '@/components/DataManager';
import FilterForm from '@/components/FilterForm';
import { FormFieldConfig } from '@/components/types/types';
import {
  collectSchema,
  exportSchemaExcel,
  createDatasource,
  deleteDatasource,
  getDatasourceById,
  getDatasourceList,
  getSchemas,
  testConnection,
  validateConnection,
  updateDatasource,
} from './api';
import './style/index.less';

const Option = Select.Option;

const DATASOURCE_TYPES = [
  {
    label: 'MySQL',
    value: 'MYSQL',
    driver: 'com.mysql.cj.jdbc.Driver',
    urlTemplate:
      'jdbc:mysql://localhost:3306/db?useSSL=false&serverTimezone=UTC',
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

function DatasourceManager() {
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const filterFormRef = useRef<any>(null);

  // Modals
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<any | null>(null);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Schema Collection
  const [schemaModalVisible, setSchemaModalVisible] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaData, setSchemaData] = useState<any | null>(null);
  const [schemaList, setSchemaList] = useState<string[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<string | undefined>(
    undefined
  );
  const [collecting, setCollecting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Load Data
  const fetchTableData = async (page = pagination, params: any = {}) => {
    setTableLoading(true);
    try {
      const queryParams = {
        name: params.name || undefined,
        active:
          params.active === ''
            ? undefined
            : params.active === 'true'
            ? true
            : params.active === 'false'
            ? false
            : undefined,
        pageNum: (page.current || 1) - 1,
        pageSize: page.pageSize || 10,
        sortColumn: 'create_date',
        sortType: 'desc',
      };
      const res = await getDatasourceList(queryParams);
      const data = res.data;
      setTableData(data?.content || []);
      setPagination({
        current: (data?.number ?? 0) + 1,
        pageSize: data?.size ?? page.pageSize,
        total: data?.totalElements ?? 0,
      });
    } catch (e: any) {
      Message.error(e?.message || '加载数据失败');
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchTableData({ current: 1, pageSize: 10, total: 0 });
  }, []);

  const handleSearch = () => {
    const values = filterFormRef.current?.getFieldsValue();
    fetchTableData({ ...pagination, current: 1 }, values);
  };

  const handleReset = () => {
    filterFormRef.current?.resetFields();
    fetchTableData({ ...pagination, current: 1 });
  };

  // Operations
  const handleAdd = () => {
    addForm.resetFields();
    addForm.setFieldsValue({ active: true });
    setAddModalVisible(true);
  };

  const handleEdit = async (record: any) => {
    try {
      const res = await getDatasourceById(record.id);
      setCurrentItem(res.data);
      editForm.setFieldsValue({
        id: res.data.id,
        name: res.data.name,
        type: res.data.type,
        driver: res.data.driver,
        jdbcUrl: res.data.jdbcUrl,
        username: res.data.username,
        password: '',
        description: res.data.description,
        active: res.data.active,
      });
      setEditModalVisible(true);
    } catch (e: any) {
      Message.error(e?.message || '加载详情失败');
    }
  };

  const handleDelete = async (record: any) => {
    try {
      await deleteDatasource(record.id);
      Message.success('删除成功');
      handleSearch();
    } catch (e: any) {
      Message.error(e?.message || '删除失败');
    }
  };

  const handleAddSubmit = async () => {
    try {
      const values = await addForm.validate();
      await createDatasource(values);
      Message.success('创建成功');
      setAddModalVisible(false);
      handleSearch();
    } catch (e: any) {
      if (e?.errorFields) return;
      Message.error(e?.message || '创建失败');
    }
  };

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validate();
      await updateDatasource(values);
      Message.success('更新成功');
      setEditModalVisible(false);
      handleSearch();
    } catch (e: any) {
      if (e?.errorFields) return;
      Message.error(e?.message || '更新失败');
    }
  };

  const handleTestConnection = async (record: any) => {
    try {
      setTableLoading(true);
      const res = await testConnection(record.id);
      const ok = res?.data?.success ?? true;
      Message[ok ? 'success' : 'error'](
        res?.data?.message || (ok ? '连接测试成功' : '连接测试失败')
      );
    } catch (error: any) {
      Message.error(error?.message || '连接测试失败');
    } finally {
      setTableLoading(false);
    }
  };

  // Schema Operations
  const handleCollectSchema = async (record: any) => {
    setSchemaModalVisible(true);
    setSchemaLoading(true);
    setSchemaData(null);
    setSchemaList([]);
    setSelectedSchema(undefined);
    setCurrentItem(record);
    try {
      const res = await getSchemas(record.id);
      const list = res?.data || [];
      setSchemaList(list);
      if (!list || list.length === 0) {
        Message.info('未获取到 schema/catalog，继续采集将按全部库处理');
      }
    } catch (e: any) {
      Message.error(e?.message || '获取 schema 列表失败');
    } finally {
      setSchemaLoading(false);
    }
  };

  const doCollectSchema = async () => {
    if (!currentItem) return;
    if ((schemaList?.length || 0) > 0 && !selectedSchema) {
      Message.warning('请先选择 schema');
      return;
    }
    setCollecting(true);
    try {
      const res = await collectSchema(currentItem.id, selectedSchema);
      setSchemaData(res?.data);
    } catch (e: any) {
      Message.error(e?.message || '采集表结构失败');
    } finally {
      setCollecting(false);
    }
  };

  const handleExportSchema = async () => {
    if (!currentItem) return;
    if ((schemaList?.length || 0) > 0 && !selectedSchema) {
      Message.warning('请先选择 schema');
      return;
    }
    setExporting(true);
    try {
      const res = await exportSchemaExcel(currentItem.id, selectedSchema);
      const blob = res?.data;
      const url = window.URL.createObjectURL(
        new Blob([blob], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
      );
      const a = document.createElement('a');
      const namePart = selectedSchema || 'all';
      a.href = url;
      a.download = `schema_${namePart}_${
        currentItem?.name || currentItem?.id
      }.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      Message.success('导出成功');
    } catch (e: any) {
      Message.error(e?.message || '导出失败');
    } finally {
      setExporting(false);
    }
  };

  // Config
  const filterFields: FormFieldConfig[] = [
    {
      field: 'name',
      label: '名称',
      type: 'input',
      placeholder: '输入名称关键字',
    },
    {
      field: 'active',
      label: '启用状态',
      type: 'select',
      options: [
        { label: '启用', value: 'true' },
        { label: '禁用', value: 'false' },
      ],
    },
  ];

  const columns = [
    { title: '名称', dataIndex: 'name', width: 160 },
    {
      title: '类型',
      dataIndex: 'type',
      width: 120,
      render: (val: any) => {
        const type = DATASOURCE_TYPES.find((t) => t.value === val);
        return type ? (
          <Tag color="arcoblue">{type.label}</Tag>
        ) : (
          val || '--'
        );
      },
    },
    { title: '驱动', dataIndex: 'driver', width: 140, ellipsis: true },
    {
      title: 'JDBC URL',
      dataIndex: 'jdbcUrl',
      ellipsis: true,
      tooltip: true,
    },
    { title: '用户名', dataIndex: 'username', width: 120 },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
      tooltip: true,
    },
    {
      title: '启用',
      dataIndex: 'active',
      width: 90,
      render: (val: boolean) =>
        val ? (
          <Tag color="green" bordered>
            启用
          </Tag>
        ) : (
          <Tag color="red" bordered>
            禁用
          </Tag>
        ),
    },
    {
      title: '创建时间',
      dataIndex: 'createDate',
      width: 180,
      render: (value: string) => {
        if (!value) return '--';
        const date = new Date(value);
        return date.toLocaleString();
      },
    },
    {
      title: '操作',
      dataIndex: 'op',
      width: 190,
      align: 'center' as const,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<IconEdit />}
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(record);
              }}
            />
          </Tooltip>
          <Tooltip title="测试连接">
            <Button
              type="text"
              size="small"
              icon={<IconRefresh />}
              onClick={(e) => {
                e.stopPropagation();
                handleTestConnection(record);
              }}
            />
          </Tooltip>
          <Tooltip title="采集表结构">
            <Button
              type="text"
              size="small"
              icon={<IconStorage />}
              onClick={(e) => {
                e.stopPropagation();
                handleCollectSchema(record);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="确认删除该数据源吗？"
            onOk={() => handleDelete(record)}
          >
            <Tooltip title="删除">
              <Button
                type="text"
                size="small"
                status="danger"
                icon={<IconDelete />}
                onClick={(e) => e.stopPropagation()}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="datasource-manager">
      <DataManager
        data={tableData}
        loading={tableLoading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showTotal: true,
          showJumper: true,
          showPageSize: true,
          pageSizeOptions: [10, 20, 50, 100],
        }}
        onPaginationChange={(p) => {
          const values = filterFormRef.current?.getFieldsValue();
          fetchTableData(p, values);
        }}
        actions={{
          onAdd: handleAdd,
        }}
        config={{
          displayMode: 'table',
          showModeToggle: false,
          tableColumns: columns,
          showFilterForm: true,
          filterContent: (
            <FilterForm
              ref={filterFormRef}
              formFields={filterFields}
              onSearch={handleSearch}
              onReset={handleReset}
            />
          ),
        }}
      />

      {/* 新增对话框 */}
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
        okText="保存"
        cancelText="取消"
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
          <Form.Item label="是否启用" field="active" initialValue={true}>
            <Select>
              <Option value={true}>启用</Option>
              <Option value={false}>禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑对话框 */}
      <Modal
        title="编辑数据源"
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={
          <Space>
            <Button onClick={() => setEditModalVisible(false)}>取消</Button>
            <Button
              onClick={async () => {
                try {
                  const values = await editForm.validate();
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
            <Button type="primary" onClick={handleEditSubmit}>
              保存
            </Button>
          </Space>
        }
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={editForm}
          layout="vertical"
          onValuesChange={(changedValues) => {
            if (changedValues.type) {
              const typeCfg = DATASOURCE_TYPES.find(
                (t) => t.value === changedValues.type
              );
              if (typeCfg) {
                editForm.setFieldsValue({
                  driver: typeCfg.driver,
                  jdbcUrl: typeCfg.urlTemplate,
                });
              }
            }
          }}
        >
          <Form.Item field="id" hidden>
            <Input />
          </Form.Item>
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
            <Input placeholder="数据库密码（留空不修改）" type="password" />
          </Form.Item>
          <Form.Item label="描述" field="description">
            <Input.TextArea
              placeholder="备注信息"
              maxLength={500}
              showWordLimit
            />
          </Form.Item>
          <Form.Item label="是否启用" field="active">
            <Select>
              <Option value={true}>启用</Option>
              <Option value={false}>禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Schema 采集对话框 */}
      <Modal
        title="表结构采集"
        visible={schemaModalVisible}
        onCancel={() => setSchemaModalVisible(false)}
        footer={
          <Space>
            <Button onClick={() => setSchemaModalVisible(false)}>关闭</Button>
            <Button loading={exporting} onClick={handleExportSchema}>
              导出Excel
            </Button>
            <Button type="primary" loading={collecting} onClick={doCollectSchema}>
              采集
            </Button>
          </Space>
        }
        style={{ minWidth: 1000 }}
      >
        {schemaLoading ? (
          <div>正在加载 schema...</div>
        ) : (
          <div>
            <div style={{ marginBottom: 12 }}>
              <Space>
                <span>选择 Schema：</span>
                <Select
                  allowClear
                  placeholder={
                    schemaList.length ? '请选择' : '无可选 schema，将采集全部'
                  }
                  style={{ width: 260 }}
                  value={selectedSchema}
                  onChange={(v) => setSelectedSchema(v)}
                >
                  {schemaList.map((s) => (
                    <Option key={s} value={s}>
                      {s}
                    </Option>
                  ))}
                </Select>
              </Space>
            </div>
            {schemaData ? (
              <div style={{ marginBottom: 12 }}>
                <Space>
                  <Tag color="arcoblue" bordered>
                    {schemaData.productName}
                  </Tag>
                  <Tag bordered>{schemaData.productVersion}</Tag>
                  <Tag color="green" bordered>
                    {schemaData.databaseType}
                  </Tag>
                  <Tag bordered>{schemaData.driverName}</Tag>
                </Space>
              </div>
            ) : null}
            <Table
              rowKey={(row) =>
                `${row.tableCat || ''}.${row.tableSchem || ''}.${
                  row.tableName
                }`
              }
              columns={[
                { title: 'Catalog', dataIndex: 'tableCat', width: 140 },
                { title: 'Schema', dataIndex: 'tableSchem', width: 140 },
                { title: '表名', dataIndex: 'tableName', width: 220 },
                { title: '类型', dataIndex: 'tableType', width: 120 },
                {
                  title: '备注',
                  dataIndex: 'remarks',
                  ellipsis: true,
                  tooltip: true,
                },
              ]}
              data={schemaData?.tables || []}
              pagination={{ pageSize: 8 }}
              expandedRowRender={(record) => (
                <Table
                  rowKey={(row) => `${record.tableName}.${row.columnName}`}
                  columns={[
                    { title: '列名', dataIndex: 'columnName', width: 200 },
                    { title: '类型', dataIndex: 'dataType', width: 140 },
                    { title: '大小', dataIndex: 'columnSize', width: 100 },
                    { title: '精度', dataIndex: 'decimalDigits', width: 100 },
                    {
                      title: '可空',
                      dataIndex: 'nullable',
                      width: 100,
                      render: (v) =>
                        v ? (
                          <Tag color="green" bordered>
                            是
                          </Tag>
                        ) : (
                          <Tag color="red" bordered>
                            否
                          </Tag>
                        ),
                    },
                    {
                      title: '默认值',
                      dataIndex: 'defaultValue',
                      width: 180,
                    },
                    {
                      title: '主键',
                      dataIndex: 'primaryKey',
                      width: 100,
                      render: (v) =>
                        v ? (
                          <Tag color="gold" bordered>
                            PK
                          </Tag>
                        ) : null,
                    },
                    { title: '备注', dataIndex: 'remarks', ellipsis: true },
                  ]}
                  data={record.columns || []}
                  pagination={false}
                  size="small"
                />
              )}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

export default DatasourceManager;
