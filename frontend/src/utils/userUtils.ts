import { LoginUserInfo } from '@/types/user';

/**
 * 获取用户显示名称
 * @param user 用户信息
 * @returns 用户显示名称
 */
export const getUserDisplayName = (user?: LoginUserInfo | null): string => {
  if (!user) return '未登录';
  return user.userName || user.userId || '用户';
};

/**
 * 获取用户头像
 * @param user 用户信息
 * @returns 用户头像URL
 */
export const getUserAvatar = (user?: LoginUserInfo | null): string => {
  if (!user) return '';
  return user.logo || '';
};

/**
 * 清除用户信息
 * 清除localStorage中的用户相关数据
 */
export const clearUserInfo = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('userInfo');
};

/**
 * 从localStorage获取用户信息
 * @returns 用户信息或null
 */
export const getUserInfoFromStorage = (): LoginUserInfo | null => {
  try {
    const userInfoStr = localStorage.getItem('userInfo');
    if (userInfoStr) {
      return JSON.parse(userInfoStr) as LoginUserInfo;
    }
  } catch (error) {
    console.error('解析用户信息失败:', error);
  }
  return null;
};

/**
 * 保存用户信息到localStorage
 * @param userInfo 用户信息
 */
export const saveUserInfoToStorage = (userInfo: LoginUserInfo): void => {
  try {
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
  } catch (error) {
    console.error('保存用户信息失败:', error);
  }
};

/**
 * 检查用户是否已登录
 * @returns 是否已登录
 */
export const isUserLoggedIn = (): boolean => {
  const token = localStorage.getItem('token');
  const userInfo = getUserInfoFromStorage();
  return !!(token && userInfo);
};