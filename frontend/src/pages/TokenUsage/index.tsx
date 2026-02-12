import React, { useEffect, useState } from 'react';
import {
  Card,
  Grid,
  Statistic,
  Table,
  Select,
  DatePicker,
  Space,
  Message,
  Spin,
  Typography,
  Tabs,
} from '@arco-design/web-react';
import {
  IconCalendar,
  IconFile,
  IconUser,
  IconThunderbolt,
} from '@arco-design/web-react/icon';
import {
  getMyStatisticsByModel,
  getMyStatisticsByBusiness,
  getMyStatisticsByDate,
  TokenUsageStatDto,
} from './api';
import './index.less';

const { Row, Col } = Grid;
const { Title } = Typography;
const { RangePicker } = DatePicker;
const TabPane = Tabs.TabPane;

const TokenUsagePage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [modelStats, setModelStats] = useState<TokenUsageStatDto[]>([]);
  const [businessStats, setBusinessStats] = useState<TokenUsageStatDto[]>([]);
  const [dateStats, setDateStats] = useState<TokenUsageStatDto[]>([]);
  const [dateRange, setDateRange] = useState<[string, string] | undefined>();
  const [selectedModel, setSelectedModel] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<string>('model');

  // 计算总计
  const calculateTotal = (stats: TokenUsageStatDto[]) => {
    return stats.reduce(
      (acc, stat) => ({
        totalTokens: acc.totalTokens + stat.totalTokens,
        promptTokens: acc.promptTokens + stat.promptTokens,
        completionTokens: acc.completionTokens + stat.completionTokens,
        totalCost: acc.totalCost + stat.totalCost,
        requestCount: acc.requestCount + stat.requestCount,
      }),
      { totalTokens: 0, promptTokens: 0, completionTokens: 0, totalCost: 0, requestCount: 0 }
    );
  };

  const total = calculateTotal([...modelStats, ...businessStats]);

  // 加载按模型统计
  const loadModelStats = async () => {
    setLoading(true);
    try {
      const res = await getMyStatisticsByModel();
      if (res.data) {
        setModelStats(res.data);
      }
    } catch (error) {
      console.error(error);
      Message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载按业务类型统计
  const loadBusinessStats = async () => {
    setLoading(true);
    try {
      const res = await getMyStatisticsByBusiness();
      if (res.data) {
        setBusinessStats(res.data);
      }
    } catch (error) {
      console.error(error);
      Message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载按日期统计
  const loadDateStats = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (dateRange) {
        params.startDate = dateRange[0];
        params.endDate = dateRange[1];
      }
      if (selectedModel) {
        params.modelName = selectedModel;
      }
      const res = await getMyStatisticsByDate(params);
      if (res.data) {
        setDateStats(res.data);
      }
    } catch (error) {
      console.error(error);
      Message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModelStats();
    loadBusinessStats();
    loadDateStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'date') {
      loadDateStats();
    }
  }, [dateRange, selectedModel]);

  const modelColumns = [
    {
      title: '模型名称',
      dataIndex: 'dimension',
      key: 'dimension',
    },
    {
      title: '输入Token',
      dataIndex: 'promptTokens',
      key: 'promptTokens',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '输出Token',
      dataIndex: 'completionTokens',
      key: 'completionTokens',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '总Token',
      dataIndex: 'totalTokens',
      key: 'totalTokens',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '请求次数',
      dataIndex: 'requestCount',
      key: 'requestCount',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '总成本',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (val: number) => `¥${val.toFixed(4)}`,
    },
  ];

  const businessColumns = [
    {
      title: '业务类型',
      dataIndex: 'dimension',
      key: 'dimension',
      render: (val: string) => {
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
        return typeMap[val] || val;
      },
    },
    {
      title: '输入Token',
      dataIndex: 'promptTokens',
      key: 'promptTokens',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '输出Token',
      dataIndex: 'completionTokens',
      key: 'completionTokens',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '总Token',
      dataIndex: 'totalTokens',
      key: 'totalTokens',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '请求次数',
      dataIndex: 'requestCount',
      key: 'requestCount',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '总成本',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (val: number) => `¥${val.toFixed(4)}`,
    },
  ];

  const dateColumns = [
    {
      title: '日期',
      dataIndex: 'dimension',
      key: 'dimension',
    },
    {
      title: '输入Token',
      dataIndex: 'promptTokens',
      key: 'promptTokens',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '输出Token',
      dataIndex: 'completionTokens',
      key: 'completionTokens',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '总Token',
      dataIndex: 'totalTokens',
      key: 'totalTokens',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '请求次数',
      dataIndex: 'requestCount',
      key: 'requestCount',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '总成本',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (val: number) => `¥${val.toFixed(4)}`,
    },
  ];

  return (
    <div className="token-usage-page">
      <Title heading={4} style={{ marginBottom: 20 }}>
        Token使用统计
      </Title>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6} md={6}>
          <Card>
            <Statistic
              title="总Token数"
              value={total.totalTokens}
              prefix={<IconThunderbolt />}
              countUp
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={6}>
          <Card>
            <Statistic
              title="输入Token"
              value={total.promptTokens}
              prefix={<IconFile />}
              countUp
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={6}>
          <Card>
            <Statistic
              title="输出Token"
              value={total.completionTokens}
              prefix={<IconFile />}
              countUp
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={6}>
          <Card>
            <Statistic
              title="总成本"
              value={`¥${total.totalCost.toFixed(4)}`}
              prefix={<IconCalendar />}
            />
          </Card>
        </Col>
      </Row>

      {/* 统计表格 */}
      <Card>
        <Spin loading={loading}>
          <Tabs activeTab={activeTab} onChange={setActiveTab}>
            <TabPane key="model" title="按模型统计">
              <Table
                columns={modelColumns}
                data={modelStats}
                pagination={false}
                rowKey="dimension"
                scroll={{ x: 'max-content' }}
              />
            </TabPane>
            <TabPane key="business" title="按业务类型统计">
              <Table
                columns={businessColumns}
                data={businessStats}
                pagination={false}
                rowKey="dimension"
                scroll={{ x: 'max-content' }}
              />
            </TabPane>
            <TabPane key="date" title="按日期统计">
              <Space style={{ marginBottom: 16, flexWrap: 'wrap' }} size={16}>
                <RangePicker
                  onChange={(_, dateStrings) => {
                    if (dateStrings && dateStrings[0] && dateStrings[1]) {
                      setDateRange([dateStrings[0], dateStrings[1]]);
                    } else {
                      setDateRange(undefined);
                    }
                  }}
                  placeholder={['开始日期', '结束日期']}
                  style={{ width: 250 }}
                />
                <Select
                  placeholder="选择模型（可选）"
                  allowClear
                  style={{ width: 200 }}
                  onChange={(val) => setSelectedModel(val)}
                >
                  {modelStats.map((stat) => (
                    <Select.Option key={stat.dimension} value={stat.dimension}>
                      {stat.dimension}
                    </Select.Option>
                  ))}
                </Select>
              </Space>
              <Table
                columns={dateColumns}
                data={dateStats}
                pagination={false}
                rowKey="dimension"
                scroll={{ x: 'max-content' }}
              />
            </TabPane>
          </Tabs>
        </Spin>
      </Card>
    </div>
  );
};

export default TokenUsagePage;
