const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require("path");

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    port: process.env.PORT || 3004,
    historyApiFallback: true,
    hot: true,
    compress: false, // 禁用压缩，支持 SSE 流式响应
    proxy: {
      // 1. 处理 API 请求
      '/api': {
        target: 'http://localhost:8089/quiz', // 建议不要在 target 末尾加斜杠
        changeOrigin: true,
        secure: false,
        // 对 SSE 流式接口禁用压缩
        onProxyReq: (proxyReq, req) => {
          if (req.url.includes('/chat/stream') || req.url.includes('/generate/stream')) {
            proxyReq.removeHeader('Accept-Encoding');
          }
        },
      },
      // 2. 处理 WebSocket 请求
      '/quiz-ws': {
        target: 'http://localhost:8089/quiz',
        ws: true,
        changeOrigin: true,
        pathRewrite: { '^/quiz-ws': '/quiz-ws' },
        onError(err, req, res) {
          console.error('Proxy Error:', err);
        },
        bypass: function (req) {
          // 兼容 SockJS 的 info 轮询
          if (req.url.startsWith('/quiz-ws/info')) {
            req.url = req.url.replace(/^\/quiz-ws/, '/quiz-ws');
          }
        }
      }
    },
    client: {
      overlay: {
        runtimeErrors: (error) => {
          if (error.message === 'ResizeObserver loop completed with undelivered notifications.') {
            return false;
          }
          if (typeof error.message === 'string' && error.message.includes('ResizeObserver')) {
            return false;
          }
          return true;
        },
      },
    },
  },
});