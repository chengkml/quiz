import React from 'react';
import {
  Modal,
  Descriptions,
  Tag,
  Button
} from '@arco-design/web-react';
import { RoleDto } from '../../../types/role';

interface RoleDetailModalProps {
  visible: boolean;
  role: RoleDto | null;
  onCancel: () => void;
}

const RoleDetailModal: React.FC<RoleDetailModalProps> = ({
  visible,
  role,
  onCancel
}) => {
  if (!role) return null;

  // 渲染状态标签
  const renderStatus = (state: string) => {
    if (state === '1') {
      return <Tag color="green">启用</Tag>;
    } else {
      return <Tag color="red">禁用</Tag>;
    }
  };

  // 渲染角色类型
  const renderRoleType = (roleType: string) => {
    const typeMap: { [key: string]: { text: string; color: string } } = {
      'SYSTEM': { text: '系统角色', color: 'blue' },
      'BUSINESS': { text: '业务角色', color: 'orange' },
      'CUSTOM': { text: '自定义角色', color: 'purple' },
    };
    
    const type = typeMap[roleType] || { text: roleType, color: 'gray' };
    return <Tag color={type.color}>{type.text}</Tag>;
  };

  // 格式化时间
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const data = [
    {
      label: '角色ID',
      value: role.roleId,
    },
    {
      label: '角色名称',
      value: role.roleName,
    },
    {
      label: '角色类型',
      value: renderRoleType(role.roleType),
    },
    {
      label: '状态',
      value: renderStatus(role.state),
    },
    {
      label: '角色描述',
      value: role.roleDescr || '-',
    },
    {
      label: '创建时间',
      value: formatDate(role.createDate),
    },
    {
      label: '创建人',
      value: role.createUser || '-',
    },
    {
      label: '更新时间',
      value: role.updateDate ? formatDate(role.updateDate) : '-',
    },
    {
      label: '更新人',
      value: role.updateUser || '-',
    },
  ];

  return (
    <Modal
      title="角色详情"
      visible={visible}
      onCancel={onCancel}
      footer={[
        <Button key="close" type="primary" onClick={onCancel}>
          关闭
        </Button>,
      ]}
      width={600}
    >
      <Descriptions
        data={data}
        column={1}
        layout="horizontal"
        labelStyle={{ width: '120px', textAlign: 'right' }}
        valueStyle={{ paddingLeft: '20px' }}
      />
    </Modal>
  );
};

export default RoleDetailModal;