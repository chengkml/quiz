import React from 'react';
import { Card, Grid, Statistic, Button } from '@arco-design/web-react';
import {
  IconArrowUp,
  IconArrowDown,
  IconStorage,
  IconFile,
  IconUser,
  IconCalendar,
} from '@arco-design/web-react/icon';
import './style.less';

const Row = Grid.Row;
const Col = Grid.Col;

const Dashboard: React.FC = () => {
  // 模拟数据
  const stats = [
    {
      title: '数据源总数',
      value: 1234,
      prefix: <IconStorage style={{ color: '#165dff' }} />,
      suffix: '个',
      extra: (
        <span style={{ color: '#00b42a' }}>
          <IconArrowUp /> 12%
        </span>
      ),
    },
    {
      title: '数据表总数',
      value: 5678,
      prefix: <IconFile style={{ color: '#ff7d00' }} />,
      suffix: '张',
      extra: (
        <span style={{ color: '#00b42a' }}>
          <IconArrowUp /> 8%
        </span>
      ),
    },
    {
      title: '活跃用户',
      value: 890,
      prefix: <IconUser style={{ color: '#00b42a' }} />,
      suffix: '人',
      extra: (
        <span style={{ color: '#f53f3f' }}>
          <IconArrowDown /> 3%
        </span>
      ),
    },
    {
      title: '今日访问',
      value: 2345,
      prefix: <IconCalendar style={{ color: '#722ed1' }} />,
      suffix: '次',
      extra: (
        <span style={{ color: '#00b42a' }}>
          <IconArrowUp /> 15%
        </span>
      ),
    },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>数据资源目录</h2>
        <p>欢迎使用数据合成平台，这里是您的数据管理中心</p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={24} className="stats-row">
        {stats.map((stat, index) => (
          <Col span={6} key={index}>
            <Card className="stat-card">
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
                extra={stat.extra}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 快速操作 */}
      <Row gutter={24} className="content-row">
        <Col span={12}>
          <Card title="快速操作" className="action-card">
            <div className="action-buttons">
              <Button type="primary" size="large" className="action-btn">
                创建数据源
              </Button>
              <Button type="outline" size="large" className="action-btn">
                导入数据
              </Button>
              <Button type="outline" size="large" className="action-btn">
                数据查询
              </Button>
              <Button type="outline" size="large" className="action-btn">
                生成报告
              </Button>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="最近活动" className="activity-card">
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-time">10:30</div>
                <div className="activity-content">
                  <div className="activity-title">用户张三创建了新的数据源</div>
                  <div className="activity-desc">MySQL数据库连接已建立</div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-time">09:15</div>
                <div className="activity-content">
                  <div className="activity-title">数据同步任务完成</div>
                  <div className="activity-desc">共同步1000条记录</div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-time">08:45</div>
                <div className="activity-content">
                  <div className="activity-title">系统备份完成</div>
                  <div className="activity-desc">数据备份已保存到云存储</div>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;