import React, { useEffect, useRef, useState } from 'react';
import {
    Avatar,
    Button,
    Drawer,
    Empty,
    Input,
    Message,
    Select,
    Space,
    Tag,
    Typography,
} from '@arco-design/web-react';
import { IconRobot, IconSend, IconUser } from '@arco-design/web-react/icon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ChatReferenceList, { ChatReference } from '@/components/ChatReferenceList';
import { fetchStream, getLLMModelsByType } from '@/pages/Chat/api';
import '@/pages/Chat/style.css';

const { TextArea } = Input;

interface ChatMessage {
    id: string;
    role: 'USER' | 'ASSISTANT';
    content: string;
    createdAt?: string;
    references?: ChatReference[];
}

interface LLMModel {
    id: string;
    name: string;
    isDefault: string;
}

interface KnowledgeSetChatDrawerProps {
    visible: boolean;
    knowledgeSetId?: string | null;
    knowledgeSetName?: string;
    onCancel: () => void;
}

const buildWelcomeMessage = (knowledgeSetName?: string): ChatMessage => ({
    id: 'welcome',
    role: 'ASSISTANT',
    content: `你正在基于知识集「${knowledgeSetName || '当前知识集'}」进行问答。\n\n我会优先依据该知识集内容回答。`,
    createdAt: new Date().toLocaleString(),
});

