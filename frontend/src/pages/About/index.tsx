import React from 'react';
import { Card, Grid, Descriptions, Tag, Button, Space } from '@arco-design/web-react';
import {
  IconGithub,
  IconEmail,
  IconPhone,
  IconLocation,
} from '@arco-design/web-react/icon';
import './style.less';

const Row = Grid.Row;
const Col = Grid.Col;
const DescriptionsItem = Descriptions.Item;

const About: React.FC = () => {
  const systemInfo = {
    name: '数据合成平台',
    version: 'v1.0.0',
    buildTime: '2024-01-20 10:30:00',
    environment: 'Production',
    author: 'AsiaInfo Technology',
    description: '基于React和Arco Design构建的现代化数据管理平台',
  };

  const techStack = [
    { name: 'React', version: '18.2.0', description: '前端框架' },
    { name: 'TypeScript', version: '5.0.4', description: '类型安全' },
    { name: 'Arco Design', version: '2.45.0', description: 'UI组件库' },
    { name: 'React Router', version: '6.10.0', description: '路由管理' },
    { name: 'Webpack', version: '5.78.0', description: '构建工具' },
    { name: 'Axios', version: '1.3.5', description: 'HTTP客户端' },
  ];

  const features = [
    {
      title: '现代化UI设计',
      description: '基于Arco Design设计语言，提供一致的用户体验',
      icon: '🎨',
    },
    {
      title: '响应式布局',
      description: '支持多种设备尺寸，自适应不同屏幕',
      icon: '📱',
    },
    {
      title: '类型安全',
      description: '使用TypeScript开发，提供完整的类型检查',
      icon: '🔒',
    },
    {
      title: '模块化架构',
      description: '组件化开发，易于维护和扩展',
      icon: '🧩',
    },
    {
      title: '路由管理',
      description: '基于React Router的单页面应用路由',
      icon: '🛣️',
    },
    {
      title: '状态管理',
      description: '集成Redux进行全局状态管理',
      icon: '⚡',
    },
  ];

  return (
    <div className="about">
      <div className="page-header">
        <h2>关于系统</h2>
        <p>了解数据合成平台的详细信息</p>
      </div>

      <Row gutter={24}>
        {/* 系统信息 */}
        <Col span={12}>
          <Card title="系统信息" className="info-card">
            <Descriptions
              column={1}
              data={[
                {
                  label: '系统名称',
                  value: systemInfo.name,
                },
                {
                  label: '版本号',
                  value: (
                    <Tag color="blue" size="small">
                      {systemInfo.version}
                    </Tag>
                  ),
                },
                {
                  label: '构建时间',
                  value: systemInfo.buildTime,
                },
                {
                  label: '运行环境',
                  value: (
                    <Tag color="green" size="small">
                      {systemInfo.environment}
                    </Tag>
                  ),
                },
                {
                  label: '开发团队',
                  value: systemInfo.author,
                },
                {
                  label: '系统描述',
                  value: systemInfo.description,
                },
              ]}
            />
          </Card>
        </Col>

        {/* 联系信息 */}
        <Col span={12}>
          <Card title="联系我们" className="contact-card">
            <div className="contact-info">
              <div className="contact-item">
                <IconEmail className="contact-icon" />
                <div className="contact-content">
                  <div className="contact-label">邮箱</div>
                  <div className="contact-value">support@asiainfo.com</div>
                </div>
              </div>
              <div className="contact-item">
                <IconPhone className="contact-icon" />
                <div className="contact-content">
                  <div className="contact-label">电话</div>
                  <div className="contact-value">400-888-8888</div>
                </div>
              </div>
              <div className="contact-item">
                <IconLocation className="contact-icon" />
                <div className="contact-content">
                  <div className="contact-label">地址</div>
                  <div className="contact-value">北京市海淀区中关村软件园</div>
                </div>
              </div>
              <div className="contact-item">
                <IconGithub className="contact-icon" />
                <div className="contact-content">
                  <div className="contact-label">GitHub</div>
                  <div className="contact-value">
                    <Button
                      type="text"
                      size="small"
                      onClick={() => window.open('https://github.com/asiainfo', '_blank')}
                    >
                      github.com/asiainfo
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 技术栈 */}
      <Card title="技术栈" className="tech-card">
        <Row gutter={16}>
          {techStack.map((tech, index) => (
            <Col span={8} key={index}>
              <div className="tech-item">
                <div className="tech-header">
                  <span className="tech-name">{tech.name}</span>
                  <Tag size="small" color="arcoblue">
                    {tech.version}
                  </Tag>
                </div>
                <div className="tech-desc">{tech.description}</div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 功能特性 */}
      <Card title="功能特性" className="features-card">
        <Row gutter={24}>
          {features.map((feature, index) => (
            <Col span={8} key={index}>
              <div className="feature-item">
                <div className="feature-icon">{feature.icon}</div>
                <div className="feature-content">
                  <h4 className="feature-title">{feature.title}</h4>
                  <p className="feature-desc">{feature.description}</p>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 版权信息 */}
      <Card className="copyright-card">
        <div className="copyright-content">
          <p>
            © 2024 AsiaInfo Technology. All rights reserved.
          </p>
          <p>
            数据合成平台由亚信科技开发和维护，遵循MIT开源协议。
          </p>
        </div>
      </Card>
    </div>
  );
};

export default About;