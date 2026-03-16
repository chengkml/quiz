# ENGINEERING MODULE INDEX

## 通知与邮件发送

- 前端入口（通知页）
  - `frontend/src/pages/Notification/Page.tsx`
  - `frontend/src/pages/Notification/api.ts`
- 后端 API 入口
  - `backend/src/main/java/com/ck/quiz/notification/controller/NotificationController.java`
- 发送任务编排
  - `backend/src/main/java/com/ck/quiz/notification/service/impl/NotificationServiceImpl.java`
  - `backend/src/main/java/com/ck/quiz/cron/exec/NotificationJob.java`
  - `backend/src/main/java/com/ck/quiz/notification/service/NotificationDispatcher.java`
- 邮件通道实现
  - `backend/src/main/java/com/ck/quiz/notification/service/impl/EmailChannel.java`
  - `backend/src/main/java/com/ck/quiz/notification/service/NotificationChannelType.java`
- SMTP 配置来源
  - `backend/src/main/java/com/ck/quiz/config/MailConfig.java`
  - `backend/src/main/java/com/ck/quiz/init/DbDataInitializer.java`（初始化 `mail.*` 参数）

## 其他邮件发送调用点

- 密码查看验证码邮件
  - `backend/src/main/java/com/ck/quiz/password/service/PasswordService.java`（`sendViewSalt`）
