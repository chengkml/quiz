import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '@/pages/Login/LoginWrapper';
import Layout from '@/components/Layout';
import RoleManagement from '@/pages/Role';
import MenuManagement from '@/pages/Menu';
import QuestionManagement from '@/pages/Question';
import DatasourceManagement from '@/pages/Datasource';
import ExamManagement from '@/pages/Exam';
import ExamTakePage from '@/pages/Exam/Take';
import ExamHistoryPage from '@/pages/Exam/History';
import ExamResultDetailPage from '@/pages/Exam/Result';
import SubjectManagement from '@/pages/Subject';
import CategoryManagement from '@/pages/Category';
import KnowledgeManagement from '@/pages/Knowledge';
import UserManagement from '@/pages/User';
import TodoManagement from '@/pages/Todo';
import Home from '@/pages/Home';
import NotFound from '@/pages/NotFound';
import { UserProvider } from '@/contexts/UserContext';
import { MenuTreeDto, MenuType } from '@/types/menu';

/**
 * 检查用户是否有访问指定路径的权限
 * @param path 要检查的路径
 * @param menuTree 用户菜单树
 * @returns 是否有权限访问
 */
const hasMenuPermission = (path: string, menuTree: MenuTreeDto[]): boolean => {
  // 递归检查菜单树中是否包含指定路径
  const checkMenuTree = (menus: MenuTreeDto[]): boolean => {
    for (const menu of menus) {
      // 检查当前菜单项
      if (menu.menuType === MenuType.MENU && menu.url === path) {
        return true;
      }
      // 递归检查子菜单
      if (menu.children && menu.children.length > 0) {
        if (checkMenuTree(menu.children)) {
          return true;
        }
      }
    }
    return false;
  };

  return checkMenuTree(menuTree);
};

/**
 * 路由守卫组件
 * 检查登录状态，未登录则跳转至登录页
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const token = localStorage.getItem('token');
    if (!token) {
        return <Navigate to="/quiz/login" replace />;
    }
    return <>{children}</>;
};

/**
 * 菜单权限路由守卫组件
 * 检查用户是否有访问当前页面的菜单权限
 */
const MenuPermissionRoute: React.FC<{ 
  children: React.ReactNode; 
  requiredPath: string;
}> = ({ children, requiredPath }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/quiz/login" replace />;
  }

  // 获取用户菜单信息
  const menuInfoStr = localStorage.getItem('menuInfo');
  if (!menuInfoStr) {
    // 如果没有菜单信息，跳转到NotFound页面
    return <Navigate to="/quiz/frame" replace />;
  }

  try {
    const menuTree: MenuTreeDto[] = JSON.parse(menuInfoStr);
    
    // 检查是否有访问权限
    if (!hasMenuPermission(requiredPath, menuTree)) {
      return <Navigate to="/quiz/frame/notfound" replace />;
    }

    return <>{children}</>;
  } catch (error) {
    console.error('Failed to parse menu info:', error);
    return <Navigate to="/quiz/frame/notfound" replace />;
  }
};

/**
 * 需要登录访问的页面（不带Layout）
 */
const protectedPages = [
    { path: 'home', element: <Home />, requiredPath: 'home' },
    { path: 'user', element: <UserManagement />, requiredPath: 'user' },
    { path: 'role', element: <RoleManagement />, requiredPath: 'role' },
    { path: 'menu', element: <MenuManagement />, requiredPath: 'menu' },
    { path: 'subject', element: <SubjectManagement />, requiredPath: 'subject' },
    { path: 'category', element: <CategoryManagement />, requiredPath: 'category' },
    { path: 'knowledge', element: <KnowledgeManagement />, requiredPath: 'knowledge' },
    { path: 'question', element: <QuestionManagement />, requiredPath: 'question' },
    { path: 'datasource', element: <DatasourceManagement />, requiredPath: 'datasource' },
    { path: 'exam', element: <ExamManagement />, requiredPath: 'exam' },
    { path: 'todo', element: <TodoManagement />, requiredPath: 'todo' },
];

/**
 * 创建路由配置
 */
export const router = createBrowserRouter([
    // 登录页
    {
        path: '/quiz/login',
        element: (
            <UserProvider>
                <Login />
            </UserProvider>
        ),
    },

    // 主框架 + 内嵌页面
    {
        path: '/quiz/frame',
        element: (
            <UserProvider>
                <ProtectedRoute>
                    <Layout />
                </ProtectedRoute>
            </UserProvider>
        ),
        children: [
            ...protectedPages.map((route) => ({
                path: route.path,
                element: (
                    <MenuPermissionRoute requiredPath={route.requiredPath}>
                        {route.element}
                    </MenuPermissionRoute>
                ),
            })),
            // 默认重定向到home页面
            { path: '', element: <Navigate to="home" replace /> },
            // 非菜单页：考试作答页（需登录，但不校验菜单权限）
            { path: 'exam/take/:id', element: <ExamTakePage /> },
            // 非菜单页：历史答卷列表与详情
            { path: 'exam/results', element: <ExamHistoryPage /> },
            { path: 'exam/result/:id', element: <ExamResultDetailPage /> },
            { path: 'notfound', element: <NotFound /> },
        ],
    },

    // 404
    {
        path: '*',
        element: (
            <UserProvider>
                <ProtectedRoute>
                    <NotFound />
                </ProtectedRoute>
            </UserProvider>
        ),
    },
]);

export default router;
