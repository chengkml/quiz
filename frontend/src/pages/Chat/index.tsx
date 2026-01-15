import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Empty,
  Input,
  Layout,
  List,
  Message,
  Space,
  Spin,
  Typography,
} from '@arco-design/web-react';
import {
  IconPlus,
  IconRefresh,
  IconSend,
} from '@arco-design/web-react/icon';
import {
  getChatMessages,
  getChatSessions,
  sendChatCompletion,
} from './api';

const { Sider, Content } = Layout;
const { TextArea } = Input;
const { Title, Text } = Typography;

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

const ChatPage: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsPage, setSessionsPage] = useState(0);
  const [sessionsTotal, setSessionsTotal] = useState(0);
  const [sessionsPageSize] = useState(20);

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);

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
  }, []);

  const handleSelectSession = (session: ChatSession) => {
    setCurrentSessionId(session.sessionId);
    loadMessages(session.sessionId);
  };

  const handleNewSession = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setInputValue('');
  };

  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content) {
      Message.warning('请输入要发送的内容');
      return;
    }
    setSending(true);
    try {
      const payload = {
        sessionId: currentSessionId || undefined,
        message: {
          role: 'USER',
          content,
        },
        config: undefined,
      };
      const response = await sendChatCompletion(payload);
      const data = response.data;
      if (data) {
        setCurrentSessionId(data.sessionId);
        if (Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
        setInputValue('');
        loadSessions(sessionsPage);
      }
    } catch (error) {
      Message.error('发送消息失败');
    } finally {
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
      <div
        style={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            maxWidth: '70%',
            padding: '8px 12px',
            borderRadius: 8,
            backgroundColor: isUser ? 'var(--color-primary-light-1)' : '#f5f5f5',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          <Text
            type="secondary"
            style={{
              fontSize: 12,
              display: 'block',
              marginBottom: 4,
              textAlign: isUser ? 'right' : 'left',
            }}
          >
            {isUser ? '我' : '助手'}
            {item.createdAt ? ` · ${item.createdAt}` : ''}
          </Text>
          <Text>{item.content}</Text>
        </div>
      </div>
    );
  };

  const currentSessionTitle =
    sessions.find((s) => s.sessionId === currentSessionId)?.title ||
    (currentSessionId ? currentSessionId : '新会话');

  return (
    <Layout style={{ height: '100%', minHeight: 0 }}>
      <Sider
        width={260}
        style={{
          background: '#fff',
          borderRight: '1px solid var(--color-border-2)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: 16,
            borderBottom: '1px solid var(--color-border-2)',
          }}
        >
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
        <div
          style={{
            flex: 1,
            overflow: 'auto',
          }}
        >
          <Spin loading={sessionsLoading}>
            {sessions.length === 0 ? (
              <Empty
                style={{ marginTop: 80 }}
                description="暂无会话，先发一条消息试试"
              />
            ) : (
              <List
                size="small"
                border={false}
                dataSource={sessions}
                render={(item) => (
                  <List.Item
                    key={item.sessionId}
                    onClick={() => handleSelectSession(item)}
                    style={{
                      cursor: 'pointer',
                      padding: '8px 16px',
                      backgroundColor:
                        item.sessionId === currentSessionId
                          ? 'var(--color-fill-2)'
                          : undefined,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 500,
                          marginBottom: 4,
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.title || item.sessionId}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--color-text-3)',
                        }}
                      >
                        {item.updatedAt || '-'}
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </Spin>
        </div>
        {sessionsTotal > sessionsPageSize && (
          <div
            style={{
              padding: 12,
              borderTop: '1px solid var(--color-border-2)',
              fontSize: 12,
              color: 'var(--color-text-3)',
              textAlign: 'center',
            }}
          >
            共 {sessionsTotal} 条会话
          </div>
        )}
      </Sider>
      <Layout>
        <Content
          style={{
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          <Card
            title={currentSessionTitle}
            bordered={false}
            style={{
              marginBottom: 12,
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                paddingRight: 8,
              }}
            >
              <Spin loading={messagesLoading}>
                {messages.length === 0 ? (
                  <Empty description="暂无消息，输入内容开始对话" />
                ) : (
                  messages.map((m) => (
                    <React.Fragment key={m.id}>
                      {renderMessageItem(m)}
                    </React.Fragment>
                  ))
                )}
              </Spin>
            </div>
          </Card>
          <Card bordered={false}>
            <TextArea
              placeholder="请输入要发送的内容，Enter 发送，Shift+Enter 换行"
              autoSize={{ minRows: 3, maxRows: 6 }}
              value={inputValue}
              onChange={setInputValue}
              onKeyDown={handleInputKeyDown}
              disabled={sending}
            />
            <div
              style={{
                marginTop: 8,
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <Button
                type="primary"
                icon={<IconSend />}
                onClick={handleSend}
                loading={sending}
              >
                发送
              </Button>
            </div>
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
};

export default ChatPage;
