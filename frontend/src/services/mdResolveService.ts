import axios from '@/core/src/http';

const base = '/quiz';

export interface MdResolveRequest {
  mdContent: string;
  mdTemplate?: string;
}

export interface MdResolveResponse {
  success: boolean;
  message: string;
  data: Record<string, Array<Record<string, any>>> | null;
}

export interface DefaultTemplateResponse {
  success: boolean;
  message: string;
  data: string;
}

/**
 * 解析 Markdown 内容
 */
export const resolveMdContent = async (data: MdResolveRequest): Promise<MdResolveResponse> => {
  const response = await axios.post(`${base}/api/md-resolve/parse`, data);
  return response.data;
};

/**
 * 获取默认模板
 */
export const getDefaultTemplate = async (): Promise<DefaultTemplateResponse> => {
  const response = await axios.get(`${base}/api/md-resolve/default-template`);
  return response.data;
};

/**
 * 计算分值
 * @param items resolveMdContent 返回的 data（按块分组的记录）
 */
export interface CalculateScoreResponse {
  success: boolean;
  message: string;
  data: { score: number; grade: string } | null;
}

export const calculateScore = async (items: Record<string, Array<Record<string, any>>>): Promise<CalculateScoreResponse> => {
  const response = await axios.post(`${base}/api/md-resolve/calculate`, items);
  return response.data;
};

/**
 * 导出 DOCX
 * @param payload 包含 items/docName/rank
 */
export const exportDocx = async (payload: { items: Record<string, Array<Record<string, any>>>; docName?: string; rank?: string; }): Promise<ArrayBuffer> => {
  const response = await axios.post(`${base}/api/md-resolve/export-docx`, payload, { responseType: 'arraybuffer' });
  return response.data;
};
