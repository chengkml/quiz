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
