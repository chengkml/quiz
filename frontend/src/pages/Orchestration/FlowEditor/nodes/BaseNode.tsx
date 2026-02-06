import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, Typography, Space, Tag } from '@arco-design/web-react';
import { IconSettings } from '@arco-design/web-react/icon';

const { Text } = Typography;

interface BaseNodeProps {
  data: any;
  title: string;
  icon: React.ReactNode;
  color: string;
  hasInput?: boolean;
  hasOutput?: boolean;
  selected?: boolean;
}

const BaseNode: React.FC<BaseNodeProps> = ({ data, title, icon, color, hasInput = true, hasOutput = true, selected }) => {
  return (
    <div
      style={{
        width: 200,
        borderRadius: 8,
        background: '#fff',
        border: `2px solid ${selected ? '#165dff' : '#e5e6eb'}`,
        boxShadow: selected ? '0 0 0 2px rgba(22, 93, 255, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
        transition: 'all 0.2s',
      }}
    >
      {/* Input Handle */}
      {hasInput && (
        <Handle
          type="target"
          position={Position.Left}
          style={{ width: 10, height: 10, background: '#86909c' }}
        />
      )}

      {/* Header */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid #e5e6eb',
          background: `${color}10`, // 10% opacity
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Space>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <Text bold style={{ color }}>{title}</Text>
        </Space>
        {/* Status or other indicators can go here */}
      </div>

      {/* Body */}
      <div style={{ padding: '12px' }}>
        <div style={{ fontSize: 12, color: '#86909c', marginBottom: 4 }}>名称</div>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
            {data.label || title}
        </div>
        
        {data.description && (
          <div style={{ fontSize: 12, color: '#86909c', lineHeight: 1.5 }}>
            {data.description}
          </div>
        )}
      </div>

      {/* Output Handle */}
      {hasOutput && (
        <Handle
          type="source"
          position={Position.Right}
          style={{ width: 10, height: 10, background: '#165dff' }}
        />
      )}
    </div>
  );
};

export default memo(BaseNode);
