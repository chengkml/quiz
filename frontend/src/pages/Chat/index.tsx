import React, { useEffect, useRef, useState } from 'react';
import {
  Avatar,
  Button,
  Empty,
  Input,
  Layout,
  Message,
  Select,
  Space,
  Spin,
  Typography,
} from '@arco-design/web-react';
import {
  IconPlus,
  IconRefresh,
  IconSend,
  IconUser,
  IconRobot,
} from '@arco-design/web-react/icon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './style.css';
import {
  getChatMessages,
  getChatSessions,
  sendChatCompletion,
  fetchStream,
  getLLMModelsByType,
} from './api';

const { Sider, Content } = Layout;
const { TextArea } = Input;
const { Title } = Typography;

interface ChatSession {
  sessionId: string;
  title?: string;
  modelName?: string;
  updatedAt?: string;
}

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  createdAt?: string;
}

interface LLMModel {
  id: string;
  name: string;
  isDefault: string;
}

const ChatPage: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsPage, setSessionsPage] = useState(0);
  const [sessionsTotal, setSessionsTotal] = useState(0);
  const [sessionsPageSize] = useState(20);

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [models, setModels] = useState<LLMModel[]>([]);
  const [currentModel, setCurrentModel] = useState<string>('');

  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadSessions = async (page = 0) => {
    setSessionsLoading(true);
    try {
      const response = await getChatSessions({
        page,
        size: sessionsPageSize,
      });
      const data = response.data;
      if (data && Array.isArray(data.content)) {
        setSessions(data.content);
        setSessionsPage(page);
        setSessionsTotal(data.totalElements || data.content.length);
      }
    } catch (error) {
      Message.error('获取会话列表失败');
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadMessages = async (sessionId: string) => {
    setMessagesLoading(true);
    try {
      const response = await getChatMessages(sessionId, { limit: 100 });
      const data = response.data;
      if (Array.isArray(data)) {
        setMessages(data);
      } else {
        setMessages([]);
      }
    } catch (error) {
      Message.error('获取会话消息失败');
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    loadSessions(0);
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const res = await getLLMModelsByType('TEXT');
      if (res.data) {
        setModels(res.data);
        const defaultModel = res.data.find((m: any) => m.isDefault === '1');
        if (defaultModel) setCurrentModel(defaultModel.name);
        else if (res.data.length > 0) setCurrentModel(res.data[0].name);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectSession = (session: ChatSession) => {
    setCurrentSessionId(session.sessionId);
    loadMessages(session.sessionId);
    if (session.modelName) {
      setCurrentModel(session.modelName);
    }
  };

  const handleNewSession = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setInputValue('');
    const defaultModel = models.find((m) => m.isDefault === '1');
    if (defaultModel) setCurrentModel(defaultModel.name);
    else if (models.length > 0) setCurrentModel(models[0].name);
  };

  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content) {
      Message.warning('请输入要发送的内容');
      return;
    }
    setSending(true);

    // 乐观更新：先显示用户的消息
    const tempUserMsgId = Date.now().toString();
    const tempUserMsg: ChatMessage = {
      id: tempUserMsgId,
      role: 'USER',
      content: content,
      createdAt: new Date().toLocaleString(),
    };

    // 预先创建一个空的 Assistant 消息用于流式显示
    const tempAssistantMsgId = (Date.now() + 1).toString();
    const tempAssistantMsg: ChatMessage = {
      id: tempAssistantMsgId,
      role: 'ASSISTANT',
      content: '',
      createdAt: new Date().toLocaleString(), // 初始时间
    };

    setMessages((prev) => [...prev, tempUserMsg, tempAssistantMsg]);
    setInputValue('');

    try {
        const payload = {
          sessionId: currentSessionId || undefined,
          message: {
            role: 'USER',
            content,
          },
          config: {
            modelName: currentModel,
          },
        };

        // Track assistant message id through the stream so subsequent chunks still match
        let assistantMsgId = tempAssistantMsgId;

        // 使用 ref 来追踪当前的 sessionId，避免闭包问题
      // 但这里我们简单处理，因为流过程中 sessionId 应该是一致的（由后端返回）

      await fetchStream(
        '/chat/stream',
        payload,
        (delta, response) => {
          console.log('[Chat] onMessage called, delta:', delta);
          // 如果是新会话，后端会在响应中返回 sessionId
          if (response.sessionId) {
             // 这里不能直接依赖 currentSessionId 闭包变量判断，因为它是旧的
             // 但我们可以直接 set，因为如果是同一个 id也没关系
             setCurrentSessionId(response.sessionId);
          }

          setMessages((prev) => {
            console.log('[Chat] setMessages called, prev length:', prev.length);
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
              assistantMsgId = nextId; // ensure later chunks still find the message
            }
            return newMessages;
          });
        },
        () => {
          setSending(false);
          loadSessions(sessionsPage);
        },
        (err) => {
          console.error(err);
          Message.error('发送消息失败');
          setSending(false);
          // 可以考虑移除临时的错误消息或标记为错误
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

  const currentSessionTitle =
    sessions.find((s) => s.sessionId === currentSessionId)?.title ||
    (currentSessionId ? currentSessionId : '新会话');

  return (
    <Layout className="chat-layout">
      <Sider width={280} className="chat-sidebar">
        <div className="sidebar-header">
          <Space>
            <Button
              type="primary"
              icon={<IconPlus />}
              onClick={handleNewSession}
            >
              新建会话
            </Button>
            <Button
              icon={<IconRefresh />}
              onClick={() => loadSessions(0)}
            />
          </Space>
        </div>
        <div className="session-list-container">
          <Spin loading={sessionsLoading} style={{ display: 'block', minHeight: 100 }}>
            {sessions.length === 0 ? (
              <Empty
                style={{ marginTop: 80 }}
                description="暂无会话"
              />
            ) : (
              sessions.map((item) => (
                <div
                  key={item.sessionId}
                  className={`session-item ${
                    item.sessionId === currentSessionId ? 'active' : ''
                  }`}
                  onClick={() => handleSelectSession(item)}
                >
                  <div className="session-title">
                    {item.title || item.sessionId}
                  </div>
                  <div className="session-time">{item.updatedAt || '-'}</div>
                </div>
              ))
            )}
          </Spin>
        </div>
        {sessionsTotal > sessionsPageSize && (
          <div className="session-footer">
            共 {sessionsTotal} 条会话
          </div>
        )}
      </Sider>
      <Layout>
        <Content className="chat-main-content">
          <div className="chat-header">
            <Title heading={6} style={{ margin: 0, fontSize: 16 }}>
              {currentSessionTitle}
            </Title>
          </div>
          
          <div className="chat-messages-container">
            <Spin loading={messagesLoading} style={{ display: 'block', minHeight: 100 }}>
              {messages.length === 0 ? (
                <Empty description="暂无消息，输入内容开始对话" style={{ marginTop: 100 }} />
              ) : (
                messages.map((m) => renderMessageItem(m))
              )}
              <div ref={messagesEndRef} />
            </Spin>
          </div>

          <div className="input-area-wrapper">
            <div className="input-card">
              <div style={{ marginBottom: 8 }}>
                <Select
                  bordered={false}
                  triggerProps={{
                    autoAlignPopupWidth: false,
                    autoAlignPopupMinWidth: true,
                    position: 'tl',
                  }}
                  style={{ width: 'auto', minWidth: 120, paddingLeft: 0 }}
                  placeholder="请选择模型"
                  value={currentModel}
                  onChange={(value) => setCurrentModel(value)}
                >
                  {models.map((option) => (
                    <Select.Option key={option.id} value={option.name}>
                      {option.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>
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
        </Content>
      </Layout>
    </Layout>
  );
};

export default ChatPage;
