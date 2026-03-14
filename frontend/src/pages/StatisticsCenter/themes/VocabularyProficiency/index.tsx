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
  getVocabularyProficiencyDashboard,
  VocabularyProficiencyDashboardData,
} from '@/pages/StatisticsCenter/api';
import './index.less';

const { Row, Col } = Grid;
const { Content } = Layout;

function VocabularyProficiencyStatisticsPage() {
  const [dashboardData, setDashboardData] =
    useState<VocabularyProficiencyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const proficiencyChartRef = useRef<HTMLDivElement>(null);
  const reviewScoreChartRef = useRef<HTMLDivElement>(null);
  const reviewTrendChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const response = await getVocabularyProficiencyDashboard();
        setDashboardData(response.data);
      } catch (error) {
        console.error('获取单词熟练度统计数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  useEffect(() => {
    if (loading || !dashboardData?.proficiencyDistribution || !proficiencyChartRef.current) {
      return;
    }

    const entries = Object.entries(dashboardData.proficiencyDistribution);
    const chart = echarts.init(proficiencyChartRef.current);

    chart.setOption({
      title: {
        text: '熟练度分层分布',
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
        formatter: '{b}<br/>单词数: {c}',
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
        axisLabel: {
          interval: 0,
          rotate: 20,
        },
      },
      yAxis: {
        type: 'value',
        name: '单词数',
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
  }, [dashboardData?.proficiencyDistribution, loading]);

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
    <Layout className="vocabulary-proficiency-statistics-container">
      <Content className="vocabulary-proficiency-statistics-content">
        <Row gutter={16} className="vocabulary-proficiency-stats-row">
          <Col span={6}>
            <Card className="vocabulary-proficiency-stat-card">
              <Statistic
                title="单词总数"
                value={dashboardData?.overview.totalWords ?? 0}
                prefix={<IconBook style={{ color: '#165dff' }} />}
                suffix="个"
                loading={loading}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="vocabulary-proficiency-stat-card">
              <Statistic
                title="活跃单词"
                value={dashboardData?.overview.activeWords ?? 0}
                prefix={<IconClockCircle style={{ color: '#0fc6c2' }} />}
                suffix="个"
                loading={loading}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="vocabulary-proficiency-stat-card">
              <Statistic
                title="今日待复习"
                value={dashboardData?.overview.dueTodayWords ?? 0}
                prefix={<IconCalendarClock style={{ color: '#ff7d00' }} />}
                suffix="个"
                loading={loading}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="vocabulary-proficiency-stat-card">
              <Statistic
                title="已熟练"
                value={dashboardData?.overview.masteredWords ?? 0}
                prefix={<IconCheckCircle style={{ color: '#00b42a' }} />}
                suffix="个"
                loading={loading}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16} className="vocabulary-proficiency-stats-row">
          <Col span={12}>
            <Card className="vocabulary-proficiency-summary-card">
              <Statistic
                title="平均连续记对次数"
                value={dashboardData?.overview.averageRepetition ?? 0}
                precision={2}
                loading={loading}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card className="vocabulary-proficiency-summary-card">
              <Statistic
                title="平均简易度因子"
                value={dashboardData?.overview.averageEasinessFactor ?? 0}
                precision={2}
                loading={loading}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16} className="vocabulary-proficiency-charts-row">
          <Col span={12}>
            <Card className="vocabulary-proficiency-chart-card">
              <div
                ref={proficiencyChartRef}
                className="vocabulary-proficiency-chart-container"
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card className="vocabulary-proficiency-chart-card">
              <div
                ref={reviewScoreChartRef}
                className="vocabulary-proficiency-chart-container"
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16} className="vocabulary-proficiency-charts-row">
          <Col span={24}>
            <Card className="vocabulary-proficiency-chart-card vocabulary-proficiency-chart-card-full">
              <div
                ref={reviewTrendChartRef}
                className="vocabulary-proficiency-chart-container"
              />
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}

export default VocabularyProficiencyStatisticsPage;
