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

## 需求管理（Requirement）

- 前端入口（需求列表页）
  - `frontend/src/pages/Requirement/index.tsx`
  - `frontend/src/pages/Requirement/api/index.ts`
- 后端 API 入口
  - `backend/src/main/java/com/ck/quiz/project/controller/RequirementController.java`
- 后端数据契约（列表字段/优先级映射）
  - `backend/src/main/java/com/ck/quiz/project/dto/RequirementDto.java`
  - `backend/src/main/java/com/ck/quiz/project/dto/RequirementQueryDto.java`
  - `backend/src/main/java/com/ck/quiz/project/entity/Requirement.java`

## 知识集与知识来源（KnowledgeSet / KnowledgeSource）

- 前端入口（知识来源配置）
  - `frontend/src/pages/KnowledgeSource/index.tsx`
  - `frontend/src/pages/KnowledgeSource/components/AddEditKnowledgeSourceModal.tsx`
  - `frontend/src/pages/KnowledgeSource/api/index.ts`
- 前端入口（知识集管理）
  - `frontend/src/pages/KnowledgeSet/index.tsx`
- 后端 API 入口
  - `backend/src/main/java/com/ck/quiz/knowledgeset/controller/KnowledgeSetController.java`
  - `backend/src/main/java/com/ck/quiz/knowledgeset/controller/KnowledgeSourceController.java`
  - `backend/src/main/java/com/ck/quiz/knowledgeset/controller/VectorController.java`
- 后端核心实现（来源入库/任务编排/文档处理）
  - `backend/src/main/java/com/ck/quiz/knowledgeset/entity/KnowledgeSource.java`
  - `backend/src/main/java/com/ck/quiz/knowledgeset/service/impl/KnowledgeSourceServiceImpl.java`
  - `backend/src/main/java/com/ck/quiz/knowledgeset/job/KnowledgeProcessingJob.java`
  - `backend/src/main/java/com/ck/quiz/knowledgeset/service/impl/VectorServiceImpl.java`
