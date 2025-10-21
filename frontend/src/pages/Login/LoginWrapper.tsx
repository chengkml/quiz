import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { LoginUserInfo } from '@/types/user';
import AppLogin from './index';

const LoginWrapper: React.FC = () => {
  const { login } = useUser();

  const handleLoginSuccess = (username: string) => {
    // 从localStorage获取用户信息并设置到上下文
    const userInfoStr = localStorage.getItem('userInfo');
    if (userInfoStr) {
      try {
        const userInfo: LoginUserInfo = JSON.parse(userInfoStr);
        login(userInfo);
        console.log('User logged in:', userInfo);
        // 菜单数据将由Layout组件自动加载，无需在此处重复调用
      } catch (error) {
        console.error('Failed to parse user info:', error);
      }
    }
  };

  return <AppLogin onLoginSuccess={handleLoginSuccess} />;
};

export default LoginWrapper;