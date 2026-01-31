import axios from "@/core/src/http";
import { AxiosResponse } from "axios";
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
): Promise<AxiosResponse<WorkflowPageResponse>> =>
  axios.post("/orchestration/workflow/search", params);

export const listWorkflows = (): Promise<AxiosResponse<OrchestrationWorkflowDto[]>> =>
  axios.get("/orchestration/workflow/list");

export const createWorkflow = (
  data: OrchestrationWorkflowCreateParams
): Promise<AxiosResponse<OrchestrationWorkflowDto>> =>
  axios.post("/orchestration/workflow/create", data);

export const updateWorkflow = (
  data: OrchestrationWorkflowUpdateParams
): Promise<AxiosResponse<OrchestrationWorkflowDto>> =>
  axios.put("/orchestration/workflow/update", data);

export const deleteWorkflow = (id: string): Promise<void> =>
  axios.delete(`/orchestration/workflow/delete/${id}`).then(() => undefined);

export const publishWorkflow = (
  workflowId: string,
  versionId: string
): Promise<AxiosResponse<OrchestrationWorkflowDto>> =>
  axios.post(`/orchestration/workflow/${workflowId}/publish/${versionId}`);

export const listVersions = (
  workflowId: string
): Promise<AxiosResponse<OrchestrationWorkflowVersionDto[]>> =>
  axios.get(`/orchestration/workflow/${workflowId}/versions`);

export const getLatestVersion = (
  workflowId: string
): Promise<AxiosResponse<OrchestrationWorkflowVersionDto>> =>
  axios.get(`/orchestration/workflow/${workflowId}/versions/latest`);

export const createVersion = (
  workflowId: string,
  data: OrchestrationWorkflowVersionCreateParams
): Promise<AxiosResponse<OrchestrationWorkflowVersionDto>> =>
  axios.post(`/orchestration/workflow/${workflowId}/versions`, data);

export const updateVersion = (
  versionId: string,
  data: OrchestrationWorkflowVersionUpdateParams
): Promise<AxiosResponse<OrchestrationWorkflowVersionDto>> =>
  axios.put(`/orchestration/workflow/versions/${versionId}`, data);

export const startInstance = (
  workflowId: string,
  data: OrchestrationStartRequest
): Promise<AxiosResponse<OrchestrationInstanceDto>> =>
  axios.post(`/orchestration/workflow/${workflowId}/start`, data);

export const searchInstances = (
  params: OrchestrationInstanceQueryParams
): Promise<AxiosResponse<InstancePageResponse>> =>
  axios.post("/orchestration/instances/search", params);
