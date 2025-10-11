import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '@/pages/Login/LoginWrapper';
import Layout from '@/components/Layout';
import RoleManagement from '@/pages/Role';
import MenuManagement from '@/pages/Menu';
import QuestionManagement from '@/pages/Question';
import ExamManagement from '@/pages/Exam';
import SubjectManagement from '@/pages/Subject';
import CategoryManagement from '@/pages/Category';
import KnowledgeManagement from '@/pages/Knowledge';
import UserManagement from '@/pages/User';
import NotFound from '@/pages/NotFound';
import { UserProvider } from '@/contexts/UserContext';

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
 * 需要登录访问的页面（不带Layout）
 */
const protectedPages = [
    { path: 'user', element: <UserManagement /> },
    { path: 'role', element: <RoleManagement /> },
    { path: 'menu', element: <MenuManagement /> },
    { path: 'subject', element: <SubjectManagement /> },
    { path: 'category', element: <CategoryManagement /> },
    { path: 'knowledge', element: <KnowledgeManagement /> },
    { path: 'question', element: <QuestionManagement /> },
    { path: 'exam', element: <ExamManagement /> },
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
            ...protectedPages,
            { path: 'notfound', element: <NotFound /> },
        ],
    },

    // 独立页面（无Layout）
    ...protectedPages.map((route) => ({
        path: `/quiz/${route.path}`,
        element: (
            <UserProvider>
                <ProtectedRoute>{route.element}</ProtectedRoute>
            </UserProvider>
        ),
    })),

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
