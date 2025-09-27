import React, { useState, useEffect } from 'react';
import {
  Modal,
  Transfer,
  Message,
  Spin,
} from '@arco-design/web-react';
import { UserService } from '../../../services/userService';
import { RoleService } from '../../../services/roleService';
import { UserDto, AssignRolesRequest } from '../../../types/user';
import { RoleDto } from '../../../types/role';

interface AssignRolesModalProps {
  visible: boolean;
  user: UserDto | null;
  onCancel: () => void;
  onSuccess: () => void;
}

interface TransferItem {
  key: string;
  title: string;
  description?: string;
}

const AssignRolesModal: React.FC<AssignRolesModalProps> = ({
  visible,
  user,
  onCancel,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allRoles, setAllRoles] = useState<RoleDto[]>([]);
  const [userRoles, setUserRoles] = useState<RoleDto[]>([]);
  const [targetKeys, setTargetKeys] = useState<string[]>([]);

  // 获取所有角色列表
  const fetchAllRoles = async () => {
    try {
      setLoading(true);
      const response = await RoleService.getRoles({
        page: 0,
        size: 1000, // 获取所有角色
        roleType: 'SYSTEM',
        state: '1' // 只获取启用的角色
      });
      if (response.success) {
        setAllRoles(response.data || []);
      } else {
        Message.error('获取角色列表失败');
      }
    } catch (error) {
      console.error('获取角色列表失败:', error);
      Message.error('获取角色列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取用户已分配的角色
  const fetchUserRoles = async (userId: string) => {
    try {
      const response = await UserService.getUserRoles(userId);
      if (response.success) {
        const roles = response.data || [];
        setUserRoles(roles);
        setTargetKeys(roles.map(role => role.roleId));
      } else {
        Message.error('获取用户角色失败');
      }
    } catch (error) {
      console.error('获取用户角色失败:', error);
      Message.error('获取用户角色失败');
    }
  };

  // 处理角色分配
  const handleAssignRoles = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const assignData: AssignRolesRequest = {
        roleIds: targetKeys
      };
      
      const response = await UserService.assignRoles(user.userId, assignData);
      if (response.success) {
        Message.success('角色分配成功');
        onSuccess();
      } else {
        Message.error(response.message || '角色分配失败');
      }
    } catch (error) {
      console.error('角色分配失败:', error);
      Message.error('角色分配失败');
    } finally {
      setSaving(false);
    }
  };

  // 处理穿梭框变化
  const handleTransferChange = (newTargetKeys: string[]) => {
    setTargetKeys(newTargetKeys);
  };

  // 转换角色数据为穿梭框格式
  const transferData = allRoles.map(role => ({
    key: role.roleId,
    value: role.roleName
  }));

  // 当模态框打开时加载数据
  useEffect(() => {
    if (visible && user) {
      fetchAllRoles();
      fetchUserRoles(user.userId);
    }
  }, [visible, user]);

  // 重置状态
  const handleCancel = () => {
    setTargetKeys([]);
    setAllRoles([]);
    setUserRoles([]);
    onCancel();
  };

  return (
    <Modal
      title={`为【${user?.userName}】分配角色`}
      visible={visible}
      onCancel={handleCancel}
      onOk={handleAssignRoles}
      confirmLoading={saving}
      style={{width: 'auto'}}
      okText="确定"
      cancelText="取消"
    >
      <Spin loading={loading}>
        <div style={{ minHeight: '400px' }}>
          <Transfer
            dataSource={transferData}
            targetKeys={targetKeys}
            onChange={handleTransferChange}
            titleTexts={['可分配角色', '已分配角色']}
            listStyle={{
              width: '300px',
              height: '400px'
            }}
            searchable
            searchPlaceholder="搜索角色"
          />
        </div>
      </Spin>
    </Modal>
  );
};

export default AssignRolesModal;