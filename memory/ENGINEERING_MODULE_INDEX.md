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

## 需求开发技能（quiz-requirement-develop）

- 技能入口
  - `skills/quiz-requirement-develop/SKILL.md`
- 脚本实现
  - `skills/quiz-requirement-develop/scripts/develop_requirement.py`
- 运行时检查点
  - `skills/quiz-requirement-develop/runtime/auto-query-checkpoint.json`（默认检查点状态文件，可通过 `--checkpoint-file` 覆盖）
  - `skills/quiz-requirement-develop/runtime/*.events.jsonl`（检查点事件日志）
- 依赖接口
  - `backend/src/main/java/com/ck/quiz/project/controller/RequirementController.java`
  - `backend/src/main/java/com/ck/quiz/project/service/impl/RequirementServiceImpl.java`

## AI 助手与对话（Chat / GlobalAssistant）

- 前端入口（全局助手）
  - `frontend/src/components/Layout/index.tsx`
  - `frontend/src/components/GlobalAssistant/index.tsx`
  - `frontend/src/components/GlobalAssistant/style.less`
  - `frontend/src/components/ChatReferenceList/index.tsx`
- 前端入口（独立对话页）
  - `frontend/src/pages/Chat/index.tsx`
  - `frontend/src/pages/Chat/api/index.ts`
  - `frontend/src/router/index.tsx`
- 后端 API 入口
  - `backend/src/main/java/com/ck/quiz/chat/controller/ChatController.java`
- 后端核心实现（会话/消息/流式输出/RAG 钩子）
  - `backend/src/main/java/com/ck/quiz/chat/service/impl/ChatServiceImpl.java`
  - `backend/src/main/java/com/ck/quiz/chat/dto/ChatCompletionRequest.java`
  - `backend/src/main/java/com/ck/quiz/chat/entity/ChatSession.java`
  - `backend/src/main/java/com/ck/quiz/chat/entity/ChatMessage.java`

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

## 待办与日程管理（Todo / Calendar）

- 前端入口（待办页）
  - `frontend/src/pages/Todo/index.tsx`
  - `frontend/src/pages/Todo/api/index.ts`
- 前端入口（日程页）
  - `frontend/src/pages/Schedule/index.tsx`
  - `frontend/src/pages/Schedule/api/index.ts`
- 路由入口
  - `frontend/src/router/index.tsx`
- 后端 API 入口
  - `backend/src/main/java/com/ck/quiz/todo/controller/TodoController.java`
  - `backend/src/main/java/com/ck/quiz/calendar/controller/CalendarController.java`
- 后端核心实现（查询/同步/完成）
  - `backend/src/main/java/com/ck/quiz/todo/service/impl/TodoServiceImpl.java`
  - `backend/src/main/java/com/ck/quiz/calendar/service/impl/CalendarEventServiceImpl.java`
  - `backend/src/main/java/com/ck/quiz/todo/repository/TodoRepository.java`
  - `backend/src/main/java/com/ck/quiz/calendar/repository/CalendarEventRepository.java`
  - `backend/src/main/java/com/ck/quiz/todo/entity/Todo.java`
  - `backend/src/main/java/com/ck/quiz/calendar/entity/CalendarEvent.java`
- 过期扫描任务
  - `backend/src/main/java/com/ck/quiz/cron/service/TodoScheduleExpireService.java`
  - `backend/src/main/java/com/ck/quiz/cron/exec/TodoScheduleExpireScanTask.java`
  - `backend/src/main/java/com/ck/quiz/cron/exec/TodoScheduleExpireScanJob.java`
  - `backend/src/main/java/com/ck/quiz/cron/service/JobService.java`
- 数据库迁移
  - `backend/src/main/resources/db/migration/V202603211000__add_expire_time_to_todo_and_calendar_event.sql`

## 单词本（Vocabulary）

- 前端入口（单词本列表/复习页）
  - `frontend/src/pages/Vocabulary/index.tsx`
  - `frontend/src/pages/Vocabulary/Review.tsx`
  - `frontend/src/pages/Vocabulary/components/AddEditModal.tsx`
  - `frontend/src/pages/Vocabulary/api/index.ts`
- 路由入口
  - `frontend/src/router/index.tsx`
- 后端 API 入口
  - `backend/src/main/java/com/ck/quiz/vocabulary/controller/VocabularyCardController.java`
- 后端核心实现（查询/操作/复习）
  - `backend/src/main/java/com/ck/quiz/vocabulary/service/impl/VocabularyCardServiceImpl.java`
  - `backend/src/main/java/com/ck/quiz/vocabulary/repository/VocabularyCardRepository.java`
  - `backend/src/main/java/com/ck/quiz/vocabulary/entity/VocabularyCard.java`
  - `backend/src/main/java/com/ck/quiz/vocabulary/dto/VocabularyCardQueryDto.java`

## 文件管理（FileManager）

