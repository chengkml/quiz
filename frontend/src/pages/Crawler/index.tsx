import React, { useEffect, useRef, useState } from 'react';
import { Button, Form, Grid, Input, Message, Modal, Select, Tag, Dropdown, Menu, InputNumber } from '@arco-design/web-react';
import { IconDelete, IconEdit, IconPlus, IconRefresh, IconList, IconEye } from '@arco-design/web-react/icon';
import { DataManager } from '@/components/DataManager';
import FilterForm from '@/components/FilterForm';
import { FormFieldConfig } from '@/components/types/types';
import './style/index.less';
import {
  getCrawlerConfigList,
  saveCrawlerConfig,
  deleteCrawlerConfig,
  triggerCrawler,
  getCrawlerResults,
  CrawlerConfigDto,
  CrawlerResultDto
} from './api';
import renderDate from '@/utils/timeUtil';

const { TextArea } = Input;
const { Option } = Select;
const { Row, Col } = Grid;

function CrawlerManager() {
  // 表格数据与状态
  const [tableData, setTableData] = useState<CrawlerConfigDto[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    showTotal: true,
    showJumper: true,
    showPageSize: true,
  });
  const [tableScrollHeight, setTableScrollHeight] = useState(420);

  // 当前记录与弹窗
  const [currentRecord, setCurrentRecord] = useState<CrawlerConfigDto | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [triggerModalVisible, setTriggerModalVisible] = useState(false);
  const [resultModalVisible, setResultModalVisible] = useState(false);

  // 表单引用
  const addFormRef = useRef<any>(null);
  const filterFormRef = useRef<any>(null);
  const triggerFormRef = useRef<any>(null);

  // 爬虫结果
  const [resultData, setResultData] = useState<CrawlerResultDto[]>([]);
  const [resultLoading, setResultLoading] = useState(false);
  const [resultPagination, setResultPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 选项
  const [stateOptions] = useState([
    { label: '停止', value: '0' },
    { label: '启用', value: '1' },
  ]);

  const [pipelineOptions] = useState([
    { label: '数据库存储', value: 'database' },
    { label: '控制台输出', value: 'console' },
  ]);

  // 筛选表单字段配置
  const [filterFormFields] = useState<FormFieldConfig[]>([
    {
      name: 'state',
      label: '状态',
      type: 'select',
      options: [
        { label: '全部', value: '' },
        { label: '停止', value: '0' },
        { label: '启用', value: '1' },
      ],
    },
    {
      name: 'keyword',
      label: '关键词',
      type: 'input',
      placeholder: '搜索名称或标签',
    },
  ]);

  // 表格列定义
  const columns = [
    { title: '名称', dataIndex: 'name', width: 160, ellipsis: true },
    { title: '标签', dataIndex: 'label', width: 200, ellipsis: true },
    { title: '起始URL', dataIndex: 'startUrl', width: 300, ellipsis: true },
    { title: '线程数', dataIndex: 'threadCount', width: 80, align: 'center' as any },
    { title: '状态', dataIndex: 'state', width: 100, render: (state: string) => {
      const map = {
        '0': { color: 'gray', text: '停止' },
        '1': { color: 'green', text: '启用' },
      };
      const it = map[state] || { color: 'gray', text: state };
      return <Tag color={it.color} bordered>{it.text}</Tag>;
    } },
    { title: '创建时间', dataIndex: 'createTime', width: 180, render: (value: string) => renderDate(value) },
    { title: '操作', width: 180, align: 'center' as any, fixed: 'right' as any, render: (_: any, record: CrawlerConfigDto) => (
      <Dropdown
        position="bl"
        droplist={
          <Menu onClickMenuItem={(key, e) => handleMenuClick(key, e, record)} className="handle-dropdown-menu">
            <Menu.Item key="edit">
              <IconEdit style={{ marginRight: 5 }} />
              编辑
            </Menu.Item>
            <Menu.Item key="trigger">
              <IconRefresh style={{ marginRight: 5 }} />
              触发爬虫
            </Menu.Item>
            <Menu.Item key="results">
              <IconEye style={{ marginRight: 5 }} />
              查看结果
            </Menu.Item>
            <Menu.Item key="delete">
              <IconDelete style={{ marginRight: 5 }} />
              删除
            </Menu.Item>
          </Menu>
        }
      >
        <Button type="text" className="more-btn" onClick={(e) => e.stopPropagation()}>
          <IconList />
        </Button>
      </Dropdown>
    ) },
  ];

  // 结果表格列定义
  const resultColumns = [
    { title: 'URL', dataIndex: 'url', width: 300, ellipsis: true },
    { title: '标题', dataIndex: 'title', width: 200, ellipsis: true },
    { title: '任务ID', dataIndex: 'jobId', width: 150, ellipsis: true },
    { title: '爬取时间', dataIndex: 'crawlTime', width: 180, render: (value: string) => renderDate(value) },
  ];

  // 加载表格数据
  const loadTableData = async (values?: any) => {
    setTableLoading(true);
    try {
      const formValues = values || filterFormRef.current?.getFieldsValue?.() || {};
      const params = {
        offset: (pagination.current - 1) * pagination.pageSize,
        limit: pagination.pageSize,
        ...formValues,
      };

      const response = await getCrawlerConfigList(params);
      setTableData(response.data || []);
      setPagination((prev) => ({ ...prev, total: response.total || 0 }));
    } catch (error: any) {
      Message.error(error.message || '加载数据失败');
    } finally {
      setTableLoading(false);
    }
  };

  // 加载爬虫结果
  const loadResultData = async (crawlerConfigId: string) => {
    setResultLoading(true);
    try {
      const params = {
        offset: (resultPagination.current - 1) * resultPagination.pageSize,
        limit: resultPagination.pageSize,
      };

      const response = await getCrawlerResults(crawlerConfigId, params);
      setResultData(response.data || []);
      setResultPagination((prev) => ({ ...prev, total: response.total || 0 }));
    } catch (error: any) {
      Message.error(error.message || '加载结果失败');
    } finally {
      setResultLoading(false);
    }
  };

  // 初始化
  useEffect(() => {
    loadTableData();

    const handleResize = () => {
      const windowHeight = window.innerHeight;
      setTableScrollHeight(windowHeight - 300);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 分页改变
  const handlePageChange = (current: number, pageSize: number) => {
    setPagination((prev) => ({ ...prev, current, pageSize }));
    setTimeout(() => loadTableData(), 0);
  };

  // 菜单点击
  const handleMenuClick = (key: string, e: any, record: CrawlerConfigDto) => {
    e.stopPropagation();
    setCurrentRecord(record);

    if (key === 'edit') {
      setAddModalVisible(true);
    } else if (key === 'delete') {
      setDeleteModalVisible(true);
    } else if (key === 'trigger') {
      setTriggerModalVisible(true);
    } else if (key === 'results') {
      setResultModalVisible(true);
      loadResultData(record.id!);
    }
  };

  // 添加/编辑
  const handleAdd = () => {
    setCurrentRecord(null);
    setAddModalVisible(true);
  };

  // 保存
  const handleSave = async () => {
    try {
      const values = await addFormRef.current?.validate();
      const dto = { ...currentRecord, ...values };
      await saveCrawlerConfig(dto);
      Message.success('保存成功');
      setAddModalVisible(false);
      loadTableData();
    } catch (error: any) {
      Message.error(error.message || '保存失败');
    }
  };

  // 删除
  const handleDelete = async () => {
    if (!currentRecord?.id) return;

    try {
      await deleteCrawlerConfig([currentRecord.id]);
      Message.success('删除成功');
      setDeleteModalVisible(false);
      loadTableData();
    } catch (error: any) {
      Message.error(error.message || '删除失败');
    }
  };

  // 触发爬虫
  const handleTrigger = async () => {
    if (!currentRecord?.id) return;

    try {
      const values = await triggerFormRef.current?.validate();
      const jobId = await triggerCrawler(currentRecord.id, values.maxPageCount);
      Message.success(`爬虫任务已触发，任务ID: ${jobId}`);
      setTriggerModalVisible(false);
    } catch (error: any) {
      Message.error(error.message || '触发失败');
    }
  };

  // 筛选
  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    loadTableData();
  };

  // 重置
  const handleReset = () => {
    filterFormRef.current?.resetFields();
    setPagination((prev) => ({ ...prev, current: 1 }));
    loadTableData();
  };

  return (
    <div className="crawler-manager">
      {/* 筛选表单 */}
      <FilterForm
        ref={filterFormRef}
        fields={filterFormFields}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      {/* 数据表格 */}
      <DataManager
        columns={columns}
        data={tableData}
        loading={tableLoading}
        pagination={pagination}
        onPageChange={handlePageChange}
        scroll={{ y: tableScrollHeight }}
        toolbarButtons={[
          <Button key="add" type="primary" icon={<IconPlus />} onClick={handleAdd}>
            新增爬虫
          </Button>,
          <Button key="refresh" icon={<IconRefresh />} onClick={() => loadTableData()}>
            刷新
          </Button>,
        ]}
      />

      {/* 添加/编辑弹窗 */}
      <Modal
        title={currentRecord?.id ? '编辑爬虫配置' : '新增爬虫配置'}
        visible={addModalVisible}
        onOk={handleSave}
        onCancel={() => setAddModalVisible(false)}
        style={{ width: 800 }}
      >
        <Form ref={addFormRef} layout="vertical" initialValues={currentRecord || {}}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="名称" field="name" rules={[{ required: true, message: '请输入名称' }]}>
                <Input placeholder="请输入爬虫名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="标签" field="label">
                <Input placeholder="请输入标签" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="起始URL" field="startUrl" rules={[{ required: true, message: '请输入起始URL' }]}>
            <Input placeholder="https://example.com" />
          </Form.Item>

          <Form.Item label="URL匹配模式(JSON数组)" field="urlPatterns">
            <TextArea
              placeholder='["https://example.com/.*"]'
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="线程数" field="threadCount" initialValue={1}>
                <InputNumber min={1} max={10} placeholder="1" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="重试次数" field="retryTimes" initialValue={3}>
                <InputNumber min={0} max={10} placeholder="3" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="请求间隔(毫秒)" field="sleepTime" initialValue={1000}>
                <InputNumber min={0} placeholder="1000" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="超时时间(毫秒)" field="timeoutMillis" initialValue={5000}>
                <InputNumber min={1000} placeholder="5000" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="字符集" field="charset" initialValue="UTF-8">
                <Input placeholder="UTF-8" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="User-Agent" field="userAgent">
            <Input placeholder="Mozilla/5.0 ..." />
          </Form.Item>

          <Form.Item label="请求头(JSON格式)" field="headers">
            <TextArea
              placeholder='{"Accept": "application/json"}'
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
          </Form.Item>

          <Form.Item label="提取规则(JSON格式)" field="extractRules">
            <TextArea
              placeholder='{"title": "xpath://title/text()", "content": "css:.content"}'
              autoSize={{ minRows: 3, maxRows: 6 }}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="数据管道类型" field="pipelineType" initialValue="database">
                <Select placeholder="请选择">
                  {pipelineOptions.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="状态" field="state" initialValue="0">
                <Select placeholder="请选择">
                  {stateOptions.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="备注" field="remark">
            <TextArea placeholder="请输入备注" autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 删除确认弹窗 */}
      <Modal
        title="删除确认"
        visible={deleteModalVisible}
        onOk={handleDelete}
        onCancel={() => setDeleteModalVisible(false)}
      >
        <p>确定要删除爬虫配置 "{currentRecord?.name}" 吗？</p>
        <p style={{ color: '#f53f3f' }}>删除后将无法恢复！</p>
      </Modal>

      {/* 触发爬虫弹窗 */}
      <Modal
        title="触发爬虫任务"
        visible={triggerModalVisible}
        onOk={handleTrigger}
        onCancel={() => setTriggerModalVisible(false)}
      >
        <Form ref={triggerFormRef}>
          <Form.Item label="最大爬取页数" field="maxPageCount" initialValue={0}>
            <InputNumber min={0} placeholder="0表示不限制" style={{ width: '100%' }} />
          </Form.Item>
          <p style={{ color: '#86909c', fontSize: 12 }}>
            提示：设置为0表示不限制爬取页数，直到爬虫自动停止。
          </p>
        </Form>
      </Modal>

      {/* 查看结果弹窗 */}
      <Modal
        title={`爬虫结果 - ${currentRecord?.name}`}
        visible={resultModalVisible}
        onCancel={() => setResultModalVisible(false)}
        footer={null}
        style={{ width: 1000 }}
      >
        <DataManager
          columns={resultColumns}
          data={resultData}
          loading={resultLoading}
          pagination={resultPagination}
          onPageChange={(current, pageSize) => {
            setResultPagination((prev) => ({ ...prev, current, pageSize }));
            setTimeout(() => loadResultData(currentRecord?.id!), 0);
          }}
          scroll={{ y: 400 }}
        />
      </Modal>
    </div>
  );
}

export default CrawlerManager;
