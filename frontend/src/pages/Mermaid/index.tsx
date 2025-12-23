import React, { useEffect, useState, useRef } from 'react';
import { Button, Grid, Layout, Message, Select, Spin } from '@arco-design/web-react';
import { IconRefresh, IconCopy, IconDownload } from '@arco-design/web-react/icon';
import mermaid from 'mermaid';
import './index.less';

const { Row, Col } = Grid;
const { Content } = Layout;

// 默认示例图表
const defaultExamples = {
  flowchart: `flowchart TD
    A[开始] --> B{判断条件}
    B -->|是| C[执行操作1]
    B -->|否| D[执行操作2]
    C --> E[结束]
    D --> E`,
  
  sequence: `sequenceDiagram
    participant 用户
    participant 系统
    participant 数据库
    
    用户->>系统: 发送请求
    系统->>数据库: 查询数据
    数据库-->>系统: 返回结果
    系统-->>用户: 响应数据`,
  
  class: `classDiagram
    class 动物 {
        +String 名字
        +int 年龄
        +吃()
        +睡()
    }
    class 狗 {
        +吠叫()
    }
    class 猫 {
        +喵叫()
    }
    动物 <|-- 狗
    动物 <|-- 猫`,
  
  state: `stateDiagram-v2
    [*] --> 待审核
    待审核 --> 审核中: 开始审核
    审核中 --> 已通过: 审核通过
    审核中 --> 已拒绝: 审核拒绝
    已通过 --> [*]
    已拒绝 --> [*]`,
  
  gantt: `gantt
    title 项目进度计划
    dateFormat YYYY-MM-DD
    
    section 需求分析
    需求调研       :a1, 2024-01-01, 7d
    需求文档       :a2, after a1, 5d
    
    section 开发阶段
    后端开发       :b1, after a2, 15d
    前端开发       :b2, after a2, 15d
    
    section 测试阶段
    功能测试       :c1, after b1, 5d
    上线部署       :c2, after c1, 2d`,
  
  pie: `pie title 市场份额
    "产品A" : 386
    "产品B" : 280
    "产品C" : 150
    "产品D" : 120
    "其他" : 64`,
  
  er: `erDiagram
    用户 ||--o{ 订单 : 下单
    订单 ||--|{ 订单明细 : 包含
    订单明细 }o--|| 商品 : 关联
    
    用户 {
        string id
        string 姓名
        string 邮箱
    }
    订单 {
        string 订单号
        date 创建时间
    }
    商品 {
        string 商品编号
        string 商品名称
        float 价格
    }`
};

