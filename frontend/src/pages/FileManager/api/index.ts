import { request } from "@/utils/request";

export interface FileInfo {
  id: string;
  name: string;
  path: string;
  size: number;
  isDirectory: boolean;
  lastModified: string;
}

export function listFiles(path: string) {
  return request.get<FileInfo[]>('/file/list', { params: { path } });
}

export function createFolder(name: string, path: string) {
  return request.post('/file/folder', null, { params: { name, path } });
}

export function deleteFile(id: string) {
  return request.delete('/file/delete', { params: { id } });
}

export const UPLOAD_URL = '/api/file/upload';

export const getDownloadUrl = (id: string) => `/api/file/download?id=${id}`;
