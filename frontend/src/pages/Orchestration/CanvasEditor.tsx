import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeftOutlined, CloudUploadOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Message, Modal, Select, Space, Typography } from "@arco-design/web-react";
import { createVersion, listVersions, listWorkflows, publishWorkflow } from "./api";
import {
  OrchestrationWorkflowDto,
  OrchestrationWorkflowVersionCreateParams,
  OrchestrationWorkflowVersionDto,
} from "@/types/orchestration";
import "./index.less";
import FlowEditor from "./FlowEditor";
import { Edge, Node } from "reactflow";
import { WORKFLOW_STATUS_META } from "./statusMeta";
import renderDate from "@/utils/timeUtil";

function CanvasEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [workflowMeta, setWorkflowMeta] = useState<OrchestrationWorkflowDto | null>(null);
  const [versions, setVersions] = useState<OrchestrationWorkflowVersionDto[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | undefined>(undefined);
  const [publishConfirmVisible, setPublishConfirmVisible] = useState(false);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const applyDefinitionGraph = useCallback((definitionGraph?: string) => {
    if (!definitionGraph) {
      setNodes([]);
      setEdges([]);
      return;
    }

    try {
      const parsed = JSON.parse(definitionGraph);
      setNodes(parsed.nodes || []);
      setEdges(parsed.edges || []);
    } catch (error) {
      console.error(error);
      Message.error("版本图数据解析失败");
      setNodes([]);
      setEdges([]);
    }
  }, []);

  const loadWorkflowMeta = useCallback(async () => {
    if (!id) {
      return;
    }
    try {
      const res = await listWorkflows();
      const matchedWorkflow = (res.data || []).find((item) => item.id === id) || null;
      setWorkflowMeta(matchedWorkflow);
    } catch (error) {
      console.error(error);
    }
  }, [id]);

  const loadVersions = useCallback(
    async (preferredVersionId?: string) => {
      if (!id) {
        return;
      }

      try {
        const res = await listVersions(id);
        const orderedVersions = [...(res.data || [])].sort(
          (a, b) => b.versionNumber - a.versionNumber
        );
        setVersions(orderedVersions);

        if (orderedVersions.length === 0) {
          setSelectedVersionId(undefined);
          setNodes([]);
          setEdges([]);
          return;
        }

        let nextSelectedId = orderedVersions[0].id;
        setSelectedVersionId((previousValue) => {
          nextSelectedId =
            preferredVersionId ||
            (previousValue && orderedVersions.some((item) => item.id === previousValue)
              ? previousValue
              : orderedVersions[0].id);
          return nextSelectedId;
        });
        const currentVersion =
          orderedVersions.find((item) => item.id === nextSelectedId) || orderedVersions[0];
        applyDefinitionGraph(currentVersion.definitionGraph);
      } catch (error) {
        console.error(error);
        Message.error("加载版本列表失败");
      }
    },
    [applyDefinitionGraph, id]
  );

  const handleEditorSave = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    setNodes(newNodes);
    setEdges(newEdges);
  }, []);

  const handleSaveVersion = async () => {
    if (!id) {
      return;
    }

    const graphData = {
      nodes,
      edges,
      viewport: { x: 0, y: 0, zoom: 1 },
    };

    const payload: OrchestrationWorkflowVersionCreateParams = {
      definitionGraph: JSON.stringify(graphData),
    };

    try {
      const res = await createVersion(id, payload);
      Message.success("保存新版本成功");
      await loadVersions(res.data?.id);
    } catch (error: any) {
      const message = error?.response?.data?.message || "保存版本失败";
      Message.error(message);
    }
  };

  const handlePublish = async () => {
    if (!id || !selectedVersionId) {
      setPublishConfirmVisible(false);
      return;
    }

    try {
      await publishWorkflow(id, selectedVersionId);
      Message.success("发布成功");
      setWorkflowMeta((prev) =>
        prev
          ? {
              ...prev,
              status: "PUBLISHED",
              currentVersionId: selectedVersionId,
            }
          : prev
      );
    } catch (error: any) {
      const message = error?.response?.data?.message || "发布版本失败";
      Message.error(message);
    } finally {
      setPublishConfirmVisible(false);
    }
  };

  const handleVersionChange = (value: string) => {
    setSelectedVersionId(value);
    const version = versions.find((item) => item.id === value);
    applyDefinitionGraph(version?.definitionGraph);
  };

  useEffect(() => {
    loadWorkflowMeta();
    loadVersions();
  }, [loadVersions, loadWorkflowMeta]);

  const selectedVersion = versions.find((item) => item.id === selectedVersionId) || null;
  const statusMeta = workflowMeta ? WORKFLOW_STATUS_META[workflowMeta.status] : null;

  return (
    <div className="orchestration-editor">
      <div className="orchestration-editor__shell">
        <section className="orchestration-editor__hero">
          <div className="orchestration-editor__hero-main">
            <Button
              type="text"
              className="orchestration-editor__back"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/frame/orchestration")}
            >
              返回编排列表
            </Button>

            <div className="orchestration-editor__hero-copy">
              <div className="orchestration-editor__eyebrow">编排工作台</div>
              <div className="orchestration-editor__title-row">
                <Typography.Title heading={4} style={{ margin: 0 }}>
                  {workflowMeta?.name || "可视化编排编辑器"}
                </Typography.Title>
                {statusMeta && (
                  <span className={statusMeta.className}>{statusMeta.label}</span>
                )}
              </div>
              <Typography.Text type="secondary">
                {workflowMeta?.description ||
                  "以类似 Dify 工作流的方式组织模型、知识库、技能与条件分支。"}
              </Typography.Text>
            </div>
          </div>

          <div className="orchestration-editor__meta-grid">
            <div className="editor-meta-card">
              <span className="editor-meta-card__label">工作流编码</span>
              <span className="editor-meta-card__value">
                {workflowMeta?.code || id || "-"}
              </span>
            </div>
            <div className="editor-meta-card">
              <span className="editor-meta-card__label">版本数量</span>
              <span className="editor-meta-card__value">{versions.length}</span>
            </div>
            <div className="editor-meta-card">
              <span className="editor-meta-card__label">当前线上版本</span>
              <span className="editor-meta-card__value">
                {workflowMeta?.currentVersionId || "未发布"}
              </span>
            </div>
            <div className="editor-meta-card">
              <span className="editor-meta-card__label">最近版本时间</span>
              <span className="editor-meta-card__value">
                {selectedVersion?.createDate ? renderDate(selectedVersion.createDate) : "-"}
              </span>
            </div>
          </div>
        </section>

        <section className="orchestration-editor__toolbar">
          <div className="orchestration-editor__toolbar-left">
            <div className="orchestration-editor__toolbar-title">版本管理</div>
            <Select
              placeholder="选择版本"
              style={{ width: 280 }}
              value={selectedVersionId}
              onChange={(value) => handleVersionChange(value as string)}
              allowClear={false}
            >
              {versions.map((version) => (
                <Select.Option key={version.id} value={version.id}>
                  v{version.versionNumber}
                  {version.remark ? ` · ${version.remark}` : ""}
                </Select.Option>
              ))}
            </Select>
          </div>

          <Space size={12}>
            <Button type="outline" icon={<SaveOutlined />} onClick={handleSaveVersion}>
              保存新版本
            </Button>
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              disabled={!selectedVersionId}
              onClick={() => setPublishConfirmVisible(true)}
            >
              发布当前版本
            </Button>
          </Space>
        </section>

        {versions.length > 0 && (
          <section className="orchestration-editor__version-strip">
            {versions.map((version) => (
              <button
                key={version.id}
                type="button"
                className={`orchestration-editor__version-pill${
                  version.id === selectedVersionId ? " is-active" : ""
                }`}
                onClick={() => handleVersionChange(version.id)}
              >
                <span className="orchestration-editor__version-pill-title">
                  v{version.versionNumber}
                </span>
                <span className="orchestration-editor__version-pill-meta">
                  {version.createDate ? renderDate(version.createDate) : "未记录时间"}
                </span>
              </button>
            ))}
          </section>
        )}

        <div className="orchestration-editor__canvas-shell">
          <FlowEditor
            graphKey={selectedVersionId || "empty"}
            initialNodes={nodes}
            initialEdges={edges}
            onSave={handleEditorSave}
          />
        </div>
      </div>

      <Modal
        title="确认发布"
        visible={publishConfirmVisible}
        onOk={handlePublish}
        onCancel={() => setPublishConfirmVisible(false)}
        okText="确认发布"
        cancelText="取消"
      >
        <p>确定将当前选中版本发布为线上版本吗？</p>
      </Modal>
    </div>
  );
}

export default CanvasEditor;
