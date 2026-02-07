// 导入必要的模块和组件
import React from "react";
import { createBrowserRouter, Navigate, useNavigate } from "react-router-dom";
import { Spin } from "@arco-design/web-react";
import Login from "@/pages/Login/LoginWrapper";
import Layout from "@/components/Layout";
import RoleManagement from "@/pages/Role";
import MenuManagement from "@/pages/Menu";
import QuestionManagement from "@/pages/Question";
import DatasourceManagement from "@/pages/Datasource";
import ExamManagement from "@/pages/Exam";
import ExamTakePage from "@/pages/Exam/Take";
import ExamDetailPage from "@/pages/Exam/Detail";
import ExamHistoryPage from "@/pages/Exam/History";
import ExamResultDetailPage from "@/pages/Exam/History/Detail";
import SubjectManagement from "@/pages/Subject";
import SysLogManagement from "@/pages/SysLog";
import CategoryManagement from "@/pages/Category";
import KnowledgeManagement from "@/pages/Knowledge";
import UserManagement from "@/pages/User";
import TodoManagement from "@/pages/Todo";
import GroupManagement from "@/pages/Group";
import DocManagement from "@/pages/DocMgr";
import FileManager from "@/pages/FileManager";
import ScheduleManagement from "@/pages/Schedule";
import ScriptManagement from "@/pages/Script";
import JobQueueManagement from "@/pages/JobQueue";
import JobManager from "@/pages/Job";
import ExamHistoryManager from "@/pages/Exam/History";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";
import MindMapPage from "@/pages/MindMap";
import MindMapEditPage from "@/pages/MindMap/Edit";
import { UserProvider, useUser } from "@/contexts/UserContext";
import { MenuTreeDto, MenuType } from "@/types/menu";
import Model from "@/pages/LlmModel";
import TokenUsagePage from "@/pages/TokenUsage";
import FuncDocManager from "@/pages/FuncDoc";
import FuncDocDetail from "@/pages/FuncDoc/Detail";
import FuncDocFeatures from "@/pages/FuncDoc/Features";
import PromptTemplateManagement from "@/pages/Prompt";
import CronTask from "@/pages/CronTask";
import FileDetector from "@/pages/FileDetector";
import MermaidMgr from "@/pages/MermaidMgr";
import MermaidFromMgr from "@/pages/Mermaid/FromMgr";
import OcrPage from "@/pages/Ocr";
import WxAppManager from "@/pages/WxApp";
import MdResolvePage from "@/pages/MdResolve";
import MdConvertPage from "@/pages/MdConvert";
import ChatPage from "@/pages/Chat";
import NotificationPage from "@/pages/Notification/Page";
import ExceptionLogPage from "@/pages/Notification/ExceptionLogPage";
import SystemMessagePage from "@/pages/SystemMessage";
import SystemParamManagement from "@/pages/SystemParam";
import McpServerManager from "@/pages/McpServer";
import McpToolManager from "@/pages/McpTool";
import KnowledgeSetManager from "@/pages/KnowledgeSet";
import KnowledgeSourceManager from "@/pages/KnowledgeSource";
import SimpleExample from "@/components/DataManager/docs/EXAMPLE";
import AdvancedExample from "@/components/DataManager/docs/ADVANCED_EXAMPLE";
import OrchestrationManager from "@/pages/Orchestration";
import CanvasEditor from "@/pages/Orchestration/CanvasEditor";
import PasswordManager from "@/pages/PasswordManager";
import PersonalKnowledge from "@/pages/PersonalKnowledge";
import DataQuery from "@/pages/DataQuery";
import JwtGenerator from "@/pages/JwtGenerator";
import ApiTester from "@/pages/ApiTester";
import TagManager from "@/pages/Tag";
import {
  registerNavigationCallback,
  setupNavigationListeners,
} from "@/utils/navigationManager";
import { useEffect } from "react";

/**
 * 全局导航处理组件 - 处理来自拦截器的全局导航事件
 */
