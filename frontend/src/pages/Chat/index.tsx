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
  IconDelete,
  IconPlus,
  IconRefresh,
  IconRobot,
  IconSend,
  IconUser,
} from '@arco-design/web-react/icon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ChatReferenceList, { ChatReference } from '@/components/ChatReferenceList';
import {
  ALL_SCOPE_VALUE,
  buildKnowledgeScopePayload,
  getAccessibleKnowledgeSetOptions,
  getKnowledgeScopeLabel,
  KnowledgeSetOption,
} from '@/services/knowledgeScopeService';
import './style.css';
import {
  deleteSession,
  fetchStream,
  getChatMessages,
  getChatSessions,
  getLLMModelsByType,
} from './api';

const { Sider, Content } = Layout;
const { TextArea } = Input;
const { Title, Text } = Typography;

interface ChatSession {
  sessionId: string;
  title?: string;
  modelName?: string;
  updatedAt?: string;
  knowledgeScopeType?: string;
  knowledgeSetId?: string;
}

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  createdAt?: string;
  references?: ChatReference[];
}

interface LLMModel {
  id: string;
  name: string;
  isDefault: string;
}

const ChatPage = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsPage, setSessionsPage] = useState(0);
  const [sessionsTotal, setSessionsTotal] = useState(0);
  const [sessionsPageSize] = useState(20);

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [models, setModels] = useState<LLMModel[]>([]);
  const [currentModel, setCurrentModel] = useState('');

  const [knowledgeSetOptions, setKnowledgeSetOptions] = useState<KnowledgeSetOption[]>([]);
  const [scopeLoading, setScopeLoading] = useState(false);
  const [selectedScopeValue, setSelectedScopeValue] = useState(ALL_SCOPE_VALUE);

  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentScopeLabel = getKnowledgeScopeLabel(selectedScopeValue, knowledgeSetOptions);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const resolveScopeValue = (session?: ChatSession) => {
    if (session?.knowledgeScopeType === 'KNOWLEDGE_SET' && session.knowledgeSetId) {
      return session.knowledgeSetId;
    }
    return ALL_SCOPE_VALUE;
  };

  const resetCurrentConversation = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setInputValue('');
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
      console.error(error);
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
      console.error(error);
      Message.error('获取会话消息失败');
    } finally {
      setMessagesLoading(false);
    }
  };

  const loadModels = async () => {
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
      }
    } catch (error) {
      console.error(error);
      Message.error('获取模型列表失败');
    }
  };

  const loadKnowledgeSets = async () => {
    setScopeLoading(true);
    try {
      const nextOptions = await getAccessibleKnowledgeSetOptions();
      setKnowledgeSetOptions(nextOptions);

      if (
        selectedScopeValue !== ALL_SCOPE_VALUE &&
        !nextOptions.some((item) => item.id === selectedScopeValue)
      ) {
        setSelectedScopeValue(ALL_SCOPE_VALUE);
        resetCurrentConversation();
      }
    } catch (error) {
      console.error(error);
      Message.error('获取知识集列表失败');
    } finally {
      setScopeLoading(false);
    }
  };

  useEffect(() => {
    loadSessions(0);
    loadModels();
    loadKnowledgeSets();
  }, []);

  const handleSelectSession = (session: ChatSession) => {
    setCurrentSessionId(session.sessionId);
    setSelectedScopeValue(resolveScopeValue(session));
    void loadMessages(session.sessionId);
    if (session.modelName) {
      setCurrentModel(session.modelName);
    }
  };

  const handleNewSession = () => {
    resetCurrentConversation();
    const defaultModel = models.find((item) => item.isDefault === '1');
    if (defaultModel) {
      setCurrentModel(defaultModel.name);
    } else if (models.length > 0) {
      setCurrentModel(models[0].name);
    }
  };

  const handleScopeChange = (value: string) => {
    if (value === selectedScopeValue) {
      return;
    }
    setSelectedScopeValue(value);
    resetCurrentConversation();
    Message.info(`已切换到“${getKnowledgeScopeLabel(value, knowledgeSetOptions)}”，并开启新会话`);
  };

  const handleDeleteSession = async (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await deleteSession(sessionId);
      Message.success('会话已删除');
      if (currentSessionId === sessionId) {
        handleNewSession();
      }
      void loadSessions(sessionsPage);
    } catch (error) {
      console.error(error);
      Message.error('删除会话失败');
    }
  };

  const handleSend = async () => {
    const content = inputValue.trim();
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
        sessionId: currentSessionId || undefined,
        ...buildKnowledgeScopePayload(selectedScopeValue),
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
            setCurrentSessionId((prev) => prev || response.sessionId);
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
          void loadSessions(sessionsPage);
        },
        (error) => {
          console.error(error);
          Message.error('发送消息失败');
          setSending(false);
        }
      );
    } catch (error) {
      console.error(error);
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
            {!isUser && <ChatReferenceList references={item.references} />}
          </div>
        </div>
      </div>
    );
  };

  const currentSessionTitle =
    sessions.find((item) => item.sessionId === currentSessionId)?.title ||
    (currentSessionId ? currentSessionId : '新会话');

  return (
    <Layout className="chat-layout">
      <Sider width={280} className="chat-sidebar">
        <div className="sidebar-header">
          <Space>
            <Button type="primary" icon={<IconPlus />} onClick={handleNewSession}>
              新建会话
            </Button>
            <Button icon={<IconRefresh />} onClick={() => loadSessions(0)} />
          </Space>
        </div>
        <div className="session-list-container">
          <Spin loading={sessionsLoading} style={{ display: 'block', minHeight: 100 }}>
            {sessions.length === 0 ? (
              <Empty style={{ marginTop: 80 }} description="暂无会话" />
            ) : (
              sessions.map((item) => (
                <div
                  key={item.sessionId}
                  className={`session-item ${item.sessionId === currentSessionId ? 'active' : ''}`}
                  onClick={() => handleSelectSession(item)}
                >
                  <div className="session-info">
                    <div className="session-title">{item.title || item.sessionId}</div>
                    <div className="session-time">{item.updatedAt || '-'}</div>
                  </div>
                  <Button
                    type="text"
                    size="mini"
                    icon={<IconDelete />}
                    className="session-delete-btn"
                    onClick={(event) => handleDeleteSession(item.sessionId, event)}
                  />
                </div>
              ))
            )}
          </Spin>
        </div>
        {sessionsTotal > sessionsPageSize && (
          <div className="session-footer">共 {sessionsTotal} 条会话</div>
        )}
      </Sider>
      <Layout>
        <Content className="chat-main-content">
          <div className="chat-header">
            <div>
              <Title heading={6} style={{ margin: 0, fontSize: 16 }}>
                {currentSessionTitle}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                当前知识范围：{currentScopeLabel}
              </Text>
            </div>
          </div>

          <div className="chat-messages-container">
            <Spin loading={messagesLoading} style={{ display: 'block', minHeight: 100 }}>
              {messages.length === 0 ? (
                <Empty description="暂无消息，输入内容开始对话" style={{ marginTop: 100 }} />
              ) : (
                messages.map((item) => renderMessageItem(item))
              )}
              <div ref={messagesEndRef} />
            </Spin>
          </div>

          <div className="input-area-wrapper">
            <div className="input-card">
              <div className="chat-control-row">
                <Select
                  bordered={false}
                  triggerProps={{
                    autoAlignPopupWidth: false,
                    autoAlignPopupMinWidth: true,
                    position: 'tl',
                  }}
                  className="chat-control-select"
                  placeholder="请选择模型"
                  value={currentModel}
                  onChange={(value) => setCurrentModel(value)}
                  disabled={sending}
                >
                  {models.map((option) => (
                    <Select.Option key={option.id} value={option.name}>
                      {option.name}
                    </Select.Option>
                  ))}
                </Select>
                <Select
                  bordered={false}
                  triggerProps={{
                    autoAlignPopupWidth: false,
                    autoAlignPopupMinWidth: true,
                    position: 'tl',
                  }}
                  className="chat-control-select"
                  placeholder="请选择知识范围"
                  value={selectedScopeValue}
                  onChange={(value) => handleScopeChange(value as string)}
                  loading={scopeLoading}
                  disabled={sending}
                >
                  <Select.Option value={ALL_SCOPE_VALUE}>全部知识集</Select.Option>
                  {knowledgeSetOptions.map((option) => (
                    <Select.Option key={option.id} value={option.id}>
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
                  onClick={() => void handleSend()}
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
