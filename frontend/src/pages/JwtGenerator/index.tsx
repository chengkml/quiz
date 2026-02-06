import React, { useState } from 'react';
import { Button, Card, Input, Message, Spin } from '@arco-design/web-react';
import { IconCopy, IconInfo } from '@arco-design/web-react/icon';
import { generateJwt } from './api';
import './index.less';

const JwtGeneratorPage: React.FC = () => {
    const [userId, setUserId] = useState<string>('');
    const [token, setToken] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    // 生成 JWT Token
    const handleGenerate = async () => {
        if (!userId.trim()) {
            Message.warning('请输入用户 ID');
            return;
        }

        setLoading(true);
        try {
            const res = await generateJwt(userId.trim());
            // 后端直接返回 token 字符串，res.data 即为 token
            if (res.data) {
                setToken(res.data);
                Message.success('Token 生成成功');
            } else {
                Message.error('Token 生成失败');
            }
        } catch (error: any) {
            Message.error(error.message || 'Token 生成失败');
        } finally {
            setLoading(false);
        }
    };

    // 复制 Token 到剪贴板
    const handleCopy = async () => {
        if (!token) return;
        
        try {
            await navigator.clipboard.writeText(token);
            Message.success('Token 已复制到剪贴板');
        } catch {
            Message.error('复制失败');
        }
    };

    // 复制完整 Header 到剪贴板
    const handleCopyHeader = async () => {
        if (!token) return;
        
        const header = `Authorization: Bearer ${token}`;
        try {
            await navigator.clipboard.writeText(header);
            Message.success('Header 已复制到剪贴板');
        } catch {
            Message.error('复制失败');
        }
    };

    return (
        <div className="jwt-generator-container">
            <div className="jwt-layout">
                <Card
                    className="jwt-card"
                    title={
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <IconInfo style={{ fontSize: 18 }} />
                            JWT Token 生成器
                        </span>
                    }
                >
                    {/* 输入区域 */}
                    <div className="form-section">
                        <Input
                            size="large"
                            placeholder="请输入用户 ID"
                            value={userId}
                            onChange={setUserId}
                            onPressEnter={handleGenerate}
                            disabled={loading}
                            allowClear
                        />
                    </div>

                    <Button
                        type="primary"
                        className="generate-btn"
                        onClick={handleGenerate}
                        loading={loading}
                    >
                        生成 Token
                    </Button>

                    {/* 结果区域 */}
                    {loading && (
                        <div className="empty-state">
                            <Spin size={32} />
                        </div>
                    )}

                    {!loading && token && (
                        <div className="result-section">
                            <div className="token-display">
                                <div className="token-label">
                                    <span className="label-text">生成的 Token:</span>
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<IconCopy />}
                                        onClick={handleCopy}
                                    >
                                        复制
                                    </Button>
                                </div>
                                <div className="token-content">{token}</div>
                            </div>

                            <div className="usage-section">
                                <div className="usage-title">
                                    <IconInfo />
                                    使用方法
                                </div>
                                <div className="usage-code">
                                    <code>Authorization: Bearer {token}</code>
                                </div>
                                <div style={{ marginTop: 12, textAlign: 'right' }}>
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<IconCopy />}
                                        onClick={handleCopyHeader}
                                    >
                                        复制完整 Header
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {!loading && !token && (
                        <div className="empty-state">
                            <IconInfo className="empty-icon" />
                            <div className="empty-text">输入用户 ID 并点击生成按钮获取 JWT Token</div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default JwtGeneratorPage;
