import React, { useEffect, useState } from 'react';
import { Transfer, Message, Spin } from '@arco-design/web-react';
import { listEnabledMcpTools } from '../api';

interface ToolSelectorProps {
  value?: string[];
  onChange?: (toolIds: string[]) => void;
  disabled?: boolean;
}

interface McpTool {
  id: string;
  displayName: string;
  originName: string;
  description?: string;
  category?: string;
  status?: string;
}

const ToolSelector: React.FC<ToolSelectorProps> = ({
  value = [],
  onChange,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [allTools, setAllTools] = useState<McpTool[]>([]);

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    setLoading(true);
    try {
      const response = await listEnabledMcpTools();
      if (response.data) {
        setAllTools(response.data);
      }
    } catch (error) {
      Message.error('获取MCP工具列表失败');
    } finally {
      setLoading(false);
    }
  };

  const dataSource = allTools.map(tool => ({
    key: tool.id,
    value: tool.displayName || tool.originName,
    description: tool.description || '',
    category: tool.category || '',
  }));

  const handleChange = (newTargetKeys: string[]) => {
    onChange?.(newTargetKeys);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Spin tip="加载工具列表..." />
      </div>
    );
  }

  return (
    <Transfer
      dataSource={dataSource}
      targetKeys={value}
      onChange={handleChange}
      disabled={disabled}
      showSearch
      searchPlaceholder="搜索工具"
      listStyle={{ width: 280, height: 300 }}
      titleTexts={['可选工具', '已选工具']}
      operationTexts={['添加', '移除']}
      render={(item: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{item.value}</div>
          {item.description && (
            <div
              style={{
                fontSize: 12,
                color: 'var(--color-text-3)',
                marginTop: 2,
              }}
            >
              {item.description.length > 50
                ? item.description.substring(0, 50) + '...'
                : item.description}
            </div>
          )}
        </div>
      )}
    />
  );
};

export default ToolSelector;
