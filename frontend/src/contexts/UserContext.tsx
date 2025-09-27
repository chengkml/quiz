import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Message } from '@arco-design/web-react';
import { LoginUserInfo } from '@/types/user';
import { MenuTreeDto, MenuType } from '@/types/menu';
import { menuService } from '@/services/menuService';

interface UserContextType {
  user: LoginUserInfo | null;
  setUser: (user: LoginUserInfo | null) => void;
  login: (userInfo: LoginUserInfo) => void;
  logout: () => void;
  loading: boolean;
  menuTree: MenuTreeDto[];
  setMenuTree: (menuTree: MenuTreeDto[]) => void;
  loadMenuFromServer: () => Promise<void>;
}

const initialUserState: UserContextType = {
  user: null,
  setUser: () => {},
  login: () => {},
  logout: () => {},
  loading: true,
  menuTree: [],
  setMenuTree: () => {},
  loadMenuFromServer: async () => {}
};

const UserContext = createContext<UserContextType>(initialUserState);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<LoginUserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuTree, setMenuTree] = useState<MenuTreeDto[]>([]);



  // 递归查找第一个可访问的菜单项
  const findFirstAccessibleMenu = (menuList: MenuTreeDto[]): string | null => {
    for (const menu of menuList) {
      // 如果是菜单类型且有路径配置，返回该路径
      if (menu.menuType === MenuType.MENU && menu.menuExtConf) {
        const parseConf = JSON.parse(menu.menuExtConf);
        if(parseConf.path) {
          return parseConf.path;
        }
      }
      // 如果有子菜单，递归查找
      if (menu.children && menu.children.length > 0) {
        const childPath = findFirstAccessibleMenu(menu.children);
        if (childPath) {
          return childPath;
        }
      }
    }
    return null;
  };

  // 从后台服务器加载菜单信息（始终获取最新数据，不使用缓存）
  const loadMenuFromServer = useCallback(async () => {
    try {
      if (!user?.userId) {
        console.warn('No user ID available for loading menu');
        return;
      }
      
      const response = await menuService.getUserMenuTree(user.userId);
      if (response.success && response.data) {
        if (response.data.length === 0) {
          console.warn('菜单数据为空，跳转到NotFound页面');
          navigate('/data_synth/frame/notfound');
          return;
        }
        setMenuTree(response.data);

        if(location.pathname === '/data_synth/frame') {

          // 获取菜单数据成功且不为空时，跳转到第一个菜单
          const firstMenuPath = findFirstAccessibleMenu(response.data);
          if (firstMenuPath) {
            console.log('跳转到第一个菜单:', firstMenuPath);
            navigate('/data_synth/frame/'+firstMenuPath);
          } else {
            console.warn('未找到可访问的菜单项');
          }
        }

      } else {
        console.error('Failed to load menu from server:', response.message);
        Message.error('加载菜单失败');
        setMenuTree([]);
        navigate('/data_synth/frame/notfound');
      }
    } catch (error) {
      console.error('Error loading menu from server:', error);
      Message.error('加载菜单失败');
      setMenuTree([]);
      navigate('/data_synth/frame/notfound');
    }
  }, [user?.userId, navigate]);

  // 初始化时从localStorage加载用户信息（菜单数据不使用缓存）
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const storedUser = localStorage.getItem('userInfo');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Failed to load user from localStorage:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserFromStorage();
    // 移除loadMenuFromStorage调用，菜单数据始终从服务器获取
  }, []);

  // 登录方法 - 保存用户信息到上下文和localStorage
  const login = (userInfo: LoginUserInfo) => {
    setUser(userInfo);
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    Message.success('登录成功');
  };

  // 登出方法 - 清除用户信息和菜单信息
  const logout = () => {
    setUser(null);
    setMenuTree([]);
    localStorage.removeItem('userInfo');
    localStorage.removeItem('menuInfo');
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '/data_synth/login';
  };

  const value = {
    user,
    setUser,
    login,
    logout,
    loading,
    menuTree,
    setMenuTree,
    loadMenuFromServer
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;