import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Grid, Input, Message, Modal, Select, Space, Tag } from "@arco-design/web-react";
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

function CanvasEditor() {
  const { id } = useParams<{ id: string }>();
  const [graph, setGraph] = useState<GraphDefinition>(defaultGraph);
  const [rawJson, setRawJson] = useState(JSON.stringify(defaultGraph, null, 2));
  const [versions, setVersions] = useState<OrchestrationWorkflowVersionDto[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | undefined>(undefined);
  const [publishConfirmVisible, setPublishConfirmVisible] = useState(false);

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
            const parsed = JSON.parse(def) as GraphDefinition;
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
      const parsed = JSON.parse(value) as GraphDefinition;
      setGraph(parsed);
    } catch {
      // ignore parse error in canvas preview
    }
  };

  const handleNodeDrag = (index: number, x: number, y: number) => {
    setGraph((prev) => {
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

  useEffect(() => {
    loadVersions();
    loadLatestGraph();
  }, [id]);

  return (
    <div className="orchestration-manager">
      <Space style={{ marginBottom: 16 }}>
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
        <Tag>通过左侧 JSON 与右侧画布管理节点和连线</Tag>
      </Space>
      <Row gutter={16}>
        <Col span={12}>
          <TextArea
            value={rawJson}
            onChange={handleJsonChange}
            autoSize={{ minRows: 20, maxRows: 32 }}
          />
        </Col>
        <Col span={12}>
          <div
            style={{
              border: "1px solid #e5e6eb",
              borderRadius: 4,
              height: 480,
              position: "relative",
              overflow: "hidden",
              background: "#fafafa",
            }}
          >
            <svg width="100%" height="100%">
              <defs>
                <marker
                  id="arrow"
                  markerWidth="10"
                  markerHeight="10"
                  refX="10"
                  refY="5"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M0,0 L10,5 L0,10 z" fill="#165dff" />
                </marker>
              </defs>
              {graph.edges.map((edge) => {
                const source = graph.nodes.find((n) => n.id === edge.source);
                const target = graph.nodes.find((n) => n.id === edge.target);
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
            {graph.nodes.map((node, index) => (
              <DraggableNode
                key={node.id}
                node={node}
                index={index}
                onDrag={handleNodeDrag}
              />
            ))}
          </div>
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
  node: CanvasNode;
  index: number;
  onDrag: (index: number, x: number, y: number) => void;
}

const DraggableNode: React.FC<DraggableNodeProps> = ({ node, index, onDrag }) => {
  const [dragging, setDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
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
        left: node.x - 40,
        top: node.y - 20,
        width: 80,
        height: 40,
        borderRadius: 4,
        background: dragging ? "#165dff" : "#ffffff",
        color: dragging ? "#ffffff" : "#1d2129",
        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "move",
        userSelect: "none",
      }}
      onMouseDown={handleMouseDown}
    >
      {node.label}
    </div>
  );
};

export default CanvasEditor;

