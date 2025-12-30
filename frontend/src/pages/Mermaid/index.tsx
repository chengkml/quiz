import React, { useEffect, useState, useRef } from "react";
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
} from "@arco-design/web-react";
import { IconFullscreen, IconSend, IconShrink } from "@arco-design/web-react/icon";
import mermaid from "mermaid";
import "./index.less";

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
  // 已移除下载功能相关状态
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState<string>(""); // 存储用户的修改要求
  const [isGenerating, setIsGenerating] = useState(false); // AI 生成状态
  const [diagramId, setDiagramId] = useState<string>("");
  const navigate = useNavigate();

  // 从 URL 提取图表 ID（取最后一段路径）
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
  const [editorHeight, setEditorHeight] = useState(420);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // 当传入 initialCode 变化时，更新编辑器内容（仅在有值时覆盖）
  useEffect(() => {
    if (initialCode !== undefined && initialCode !== null) {
      setCode(initialCode);
    }
  }, [initialCode]);

  // 初始化 Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
      fontFamily: "Arial, sans-serif",
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
        previewRef.current.innerHTML = "";

        // 生成唯一ID
        const id = `mermaid-${Date.now()}`;

        // 渲染图表
        const { svg } = await mermaid.render(id, code);
        previewRef.current.innerHTML = svg;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "图表渲染失败";
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
      const otherElementsHeight = 420;
      const newHeight = Math.max(100, windowHeight - otherElementsHeight);
      setEditorHeight(newHeight);
    };
    calculateHeight();
    const handleResize = () => calculateHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // 切换图表类型
  const handleChartTypeChange = (value: string) => {
    setChartType(value);
    setCode(defaultExamples[value as keyof typeof defaultExamples] || "");
  };

  // 刷新渲染
  // 刷新与复制功能已移除

  // 下载功能已移除

  // 切换全屏
  const handleToggleFullscreen = () => {
    const container = previewContainerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else {
        Message.warning("当前浏览器不支持全屏");
      }
    } else {
      document.exitFullscreen?.();
    }
  };

  // 保存与取消
  const handleSave = () => {
    if (!diagramId || !diagramId.trim()) {
      Message.warning("缺少图表 ID，无法保存。请输入图表 ID 后重试。");
      return;
    }

    const payload = { diagramData: code };
    setLoading(true);
    fetch(`/api/mermaids/diagrams/${encodeURIComponent(diagramId)}/data`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        setLoading(false);
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || `保存失败: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        Message.success('已保存');
      })
      .catch((err) => {
        Message.error(err?.message || '保存失败');
        setLoading(false);
      });
  };

  const handleCancel = () => {
    // 使用前端路由导航回 mermaid 管理页（不刷新页面）
    navigate('/frame/mermaid-mgr');
  };

  const handleAiEdit = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      // 这里替换为你真实的 AI 接口调用
      // const newCode = await callYourLLM(code, prompt);
      // setCode(newCode);
      Message.success("图表已根据要求更新");
      setPrompt(""); // 清空输入框
    } catch (err) {
      Message.error("AI 修改失败，请稍后重试");
    } finally {
      setIsGenerating(false);
    }
  };

  // CodeMirror 处理 Tab 与编辑交互，故不再需要手动处理 Tab 键

  return (
    <div className="mermaid-editor-container">
      <Layout>
        <Content>
          <Row style={{ height: "100%" }}>
            {/* 左侧编辑器 */}
            <Col
              span={10}
              style={{
                padding: "20px",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <label
                  style={{ fontSize: "14px", fontWeight: "500", margin: 0 }}
                >
                  图表类型
                </label>
              </div>
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
                  { label: "ER图 (Entity Relationship)", value: "er" },
                ]}
                style={{ marginBottom: "16px" }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <label
                  style={{ fontSize: "14px", fontWeight: "500", margin: 0 }}
                >
                  Mermaid 代码
                </label>
                <div>{/* 复制与刷新按钮已移除 */}</div>
              </div>
              <div style={{ flex: 1, height: editorHeight, marginBottom: "16px" }}>
                <CodeMirror
                  className="mermaid-code-editor"
                  value={code}
                  height={`${editorHeight - 50}px`}
                  onChange={(value) => setCode(value)}
                />
              </div>
              {/* 2. 新增的 AI 输入区 */}
              <div
                className="ai-input-section"
                style={{ marginBottom: "16px" }}
              >
                <label
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  AI 修改建议
                </label>
                <div style={{ position: "relative" }}>
                  <Input.TextArea
                    value={prompt}
                    rows={4}
                    onChange={setPrompt}
                    placeholder="例如：把流程图改为横向，并增加一个'重试'步骤"
                    onKeyDown={(e) =>
                      e.key === "Enter" && !e.shiftKey && handleAiEdit()
                    }
                    style={{ borderRadius: "6px" }}
                  />
                  <Button
                    type="text"
                    icon={<IconSend />}
                    loading={isGenerating}
                    onClick={handleAiEdit}
                    style={{
                      position: "absolute",
                      right: "4px",
                      bottom: "4px",
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                  marginTop: "12px",
                }}
              >
                <Button size="small" onClick={handleCancel}>
                  取消
                </Button>
                <Button size="small" type="primary" onClick={handleSave}>
                  保存
                </Button>
              </div>
            </Col>

            {/* 右侧预览 */}
            <Col
              span={14}
              style={{
                padding: "20px",
                height: "100%",
                borderLeft: "1px solid var(--color-neutral-3)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <label
                  style={{ fontSize: "14px", fontWeight: "500", margin: 0 }}
                >
                  预览
                </label>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  {/* 下载选项已移除 */}
                  <Button
                    size="small"
                    type="outline"
                    icon={isFullscreen ? <IconShrink /> : <IconFullscreen />}
                    onClick={handleToggleFullscreen}
                  >
                    {isFullscreen ? "退出全屏" : "全屏"}
                  </Button>
                </div>
              </div>
              <div
                ref={previewContainerRef}
                className={`mermaid-preview-wrapper ${
                  isFullscreen ? "fullscreen" : ""
                }`}
                style={{
                  height: isFullscreen ? "100vh" : editorHeight,
                  flex: 1,
                }}
              >
                <Spin loading={loading} style={{ display: "block" }}>
                  <div
                    ref={previewRef}
                    className="mermaid-preview"
                    style={{
                      minHeight: editorHeight,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
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
