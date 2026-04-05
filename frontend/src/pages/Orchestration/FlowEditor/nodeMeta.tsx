import React from "react";
import {
  BranchesOutlined,
  DatabaseOutlined,
  PlayCircleOutlined,
  RobotOutlined,
  StopOutlined,
  ToolOutlined,
} from "@ant-design/icons";

export type WorkflowNodeType =
  | "start"
  | "end"
  | "llm"
  | "knowledge"
  | "skill"
  | "condition";

export interface WorkflowNodeMeta {
  type: WorkflowNodeType;
  label: string;
  shortLabel: string;
  description: string;
  category: string;
  accent: string;
  softColor: string;
  icon: React.ReactNode;
}

export const NODE_META_MAP: Record<WorkflowNodeType, WorkflowNodeMeta> = {
  start: {
    type: "start",
    label: "开始",
    shortLabel: "开始",
    description: "定义工作流的输入起点与运行入口。",
    category: "流程控制",
    accent: "#16a34a",
    softColor: "#ecfdf3",
    icon: <PlayCircleOutlined />,
  },
  end: {
    type: "end",
    label: "结束",
    shortLabel: "结束",
    description: "聚合结果并输出最终响应。",
    category: "流程控制",
    accent: "#ef4444",
    softColor: "#fef2f2",
    icon: <StopOutlined />,
  },
  llm: {
    type: "llm",
    label: "大模型",
    shortLabel: "LLM",
    description: "调用模型生成回答、结构化结果或摘要。",
    category: "模型能力",
    accent: "#2563eb",
    softColor: "#eff6ff",
    icon: <RobotOutlined />,
  },
  knowledge: {
    type: "knowledge",
    label: "知识库",
    shortLabel: "RAG",
    description: "从知识库检索上下文，为模型提供参考。",
    category: "知识与工具",
    accent: "#7c3aed",
    softColor: "#f5f3ff",
    icon: <DatabaseOutlined />,
  },
  skill: {
    type: "skill",
    label: "技能",
    shortLabel: "工具",
    description: "连接外部技能或执行工具型动作。",
    category: "知识与工具",
    accent: "#f59e0b",
    softColor: "#fffbeb",
    icon: <ToolOutlined />,
  },
  condition: {
    type: "condition",
    label: "条件判断",
    shortLabel: "分支",
    description: "根据表达式走向不同执行分支。",
    category: "流程控制",
    accent: "#db2777",
    softColor: "#fdf2f8",
    icon: <BranchesOutlined />,
  },
};

export const NODE_LIBRARY_GROUPS = [
  {
    key: "control",
    title: "流程控制",
    description: "组织工作流的主干结构与分支。",
    items: [NODE_META_MAP.start, NODE_META_MAP.condition, NODE_META_MAP.end],
  },
  {
    key: "ai",
    title: "模型能力",
    description: "让大模型成为流程里的核心执行器。",
    items: [NODE_META_MAP.llm],
  },
  {
    key: "tooling",
    title: "知识与工具",
    description: "接入外部知识、检索和技能能力。",
    items: [NODE_META_MAP.knowledge, NODE_META_MAP.skill],
  },
];

export const resolveNodeMeta = (type?: string): WorkflowNodeMeta =>
  NODE_META_MAP[(type as WorkflowNodeType) || "skill"] || NODE_META_MAP.skill;
