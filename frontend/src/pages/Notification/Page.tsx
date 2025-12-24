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
  Tabs,
} from "@arco-design/web-react";
import {
  IconSend,
  IconNotification,
} from "@arco-design/web-react/icon";
import { sendNotification, getUserList, UserOption } from "./api";
import LogViewer from "./components/LogViewer";
import "./style/index.less";
const {Content} = Layout;
const { Row, Col } = Grid;
const { TextArea } = Input;
const TabPane = Tabs.TabPane;

interface JobInfo {
  id: string;
  taskClass: string;
  taskParams: string;
  queueName?: string;
  priority: number;
}

const NotificationPage: React.FC = () => {
  const formRef = useRef<any>(null);
  const [sending, setSending] = useState(false);
  const [userList, setUserList] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [jobs, setJobs] = useState<JobInfo[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [channel, setChannel] = useState<string>('SYSTEM');

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
        channel: values.channel || "SYSTEM",
      };

      setSending(true);
      const resp = await sendNotification(payload);
      if (resp?.success !== false) {
        Message.success(`消息发送成功，创建了 ${resp?.count || 0} 个作业`);
        // 如果返回了jobs数组，显示日志
        if (resp?.jobs && Array.isArray(resp.jobs) && resp.jobs.length > 0) {
          setJobs(resp.jobs);
          setActiveTab(resp.jobs[0].id);
        }
        formRef.current?.resetFields?.();
      }
    } catch (error: any) {
      if (error?.fields) return; // 表单校验错误
      Message.error(error?.message || "消息发送失败");
    } finally {
      setSending(false);
    }
  };

  // 关闭指定的tab
  const handleCloseTab = (jobId: string) => {
    const newJobs = jobs.filter(j => j.id !== jobId);
    setJobs(newJobs);
    if (activeTab === jobId && newJobs.length > 0) {
      setActiveTab(newJobs[0].id);
    } else if (newJobs.length === 0) {
      setActiveTab('');
    }
  };

  // 关闭所有tab
  const handleCloseAll = () => {
    setJobs([]);
    setActiveTab('');
  };

  return (
    <div className="notification-page">
      <Layout>
        <Content>
          <Row gutter={16} style={{ height: '100%' }}>
            {/* 左侧表单区域 */}
            <Col span={jobs.length > 0 ? 12 : 24} style={{height: '100%'}}>
              <Card className="notification-card" bordered style={{ height: '100%' }}>
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
                    发送渠道
                  </Typography.Text>
                  <Form.Item
                    label="通知渠道"
                    field="channel"
                    initialValue="SYSTEM"
                    rules={[{ required: true, message: "请选择通知渠道" }]}
                  >
                    <Select 
                      placeholder="请选择通知渠道"
                      onChange={(value) => setChannel(value)}
                    >
                      <Select.Option value="SYSTEM">系统消息</Select.Option>
                      <Select.Option value="EMAIL">邮件</Select.Option>
                      <Select.Option value="SMS">短信</Select.Option>
                    </Select>
                  </Form.Item>

                  <Divider style={{ margin: "12px 0" }} />

                  <Typography.Text className="section-title">
                    接收人
                  </Typography.Text>
                  <Form.Item
                    label={channel === 'SYSTEM' ? '接收用户（留空表示发送给所有用户）' : '接收用户'}
                    field="userIds"
                    rules={channel !== 'SYSTEM' ? [{ required: true, message: "请选择接收用户" }] : []}
                  >
                    <Select
                      mode="multiple"
                      placeholder={channel === 'SYSTEM' ? '请选择接收用户，不选择则发送给所有用户' : '请选择接收用户'}
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
                      {userList
                        .filter((user) => {
                          // 根据渠道过滤用户：EMAIL渠道只显示有邮箱的用户，SMS渠道只显示有电话的用户
                          if (channel === 'EMAIL') {
                            return user.email && user.email.trim() !== '';
                          }
                          if (channel === 'SMS') {
                            return user.phone && user.phone.trim() !== '';
                          }
                          return true;
                        })
                        .map((user) => (
                          <Select.Option key={user.userId} value={user.userId}>
                            {user.userName} ({user.userId})
                            {channel === 'EMAIL' && user.email && ` - ${user.email}`}
                            {channel === 'SMS' && user.phone && ` - ${user.phone}`}
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
            </Col>

            {/* 右侧日志区域 - 选项卡模式 */}
            {jobs.length > 0 && (
              <Col span={12} style={{height: '100%'}}>
                <Card 
                  title="发送日志" 
                  bordered 
                  style={{ height: '100%' }}
                  extra={
                    <Button size="small" onClick={handleCloseAll}>
                      关闭所有
                    </Button>
                  }
                >
                  <Tabs 
                    activeTab={activeTab} 
                    onChange={setActiveTab}
                    type="card-gutter"
                    style={{ height: 'calc(100% - 60px)' }}
                  >
                    {jobs.map((job) => {
                      // 从taskParams中提取title作为tab名称
                      let tabTitle = job.id;
                      try {
                        const params = JSON.parse(job.taskParams || '{}');
                        tabTitle = params.title || job.id;
                      } catch (e) {
                        // ignore
                      }
                      
                      return (
                        <TabPane
                          key={job.id}
                          title={
                            <span>
                              {tabTitle}
                              <Button
                                type="text"
                                size="mini"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCloseTab(job.id);
                                }}
                                style={{ marginLeft: 8 }}
                              >
                                ×
                              </Button>
                            </span>
                          }
                        >
                          <div style={{ height: 'calc(100vh - 240px)', overflow: 'hidden' }}>
                            <LogViewer jobId={job.id} />
                          </div>
                        </TabPane>
                      );
                    })}
                  </Tabs>
                </Card>
              </Col>
            )}
          </Row>
        </Content>
      </Layout>
    </div>
  );
};

export default NotificationPage;

