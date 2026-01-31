import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Grid, Input, Message, Modal, Select, Space, Tag, Card, Empty } from "@arco-design/web-react";
import {
  createVersion,
  getLatestVersion,
  listVersions,
  publishWorkflow,
} from "./api";
import {
  OrchestrationWorkflowVersionDto,
  OrchestrationWorkflowVersionCreateParams,
} from "@/types/orchestration";
import "./index.less";

const { Row, Col } = Grid;
const TextArea = Input.TextArea;

interface CanvasNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

interface CanvasEdge {
  id: string;
  source: string;
  target: string;
}

interface GraphDefinition {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

const defaultGraph: GraphDefinition = {
  nodes: [
    { id: "start", label: "开始", x: 80, y: 80 },
    { id: "end", label: "结束", x: 320, y: 80 },
  ],
  edges: [{ id: "e1", source: "start", target: "end" }],
};

const NODE_TYPES = [
  { type: "start", label: "开始", color: "#52c41a" },
  { type: "end", label: "结束", color: "#f5222d" },
  { type: "llm", label: "LLM 节点", color: "#165dff" },
  { type: "sql", label: "SQL 查询", color: "#722ed1" },
  { type: "log", label: "日志节点", color: "#faad14" },
];

function CanvasEditor() {
  const { id } = useParams<{ id: string }>();
  const [graph, setGraph] = useState<any>(defaultGraph);
  const [rawJson, setRawJson] = useState(JSON.stringify(defaultGraph, null, 2));
  const [versions, setVersions] = useState<OrchestrationWorkflowVersionDto[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | undefined>(undefined);
  const [publishConfirmVisible, setPublishConfirmVisible] = useState(false);
  
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const loadVersions = async () => {
    if (!id) return;
    try {
      const res = await listVersions(id);
      if (res.success) {
        setVersions(res.data || []);
      }
    } catch (e) {
      Message.error("加载版本列表失败");
    }
  };

  const loadLatestGraph = async () => {
    if (!id) return;
    try {
      const res = await getLatestVersion(id);
      if (res.success && res.data) {
        const def = res.data.definitionGraph;
        if (def) {
          try {
            const parsed = JSON.parse(def);
            setGraph(parsed);
            setRawJson(JSON.stringify(parsed, null, 2));
          } catch {
            setRawJson(def);
          }
        }
      }
    } catch {
      // ignore
    }
  };

  const handleJsonChange = (value: string) => {
    setRawJson(value);
    try {
      const parsed = JSON.parse(value);
      setGraph(parsed);
    } catch {
      // ignore parse error in canvas preview
    }
  };

  const handleNodeDrag = (index: number, x: number, y: number) => {
    setGraph((prev: any) => {
      const nodes = prev.nodes.slice();
      nodes[index] = { ...nodes[index], x, y };
      const updated = { ...prev, nodes };
      setRawJson(JSON.stringify(updated, null, 2));
      return updated;
    });
  };

  const handleSaveVersion = async () => {
    if (!id) return;
    let payload: OrchestrationWorkflowVersionCreateParams;
    try {
      const parsed = JSON.parse(rawJson);
      payload = {
        definitionGraph: JSON.stringify(parsed),
      };
    } catch {
      payload = {
        definitionGraph: rawJson,
      };
    }
    try {
      const res = await createVersion(id, payload);
      if (res.success) {
        Message.success("保存新版本成功");
        await loadVersions();
      } else {
        Message.error(res.message || "保存失败");
      }
    } catch (e) {
      Message.error("保存版本失败");
    }
  };

  const handlePublish = async () => {
    if (!id || !selectedVersionId) {
      setPublishConfirmVisible(false);
      return;
    }
    try {
      const res = await publishWorkflow(id, selectedVersionId);
      if (res.success) {
        Message.success("发布成功");
      } else {
        Message.error(res.message || "发布失败");
      }
    } catch (e) {
      Message.error("发布版本失败");
    } finally {
      setPublishConfirmVisible(false);
    }
  };

  const addNode = (type: string) => {
    const typeCfg = NODE_TYPES.find(t => t.type === type);
    const newNode = {
      id: `node-${Date.now()}`,
      type,
      name: typeCfg?.label || "新节点",
      label: typeCfg?.label || "新节点",
      x: 100,
      y: 100,
      config: {}
    };
    const updated = { ...graph, nodes: [...graph.nodes, newNode] };
    setGraph(updated);
    setRawJson(JSON.stringify(updated, null, 2));
  };

  const updateNodeConfig = (nodeId: string, config: any) => {
    const nodes = graph.nodes.map((n: any) => n.id === nodeId ? { ...n, config } : n);
    const updated = { ...graph, nodes };
    setGraph(updated);
    setRawJson(JSON.stringify(updated, null, 2));
  };

  useEffect(() => {
    loadVersions();
    loadLatestGraph();
  }, [id]);

  const selectedNode = graph.nodes.find((n: any) => n.id === selectedNodeId);

  return (
    <div className="orchestration-manager">
      <Space style={{ marginBottom: 16 }} size={16}>
        <Button type="primary" onClick={handleSaveVersion}>
          保存为新版本
        </Button>
        <Select
          placeholder="选择要发布的版本"
          style={{ width: 220 }}
          value={selectedVersionId}
          onChange={(value) => setSelectedVersionId(value as string)}
        >
          {versions.map((v) => (
            <Select.Option key={v.id} value={v.id}>
              v{v.versionNumber} {v.remark && `- ${v.remark}`}
            </Select.Option>
          ))}
        </Select>
        <Button
          type="outline"
          disabled={!selectedVersionId}
          onClick={() => setPublishConfirmVisible(true)}
        >
          发布版本
        </Button>
        <Space size={8}>
          {NODE_TYPES.map(t => (
            <Button key={t.type} size="small" onClick={() => addNode(t.type)}>
              + {t.label}
            </Button>
          ))}
        </Space>
      </Space>
      <Row gutter={16}>
        <Col span={8}>
          <div style={{ marginBottom: 8, fontWeight: 'bold' }}>JSON 定义</div>
          <TextArea
            value={rawJson}
            onChange={handleJsonChange}
            autoSize={{ minRows: 22, maxRows: 32 }}
          />
        </Col>
        <Col span={10}>
          <div style={{ marginBottom: 8, fontWeight: 'bold' }}>画布预览 (可拖动)</div>
          <div
            style={{
              border: "1px solid #e5e6eb",
              borderRadius: 4,
              height: 520,
              position: "relative",
              overflow: "hidden",
              background: "#fafafa",
            }}
          >
            <svg width="100%" height="100%">
              <defs>
                <marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L10,5 L0,10 z" fill="#165dff" />
                </marker>
              </defs>
              {graph.edges.map((edge: any) => {
                const source = graph.nodes.find((n: any) => n.id === edge.source);
                const target = graph.nodes.find((n: any) => n.id === edge.target);
                if (!source || !target) return null;
                return (
                  <line
                    key={edge.id}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke="#165dff"
                    strokeWidth={2}
                    markerEnd="url(#arrow)"
                  />
                );
              })}
            </svg>
            {graph.nodes.map((node: any, index: number) => (
              <DraggableNode
                key={node.id}
                node={node}
                index={index}
                isSelected={selectedNodeId === node.id}
                onDrag={handleNodeDrag}
                onSelect={() => setSelectedNodeId(node.id)}
              />
            ))}
          </div>
        </Col>
        <Col span={6}>
          <div style={{ marginBottom: 8, fontWeight: 'bold' }}>节点属性</div>
          <Card size="small" style={{ height: 520, overflow: 'auto' }}>
            {selectedNode ? (
              <Space direction="vertical" style={{ width: '100%' }} size={16}>
                <div><strong>ID:</strong> {selectedNode.id}</div>
                <div><strong>类型:</strong> <Tag color={NODE_TYPES.find(t => t.type === selectedNode.type)?.color}>{selectedNode.type}</Tag></div>
                <div>
                  <div style={{ marginBottom: 4 }}>名称:</div>
                  <Input 
                    value={selectedNode.name || selectedNode.label} 
                    onChange={(val) => {
                      const nodes = graph.nodes.map((n: any) => n.id === selectedNode.id ? { ...n, name: val, label: val } : n);
                      setGraph({ ...graph, nodes });
                    }} 
                  />
                </div>
                {selectedNode.type === 'llm' && (
                  <>
                    <div>
                      <div style={{ marginBottom: 4 }}>模型名称 (e.g. gpt-4o):</div>
                      <Input 
                        value={selectedNode.config?.modelName || ""} 
                        onChange={(val) => updateNodeConfig(selectedNode.id, { ...selectedNode.config, modelName: val })} 
                      />
                    </div>
                    <div>
                      <div style={{ marginBottom: 4 }}>Prompt:</div>
                      <TextArea 
                        value={selectedNode.config?.prompt || ""} 
                        onChange={(val) => updateNodeConfig(selectedNode.id, { ...selectedNode.config, prompt: val })} 
                        autoSize={{ minRows: 3 }}
                      />
                    </div>
                  </>
                )}
                {selectedNode.type === 'sql' && (
                  <>
                    <div>
                      <div style={{ marginBottom: 4 }}>数据源ID:</div>
                      <Input 
                        value={selectedNode.config?.datasourceId || ""} 
                        onChange={(val) => updateNodeConfig(selectedNode.id, { ...selectedNode.config, datasourceId: val })} 
                      />
                    </div>
                    <div>
                      <div style={{ marginBottom: 4 }}>SQL:</div>
                      <TextArea 
                        value={selectedNode.config?.sql || ""} 
                        onChange={(val) => updateNodeConfig(selectedNode.id, { ...selectedNode.config, sql: val })} 
                        autoSize={{ minRows: 4 }}
                      />
                    </div>
                  </>
                )}
                {selectedNode.type === 'log' && (
                  <div>
                    <div style={{ marginBottom: 4 }}>日志消息:</div>
                    <Input 
                      value={selectedNode.config?.message || ""} 
                      onChange={(val) => updateNodeConfig(selectedNode.id, { ...selectedNode.config, message: val })} 
                    />
                  </div>
                )}
                <div>
                  <div style={{ marginBottom: 4 }}>连接至下个节点:</div>
                  <Select
                    placeholder="选择目标节点"
                    value={graph.edges.find((e: any) => e.source === selectedNode.id)?.target}
                    onChange={(target) => {
                      const otherEdges = graph.edges.filter((e: any) => e.source !== selectedNode.id);
                      let newEdges = otherEdges;
                      if (target) {
                        newEdges = [...otherEdges, { id: `e-${selectedNode.id}-${target}`, source: selectedNode.id, target }];
                      }
                      const updated = { ...graph, edges: newEdges };
                      setGraph(updated);
                      setRawJson(JSON.stringify(updated, null, 2));
                    }}
                    allowClear
                  >
                    {graph.nodes
                      .filter((n: any) => n.id !== selectedNode.id && n.type !== 'start')
                      .map((n: any) => (
                        <Select.Option key={n.id} value={n.id}>
                          {n.name || n.label} ({n.id})
                        </Select.Option>
                      ))}
                  </Select>
                </div>
                <Button 
                   status="danger" 
                   size="small" 
                   onClick={() => {
                     const nodes = graph.nodes.filter((n: any) => n.id !== selectedNode.id);
                     const edges = graph.edges.filter((e: any) => e.source !== selectedNode.id && e.target !== selectedNode.id);
                     setGraph({ nodes, edges });
                     setSelectedNodeId(null);
                     setRawJson(JSON.stringify({ nodes, edges }, null, 2));
                   }}
                >
                  删除节点
                </Button>
              </Space>
            ) : (
              <Empty description="选择节点以编辑属性" />
            )}
          </Card>
        </Col>
      </Row>
      <Modal
        title="确认发布"
        visible={publishConfirmVisible}
        onOk={handlePublish}
        onCancel={() => setPublishConfirmVisible(false)}
      >
        <p>确定将所选版本发布为当前线上版本吗？</p>
      </Modal>
    </div>
  );
}

interface DraggableNodeProps {
  node: any;
  index: number;
  isSelected?: boolean;
  onDrag: (index: number, x: number, y: number) => void;
  onSelect: () => void;
}

const DraggableNode: React.FC<DraggableNodeProps> = ({ node, index, isSelected, onDrag, onSelect }) => {
  const [dragging, setDragging] = useState(false);
  const typeCfg = NODE_TYPES.find(t => t.type === node.type);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    setDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const originX = node.x;
    const originY = node.y;

    const handleMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      onDrag(index, originX + dx, originY + dy);
    };

    const handleUp = () => {
      setDragging(false);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  };

  return (
    <div
      style={{
        position: "absolute",
        left: node.x - 50,
        top: node.y - 25,
        width: 100,
        height: 50,
        borderRadius: 4,
        background: isSelected ? "#e8f3ff" : "#ffffff",
        border: `2px solid ${isSelected ? "#165dff" : (typeCfg?.color || "#e5e6eb")}`,
        color: "#1d2129",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "move",
        userSelect: "none",
        zIndex: isSelected ? 10 : 1,
      }}
      onMouseDown={handleMouseDown}
    >
      <div style={{ fontSize: 10, color: typeCfg?.color }}>{typeCfg?.label}</div>
      <div style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '90%', textAlign: 'center' }}>
        {node.name || node.label}
      </div>
    </div>
  );
};

export default CanvasEditor;