- 前端入口（文件管理页）
  - `frontend/src/pages/FileManager/index.tsx`
  - `frontend/src/pages/FileManager/components/DirectoryTree.tsx`
  - `frontend/src/pages/FileManager/api/index.ts`
  - `frontend/src/router/index.tsx`
- 后端 API 入口
  - `backend/src/main/java/com/ck/quiz/file/controller/FileController.java`
- 后端核心实现（元数据/路径处理/存储抽象）
  - `backend/src/main/java/com/ck/quiz/file/service/impl/FileServiceImpl.java`
  - `backend/src/main/java/com/ck/quiz/file/repository/FileMetadataRepository.java`
  - `backend/src/main/java/com/ck/quiz/file/entity/FileMetadata.java`
  - `backend/src/main/java/com/ck/quiz/file/service/FileStorageService.java`
  - `backend/src/main/java/com/ck/quiz/file/service/impl/LocalFileStorageService.java`
  - `backend/src/main/java/com/ck/quiz/file/service/impl/SftpFileStorageService.java`
  - `backend/src/main/java/com/ck/quiz/file/service/impl/S3FileStorageService.java`

## 统计中心（StatisticsCenter）

- 前端入口（路由/统计页/API）
  - `frontend/src/router/index.tsx`
  - `frontend/src/pages/StatisticsCenter/index.tsx`
  - `frontend/src/pages/StatisticsCenter/themes/QuestionBank/index.tsx`
  - `frontend/src/pages/StatisticsCenter/themes/VocabularyProficiency/index.tsx`
  - `frontend/src/pages/StatisticsCenter/themes/KnowledgeMastery/index.tsx`
  - `frontend/src/pages/StatisticsCenter/api/index.ts`
- 后端 API 入口
  - `backend/src/main/java/com/ck/quiz/statistics/controller/StatisticsController.java`
- 后端核心实现（主题注册/统计仪表盘）
  - `backend/src/main/java/com/ck/quiz/statistics/service/StatisticsThemeRegistry.java`
  - `backend/src/main/java/com/ck/quiz/statistics/service/impl/QuestionBankStatisticsServiceImpl.java`
  - `backend/src/main/java/com/ck/quiz/statistics/service/impl/VocabularyProficiencyStatisticsServiceImpl.java`
  - `backend/src/main/java/com/ck/quiz/statistics/service/impl/KnowledgeMasteryStatisticsServiceImpl.java`

## 家庭作业（Homework）

- 前端入口（作业列表页）
  - `frontend/src/pages/Homework/index.tsx`
  - `frontend/src/pages/Homework/api/index.ts`
- 路由入口
  - `frontend/src/router/index.tsx`
- 后端 API 入口
  - `backend/src/main/java/com/ck/quiz/homework/controller/HomeworkController.java`
- 后端核心实现（查询/详情/更新/删除/待办生成）
  - `backend/src/main/java/com/ck/quiz/homework/service/impl/HomeworkServiceImpl.java`
  - `backend/src/main/java/com/ck/quiz/homework/repository/HomeworkRepository.java`
  - `backend/src/main/java/com/ck/quiz/homework/entity/Homework.java`
  - `backend/src/main/java/com/ck/quiz/homework/dto/HomeworkQueryDto.java`

## 生字本（Character）

- 前端入口（生字列表/复习页）
  - `frontend/src/pages/Character/index.tsx`
  - `frontend/src/pages/Character/Review.tsx`
  - `frontend/src/pages/Character/components/AddEditModal.tsx`
  - `frontend/src/pages/Character/api/index.ts`
- 路由入口
  - `frontend/src/router/index.tsx`
- 后端 API 入口
  - `backend/src/main/java/com/ck/quiz/character/controller/CharacterCardController.java`
- 后端核心实现（查询/操作/复习）
  - `backend/src/main/java/com/ck/quiz/character/service/impl/CharacterCardServiceImpl.java`
  - `backend/src/main/java/com/ck/quiz/character/repository/CharacterCardRepository.java`
  - `backend/src/main/java/com/ck/quiz/character/entity/CharacterCard.java`
  - `backend/src/main/java/com/ck/quiz/character/dto/CharacterCardQueryDto.java`

## 诗词本（Poetry）

- 前端入口（诗词列表页）
  - `frontend/src/pages/Poetry/index.tsx`
  - `frontend/src/pages/Poetry/components/AddEditModal.tsx`
  - `frontend/src/pages/Poetry/api/index.ts`
- 路由入口
  - `frontend/src/router/index.tsx`
- 后端 API 入口
  - `backend/src/main/java/com/ck/quiz/poetry/controller/PoetryCardController.java`
- 后端核心实现（查询/操作/复习）
  - `backend/src/main/java/com/ck/quiz/poetry/service/impl/PoetryCardServiceImpl.java`
  - `backend/src/main/java/com/ck/quiz/poetry/repository/PoetryCardRepository.java`
  - `backend/src/main/java/com/ck/quiz/poetry/entity/PoetryCard.java`
  - `backend/src/main/java/com/ck/quiz/poetry/dto/PoetryCardQueryDto.java`