const KnowledgeSetChatDrawer: React.FC<KnowledgeSetChatDrawerProps> = ({
    visible,
    knowledgeSetId,
    knowledgeSetName,
    onCancel,
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [sending, setSending] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);

    const [models, setModels] = useState<LLMModel[]>([]);
    const [currentModel, setCurrentModel] = useState('');
    const [modelsLoading, setModelsLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadModels = async () => {
        setModelsLoading(true);
        try {
            const res = await getLLMModelsByType('TEXT');
            if (Array.isArray(res.data)) {
                setModels(res.data);
                const defaultModel = res.data.find((item: LLMModel) => item.isDefault === '1');
                if (defaultModel) {
                    setCurrentModel(defaultModel.name);
                } else if (res.data.length > 0) {
                    setCurrentModel(res.data[0].name);
                }
            } else {
                setModels([]);
                setCurrentModel('');
            }
        } catch (error) {
            console.error(error);
            Message.error('获取模型列表失败');
        } finally {
            setModelsLoading(false);
        }
    };

    useEffect(() => {
        if (!visible) {
            return;
        }
        setMessages([buildWelcomeMessage(knowledgeSetName)]);
        setInputValue('');
        setSending(false);
        setSessionId(null);
        void loadModels();
    }, [visible, knowledgeSetId, knowledgeSetName]);

    const handleSend = async () => {
        const content = inputValue.trim();
        if (!knowledgeSetId) {
            Message.warning('知识集未选中，请关闭后重试');
            return;
        }
        if (!content) {
            Message.warning('请输入要发送的内容');
            return;
        }
        if (!currentModel) {
            Message.warning('请先选择模型');
            return;
        }

        setSending(true);

        const tempUserMsgId = Date.now().toString();
        const tempUserMsg: ChatMessage = {
            id: tempUserMsgId,
            role: 'USER',
            content,
            createdAt: new Date().toLocaleString(),
        };

        const tempAssistantMsgId = (Date.now() + 1).toString();
        const tempAssistantMsg: ChatMessage = {
            id: tempAssistantMsgId,
            role: 'ASSISTANT',
            content: '',
            createdAt: new Date().toLocaleString(),
            references: [],
        };

        setMessages((prev) => [...prev, tempUserMsg, tempAssistantMsg]);
        setInputValue('');

        try {
            const payload = {
                sessionId: sessionId || undefined,
                knowledgeScopeType: 'KNOWLEDGE_SET',
                knowledgeSetId,
                message: {
                    role: 'USER',
                    content,
                },
                config: {
                    modelName: currentModel,
                },
            };

            let assistantMsgId = tempAssistantMsgId;

            await fetchStream(
                '/chat/stream',
                payload,
                (delta, response) => {
                    if (response?.sessionId) {
                        setSessionId((prev) => prev || response.sessionId);
                    }

                    const references = response?.references || response?.messages?.[0]?.references || [];

                    setMessages((prev) => {
                        const nextMessages = [...prev];
                        const messageIdFromServer = response?.messages?.[0]?.id;
                        const targetMsgIndex = nextMessages.findIndex(
                            (item) =>
                                item.id === assistantMsgId ||
                                (messageIdFromServer && item.id === messageIdFromServer)
                        );

                        if (targetMsgIndex === -1) {
                            return prev;
                        }

                        const targetMsg = nextMessages[targetMsgIndex];
                        const nextId = messageIdFromServer || targetMsg.id;
                        nextMessages[targetMsgIndex] = {
                            ...targetMsg,
                            id: nextId,
                            content: targetMsg.content + delta,
                            createdAt: response?.messages?.[0]?.createdAt || targetMsg.createdAt,
                            references,
                        };
                        assistantMsgId = nextId;
                        return nextMessages;
                    });
                },
                () => {
                    setSending(false);
                },
                (error) => {
                    console.error(error);
                    setMessages((prev) =>
                        prev.map((item) =>
                            item.id === assistantMsgId
                                ? {
                                      ...item,
                                      content: item.content || '问答失败，请稍后再试。',
                                  }
                                : item
                        )
                    );
                    Message.error('发送消息失败');
                    setSending(false);
                }
            );
        } catch (error) {
            console.error(error);
            setMessages((prev) =>
                prev.map((item) =>
                    item.id === tempAssistantMsgId
                        ? {
                              ...item,
                              content: item.content || '问答失败，请稍后再试。',
                          }
                        : item
                )
            );
            Message.error('发送消息失败');
            setSending(false);
        }
    };

    const handleInputKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (!sending) {
                void handleSend();
            }
        }
    };

    const renderMessageItem = (item: ChatMessage) => {
        const isUser = item.role?.toUpperCase() === 'USER';
        return (
            <div key={item.id} className={`message-item ${isUser ? 'user' : 'assistant'}`}>
                <Avatar
                    className='message-avatar'
                    style={{
                        backgroundColor: isUser ? 'rgb(var(--primary-6))' : '#00d0b6',
                    }}
                >
                    {isUser ? <IconUser /> : <IconRobot />}
                </Avatar>
                <div className='message-content-wrapper'>
                    <div className='message-info'>
                        <span>{isUser ? '我' : 'AI 助手'}</span>
                        {item.createdAt && <span>{item.createdAt}</span>}
                    </div>
                    <div className='message-bubble'>
                        <div className='markdown-body'>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.content}</ReactMarkdown>
                        </div>
                        {!isUser && <ChatReferenceList references={item.references} />}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Drawer
            width={680}
            title='知识集 AI 聊天'
            visible={visible}
            onCancel={onCancel}
            footer={null}
            unmountOnClose
            className='knowledge-set-chat-drawer'
            bodyStyle={{
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                backgroundColor: 'var(--color-fill-2)',
            }}
        >
            <div className='knowledge-set-chat-header'>
                <Space size='medium' wrap>
                    <Typography.Text type='secondary'>知识集</Typography.Text>
                    <Tag color='arcoblue'>{knowledgeSetName || '-'}</Tag>
                    <Typography.Text type='secondary'>模型</Typography.Text>
                    <Select
                        size='small'
                        style={{ width: 240 }}
                        placeholder='请选择模型'
                        value={currentModel}
                        onChange={(value) => setCurrentModel(value)}
                        disabled={sending}
                        loading={modelsLoading}
                    >
                        {models.map((item) => (
                            <Select.Option key={item.id} value={item.name}>
                                {item.name}
                            </Select.Option>
                        ))}
                    </Select>
                </Space>
            </div>

            <div className='chat-main-content' style={{ flex: 1, overflow: 'hidden' }}>
                <div className='chat-messages-container' style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                    {messages.length === 0 ? (
                        <Empty description='暂无消息，输入内容开始对话' style={{ marginTop: 100 }} />
                    ) : (
                        messages.map((item) => renderMessageItem(item))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className='input-area-wrapper' style={{ flexShrink: 0, padding: 16 }}>
                    <div className='input-card'>
                        <TextArea
                            className='custom-textarea'
                            placeholder='请输入问题，基于当前知识集进行问答...'
                            autoSize={{ minRows: 1, maxRows: 6 }}
                            value={inputValue}
                            onChange={setInputValue}
                            onKeyDown={handleInputKeyDown}
                            disabled={sending}
                        />
                        <div className='input-actions'>
                            <span className='input-tip'>Enter 发送，Shift + Enter 换行</span>
                            <Button
                                type='primary'
                                icon={<IconSend />}
                                onClick={() => void handleSend()}
                                loading={sending}
                                size='small'
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

export default KnowledgeSetChatDrawer;
