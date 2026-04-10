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

## 密钥管理（PasswordManager）

- 前端入口
  - `frontend/src/pages/PasswordManager/index.tsx`
  - `frontend/src/pages/PasswordManager/api.ts`
- 后端 API 入口
  - `backend/src/main/java/com/ck/quiz/password/controller/PasswordController.java`
- 后端核心实现（列表/新增编辑/验证码查看/历史密文迁移）
  - `backend/src/main/java/com/ck/quiz/password/service/PasswordService.java`
  - `backend/src/main/java/com/ck/quiz/password/repository/PasswordRepository.java`
  - `backend/src/main/java/com/ck/quiz/password/entity/PasswordEntry.java`
- 数据契约
  - `backend/src/main/java/com/ck/quiz/password/dto/PasswordCreateDto.java`
  - `backend/src/main/java/com/ck/quiz/password/dto/PasswordUpdateDto.java`
  - `backend/src/main/java/com/ck/quiz/password/dto/PasswordDto.java`
  - `backend/src/main/java/com/ck/quiz/password/dto/PasswordQueryDto.java`
- 加解密工具
  - `backend/src/main/java/com/ck/quiz/utils/EncryptUtil.java`

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
- 顶部筛选复用链路（项目名下拉）
  - `frontend/src/components/FilterForm/index.tsx`
  - `frontend/src/components/utils/filterFormUtils.tsx`
  - `frontend/src/components/types/types.ts`
  - `backend/src/main/java/com/ck/quiz/project/service/impl/RequirementServiceImpl.java`（`history-options` 数据来源）

## 代码审核（CodeReview）

- 前端入口（代码审核任务页 + 任务详情内审核明细）
  - `frontend/src/pages/CodeReview/index.tsx`
  - `frontend/src/pages/CodeReview/api/index.ts`
  - `frontend/src/pages/CodeReview/style/index.less`
- 路由入口
  - `frontend/src/router/index.tsx`（`/frame/code-review`）
- 后端 API 入口
  - `backend/src/main/java/com/ck/quiz/codereview/controller/CodeReviewTaskController.java`
  - `backend/src/main/java/com/ck/quiz/codereview/controller/CodeReviewIssueController.java`
- 后端任务模型（任务列表 / 详情 / 状态流转 / 历史选项）
  - `backend/src/main/java/com/ck/quiz/codereview/entity/CodeReviewTask.java`
  - `backend/src/main/java/com/ck/quiz/codereview/dto/CodeReviewTaskCreateDto.java`
  - `backend/src/main/java/com/ck/quiz/codereview/dto/CodeReviewTaskUpdateDto.java`
  - `backend/src/main/java/com/ck/quiz/codereview/dto/CodeReviewTaskQueryDto.java`
  - `backend/src/main/java/com/ck/quiz/codereview/dto/CodeReviewTaskDto.java`
  - `backend/src/main/java/com/ck/quiz/codereview/dto/CodeReviewTaskHistoryOptionsDto.java`
  - `backend/src/main/java/com/ck/quiz/codereview/service/impl/CodeReviewTaskServiceImpl.java`
  - `backend/src/main/java/com/ck/quiz/codereview/repository/CodeReviewTaskRepository.java`
- 后端审核明细模型（挂任务 / 查询 / 转需求）
  - `backend/src/main/java/com/ck/quiz/codereview/service/impl/CodeReviewIssueServiceImpl.java`
  - `backend/src/main/java/com/ck/quiz/codereview/dto/CodeReviewIssueQueryDto.java`
  - `backend/src/main/java/com/ck/quiz/codereview/entity/CodeReviewIssue.java`
  - `backend/src/main/java/com/ck/quiz/codereview/repository/CodeReviewIssueRepository.java`
- 数据库迁移
  - `backend/src/main/resources/db/migration/V202604051430__refactor_code_review_to_task_issue.sql`
- 通用分页与查询基座
  - `backend/src/main/java/com/ck/quiz/base/dto/QueryDto.java`
  - `backend/src/main/java/com/ck/quiz/utils/JdbcQueryHelper.java`

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

## MCP 服务器与工具管理（McpServer / McpTool）

- 前端入口（MCP 服务器管理）
  - `frontend/src/pages/McpServer/index.tsx`
  - `frontend/src/pages/McpServer/api/index.ts`
- 前端入口（MCP 工具管理）
  - `frontend/src/pages/McpTool/index.tsx`
  - `frontend/src/pages/McpTool/api/index.ts`
