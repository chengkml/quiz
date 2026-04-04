import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Drawer,
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
import { IconPlus, IconSearch, IconSettings } from '@arco-design/web-react/icon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import renderDate from '@/utils/timeUtil';
import {
  createFollowTopic,
  deleteFollowTopic,
  HotSearchFollowTopicDto,
  HotSearchRecordDto,
  listFollowTopics,
  searchHotSearch,
  updateFollowTopic,
} from './api';
import './style/index.less';

const { Row, Col } = Grid;
const { Title, Text, Paragraph } = Typography;

const SOURCE_OPTIONS = [
  { label: '头条', value: 'TOUTIAO' },
];

const HotSearchPage: React.FC = () => {
  const [source, setSource] = useState<string>('TOUTIAO');
  const [keyword, setKeyword] = useState<string>('');
  const [followedOnly, setFollowedOnly] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [topicLoading, setTopicLoading] = useState<boolean>(false);
  const [list, setList] = useState<HotSearchRecordDto[]>([]);
  const [selected, setSelected] = useState<HotSearchRecordDto | null>(null);
  const [topics, setTopics] = useState<HotSearchFollowTopicDto[]>([]);
  const [topicDrawerVisible, setTopicDrawerVisible] = useState<boolean>(false);
  const [topicModalVisible, setTopicModalVisible] = useState<boolean>(false);
  const [topicSaving, setTopicSaving] = useState<boolean>(false);
  const [editingTopic, setEditingTopic] = useState<HotSearchFollowTopicDto | null>(null);
  const [topicForm] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    showTotal: true,
    showJumper: true,
    showPageSize: true,
  });

  const fetchTopics = useCallback(async () => {
    setTopicLoading(true);
    try {
      const data = await listFollowTopics();
      setTopics(data || []);
    } catch (e: any) {
      Message.error(e?.message || '加载关注主题失败');
    } finally {
      setTopicLoading(false);
    }
  }, []);

  const fetchList = useCallback(async (pageNum?: number, pageSize?: number) => {
    setLoading(true);
    try {
      const resp = await searchHotSearch({
        source,
        titleKeyword: keyword.trim() || undefined,
        followedOnly,
        pageNum: pageNum ?? pagination.current - 1,
        pageSize: pageSize ?? pagination.pageSize,
      });
      const content = resp.content || [];
      setList(content);
      setPagination(prev => ({
        ...prev,
        total: resp.totalElements || 0,
        current: (resp.number || 0) + 1,
        pageSize: resp.size || prev.pageSize,
      }));

      if (content.length > 0) {
        setSelected(prev => {
          if (!prev) return content[0];
          return content.find(item => item.id === prev.id) || content[0];
        });
      } else {
        setSelected(null);
      }
    } catch (e: any) {
      Message.error(e?.message || '加载热搜失败');
    } finally {
      setLoading(false);
    }
  }, [source, keyword, followedOnly, pagination.current, pagination.pageSize]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  useEffect(() => {
    fetchList(0, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, followedOnly]);

  const handleSearch = () => {
    fetchList(0, pagination.pageSize);
  };

  const openCreateTopic = () => {
    setEditingTopic(null);
    topicForm.resetFields();
    topicForm.setFieldsValue({ enabled: true, seq: topics.length });
    setTopicModalVisible(true);
  };

  const openEditTopic = (record: HotSearchFollowTopicDto) => {
    setEditingTopic(record);
    topicForm.setFieldsValue({
      topicName: record.topicName,
      keywords: record.keywords,
      enabled: record.enabled ?? true,
      seq: record.seq ?? 0,
    });
    setTopicModalVisible(true);
  };

  const handleSaveTopic = async () => {
    const values = await topicForm.validate();
    setTopicSaving(true);
    try {
      if (editingTopic?.id) {
        await updateFollowTopic({ id: editingTopic.id, ...values });
        Message.success('关注主题更新成功');
      } else {
        await createFollowTopic(values);
        Message.success('关注主题创建成功');
      }
      setTopicModalVisible(false);
      await fetchTopics();
      fetchList(0, pagination.pageSize);
    } catch (e: any) {
      Message.error(e?.message || '保存关注主题失败');
    } finally {
      setTopicSaving(false);
    }
  };

  const handleDeleteTopic = (record: HotSearchFollowTopicDto) => {
    Modal.confirm({
      title: `确认删除主题「${record.topicName || '-'}」吗？`,
      content: '删除后，该主题将不再参与热搜命中识别。',
      onOk: async () => {
        try {
          await deleteFollowTopic(record.id);
          Message.success('关注主题删除成功');
          await fetchTopics();
          fetchList(0, pagination.pageSize);
        } catch (e: any) {
          Message.error(e?.message || '删除关注主题失败');
        }
      },
    });
  };

  const topicSummary = useMemo(() => {
    const enabledCount = topics.filter(item => item.enabled !== false).length;
    return {
      total: topics.length,
      enabled: enabledCount,
    };
  }, [topics]);

  const columns = useMemo(() => [
    {
      title: '序号',
      dataIndex: 'rankIndex',
      width: 80,
      align: 'center' as const,
      render: (value: number) => value ?? '-',
    },
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true,
      render: (_: string, record: HotSearchRecordDto) => (
        <div className="hot-search-title-cell">
          <a
            className="hot-search-title"
            onClick={(e) => {
              e.preventDefault();
              setSelected(record);
            }}
            href="#"
          >
            {record.title || '-'}
          </a>
          {record.matchedTopics?.length ? (
            <div className="hot-search-topic-tags">
              {record.matchedTopics.map(topic => (
                <Tag key={`${record.id}-${topic}`} color="orangered" size="small">{topic}</Tag>
              ))}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: '来源',
      dataIndex: 'source',
      width: 100,
      render: (value: string) => <Tag color="arcoblue" bordered>{value || '-'}</Tag>,
    },
    {
      title: '热度',
      dataIndex: 'hotValue',
      width: 120,
      render: (value: string) => value || '-',
    },
    {
      title: '匹配主题数',
      dataIndex: 'matchedTopics',
      width: 110,
      render: (value: string[]) => value?.length || 0,
    },
    {
      title: '抓取时间',
      dataIndex: 'crawlTime',
      width: 180,
      render: (value: string) => renderDate(value),
    },
  ], []);

  const topicColumns = [
    {
      title: '主题名称',
      dataIndex: 'topicName',
      render: (value: string) => value || '-',
    },
    {
      title: '关键词',
      dataIndex: 'keywords',
      render: (value: string) => (
        <Paragraph ellipsis={{ rows: 2, expandable: true, showTooltip: true }} style={{ marginBottom: 0 }}>
          {value || '-'}
        </Paragraph>
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      width: 100,
      render: (value: boolean) => <Tag color={value !== false ? 'green' : 'gray'}>{value !== false ? '启用' : '停用'}</Tag>,
    },
    {
      title: '排序',
      dataIndex: 'seq',
      width: 80,
      render: (value: number) => value ?? 0,
    },
    {
      title: '操作',
      width: 140,
      render: (_: any, record: HotSearchFollowTopicDto) => (
        <Space>
          <Button size="mini" onClick={() => openEditTopic(record)}>编辑</Button>
          <Button size="mini" status="danger" onClick={() => handleDeleteTopic(record)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="hot-search-page">
      <Card className="hot-search-toolbar" bordered={false}>
        <Space wrap className="hot-search-toolbar-inner">
          <Space wrap>
            <Select
              value={source}
              options={SOURCE_OPTIONS}
              onChange={(value) => setSource(value)}
              style={{ width: 180 }}
              placeholder="选择来源"
            />
            <Input
              value={keyword}
              onChange={setKeyword}
              placeholder="按标题关键词筛选"
              className="hot-search-keyword-input"
              allowClear
              onPressEnter={handleSearch}
            />
            <Select
              value={followedOnly ? 'true' : 'false'}
              style={{ width: 160 }}
              onChange={(value) => setFollowedOnly(value === 'true')}
              options={[
                { label: '全部热搜', value: 'false' },
                { label: '只看关注', value: 'true' },
              ]}
            />
            <Button type="primary" icon={<IconSearch />} onClick={handleSearch}>查询</Button>
          </Space>
          <Space wrap>
            <Tag color="green">启用主题 {topicSummary.enabled}</Tag>
            <Tag color="arcoblue">全部主题 {topicSummary.total}</Tag>
            <Button icon={<IconSettings />} onClick={() => setTopicDrawerVisible(true)}>关注主题管理</Button>
          </Space>
        </Space>
      </Card>

      <Row gutter={[16, 16]} className="hot-search-content">
        <Col xs={24} lg={15} className="hot-search-col">
          <Card className="hot-search-list-card" bordered={false}>
            <Table
              rowKey="id"
              loading={loading}
              data={list}
              columns={columns}
              pagination={pagination}
              rowClassName={(record) => record.id === selected?.id ? 'hot-search-row hot-search-row-active' : 'hot-search-row'}
              onChange={(p) => {
                setPagination(prev => ({ ...prev, current: p.current, pageSize: p.pageSize }));
                fetchList((p.current || 1) - 1, p.pageSize || pagination.pageSize);
              }}
              onRow={(record) => ({
                onClick: () => setSelected(record as HotSearchRecordDto),
              })}
              scroll={{ y: '100%', x: true }}
              stripe
            />
          </Card>
        </Col>

        <Col xs={24} lg={9} className="hot-search-col">
          <Card className="hot-search-detail-card" bordered={false}>
            {selected ? (
              <>
                <div className="detail-title-row">
                  <Title heading={6} style={{ margin: 0 }}>{selected.title}</Title>
                  <Tag color="green" bordered>{selected.source || '-'}</Tag>
                </div>
                {selected.matchedTopics?.length ? (
                  <div className="detail-topic-section">
                    <span className="detail-meta-label">命中关注主题</span>
                    <Space wrap>
                      {selected.matchedTopics.map(topic => (
                        <Tag key={`${selected.id}-${topic}`} color="orangered">{topic}</Tag>
                      ))}
                    </Space>
                  </div>
                ) : (
                  <div className="detail-topic-section detail-topic-empty">
                    <Text type="secondary">当前热搜未命中任何已启用关注主题</Text>
                  </div>
                )}
                <div className="detail-meta-grid">
                  <div className="detail-meta-item">
                    <span className="detail-meta-label">排序</span>
                    <span className="detail-meta-value">{selected.rankIndex ?? '-'}</span>
                  </div>
                  <div className="detail-meta-item">
                    <span className="detail-meta-label">热度</span>
                    <span className="detail-meta-value">{selected.hotValue || '-'}</span>
                  </div>
                  <div className="detail-meta-item detail-meta-item-full">
                    <span className="detail-meta-label">抓取时间</span>
                    <span className="detail-meta-value">{selected.crawlTime ? renderDate(selected.crawlTime) : '-'}</span>
                  </div>
                  {selected.url ? (
                    <div className="detail-meta-item detail-meta-item-full">
                      <span className="detail-meta-label">原文链接</span>
                      <a className="detail-meta-link" href={selected.url} target="_blank" rel="noreferrer">{selected.url}</a>
                    </div>
                  ) : null}
                </div>
                <div className="detail-markdown markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selected.detailMarkdown || '_暂无详情_'}
                  </ReactMarkdown>
                </div>
              </>
            ) : (
              <div className="hot-search-empty-detail">
                <Text type="secondary">请选择一条热搜查看详情</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Drawer
        width={720}
        title="关注主题管理"
        visible={topicDrawerVisible}
        onCancel={() => setTopicDrawerVisible(false)}
        footer={null}
      >
        <div className="topic-drawer-toolbar">
          <Space>
            <Tag color="green">启用 {topicSummary.enabled}</Tag>
            <Tag color="arcoblue">总数 {topicSummary.total}</Tag>
          </Space>
          <Button type="primary" icon={<IconPlus />} onClick={openCreateTopic}>新增主题</Button>
        </div>
        <Table
          rowKey="id"
          loading={topicLoading}
          data={topics}
          columns={topicColumns}
          pagination={false}
          scroll={{ y: 520, x: true }}
        />
      </Drawer>

      <Modal
        title={editingTopic?.id ? '编辑关注主题' : '新增关注主题'}
        visible={topicModalVisible}
        onOk={handleSaveTopic}
        onCancel={() => setTopicModalVisible(false)}
        confirmLoading={topicSaving}
      >
        <Form form={topicForm} layout="vertical">
          <Form.Item field="topicName" label="主题名称" rules={[{ required: true, message: '请输入主题名称' }]}>
            <Input placeholder="例如：AI / 房价 / 教育" maxLength={128} />
          </Form.Item>
          <Form.Item field="keywords" label="匹配关键词">
            <Input.TextArea placeholder="支持逗号或换行分隔，例如：AI, 人工智能, 大模型" autoSize={{ minRows: 4, maxRows: 8 }} maxLength={4000} />
          </Form.Item>
          <Form.Item field="seq" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item field="enabled" label="启用匹配" triggerPropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HotSearchPage;
