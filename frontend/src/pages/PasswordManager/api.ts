import { request } from "@/utils/request";

export const API_PREFIX = "/api/password";

export interface PasswordDto {
  id: string;
  title: string;
  username: string;
  password?: string; // Only for create/update, not returned in list
  url?: string;
  category?: string;
  remark?: string;
  createUser?: string;
  createUserName?: string;
  createDate?: string;
  updateDate?: string;
}

export interface PasswordQueryDto {
  keyWord?: string;
  category?: string;
  pageNum: number;
  pageSize: number;
}

export function searchPassword(data: PasswordQueryDto) {
  return request.post(`${API_PREFIX}/search`, data);
}

export function createPassword(data: Partial<PasswordDto>) {
  return request.post(`${API_PREFIX}/create`, data);
}

export function updatePassword(data: Partial<PasswordDto>) {
  return request.put(`${API_PREFIX}/update`, data);
}

export function deletePassword(id: string) {
  return request.delete(`${API_PREFIX}/delete/${id}`);
}

export function getDecryptedPassword(id: string) {
  return request.get<string>(`${API_PREFIX}/decrypt/${id}`);
}
