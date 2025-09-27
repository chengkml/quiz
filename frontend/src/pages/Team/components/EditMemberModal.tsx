import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Message,
  Grid,
} from '@arco-design/web-react';
import { TeamMemberDto } from '../../../types/team';
import { teamService } from '../../../services/teamService';
import { RoleService } from '../../../services/roleService';
import { RoleDto } from '../../../types/role';

const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;
const Option = Select.Option;

interface EditMemberModalProps {
  visible: boolean;
  member: TeamMemberDto | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const EditMemberModal: React.FC<EditMemberModalProps> = ({
  visible,
  member,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

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
      setRolesLoading(false);
    }
  };

  // 当模态框打开时，获取角色列表
  useEffect(() => {
    if (visible) {
      fetchRoles();
    }
  }, [visible]);

  // 当成员数据变化时，更新表单
  useEffect(() => {
    if (visible && member) {
      form.setFieldsValue({
        roleName: member.roleName,
      });
    }
  }, [visible, member, form]);

  // 提交表单
  const handleSubmit = async () => {
    if (!member) return;

    try {
      const values = await form.validate();
      setLoading(true);

      const response = await teamService.updateMemberRole(member.memberId, values.roleName);
      if (response.success) {
        Message.success('更新成员角色成功');
        onSuccess();
      } else {
        Message.error(response.message || '更新成员角色失败');
      }
    } catch (error) {
      console.error('更新成员角色失败:', error);
      Message.error('更新成员角色失败');
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
      title="编辑成员"
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
      <Form form={form} layout="vertical">
        <FormItem label="用户ID">
          <Input value={member?.userId} disabled />
        </FormItem>
        
        <FormItem label="用户名">
          <Input value={member?.userName} disabled />
        </FormItem>
        
        <FormItem label="团队名称">
          <Input value={member?.teamName} disabled />
        </FormItem>
        
        <FormItem
           field="roleName"
           label="角色"
           rules={[{ required: true, message: '请选择角色' }]}
         >
           <Select 
             placeholder="请选择角色"
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

export default EditMemberModal;