- 后端 API 入口
  - `backend/src/main/java/com/ck/quiz/mcp/controller/McpServerController.java`
  - `backend/src/main/java/com/ck/quiz/mcp/controller/McpToolController.java`
- 后端核心实现（SSE 握手 / initialize / tools/list / tools/call / 健康检查）
  - `backend/src/main/java/com/ck/quiz/mcp/service/impl/McpServerServiceImpl.java`
  - `backend/src/main/java/com/ck/quiz/mcp/service/impl/McpToolServiceImpl.java`
- 数据实体与仓储
  - `backend/src/main/java/com/ck/quiz/mcp/entity/McpServer.java`
  - `backend/src/main/java/com/ck/quiz/mcp/entity/McpTool.java`
  - `backend/src/main/java/com/ck/quiz/mcp/repository/McpServerRepository.java`
  - `backend/src/main/java/com/ck/quiz/mcp/repository/McpToolRepository.java`

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

## 诗词本（Poetry）

- 前端入口（诗词列表/复习页）
  - `frontend/src/pages/Poetry/index.tsx`
  - `frontend/src/pages/Poetry/Review.tsx`
  - `frontend/src/pages/Poetry/components/AddEditModal.tsx`
  - `frontend/src/pages/Poetry/api/index.ts`
  - `frontend/src/pages/Poetry/style/index.less`
- 路由入口
  - `frontend/src/router/index.tsx`
- 后端 API 入口
  - `backend/src/main/java/com/ck/quiz/poetry/controller/PoetryCardController.java`
- 后端核心实现（查询/操作/复习/用户隔离）
  - `backend/src/main/java/com/ck/quiz/poetry/service/impl/PoetryCardServiceImpl.java`
  - `backend/src/main/java/com/ck/quiz/poetry/repository/PoetryCardRepository.java`
  - `backend/src/main/java/com/ck/quiz/poetry/entity/PoetryCard.java`
  - `backend/src/main/java/com/ck/quiz/poetry/dto/PoetryCardQueryDto.java`

## 热搜与关注主题（HotSearch）

- 前端入口（热搜页）
  - `frontend/src/pages/HotSearch/index.tsx`
  - `frontend/src/pages/HotSearch/api.ts`
  - `frontend/src/pages/HotSearch/style/index.less`
- 路由入口
  - `frontend/src/router/index.tsx`
- 后端 API 入口
  - `backend/src/main/java/com/ck/quiz/hotsearch/controller/HotSearchController.java`
  - `backend/src/main/java/com/ck/quiz/hotsearch/controller/HotSearchFollowTopicController.java`
- 后端核心实现（导入/查询/关注主题命中/用户隔离）
  - `backend/src/main/java/com/ck/quiz/hotsearch/service/impl/HotSearchServiceImpl.java`
  - `backend/src/main/java/com/ck/quiz/hotsearch/service/impl/HotSearchFollowTopicServiceImpl.java`
  - `backend/src/main/java/com/ck/quiz/hotsearch/repository/HotSearchRecordRepository.java`
  - `backend/src/main/java/com/ck/quiz/hotsearch/repository/HotSearchFollowTopicRepository.java`
- 数据实体与契约
  - `backend/src/main/java/com/ck/quiz/hotsearch/entity/HotSearchRecord.java`
  - `backend/src/main/java/com/ck/quiz/hotsearch/entity/HotSearchFollowTopic.java`
  - `backend/src/main/java/com/ck/quiz/hotsearch/dto/HotSearchQueryDto.java`
  - `backend/src/main/java/com/ck/quiz/hotsearch/dto/HotSearchRecordDto.java`
  - `backend/src/main/java/com/ck/quiz/hotsearch/dto/HotSearchFollowTopicDto.java`
  - `backend/src/main/java/com/ck/quiz/hotsearch/dto/HotSearchFollowTopicCreateDto.java`
  - `backend/src/main/java/com/ck/quiz/hotsearch/dto/HotSearchFollowTopicUpdateDto.java`
  - `backend/src/main/java/com/ck/quiz/hotsearch/dto/HotSearchFollowTopicQueryDto.java`
- 数据库迁移
  - `backend/src/main/resources/db/migration/V202603262255__create_hot_search_record_table.sql`
  - `backend/src/main/resources/db/migration/V202604042140__create_hot_search_follow_topic_table.sql`

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

## 百度网盘（BaiduPan）

