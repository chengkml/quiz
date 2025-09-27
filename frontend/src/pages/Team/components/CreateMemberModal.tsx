import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Message,
} from '@arco-design/web-react';
import { TeamMemberDto } from '../../../types/team';
import { UserDto, UserQueryParams } from '../../../types/user';
import { teamService } from '../../../services/teamService';
import { UserService } from '../../../services/userService';
import { RoleService } from '../../../services/roleService';
import { RoleDto } from '../../../types/role';

const FormItem = Form.Item;
const { Option } = Select;

interface CreateMemberModalProps {
  visible: boolean;
  teamId: string;
  teamName: string;
  onCancel: () => void;
  onSuccess: () => void;
}

const CreateMemberModal: React.FC<CreateMemberModalProps> = ({
  visible,
  teamId,
  teamName,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await UserService.getUsers({ page: 0, size: 1000 });
      if (response.success) {
        setUsers(response.data || []);
      } else {
        Message.error('获取用户列表失败');
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      Message.error('获取用户列表失败');
    } finally {
       setRolesLoading(false);
     }
  };

  // 获取角色列表
  const fetchRoles = async () => {
    try {
      setRolesLoading(true);
      const response = await RoleService.getRoles({
        state: '1', // 只获取启用的角色
        roleType: 'team-role', // 只获取团队角色类型
        page: 0, // 后端分页从0开始
        size: 100
      });
      if (response.success) {
        setRoles(response.data || []);
      } else {
        Message.error('获取角色列表失败');
      }
    } catch (error) {
      console.error('获取角色列表失败:', error);
      Message.error('获取角色列表失败');
    } finally {
      setUsersLoading(false);
    }
  };

  // 组件挂载时获取用户列表和角色列表
  useEffect(() => {
    if (visible) {
      fetchUsers();
      fetchRoles();
    }
  }, [visible]);

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validate();
      setLoading(true);

      // 从选中的用户ID中解析出用户信息
      const selectedUser = users.find(user => user.userId === values.selectedUser);
      if (!selectedUser) {
        Message.error('请选择有效的用户');
        return;
      }

      const memberData: Partial<TeamMemberDto> = {
        teamName,
        userId: selectedUser.userId,
        memberName: `${teamName}-${selectedUser.userId}`,
        roleName: values.roleName, // 这里的值已经是roleId了，因为Select的value是roleId
        state: '1', // 默认为生效状态
      };

      const response = await teamService.createTeamMember(memberData);
      if (response.success) {
        Message.success('添加成员成功');
        form.resetFields();
        onSuccess();
      } else {
        Message.error(response.message || '添加成员失败');
      }
    } catch (error) {
      console.error('添加成员失败:', error);
      Message.error('添加成员失败');
    } finally {
      setLoading(false);
    }
  };

  // 取消操作
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="新增成员"
      visible={visible}
      onCancel={handleCancel}
      footer={
        <div>
          <Button onClick={handleCancel}>取消</Button>
          <Button type="primary" loading={loading} onClick={handleSubmit}>
            确定
          </Button>
        </div>
      }
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          state: '1',
          roleName: 'user',
        }}
      >
        <FormItem
          field="selectedUser"
          label="选择用户"
          rules={[
            { required: true, message: '请选择用户' },
          ]}
        >
          <Select 
            placeholder="请选择用户" 
            loading={usersLoading}
            showSearch
            filterOption={(inputValue, option) => {
              const user = users.find(u => u.userId === option?.value);
              if (!user) return false;
              return user.userId.toLowerCase().includes(inputValue.toLowerCase()) ||
                     user.userName.toLowerCase().includes(inputValue.toLowerCase());
            }}
          >
            {users.map(user => (
              <Option key={user.userId} value={user.userId}>
                {user.userId} - {user.userName}
              </Option>
            ))}
          </Select>
        </FormItem>

        <FormItem
          field="roleName"
          label="用户角色"
          rules={[{ required: true, message: '请选择用户角色' }]}
        >
          <Select 
            placeholder="请选择用户角色"
            loading={rolesLoading}
          >
            {roles.map(role => (
              <Option key={role.roleId} value={role.roleId}>
                {role.roleName}
              </Option>
            ))}
          </Select>
        </FormItem>


      </Form>
    </Modal>
  );
};

export default CreateMemberModal;