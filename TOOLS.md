# TOOLS.md - Quiz 本地工具与命令速查

仅记录本仓库可直接用的本地事实，不写通用废话。

## 环境事实

- Workspace: `/root/.openclaw/workspace/quiz`
- Java: `17`
- Node: `>=22.22.0`（见 `frontend/package.json`）
- 后端端口/上下文：`8089` + `/quiz`
- 前端开发端口：默认 `3004`
- API 代理：`/api -> http://localhost:8089/quiz`

## 常用命令

- 后端编译：`cd backend && gradle classes`
- 后端测试：`cd backend && gradle test`
- 后端运行（本地）：`cd backend && gradle bootRun`
- 前端开发：`cd frontend && npm run start`
- 前端构建：`cd frontend && npm run build`

## 联调检查

- 后端健康：`curl -sS http://localhost:8089/quiz/actuator/health`
- 查看需求接口（需登录态）：`/api/project/requirement/search`
- 前端需求页路由：`/frame/requirement`

## 检索习惯

- 优先 `rg` / `rg --files`。
- 若环境无 `rg`，使用 `grep -R` + `find` 兜底。

## 部署脚本（服务器路径）

- 启动脚本：`backend/start.sh`（默认 `/opt/quiz`）
- 停止脚本：`backend/stop.sh`
- 生产日志：`/opt/quiz/logs/quiz.log`
