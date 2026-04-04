import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  Checkbox,
  Descriptions,
  Form,
  Grid,
  Input,
  InputNumber,
  Message,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from '@arco-design/web-react';
import { IconPlus, IconNotification, IconSync } from '@arco-design/web-react/icon';
import * as echarts from 'echarts';
import renderDate from '@/utils/timeUtil';
import {
  collectPrice,
  createPriceMonitorItem,
  deletePriceMonitorItem,
  getAlertRules,
  getPriceMonitorItems,
  getPriceTrend,
  getSnapshots,
  saveAlertRule,
  updatePriceMonitorItem,
  PriceAlertRuleDto,
  PriceMonitorItemDto,
  PriceSnapshotDto,
  PriceTrendDto,
} from './api';
import './style/index.less';

const { Row, Col } = Grid;
const { Title, Text } = Typography;
const Option = Select.Option;

const ENABLE_OPTIONS = [
  { label: '全部', value: 'ALL' },
  { label: '启用', value: 'true' },
  { label: '停用', value: 'false' },
];

const PriceMonitorPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<PriceMonitorItemDto[]>([]);
  const [selected, setSelected] = useState<PriceMonitorItemDto | null>(null);
  const [snapshots, setSnapshots] = useState<PriceSnapshotDto[]>([]);
  const [alertRule, setAlertRule] = useState<PriceAlertRuleDto | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    showTotal: true,
    showJumper: true,
    showPageSize: true,
  });
  const [searchForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [collectForm] = Form.useForm();
  const [ruleForm] = Form.useForm();
  const [editVisible, setEditVisible] = useState(false);
  const [collectVisible, setCollectVisible] = useState(false);
  const [ruleVisible, setRuleVisible] = useState(false);
  const [editing, setEditing] = useState<PriceMonitorItemDto | null>(null);
  const [saving, setSaving] = useState(false);
  const chartRef = useRef<HTMLDivElement | null>(null);

  const fetchList = useCallback(async (pageNum = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const values = searchForm.getFieldsValue();
      const payload: any = {
        platform: values.platform || undefined,
        itemName: values.itemName || undefined,
        pageNum: pageNum - 1,
        pageSize,
      };
      if (values.monitoringEnabled && values.monitoringEnabled !== 'ALL') {
        payload.monitoringEnabled = values.monitoringEnabled === 'true';
      }
      const response: any = await getPriceMonitorItems(payload);
      const page = response.data;
      const content = page?.content || [];
      setList(content);
      setPagination((prev) => ({ ...prev, current: pageNum, pageSize, total: page?.totalElements || 0 }));
      if (content.length > 0) {
        const nextSelected = selected ? content.find((item: any) => item.id === selected.id) || content[0] : content[0];
        setSelected(nextSelected);
      } else {
        setSelected(null);
      }
    } catch (e: any) {
      Message.error(e?.message || '加载价格监控列表失败');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, searchForm, selected]);

  const fetchDetail = useCallback(async (item?: PriceMonitorItemDto | null) => {
    if (!item?.id) {
      setSnapshots([]);
      setAlertRule(null);
      return;
    }
    try {
      const [snapshotResp, ruleResp, trendResp] = await Promise.all([
        getSnapshots(item.id),
        getAlertRules(item.id),
        getPriceTrend(item.id),
      ]);
      setSnapshots(snapshotResp.data || []);
      const rules = ruleResp.data || [];
      setAlertRule(rules[0] || null);
      renderTrendChart(trendResp.data);
    } catch (e: any) {
      Message.error(e?.message || '加载价格详情失败');
    }
  }, []);

  useEffect(() => {
    searchForm.setFieldsValue({ monitoringEnabled: 'ALL' });
    fetchList(1, pagination.pageSize);
  }, []);

  useEffect(() => {
    fetchDetail(selected);
  }, [selected, fetchDetail]);

  const renderTrendChart = (trend?: PriceTrendDto) => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current);
    const points = trend?.points || [];
    chart.setOption({
      title: {
        text: trend?.itemName ? `${trend.itemName} 价格趋势` : '价格趋势',
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'bold' },
      },
      tooltip: { trigger: 'axis' },
      legend: { top: 28 },
      grid: { left: '4%', right: '4%', bottom: '8%', containLabel: true },
      xAxis: { type: 'category', data: points.map((p) => p.collectedAt) },
      yAxis: { type: 'value', name: trend?.currency || 'CNY' },
      series: [
        {
          name: '最终价',
          type: 'line',
          smooth: true,
          data: points.map((p) => p.finalPrice),
          itemStyle: { color: '#165dff' },
          areaStyle: { color: 'rgba(22,93,255,0.15)' },
        },
        {
          name: '原价',
          type: 'line',
          smooth: true,
          data: points.map((p) => p.originalPrice),
          itemStyle: { color: '#00b42a' },
        },
      ],
    });
    const handleResize = () => chart.resize();
    window.onresize = handleResize;
  };

  const handleSearch = () => fetchList(1, pagination.pageSize);

  const handleOpenCreate = () => {
    setEditing(null);
    editForm.resetFields();
    editForm.setFieldsValue({ monitoringEnabled: true, currency: 'CNY' });
    setEditVisible(true);
  };

  const handleOpenEdit = (record: PriceMonitorItemDto) => {
    setEditing(record);
    editForm.setFieldsValue({ ...record });
    setEditVisible(true);
  };

  const handleSave = async () => {
    const values = await editForm.validate();
    setSaving(true);
    try {
      if (editing?.id) {
        await updatePriceMonitorItem({ id: editing.id, ...values });
        Message.success('更新成功');
      } else {
        await createPriceMonitorItem(values);
        Message.success('创建成功');
      }
      setEditVisible(false);
      fetchList();
    } catch (e: any) {
      Message.error(e?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record: PriceMonitorItemDto) => {
    try {
      await deletePriceMonitorItem(record.id);
      Message.success('删除成功');
      fetchList();
    } catch (e: any) {
      Message.error(e?.message || '删除失败');
    }
  };

  const handleCollect = async () => {
    if (!selected?.id) return;
    const values = await collectForm.validate();
    try {
      const response: any = await collectPrice(selected.id, values);
      const data = response.data;
      Message.success(data?.notifyResult || '采集成功');
      setCollectVisible(false);
      collectForm.resetFields();
      fetchList();
      fetchDetail(selected);
    } catch (e: any) {
      Message.error(e?.message || '采集失败');
    }
  };

  const handleSaveRule = async () => {
    if (!selected?.id) return;
    const values = await ruleForm.validate();
    try {
      await saveAlertRule(selected.id, values);
      Message.success('规则保存成功');
      setRuleVisible(false);
      fetchDetail(selected);
    } catch (e: any) {
      Message.error(e?.message || '规则保存失败');
    }
  };

  const columns = useMemo(() => [
    { title: '平台', dataIndex: 'platform', width: 120 },
    { title: '商品名称', dataIndex: 'itemName', ellipsis: true },
    { title: '商品标识', dataIndex: 'externalItemId', width: 150, render: (v: string) => v || '-' },
    { title: '状态', dataIndex: 'monitoringEnabled', width: 100, render: (v: boolean) => <Tag color={v ? 'green' : 'gray'}>{v ? '启用' : '停用'}</Tag> },
    { title: '最近最终价', dataIndex: 'lastFinalPrice', width: 120, render: (v: number, r: any) => v == null ? '-' : `${r.currency || 'CNY'} ${Number(v).toFixed(2)}` },
    { title: '最近采集', dataIndex: 'lastCollectedAt', width: 180, render: (v: string) => renderDate(v) },
    {
      title: '操作',
      width: 240,
      render: (_: any, record: PriceMonitorItemDto) => (
        <Space>
          <Button size="mini" onClick={() => handleOpenEdit(record)}>编辑</Button>
          <Button size="mini" icon={<IconSync />} onClick={() => { setSelected(record); collectForm.resetFields(); setCollectVisible(true); }}>采集</Button>
          <Button size="mini" icon={<IconNotification />} onClick={async () => { setSelected(record); const resp: any = await getAlertRules(record.id); const currentRule = resp?.data?.[0] || { enabled: true, alertOnIncrease: false, alertOnDecrease: true, channel: 'EMAIL' }; ruleForm.setFieldsValue(currentRule); setRuleVisible(true); }}>预警</Button>
          <Button size="mini" status="danger" onClick={() => handleDelete(record)}>删除</Button>
        </Space>
      ),
    },
  ], [alertRule]);

  const snapshotColumns = [
    { title: '采集时间', dataIndex: 'collectedAt', width: 180, render: (v: string) => renderDate(v) },
    { title: '原价', dataIndex: 'originalPrice', width: 100, render: (v: number) => v == null ? '-' : Number(v).toFixed(2) },
    { title: '优惠', dataIndex: 'discountText', ellipsis: true, render: (v: string) => v || '-' },
    { title: '优惠金额', dataIndex: 'discountAmount', width: 100, render: (v: number) => v == null ? '-' : Number(v).toFixed(2) },
    { title: '最终价', dataIndex: 'finalPrice', width: 100, render: (v: number) => v == null ? '-' : Number(v).toFixed(2) },
    { title: '备注', dataIndex: 'remark', ellipsis: true, render: (v: string) => v || '-' },
  ];

  return (
    <div className="price-monitor-page">
      <Card className="price-monitor-toolbar" bordered={false}>
        <Form form={searchForm} layout="inline">
          <Form.Item field="platform">
            <Input placeholder="平台" allowClear />
          </Form.Item>
          <Form.Item field="itemName">
            <Input placeholder="商品名称" allowClear />
          </Form.Item>
          <Form.Item field="monitoringEnabled">
            <Select style={{ width: 120 }} options={ENABLE_OPTIONS} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" onClick={handleSearch}>查询</Button>
              <Button icon={<IconPlus />} onClick={handleOpenCreate}>新增监控</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={13}>
          <Card bordered={false} className="price-monitor-list-card">
            <Table
              rowKey="id"
              data={list}
              loading={loading}
              columns={columns}
              pagination={pagination}
              onChange={(p) => fetchList(p.current, p.pageSize)}
              onRow={(record) => ({ onClick: () => setSelected(record as PriceMonitorItemDto) })}
              rowClassName={(record) => record.id === selected?.id ? 'price-monitor-row-active' : ''}
              scroll={{ x: true, y: 640 }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={11}>
          <Card bordered={false} className="price-monitor-detail-card">
            {selected ? (
              <>
                <Space align="center" className="detail-header">
                  <Title heading={6} style={{ margin: 0 }}>{selected.itemName}</Title>
                  <Tag color="arcoblue">{selected.platform || '-'}</Tag>
                  <Tag color={selected.monitoringEnabled ? 'green' : 'gray'}>{selected.monitoringEnabled ? '监控中' : '已停用'}</Tag>
                  <Button size="mini" icon={<IconSync />} onClick={() => { collectForm.resetFields(); setCollectVisible(true); }}>手动采集</Button>
                  <Button size="mini" icon={<IconNotification />} onClick={() => { ruleForm.setFieldsValue(alertRule || { enabled: true, alertOnIncrease: false, alertOnDecrease: true, channel: 'EMAIL' }); setRuleVisible(true); }}>预警规则</Button>
                </Space>
                <Descriptions column={1} data={[
                  { label: '商品链接', value: selected.itemUrl || '-' },
                  { label: '商品标识', value: selected.externalItemId || '-' },
                  { label: '最近最终价', value: selected.lastFinalPrice == null ? '-' : `${selected.currency || 'CNY'} ${Number(selected.lastFinalPrice).toFixed(2)}` },
                  { label: '最近采集时间', value: selected.lastCollectedAt ? renderDate(selected.lastCollectedAt) : '-' },
                  { label: '当前规则', value: alertRule ? `${alertRule.enabled ? '启用' : '停用'} / ${alertRule.alertOnIncrease ? '涨' : ''}${alertRule.alertOnDecrease ? '跌' : ''} / 绝对值 ${alertRule.absoluteThreshold ?? '-'} / 比例 ${alertRule.percentageThreshold ?? '-'}` : '未配置' },
                ]} />
                <div ref={chartRef} className="price-monitor-chart" />
                <div className="snapshot-section">
                  <Text type="secondary">价格快照历史</Text>
                  <Table rowKey="id" columns={snapshotColumns} data={snapshots} pagination={false} size="small" scroll={{ y: 240, x: true }} />
                </div>
              </>
            ) : (
              <div className="price-monitor-empty"><Text type="secondary">请选择一个监控商品查看趋势和快照</Text></div>
            )}
          </Card>
        </Col>
      </Row>

      <Modal title={editing?.id ? '编辑监控商品' : '新增监控商品'} visible={editVisible} onOk={handleSave} onCancel={() => setEditVisible(false)} confirmLoading={saving}>
        <Form form={editForm} layout="vertical">
          <Form.Item field="platform" label="平台" rules={[{ required: true, message: '请输入平台' }]}><Input /></Form.Item>
          <Form.Item field="itemName" label="商品名称" rules={[{ required: true, message: '请输入商品名称' }]}><Input /></Form.Item>
          <Form.Item field="itemUrl" label="商品链接"><Input /></Form.Item>
          <Form.Item field="externalItemId" label="商品标识"><Input /></Form.Item>
          <Form.Item field="currency" label="币种"><Input /></Form.Item>
          <Form.Item field="monitoringEnabled" label="启用监控" triggerPropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>

      <Modal title={`手动采集${selected?.itemName ? ` - ${selected.itemName}` : ''}`} visible={collectVisible} onOk={handleCollect} onCancel={() => setCollectVisible(false)}>
        <Form form={collectForm} layout="vertical">
          <Form.Item field="collectedAt" label="采集时间"><Input placeholder="默认留空，使用当前时间" /></Form.Item>
          <Form.Item field="originalPrice" label="原价"><InputNumber precision={2} style={{ width: '100%' }} /></Form.Item>
          <Form.Item field="discountText" label="优惠描述"><Input placeholder="如 满300减40 / 券后价" /></Form.Item>
          <Form.Item field="discountAmount" label="优惠金额"><InputNumber precision={2} style={{ width: '100%' }} /></Form.Item>
          <Form.Item field="finalPrice" label="最终到手价" rules={[{ required: true, message: '请输入最终到手价' }]}><InputNumber precision={2} style={{ width: '100%' }} /></Form.Item>
          <Form.Item field="remark" label="备注"><Input.TextArea autoSize /></Form.Item>
          <Form.Item field="rawPayload" label="原始响应摘要"><Input.TextArea autoSize /></Form.Item>
        </Form>
      </Modal>

      <Modal title={`预警规则${selected?.itemName ? ` - ${selected.itemName}` : ''}`} visible={ruleVisible} onOk={handleSaveRule} onCancel={() => setRuleVisible(false)}>
        <Form form={ruleForm} layout="vertical">
          <Form.Item field="enabled" label="启用规则" triggerPropName="checked"><Switch /></Form.Item>
          <Form.Item field="channel" label="通知方式" initialValue="EMAIL"><Select><Option value="EMAIL">邮件</Option></Select></Form.Item>
          <Form.Item field="alertOnIncrease" label="上涨预警" triggerPropName="checked"><Checkbox>价格上涨时预警</Checkbox></Form.Item>
          <Form.Item field="alertOnDecrease" label="下降预警" triggerPropName="checked"><Checkbox>价格下降时预警</Checkbox></Form.Item>
          <Form.Item field="absoluteThreshold" label="绝对值阈值"><InputNumber precision={2} style={{ width: '100%' }} placeholder="如 50.00" /></Form.Item>
          <Form.Item field="percentageThreshold" label="比例阈值"><InputNumber precision={4} style={{ width: '100%' }} placeholder="如 0.1000 代表 10%" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PriceMonitorPage;
