import React, { useEffect, useRef, useState } from 'react';
import { Avatar, Button, Input, Message, Select, Tooltip } from '@arco-design/web-react';
import { IconClose, IconRefresh, IconRobot, IconSend, IconUser } from '@arco-design/web-react/icon';
import classNames from 'classnames';
import { fetchStream } from '@/pages/Chat/api';
import {
  getMyCreatedKnowledgeSets,
  getMyJoinedKnowledgeSets,
} from '@/pages/KnowledgeSet/api';
import './style.less';

const { TextArea } = Input;

const ALL_SCOPE_VALUE = '__ALL_ACCESSIBLE__';

interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface KnowledgeSetOption {
  id: string;
  name: string;
}

const createWelcomeMessage = (scopeLabel: string): AssistantMessage => ({
  id: 'welcome',
  role: 'assistant',
  content: `你好，我是知识库助手。当前知识范围：${scopeLabel}。请输入问题。`,
  timestamp: Date.now(),
});

const GlobalAssistant: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<AssistantMessage[]>([
    createWelcomeMessage('全部知识集'),
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [knowledgeSetOptions, setKnowledgeSetOptions] = useState<KnowledgeSetOption[]>([]);
  const [selectedScopeValue, setSelectedScopeValue] = useState(ALL_SCOPE_VALUE);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentAssistantMessageRef = useRef('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getScopeLabel = (scopeValue: string) => {
    if (scopeValue === ALL_SCOPE_VALUE) {
      return '全部知识集';
    }
    return knowledgeSetOptions.find((item) => item.id === scopeValue)?.name || '指定知识集';
  };

  const resetConversation = (scopeLabel: string) => {
    currentAssistantMessageRef.current = '';
    setSessionId('');
    setMessages([createWelcomeMessage(scopeLabel)]);
    setInputValue('');
    setIsLoading(false);
  };

  const loadKnowledgeSets = async () => {
    setOptionsLoading(true);
    try {
      const params = {
        pageNum: 0,
        pageSize: 200,
        status: 'ENABLED',
      };
      const [createdRes, joinedRes] = await Promise.all([
        getMyCreatedKnowledgeSets(params),
        getMyJoinedKnowledgeSets(params),
      ]);

      const merged = new Map<string, KnowledgeSetOption>();
      const appendOptions = (items: any[] = []) => {
        items.forEach((item) => {
          if (item?.id && item?.name && !merged.has(item.id)) {
            merged.set(item.id, {
              id: item.id,
              name: item.name,
            });
          }
        });
      };

      appendOptions(createdRes.data?.content || []);
      appendOptions(joinedRes.data?.content || []);

      const nextOptions = Array.from(merged.values());
      setKnowledgeSetOptions(nextOptions);

      if (
        selectedScopeValue !== ALL_SCOPE_VALUE &&
        !nextOptions.some((item) => item.id === selectedScopeValue)
      ) {
        setSelectedScopeValue(ALL_SCOPE_VALUE);
        resetConversation('全部知识集');
      }
    } catch (error) {
      console.error('Failed to load knowledge sets', error);
      Message.error('获取知识集列表失败');
    } finally {
      setOptionsLoading(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadKnowledgeSets();
  }, []);

  const handleScopeChange = (value: string) => {
    if (value === selectedScopeValue) {
      return;
    }
    const scopeLabel = getScopeLabel(value);
    setSelectedScopeValue(value);
    resetConversation(scopeLabel);
    Message.info(`已切换到“${scopeLabel}”，并开启新会话`);
  };

  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content || isLoading) {
      return;
    }

    const userMsg: AssistantMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMsg: AssistantMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInputValue('');
    setIsLoading(true);
    currentAssistantMessageRef.current = '';

    try {
      await fetchStream(
        '/chat/stream',
        {
          sessionId: sessionId || undefined,
          knowledgeScopeType:
            selectedScopeValue === ALL_SCOPE_VALUE ? 'ALL_ACCESSIBLE' : 'KNOWLEDGE_SET',
          knowledgeSetId:
            selectedScopeValue === ALL_SCOPE_VALUE ? undefined : selectedScopeValue,
          message: {
            role: 'user',
            content,
          },
        },
        (delta, response) => {
          if (response?.sessionId) {
            setSessionId((prev) => prev || response.sessionId);
          }

          currentAssistantMessageRef.current += delta;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, content: currentAssistantMessageRef.current }
                : msg
            )
          );
        },
        () => {
          setIsLoading(false);
        },
        (error) => {
          console.error(error);
          currentAssistantMessageRef.current += '\n[问答失败，请稍后再试]';
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, content: currentAssistantMessageRef.current }
                : msg
            )
          );
          setIsLoading(false);
          Message.error('问答失败');
        }
      );
    } catch (error) {
      console.error('Failed to send assistant message', error);
      setIsLoading(false);
      Message.error('问答失败');
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="global-assistant-panel">
      <div className="window-header">
        <div className="title">
          <IconRobot style={{ fontSize: 20, color: 'var(--color-primary-6)' }} />
          <span>知识库助手</span>
        </div>
        <div className="actions">
          <Tooltip content="刷新知识集">
            <Button
              type="text"
              size="mini"
              icon={<IconRefresh />}
              loading={optionsLoading}
              onClick={loadKnowledgeSets}
            />
          </Tooltip>
          <Tooltip content="收起">
            <IconClose onClick={onClose} style={{ fontSize: 16 }} />
          </Tooltip>
        </div>
      </div>

      <div className="scope-toolbar">
        <Select
          className="scope-select"
          size="small"
          value={selectedScopeValue}
          placeholder="请选择知识范围"
          onChange={(value) => handleScopeChange(value as string)}
          loading={optionsLoading}
          disabled={isLoading}
          triggerProps={{ autoAlignPopupMinWidth: true, position: 'bl' }}
        >
          <Select.Option value={ALL_SCOPE_VALUE}>全部知识集</Select.Option>
          {knowledgeSetOptions.map((item) => (
            <Select.Option key={item.id} value={item.id}>
              {item.name}
            </Select.Option>
          ))}
        </Select>
        <div className="scope-hint">切换范围会重置当前会话</div>
      </div>

      <div className="window-content">
        {messages.map((msg) => (
          <div key={msg.id} className={classNames('message-item', msg.role)}>
            {msg.role === 'assistant' && (
              <Avatar
                size={32}
                className="avatar"
                style={{ backgroundColor: 'var(--color-fill-3)' }}
              >
                <IconRobot style={{ color: 'var(--color-text-2)' }} />
              </Avatar>
            )}
            <div className="message-bubble">
              {msg.content}
              {msg.role === 'assistant' &&
                isLoading &&
                msg.id === messages[messages.length - 1]?.id && (
                  <span className="typing-cursor">|</span>
                )}
            </div>
            {msg.role === 'user' && (
              <Avatar size={32} className="avatar" style={{ backgroundColor: '#ff7d00' }}>
                <IconUser />
              </Avatar>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="window-footer">
        <div className="input-wrapper">
          <TextArea
            placeholder="基于当前知识范围提问，Enter 发送..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            value={inputValue}
            onChange={setInputValue}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            style={{
              resize: 'none',
              backgroundColor: 'var(--color-fill-2)',
              border: 'none',
              borderRadius: 8,
            }}
          />
          <Button
            type="primary"
            shape="circle"
            icon={<IconSend />}
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default GlobalAssistant;