- 前端入口（百度网盘壳页面）
  - `frontend/src/pages/BaiduPan/index.tsx`
  - `frontend/src/pages/BaiduPan/components/DirectoryTree.tsx`
  - `frontend/src/pages/BaiduPan/api.ts`
  - `frontend/src/pages/BaiduPan/style/index.less`
  - `frontend/src/router/index.tsx`
- 后端 API 入口
  - `backend/src/main/java/com/ck/quiz/baidupan/controller/BaiduPanController.java`
  - `backend/src/main/java/com/ck/quiz/baidupan/controller/BaiduPanOpenController.java`
- 后端核心实现（当前为接入壳；system param 已接入，真实 OAuth/文件接口未接通）
  - `backend/src/main/java/com/ck/quiz/baidupan/service/BaiduPanService.java`
  - `backend/src/main/java/com/ck/quiz/baidupan/service/impl/BaiduPanServiceImpl.java`
  - `backend/src/main/java/com/ck/quiz/baidupan/exception/BaiduPanException.java`
  - `backend/src/main/java/com/ck/quiz/baidupan/exception/BaiduPanExceptionHandler.java`
  - `backend/src/main/java/com/ck/quiz/baidupan/dto/BaiduPanAuthStatusDto.java`
  - `backend/src/main/java/com/ck/quiz/baidupan/dto/BaiduPanAuthorizeUrlDto.java`
  - `backend/src/main/java/com/ck/quiz/baidupan/dto/BaiduPanFileItemDto.java`
  - `backend/src/main/java/com/ck/quiz/baidupan/dto/BaiduPanCreateFolderRequest.java`
  - `backend/src/main/java/com/ck/quiz/baidupan/dto/BaiduPanRenameRequest.java`
  - `backend/src/main/java/com/ck/quiz/baidupan/dto/BaiduPanDeleteRequest.java`
  - `backend/src/main/java/com/ck/quiz/baidupan/dto/BaiduPanMoveRequest.java`
  - `backend/src/main/java/com/ck/quiz/init/DbDataInitializer.java`
  - `backend/src/main/resources/db/migration/V202604050900__add_baidu_pan_menu.sql`

## Markdown 转换（MdConvert / 文件转 Markdown）

- 前端入口（Markdown 转换页）
  - `frontend/src/pages/MdConvert/index.tsx`
  - `frontend/src/services/mdConvertService.ts`
- 后端 API 入口
  - `backend/src/main/java/com/ck/quiz/mdconvert/controller/MdConvertController.java`
  - `backend/src/main/java/com/ck/quiz/controller/DocumentConversionController.java`
- 后端核心实现（Markdown 导出 / 文件转 Markdown）
  - `backend/src/main/java/com/ck/quiz/mdconvert/service/MdConvertService.java`
  - `backend/src/main/java/com/ck/quiz/service/converter/DocumentConverter.java`
  - `backend/src/main/java/com/ck/quiz/service/converter/impl/WordConverter.java`
  - `backend/src/main/java/com/ck/quiz/service/converter/impl/PdfConverter.java`
  - `backend/src/main/java/com/ck/quiz/service/converter/impl/ExcelConverter.java`
  - `backend/src/main/java/com/ck/quiz/service/converter/impl/HtmlConverter.java`
  - `backend/src/main/java/com/ck/quiz/service/converter/impl/TextConverter.java`
- 降级解析链路
  - `backend/src/main/java/com/ck/quiz/knowledgeset/service/DocumentConverterService.java`
  - `backend/src/main/java/com/ck/quiz/knowledgeset/service/impl/DocumentConverterServiceImpl.java`

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

## 价格监控（PriceMonitor）

- 前端入口（价格监控页）
  - `frontend/src/pages/PriceMonitor/index.tsx`
  - `frontend/src/pages/PriceMonitor/api.ts`
  - `frontend/src/pages/PriceMonitor/style/index.less`
- 路由入口
  - `frontend/src/router/index.tsx`
- 后端 API 入口
  - `backend/src/main/java/com/ck/quiz/price/controller/PriceMonitorItemController.java`
  - `backend/src/main/java/com/ck/quiz/price/controller/PriceSnapshotController.java`
  - `backend/src/main/java/com/ck/quiz/price/controller/PriceAlertRuleController.java`
