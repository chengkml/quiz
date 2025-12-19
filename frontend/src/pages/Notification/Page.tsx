import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  Button,
  Form,
  Grid,
  Input,
  Message,
  Radio,
  Space,
  Card,
  Upload,
  Divider,
  Typography,
  Layout,
  Select,
} from "@arco-design/web-react";
import {
  IconSend,
  IconEmail,
  IconMobile,
  IconNotification,
} from "@arco-design/web-react/icon";
import { sendNotification, getUserList, UserOption } from "./api";
import "./style/index.less";
import RichTextEditor from "./components/RichTextEditor";
const {Content} = Layout;
const { Row, Col } = Grid;
const { TextArea } = Input;

type ChannelType = "SMS" | "BROWSER" | "EMAIL";

const NotificationPage: React.FC = () => {
  const formRef = useRef<any>(null);
  const [sending, setSending] = useState(false);
  const [channel, setChannel] = useState<ChannelType>("BROWSER");
  const [browserContentHtml, setBrowserContentHtml] = useState<string>("");
  const [fileList, setFileList] = useState<any[]>([]);
  const [userList, setUserList] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // 获取用户列表
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const response = await getUserList();
        console.log('用户列表响应:', response);
        if (response?.content) {
          console.log('用户列表数据:', response.content);
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

  const channelIcon = useMemo(() => {
    switch (channel) {
      case "SMS":
        return <IconMobile />;
      case "EMAIL":
        return <IconEmail />;
      default:
        return <IconNotification />;
    }
  }, [channel]);

  const parseList = (text?: string): string[] => {
    if (!text) return [];
    return text
      .split(/[,;\n\r\t ]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const handleSend = async () => {
    try {
      const values = await formRef.current?.validate?.();
      const payload: any = {
        channel,
        title: values.title || "",
        content: values.content || "",
        recipients: values.recipients || [],
        cc: channel === "EMAIL" ? (values.cc || []) : undefined,
        bcc: channel === "EMAIL" ? (values.bcc || []) : undefined,
        contentHtml: channel === "BROWSER" ? browserContentHtml : undefined,
        linkUrl: channel === "BROWSER" ? values.linkUrl || "" : undefined,
        attachments:
          channel === "EMAIL"
            ? fileList
                .map((it: any) => it.originFile || it.file)
                .filter(Boolean)
            : undefined,
      };

      setSending(true);
      const resp = await sendNotification(payload);
      if (resp?.success !== false) {
        Message.success("消息发送成功");
        formRef.current?.resetFields?.();
        setBrowserContentHtml("");
        setFileList([]);
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
                  <span className="channel-icon">{channelIcon}</span>
                  <Typography.Title heading={4} style={{ margin: 0 }}>
                    消息发送
                  </Typography.Title>
                </Space>
              </div>

              <Form
                ref={formRef}
                layout="vertical"
                className="notification-form"
              >
                <Form.Item
                  label="发送方式"
                  field="channel"
                  rules={[{ required: true, message: "请选择发送方式" }]}
                  initialValue={channel}
                >
                  <Radio.Group
                    value={channel}
                    onChange={(val: ChannelType) => setChannel(val)}
                  >
                    <Radio value="BROWSER">浏览器通知</Radio>
                    <Radio value="EMAIL">邮件</Radio>
                    <Radio value="SMS">短信</Radio>
                  </Radio.Group>
                </Form.Item>

                <Divider style={{ margin: "12px 0" }} />

                <Typography.Text className="section-title">
                  接收人
                </Typography.Text>
                <Form.Item
                  label={
                    channel === "SMS"
                      ? "接收用户"
                      : channel === "EMAIL"
                      ? "收件人"
                      : "接收用户"
                  }
                  field="recipients"
                  rules={[{ required: true, message: "请选择接收人" }]}
                >
                  <Select
                    mode="multiple"
                    placeholder="请选择接收用户"
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
                    {userList.map((user) => {
                      let extraInfo = '';
                      if (channel === "SMS") {
                        extraInfo = user.phone || user.userId;
                      } else if (channel === "EMAIL") {
                        extraInfo = user.email || user.userId;
                      } else {
                        extraInfo = user.userId;
                      }
                      return (
                        <Select.Option key={user.userId} value={user.userId}>
                          {user.userName} ({extraInfo})
                        </Select.Option>
                      );
                    })}
                  </Select>
                </Form.Item>

                {channel === "EMAIL" && (
                  <>
                    <Form.Item label="抄送" field="cc">
                      <Select
                        mode="multiple"
                        placeholder="请选择抄送用户"
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
                            false
                          );
                        }}
                        allowClear
                      >
                        {userList.map((user) => (
                          <Select.Option key={user.userId} value={user.userId}>
                            {user.userName} ({user.email || user.userId})
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item label="密送" field="bcc">
                      <Select
                        mode="multiple"
                        placeholder="请选择密送用户"
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
                            false
                          );
                        }}
                        allowClear
                      >
                        {userList.map((user) => (
                          <Select.Option key={user.userId} value={user.userId}>
                            {user.userName} ({user.email || user.userId})
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </>
                )}

                <Divider style={{ margin: "12px 0" }} />

                {channel !== "SMS" && (
                  <Form.Item
                    label={channel === "EMAIL" ? "邮件主题" : "通知标题"}
                    field="title"
                    rules={[{ required: true, message: "请输入标题" }]}
                  >
                    <Input placeholder="请输入标题" />
                  </Form.Item>
                )}

                <Typography.Text className="section-title">
                  内容
                </Typography.Text>
                {channel === "BROWSER" ? (
                  <>
                    <Form.Item
                      label="跳转链接"
                      field="linkUrl"
                      rules={[
                        {
                          validator: (
                            value: string,
                            cb: (msg?: string) => void
                          ) => {
                            if (!value) return cb();
                            const ok = /^(https?:\/\/).+/i.test(value);
                            return ok
                              ? cb()
                              : cb("请输入合法的 http/https 链接");
                          },
                        },
                      ]}
                    >
                      <Input placeholder="可选，点击通知跳转的链接，例如 https://example.com/page" />
                    </Form.Item>
                    <Form.Item label="内容（富文本）" required>
                      <RichTextEditor
                        value={browserContentHtml}
                        onChange={setBrowserContentHtml}
                      />
                    </Form.Item>
                  </>
                ) : (
                  <Form.Item
                    label="内容"
                    field="content"
                    rules={[{ required: true, message: "请输入内容" }]}
                  >
                    <TextArea
                      placeholder="请输入消息内容"
                      autoSize={{ minRows: 4, maxRows: 10 }}
                    />
                  </Form.Item>
                )}

                {channel === "EMAIL" && (
                  <>
                    <Divider style={{ margin: "12px 0" }} />
                    <Typography.Text className="section-title">
                      附件
                    </Typography.Text>
                    <Form.Item>
                      <Upload
                        multiple
                        autoUpload={false}
                        fileList={fileList}
                        onChange={setFileList}
                        accept="*"
                      />
                    </Form.Item>
                  </>
                )}

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
