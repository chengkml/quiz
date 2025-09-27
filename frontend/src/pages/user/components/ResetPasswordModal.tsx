import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Message,
} from '@arco-design/web-react';
import { UserDto, ResetPasswordRequest } from '../../../types/user';
import { UserService } from '../../../services/userService';

const FormItem = Form.Item;

interface ResetPasswordModalProps {
  visible: boolean;
  user: UserDto | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  visible,
  user,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 提交表单
  const handleSubmit = async () => {
    if (!user) return;
    
    try {
      const values = await form.validate();
      setLoading(true);

      const resetData: ResetPasswordRequest = {
        newPassword: values.newPassword,
      };

      const response = await UserService.resetPassword(user.userId, resetData);
      if (response.success) {
        Message.success('密码重置成功');
        form.resetFields();
        onSuccess();
      } else {
        Message.error(response.message || '密码重置失败');
      }
    } catch (error) {
      console.error('密码重置失败:', error);
      Message.error('密码重置失败');
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
      title={`重置密码 - ${user?.userName || ''}`}
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
      width={400}
    >
      <Form
        form={form}
        layout="vertical"
        scrollToFirstError
      >
        {/* 显示用户信息 */}
        <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f7f8fa', borderRadius: 4 }}>
          <div><strong>用户账号：</strong>{user?.userId}</div>
          <div><strong>用户姓名：</strong>{user?.userName}</div>
        </div>

        <FormItem
          field="newPassword"
          label="新密码"
          rules={[
            { required: true, message: '请输入新密码' },
            { minLength: 6, message: '密码至少6个字符' },
            { maxLength: 20, message: '密码不能超过20个字符' },
          ]}
        >
          <Input.Password placeholder="请输入新密码" allowClear />
        </FormItem>

        <FormItem
          field="confirmPassword"
          label="确认密码"
          rules={[
            { required: true, message: '请确认密码' },
            {
              validator: (value, callback) => {
                const newPassword = form.getFieldValue('newPassword');
                if (value && value !== newPassword) {
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

        <div style={{ color: '#86909c', fontSize: 12, marginTop: 8 }}>
          <div>• 密码长度为6-20个字符</div>
          <div>• 建议包含字母、数字和特殊字符</div>
          <div>• 重置后用户需要使用新密码登录</div>
        </div>
      </Form>
    </Modal>
  );
};

export default ResetPasswordModal;