import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  Form,
  Input,
  Message,
  Modal,
  Select,
  Space,
  Table,
  Tag
} from '@arco-design/web-react';
import './style/index.less';
import {
  getDatasourceList,
  getDatasourceById,
  createDatasource,
  updateDatasource,
  deleteDatasource,
  testConnection,
  collectSchema,
  getSchemas,
} from './api';

const Option = Select.Option;

function DatasourceManager() {
  // 表格数据与状态
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // 搜索表单与参数
  const [searchParams, setSearchParams] = useState<{ name?: string; active?: string | boolean }>({
    name: '',
    active: '',
  });
  const [searchForm] = Form.useForm();

  // 新增/编辑对话框
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<any | null>(null);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // 表结构采集查看
  const [schemaModalVisible, setSchemaModalVisible] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaData, setSchemaData] = useState<any | null>(null);
  const [schemaList, setSchemaList] = useState<string[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<string | undefined>(undefined);
  const [collecting, setCollecting] = useState(false);

  // 容器引用用于计算表格高度（可选）
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 初始化加载
  useEffect(() => {
    fetchTableData({ current: 1, pageSize: 10 });
  }, []);

  // 加载列表数据
  const fetchTableData = async (page = pagination) => {
    setTableLoading(true);
    try {
      const params = {
        name: searchParams.name || undefined,
        active:
          searchParams.active === ''
            ? undefined
            : searchParams.active === 'true'
            ? true
            : searchParams.active === 'false'
            ? false
            : undefined,
        pageNum: (page.current || 1) - 1, // 后端从0开始
        pageSize: page.pageSize || 10,
        sortColumn: 'create_date',
        sortType: 'desc',
      };
      const res = await getDatasourceList(params);
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

  // 搜索
  const handleSearch = () => {
    const values = searchForm.getFieldsValue();
    setSearchParams(values);
    fetchTableData({ current: 1, pageSize: pagination.pageSize, total: 0 });
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    setSearchParams({ name: '', active: '' });
    fetchTableData({ current: 1, pageSize: pagination.pageSize, total: 0 });
  };

  // 打开新增弹窗
  const openAddModal = () => {
    setAddModalVisible(true);
    addForm.resetFields();
    addForm.setFieldsValue({ active: true });
  };

  // 提交新增
  const handleAddSubmit = async () => {
    try {
      const values = await addForm.validate();
      await createDatasource(values);
      Message.success('创建成功');
      setAddModalVisible(false);
      fetchTableData({ current: 1, pageSize: pagination.pageSize, total: 0 });
    } catch (e: any) {
      if (e?.errorFields) return; // 校验未通过
      Message.error(e?.message || '创建失败');
    }
  };

  // 打开编辑
  const openEditModal = async (record) => {
    try {
      const res = await getDatasourceById(record.id);
      setCurrentItem(res.data);
      editForm.setFieldsValue({
        id: res.data.id,
        name: res.data.name,
        driver: res.data.driver,
        jdbcUrl: res.data.jdbcUrl,
        username: res.data.username,
        password: '', // 不回显密码
        description: res.data.description,
        active: res.data.active,
      });
      setEditModalVisible(true);
    } catch (e: any) {
      Message.error(e?.message || '加载详情失败');
    }
  };

  // 提交编辑
  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validate();
      await updateDatasource(values);
      Message.success('更新成功');
      setEditModalVisible(false);
      fetchTableData(pagination);
    } catch (e: any) {
      if (e?.errorFields) return;
      Message.error(e?.message || '更新失败');
    }
  };

  // 打开删除
  const openDeleteModal = (record) => {
    setCurrentItem(record);
    setDeleteModalVisible(true);
  };

  // 确认删除
  const handleDelete = async () => {
    if (!currentItem) return;
    try {
      await deleteDatasource(currentItem.id);
      Message.success('删除成功');
      setDeleteModalVisible(false);
      fetchTableData(pagination);
    } catch (e: any) {
      Message.error(e?.message || '删除失败');
    }
  };

  // 测试连接
  const handleTestConnection = async (record) => {
    try {
      const res = await testConnection(record.id);
      const ok = res?.data?.success ?? true;
      Message[ok ? 'success' : 'error'](res?.data?.message || (ok ? '连接成功' : '连接失败'));
    } catch (e: any) {
      Message.error(e?.message || '连接测试失败');
    }
  };

  // 采集前获取 schema 列表并打开弹窗
  const handleCollectSchema = async (record) => {
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

  // 执行采集（可选 schema）
  const doCollectSchema = async () => {
    if (!currentItem) return;
    if ((schemaList?.length || 0) > 0 && !selectedSchema) {
      Message.warning('请先选择 schema');
      return;
    }
    setCollecting(true);
    try {
      const res = await collectSchema(currentItem.id, selectedSchema);
      const data = res?.data;
      setSchemaData(data);
    } catch (e: any) {
      Message.error(e?.message || '采集表结构失败');
    } finally {
      setCollecting(false);
    }
  };

  const columns = [
    { title: '名称', dataIndex: 'name', width: 160 },
    { title: '驱动', dataIndex: 'driver', width: 140 },
    { title: 'JDBC URL', dataIndex: 'jdbcUrl', ellipsis: true, tooltip: true },
    { title: '用户名', dataIndex: 'username', width: 120 },
    { title: '描述', dataIndex: 'description', ellipsis: true, tooltip: true },
    {
      title: '启用',
      dataIndex: 'active',
      width: 90,
      render: (val) => (val ? <Tag color="green">启用</Tag> : <Tag color="red">禁用</Tag>),
    },
    { title: '创建时间', dataIndex: 'createDate', width: 180 },
    { title: '更新时间', dataIndex: 'updateDate', width: 180 },
    {
      title: '操作',
      dataIndex: 'op',
      width: 240,
      render: (_: any, record: any) => (
        <Space>
          <Button size="mini" type="primary" onClick={() => openEditModal(record)}>
            编辑
          </Button>
          <Button size="mini" status="danger" onClick={() => openDeleteModal(record)}>
            删除
          </Button>
          <Button size="mini" onClick={() => handleTestConnection(record)}>
            测试连接
          </Button>
          <Button size="mini" onClick={() => handleCollectSchema(record)}>
            采集表结构
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="datasource-page" ref={containerRef}>
      {/* 搜索区域 */}
      <div className="search-form">
        <Form layout="inline" form={searchForm} initialValues={searchParams}>
          <Form.Item label="名称" field="name">
            <Input allowClear placeholder="输入名称关键字" style={{ width: 220 }} />
          </Form.Item>
          <Form.Item label="启用状态" field="active">
            <Select allowClear placeholder="请选择" style={{ width: 160 }}>
              <Option value="true">启用</Option>
              <Option value="false">禁用</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" onClick={handleSearch}>
                查询
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      {/* 操作区 */}
      <div className="toolbar">
        <Space>
          <Button type="primary" onClick={openAddModal}>
            新增数据源
          </Button>
        </Space>
      </div>

      {/* 表格 */}
      <Table
        rowKey="id"
        loading={tableLoading}
        columns={columns}
        data={tableData}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showTotal: true,
          onChange: (current, pageSize) => {
            const next = { current, pageSize, total: pagination.total };
            setPagination(next);
            fetchTableData(next);
          },
        }}
        border={false}
      />

      {/* 新增对话框 */}
      <Modal
        title="新增数据源"
        visible={addModalVisible}
        onOk={handleAddSubmit}
        onCancel={() => setAddModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={addForm} layout="vertical">
          <Form.Item label="名称" field="name" rules={[{ required: true, message: '请输入名称' }]}> 
            <Input placeholder="数据源名称" />
          </Form.Item>
          <Form.Item label="驱动类名" field="driver"> 
            <Input placeholder="可选，例：com.mysql.cj.jdbc.Driver" />
          </Form.Item>
          <Form.Item label="JDBC URL" field="jdbcUrl" rules={[{ required: true, message: '请输入JDBC URL' }]}> 
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
        onOk={handleEditSubmit}
        onCancel={() => setEditModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item field="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item label="名称" field="name" rules={[{ required: true, message: '请输入名称' }]}> 
            <Input placeholder="数据源名称" />
          </Form.Item>
          <Form.Item label="驱动类名" field="driver"> 
            <Input placeholder="可选，例：com.mysql.cj.jdbc.Driver" />
          </Form.Item>
          <Form.Item label="JDBC URL" field="jdbcUrl" rules={[{ required: true, message: '请输入JDBC URL' }]}> 
            <Input placeholder="例：jdbc:mysql://host:3306/db" />
          </Form.Item>
          <Form.Item label="用户名" field="username"> 
            <Input placeholder="数据库用户名" />
          </Form.Item>
          <Form.Item label="密码" field="password"> 
            <Input placeholder="数据库密码（留空不修改）" type="password" />
          </Form.Item>
          <Form.Item label="描述" field="description"> 
            <Input.TextArea placeholder="备注信息" maxLength={500} showWordLimit />
          </Form.Item>
          <Form.Item label="是否启用" field="active"> 
            <Select>
              <Option value={true}>启用</Option>
              <Option value={false}>禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 删除确认 */}
      <Modal
        title="删除确认"
        visible={deleteModalVisible}
        onOk={handleDelete}
        onCancel={() => setDeleteModalVisible(false)}
        okText="删除"
        cancelText="取消"
      >
        <div>
          确认删除数据源「{currentItem?.name}」？此操作不可恢复。
        </div>
      </Modal>

      {/* 表结构采集与查看 */}
      <Modal
        title="表结构采集"
        visible={schemaModalVisible}
        onCancel={() => setSchemaModalVisible(false)}
        footer={
          <Space>
            <Button onClick={() => setSchemaModalVisible(false)}>关闭</Button>
            <Button type="primary" loading={collecting} onClick={doCollectSchema}>采集</Button>
          </Space>
        }
        style={{ minWidth: 1000 }}
      >
        {schemaLoading ? (
          <div>正在加载 schema...</div>
        ) : (
          <div>
            {/* 选择 schema */}
            <div style={{ marginBottom: 12 }}>
              <Space>
                <span>选择 Schema：</span>
                <Select
                  allowClear
                  placeholder={schemaList.length ? '请选择' : '无可选 schema，将采集全部'}
                  style={{ width: 260 }}
                  value={selectedSchema}
                  onChange={(v) => setSelectedSchema(v)}
                >
                  {schemaList.map((s) => (
                    <Option key={s} value={s}>{s}</Option>
                  ))}
                </Select>
              </Space>
            </div>
            {schemaData ? (
              <div style={{ marginBottom: 12 }}>
                <Space>
                  <Tag color="arcoblue">{schemaData.productName}</Tag>
                  <Tag>{schemaData.productVersion}</Tag>
                  <Tag color="green">{schemaData.databaseType}</Tag>
                  <Tag>{schemaData.driverName}</Tag>
                </Space>
              </div>
            ) : null}
            <Table
              rowKey={(row) => `${row.tableCat || ''}.${row.tableSchem || ''}.${row.tableName}`}
              columns={[
                { title: 'Catalog', dataIndex: 'tableCat', width: 140 },
                { title: 'Schema', dataIndex: 'tableSchem', width: 140 },
                { title: '表名', dataIndex: 'tableName', width: 220 },
                { title: '类型', dataIndex: 'tableType', width: 120 },
                { title: '备注', dataIndex: 'remarks', ellipsis: true, tooltip: true },
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
                    { title: '可空', dataIndex: 'nullable', width: 100, render: (v) => (v ? <Tag color="green">是</Tag> : <Tag color="red">否</Tag>) },
                    { title: '默认值', dataIndex: 'defaultValue', width: 180 },
                    { title: '主键', dataIndex: 'primaryKey', width: 100, render: (v) => (v ? <Tag color="gold">PK</Tag> : null) },
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