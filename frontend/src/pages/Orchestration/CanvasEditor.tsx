import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Button, Message, Select, Space, Modal, Card } from "@arco-design/web-react";
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
import FlowEditor from "./FlowEditor";
import { Node, Edge } from "reactflow";

function CanvasEditor() {
  const { id } = useParams<{ id: string }>();
  const [versions, setVersions] = useState<OrchestrationWorkflowVersionDto[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | undefined>(undefined);
  const [publishConfirmVisible, setPublishConfirmVisible] = useState(false);

  // React Flow State
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

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
            // Support both old custom format and new React Flow format
            if (parsed.nodes && parsed.edges) {
               // Assuming simple conversion or direct compatible format
               // If old format incompatible, might need migration logic here.
               // For now, assume we start from scratch or valid React Flow JSON
               setNodes(parsed.nodes || []);
               setEdges(parsed.edges || []);
            }
          } catch {
             // ignore
          }
        }
      }
    } catch {
      // ignore
    }
  };

  const handleEditorSave = useCallback((newNodes: Node[], newEdges: Edge[]) => {
      // Auto-sync state from editor, but we only persist on "Save" button click
      setNodes(newNodes);
      setEdges(newEdges);
  }, []);

  const handleSaveVersion = async () => {
    if (!id) return;
    const graphData = {
        nodes,
        edges,
        viewport: { x: 0, y: 0, zoom: 1 } // Simplified
    };
    
    const payload: OrchestrationWorkflowVersionCreateParams = {
      definitionGraph: JSON.stringify(graphData),
    };

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
    <div className="orchestration-editor" style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: '12px 16px' }}>
        <Space size={16} style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
                <div style={{ fontWeight: 'bold', fontSize: 16 }}>编排编辑器</div>
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
            </Space>
            <Space>
                <Button type="primary" onClick={handleSaveVersion}>
                  保存新版本
                </Button>
                <Button
                  type="outline"
                  disabled={!selectedVersionId}
                  onClick={() => setPublishConfirmVisible(true)}
                >
                  发布
                </Button>
            </Space>
        </Space>
      </Card>

      <div style={{ flex: 1, border: '1px solid #e5e6eb', borderRadius: 4, overflow: 'hidden' }}>
        <FlowEditor 
            initialNodes={nodes} 
            initialEdges={edges} 
            onSave={handleEditorSave}
        />
      </div>

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

export default CanvasEditor;
