import React from 'react';
import { Card, Space, Typography } from '@arco-design/web-react';

const { Text } = Typography;

const NODE_TYPES = [
  { type: "start", label: "开始", color: "#52c41a", icon: "🚀" },
  { type: "end", label: "结束", color: "#f5222d", icon: "🏁" },
  { type: "llm", label: "大模型", color: "#165dff", icon: "🤖" },
  { type: "knowledge", label: "知识库", color: "#722ed1", icon: "📚" },
  { type: "skill", label: "技能", color: "#faad14", icon: "🛠️" },
  { type: "condition", label: "条件判断", color: "#eb2f96", icon: "🔀" },
];

const Sidebar: React.FC = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div style={{ height: '100%', padding: '10px', borderRight: '1px solid #e5e6eb', background: '#fff' }}>
      <Typography.Title heading={6} style={{ marginTop: 0 }}>组件库</Typography.Title>
      <Space direction="vertical" style={{ width: '100%' }}>
        {NODE_TYPES.map((node) => (
          <div
            key={node.type}
            onDragStart={(event) => onDragStart(event, node.type, node.label)}
            draggable
            style={{
              padding: '10px',
              border: `1px solid ${node.color}`,
              borderRadius: '4px',
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              background: '#fff',
              marginBottom: '8px'
            }}
          >
            <span style={{ marginRight: '8px', fontSize: '16px' }}>{node.icon}</span>
            <Text>{node.label}</Text>
          </div>
        ))}
      </Space>
    </div>
  );
};

export default Sidebar;
