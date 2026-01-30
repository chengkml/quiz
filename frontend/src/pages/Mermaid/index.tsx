import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import CodeMirror from "@uiw/react-codemirror";
import {
  Button,
  Grid,
  Input,
  Layout,
  Message,
  Select,
  Spin,
  Modal,
  Avatar,
  Card,
  Typography,
  Empty
} from "@arco-design/web-react";
import { 
  IconFullscreen, 
  IconSend, 
  IconShrink, 
  IconRobot, 
  IconUser 
} from "@arco-design/web-react/icon";
import mermaid from "mermaid";
import "./index.less";

const { Row, Col } = Grid;
const { Content } = Layout;

// Default examples
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
    USER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_DETAIL : contains
    ORDER_DETAIL }o--|| PRODUCT : references
    
    USER {
        string id PK
        string name "姓名"
        string email "邮箱"
    }
    ORDER {
        string orderNo PK "订单号"
        date createTime "创建时间"
        string userId FK
    }
    PRODUCT {
        string productCode PK "商品编号"
        string productName "商品名称"
        float price "价格"
    }
    ORDER_DETAIL {
        string id PK
        string orderId FK
        string productId FK
        int quantity "数量"
    }`,
};

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface MermaidEditorProps {
  initialCode?: string | null;
}

const MermaidEditor: React.FC<MermaidEditorProps> = ({
  initialCode = null,
}) => {
  const [code, setCode] = useState<string>(
    initialCode ?? defaultExamples.flowchart
  );
  const [chartType, setChartType] = useState<string>("flowchart");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [diagramId, setDiagramId] = useState<string>("");
  const navigate = useNavigate();

  // Extract Diagram ID
  useEffect(() => {
    try {
      const path = window.location.pathname || '';
      const parts = path.split('/').filter(Boolean);
      const id = parts.length ? parts[parts.length - 1] : '';
      if (id) setDiagramId(id);
    } catch (e) {
      // ignore
    }
  }, []);

  const [error, setError] = useState<string | null>(null);
  const [editorHeight, setEditorHeight] = useState(200); // Smaller initial height to make room for chat
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialCode !== undefined && initialCode !== null) {
      setCode(initialCode);
    }
  }, [initialCode]);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
      fontFamily: "Arial, sans-serif",
    });
  }, []);

  useEffect(() => {
    const renderChart = async () => {
      if (!previewRef.current || !code.trim()) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        previewRef.current.innerHTML = "";
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, code);
        previewRef.current.innerHTML = svg;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "图表渲染失败";
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

  useEffect(() => {
    const calculateHeight = () => {
      const windowHeight = window.innerHeight;
      // Adjust editor height dynamically or keep it fixed percentage
      // Here we set a max height for editor to allow chat to be visible
      // Let's make editor 40% of view height, chat the rest
      const newHeight = Math.max(200, windowHeight * 0.4); 
      setEditorHeight(newHeight);
    };
    calculateHeight();
    const handleResize = () => calculateHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleChartTypeChange = (value: string) => {
    setChartType(value);
    const newCode = defaultExamples[value as keyof typeof defaultExamples] || "";
    setCode(newCode);
    // Optionally clear chat or add a system message indicating reset? 
    // For now, just reset code.
  };

  const handleToggleFullscreen = () => {
    const container = previewContainerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
        container.requestFullscreen?.() || Message.warning("当前浏览器不支持全屏");
    } else {
      document.exitFullscreen?.();
    }
  };

  const handleSave = () => {
    if (!diagramId || !diagramId.trim()) {
      Message.warning("缺少图表 ID，无法保存。请输入图表 ID 后重试。");
      return;
    }
    const payload = { diagramData: code };
    setLoading(true);
    fetch(`/api/mermaids/diagrams/${encodeURIComponent(diagramId)}/data`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text() || `保存失败: ${res.status}`);
        return res.json();
      })
      .then(() => Message.success('已保存'))
      .catch((err) => Message.error(err?.message || '保存失败'))
      .finally(() => setLoading(false));
  };

  const handleCancel = () => {
    navigate('/frame/mermaid-mgr');
  };

  const handleSendMessage = async () => {
    if (!inputPrompt.trim() || isGenerating) return;

    const newUserMsg: ChatMessage = { role: 'user', content: inputPrompt };
    const newMessages = [...messages, newUserMsg];
    setMessages(newMessages);
    setInputPrompt("");
    setIsGenerating(true);

    try {
        const response = await fetch('/api/mermaids/diagrams/chat/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: newMessages,
                diagramData: code, // Send current code as context
                modelName: null
            })
        });

        if (!response.ok) throw new Error(response.statusText);
        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantMsgContent = "";
        
        // Add placeholder assistant message
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            assistantMsgContent += chunk;
            
            // Filter out [ERROR] or other markers if necessary, but backend sends mostly code
            // If backend sends [ERROR], handle it
            if (assistantMsgContent.includes("[ERROR]")) {
                 Message.error(assistantMsgContent.replace("[ERROR]", ""));
                 break;
            }

            // Update the last message (assistant)
            setMessages(prev => {
                const newHistory = [...prev];
                if (newHistory.length > 0) {
                    newHistory[newHistory.length - 1] = { 
                        role: 'assistant', 
                        content: assistantMsgContent 
                    };
                }
                return newHistory;
            });

            // Update code editor in real-time if it looks like code?
            // Or just wait for completion? 
            // The prompt asks for ONLY code. So we can try to update code directly.
            // But let's verify if it's pure code.
            setCode(assistantMsgContent);
        }
    } catch (err) {
        Message.error("发送失败: " + err);
        setMessages(prev => [...prev, { role: 'assistant', content: "Error generating response." }]);
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="mermaid-editor-container">
      <Layout>
        <Content>
          <Row style={{ height: "100%" }}>
            {/* LEFT COLUMN: Editor + Chat */}
            <Col span={10} style={{ padding: "20px", height: "100%", display: "flex", flexDirection: "column" }}>
              {/* Toolbar */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                 <Select
                    value={chartType}
                    onChange={handleChartTypeChange}
                    options={[
                      { label: "流程图 (Flowchart)", value: "flowchart" },
                      { label: "时序图 (Sequence)", value: "sequence" },
                      { label: "类图 (Class)", value: "class" },
                      { label: "状态图 (State)", value: "state" },
                      { label: "甘特图 (Gantt)", value: "gantt" },
                      { label: "饼图 (Pie)", value: "pie" },
                      { label: "ER图 (ER)", value: "er" },
                    ]}
                    style={{ width: 180 }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button size="small" onClick={handleCancel}>返回</Button>
                    <Button size="small" type="primary" onClick={handleSave}>保存</Button>
                  </div>
              </div>

              {/* Code Editor */}
              <div style={{ height: editorHeight, marginBottom: 16, border: '1px solid var(--color-border-2)', borderRadius: 4 }}>
                <CodeMirror
                  className="mermaid-code-editor"
                  value={code}
                  height="100%"
                  onChange={(value) => setCode(value)}
                  style={{ height: '100%' }}
                />
              </div>

              {/* Chat Interface */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, border: '1px solid var(--color-border-2)', borderRadius: 4, background: 'var(--color-bg-2)' }}>
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border-1)', background: 'var(--color-fill-2)', fontWeight: 500 }}>
                      AI 助手
                  </div>
                  
                  {/* Message List */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
                      {messages.length === 0 ? (
                          <div style={{ textAlign: 'center', color: 'var(--color-text-3)', marginTop: 20 }}>
                              <Typography.Text>输入需求，AI 将为您生成或修改 Mermaid 代码</Typography.Text>
                          </div>
                      ) : (
                          messages.map((msg, idx) => (
                              <div key={idx} style={{ 
                                  display: 'flex', 
                                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                  marginBottom: 12
                              }}>
                                  {msg.role === 'assistant' && (
                                      <Avatar size={28} style={{ backgroundColor: '#165DFF', marginRight: 8 }}>
                                          <IconRobot />
                                      </Avatar>
                                  )}
                                  <div style={{
                                      maxWidth: '85%',
                                      padding: '8px 12px',
                                      borderRadius: 8,
                                      backgroundColor: msg.role === 'user' ? '#E8F3FF' : '#F2F3F5',
                                      color: 'var(--color-text-1)',
                                      fontSize: 13,
                                      whiteSpace: 'pre-wrap',
                                      wordBreak: 'break-all'
                                  }}>
                                      {msg.role === 'user' ? msg.content : (msg.content || 'Generating...')}
                                  </div>
                                  {msg.role === 'user' && (
                                      <Avatar size={28} style={{ backgroundColor: '#FF7D00', marginLeft: 8 }}>
                                          <IconUser />
                                      </Avatar>
                                  )}
                              </div>
                          ))
                      )}
                      <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div style={{ padding: 12, borderTop: '1px solid var(--color-border-1)', background: 'var(--color-bg-1)' }}>
                      <Input.TextArea 
                          value={inputPrompt}
                          onChange={setInputPrompt}
                          placeholder="例如：把流程图方向改为从左到右..."
                          autoSize={{ minRows: 2, maxRows: 4 }}
                          onPressEnter={(e) => {
                              if (!e.shiftKey) {
                                  e.preventDefault();
                                  handleSendMessage();
                              }
                          }}
                          disabled={isGenerating}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                          <Button 
                              type="primary" 
                              size="small" 
                              icon={<IconSend />} 
                              loading={isGenerating}
                              onClick={handleSendMessage}
                          >
                              发送
                          </Button>
                      </div>
                  </div>
              </div>
            </Col>

            {/* RIGHT COLUMN: Preview */}
            <Col span={14} style={{ padding: "20px", height: "100%", borderLeft: "1px solid var(--color-neutral-3)", display: "flex", flexDirection: "column" }}>
               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: "500", margin: 0 }}>预览</label>
                <Button size="small" type="outline" icon={isFullscreen ? <IconShrink /> : <IconFullscreen />} onClick={handleToggleFullscreen}>
                    {isFullscreen ? "退出全屏" : "全屏"}
                </Button>
              </div>
              <div 
                  ref={previewContainerRef}
                  className={`mermaid-preview-wrapper ${isFullscreen ? "fullscreen" : ""}`}
                  style={{ height: isFullscreen ? "100vh" : "100%", flex: 1 }}
              >
                <Spin loading={loading} style={{ display: "block", height: "100%" }}>
                  <div 
                      ref={previewRef} 
                      className="mermaid-preview" 
                      style={{ minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
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
