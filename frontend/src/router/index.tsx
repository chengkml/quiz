import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '../pages/login/LoginWrapper';
import Layout from '../components/Layout';
import Dashboard from '../pages/Dashboard';
import Datasets from '../pages/datasets';
import CatalogManagement from '../pages/catalog';
import DataSource from '../pages/datasource';
import SynthesizerManagement from '../pages/synthesizers';
import SystemManagement from '../pages/SystemManagement';
import UserManagement from '../pages/user';
import RoleManagement from '../pages/role';
import MenuManagement from '../pages/menu';
import TeamManagement from '../pages/team';
import MyApply from '../pages/myApply';

import About from '../pages/About';
import NotFound from '../pages/NotFound';
import { UserProvider } from '../contexts/UserContext';

// 路由守卫组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/data_synth/login" replace />;
  }

  return (
    <UserProvider>
      {children}
    </UserProvider>
  );
};

// 创建路由配置
export const router = createBrowserRouter([
  {
    path: '/data_synth/login',
    element: (
      <UserProvider>
        <Login />
      </UserProvider>
    ),
  },
  // 带菜单的frame路由
  {
    path: '/data_synth/frame',
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
        path: 'dataset',
        element: <Datasets />,
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
        path: 'synthesizers',
        element: <SynthesizerManagement />,
      },
      {
        path: 'system',
        element: <SystemManagement />,
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
        path: 'team',
        element: <TeamManagement />,
      },
      {
        path: 'myApply',
        element: <MyApply />,
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
  // 不带菜单的直接页面路由
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
    path: '/synthesizers',
    element: (
      <ProtectedRoute>
        <SynthesizerManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: '/system',
    element: (
      <ProtectedRoute>
        <SystemManagement />
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
    path: '/team',
    element: (
      <ProtectedRoute>
        <TeamManagement />
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
    path: '/about',
    element: (
      <ProtectedRoute>
        <About />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: (
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
    ),
    children: [
        {
            path: '*',
            element: (
                <UserProvider>
                    <NotFound />
                </UserProvider>
            ),
        }
    ]
  },
]);

export default router;