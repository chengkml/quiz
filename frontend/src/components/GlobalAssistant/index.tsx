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

const GlobalAssistant: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
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
  const [sessionId, setSessionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentAssistantMessageRef = useRef<string>('');
  
  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 发送消息
  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);
    
    // 创建助理消息占位
    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, assistantMsg]);
    currentAssistantMessageRef.current = '';

    try {
      // 动态导入以避免循环依赖或路径问题（如果 fetchStream 在 page 目录下）
      // 假设 fetchStream 可以从 '@/pages/Chat/api' 导入
      const { fetchStream } = await import('@/pages/Chat/api');
      
      await fetchStream(
        '/chat/stream',
        {
          sessionId: sessionId || undefined,
          message: {
            role: 'user',
            content: userMsg.content
          }
        },
        (content, response) => {
           // 更新 sessionId
           if (response && response.sessionId && !sessionId) {
             setSessionId(response.sessionId);
           }
           
           currentAssistantMessageRef.current += content;
           
           setMessages(prev => {
             return prev.map(msg => {
               if (msg.id === assistantMsgId) {
                 return { ...msg, content: currentAssistantMessageRef.current };
               }
               return msg;
             });
           });
        },
        () => {
          setIsLoading(false);
        },
        (err) => {
          console.error(err);
          currentAssistantMessageRef.current += '\n[出错啦，请稍后再试]';
          setMessages(prev => {
             return prev.map(msg => {
               if (msg.id === assistantMsgId) {
                 return { ...msg, content: currentAssistantMessageRef.current };
               }
               return msg;
             });
           });
          setIsLoading(false);
        }
      );
    } catch (error) {
       console.error("Failed to load api or fetch", error);
       setIsLoading(false);
    }
  };

  // 键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="global-assistant-panel">
      {/* 聊天窗口内容 */}
        <div className="window-header">
          <div className="title">
            <IconRobot style={{ fontSize: 20, color: 'var(--color-primary-6)' }} />
            <span>智能助手</span>
          </div>
          <div className="actions">
            <Tooltip content="收起">
              <IconClose onClick={onClose} style={{ fontSize: 16 }} />
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
                {msg.role === 'assistant' && isLoading && msg.id === messages[messages.length-1].id && (
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
  );
};

export default GlobalAssistant;
