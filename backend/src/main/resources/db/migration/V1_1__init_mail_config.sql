-- 初始化邮件配置参数
INSERT INTO system_param (id, param_name, param_value, default_value, param_type, category, description, is_encrypted, is_readonly, status, sort_order, create_date)
VALUES
    ('mail_host_001', 'mail.host', 'smtp.example.com', 'smtp.example.com', 'STRING', '邮件配置', 'SMTP服务器地址', false, false, 'ACTIVE', 1, NOW()),
    ('mail_port_001', 'mail.port', '587', '587', 'NUMBER', '邮件配置', 'SMTP服务器端口', false, false, 'ACTIVE', 2, NOW()),
    ('mail_username_001', 'mail.username', 'your-email@example.com', 'your-email@example.com', 'STRING', '邮件配置', '发件人邮箱地址', false, false, 'ACTIVE', 3, NOW()),
    ('mail_password_001', 'mail.password', 'your-password', 'your-password', 'STRING', '邮件配置', '邮箱密码或授权码', true, false, 'ACTIVE', 4, NOW()),
    ('mail_encoding_001', 'mail.encoding', 'UTF-8', 'UTF-8', 'STRING', '邮件配置', '邮件编码', false, false, 'ACTIVE', 5, NOW()),
    ('mail_smtp_auth_001', 'mail.smtp.auth', 'true', 'true', 'BOOLEAN', '邮件配置', 'SMTP认证', false, false, 'ACTIVE', 6, NOW()),
    ('mail_smtp_starttls_enable_001', 'mail.smtp.starttls.enable', 'true', 'true', 'BOOLEAN', '邮件配置', '启用STARTTLS', false, false, 'ACTIVE', 7, NOW()),
    ('mail_smtp_starttls_required_001', 'mail.smtp.starttls.required', 'true', 'true', 'BOOLEAN', '邮件配置', 'STARTTLS必需', false, false, 'ACTIVE', 8, NOW())
ON DUPLICATE KEY UPDATE
    param_value = VALUES(param_value);
