import React, { useState, useEffect } from 'react';

interface RootJsonConfig {
  logoTitle?: string;
  logoUrl?: string;
  isverifycode?: boolean;
  hiddenLogo?: boolean;
  loginDefaultRedirectUrl?: string;
  [key: string]: any;
}

export const useRootJson = (): RootJsonConfig => {
  const [config, setConfig] = useState<RootJsonConfig>({
    logoTitle: '',
    logoUrl: '',
    isverifycode: false,
    hiddenLogo: false,
    loginDefaultRedirectUrl: ''
  });

  useEffect(() => {
    // 这里可以从API或配置文件加载配置
    // 暂时返回默认配置
    setConfig({
      logoTitle: '数据合成平台',
      logoUrl: '/logo.png',
      isverifycode: true,
      hiddenLogo: false,
      loginDefaultRedirectUrl: '/dashboard'
    });
  }, []);

  return config;
};

export default useRootJson;