const NavigationHandler: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    // 注册全局导航回调
    registerNavigationCallback((path: string) => {
      navigate(path);
    });

    // 设置事件监听器
    setupNavigationListeners();

    return () => {
      // 清理事件监听器
    };
  }, [navigate]);

  return <>{children}</>;
};

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
      // 检查当前菜单项是否匹配
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
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const token = localStorage.getItem("token");
  if (!token) {
    // 如果未登录，跳转到登录页
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const MenuPermissionRoute: React.FC<{
  children: React.ReactNode;
  requiredPath: string;
}> = ({ children, requiredPath }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    // 如果未登录，跳转到登录页
    return <Navigate to="/login" replace />;
  }

  const { menuLoading, menuTree } = useUser();

  // 如果正在加载菜单，或者菜单未初始化，显示加载中
  if (menuLoading || menuTree === null) {
    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px'
        }}>
            <Spin dot />
        </div>
    );
  }

  // 如果菜单为空数组（已加载完但无菜单），则认为无权限或获取失败
  if (menuTree.length === 0) {
      // 尝试从localStorage兜底读取（以防context未及时更新但storage有值的情况）
      // 这里主要信赖Context，但保留兼容逻辑
      const menuInfoStr = localStorage.getItem("menuInfo");
      if (!menuInfoStr) {
          return <Navigate to="/frame/notfound" replace />;
      }
  }

  // 检查是否有访问权限 (如果有需要，可以取消注释并启用严格权限检查)
  /*
  const hasPermission = hasMenuPermission(requiredPath, menuTree);
  if (!hasPermission) {
    return <Navigate to="/frame/notfound" replace />;
  }
  */

  return <>{children}</>;
};

/**
 * 需要登录访问的页面（不带Layout）
 */
const protectedPages = [
  { path: "home", element: <Home />, requiredPath: "home" },
  { path: "user", element: <UserManagement />, requiredPath: "user" },
  { path: "role", element: <RoleManagement />, requiredPath: "role" },
  { path: "menu", element: <MenuManagement />, requiredPath: "menu" },
  { path: "subject", element: <SubjectManagement />, requiredPath: "subject" },
  { path: "syslog", element: <SysLogManagement />, requiredPath: "syslog" },
  {
    path: "category",
    element: <CategoryManagement />,
    requiredPath: "category",
  },
  {
    path: "knowledge",
    element: <KnowledgeManagement />,
    requiredPath: "knowledge",
  },
  {
    path: "question",
    element: <QuestionManagement />,
    requiredPath: "question",
  },
  {
    path: "datasource",
    element: <DatasourceManagement />,
    requiredPath: "datasource",
  },
  { path: "exam", element: <ExamManagement />, requiredPath: "exam" },
  { path: "todo", element: <TodoManagement />, requiredPath: "todo" },
  { path: "group", element: <GroupManagement />, requiredPath: "group" },
  { path: "doc", element: <DocManagement />, requiredPath: "doc" },
  { path: "file-manager", element: <FileManager />, requiredPath: "file-manager" },
  {
    path: "schedule",
    element: <ScheduleManagement />,
    requiredPath: "schedule",
  },
  { path: "script", element: <ScriptManagement />, requiredPath: "script" },
  {
    path: "jobqueue",
    element: <JobQueueManagement />,
    requiredPath: "jobqueue",
  },
  { path: "job", element: <JobManager />, requiredPath: "job" },
  { path: "history", element: <ExamHistoryManager />, requiredPath: "history" },
  { path: "llmmodel", element: <Model />, requiredPath: "llmmodel" },
  { path: "token-usage", element: <TokenUsagePage />, requiredPath: "token-usage" },
  { path: "mindmap", element: <MindMapPage />, requiredPath: "mindmap" },
  { path: "FuncDoc", element: <FuncDocManager />, requiredPath: "funcDoc" },
  {
    path: "prompt",
    element: <PromptTemplateManagement />,
    requiredPath: "prompt",
  },
  { path: "cron", element: <CronTask />, requiredPath: "cron" },
  {
    path: "filedetector",
    element: <FileDetector />,
    requiredPath: "filedetector",
  },
  { path: "mermaid-mgr", element: <MermaidMgr />, requiredPath: "mermaid-mgr" },
  { path: "ocr", element: <OcrPage />, requiredPath: "ocr" },
  { path: "mdresolve", element: <MdResolvePage />, requiredPath: "mdresolve" },
  { path: "mdconvert", element: <MdConvertPage />, requiredPath: "mdconvert" },
  { path: "wxapp", element: <WxAppManager />, requiredPath: "wxapp" },
  { path: "chat", element: <ChatPage />, requiredPath: "chat" },
  {
    path: "notification",
    element: <NotificationPage />,
    requiredPath: "notification",
  },
  {
    path: "notification-exception",
    element: <ExceptionLogPage />,
    requiredPath: "notification",
  },
  {
    path: "systemmessage",
    element: <SystemMessagePage />,
    requiredPath: "systemmessage",
  },
  {
    path: "systemparam",
    element: <SystemParamManagement />,
    requiredPath: "systemparam",
  },
  {
    path: "knowledge-set",
    element: <KnowledgeSetManager />,
    requiredPath: "knowledge-set",
  },
  {
    path: "mcp-server",
    element: <McpServerManager />,
    requiredPath: "mcp-server",
  },
  {
    path: "mcp-tool",
    element: <McpToolManager />,
    requiredPath: "mcp-tool",
  },
  {
    path: "orchestration",
    element: <OrchestrationManager />,
    requiredPath: "orchestration",
  },
  {
    path: "example",
    element: <SimpleExample />,
    requiredPath: "example",
  },
  {
    path: "advanced-example",
    element: <AdvancedExample />,
    requiredPath: "advanced-example",
  },
  {
    path: "password",
    element: <PasswordManager />,
    requiredPath: "password",
  },
  {
    path: "personal-knowledge",
    element: <PersonalKnowledge />,
    requiredPath: "personal-knowledge",
  },
  {
    path: "data-query",
    element: <DataQuery />,
    requiredPath: "data-query",
  },
  {
    path: "jwt-generator",
    element: <JwtGenerator />,
    requiredPath: "jwt-generator",
  },
  {
    path: "api-tester",
    element: <ApiTester />,
    requiredPath: "api-tester",
  },
  {
    path: "tag",
    element: <TagManager />,
    requiredPath: "tag",
  },
];


