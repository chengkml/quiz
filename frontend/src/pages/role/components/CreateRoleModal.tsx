import React, { useState } from 'react';
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
import { RoleCreateDto } from '../../../types/role';
import { useUser } from '../../../contexts/UserContext';

const { Option } = Select;
const { TextArea } = Input;

interface CreateRoleModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const CreateRoleModal: React.FC<CreateRoleModalProps> = ({
  visible,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { user } = useUser();

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

  // 校验角色ID唯一性
  const validateRoleId = async (value: string) => {
    if (!value) return true;
    
    try {
      // 这里可以添加角色ID唯一性检查的API调用
      // const response = await RoleService.checkRoleId(value);
      // if (response.exists) {
      //   throw new Error('该角色ID已存在，请更换');
      // }
      return true;
    } catch (error) {
      throw error;
    }
  };

  // 校验角色名称唯一性
  const validateRoleName = async (value: string) => {
    if (!value) return true;
    
    try {
      const response = await RoleService.checkRoleName(value);
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
    try {
      const values = await form.validate();
      setLoading(true);

      const roleData: RoleCreateDto = {
        roleId: values.roleId,
        roleName: values.roleName,
        roleDescr: values.roleDescr,
        roleType: values.roleType,
        state: values.state,
        createUser: user?.userId || user?.userName || '',
      };

      const response = await RoleService.createRole(roleData);
      if (response.success) {
        Message.success('创建角色成功');
        form.resetFields();
        onSuccess();
      } else {
        Message.error(response.message || '创建角色失败');
      }
    } catch (error) {
      console.error('创建角色失败:', error);
      Message.error('创建角色失败');
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
      title="新建角色"
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
        initialValues={{
          state: '1' // 默认启用
        }}
      >
        <Form.Item
          field="roleId"
          label="角色ID"
          rules={[
            { required: true, message: '请输入角色ID' },
            { maxLength: 32, message: '角色ID长度不能超过32个字符' },
            { pattern: /^[a-zA-Z0-9_-]+$/, message: '角色ID只能包含字母、数字、下划线和连字符' },
            {
              validator: (value, callback) => {
                if (!value) {
                  callback();
                  return;
                }
                validateRoleId(value)
                  .then(() => callback())
                  .catch((error) => callback(error.message));
              }
            }
          ]}
        >
          <Input placeholder="请输入角色ID" />
        </Form.Item>

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

export default CreateRoleModal;