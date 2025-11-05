import React, { useEffect, useRef, useState } from 'react';
import { Card, Grid, Layout, Statistic } from '@arco-design/web-react';
const { Row, Col } = Grid;
import {IconQuestionCircle, IconList, IconFile, IconBulb} from '@arco-design/web-react/icon';
import * as echarts from 'echarts';
import { DateCountData, Statistics, SubjectCountData, getQuestionCountByLastMonth, getQuestionCountByLastSevenDays, getQuestionCountBySubject, getStatistics } from './api/dashboardApi';
import './index.less';

const { Content } = Layout;

function Home() {
  const [statisticsData, setStatisticsData] = useState<Statistics | null>(null);
  const [lastSevenDaysData, setLastSevenDaysData] = useState<DateCountData | null>(null);
  const [subjectQuestionData, setSubjectQuestionData] = useState<SubjectCountData | null>(null);
  const [lastMonthData, setLastMonthData] = useState<DateCountData | null>(null);
  const [loading, setLoading] = useState(true);

  // 图表引用
  const knowledgeChartRef = useRef<HTMLDivElement>(null);
  const questionChartRef = useRef<HTMLDivElement>(null);
  const sevenDaysChartRef = useRef<HTMLDivElement>(null);
  const lastMonthChartRef = useRef<HTMLDivElement>(null);

  // 初始化图表
  useEffect(() => {
    const initCharts = async () => {
      try {
        setLoading(true);
        // 并行获取所有统计数据
        const [statisticsData, sevenDaysStats, subjectStats, monthStats] = await Promise.all([
          getStatistics(),
          getQuestionCountByLastSevenDays(),
          getQuestionCountBySubject(),
          getQuestionCountByLastMonth()
        ]);

        setStatisticsData(statisticsData.data);
        setLastSevenDaysData(sevenDaysStats.data);
        setSubjectQuestionData(subjectStats.data);
        setLastMonthData(monthStats.data);
      } catch (error) {
        console.error('获取统计数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    initCharts();
  }, []);

  // 渲染各学科知识点数量统计图表
  useEffect(() => {
    if (loading || !subjectQuestionData || !knowledgeChartRef.current) return;

    // 转换数据格式：对象转为数组
    const subjects = Object.keys(subjectQuestionData);
    const counts = Object.values(subjectQuestionData);

    const knowledgeChart = echarts.init(knowledgeChartRef.current);
    const knowledgeOption = {
      title: {
        text: '各学科知识点数量统计',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: '{b}: {c} 个'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: subjects,
        axisLabel: {
          interval: 0,
          rotate: 30
        }
      },
      yAxis: {
        type: 'value',
        name: '知识点数量'
      },
      series: [
        {
          name: '知识点数量',
          type: 'bar',
          data: counts,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {offset: 0, color: '#40a9ff'},
              {offset: 0.5, color: '#1890ff'},
              {offset: 1, color: '#096dd9'}
            ])
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {offset: 0, color: '#69c0ff'},
                {offset: 0.7, color: '#69c0ff'},
                {offset: 1, color: '#40a9ff'}
              ])
            }
          },
          label: {
            show: true,
            position: 'top',
            formatter: '{c}'
          }
        }
      ]
    };

    knowledgeChart.setOption(knowledgeOption);

    // 响应式调整
    const handleResize = () => {
      knowledgeChart.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      knowledgeChart.dispose();
    };
  }, [subjectQuestionData, loading]);

  // 渲染近七天题目增加量图表
  useEffect(() => {
    if (loading || !lastSevenDaysData || !sevenDaysChartRef.current) return;

    // 转换数据格式：对象转为数组并按日期排序
    const dateEntries = Object.entries(lastSevenDaysData);
    // 按日期升序排序
    dateEntries.sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
    const dates = dateEntries.map(entry => entry[0]);
    const counts = dateEntries.map(entry => entry[1]);

    const sevenDaysChart = echarts.init(sevenDaysChartRef.current);
    const sevenDaysOption = {
      title: {
        text: '近七天题目增加量',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          return params[0].name + '<br/>新增题目: ' + params[0].value + ' 道';
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates
      },
      yAxis: {
        type: 'value',
        name: '题目数量'
      },
      series: [
        {
          name: '新增题目',
          type: 'line',
          smooth: true,
          data: counts,
          itemStyle: {
            color: '#52c41a'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {offset: 0, color: 'rgba(82, 196, 26, 0.3)'},
              {offset: 1, color: 'rgba(82, 196, 26, 0.1)'}
            ])
          },
          markLine: {
            silent: true,
            lineStyle: {
              color: '#333'
            },
            data: [
              {
                type: 'average',
                name: '平均值',
                label: {
                  formatter: '平均值: {c}'
                }
              }
            ]
          }
        }
      ]
    };

    sevenDaysChart.setOption(sevenDaysOption);

    // 响应式调整
    const handleResize = () => {
      sevenDaysChart.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      sevenDaysChart.dispose();
    };
  }, [lastSevenDaysData, loading]);

  // 渲染各学科题目数量统计图表
  useEffect(() => {
    if (loading || !subjectQuestionData || !questionChartRef.current) return;

    // 转换数据格式：对象转为饼图所需的数据格式
    const subjects = Object.keys(subjectQuestionData);
    const pieData = Object.entries(subjectQuestionData).map(([subject, count]) => ({
      name: subject,
      value: count
    }));

    const questionChart = echarts.init(questionChartRef.current);
    const questionOption = {
      title: {
        text: '各学科题目数量统计',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        data: subjects
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
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          label: {
            formatter: '{b}: {c}'
          }
        }
      ]
    };

    questionChart.setOption(questionOption);

    // 响应式调整
    const handleResize = () => {
      questionChart.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      questionChart.dispose();
    };
  }, [subjectQuestionData, loading]);

  // 渲染近一个月题目增加量图表
  useEffect(() => {
    if (loading || !lastMonthData || !lastMonthChartRef.current) return;

    // 转换数据格式：对象转为数组并按日期排序
    const dateEntries = Object.entries(lastMonthData);
    // 按日期升序排序
    dateEntries.sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
    const dates = dateEntries.map(entry => entry[0]);
    const counts = dateEntries.map(entry => entry[1]);

    const lastMonthChart = echarts.init(lastMonthChartRef.current);
    const lastMonthOption = {
      title: {
        text: '近一个月题目增加趋势',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          return params[0].name + '<br/>新增题目: ' + params[0].value + ' 道';
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          interval: Math.floor(dates.length / 7),
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        name: '题目数量'
      },
      series: [
        {
          name: '新增题目',
          type: 'bar',
          data: counts,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {offset: 0, color: '#fccb05'},
              {offset: 0.5, color: '#f5804d'},
              {offset: 1, color: '#f5804d'}
            ])
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {offset: 0, color: '#f89d1e'},
                {offset: 0.7, color: '#f89d1e'},
                {offset: 1, color: '#fccb05'}
              ])
            }
          }
        }
      ]
    };

    lastMonthChart.setOption(lastMonthOption);

    // 响应式调整
    const handleResize = () => {
      lastMonthChart.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      lastMonthChart.dispose();
    };
  }, [lastMonthData, loading]);

  return (
    <Layout className="home-container">
      <Content className="content">
        {/* 统计指标卡片 */}
        <Row gutter={16} className="stats-row">
          <Col span={6}>
            <Card className="stat-card">
              <Statistic
                title="待办数"
                value={statisticsData?.todoCount || 0}
                prefix={<IconQuestionCircle style={{ color: '#1890ff' }} />}
                suffix="个"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="stat-card">
              <Statistic
                title="题目总数"
                value={statisticsData?.questionCount || 0}
                prefix={<IconList style={{ color: '#52c41a' }} />}
                suffix="个"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="stat-card">
              <Statistic
                title="昨日新增题目数"
                value={statisticsData?.yesterdayQuestionCount || 0}
                prefix={<IconFile style={{ color: '#fa8c16' }} />}
                suffix="个"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="stat-card">
              <Statistic
                title="学科总数"
                value={statisticsData?.subjectCount || 0}
                prefix={<IconBulb style={{ color: '#722ed1' }} />}
                suffix="个"
              />
            </Card>
          </Col>
        </Row>

        {/* 图表展示区域 */}
        <Row gutter={16} className="charts-row">
          <Col span={12}>
            <Card className="chart-card">
              <div ref={knowledgeChartRef} className="chart-container"></div>
            </Card>
          </Col>
          <Col span={12}>
            <Card className="chart-card">
              <div ref={sevenDaysChartRef} className="chart-container"></div>
            </Card>
          </Col>
        </Row>
        <Row gutter={16} className="charts-row">
          <Col span={12}>
            <Card className="chart-card">
              <div ref={questionChartRef} className="chart-container"></div>
            </Card>
          </Col>
          <Col span={12}>
            <Card className="chart-card">
              <div ref={lastMonthChartRef} className="chart-container"></div>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}

export default Home;