/**
 * 创建路由配置
 */
declare const __APP_BASE_PATH__: string;

const basename = __APP_BASE_PATH__ || "/";
export const router = createBrowserRouter(
  [
    // 登录页 - 包装在NavigationHandler中以支持登录成功后的导航
    {
      path: "/login",
      element: (
        <NavigationHandler>
          <UserProvider>
            <Login />
          </UserProvider>
        </NavigationHandler>
      ),
    },

    // 独立访问的页面路由（不带Layout框架）
    ...protectedPages.map((route) => ({
      path: `/${route.path}`,
      element: (
        <NavigationHandler>
          <UserProvider>
            <ProtectedRoute>
              <MenuPermissionRoute requiredPath={route.requiredPath}>
                {route.element}
              </MenuPermissionRoute>
            </ProtectedRoute>
          </UserProvider>
        </NavigationHandler>
      ),
    })),

    // 主框架 + 内嵌页面 - 包装在NavigationHandler中以支持未授权时的导航
    {
      path: "/frame",
      element: (
        <NavigationHandler>
          <UserProvider>
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          </UserProvider>
        </NavigationHandler>
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
        { path: "", element: <Navigate to="home" replace /> },
        // 非菜单页：考试作答页和详情页（需登录，但不校验菜单权限）
        { path: "exam/take/:id", element: <ExamTakePage /> },
        { path: "exam/detail/:id", element: <ExamDetailPage /> },
        { path: "history/result/:id", element: <ExamResultDetailPage /> },
        // 非菜单页：历史答卷列表与详情
        { path: "history", element: <ExamHistoryPage /> },
        // 非菜单页：思维导图编辑页
        { path: "mindmap/edit", element: <MindMapEditPage /> },
        { path: "mindmap/edit/:id", element: <MindMapEditPage /> },
        { path: "mermaid-mgr/:id", element: <MermaidFromMgr /> },
        { path: "orchestration/edit/:id", element: <CanvasEditor /> },
        { path: "knowledge-set/:id/sources", element: <KnowledgeSourceManager /> },
        // 非菜单页：文档详情页和功能点页
        { path: "funcDoc/detail/:id", element: <FuncDocDetail /> },
        { path: "funcDoc/features/:id", element: <FuncDocFeatures /> },
        { path: "notfound", element: <NotFound /> },
      ],
    },

    // 404页面
    {
      path: "*",
      element: (
        <UserProvider>
          <ProtectedRoute>
            <NotFound />
          </ProtectedRoute>
        </UserProvider>
      ),
    },
  ],
  {
    basename,
  }
);

export default router;
