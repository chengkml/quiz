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
    const sample = `### 错别字
- 原文：“非结构话数据采集”  
  修改建议：“非结构化数据采集”  
  修改原因：非结构话为错别字问题，正确词语应为非结构化，指的是数据结构不统一的一类非结构化数据。

- 原文：“长文本处理”  
  修改建议：“长文档处理”  
  修改原因：长文本可能引起歧义，建议使用长文档，更贴合企业语料管理的正式表述。

- 原文：“马伊利斯”  
  修改建议：“Milvus”  
  修改原因：马伊利斯为音译错别字，Milvus 是知名向量数据库名称，应使用标准英文表达，并考虑在首次出现时进行释义说明。

---
### 专业术语规范
- 原文：“向量数据库 faiss、maives”  
  修改建议：“向量数据库（如 Faiss、Milvus）”  
  修改原因：术语不规范。Milvus 应保持原英文名，并建议补充 faiss 与 milvus 均为知名向量数据库并在括号中首次出现时说明，提高可读性和专业性。

- 原文：“向量转化”  
  修改建议：“向量化转换”  
  修改原因：表达略显不规范。在技术语境中，更推荐 “向量化转换” 以体现对非结构化文本的特征提取及数值化操作。

- 原文：“Embedding模型管理”  
  修改建议：“模型管理（以 Embedding 为主）”  
  修改原因：首次出现缩写词应提供完整解释。Embedding 是一种嵌入方式，但语境中用于模型名称应以“嵌入模型管理”表述更准确。

- 原文：“文档摘要”  
  修改建议：“文档内容摘要生成”  
  修改原因：表达不够完整。建议使用 “文档内容摘要生成” 更明确目标功能和流程。

---
### 语法
- 原文：“构建5个数据集，文本图片类数据达10TB”  
  修改建议：“计划构建5个专用数据集，其中文本与图片类数据总量预计达到10TB”  
  修改原因：语法结构不完整，文本图片类数据缺少连接词，且总数表达不清。修改后逻辑完整，且描述更加清晰。

- 原文：“支持向量数据存储在 faiss、maives 等向量数据库”  
  修改建议：“支持将向量数据存储于 Faiss、Milvus 等向量数据库中”  
  修改原因：动词“存储”缺少“将”字作引导词，介词“在”也应调整为“存储于”，语法结构清晰。

- 原文：“主要包括数据导入、格式转化、知识库及问答库、模型管理及配置、知识图谱5类需求”  
  修改建议：“主要涵盖数据导入、格式转换、知识库及问答库、模型管理与配置、知识图谱等五类需求”  
  修改原因：语法结构不明，使用 “涵盖” 更符合需求分析的表述逻辑；“转化”改为“转换”更规范；“5类需求”需前置动词，使句子通顺。

---
### 语义优化
- 原文：“从数据集创建、存储、共享到销毁的全生命周期管理能力”  
  修改建议：“提供涵盖数据集的创建、存储、共享直到销毁全过程的全生命周期管理能力”  
  修改原因：语义表达模糊，缺少时间逻辑顺序。优化后强调 “全过程” 和 “直到销毁”，使语义更清晰具体。

- 原文：“构建对大模型语料的错误剔除、内容去重、格式转化、信息脱敏、质量判断、数据标注等处理能力”  
  修改建议：“构建针对大模型训练语料的处理能力，包括错误数据剔除、内容去重、格式转换、敏感信息脱敏、质量评估与数据标注等功能”  
  修改原因：原文语义不连贯，缺乏统一逻辑主体。修改后明确是针对大模型语料的处理，列举功能更清晰。

- 原文：“主要包括问答库、知识库分库管理”  
  修改建议：“主要包括问答库的配置与管理、以及知识库的分库设置和内容治理”  
  修改原因：表达模糊。原句未说明管理的具体内容，优化后加入细节动词，提升语义清晰度。

---
### 逻辑严谨性
- 原文：“依据调研需求，建设方案主要基于亚信语料数据供给平台产品，在亚信产品的基础上，不满足需求的功能提需求做定制化开发，也可以同步将ChatOA、智乎上开发的功能进行移植。”  
  修改建议：“根据调研需求情况，项目建设将基于亚信语料数据供给平台产品开展。对于该平台尚未满足的需求功能，需提出定制化开发需求；同时，可考虑将ChatOA和知乎已有功能模块迁移至本平台进行复用。”  
  修改原因：逻辑跳跃严重。原文缺少对ChatOA和知乎功能来源的解释，逻辑链条不完整。修改后分层次描述开发方式与功能复用，结构合理。

- 原文：“其中包括管信比较关注业务数据前端导入、markdown格式转化工具、知识库管理、向量检索等几类与业务交互功能；数管部在此基础上，也需要向量转化、向量存储、模型管理等支撑功能。”  
  修改建议：“其中包括，管信部门较为关注的前端导入业务数据、Markdown格式转化工具、知识库管理以及向量检索等与业务紧密交互的功能模块；数管部则在此基础上，还需具备向量转化、向量存储与模型管理等支撑技术能力。”  
  修改原因：推理断裂且部门与需求之间的逻辑关系不明确。优化后明确需求层次关系，强化因需应建的逻辑链。

---
### 表述流畅性
- 原文：“构建对大模型语料的错误剔除、内容去重、格式转化、信息脱敏、质量判断、数据标注等处理能力”  
  修改建议：“构建大模型语料数据的处理能力，涵盖错误剔除、内容去重、格式转换、信息脱敏、质量评估和数据标注等功能”  
  修改原因：句式啰嗦，重复使用“处理能力”，内容列举杂乱，修改后逻辑清晰且用词简洁。

- 原文：“区分已具备能力、待建能力。”  
  修改建议：“需要对已具备的能力与待建设项进行明确区分。”  
  修改原因：表述生硬不够自然。增加“明显”一词，并将段落过渡更自然，使整体读起来更专业流畅。

- 原文：“数据处理算子主要包括清洗、转换、增强和安全等几类操作。”（未显式出现，但存在相似表达）  
  修改建议：“数据处理算子主要包含四大类操作：数据清洗、数据转换、特征增强和安全处理”  
  修改原因：句式可优化，避免使用“包括”后的平铺列出，改用“包含”+分类方式，使结构更流畅并突出内容分类。假设原文类似描述需同步优化。

---`;
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
                      style={{ height: '100%' }}
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
