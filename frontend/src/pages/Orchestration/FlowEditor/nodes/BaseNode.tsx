import React, { CSSProperties, memo } from "react";
import { Handle, Position } from "reactflow";
import { WorkflowNodeMeta } from "../nodeMeta";

interface BaseNodeProps {
  data: any;
  meta: WorkflowNodeMeta;
  hasInput?: boolean;
  hasOutput?: boolean;
  selected?: boolean;
}

const getNodeSummary = (data: any, fallback: string) => {
  if (data?.modelName) {
    return `模型：${data.modelName}`;
  }
  if (data?.knowledgeId) {
    return `知识库：${data.knowledgeId}`;
  }
  if (data?.skillCode) {
    return `技能：${data.skillCode}`;
  }
  if (data?.expression) {
    return `条件：${data.expression}`;
  }
  if (data?.inputSchema) {
    return `输入：${data.inputSchema}`;
  }
  if (data?.responseTemplate) {
    return `输出：${data.responseTemplate}`;
  }
  if (data?.description) {
    return data.description;
  }
  return fallback;
};

const BaseNode: React.FC<BaseNodeProps> = ({
  data,
  meta,
  hasInput = true,
  hasOutput = true,
  selected,
}) => {
  const style = {
    "--node-accent": meta.accent,
    "--node-soft": meta.softColor,
  } as CSSProperties;
  const summary = getNodeSummary(data, meta.description);

  return (
    <div
      className={`flow-node${selected ? " is-selected" : ""}`}
      style={style}
    >
      {hasInput && (
        <Handle
          type="target"
          position={Position.Left}
          className="flow-node__handle flow-node__handle--target"
        />
      )}

      <div className="flow-node__header">
        <div className="flow-node__header-main">
          <span className="flow-node__icon">{meta.icon}</span>
          <div>
            <div className="flow-node__title">{meta.label}</div>
            <div className="flow-node__category">{meta.category}</div>
          </div>
        </div>
        <span className="flow-node__badge">{meta.shortLabel}</span>
      </div>

      <div className="flow-node__body">
        <div className="flow-node__field-label">节点名称</div>
        <div className="flow-node__name">
          {data.label || meta.label}
        </div>
        <div className="flow-node__summary">{summary}</div>
      </div>

      <div className="flow-node__footer">
        <span className="flow-node__footer-dot" />
        <span>{selected ? "已选中，正在配置" : "单击节点查看配置"}</span>
      </div>

      {hasOutput && (
        <Handle
          type="source"
          position={Position.Right}
          className="flow-node__handle flow-node__handle--source"
        />
      )}
    </div>
  );
};

export default memo(BaseNode);
