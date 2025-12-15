import React, { useState } from 'react';
import {
  Button,
  Card,
  Grid,
  Layout,
  Message,
  Spin,
  Input,
  Tabs,
  Typography,
  Space,
  Select,
  Divider,
} from '@arco-design/web-react';
import {
  IconCopy,
  IconDelete,
  IconFile,
  IconDownload,
  IconUpload,
} from '@arco-design/web-react/icon';
import { 
  convertMarkdownToWord, 
  convertMarkdownToPdf,
  convertMarkdownToHtml,
} from '@/services/mdConvertService';
import './index.less';

const { Content } = Layout;
const { Row, Col } = Grid;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Title, Paragraph, Text } = Typography;

interface ConvertResult {
  success: boolean;
  message: string;
  data?: string;
  mimeType?: string;
}

const MdConvertPage: React.FC = () => {
  const [mdContent, setMdContent] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<'word' | 'pdf' | 'html'>('word');
  const [htmlResult, setHtmlResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [wordFileName, setWordFileName] = useState<string>('markdown-document');
  const [pdfFileName, setPdfFileName] = useState<string>('markdown-document');

  // 加载示例Markdown
  const loadSampleMd = () => {
    const sample = `# Markdown 转换工具使用指南

## 功能概述

本工具支持将 Markdown 格式的文档转换为以下格式：

- **Word (DOCX)**：保留格式和样式的 Office 文档
- **PDF**：便于分享和打印的便携式文档
- **HTML**：可在网页中直接使用的超文本标记语言

## 特性说明

### 支持的 Markdown 语法

\`\`\`markdown
# 标题 1
## 标题 2
### 标题 3

**粗体文本** 和 *斜体文本*

- 无序列表项 1
- 无序列表项 2
  - 嵌套项目

1. 有序列表项 1
2. 有序列表项 2

[超链接文本](https://example.com)

![图片描述](image.jpg)

> 引用文本
> 可以多行

\`\`\`

### 代码块

\`\`\`javascript
function hello() {
  console.log('Hello, World!');
}
\`\`\`

### 表格

| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 数据 | 数据 | 数据 |
| 数据 | 数据 | 数据 |

## 使用步骤

1. 在左侧输入框中粘贴或输入 Markdown 内容
2. 选择要转换的目标格式
3. 点击相应的转换按钮
4. 文件将自动下载到本地

## 文件名设置

可以在转换前自定义导出的文件名（不需要输入扩展名，系统会自动添加）。

## 注意事项

- 确保输入的 Markdown 格式正确
- 某些高级 Markdown 语法可能在转换过程中简化
- PDF 转换时建议使用标准页面大小（A4）
- 转换大文件时可能需要较长时间

`;
    setMdContent(sample);
    Message.success('已加载示例内容');
  };

  // 清空内容
  const handleClear = () => {
    setMdContent('');
    setHtmlResult('');
  };

  // 复制HTML结果
  const handleCopyHtmlResult = () => {
    if (htmlResult) {
      navigator.clipboard.writeText(htmlResult).then(() => {
        Message.success('HTML 代码已复制到剪贴板');
      }).catch(() => {
        Message.error('复制失败');
      });
    }
  };

  // 下载HTML文件
  const handleDownloadHtml = () => {
    if (!htmlResult) {
      Message.warning('请先转换为 HTML');
      return;
    }
    const blob = new Blob([htmlResult], { type: 'text/html; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${wordFileName}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    Message.success('HTML 文件已下载');
  };

  // 转换为HTML（预览）
  const handleConvertToHtml = async () => {
    if (!mdContent.trim()) {
      Message.warning('请输入 Markdown 内容');
      return;
    }

    setLoading(true);
    setHtmlResult('');

    try {
      const response = await convertMarkdownToHtml({ mdContent });
      if (response.success && response.data) {
        setHtmlResult(response.data);
        Message.success('HTML 转换成功');
      } else {
        Message.error(response.message || 'HTML 转换失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '转换失败';
      Message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 转换为Word
  const handleConvertToWord = async () => {
    if (!mdContent.trim()) {
      Message.warning('请输入 Markdown 内容');
      return;
    }

    setConverting(true);
    try {
      const arrayBuffer = await convertMarkdownToWord({
        mdContent,
        fileName: wordFileName || 'markdown-document',
      });
      
      const blob = new Blob([arrayBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${wordFileName || 'markdown-document'}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      Message.success('Word 文件已下载');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '转换失败';
      Message.error(errorMessage);
    } finally {
      setConverting(false);
    }
  };

  // 转换为PDF
  const handleConvertToPdf = async () => {
    if (!mdContent.trim()) {
      Message.warning('请输入 Markdown 内容');
      return;
    }

    setConverting(true);
    try {
      const arrayBuffer = await convertMarkdownToPdf({
        mdContent,
        fileName: pdfFileName || 'markdown-document',
      });
      
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${pdfFileName || 'markdown-document'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      Message.success('PDF 文件已下载');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '转换失败';
      Message.error(errorMessage);
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="md-convert-container">
      <Layout className="md-convert-layout">
        <Content>
          <Row gutter={20} style={{ height: '100%' }}>
            {/* 左侧：输入和配置区域 */}
            <Col span={12}>
              {/* Markdown 输入卡片 */}
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
                    placeholder="请输入或粘贴 Markdown 内容..."
                    value={mdContent}
                    onChange={setMdContent}
                    style={{ height: '100%' }}
                    className="md-textarea"
                  />
                </div>
              </Card>

              {/* 文件配置卡片 */}
              <Card
                className="config-card"
                title="转换配置"
                bordered={false}
              >
                <div className="config-content">
                  <div className="config-item">
                    <label className="config-label">Word 文件名：</label>
                    <Input
                      placeholder="输入文件名（不含扩展名）"
                      value={wordFileName}
                      onChange={setWordFileName}
                      style={{ flex: 1 }}
                    />
                    <span className="file-ext">.docx</span>
                  </div>

                  <Divider style={{ margin: '12px 0' }} />

                  <div className="config-item">
                    <label className="config-label">PDF 文件名：</label>
                    <Input
                      placeholder="输入文件名（不含扩展名）"
                      value={pdfFileName}
                      onChange={setPdfFileName}
                      style={{ flex: 1 }}
                    />
                    <span className="file-ext">.pdf</span>
                  </div>
                </div>
              </Card>

              {/* 操作按钮区域 */}
              <div className="action-area">
                <div className="action-group">
                  <div className="group-title">转换为其他格式</div>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button
                      type="primary"
                      size="large"
                      icon={<IconDownload />}
                      onClick={handleConvertToWord}
                      loading={converting}
                      disabled={!mdContent.trim()}
                      style={{ width: '100%' }}
                    >
                      转换为 Word
                    </Button>
                    <Button
                      type="primary"
                      size="large"
                      icon={<IconDownload />}
                      onClick={handleConvertToPdf}
                      loading={converting}
                      disabled={!mdContent.trim()}
                      status="warning"
                      style={{ width: '100%' }}
                    >
                      转换为 PDF
                    </Button>
                    <Button
                      type="secondary"
                      size="large"
                      icon={<IconUpload />}
                      onClick={handleConvertToHtml}
                      loading={loading}
                      disabled={!mdContent.trim()}
                      style={{ width: '100%' }}
                    >
                      转换为 HTML（预览）
                    </Button>
                    <Button
                      size="large"
                      onClick={handleClear}
                      disabled={loading || converting || !mdContent}
                      style={{ width: '100%' }}
                    >
                      清空全部
                    </Button>
                  </Space>
                </div>
              </div>
            </Col>

            {/* 右侧：预览和结果区域 */}
            <Col span={12}>
              <Card
                className="result-card"
                title="HTML 预览"
                bordered={false}
                extra={
                  htmlResult && (
                    <Space>
                      <Button
                        type="text"
                        size="small"
                        icon={<IconCopy />}
                        onClick={handleCopyHtmlResult}
                      >
                        复制代码
                      </Button>
                      <Button
                        type="text"
                        size="small"
                        icon={<IconDownload />}
                        onClick={handleDownloadHtml}
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
                      <div className="loading-text">正在转换为 HTML...</div>
                    </div>
                  )}

                  {!loading && !htmlResult && (
                    <div className="empty-state">
                      <IconFile style={{ fontSize: 64, color: 'var(--color-text-4)' }} />
                      <div className="empty-text">点击"转换为 HTML"查看预览</div>
                      <div className="empty-hint">
                        支持实时预览 Markdown 内容的 HTML 渲染效果
                      </div>
                    </div>
                  )}

                  {!loading && htmlResult && (
                    <div className="html-preview-wrapper">
                      <Tabs defaultActiveTab="preview" type="rounded">
                        <TabPane key="preview" title="预览">
                          <div 
                            className="html-preview"
                            dangerouslySetInnerHTML={{ __html: htmlResult }}
                          />
                        </TabPane>
                        <TabPane key="code" title="HTML 代码">
                          <pre className="html-code">
                            {htmlResult}
                          </pre>
                        </TabPane>
                      </Tabs>
                    </div>
                  )}
                </div>
              </Card>

              {/* 快速指南卡片 */}
              <Card
                className="guide-card"
                title="快速指南"
                bordered={false}
              >
                <div className="guide-content">
                  <div className="guide-item">
                    <Text strong>支持的格式：</Text>
                    <div className="guide-text">
                      Word (.docx)、PDF、HTML
                    </div>
                  </div>
                  <div className="guide-item">
                    <Text strong>文件大小：</Text>
                    <div className="guide-text">
                      建议 10MB 以内
                    </div>
                  </div>
                  <div className="guide-item">
                    <Text strong>兼容性：</Text>
                    <div className="guide-text">
                      支持常见 Markdown 语法和扩展语法
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>
    </div>
  );
};

export default MdConvertPage;
