import React, { useRef, useState, useEffect } from "react";
import {
  Button,
  Form,
  Grid,
  Input,
  Message,
  Space,
  Card,
  Divider,
  Typography,
  Layout,
  Select,
} from "@arco-design/web-react";
import {
  IconSend,
  IconNotification,
} from "@arco-design/web-react/icon";
import { sendNotification, getUserList, UserOption } from "./api";
import "./style/index.less";
const {Content} = Layout;
const { Row, Col } = Grid;
const { TextArea } = Input;

const NotificationPage: React.FC = () => {
  const formRef = useRef<any>(null);
  const [sending, setSending] = useState(false);
  const [userList, setUserList] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // 获取用户列表
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const response = await getUserList();
        if (response?.content) {
          setUserList(response.content);
        } else {
          console.warn('响应数据格式异常:', response);
        }
      } catch (error) {
        console.error('获取用户列表失败:', error);
        Message.error('获取用户列表失败');
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  const handleSend = async () => {
    try {
      const values = await formRef.current?.validate?.();
      const payload: any = {
        userIds: values.userIds && values.userIds.length > 0 ? values.userIds : undefined,
        title: values.title || "",
        content: values.content || "",
        type: values.type || "INFO",
      };

      setSending(true);
      const resp = await sendNotification(payload);
      if (resp?.success !== false) {
        Message.success("消息发送成功");
        formRef.current?.resetFields?.();
      }
    } catch (error: any) {
      if (error?.fields) return; // 表单校验错误
      Message.error(error?.message || "消息发送失败");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="notification-page">
      <Layout>
        <Content>
          <Card className="notification-card" bordered>
            <div className="header">
              <Space size="large" align="center">
                <span className="channel-icon"><IconNotification /></span>
                <Typography.Title heading={4} style={{ margin: 0 }}>
                  系统消息发送
                </Typography.Title>
              </Space>
            </div>

            <Form
              ref={formRef}
              layout="vertical"
              className="notification-form"
            >
              <Divider style={{ margin: "12px 0" }} />

              <Typography.Text className="section-title">
                接收人
              </Typography.Text>
              <Form.Item
                label="接收用户（留空表示发送给所有用户）"
                field="userIds"
              >
                <Select
                  mode="multiple"
                  placeholder="请选择接收用户，不选择则发送给所有用户"
                  loading={loadingUsers}
                  showSearch
                  filterOption={(inputValue, option) => {
                    const user = userList.find(u => u.userId === option.value);
                    if (!user) return false;
                    const searchText = inputValue.toLowerCase();
                    return (
                      user.userId?.toLowerCase().includes(searchText) ||
                      user.userName?.toLowerCase().includes(searchText) ||
                      user.email?.toLowerCase().includes(searchText) ||
                      user.phone?.toLowerCase().includes(searchText) ||
                      false
                    );
                  }}
                  allowClear
                >
                  {userList.map((user) => (
                    <Select.Option key={user.userId} value={user.userId}>
                      {user.userName} ({user.userId})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Divider style={{ margin: "12px 0" }} />

              <Typography.Text className="section-title">
                消息内容
              </Typography.Text>
              <Form.Item
                label="消息标题"
                field="title"
                rules={[{ required: true, message: "请输入消息标题" }]}
              >
                <Input placeholder="请输入消息标题" />
              </Form.Item>

              <Form.Item
                label="消息内容"
                field="content"
                rules={[{ required: true, message: "请输入消息内容" }]}
              >
                <TextArea
                  placeholder="请输入消息内容"
                  autoSize={{ minRows: 4, maxRows: 10 }}
                />
              </Form.Item>

              <Form.Item
                label="消息类型"
                field="type"
                initialValue="INFO"
              >
                <Select placeholder="请选择消息类型">
                  <Select.Option value="INFO">信息</Select.Option>
                  <Select.Option value="WARNING">警告</Select.Option>
                  <Select.Option value="ERROR">错误</Select.Option>
                  <Select.Option value="SUCCESS">成功</Select.Option>
                </Select>
              </Form.Item>

              <div className="actions">
                <Space>
                  <Button
                    type="primary"
                    icon={<IconSend />}
                    loading={sending}
                    onClick={handleSend}
                  >
                    发送
                  </Button>
                  <Button onClick={() => formRef.current?.resetFields?.()}>
                    重置
                  </Button>
                </Space>
              </div>
            </Form>
          </Card>
        </Content>
      </Layout>
    </div>
  );
};

export default NotificationPage;

