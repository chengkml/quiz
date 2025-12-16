/**
 * 全局导航管理器
 * 用于处理无法直接使用 useNavigate Hook 的场景（如 axios 拦截器）
 * 通过事件机制实现全局导航控制
 */

let navigationCallback: ((path: string) => void) | null = null;

/**
 * 注册导航回调函数
 * @param callback 导航回调函数
 */
export const registerNavigationCallback = (callback: (path: string) => void) => {
  navigationCallback = callback;
};

/**
 * 执行导航
 * @param path 目标路径
 */
export const navigate = (path: string) => {
  if (navigationCallback) {
    navigationCallback(path);
  } else {
    // 如果未注册回调，则使用 window.location.href 作为后备方案
    console.warn('Navigation callback not registered, falling back to window.location.href');
    window.location.href = path;
  }
};

/**
 * 监听全局导航事件
 */
export const setupNavigationListeners = () => {
  // 监听登录成功事件
  window.addEventListener('loginSuccess', (event: Event) => {
    const customEvent = event as CustomEvent;
    const { detail } = customEvent;
    console.log('Login success event received:', detail);
    // 导航到主页面
    navigate('/frame');
  });

  // 监听未授权事件
  window.addEventListener('unauthorized', () => {
    console.log('Unauthorized event received, redirecting to login');
    // 导航到登录页面
    navigate('/login');
  });
};

/**
 * 清理事件监听
 */
export const cleanupNavigationListeners = () => {
  window.removeEventListener('loginSuccess', (event: Event) => {});
  window.removeEventListener('unauthorized', () => {});
};
