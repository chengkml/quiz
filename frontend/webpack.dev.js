const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require("path");

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  output: {
    publicPath: '/',
  },
  devServer: {
    port: process.env.PORT || 3001,
    historyApiFallback: true,
    hot: true,
    open: true,
    proxy: {
      '/quiz/api': {
        target: 'http://localhost:8089/', // 后端API服务器地址
        changeOrigin: true,
        secure: false, // 如果是https接口，需要配置这个参数
        cookieDomainRewrite: 'localhost', // 重写cookie域名
        cookiePathRewrite: '/', // 重写cookie路径
      }
    },
  },
});