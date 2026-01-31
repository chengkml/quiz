import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Avatar, Trigger, Tooltip, Badge } from '@arco-design/web-react';
import { 
  IconRobot, 
  IconClose, 
  IconSend, 
  IconMessage, 
  IconMinus, 
  IconExpand,
  IconUser
} from '@arco-design/web-react/icon';
import classNames from 'classnames';
import './style.less';
import AssistantLogo from '@/assets/assistant-logo.png';

const { TextArea } = Input;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const GlobalAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '你好！我是你的智能助手，有什么可以帮你的吗？',
      timestamp: Date.now()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // 发送消息
  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    // 模拟回复延迟
    setTimeout(() => {
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `我收到了你的消息：“${userMsg.content}”。目前我还在开发中，暂时没有连接到后端服务。`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsLoading(false);
    }, 1000);
  };

  // 键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="global-assistant">
      {/* 悬浮按钮 (Now in Header) */}
      <Tooltip content={isOpen ? '收起助手' : '智能助手'} position="bottom">
        <div 
          className={classNames('assistant-trigger', { open: isOpen })}
          onClick={() => setIsOpen(!isOpen)}
        >
          <IconRobot style={{ fontSize: 20 }} />
        </div>
      </Tooltip>

      {/* 聊天窗口 */}
      <div className={classNames('assistant-window', { hidden: !isOpen })}>
        <div className="window-header">
          <div className="title">
            <IconRobot style={{ fontSize: 20, color: 'var(--color-primary-6)' }} />
            <span>智能助手</span>
          </div>
          <div className="actions">
            <Tooltip content="收起">
              <IconClose onClick={() => setIsOpen(false)} style={{ fontSize: 16 }} />
            </Tooltip>
          </div>
        </div>
        
        <div className="window-content">
          {messages.map(msg => (
            <div key={msg.id} className={classNames('message-item', msg.role)}>
              {msg.role === 'assistant' && (
                <Avatar size={32} className="avatar" style={{ backgroundColor: 'var(--color-fill-3)' }}>
                  <IconRobot style={{ color: 'var(--color-text-2)' }} />
                </Avatar>
              )}
              <div className="message-bubble">
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <Avatar size={32} className="avatar" style={{ backgroundColor: '#ff7d00' }}>
                  <IconUser />
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="message-item assistant">
              <Avatar size={32} className="avatar" style={{ backgroundColor: 'var(--color-fill-3)' }}>
                 <IconRobot style={{ color: 'var(--color-text-2)' }} />
              </Avatar>
              <div className="message-bubble" style={{ color: 'var(--color-text-3)' }}>
                 正在思考...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="window-footer">
          <div className="input-wrapper">
             <TextArea
               placeholder="输入消息，Enter 发送..."
               autoSize={{ minRows: 1, maxRows: 4 }}
               value={inputValue}
               onChange={setInputValue}
               onKeyPress={handleKeyPress}
               style={{ 
                 resize: 'none', 
                 backgroundColor: 'var(--color-fill-2)',
                 border: 'none',
                 borderRadius: 8
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
    </div>
  );
};

export default GlobalAssistant;
