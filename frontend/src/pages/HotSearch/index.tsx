import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Grid, Input, Message, Select, Space, Table, Tag, Typography } from '@arco-design/web-react';
import { IconRefresh, IconSearch } from '@arco-design/web-react/icon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import renderDate from '@/utils/timeUtil';
import {
  collectHotSearch,
  HotSearchRecordDto,
  searchHotSearch,
} from './api';
import './style/index.less';

const { Row, Col } = Grid;
const { Title, Text } = Typography;

const SOURCE_OPTIONS = [
  { label: '头条', value: 'TOUTIAO' },
];

const HotSearchPage: React.FC = () => {
  const [source, setSource] = useState<string>('TOUTIAO');
  const [keyword, setKeyword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [collectLoading, setCollectLoading] = useState<boolean>(false);
  const [list, setList] = useState<HotSearchRecordDto[]>([]);
  const [selected, setSelected] = useState<HotSearchRecordDto | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    showTotal: true,
    showJumper: true,
    showPageSize: true,
  });

  const fetchList = useCallback(async (pageNum?: number, pageSize?: number) => {
    setLoading(true);
    try {
      const resp = await searchHotSearch({
        source,
        titleKeyword: keyword.trim() || undefined,
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
  }, [source, keyword, pagination.current, pagination.pageSize]);

  useEffect(() => {
    fetchList(0, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  const handleSearch = () => {
    fetchList(0, pagination.pageSize);
  };

  const handleRefresh = async () => {
    setCollectLoading(true);
    try {
      const resp = await collectHotSearch(source);
      Message.success(`抓取成功，共 ${resp.total} 条`);
      fetchList(0, pagination.pageSize);
    } catch (e: any) {
      Message.error(e?.message || '抓取失败');
    } finally {
      setCollectLoading(false);
    }
  };

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
      title: '抓取时间',
      dataIndex: 'crawlTime',
      width: 180,
      render: (value: string) => renderDate(value),
    },
  ], []);

  return (
    <div className="hot-search-page">
      <div className="hot-search-header">
        <div>
          <Title heading={4} style={{ margin: 0 }}>热搜展示</Title>
          <Text type="secondary">支持最新热搜与历史记录查看，点击标题可查看 Markdown 详情</Text>
        </div>
      </div>

      <Card className="hot-search-toolbar" bordered={false}>
        <Space wrap className="hot-search-toolbar-inner">
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
          <Button type="primary" icon={<IconSearch />} onClick={handleSearch}>查询</Button>
          <Button icon={<IconRefresh />} onClick={handleRefresh} loading={collectLoading}>立即抓取</Button>
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
    </div>
  );
};

export default HotSearchPage;
