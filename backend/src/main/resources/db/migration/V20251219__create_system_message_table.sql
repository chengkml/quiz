-- 创建系统消息表

CREATE TABLE IF NOT EXISTS system_message (
  id VARCHAR(32) NOT NULL PRIMARY KEY COMMENT '消息ID',
  user_id VARCHAR(64) NOT NULL COMMENT '接收用户ID',
  title VARCHAR(256) NOT NULL COMMENT '消息标题',
  content LONGTEXT NOT NULL COMMENT '消息内容',
  type VARCHAR(20) NOT NULL DEFAULT 'INFO' COMMENT '消息类型：INFO, WARNING, ERROR, SUCCESS',
  is_read BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否已读',
  read_date DATETIME NULL COMMENT '读取时间',
  priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL' COMMENT '消息优先级：LOW, NORMAL, HIGH',
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT '消息状态：ACTIVE, DELETED',
  sender_id VARCHAR(64) NULL COMMENT '发送人ID',
  link_url VARCHAR(512) NULL COMMENT '关联链接',
  create_date DATETIME NOT NULL COMMENT '创建时间',
  expire_date DATETIME NULL COMMENT '过期时间',
  INDEX idx_system_message_user_id (user_id),
  INDEX idx_system_message_status (status),
  INDEX idx_system_message_create_date (create_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统消息表';
