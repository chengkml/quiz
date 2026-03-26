import React, { useEffect, useRef, useState } from 'react';
import { Card, Grid, Layout, Statistic } from '@arco-design/web-react';
import {
  IconBook,
  IconCalendarClock,
  IconCheckCircle,
  IconClockCircle,
} from '@arco-design/web-react/icon';
import * as echarts from 'echarts';
import {
  getKnowledgeMasteryDashboard,
  KnowledgeMasteryDashboardData,
} from '@/pages/StatisticsCenter/api';
import './index.less';

const { Row, Col } = Grid;
const { Content } = Layout;

function KnowledgeMasteryStatisticsPage() {
  const [dashboardData, setDashboardData] =
    useState<KnowledgeMasteryDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const masteryDistributionChartRef = useRef<HTMLDivElement>(null);
  const subjectDistributionChartRef = useRef<HTMLDivElement>(null);
  const reviewScoreChartRef = useRef<HTMLDivElement>(null);
  const reviewTrendChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const response = await getKnowledgeMasteryDashboard();
        setDashboardData(response.data);
      } catch (error) {
        console.error('获取知识点统计数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  useEffect(() => {
    if (loading || !dashboardData?.masteryDistribution || !masteryDistributionChartRef.current) {
      return;
    }

    const entries = Object.entries(dashboardData.masteryDistribution);
    const chart = echarts.init(masteryDistributionChartRef.current);

    chart.setOption({
      title: {
        text: '知识掌握分层分布',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        formatter: '{b}<br/>知识点数: {c}',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: entries.map((entry) => entry[0]),
        axisLabel: {
          interval: 0,
          rotate: 18,
        },
      },
      yAxis: {
        type: 'value',
        name: '知识点数',
      },
      series: [
        {
          type: 'bar',
          data: entries.map((entry) => entry[1]),
          barWidth: '50%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#36cfc9' },
              { offset: 1, color: '#08979c' },
            ]),
          },
          label: {
            show: true,
            position: 'top',
          },
        },
      ],
    });

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [dashboardData?.masteryDistribution, loading]);

  useEffect(() => {
    if (loading || !dashboardData?.knowledgeCountBySubject || !subjectDistributionChartRef.current) {
      return;
    }

    const entries = Object.entries(dashboardData.knowledgeCountBySubject);
    const chart = echarts.init(subjectDistributionChartRef.current);

    chart.setOption({
      title: {
        text: '学科知识点分布',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        formatter: '{b}<br/>知识点数: {c}',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: entries.map((entry) => entry[0]),
        axisLabel: {
          interval: 0,
          rotate: 24,
        },
      },
      yAxis: {
        type: 'value',
        name: '知识点数',
      },
      series: [
        {
          type: 'bar',
          data: entries.map((entry) => entry[1]),
          barWidth: '50%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#69c0ff' },
              { offset: 1, color: '#165dff' },
            ]),
          },
          label: {
            show: true,
            position: 'top',
          },
        },
      ],
    });

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [dashboardData?.knowledgeCountBySubject, loading]);

  useEffect(() => {
    if (loading || !dashboardData?.reviewScoreDistribution || !reviewScoreChartRef.current) {
      return;
    }

    const entries = Object.entries(dashboardData.reviewScoreDistribution);
    const chart = echarts.init(reviewScoreChartRef.current);

    chart.setOption({
      title: {
        text: '复习评分分布',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        formatter: '{b}<br/>次数: {c}',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '8%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: entries.map((entry) => entry[0]),
      },
      yAxis: {
        type: 'value',
        name: '复习次数',
      },
      series: [
        {
          type: 'bar',
          data: entries.map((entry) => entry[1]),
          barWidth: '45%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#f7ba1e' },
              { offset: 1, color: '#d48806' },
            ]),
          },
          label: {
            show: true,
            position: 'top',
          },
        },
      ],
    });

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [dashboardData?.reviewScoreDistribution, loading]);

  useEffect(() => {
    if (loading || !dashboardData?.reviewCountByLastSevenDays || !reviewTrendChartRef.current) {
      return;
    }

    const dateEntries = Object.entries(dashboardData.reviewCountByLastSevenDays);
    dateEntries.sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());

    const chart = echarts.init(reviewTrendChartRef.current);
    chart.setOption({
      title: {
        text: '近七天复习趋势',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'axis',
        formatter: '{b}<br/>复习次数: {c}',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '8%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dateEntries.map((entry) => entry[0]),
      },
      yAxis: {
        type: 'value',
        name: '复习次数',
      },
      series: [
        {
          type: 'line',
          smooth: true,
          data: dateEntries.map((entry) => entry[1]),
          itemStyle: {
            color: '#165dff',
          },
          areaStyle: {
            color: 'rgba(22, 93, 255, 0.16)',
          },
          lineStyle: {
            width: 3,
          },
        },
      ],
    });

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [dashboardData?.reviewCountByLastSevenDays, loading]);

  return (
    <Layout className="knowledge-mastery-statistics-container">
      <Content className="knowledge-mastery-statistics-content">
        <Row gutter={16} className="knowledge-mastery-stats-row">
          <Col span={6}>
            <Card className="knowledge-mastery-stat-card">
              <Statistic
                title="知识点总数"
                value={dashboardData?.overview.totalKnowledges ?? 0}
                prefix={<IconBook style={{ color: '#165dff' }} />}
                suffix="个"
                loading={loading}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="knowledge-mastery-stat-card">
              <Statistic
                title="活跃知识点"
                value={dashboardData?.overview.activeKnowledges ?? 0}
                prefix={<IconClockCircle style={{ color: '#0fc6c2' }} />}
                suffix="个"
                loading={loading}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="knowledge-mastery-stat-card">
              <Statistic
                title="今日待复习"
                value={dashboardData?.overview.dueTodayKnowledges ?? 0}
                prefix={<IconCalendarClock style={{ color: '#ff7d00' }} />}
                suffix="个"
                loading={loading}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="knowledge-mastery-stat-card">
              <Statistic
                title="已掌握"
                value={dashboardData?.overview.masteredKnowledges ?? 0}
                prefix={<IconCheckCircle style={{ color: '#00b42a' }} />}
                suffix="个"
                loading={loading}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16} className="knowledge-mastery-stats-row">
          <Col span={12}>
            <Card className="knowledge-mastery-summary-card">
              <Statistic
                title="平均连续记对次数"
                value={dashboardData?.overview.averageRepetition ?? 0}
                precision={2}
                loading={loading}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card className="knowledge-mastery-summary-card">
              <Statistic
                title="平均简易度因子"
                value={dashboardData?.overview.averageEasinessFactor ?? 0}
                precision={2}
                loading={loading}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16} className="knowledge-mastery-charts-row">
          <Col span={12}>
            <Card className="knowledge-mastery-chart-card">
              <div
                ref={masteryDistributionChartRef}
                className="knowledge-mastery-chart-container"
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card className="knowledge-mastery-chart-card">
              <div
                ref={subjectDistributionChartRef}
                className="knowledge-mastery-chart-container"
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16} className="knowledge-mastery-charts-row">
          <Col span={12}>
            <Card className="knowledge-mastery-chart-card">
              <div
                ref={reviewScoreChartRef}
                className="knowledge-mastery-chart-container"
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card className="knowledge-mastery-chart-card">
              <div
                ref={reviewTrendChartRef}
                className="knowledge-mastery-chart-container"
              />
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}

export default KnowledgeMasteryStatisticsPage;
