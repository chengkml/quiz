import axios from "@/core/src/http";

export interface FileInfo {
  id: string;
  name: string;
  path: string;
  size: number;
  isDirectory: boolean;
  lastModified: string;
}

export function listFiles(path: string) {
  return axios.get<FileInfo[]>('/file/list', { params: { path } }).then(res => res.data);
}

export function createFolder(name: string, path: string) {
  return axios.post('/file/folder', null, { params: { name, path } }).then(res => res.data);
}

export function deleteFile(id: string) {
  return axios.delete('/file/delete', { params: { id } }).then(res => res.data);
}

export function batchDelete(ids: string[]) {
  return axios.post('/file/batch-delete', { ids }).then(res => res.data);
}

export function renameFile(id: string, newName: string) {
  return axios.put('/file/rename', null, { params: { id, newName } }).then(res => res.data);
}

export function moveFiles(ids: string[], targetPath: string) {
  return axios.post('/file/move', { ids, targetPath }).then(res => res.data);
}

export const UPLOAD_URL = '/api/file/upload';

export const getDownloadUrl = (id: string) => `/api/file/download?id=${id}`;
