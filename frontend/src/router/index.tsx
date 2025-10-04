import React from 'react';
import {createBrowserRouter, Navigate} from 'react-router-dom';
import Login from '@/pages/Login/LoginWrapper';
import Layout from '../components/Layout';
import UserManagement from '../pages/User';
import RoleManagement from '../pages/Role';
import MenuManagement from '../pages/Menu';
import QuestionManagement from '../pages/Question';
import ExamManagement from '../pages/Exam';
import SubjectManagement from '../pages/Subject';
import CategoryManagement from '../pages/Category';
import KnowledgeManagement from '../pages/Knowledge';
import NotFound from '../pages/NotFound';
import {UserProvider} from '../contexts/UserContext';

// 路由守卫组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({children}) => {
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
                <Login/>
            </UserProvider>
        ),
    },
    {
        path: '/user',
        element: (
            <ProtectedRoute>
                <UserManagement/>
            </ProtectedRoute>
        ),
    },
    {
        path: '/role',
        element: (
            <ProtectedRoute>
                <RoleManagement/>
            </ProtectedRoute>
        ),
    },
    {
        path: '/menu',
        element: (
            <ProtectedRoute>
                <MenuManagement/>
            </ProtectedRoute>
        ),
    },
    {
        path: '/question',
        element: (
            <ProtectedRoute>
                <QuestionManagement/>
            </ProtectedRoute>
        ),
    },
    {
        path: '/exam',
        element: (
            <ProtectedRoute>
                <ExamManagement/>
            </ProtectedRoute>
        ),
    },
    {
        path: '/subject',
        element: (
            <ProtectedRoute>
                <SubjectManagement/>
            </ProtectedRoute>
        ),
    },
    {
        path: '/category',
        element: (
            <ProtectedRoute>
                <CategoryManagement/>
            </ProtectedRoute>
        ),
    },
    {
        path: '/knowledge',
        element: (
            <ProtectedRoute>
                <KnowledgeManagement/>
            </ProtectedRoute>
        ),
    },
    // 带菜单的frame路由（保留用于需要Layout的页面）
    {
        path: '/quiz/frame',
        element: (
            <ProtectedRoute>
                <Layout/>
            </ProtectedRoute>
        ),
        children: [
            {
                path: 'user',
                element: <UserManagement/>,
            },
            {
                path: 'role',
                element: <RoleManagement/>,
            },
            {
                path: 'menu',
                element: <MenuManagement/>,
            },
            {
                path: 'question',
                element: <QuestionManagement/>,
            },
            {
                path: 'exam',
                element: <ExamManagement/>,
            },
            {
                path: 'subject',
                element: <SubjectManagement/>,
            },
            {
                path: 'category',
                element: <CategoryManagement/>,
            },
            {
                path: 'knowledge',
                element: <KnowledgeManagement/>,
            },
            {
                path: 'notfound',
                element: (
                    <NotFound/>
                ),
            }
        ],
    },
    // 默认重定向
    {
        path: '/',
        element: <Navigate to="/question" replace/>,
    },
    // 404页面
    {
        path: '*',
        element: (
            <ProtectedRoute>
                <NotFound/>
            </ProtectedRoute>
        ),
    },
]);

export default router;