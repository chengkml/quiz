import axios from "@/core/src/http";
import { AxiosResponse } from "axios";

export const API_PREFIX = "/password";

export interface PasswordDto {
  id: string;
  title: string;
  username: string;
  password?: string;
  url?: string;
  remark?: string;
  createUser?: string;
  createUserName?: string;
  createDate?: string;
  updateDate?: string;
}

export interface PasswordQueryDto {
  keyWord?: string;
  pageNum: number;
  pageSize: number;
}

export function searchPassword(data: PasswordQueryDto): Promise<AxiosResponse<any>> {
  return axios.post(`${API_PREFIX}/search`, data);
}

export function createPassword(data: Partial<PasswordDto>): Promise<AxiosResponse<any>> {
  return axios.post(`${API_PREFIX}/create`, data);
}

export function updatePassword(data: Partial<PasswordDto>): Promise<AxiosResponse<any>> {
  return axios.put(`${API_PREFIX}/update`, data);
}

export function deletePassword(id: string): Promise<AxiosResponse<any>> {
  return axios.delete(`${API_PREFIX}/delete/${id}`);
}

export function getDecryptedPassword(id: string, salt: string): Promise<AxiosResponse<string>> {
  return axios.get<string>(`${API_PREFIX}/decrypt/${id}?salt=${encodeURIComponent(salt)}`);
}

export function sendSalt(): Promise<AxiosResponse<void>> {
  return axios.post(`${API_PREFIX}/send-salt`);
}
