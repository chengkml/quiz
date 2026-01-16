import { PageResponse, ApiResponse } from "@/types/common";

export type WorkflowStatus = "DRAFT" | "PENDING" | "PUBLISHED" | "DISABLED";

export interface OrchestrationWorkflowDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  bizDomain?: string;
  status: WorkflowStatus;
  currentVersionId?: string;
  createUser?: string;
  createDate?: string;
  updateUser?: string;
  updateDate?: string;
}

export interface OrchestrationWorkflowQueryParams {
  keyWord?: string;
  status?: WorkflowStatus;
  bizDomain?: string;
  pageNum: number;
  pageSize: number;
}

export interface OrchestrationWorkflowCreateParams {
  code: string;
  name: string;
  description?: string;
  bizDomain?: string;
}

export interface OrchestrationWorkflowUpdateParams {
  id: string;
  name?: string;
  description?: string;
  bizDomain?: string;
  status?: WorkflowStatus;
}

export interface OrchestrationWorkflowVersionDto {
  id: string;
  workflowId: string;
  versionNumber: number;
  definitionGraph: string;
  remark?: string;
  createDate?: string;
}

export interface OrchestrationWorkflowVersionCreateParams {
  definitionGraph: string;
  remark?: string;
}

export interface OrchestrationWorkflowVersionUpdateParams {
  id: string;
  definitionGraph: string;
  remark?: string;
}

export type InstanceStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";

export type TriggerType = "MANUAL" | "API" | "SCHEDULE" | "EVENT";

export interface OrchestrationInstanceDto {
  id: string;
  workflowId: string;
  workflowVersionId: string;
  status: InstanceStatus;
  triggerType: TriggerType;
  triggerParams?: string;
  startTime?: string;
  endTime?: string;
  errorSummary?: string;
}

export interface OrchestrationInstanceQueryParams {
  workflowId?: string;
  status?: InstanceStatus;
  pageNum: number;
  pageSize: number;
}

export interface OrchestrationStartRequest {
  triggerType: TriggerType;
  triggerParams?: string;
  workflowVersionId?: string;
}

export type WorkflowPageResponse = PageResponse<OrchestrationWorkflowDto>;

export type InstancePageResponse = PageResponse<OrchestrationInstanceDto>;

export type WorkflowResponse = ApiResponse<OrchestrationWorkflowDto>;

export type VersionListResponse = ApiResponse<OrchestrationWorkflowVersionDto[]>;