- 后端核心实现（监控商品/快照/预警）
  - `backend/src/main/java/com/ck/quiz/price/service/impl/PriceMonitorItemServiceImpl.java`
  - `backend/src/main/java/com/ck/quiz/price/service/impl/PriceSnapshotServiceImpl.java`
  - `backend/src/main/java/com/ck/quiz/price/service/impl/PriceAlertRuleServiceImpl.java`
  - `backend/src/main/java/com/ck/quiz/price/entity/PriceMonitorItem.java`
  - `backend/src/main/java/com/ck/quiz/price/entity/PriceSnapshot.java`
  - `backend/src/main/java/com/ck/quiz/price/entity/PriceAlertRule.java`
  - `backend/src/main/java/com/ck/quiz/price/entity/PriceAlertLog.java`
- 数据库迁移
  - `backend/src/main/resources/db/migration/V202604042120__create_price_monitor_module.sql`

## 生命倒计时（LifeCountdown）

- 前端入口（生命倒计时页）
  - `frontend/src/pages/LifeCountdown/index.tsx`
  - `frontend/src/pages/LifeCountdown/api.ts`
  - `frontend/src/pages/LifeCountdown/style.less`
- 路由入口
  - `frontend/src/router/index.tsx`
- 后端 API 入口
  - `backend/src/main/java/com/ck/quiz/lifecountdown/controller/LifeCountdownController.java`
- 后端核心实现（用户唯一配置 / 今日警示语生成）
  - `backend/src/main/java/com/ck/quiz/lifecountdown/service/impl/LifeCountdownServiceImpl.java`
  - `backend/src/main/java/com/ck/quiz/lifecountdown/repository/LifeCountdownProfileRepository.java`
  - `backend/src/main/java/com/ck/quiz/lifecountdown/entity/LifeCountdownProfile.java`
  - `backend/src/main/java/com/ck/quiz/lifecountdown/dto/LifeCountdownProfileDto.java`
  - `backend/src/main/java/com/ck/quiz/lifecountdown/dto/LifeCountdownSaveDto.java`
  - `backend/src/main/java/com/ck/quiz/lifecountdown/dto/LifeCountdownGenerateWarningDto.java`
  - `backend/src/main/java/com/ck/quiz/lifecountdown/dto/LifeCountdownWarningDto.java`
- 数据库迁移
  - `backend/src/main/resources/db/migration/V202604101100__create_life_countdown_module.sql`

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

## 错题本（WrongQuestion）

- 前端入口（错题列表页）
  - `frontend/src/pages/WrongQuestion/index.tsx`
  - `frontend/src/pages/WrongQuestion/api/index.ts`
  - `frontend/src/pages/WrongQuestion/style/index.less`
- 路由入口
  - `frontend/src/router/index.tsx`
- 后端 API 入口
  - `backend/src/main/java/com/ck/quiz/wrongquestion/controller/WrongQuestionController.java`
- 后端核心实现（查询/新增/编辑/删除/OCR原图关联）
  - `backend/src/main/java/com/ck/quiz/wrongquestion/service/impl/WrongQuestionServiceImpl.java`
  - `backend/src/main/java/com/ck/quiz/wrongquestion/repository/WrongQuestionRepository.java`
  - `backend/src/main/java/com/ck/quiz/wrongquestion/entity/WrongQuestion.java`
  - `backend/src/main/java/com/ck/quiz/wrongquestion/dto/WrongQuestionQueryDto.java`
  - `backend/src/main/java/com/ck/quiz/wrongquestion/dto/WrongQuestionCreateDto.java`
  - `backend/src/main/java/com/ck/quiz/wrongquestion/dto/WrongQuestionUpdateDto.java`
  - `backend/src/main/java/com/ck/quiz/wrongquestion/dto/WrongQuestionDto.java`
- 数据库迁移
  - `backend/src/main/resources/db/migration/V202604051610__create_wrong_question_module.sql`

## 数据查询工具（DataQuery）

- 前端入口（SQL 查询页）
  - `frontend/src/pages/DataQuery/index.tsx`
  - `frontend/src/pages/DataQuery/style/index.less`
- 路由入口
  - `frontend/src/router/index.tsx`
- 复用 API
  - `frontend/src/pages/Datasource/api/index.ts`
- 后端 API 入口
  - `backend/src/main/java/com/ck/quiz/datasource/controller/DatasourceController.java`
- 后端核心实现（执行 SQL / schema 列表 / 结构采集）
  - `backend/src/main/java/com/ck/quiz/datasource/service/impl/DatasourceServiceImpl.java`
