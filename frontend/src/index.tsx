import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@arco-design/web-react/dist/css/arco.css';

// 抑制 ResizeObserver 警告
const resizeObserverErrorHandler = (e: ErrorEvent) => {
  if (e.message === 'ResizeObserver loop completed with undelivered notifications.') {
    e.stopImmediatePropagation();
    return;
  }
};

// 处理未捕获的Promise rejection
const resizeObserverRejectionHandler = (e: PromiseRejectionEvent) => {
  if (e.reason && e.reason.message === 'ResizeObserver loop completed with undelivered notifications.') {
    e.preventDefault();
    return;
  }
};

// 重写console.error以过滤ResizeObserver警告
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const message = args[0];
  if (typeof message === 'string' && message.includes('ResizeObserver loop completed with undelivered notifications')) {
    return; // 不输出ResizeObserver相关的错误
  }
  originalConsoleError.apply(console, args);
};

window.addEventListener('error', resizeObserverErrorHandler);
window.addEventListener('unhandledrejection', resizeObserverRejectionHandler);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <App />
);