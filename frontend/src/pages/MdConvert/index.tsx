import React, { useState } from 'react';
import {
  Button,
  Card,
  Grid,
  Input,
  Layout,
  Message,
  Space,
  Spin,
  Tabs,
  Typography,
  Upload,
} from '@arco-design/web-react';
import {
  IconCopy,
  IconDelete,
  IconDownload,
  IconFile,
  IconRefresh,
  IconUpload,
} from '@arco-design/web-react/icon';
import {
  convertDocumentToMarkdown,
  convertMarkdownToHtml,
  convertMarkdownToPdf,
  convertMarkdownToWord,
  DocumentToMarkdownResponse,
} from '@/services/mdConvertService';
import './index.less';

const { Content } = Layout;
const { Row, Col } = Grid;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Text } = Typography;

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const FILE_ACCEPT =
  '.doc,.docx,.pdf,.xls,.xlsx,.html,.htm,.txt,.md';

type UploadRequestOption = {
  file: File;
  onSuccess?: (response?: unknown) => void;
  onError?: (error: Error) => void;
};

const stripExtension = (fileName: string) => fileName.replace(/\.[^.]+$/, '') || 'markdown-document';

const downloadTextFile = (content: string, fileName: string, contentType: string) => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const MdConvertPage: React.FC = () => {
  const [activeTool, setActiveTool] = useState<string>('markdown-export');
  const [mdContent, setMdContent] = useState<string>('');
  const [htmlResult, setHtmlResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [wordFileName, setWordFileName] = useState<string>('markdown-document');
  const [pdfFileName, setPdfFileName] = useState<string>('markdown-document');

  const [fileConverting, setFileConverting] = useState(false);
  const [sourceFileName, setSourceFileName] = useState<string>('');
  const [sourceMediaType, setSourceMediaType] = useState<string>('');
  const [fileMarkdownResult, setFileMarkdownResult] = useState<string>('');
  const [fileWarnings, setFileWarnings] = useState<string[]>([]);

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
`;
    setMdContent(sample);
    setHtmlResult('');
    Message.success('已加载示例内容');
  };

  const handleClearMarkdown = () => {
    setMdContent('');
    setHtmlResult('');
  };

  const handleCopyHtmlResult = () => {
    if (!htmlResult) {
      return;
    }
    navigator.clipboard.writeText(htmlResult).then(() => {
      Message.success('HTML 代码已复制到剪贴板');
    }).catch(() => {
      Message.error('复制失败');
    });
  };

  const handleDownloadHtml = () => {
    if (!htmlResult) {
      Message.warning('请先转换为 HTML');
      return;
    }
    downloadTextFile(htmlResult, `${wordFileName || 'markdown-document'}.html`, 'text/html; charset=utf-8');
    Message.success('HTML 文件已下载');
  };

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
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
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

  const resetFileConvertResult = () => {
    setSourceFileName('');
    setSourceMediaType('');
    setFileWarnings([]);
    setFileMarkdownResult('');
  };

  const applyDocumentConvertResult = (response: DocumentToMarkdownResponse, fallbackFileName: string) => {
    const resolvedFileName = response.fileName || fallbackFileName;
    const defaultExportName = stripExtension(resolvedFileName);

    setSourceFileName(resolvedFileName);
    setSourceMediaType(response.mediaType || '');
    setFileWarnings(response.warnings || []);
    setFileMarkdownResult(response.markdown || '');
    setWordFileName(defaultExportName);
    setPdfFileName(defaultExportName);
  };

  const handleCustomDocumentUpload = async (option: UploadRequestOption) => {
    const file = option.file;

    if (!file) {
      option.onError?.(new Error('文件不能为空'));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      const error = new Error('文件大小超过 100MB 限制');
      Message.error(error.message);
      option.onError?.(error);
      return;
    }

    setFileConverting(true);
    resetFileConvertResult();

    try {
      const response = await convertDocumentToMarkdown(file);
      applyDocumentConvertResult(response, file.name);
      Message.success('文件已转换为 Markdown');
      option.onSuccess?.(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '文件转换失败';
      Message.error(errorMessage);
      option.onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setFileConverting(false);
    }
  };

  const handleCopyMarkdownResult = () => {
    if (!fileMarkdownResult) {
      return;
    }
    navigator.clipboard.writeText(fileMarkdownResult).then(() => {
      Message.success('Markdown 已复制到剪贴板');
    }).catch(() => {
      Message.error('复制失败');
    });
  };

  const handleDownloadMarkdownResult = () => {
    if (!fileMarkdownResult) {
      Message.warning('暂无可下载的 Markdown 内容');
      return;
    }
    const baseName = stripExtension(sourceFileName || 'converted-markdown');
    downloadTextFile(fileMarkdownResult, `${baseName}.md`, 'text/markdown; charset=utf-8');
    Message.success('Markdown 文件已下载');
  };

  const handleLoadIntoEditor = () => {
    if (!fileMarkdownResult) {
      Message.warning('暂无可载入的 Markdown 内容');
      return;
    }
    setMdContent(fileMarkdownResult);
    setHtmlResult('');
    setActiveTool('markdown-export');
    Message.success('已载入 Markdown 编辑区');
  };

  const renderMarkdownExportLayout = () => (
    <Layout className="md-convert-layout">
      <Content>
        <Row gutter={20} style={{ height: '100%' }}>
          <Col span={12}>
            <Card
              className="input-card"
              title="Markdown 内容"
              bordered={false}
              extra={(
                <Space>
                  <Button type="text" size="small" onClick={loadSampleMd}>
                    加载示例
                  </Button>
                  <Button
                    type="text"
                    size="small"
                    status="danger"
                    icon={<IconDelete />}
                    onClick={handleClearMarkdown}
                    disabled={!mdContent}
                  >
                    清空
                  </Button>
                </Space>
              )}
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

            <Card className="config-card" title="转换配置" bordered={false}>
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

                <div className="config-divider" />

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
                    onClick={handleClearMarkdown}
                    disabled={loading || converting || !mdContent}
                    style={{ width: '100%' }}
                  >
                    清空全部
                  </Button>
                </Space>
              </div>
            </div>
          </Col>

          <Col span={12}>
            <Card
              className="result-card"
              title="HTML 预览"
              bordered={false}
              extra={htmlResult ? (
                <Space>
                  <Button type="text" size="small" icon={<IconCopy />} onClick={handleCopyHtmlResult}>
                    复制代码
                  </Button>
                  <Button type="text" size="small" icon={<IconDownload />} onClick={handleDownloadHtml}>
                    下载
                  </Button>
                </Space>
              ) : null}
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
                    <div className="empty-text">点击“转换为 HTML”查看预览</div>
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

            <Card className="guide-card" title="快速指南" bordered={false}>
              <div className="guide-content">
                <div className="guide-item">
                  <Text strong>支持的格式：</Text>
                  <div className="guide-text">Word (.docx)、PDF、HTML</div>
                </div>
                <div className="guide-item">
                  <Text strong>文件大小：</Text>
                  <div className="guide-text">建议 10MB 以内</div>
                </div>
                <div className="guide-item">
                  <Text strong>联动方式：</Text>
                  <div className="guide-text">可先在“文件转 Markdown”上传，再回到本页导出为 Word/PDF</div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );

  const renderFileToMarkdownLayout = () => (
    <Layout className="md-convert-layout">
      <Content>
        <Row gutter={20} style={{ height: '100%' }}>
          <Col span={10}>
            <Card
              className="upload-card"
              title="上传文件"
              bordered={false}
              extra={sourceFileName ? (
                <Space>
                  <Upload
                    showUploadList={false}
                    customRequest={handleCustomDocumentUpload}
                    accept={FILE_ACCEPT}
                  >
                    <Button type="text" size="small" icon={<IconRefresh />}>
                      重新上传
                    </Button>
                  </Upload>
                  <Button
                    type="text"
                    size="small"
                    status="danger"
                    icon={<IconDelete />}
                    onClick={resetFileConvertResult}
                    disabled={fileConverting}
                  >
                    清空结果
                  </Button>
                </Space>
              ) : null}
            >
              <div className="upload-content">
                {!sourceFileName && !fileConverting && (
                  <Upload
                    drag
                    limit={1}
                    showUploadList={false}
                    tip="拖拽文件到此区域，或点击上传"
                    customRequest={handleCustomDocumentUpload}
                    accept={FILE_ACCEPT}
                  />
                )}

                {fileConverting && (
                  <div className="loading-state">
                    <Spin size={40} />
                    <div className="loading-text">正在解析并转换为 Markdown...</div>
                  </div>
                )}

                {!fileConverting && sourceFileName && (
                  <div className="upload-summary">
                    <div className="summary-file-name">{sourceFileName}</div>
                    <div className="summary-meta">MIME: {sourceMediaType || 'unknown'}</div>
                    <div className="summary-meta">字符数: {fileMarkdownResult.length}</div>
                    <Button
                      type="primary"
                      icon={<IconUpload />}
                      onClick={handleLoadIntoEditor}
                      disabled={!fileMarkdownResult}
                    >
                      载入 Markdown 编辑区
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            <Card className="file-guide-card" title="格式说明" bordered={false}>
              <div className="guide-content">
                <div className="guide-item">
                  <Text strong>首版支持：</Text>
                  <div className="guide-text">`.doc`、`.docx`、`.pdf`、`.xls`、`.xlsx`、`.html`、`.txt`、`.md`</div>
                </div>
                <div className="guide-item">
                  <Text strong>结构化效果较好：</Text>
                  <div className="guide-text">`.docx`、`.xlsx`、`.html`</div>
                </div>
                <div className="guide-item">
                  <Text strong>可能降级为纯文本：</Text>
                  <div className="guide-text">`.doc`、复杂 PDF、扫描件 PDF</div>
                </div>
                <div className="guide-item">
                  <Text strong>大小限制：</Text>
                  <div className="guide-text">单文件不超过 100MB</div>
                </div>
              </div>
            </Card>
          </Col>

          <Col span={14}>
            <Card
              className="file-result-card"
              title="Markdown 结果"
              bordered={false}
              extra={fileMarkdownResult ? (
                <Space>
                  <Button type="text" size="small" icon={<IconCopy />} onClick={handleCopyMarkdownResult}>
                    复制
                  </Button>
                  <Button type="text" size="small" icon={<IconDownload />} onClick={handleDownloadMarkdownResult}>
                    下载 .md
                  </Button>
                </Space>
              ) : null}
            >
              <div className="result-content">
                {!fileConverting && !fileMarkdownResult && (
                  <div className="empty-state">
                    <IconFile style={{ fontSize: 64, color: 'var(--color-text-4)' }} />
                    <div className="empty-text">上传文件后会在这里输出 Markdown</div>
                    <div className="empty-hint">
                      支持复制结果、下载 `.md`、或继续转 Word / PDF
                    </div>
                  </div>
                )}

                {!fileConverting && Boolean(fileWarnings.length) && (
                  <div className="warning-list">
                    {fileWarnings.map((warning, index) => (
                      <div key={`${warning}-${index}`} className="warning-item">
                        {warning}
                      </div>
                    ))}
                  </div>
                )}

                {!fileConverting && fileMarkdownResult && (
                  <>
                    <div className="result-stats">
                      <span>来源文件：{sourceFileName}</span>
                      <span>字符数：{fileMarkdownResult.length}</span>
                    </div>
                    <pre className="markdown-result">{fileMarkdownResult}</pre>
                  </>
                )}
              </div>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );

  return (
    <div className="md-convert-container">
      <Tabs
        className="tool-tabs"
        activeTab={activeTool}
        onChange={setActiveTool}
        type="rounded"
      >
        <TabPane key="markdown-export" title="Markdown 转其他格式">
          {renderMarkdownExportLayout()}
        </TabPane>
        <TabPane key="file-to-markdown" title="文件转 Markdown">
          {renderFileToMarkdownLayout()}
        </TabPane>
      </Tabs>
    </div>
  );
};

export default MdConvertPage;
