import axios from '@/core/src/http';

// 定义接口类型 - 与后端WxAppQueryDto匹配
export interface WxAppQueryParams {
  offset?: number;
  limit?: number;
  name?: string;
  // 保留原有的字段以保持向后兼容
  appId?: string;
  appName?: string;
  status?: string;
}

export interface WxAppCreateParams {
  appId: string;
  appName: string;
  appSecret: string;
  description?: string;
  status?: string;
}

export interface WxAppUpdateParams {
  appId: string;
  appName?: string;
  appSecret?: string;
  description?: string;
  status?: string;
}

// 与后端WxAppDto保持一致
export interface WxAppResponse {
  appId: string;
  // 后端有appid字段（注意小写）
  appid?: string;
  appName: string;
  createTime: string;
  updateTime: string;
  // 保留原有字段以确保兼容性
  appSecret?: string;
  description?: string;
  status?: string;
  [key: string]: any;
}

// 小程序用户响应类型 - 与后端WxAppUserDto匹配
export interface WxAppUserResponse {
  userId: string;
  userName: string;
  appId: string;
  appName: string;
  openId: string;
  createTime: string;
}

// 分页查询微信小程序信息（POST search）
export const getWxAppList = (params: WxAppQueryParams) => axios.post('/wx/app/search', params);

// 获取微信小程序详情 - 使用appId作为路径参数
export const getWxAppById = (appId: string) => axios.get(`/wx/app/${appId}`);

// 创建微信小程序
export const createWxApp = (params: WxAppCreateParams) => axios.post('/wx/app/create', params);

// 更新微信小程序 - 使用PUT方法
export const updateWxApp = (params: WxAppUpdateParams) => axios.put('/wx/app/update', params);

// 删除微信小程序 - 使用DELETE方法和appId作为路径参数
export const deleteWxApp = (appId: string) => axios.delete(`/wx/app/delete/${appId}`);

// 获取小程序用户列表 - 使用appId作为路径参数
export const getWxAppUsers = (appId: string) => axios.get(`/wx/app/${appId}/users`);

export default {
  getWxAppList,
  getWxAppById,
  createWxApp,
  updateWxApp,
  deleteWxApp,
  getWxAppUsers,
};