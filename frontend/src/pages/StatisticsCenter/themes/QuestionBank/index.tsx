import React, { useEffect, useRef, useState } from 'react';
import { Card, Grid, Layout, Statistic } from '@arco-design/web-react';
import {
  IconBulb,
  IconFile,
  IconList,
  IconQuestionCircle,
} from '@arco-design/web-react/icon';
import * as echarts from 'echarts';
import {
  getQuestionBankDashboard,
  QuestionBankDashboardData,
} from '@/pages/StatisticsCenter/api';
import './index.less';

const { Row, Col } = Grid;
const { Content } = Layout;

function QuestionBankStatisticsPage() {
  const [statisticsData, setStatisticsData] =
    useState<QuestionBankDashboardData['overview'] | null>(null);
  const [lastSevenDaysData, setLastSevenDaysData] =
    useState<QuestionBankDashboardData['questionCountByLastSevenDays'] | null>(null);
  const [subjectQuestionData, setSubjectQuestionData] =
    useState<QuestionBankDashboardData['questionCountBySubject'] | null>(null);
  const [lastMonthData, setLastMonthData] =
    useState<QuestionBankDashboardData['questionCountByLastMonth'] | null>(null);
  const [loading, setLoading] = useState(true);

  const knowledgeChartRef = useRef<HTMLDivElement>(null);
  const questionChartRef = useRef<HTMLDivElement>(null);
  const sevenDaysChartRef = useRef<HTMLDivElement>(null);
  const lastMonthChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initDashboard = async () => {
      try {
        setLoading(true);
        const response = await getQuestionBankDashboard();
        const data = response.data;

        setStatisticsData(data.overview);
        setLastSevenDaysData(data.questionCountByLastSevenDays);
        setSubjectQuestionData(data.questionCountBySubject);
        setLastMonthData(data.questionCountByLastMonth);
      } catch (error) {
        console.error('获取题库统计数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    initDashboard();
  }, []);

  useEffect(() => {
    if (loading || !subjectQuestionData || !knowledgeChartRef.current) return;

    const subjects = Object.keys(subjectQuestionData);
    const counts = Object.values(subjectQuestionData);

    const chart = echarts.init(knowledgeChartRef.current);
    chart.setOption({
      title: {
        text: '各学科知识点数量统计',
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
        formatter: '{b}: {c} 个',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: subjects,
        axisLabel: {
          interval: 0,
          rotate: 30,
        },
      },
      yAxis: {
        type: 'value',
        name: '知识点数量',
      },
      series: [
        {
          name: '知识点数量',
          type: 'bar',
          data: counts,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#40a9ff' },
              { offset: 0.5, color: '#1890ff' },
              { offset: 1, color: '#096dd9' },
            ]),
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#69c0ff' },
                { offset: 0.7, color: '#69c0ff' },
                { offset: 1, color: '#40a9ff' },
              ]),
            },
          },
          label: {
            show: true,
            position: 'top',
            formatter: '{c}',
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
  }, [subjectQuestionData, loading]);

  useEffect(() => {
    if (loading || !lastSevenDaysData || !sevenDaysChartRef.current) return;

    const dateEntries = Object.entries(lastSevenDaysData);
    dateEntries.sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
    const dates = dateEntries.map((entry) => entry[0]);
    const counts = dateEntries.map((entry) => entry[1]);

    const chart = echarts.init(sevenDaysChartRef.current);
    chart.setOption({
      title: {
        text: '近七天题目增加量',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'axis',
        formatter(params: any) {
          return `${params[0].name}<br/>新增题目: ${params[0].value} 道`;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
      },
      yAxis: {
        type: 'value',
        name: '题目数量',
      },
      series: [
        {
          name: '新增题目',
          type: 'line',
          smooth: true,
          data: counts,
          itemStyle: {
            color: '#52c41a',
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
              { offset: 1, color: 'rgba(82, 196, 26, 0.1)' },
            ]),
          },
          markLine: {
            silent: true,
            lineStyle: {
              color: '#333',
            },
            data: [
              {
                type: 'average',
                name: '平均值',
                label: {
                  formatter: '平均值: {c}',
                },
              },
            ],
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
  }, [lastSevenDaysData, loading]);

  useEffect(() => {
    if (loading || !subjectQuestionData || !questionChartRef.current) return;

    const subjects = Object.keys(subjectQuestionData);
    const pieData = Object.entries(subjectQuestionData).map(([subject, count]) => ({
      name: subject,
      value: count,
    }));

    const chart = echarts.init(questionChartRef.current);
    chart.setOption({
      title: {
        text: '各学科题目数量统计',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        data: subjects,
      },
      series: [
        {
          name: '题目数量',
          type: 'pie',
          radius: '50%',
          center: ['50%', '60%'],
          data: pieData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
          label: {
            formatter: '{b}: {c}',
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
  }, [subjectQuestionData, loading]);

  useEffect(() => {
    if (loading || !lastMonthData || !lastMonthChartRef.current) return;

    const dateEntries = Object.entries(lastMonthData);
    dateEntries.sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
    const dates = dateEntries.map((entry) => entry[0]);
    const counts = dateEntries.map((entry) => entry[1]);

    const chart = echarts.init(lastMonthChartRef.current);
    chart.setOption({
      title: {
        text: '近一个月题目增加趋势',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'axis',
        formatter(params: any) {
          return `${params[0].name}<br/>新增题目: ${params[0].value} 道`;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          interval: Math.max(Math.floor(dates.length / 7), 1),
          rotate: 45,
        },
      },
      yAxis: {
        type: 'value',
        name: '题目数量',
      },
      series: [
        {
          name: '新增题目',
          type: 'bar',
          data: counts,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#fccb05' },
              { offset: 0.5, color: '#f5804d' },
              { offset: 1, color: '#f5804d' },
            ]),
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#f89d1e' },
                { offset: 0.7, color: '#f89d1e' },
                { offset: 1, color: '#fccb05' },
              ]),
            },
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
  }, [lastMonthData, loading]);

  return (
    <Layout className="question-bank-statistics-container">
      <Content className="question-bank-statistics-content">
        <div className="question-bank-statistics-header">题库统计</div>

        <Row gutter={16} className="question-bank-stats-row">
          <Col span={6}>
            <Card className="question-bank-stat-card">
              <Statistic
                title="待办数"
                value={statisticsData?.todoCount || 0}
                prefix={<IconQuestionCircle style={{ color: '#1890ff' }} />}
                suffix="个"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="question-bank-stat-card">
              <Statistic
                title="题目总数"
                value={statisticsData?.questionCount || 0}
                prefix={<IconList style={{ color: '#52c41a' }} />}
                suffix="个"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="question-bank-stat-card">
              <Statistic
                title="昨日新增题目数"
                value={statisticsData?.yesterdayQuestionCount || 0}
                prefix={<IconFile style={{ color: '#fa8c16' }} />}
                suffix="个"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="question-bank-stat-card">
              <Statistic
                title="学科总数"
                value={statisticsData?.subjectCount || 0}
                prefix={<IconBulb style={{ color: '#722ed1' }} />}
                suffix="个"
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16} className="question-bank-charts-row">
          <Col span={12}>
            <Card className="question-bank-chart-card">
              <div ref={knowledgeChartRef} className="question-bank-chart-container" />
            </Card>
          </Col>
          <Col span={12}>
            <Card className="question-bank-chart-card">
              <div ref={sevenDaysChartRef} className="question-bank-chart-container" />
            </Card>
          </Col>
        </Row>
        <Row gutter={16} className="question-bank-charts-row">
          <Col span={12}>
            <Card className="question-bank-chart-card">
              <div ref={questionChartRef} className="question-bank-chart-container" />
            </Card>
          </Col>
          <Col span={12}>
            <Card className="question-bank-chart-card">
              <div ref={lastMonthChartRef} className="question-bank-chart-container" />
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}

export default QuestionBankStatisticsPage;
