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
import { UserDto, UserUpdateDto } from '../../../types/user';
import { UserService } from '../../../services/userService';

const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;
const Option = Select.Option;

interface EditUserModalProps {
  visible: boolean;
  user: UserDto | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  visible,
  user,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);

  // 当用户数据变化时，更新表单
  useEffect(() => {
    if (visible && user) {
      form.setFieldsValue({
        userName: user.userName,
        email: user.email,
        phone: user.phone,
        defaultTeam: user.defaultTeam,
        logo: user.logo,
      });
    }
  }, [visible, user, form]);

  // 检查邮箱唯一性（排除当前用户）
  const checkEmail = async (email: string) => {
    if (!email || !user) return;
    // 如果邮箱没有变化，不需要检查
    if (email === user.email) return;
    
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

  // 检查手机号唯一性（排除当前用户）
  const checkPhone = async (phone: string) => {
    if (!phone || !user) return;
    // 如果手机号没有变化，不需要检查
    if (phone === user.phone) return;
    
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
    if (!user) return;
    
    try {
      const values = await form.validate();
      setLoading(true);

      const userData: UserUpdateDto = {
        userName: values.userName,
        email: values.email,
        phone: values.phone,
        defaultTeam: values.defaultTeam,
        logo: values.logo,
      };

      const response = await UserService.updateUser(user.id, userData);
      if (response.success) {
        Message.success('更新用户成功');
        onSuccess();
      } else {
        Message.error(response.message || '更新用户失败');
      }
    } catch (error) {
      console.error('更新用户失败:', error);
      Message.error('更新用户失败');
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
      title={`编辑用户 - ${user?.userName || ''}`}
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
        {/* 显示用户账号（只读） */}
        <FormItem label="用户账号">
          <Input value={user?.userId} disabled />
        </FormItem>

        <Row gutter={16}>
          <Col span={12}>
            <FormItem
              field="userName"
              label="用户姓名"
              rules={[
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

export default EditUserModal;