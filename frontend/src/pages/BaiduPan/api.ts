import axios from '@/core/src/http';

export interface BaiduPanAuthorizeUrlDto {
  authorizeUrl: string;
  state: string;
  expiresInSeconds?: number;
  message?: string;
}

export interface BaiduPanAuthStatusDto {
  configured?: boolean;
  bound: boolean;
  mockMode: boolean;
  providerName?: string;
  accountName?: string;
  message?: string;
  authTip?: string;
  callbackPath?: string;
  authorizeUrl?: string;
  configRoute?: string;
  configCategory?: string;
  boundAt?: string;
  requiredConfigKeys?: string[];
  missingConfigKeys?: string[];
}

export interface BaiduPanFileItemDto {
  name: string;
  path: string;
  parentPath?: string;
  directory: boolean;
  size: number;
  extension?: string;
  downloadSupported?: boolean;
  modifiedAt?: string;
}

export interface BaiduPanCreateFolderRequest {
  name: string;
  parentPath?: string;
}

export interface BaiduPanRenameRequest {
  path: string;
  newName: string;
}

export interface BaiduPanDeleteRequest {
  paths: string[];
}

export interface BaiduPanMoveRequest {
  sourcePaths: string[];
  targetPath: string;
}

const resolveErrorMessage = (error: any, fallback: string) => {
  return error?.response?.data?.message || error?.message || fallback;
};

export const getBaiduPanAuthorizeUrl = async (): Promise<BaiduPanAuthorizeUrlDto> => {
  try {
    const response = await axios.post('/baidu-pan/auth/authorize-url');
    return response.data;
  } catch (error: any) {
    throw new Error(resolveErrorMessage(error, '获取授权链接失败'));
  }
};

export const getBaiduPanAuthStatus = async (): Promise<BaiduPanAuthStatusDto> => {
  try {
    const response = await axios.get('/baidu-pan/auth/status');
    return response.data;
  } catch (error: any) {
    throw new Error(resolveErrorMessage(error, '获取绑定状态失败'));
  }
};

export const unbindBaiduPan = async (): Promise<BaiduPanAuthStatusDto> => {
  try {
    const response = await axios.post('/baidu-pan/auth/unbind');
    return response.data;
  } catch (error: any) {
    throw new Error(resolveErrorMessage(error, '解除绑定失败'));
  }
};

export const listBaiduPanFiles = async (path?: string): Promise<BaiduPanFileItemDto[]> => {
  try {
    const response = await axios.get('/baidu-pan/files', { params: { path } });
    return response.data;
  } catch (error: any) {
    throw new Error(resolveErrorMessage(error, '加载目录失败'));
  }
};

export const createBaiduPanFolder = async (payload: BaiduPanCreateFolderRequest): Promise<BaiduPanFileItemDto> => {
  try {
    const response = await axios.post('/baidu-pan/files/folder', payload);
    return response.data;
  } catch (error: any) {
    throw new Error(resolveErrorMessage(error, '创建文件夹失败'));
  }
};

export const renameBaiduPanFile = async (payload: BaiduPanRenameRequest): Promise<BaiduPanFileItemDto> => {
  try {
    const response = await axios.put('/baidu-pan/files/rename', payload);
    return response.data;
  } catch (error: any) {
    throw new Error(resolveErrorMessage(error, '重命名失败'));
  }
};

export const deleteBaiduPanFiles = async (payload: BaiduPanDeleteRequest): Promise<void> => {
  try {
    await axios.post('/baidu-pan/files/delete', payload);
  } catch (error: any) {
    throw new Error(resolveErrorMessage(error, '删除失败'));
  }
};

export const moveBaiduPanFiles = async (payload: BaiduPanMoveRequest): Promise<void> => {
  try {
    await axios.post('/baidu-pan/files/move', payload);
  } catch (error: any) {
    throw new Error(resolveErrorMessage(error, '移动失败'));
  }
};

export const uploadBaiduPanUrl = '/api/baidu-pan/files/upload';

export const getBaiduPanDownloadUrl = (path: string) => `/api/baidu-pan/files/download?path=${encodeURIComponent(path)}`;
