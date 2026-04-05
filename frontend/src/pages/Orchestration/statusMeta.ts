import { WorkflowStatus } from "@/types/orchestration";

export const WORKFLOW_STATUS_META: Record<
  WorkflowStatus,
  {
    label: string;
    className: string;
  }
> = {
  DRAFT: {
    label: "草稿",
    className: "workflow-status workflow-status--draft",
  },
  PENDING: {
    label: "待发布",
    className: "workflow-status workflow-status--pending",
  },
  PUBLISHED: {
    label: "已发布",
    className: "workflow-status workflow-status--published",
  },
  DISABLED: {
    label: "已停用",
    className: "workflow-status workflow-status--disabled",
  },
};

