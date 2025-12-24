import React from 'react';
import { Avatar, Tooltip } from '@arco-design/web-react';

export interface UserAvatarProps {
  name?: string;
  size?: number;
  shape?: 'circle' | 'square';
  className?: string;
  style?: React.CSSProperties;
  showTooltip?: boolean;
  showName?: boolean;
  nameClassName?: string;
}

const palette = [
  '#165DFF', '#2F54EB', '#597EF7', '#722ED1', '#EB2F96',
  '#F5222D', '#FA8C16', '#13C2C2', '#52C41A', '#009688',
];

function pickColor(name: string): string {
  if (!name) return palette[0];
  const hash = Array.from(name).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name = '',
  size = 24,
  shape = 'circle',
  className,
  style,
  showTooltip = true,
  showName = false,
  nameClassName,
}) => {
  const bg = pickColor(name);
  const letter = (name || '?').trim().charAt(0).toUpperCase();
  const avatar = (
    <Avatar
      size={size}
      shape={shape}
      className={`user-avatar${className ? ' ' + className : ''}`}
      style={{ backgroundColor: bg, color: '#fff', ...style }}
    >
      {letter}
    </Avatar>
  );

  const content = showTooltip && name
    ? <Tooltip content={name} getPopupContainer={() => document.body}>{avatar}</Tooltip>
    : avatar;

  if (!showName) return content;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {content}
      <span className={nameClassName}>{name || '?'}</span>
    </span>
  );
};

export default UserAvatar;
