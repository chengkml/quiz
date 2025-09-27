import React, { createContext, useContext, ReactNode } from 'react';

interface GlobalContextType {
  user?: any;
  theme?: string;
  language?: string;
  [key: string]: any;
}

const GlobalContext = createContext<GlobalContextType>({
  user: null,
  theme: 'light',
  language: 'zh-CN'
});

interface GlobalProviderProps {
  children: ReactNode;
  value?: GlobalContextType;
}

export const GlobalProvider: React.FC<GlobalProviderProps> = ({ 
  children, 
  value = {} 
}) => {
  const defaultValue: GlobalContextType = {
    user: null,
    theme: 'light',
    language: 'zh-CN',
    ...value
  };

  return (
    <GlobalContext.Provider value={defaultValue}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobalContext must be used within a GlobalProvider');
  }
  return context;
};

export { GlobalContext };
export default GlobalContext;