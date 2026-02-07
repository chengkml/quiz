-- Token使用记录表
CREATE TABLE IF NOT EXISTS `token_usage` (
  `id` varchar(32) NOT NULL COMMENT '主键ID',
  `model_name` varchar(100) NOT NULL COMMENT '模型名称',
  `model_provider` varchar(50) DEFAULT NULL COMMENT '模型提供商',
  `prompt_tokens` int NOT NULL DEFAULT 0 COMMENT '输入token数',
  `completion_tokens` int NOT NULL DEFAULT 0 COMMENT '输出token数',
  `total_tokens` int NOT NULL DEFAULT 0 COMMENT '总token数',
  `input_cost` double DEFAULT NULL COMMENT '输入成本',
  `output_cost` double DEFAULT NULL COMMENT '输出成本',
  `total_cost` double DEFAULT NULL COMMENT '总成本',
  `business_type` varchar(50) DEFAULT NULL COMMENT '业务类型：CHAT-聊天, QUESTION-题目生成, OCR-图片识别, KNOWLEDGE-知识点, DATASOURCE-数据源, FUNCDOC-文档, MINDMAP-思维导图, MERMAID-流程图, CALENDAR-日历',
  `business_id` varchar(64) DEFAULT NULL COMMENT '业务ID',
  `session_id` varchar(64) DEFAULT NULL COMMENT '会话ID（如果是聊天场景）',
  `request_content` text COMMENT '请求内容',
  `response_content` text COMMENT '响应内容',
  `error_flag` bit(1) DEFAULT b'0' COMMENT '是否发生错误',
  `error_message` text COMMENT '错误信息',
  `create_date` datetime DEFAULT NULL COMMENT '创建日期',
  `create_user` varchar(64) DEFAULT NULL COMMENT '创建用户',
  `update_date` datetime DEFAULT NULL COMMENT '更新日期',
  `update_user` varchar(64) DEFAULT NULL COMMENT '更新用户',
  PRIMARY KEY (`id`),
  KEY `idx_model_name` (`model_name`),
  KEY `idx_create_user` (`create_user`),
  KEY `idx_create_date` (`create_date`),
  KEY `idx_business_type` (`business_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Token使用记录表';

-- 插入示例菜单（可选，根据实际需要配置）
-- INSERT INTO `menu` (`id`, `name`, `path`, `type`, `icon`, `sort`, `parent_id`, `component`, `status`, `create_date`, `create_user`)
-- VALUES ('token_usage_menu', 'Token使用统计', '/token-usage', 'MENU', 'icon-bar-chart', 100, NULL, 'TokenUsage', '1', NOW(), 'admin');
