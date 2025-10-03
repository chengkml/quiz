import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '../pages/login/LoginWrapper';
import Layout from '../components/Layout';
import Dashboard from '../pages/Dashboard';
import CatalogManagement from '../pages/catalog';
import DataSource from '../pages/datasource';
import UserManagement from '../pages/user';
import RoleManagement from '../pages/role';
import MenuManagement from '../pages/menu';
import MyApply from '../pages/myApply';
import QuestionManagement from '../pages/Question';
import SubjectManagement from '../pages/Subject';
import CategoryManagement from '../pages/Category';
import Dim from '../pages/DimMgr';

import About from '../pages/About';
import NotFound from '../pages/NotFound';
import { UserProvider } from '../contexts/UserContext';

// 路由守卫组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');

  // if (!token) {
  //   return <Navigate to="/quiz/login" replace />;
  // }

  return (
    <UserProvider>
      {children}
    </UserProvider>
  );
};

// 创建路由配置
export const router = createBrowserRouter([
  {
    path: '/quiz/login',
    element: (
      <UserProvider>
        <Login />
      </UserProvider>
    ),
  },
  {
    path: '/quiz/dim',
    element: (
        <UserProvider>
          <Dim />
        </UserProvider>
    ),
  },
  // 直接访问页面路由（不带Layout包装）
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/catalog',
    element: (
      <ProtectedRoute>
        <CatalogManagement />
      </ProtectedRoute>  
    ),  
  },
  {
    path: '/datasource',
    element: (
      <ProtectedRoute>
        <DataSource />
      </ProtectedRoute>
    ),
  },
  {
    path: '/user',
    element: (
      <ProtectedRoute>
        <UserManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: '/role',
    element: (
      <ProtectedRoute>
        <RoleManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: '/menu',
    element: (
      <ProtectedRoute>
        <MenuManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: '/myApply',
    element: (
      <ProtectedRoute>
        <MyApply />
      </ProtectedRoute>
    ),
  },
  {
    path: '/question',
    element: (
      <ProtectedRoute>
        <QuestionManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: '/subject',
    element: (
        <ProtectedRoute>
          <SubjectManagement />
        </ProtectedRoute>
    ),
  },
  {
    path: '/category',
    element: (
        <ProtectedRoute>
          <CategoryManagement />
        </ProtectedRoute>
    ),
  },
  {
    path: '/about',
    element: (
      <ProtectedRoute>
        <About />
      </ProtectedRoute>
    ),
  },
  // 带菜单的frame路由（保留用于需要Layout的页面）
  {
    path: '/quiz/frame',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'catalog',
        element: <CatalogManagement />,
      },
      {
        path: 'datasource',
        element: <DataSource />,
      },
      {
        path: 'user',
        element: <UserManagement />,
      },
      {
        path: 'role',
        element: <RoleManagement />,
      },
      {
        path: 'menu',
        element: <MenuManagement />,
      },
      {
        path: 'myApply',
        element: <MyApply />,
      },
      {
        path: 'question',
        element: <QuestionManagement />,
      },
      {
        path: 'subject',
        element: <SubjectManagement />,
      },
      {
        path: 'category',
        element: <CategoryManagement />,
      },
      {
        path: 'about',
        element: <About />,
      },
      {
        path: 'notfound',
        element: (
            <NotFound />
        ),
      }
    ],
  },
  // 默认重定向
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  // 404页面
  {
    path: '*',
    element: (
      <ProtectedRoute>
        <NotFound />
      </ProtectedRoute>
    ),
  },
]);

export default router;