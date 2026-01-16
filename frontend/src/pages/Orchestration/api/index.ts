import axios from "@/core/src/http";
import {
  OrchestrationWorkflowDto,
  OrchestrationWorkflowQueryParams,
  OrchestrationWorkflowCreateParams,
  OrchestrationWorkflowUpdateParams,
  OrchestrationWorkflowVersionDto,
  OrchestrationWorkflowVersionCreateParams,
  OrchestrationWorkflowVersionUpdateParams,
  OrchestrationInstanceDto,
  OrchestrationInstanceQueryParams,
  OrchestrationStartRequest,
  WorkflowPageResponse,
  InstancePageResponse,
} from "@/types/orchestration";
import { ApiResponse } from "@/types/common";

export const searchWorkflows = (
  params: OrchestrationWorkflowQueryParams
): Promise<WorkflowPageResponse> =>
  axios.post("/orchestration/workflow/search", params);

export const listWorkflows = (): Promise<ApiResponse<OrchestrationWorkflowDto[]>> =>
  axios.get("/orchestration/workflow/list");

export const createWorkflow = (
  data: OrchestrationWorkflowCreateParams
): Promise<ApiResponse<OrchestrationWorkflowDto>> =>
  axios.post("/orchestration/workflow/create", data);

export const updateWorkflow = (
  data: OrchestrationWorkflowUpdateParams
): Promise<ApiResponse<OrchestrationWorkflowDto>> =>
  axios.put("/orchestration/workflow/update", data);

export const deleteWorkflow = (id: string): Promise<void> =>
  axios.delete(`/orchestration/workflow/delete/${id}`).then(() => undefined);

export const publishWorkflow = (
  workflowId: string,
  versionId: string
): Promise<ApiResponse<OrchestrationWorkflowDto>> =>
  axios.post(`/orchestration/workflow/${workflowId}/publish/${versionId}`);

export const listVersions = (
  workflowId: string
): Promise<ApiResponse<OrchestrationWorkflowVersionDto[]>> =>
  axios.get(`/orchestration/workflow/${workflowId}/versions`);

export const getLatestVersion = (
  workflowId: string
): Promise<ApiResponse<OrchestrationWorkflowVersionDto>> =>
  axios.get(`/orchestration/workflow/${workflowId}/versions/latest`);

export const createVersion = (
  workflowId: string,
  data: OrchestrationWorkflowVersionCreateParams
): Promise<ApiResponse<OrchestrationWorkflowVersionDto>> =>
  axios.post(`/orchestration/workflow/${workflowId}/versions`, data);

export const updateVersion = (
  versionId: string,
  data: OrchestrationWorkflowVersionUpdateParams
): Promise<ApiResponse<OrchestrationWorkflowVersionDto>> =>
  axios.put(`/orchestration/workflow/versions/${versionId}`, data);

export const startInstance = (
  workflowId: string,
  data: OrchestrationStartRequest
): Promise<ApiResponse<OrchestrationInstanceDto>> =>
  axios.post(`/orchestration/workflow/${workflowId}/start`, data);

export const searchInstances = (
  params: OrchestrationInstanceQueryParams
): Promise<InstancePageResponse> =>
  axios.post("/orchestration/instances/search", params);

