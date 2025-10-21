import React, { useEffect, useRef, useState } from 'react';
import { Card, Grid, Statistic, Spin } from '@arco-design/web-react';
import * as echarts from 'echarts';
import { getDashboardStats, DashboardStats } from './api/dashboardApi';
import './index.less';

const Row = Grid.Row;
const Col = Grid.Col;

const Home: React.FC = () => {
  const knowledgeChartRef = useRef<HTMLDivElement>(null);
  const questionChartRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化统计数据
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('加载统计数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 初始化图表
  useEffect(() => {
    if (!stats || loading) return;

    // 初始化知识点统计图表
    if (knowledgeChartRef.current) {
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
          data: stats.knowledgeStats.map(item => item.subjectName),
          axisLabel: {
            interval: 0,
            rotate: 30
          }
        },
        yAxis: {
          type: 'value',
          name: '数量（个）',
          axisLabel: {
            formatter: '{value}'
          }
        },
        series: [
          {
            name: '知识点数量',
            type: 'bar',
            data: stats.knowledgeStats.map(item => item.count),
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#83bff6' },
                { offset: 0.5, color: '#188df0' },
                { offset: 1, color: '#188df0' }
              ])
            },
            emphasis: {
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#2378f7' },
                  { offset: 0.7, color: '#2378f7' },
                  { offset: 1, color: '#83bff6' }
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
    }

    // 初始化题目数量统计图表
    if (questionChartRef.current) {
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
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: '{b}: {c} 道'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: stats.questionStats.map(item => item.subjectName),
          axisLabel: {
            interval: 0,
            rotate: 30
          }
        },
        yAxis: {
          type: 'value',
          name: '数量（道）',
          axisLabel: {
            formatter: '{value}'
          }
        },
        series: [
          {
            name: '题目数量',
            type: 'bar',
            data: stats.questionStats.map(item => item.count),
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#fccb05' },
                { offset: 0.5, color: '#f5804d' },
                { offset: 1, color: '#f5804d' }
              ])
            },
            emphasis: {
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#f89d1e' },
                  { offset: 0.7, color: '#f89d1e' },
                  { offset: 1, color: '#fccb05' }
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
    }
  }, [stats, loading]);

  // 计算总数
  const totalKnowledge = stats?.knowledgeStats.reduce((sum, item) => sum + item.count, 0) || 0;
  const totalQuestions = stats?.questionStats.reduce((sum, item) => sum + item.count, 0) || 0;
  const totalSubjects = stats?.knowledgeStats.length || 0;

  return (
    <div className="home-container">
      <div className="page-header">
        <h1>数据统计仪表盘</h1>
      </div>

      <Spin loading={loading} tip="加载中...">
        {/* 统计卡片 */}
        <Row gutter={[16, 16]} className="stats-cards">
          <Col span={8}>
            <Card>
              <Statistic
                title="总学科数"
                value={totalSubjects}
                suffix="个"
                valueStyle={{ color: '#188df0' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="总知识点数"
                value={totalKnowledge}
                suffix="个"
                valueStyle={{ color: '#188df0' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="总题目数"
                value={totalQuestions}
                suffix="道"
                valueStyle={{ color: '#188df0' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 图表区域 */}
        <Row gutter={[16, 16]} className="charts-container">
          <Col span={12}>
            <Card className="chart-card">
              <div 
                ref={knowledgeChartRef} 
                className="chart"
                style={{ width: '100%', height: '400px' }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card className="chart-card">
              <div 
                ref={questionChartRef} 
                className="chart"
                style={{ width: '100%', height: '400px' }}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default Home;