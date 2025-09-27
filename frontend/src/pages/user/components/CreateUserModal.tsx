import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Message,
  Grid,
} from '@arco-design/web-react';
import { UserCreateDto } from '../../../types/user';
import { UserService } from '../../../services/userService';

const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;
const Option = Select.Option;

interface CreateUserModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [checkingUserId, setCheckingUserId] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);

  // 检查用户账号唯一性
  const checkUserId = async (userId: string) => {
    if (!userId) return;
    setCheckingUserId(true);
    try {
      const response = await UserService.checkUserId(userId);
      if (response.exists) {
        return Promise.reject('用户账号已存在');
      }
    } catch (error) {
      console.error('检查用户账号失败:', error);
      return Promise.reject('检查用户账号失败');
    } finally {
      setCheckingUserId(false);
    }
  };

  // 检查邮箱唯一性
  const checkEmail = async (email: string) => {
    if (!email) return;
    setCheckingEmail(true);
    try {
      const response = await UserService.checkEmail(email);
      if (response.exists) {
        return Promise.reject('邮箱已存在');
      }
    } catch (error) {
      console.error('检查邮箱失败:', error);
      return Promise.reject('检查邮箱失败');
    } finally {
      setCheckingEmail(false);
    }
  };

  // 检查手机号唯一性
  const checkPhone = async (phone: string) => {
    if (!phone) return;
    setCheckingPhone(true);
    try {
      const response = await UserService.checkPhone(phone);
      if (response.exists) {
        return Promise.reject('手机号已存在');
      }
    } catch (error) {
      console.error('检查手机号失败:', error);
      return Promise.reject('检查手机号失败');
    } finally {
      setCheckingPhone(false);
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validate();
      setLoading(true);

      const userData: UserCreateDto = {
        userId: values.userId,
        userName: values.userName,
        userPwd: values.userPwd,
        email: values.email,
        phone: values.phone,
        defaultTeam: values.defaultTeam,
        logo: values.logo,
      };

      const response = await UserService.createUser(userData);
      if (response.success) {
        Message.success('创建用户成功');
        form.resetFields();
        onSuccess();
      } else {
        Message.error(response.message || '创建用户失败');
      }
    } catch (error) {
      console.error('创建用户失败:', error);
      Message.error('创建用户失败');
    } finally {
      setLoading(false);
    }
  };

  // 取消
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="新增用户"
      visible={visible}
      onCancel={handleCancel}
      footer={
        <div>
          <Button onClick={handleCancel}>取消</Button>
          <Button type="primary" loading={loading} onClick={handleSubmit} style={{marginLeft: '8px'}}>
            确定
          </Button>
        </div>
      }
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        scrollToFirstError
      >
        <Row gutter={16}>
          <Col span={12}>
            <FormItem
              field="userId"
              label="用户账号"
              rules={[
                { required: true, message: '请输入用户账号' },
                { max: 32, message: '用户账号不能超过32个字符' },
                {
                  validator: (value, callback) => {
                    if (value) {
                      checkUserId(value)
                        .then(() => callback())
                        .catch((error) => callback(error));
                    } else {
                      callback();
                    }
                  },
                },
              ]}
            >
              <Input
                placeholder="请输入用户账号"
                loading={checkingUserId}
                allowClear
              />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem
              field="userName"
              label="用户姓名"
              rules={[
                { required: true, message: '请输入用户姓名' },
                { max: 128, message: '用户姓名不能超过128个字符' },
              ]}
            >
              <Input placeholder="请输入用户姓名" allowClear />
            </FormItem>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <FormItem
              field="userPwd"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { minLength: 6, message: '密码至少6个字符' },
                { maxLength: 20, message: '密码不能超过20个字符' },
              ]}
            >
              <Input.Password placeholder="请输入密码" allowClear />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem
              field="confirmPassword"
              label="确认密码"
              rules={[
                { required: true, message: '请确认密码' },
                {
                  validator: (value, callback) => {
                    const password = form.getFieldValue('userPwd');
                    if (value && value !== password) {
                      callback('两次输入的密码不一致');
                    } else {
                      callback();
                    }
                  },
                },
              ]}
            >
              <Input.Password placeholder="请确认密码" allowClear />
            </FormItem>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <FormItem
              field="email"
              label="邮箱"
              rules={[
                { type: 'email', message: '请输入正确的邮箱格式' },
                { max: 64, message: '邮箱不能超过64个字符' },
                {
                  validator: (value, callback) => {
                    if (value) {
                      checkEmail(value)
                        .then(() => callback())
                        .catch((error) => callback(error));
                    } else {
                      callback();
                    }
                  },
                },
              ]}
            >
              <Input
                placeholder="请输入邮箱"
                loading={checkingEmail}
                allowClear
              />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem
              field="phone"
              label="手机号"
              rules={[
                { max: 16, message: '手机号不能超过16个字符' },
                {
                  validator: (value, callback) => {
                    if (value) {
                      checkPhone(value)
                        .then(() => callback())
                        .catch((error) => callback(error));
                    } else {
                      callback();
                    }
                  },
                },
              ]}
            >
              <Input
                placeholder="请输入手机号"
                loading={checkingPhone}
                allowClear
              />
            </FormItem>
          </Col>
        </Row>

        <FormItem
          field="defaultTeam"
          label="默认团队"
          rules={[
            { max: 32, message: '默认团队不能超过32个字符' },
          ]}
        >
          <Input placeholder="请输入默认团队" allowClear />
        </FormItem>

        <FormItem
          field="logo"
          label="头像URL"
          rules={[
            { max: 256, message: '头像URL不能超过256个字符' },
            { type: 'url', message: '请输入正确的URL格式' },
          ]}
        >
          <Input placeholder="请输入头像URL" allowClear />
        </FormItem>
      </Form>
    </Modal>
  );
};

export default CreateUserModal;