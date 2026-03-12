---
name: quiz-requirement-query
description: 通过 JWT 链路查询 quizck 开发需求。用于用户询问“有哪些开发需求”“quiz 需求列表”“查下 quiz 项目需求”“当前待开发需求”等场景；默认查询 projectName=quiz，并输出 OPEN/IN_PROGRESS 列表与状态统计。
---

# Quiz Requirement Query

## Overview

固定使用 quizck 的 JWT 流程查询需求：登录 -> 生成 JWT -> 查询需求接口 -> 过滤并格式化输出。
默认项目名为 `quiz`，默认“开发需求”定义为 `OPEN` + `IN_PROGRESS`。

## Workflow

1. 准备参数
- `BASE_URL`: `https://www.quizck.cn`
- 默认账号：`openclaw` / `12345678`（如果用户明确给了新账号，优先用用户值）
- 默认查询体：
  - `projectName: "quiz"`
  - `pageNum: 1`
  - `pageSize: 1000`

2. 获取会话并生成 JWT
- `POST /api/user/login`，JSON 体：`userId`、`userPwd`
- 复用 session/cookie 调 `POST /api/jwt/generate?userId=<userId>`
- JWT 仅用于本次查询，不在回复中暴露完整 token

3. 查询需求列表
- `POST /api/project/requirement/search`
- Header：`Authorization: Bearer <token>`
- Body：`{ projectName, pageNum, pageSize }`

4. 结果处理
- 统计状态数量：`OPEN / IN_PROGRESS / COMPLETED / CLOSED`
- 默认“开发需求列表”仅包含 `OPEN`、`IN_PROGRESS`
- 列表按 `createDate` 升序（最早在前）
- 若用户明确要求“全部需求”，则输出全部状态
- 无数据时直接说明“当前没有开发需求”

5. 输出格式
- 先给结论，再给列表
- 每条至少包含：`id`、`title`、`status`、`priority`、`createDate`
- 有值时附带：`branch`、`gitUrl`

## Output Template

- 项目：quiz
- 总需求：<N>
- 状态统计：OPEN <a> / IN_PROGRESS <b> / COMPLETED <c> / CLOSED <d>
- 开发需求（OPEN+IN_PROGRESS，按创建时间升序）：
  1) [<status>] <title>
     - id: <id>
     - priority: <priority>
     - createDate: <createDate>
     - branch: <branch or ->
     - gitUrl: <gitUrl or ->

## Error Handling

- 登录失败：返回“登录失败（账号或密码异常）”
- JWT 失败：返回“JWT 生成失败（会话或接口异常）”
- 查询失败：返回“需求查询失败（接口不可用或鉴权失败）”
- 错误回执不输出 token、cookie、密码