const MermaidEditor: React.FC = () => {
  const [code, setCode] = useState<string>(defaultExamples.flowchart);
  const [chartType, setChartType] = useState<string>('flowchart');
  const [downloadFormat, setDownloadFormat] = useState<string>('svg');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorHeight, setEditorHeight] = useState(420);
  const previewRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 初始化 Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'Arial, sans-serif'
    });
  }, []);

  // 渲染图表
  useEffect(() => {
    const renderChart = async () => {
      if (!previewRef.current || !code.trim()) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // 清空之前的内容
        previewRef.current.innerHTML = '';
        
        // 生成唯一ID
        const id = `mermaid-${Date.now()}`;
        
        // 渲染图表
        const { svg } = await mermaid.render(id, code);
        previewRef.current.innerHTML = svg;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '图表渲染失败';
        setError(errorMessage);
        if (previewRef.current) {
          previewRef.current.innerHTML = `<div class="error-message">${errorMessage}</div>`;
        }
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(renderChart, 500);
    return () => clearTimeout(timer);
  }, [code]);

  // 高度自适应
  useEffect(() => {
    const calculateHeight = () => {
      const windowHeight = window.innerHeight;
      const otherElementsHeight = 220;
      const newHeight = Math.max(200, windowHeight - otherElementsHeight);
      setEditorHeight(newHeight);
    };
    calculateHeight();
    const handleResize = () => calculateHeight();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 切换图表类型
  const handleChartTypeChange = (value: string) => {
    setChartType(value);
    setCode(defaultExamples[value as keyof typeof defaultExamples] || '');
  };

  // 刷新渲染
  const handleRefresh = () => {
    setCode(code + ' '); // 触发重新渲染
    setTimeout(() => setCode(code.trim()), 10);
    Message.success('已刷新图表');
  };

  // 复制代码
  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      Message.success('代码已复制到剪贴板');
    }).catch(() => {
      Message.error('复制失败');
    });
  };

  // 下载图表
  const handleDownload = () => {
    if (!previewRef.current) return;
    
    const svgElement = previewRef.current.querySelector('svg');
    if (!svgElement) {
      Message.error('没有可下载的图表');
      return;
    }

    if (downloadFormat === 'svg') {
      // 下载 SVG
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mermaid-${chartType}-${Date.now()}.svg`;
      link.click();
      URL.revokeObjectURL(url);
      Message.success('SVG 已下载');
    } else {
      // 下载为图片格式 (PNG/JPG)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        Message.error('浏览器不支持 Canvas');
        return;
      }

      const svgData = new XMLSerializer().serializeToString(svgElement);
      // 使用 data URL 而不是 Blob URL 避免跨域问题
      const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      const img = new Image();

      img.onload = () => {
        // 设置画布大小（2倍分辨率以获得更好的质量）
        canvas.width = img.width * 2;
        canvas.height = img.height * 2;
        ctx.scale(2, 2);

        // 如果是 JPG，先填充白色背景
        if (downloadFormat === 'jpg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);

        // 转换为对应格式并下载
        canvas.toBlob((blob) => {
          if (!blob) {
            Message.error('图片生成失败');
            return;
          }
          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `mermaid-${chartType}-${Date.now()}.${downloadFormat}`;
          link.click();
          URL.revokeObjectURL(downloadUrl);
          Message.success(`${downloadFormat.toUpperCase()} 已下载`);
        }, `image/${downloadFormat === 'jpg' ? 'jpeg' : downloadFormat}`, 0.95);
      };

      img.onerror = () => {
        Message.error('图片生成失败');
      };

      img.src = dataUrl;
    }
  };

  // 处理 Tab 键
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newValue);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className="mermaid-editor-container">
      <Layout>
        <Content>
          <Row style={{ height: '100%' }}>
            {/* 左侧编辑器 */}
            <Col span={10} style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', margin: 0 }}>图表类型</label>
              </div>
              <Select
                value={chartType}
                onChange={handleChartTypeChange}
                options={[
                  { label: '流程图 (Flowchart)', value: 'flowchart' },
                  { label: '时序图 (Sequence)', value: 'sequence' },
                  { label: '类图 (Class)', value: 'class' },
                  { label: '状态图 (State)', value: 'state' },
                  { label: '甘特图 (Gantt)', value: 'gantt' },
                  { label: '饼图 (Pie)', value: 'pie' },
                  { label: 'ER图 (Entity Relationship)', value: 'er' }
                ]}
                style={{ marginBottom: '16px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', margin: 0 }}>Mermaid 代码</label>
                <div>
                  <Button size="small" type="outline" icon={<IconCopy />} onClick={handleCopy} style={{ marginRight: '8px' }}>
                    复制代码
                  </Button>
                  <Button size="small" type="outline" icon={<IconRefresh />} onClick={handleRefresh}>
                    刷新
                  </Button>
                </div>
              </div>
              <textarea
                ref={textareaRef}
                className="mermaid-code-editor"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ height: editorHeight, flex: 1 }}
                placeholder="请输入 Mermaid 代码..."
                spellCheck={false}
              />
            </Col>

            {/* 右侧预览 */}
            <Col 
              span={14} 
              style={{ 
                padding: '20px', 
                height: '100%', 
                borderLeft: '1px solid var(--color-neutral-3)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', margin: 0 }}>预览</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Select
                    size="small"
                    value={downloadFormat}
                    onChange={setDownloadFormat}
                    options={[
                      { label: 'SVG', value: 'svg' },
                      { label: 'PNG', value: 'png' },
                      { label: 'JPG', value: 'jpg' }
                    ]}
                    style={{ width: 80 }}
                  />
                  <Button size="small" type="primary" icon={<IconDownload />} onClick={handleDownload}>
                    下载
                  </Button>
                </div>
              </div>
              <div className="mermaid-preview-wrapper" style={{ height: editorHeight, flex: 1 }}>
                <Spin loading={loading} style={{ display: 'block' }}>
                  <div 
                    ref={previewRef} 
                    className="mermaid-preview"
                    style={{ 
                      minHeight: editorHeight,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  />
                </Spin>
              </div>
            </Col>
          </Row>
        </Content>
      </Layout>
    </div>
  );
};

export default MermaidEditor;
