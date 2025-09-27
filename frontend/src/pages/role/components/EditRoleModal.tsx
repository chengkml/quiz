import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Radio,
  Button,
  Message
} from '@arco-design/web-react';
import { RoleService } from '../../../services/roleService';
import { RoleDto, RoleUpdateDto } from '../../../types/role';

const { Option } = Select;
const { TextArea } = Input;

interface EditRoleModalProps {
  visible: boolean;
  role: RoleDto | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const EditRoleModal: React.FC<EditRoleModalProps> = ({
  visible,
  role,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 角色类型选项
  const roleTypeOptions = [
    { label: '系统角色', value: 'SYSTEM' },
    { label: '业务角色', value: 'BUSINESS' },
  ];

  // 状态选项
  const stateOptions = [
    { label: '启用', value: '1' },
    { label: '禁用', value: '0' },
  ];

  // 当角色数据变化时，更新表单
  useEffect(() => {
    if (visible && role) {
      form.setFieldsValue({
        roleName: role.roleName,
        roleType: role.roleType,
        roleDescr: role.roleDescr,
        state: role.state,
      });
    }
  }, [visible, role, form]);

  // 校验角色名称唯一性（编辑时排除当前角色）
  const validateRoleName = async (value: string) => {
    if (!value || !role) return true;
    
    try {
      const response = await RoleService.checkRoleName(value, role.roleId);
      if (response.exists) {
        throw new Error('该角色名称已存在，请更换');
      }
      return true;
    } catch (error) {
      throw error;
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!role) return;
    
    try {
      const values = await form.validate();
      setLoading(true);

      const roleData: RoleUpdateDto = {
        roleId: role.roleId,
        roleName: values.roleName,
        roleDescr: values.roleDescr,
        roleType: values.roleType,
        state: values.state,
      };

      const response = await RoleService.updateRole(role.roleId, roleData);
      if (response.success) {
        Message.success('更新角色成功');
        onSuccess();
      } else {
        Message.error(response.message || '更新角色失败');
      }
    } catch (error) {
      console.error('更新角色失败:', error);
      Message.error('更新角色失败');
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
      title="编辑角色"
      visible={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          确定
        </Button>,
      ]}
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          field="roleName"
          label="角色名称"
          rules={[
            { required: true, message: '请输入角色名称' },
            { maxLength: 64, message: '角色名称长度不能超过64个字符' },
            {
              validator: (value, callback) => {
                if (!value) {
                  callback();
                  return;
                }
                validateRoleName(value)
                  .then(() => callback())
                  .catch((error) => callback(error.message));
              }
            }
          ]}
        >
          <Input placeholder="请输入角色名称" />
        </Form.Item>

        <Form.Item
          field="roleType"
          label="角色类型"
          rules={[
            { required: true, message: '请选择角色类型' }
          ]}
        >
          <Select placeholder="请选择角色类型">
            {roleTypeOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          field="roleDescr"
          label="角色描述"
          rules={[
            { maxLength: 128, message: '角色描述长度不能超过128个字符' }
          ]}
        >
          <TextArea
            placeholder="请输入角色描述"
            rows={3}
            maxLength={128}
            showWordLimit
          />
        </Form.Item>

        <Form.Item
          field="state"
          label="状态"
          rules={[
            { required: true, message: '请选择状态' }
          ]}
        >
          <Radio.Group>
            {stateOptions.map(option => (
              <Radio key={option.value} value={option.value}>
                {option.label}
              </Radio>
            ))}
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditRoleModal;