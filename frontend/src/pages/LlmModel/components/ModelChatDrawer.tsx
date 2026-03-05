import React, { useEffect, useRef, useState } from 'react';
import {
    Avatar,
    Button,
    Drawer,
    Empty,
    Input,
    Message,
} from '@arco-design/web-react';
import { IconSend, IconUser, IconRobot } from '@arco-design/web-react/icon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchStream } from '../../Chat/api';
import '../../Chat/style.css'; // Reuse chat styles

const { TextArea } = Input;

interface ChatMessage {
    id: string;
    role: string;
    content: string;
    createdAt?: string;
}

interface ModelChatDrawerProps {
    visible: boolean;
    model: any;
    onClose: () => void;
}

const ModelChatDrawer: React.FC<ModelChatDrawerProps> = ({ visible, model, onClose }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [sending, setSending] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (visible) {
            setMessages([]);
            setInputValue('');
            setSessionId(null);
            setSending(false);
        }
    }, [visible]);

    const handleSend = async () => {
        const content = inputValue.trim();
        if (!content) {
            Message.warning('请输入要发送的内容');
            return;
        }
        setSending(true);

        const tempUserMsgId = Date.now().toString();
        const tempUserMsg: ChatMessage = {
            id: tempUserMsgId,
            role: 'USER',
            content: content,
            createdAt: new Date().toLocaleString(),
        };

        const tempAssistantMsgId = (Date.now() + 1).toString();
        const tempAssistantMsg: ChatMessage = {
            id: tempAssistantMsgId,
            role: 'ASSISTANT',
            content: '',
            createdAt: new Date().toLocaleString(),
        };

        setMessages((prev) => [...prev, tempUserMsg, tempAssistantMsg]);
        setInputValue('');

        try {
            const payload = {
                sessionId: sessionId || undefined,
                message: {
                    role: 'USER',
                    content,
                },
                config: {
                    modelName: model?.name,
                },
            };

            let assistantMsgId = tempAssistantMsgId;

            await fetchStream(
                '/chat/stream',
                payload,
                (delta, response) => {
                    if (response.sessionId) {
                        setSessionId(response.sessionId);
                    }
                    setMessages((prev) => {
                        const newMessages = [...prev];
                        const messageIdFromServer = response.messages?.[0]?.id;
                        const targetMsgIndex = newMessages.findIndex(
                            (m) =>
                                m.id === assistantMsgId ||
                                (messageIdFromServer && m.id === messageIdFromServer)
                        );
                        if (targetMsgIndex !== -1) {
                            const targetMsg = newMessages[targetMsgIndex];
                            const nextId = messageIdFromServer || targetMsg.id;
                            newMessages[targetMsgIndex] = {
                                ...targetMsg,
                                id: nextId,
                                content: targetMsg.content + delta,
                                createdAt: response.messages?.[0]?.createdAt || targetMsg.createdAt,
                            };
                            assistantMsgId = nextId;
                        }
                        return newMessages;
                    });
                },
                () => {
                    setSending(false);
                },
                (err) => {
                    console.error(err);
                    Message.error('发送消息失败');
                    setSending(false);
                }
            );
        } catch (error) {
            Message.error('发送消息失败');
            setSending(false);
        }
    };

    const handleInputKeyDown = (event: any) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (!sending) {
                handleSend();
            }
        }
    };

    const renderMessageItem = (item: ChatMessage) => {
        const isUser = item.role?.toUpperCase() === 'USER';
        return (
            <div key={item.id} className={`message-item ${isUser ? 'user' : 'assistant'}`}>
                <Avatar
                    className="message-avatar"
                    style={{
                        backgroundColor: isUser ? 'rgb(var(--primary-6))' : '#00d0b6',
                    }}
                >
                    {isUser ? <IconUser /> : <IconRobot />}
                </Avatar>
                <div className="message-content-wrapper">
                    <div className="message-info">
                        <span>{isUser ? '我' : 'AI 助手'}</span>
                        {item.createdAt && <span>{item.createdAt}</span>}
                    </div>
                    <div className="message-bubble">
                        <div className="markdown-body">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.content}</ReactMarkdown>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Drawer
            width={600}
            title={`与模型 ${model?.name || ''} 聊天测试`}
            visible={visible}
            onOk={onClose}
            onCancel={onClose}
            footer={null}
            className="model-chat-drawer"
            bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'var(--color-fill-2)' }}
        >
            <div className="chat-main-content" style={{ flex: 1, overflow: 'hidden' }}>
                <div className="chat-messages-container" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                    {messages.length === 0 ? (
                        <Empty description="暂无消息，输入内容开始对话" style={{ marginTop: 100 }} />
                    ) : (
                        messages.map((m) => renderMessageItem(m))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="input-area-wrapper" style={{ flexShrink: 0 }}>
                    <div className="input-card">
                        <TextArea
                            className="custom-textarea"
                            placeholder="请输入要发送的内容..."
                            autoSize={{ minRows: 1, maxRows: 6 }}
                            value={inputValue}
                            onChange={setInputValue}
                            onKeyDown={handleInputKeyDown}
                            disabled={sending}
                        />
                        <div className="input-actions">
                            <span className="input-tip">Enter 发送，Shift + Enter 换行</span>
                            <Button
                                type="primary"
                                icon={<IconSend />}
                                onClick={handleSend}
                                loading={sending}
                                size="small"
                            >
                                发送
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Drawer>
    );
};

export default ModelChatDrawer;
