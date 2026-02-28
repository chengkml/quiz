import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Grid,
  Message,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tabs,
  Typography,
} from '@arco-design/web-react';
import {
  IconCalendar,
  IconFile,
  IconRefresh,
  IconThunderbolt,
} from '@arco-design/web-react/icon';
import {
  getMyStatisticsByBusiness,
  getMyStatisticsByDate,
  getMyStatisticsByModel,
  TokenUsageStatDto,
} from './api';
import './index.less';

const { Row, Col } = Grid;
const { Title } = Typography;
const TabPane = Tabs.TabPane;
const { RangePicker } = DatePicker;

type WrappedList<T> = T[] | { data?: T[] };
type DateRangeValue = [string, string] | undefined;

const toList = <T,>(payload: WrappedList<T> | undefined): T[] => {
  if (!payload) {
    return [];
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  return payload.data ?? [];
};

const formatNumber = (value: number | null | undefined): string =>
  Number(value ?? 0).toLocaleString();

const formatCost = (value: number | null | undefined): string =>
  `¥${Number(value ?? 0).toFixed(4)}`;

const normalizeDateText = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (
    value &&
    typeof value === 'object' &&
    'format' in value &&
    typeof (value as { format?: unknown }).format === 'function'
  ) {
    return (value as { format: (pattern: string) => string }).format(
      'YYYY-MM-DD'
    );
  }
  return '';
};

const mapBusinessType = (value: string): string => {
  const typeMap: Record<string, string> = {
    CHAT: '聊天',
    QUESTION: '题目生成',
    OCR: '图片识别',
    KNOWLEDGE: '知识点',
    DATASOURCE: '数据源',
    FUNCDOC: '文档',
    MINDMAP: '思维导图',
    MERMAID: '流程图',
    CALENDAR: '日历',
  };
  return typeMap[value] ?? value;
};

const TokenUsagePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('model');
  const [overviewLoading, setOverviewLoading] = useState<boolean>(false);
  const [dateLoading, setDateLoading] = useState<boolean>(false);
  const [modelStats, setModelStats] = useState<TokenUsageStatDto[]>([]);
  const [businessStats, setBusinessStats] = useState<TokenUsageStatDto[]>([]);
  const [dateStats, setDateStats] = useState<TokenUsageStatDto[]>([]);
  const [dateRange, setDateRange] = useState<DateRangeValue>();
  const [selectedModel, setSelectedModel] = useState<string | undefined>();
  const [dateTabLoaded, setDateTabLoaded] = useState<boolean>(false);
  const [datePickerKey, setDatePickerKey] = useState<number>(0);

  const total = useMemo(
    () =>
      modelStats.reduce(
        (acc, stat) => ({
          totalTokens: acc.totalTokens + Number(stat.totalTokens ?? 0),
          promptTokens: acc.promptTokens + Number(stat.promptTokens ?? 0),
          completionTokens:
            acc.completionTokens + Number(stat.completionTokens ?? 0),
          totalCost: acc.totalCost + Number(stat.totalCost ?? 0),
          requestCount: acc.requestCount + Number(stat.requestCount ?? 0),
        }),
        {
          totalTokens: 0,
          promptTokens: 0,
          completionTokens: 0,
          totalCost: 0,
          requestCount: 0,
        }
      ),
    [modelStats]
  );

  const modelOptions = useMemo(
    () =>
      modelStats
        .map((stat) => stat.dimension)
        .filter((name): name is string => Boolean(name))
        .sort((left, right) => left.localeCompare(right)),
    [modelStats]
  );

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const [modelRes, businessRes] = await Promise.all([
        getMyStatisticsByModel(),
        getMyStatisticsByBusiness(),
      ]);
      setModelStats(toList(modelRes.data as WrappedList<TokenUsageStatDto>));
      setBusinessStats(
        toList(businessRes.data as WrappedList<TokenUsageStatDto>)
      );
    } catch (error) {
      console.error(error);
      Message.error('加载 Token 统计失败');
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const loadDateStats = useCallback(
    async (
      range: DateRangeValue = dateRange,
      modelName: string | undefined = selectedModel
    ) => {
      setDateLoading(true);
      try {
        const params: { startDate?: string; endDate?: string; modelName?: string } =
          {};
        if (range?.[0] && range?.[1]) {
          params.startDate = range[0];
          params.endDate = range[1];
        }
        if (modelName) {
          params.modelName = modelName;
        }
        const res = await getMyStatisticsByDate(params);
        setDateStats(toList(res.data as WrappedList<TokenUsageStatDto>));
        setDateTabLoaded(true);
      } catch (error) {
        console.error(error);
        Message.error('加载按日期统计失败');
      } finally {
        setDateLoading(false);
      }
    },
    [dateRange, selectedModel]
  );

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key === 'date' && !dateTabLoaded) {
      void loadDateStats();
    }
  };

  const handleResetFilters = () => {
    setDateRange(undefined);
    setSelectedModel(undefined);
    setDatePickerKey((prev) => prev + 1);
    void loadDateStats(undefined, undefined);
  };

  const modelColumns = [
    {
      title: '模型名称',
      dataIndex: 'dimension',
      key: 'dimension',
    },
    {
      title: '输入 Token',
      dataIndex: 'promptTokens',
      key: 'promptTokens',
      render: (value: number) => formatNumber(value),
    },
    {
      title: '输出 Token',
      dataIndex: 'completionTokens',
      key: 'completionTokens',
      render: (value: number) => formatNumber(value),
    },
    {
      title: '总 Token',
      dataIndex: 'totalTokens',
      key: 'totalTokens',
      render: (value: number) => formatNumber(value),
    },
    {
      title: '请求次数',
      dataIndex: 'requestCount',
      key: 'requestCount',
      render: (value: number) => formatNumber(value),
    },
    {
      title: '总成本',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (value: number) => formatCost(value),
    },
  ];

  const businessColumns = [
    {
      title: '业务类型',
      dataIndex: 'dimension',
      key: 'dimension',
      render: (value: string) => mapBusinessType(value),
    },
    {
      title: '输入 Token',
      dataIndex: 'promptTokens',
      key: 'promptTokens',
      render: (value: number) => formatNumber(value),
    },
    {
      title: '输出 Token',
      dataIndex: 'completionTokens',
      key: 'completionTokens',
      render: (value: number) => formatNumber(value),
    },
    {
      title: '总 Token',
      dataIndex: 'totalTokens',
      key: 'totalTokens',
      render: (value: number) => formatNumber(value),
    },
    {
      title: '请求次数',
      dataIndex: 'requestCount',
      key: 'requestCount',
      render: (value: number) => formatNumber(value),
    },
    {
      title: '总成本',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (value: number) => formatCost(value),
    },
  ];

  const dateColumns = [
    {
      title: '日期',
      dataIndex: 'dimension',
      key: 'dimension',
    },
    {
      title: '输入 Token',
      dataIndex: 'promptTokens',
      key: 'promptTokens',
      render: (value: number) => formatNumber(value),
    },
    {
      title: '输出 Token',
      dataIndex: 'completionTokens',
      key: 'completionTokens',
      render: (value: number) => formatNumber(value),
    },
    {
      title: '总 Token',
      dataIndex: 'totalTokens',
      key: 'totalTokens',
      render: (value: number) => formatNumber(value),
    },
    {
      title: '请求次数',
      dataIndex: 'requestCount',
      key: 'requestCount',
      render: (value: number) => formatNumber(value),
    },
    {
      title: '总成本',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (value: number) => formatCost(value),
    },
  ];

  return (
    <div className="token-usage-page">
      <div className="token-usage-header">
        <Title heading={4} style={{ marginBottom: 0 }}>
          Token 使用统计
        </Title>
        <Button
          icon={<IconRefresh />}
          onClick={() => {
            void loadOverview();
            if (activeTab === 'date') {
              void loadDateStats();
            }
          }}
        >
          刷新
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总 Token"
              value={total.totalTokens}
              prefix={<IconThunderbolt />}
              countUp
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="输入 Token"
              value={total.promptTokens}
              prefix={<IconFile />}
              countUp
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="输出 Token"
              value={total.completionTokens}
              prefix={<IconFile />}
              countUp
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总成本"
              value={formatCost(total.totalCost)}
              prefix={<IconCalendar />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Spin loading={activeTab === 'date' ? dateLoading : overviewLoading}>
          <Tabs activeTab={activeTab} onChange={handleTabChange}>
            <TabPane key="model" title="按模型统计">
              <Table
                columns={modelColumns}
                data={modelStats}
                pagination={false}
                rowKey="dimension"
                scroll={{ x: 900 }}
              />
            </TabPane>
            <TabPane key="business" title="按业务类型统计">
              <Table
                columns={businessColumns}
                data={businessStats}
                pagination={false}
                rowKey="dimension"
                scroll={{ x: 900 }}
              />
            </TabPane>
            <TabPane key="date" title="按日期统计">
              <Space className="token-usage-filter" wrap>
                <RangePicker
                  key={datePickerKey}
                  onChange={(value) => {
                    if (value?.[0] && value?.[1]) {
                      const start = normalizeDateText(value[0]);
                      const end = normalizeDateText(value[1]);
                      if (start && end) {
                        setDateRange([start, end]);
                        return;
                      }
                    }
                    if (!value?.[0] || !value?.[1]) {
                      setDateRange(undefined);
                      return;
                    }
                    setDateRange(undefined);
                  }}
                  placeholder={['开始日期', '结束日期']}
                />
                <Select
                  placeholder="选择模型（可选）"
                  allowClear
                  value={selectedModel}
                  style={{ width: 240 }}
                  onChange={(value) =>
                    setSelectedModel(value as string | undefined)
                  }
                >
                  {modelOptions.map((modelName) => (
                    <Select.Option key={modelName} value={modelName}>
                      {modelName}
                    </Select.Option>
                  ))}
                </Select>
                <Button
                  type="primary"
                  onClick={() => {
                    void loadDateStats();
                  }}
                >
                  查询
                </Button>
                <Button onClick={handleResetFilters}>重置</Button>
              </Space>
              <Table
                columns={dateColumns}
                data={dateStats}
                pagination={false}
                rowKey="dimension"
                scroll={{ x: 900 }}
              />
            </TabPane>
          </Tabs>
        </Spin>
      </Card>
    </div>
  );
};

export default TokenUsagePage;
