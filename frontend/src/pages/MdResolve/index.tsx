import React, { useState } from 'react';
import {
  Button,
  Card,
  Form,
  Grid,
  Layout,
  Message,
  Spin,
  Input,
  Tabs,
  Typography,
  Space,
} from '@arco-design/web-react';
import {
  IconCopy,
  IconDelete,
  IconFile,
  IconRefresh,
  IconDownload,
} from '@arco-design/web-react/icon';
import { getDefaultTemplate, resolveMdContent } from '@/services/mdResolveService';
import './index.less';

const { Content } = Layout;
const { Row, Col } = Grid;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Title, Paragraph } = Typography;

interface ResolveResult {
  success: boolean;
  message: string;
  data: Record<string, Array<Record<string, any>>> | null;
}

const MdResolvePage: React.FC = () => {
  const [mdContent, setMdContent] = useState<string>('');
  const [mdTemplate, setMdTemplate] = useState<string>('');
  const [useCustomTemplate, setUseCustomTemplate] = useState<boolean>(false);
  const [resolveResult, setResolveResult] = useState<ResolveResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);

  // 加载默认模板
  const handleLoadDefaultTemplate = async () => {
    setTemplateLoading(true);
    try {
      const response = await getDefaultTemplate();
      if (response.success && response.data) {
        setMdTemplate(response.data);
        Message.success('默认模板加载成功');
      } else {
        Message.error(response.message || '加载默认模板失败');
      }
    } catch (error) {
      Message.error('加载默认模板失败');
      console.error(error);
    } finally {
      setTemplateLoading(false);
    }
  };

  // 解析 Markdown
  const handleResolve = async () => {
    if (!mdContent.trim()) {
      Message.warning('请输入 Markdown 内容');
      return;
    }

    if (useCustomTemplate && !mdTemplate.trim()) {
      Message.warning('请输入自定义模板或切换到使用默认模板');
      return;
    }

    setLoading(true);
    setResolveResult(null);

    try {
      const requestData = {
        mdContent: mdContent,
        ...(useCustomTemplate && mdTemplate.trim() ? { mdTemplate: mdTemplate } : {}),
      };

      const response = await resolveMdContent(requestData);
      setResolveResult(response);

      if (response.success) {
        Message.success('解析成功');
      } else {
        Message.error(response.message || '解析失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '解析失败';
      setResolveResult({
        success: false,
        message: errorMessage,
        data: null,
      });
      Message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 清空内容
  const handleClear = () => {
    setMdContent('');
    setMdTemplate('');
    setResolveResult(null);
  };

  // 复制结果
  const handleCopyResult = () => {
    if (resolveResult?.data) {
      const jsonString = JSON.stringify(resolveResult.data, null, 2);
      navigator.clipboard.writeText(jsonString).then(() => {
        Message.success('结果已复制到剪贴板');
      }).catch(() => {
        Message.error('复制失败');
      });
    }
  };

  // 下载结果
  const handleDownloadResult = () => {
    if (resolveResult?.data) {
      const jsonString = JSON.stringify(resolveResult.data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `md-resolve-result-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      Message.success('结果已下载');
    }
  };

  // 示例 Markdown
  const loadSampleMd = () => {
    const sample = `# 问题列表

## 问题1
- 问题：什么是 TypeScript？
- 答案：TypeScript 是 JavaScript 的超集，添加了类型系统。
- 难度：简单

## 问题2
- 问题：什么是 React Hooks？
- 答案：React Hooks 是 React 16.8 引入的新特性，让函数组件也能使用状态和其他 React 特性。
- 难度：中等`;
    setMdContent(sample);
    Message.success('已加载示例内容');
  };

  // 示例模板
  const loadSampleTemplate = () => {
    const sample = `# {{question.title}}
- 问题：{{question.question}}
- 答案：{{question.answer}}
- 难度：{{question.difficulty}}
---`;
    setMdTemplate(sample);
    setUseCustomTemplate(true);
    Message.success('已加载示例模板');
  };

  return (
    <div className="md-resolve-container">
      <Layout className="md-resolve-layout">
        <Content>
          <Row gutter={20} style={{ height: '100%' }}>
            {/* 左侧：输入区域 */}
            <Col span={12}>
              <Card
                className="input-card"
                title="Markdown 内容"
                bordered={false}
                extra={
                  <Space>
                    <Button
                      type="text"
                      size="small"
                      onClick={loadSampleMd}
                    >
                      加载示例
                    </Button>
                    <Button
                      type="text"
                      size="small"
                      status="danger"
                      icon={<IconDelete />}
                      onClick={() => setMdContent('')}
                      disabled={!mdContent}
                    >
                      清空
                    </Button>
                  </Space>
                }
              >
                <div className="input-content">
                  <TextArea
                    placeholder="请输入 Markdown 内容..."
                    value={mdContent}
                    onChange={setMdContent}
                    style={{ height: '100%' }}
                    className="md-textarea"
                  />
                </div>
              </Card>

              <Card
                className="template-card"
                title={
                  <Space>
                    <span>解析模板</span>
                    <Button
                      type="text"
                      size="mini"
                      onClick={() => setUseCustomTemplate(!useCustomTemplate)}
                    >
                      {useCustomTemplate ? '使用默认模板' : '使用自定义模板'}
                    </Button>
                  </Space>
                }
                bordered={false}
                extra={
                  useCustomTemplate && (
                    <Space>
                      <Button
                        type="text"
                        size="small"
                        onClick={loadSampleTemplate}
                      >
                        加载示例
                      </Button>
                      <Button
                        type="text"
                        size="small"
                        onClick={handleLoadDefaultTemplate}
                        loading={templateLoading}
                        icon={<IconDownload />}
                      >
                        加载默认
                      </Button>
                      <Button
                        type="text"
                        size="small"
                        status="danger"
                        icon={<IconDelete />}
                        onClick={() => setMdTemplate('')}
                        disabled={!mdTemplate}
                      >
                        清空
                      </Button>
                    </Space>
                  )
                }
              >
                {useCustomTemplate ? (
                  <div className="template-content">
                    <TextArea
                      placeholder="请输入自定义模板，使用 {{blockKey.fieldKey}} 语法标记提取字段..."
                      value={mdTemplate}
                      onChange={setMdTemplate}
                      style={{ height: '100%', minHeight: '200px' }}
                      className="template-textarea"
                    />
                  </div>
                ) : (
                  <div className="template-info">
                    <Paragraph>
                      当前使用默认模板进行解析。如需自定义模板，请点击上方"使用自定义模板"按钮。
                    </Paragraph>
                  </div>
                )}
              </Card>

              <div className="action-area">
                <Space size="large">
                  <Button
                    type="primary"
                    size="large"
                    onClick={handleResolve}
                    loading={loading}
                    disabled={!mdContent.trim()}
                  >
                    开始解析
                  </Button>
                  <Button
                    size="large"
                    onClick={handleClear}
                    disabled={loading}
                  >
                    清空全部
                  </Button>
                </Space>
              </div>
            </Col>

            {/* 右侧：结果区域 */}
            <Col span={12}>
              <Card
                className="result-card"
                title="解析结果"
                bordered={false}
                extra={
                  resolveResult?.success && resolveResult?.data && (
                    <Space>
                      <Button
                        type="text"
                        size="small"
                        icon={<IconCopy />}
                        onClick={handleCopyResult}
                      >
                        复制
                      </Button>
                      <Button
                        type="text"
                        size="small"
                        icon={<IconDownload />}
                        onClick={handleDownloadResult}
                      >
                        下载
                      </Button>
                    </Space>
                  )
                }
              >
                <div className="result-content">
                  {loading && (
                    <div className="loading-state">
                      <Spin size={40} />
                      <div className="loading-text">正在解析 Markdown 内容...</div>
                    </div>
                  )}

                  {!loading && !resolveResult && (
                    <div className="empty-state">
                      <IconFile style={{ fontSize: 64, color: 'var(--color-text-4)' }} />
                      <div className="empty-text">输入 Markdown 内容并开始解析</div>
                      <div className="empty-hint">
                        支持按模板提取结构化数据
                      </div>
                    </div>
                  )}

                  {!loading && resolveResult && !resolveResult.success && (
                    <div className="error-state">
                      <div className="error-message">{resolveResult.message}</div>
                    </div>
                  )}

                  {!loading && resolveResult?.success && resolveResult.data && (
                    <div className="success-state">
                      <Tabs defaultActiveTab="formatted" type="rounded">
                        <TabPane key="formatted" title="格式化视图">
                          <div className="formatted-result">
                            {Object.entries(resolveResult.data).map(([blockKey, items]) => (
                              <div key={blockKey} className="block-section">
                                <div className="block-header">
                                  <Title heading={6}>{blockKey}</Title>
                                  <span className="item-count">{items.length} 项</span>
                                </div>
                                {items.map((item, index) => (
                                  <Card
                                    key={index}
                                    className="item-card"
                                    size="small"
                                    bordered
                                  >
                                    {Object.entries(item).map(([key, value]) => (
                                      <div key={key} className="field-row">
                                        <span className="field-key">{key}:</span>
                                        <span className="field-value">{String(value)}</span>
                                      </div>
                                    ))}
                                  </Card>
                                ))}
                              </div>
                            ))}
                          </div>
                        </TabPane>
                        <TabPane key="json" title="JSON 视图">
                          <pre className="json-result">
                            {JSON.stringify(resolveResult.data, null, 2)}
                          </pre>
                        </TabPane>
                      </Tabs>
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>
    </div>
  );
};

export default MdResolvePage;
