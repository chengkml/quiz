import React, { useEffect, useMemo, useState } from 'react';
import { Card, Grid, Layout, Spin, Typography } from '@arco-design/web-react';
import { useNavigate } from 'react-router-dom';
import { getStatisticsThemes, StatisticsThemeDto } from './api';
import { statisticsThemeRegistry, statisticsThemeRegistryMap } from './themes/registry';
import './index.less';

const { Row, Col } = Grid;
const { Content } = Layout;
const { Paragraph, Title } = Typography;

function StatisticsCenterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [remoteThemes, setRemoteThemes] = useState<StatisticsThemeDto[]>([]);

  useEffect(() => {
    const loadThemes = async () => {
      try {
        setLoading(true);
        const response = await getStatisticsThemes();
        setRemoteThemes(response.data || []);
      } catch (error) {
        console.error('加载统计主题失败:', error);
        setRemoteThemes([]);
      } finally {
        setLoading(false);
      }
    };

    loadThemes();
  }, []);

  const themes = useMemo(() => {
    if (!remoteThemes.length) {
      return statisticsThemeRegistry;
    }

    return remoteThemes.map((remoteTheme) => {
      const localTheme = statisticsThemeRegistryMap.get(remoteTheme.themeKey);
      return {
        key: remoteTheme.themeKey,
        title: remoteTheme.title || localTheme?.title || remoteTheme.themeKey,
        description: remoteTheme.description || localTheme?.description || '',
        routePath: remoteTheme.routePath || localTheme?.routePath || '',
      };
    });
  }, [remoteThemes]);

  const openTheme = (routePath: string) => {
    if (!routePath) {
      return;
    }
    navigate(`/frame/${routePath}`);
  };

  return (
    <Layout className="statistics-center-page">
      <Content className="statistics-center-content">
        <div className="statistics-center-header">
          <Title heading={4}>统计中心</Title>
          <Paragraph className="statistics-center-subtitle">
            按统计主题进入数据面板，支持后续按主题持续扩展。
          </Paragraph>
        </div>

        {loading ? (
          <div className="statistics-center-loading">
            <Spin dot />
          </div>
        ) : (
          <Row gutter={16}>
            {themes.map((theme) => (
              <Col xs={24} sm={12} lg={8} key={theme.key}>
                <Card
                  className="statistics-theme-card"
                  title={theme.title}
                  hoverable
                  onClick={() => openTheme(theme.routePath)}
                >
                  <Paragraph className="statistics-theme-description">
                    {theme.description}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Content>
    </Layout>
  );
}

export default StatisticsCenterPage;
