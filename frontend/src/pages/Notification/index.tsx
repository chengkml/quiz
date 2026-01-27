import React, { useMemo, useRef, useState } from 'react';
import ExceptionLogPage from './ExceptionLogPage';
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
} from '@arco-design/web-react';
import { IconSend, IconEmail, IconMobile, IconNotification } from '@arco-design/web-react/icon';
import { sendNotification } from './api';
import './style/index.less';
import RichTextEditor from './components/RichTextEditor';

const { Row, Col } = Grid;
const { TextArea } = Input;

type ChannelType = 'SMS' | 'BROWSER' | 'EMAIL';



const NotificationPage = () => {
  const formRef = useRef<any>(null);
  const [sending, setSending] = useState(false);
              const [channel, setChannel] = useState<ChannelType>('BROWSER');
              const [browserContentHtml, setBrowserContentHtml] = useState<string>('');
              const [fileList, setFileList] = useState<any[]>([]);

              const channelIcon = useMemo(() => {
                switch (channel) {
                  case 'SMS':
                    return <IconMobile />;
                  case 'EMAIL':
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
                    channel: channel,
                    title: values.title || '',
                    content: values.content || '',
                    recipients: parseList(values.recipients),
                    cc: channel === 'EMAIL' ? parseList(values.cc) : undefined,
                    bcc: channel === 'EMAIL' ? parseList(values.bcc) : undefined,
                    contentHtml: channel === 'BROWSER' ? browserContentHtml : undefined,
                    linkUrl: channel === 'BROWSER' ? (values.linkUrl || '') : undefined,
                    attachments: channel === 'EMAIL' ? fileList.map((it: any) => it.originFile || it.file).filter(Boolean) : undefined,
                  };

                  setSending(true);
                  const resp = await sendNotification(payload);
                  if (resp?.success !== false) {
                    Message.success('消息发送成功');
                    formRef.current?.resetFields?.();
                    setBrowserContentHtml('');
                    setFileList([]);
                  }
                } catch (error: any) {
                  if (error?.fields) return; // 表单校验错误
                  Message.error(error?.message || '消息发送失败');
                } finally {
                  setSending(false);
                }
              };

              return (
                <div className="notification-page">
                  <div className="notification-container">
                    <Card className="notification-card" bordered>
                      <div className="header">
                        <Space size="large" align="center">
                          <span className="channel-icon">{channelIcon}</span>
                          <Typography.Title heading={4} style={{ margin: 0 }}>消息发送</Typography.Title>
                        </Space>
                        <Radio.Group
                          value={channel}
                          onChange={(val: ChannelType) => setChannel(val)}
                        >
                          <Radio value="BROWSER">浏览器通知</Radio>
                          <Radio value="EMAIL">邮件</Radio>
                          <Radio value="SMS">短信</Radio>
                        </Radio.Group>
                      </div>

                      <Divider style={{ margin: '12px 0' }} />

                      <Form
                        ref={formRef}
                        layout="vertical"
                        className="notification-form"
                      >
                        <Typography.Text className="section-title">接收人</Typography.Text>
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item
                              label={channel === 'SMS' ? '手机号列表' : channel === 'EMAIL' ? '收件人邮箱' : '接收用户（ID/账号）'}
                              field="recipients"
                              rules={[{ required: true, message: '请输入接收人' }]}
                            >
                              <TextArea
                                placeholder={
                                  channel === 'SMS'
                                    ? '支持逗号/分号/空格/换行分隔多个手机号'
                                    : channel === 'EMAIL'
                                    ? '支持逗号/分号/空格/换行分隔多个邮箱'
                                    : '支持逗号/分号/空格/换行分隔多个用户ID或账号'
                                }
                                autoSize={{ minRows: 2, maxRows: 4 }}
                              />
                            </Form.Item>
                          </Col>

                          <Col span={12}>
                            {channel === 'EMAIL' && (
                              <Row gutter={16}>
                                <Col span={12}>
                                  <Form.Item label="抄送" field="cc">
                                    <TextArea
                                      placeholder="可选，多个邮箱以逗号/分号/空格/换行分隔"
                                      autoSize={{ minRows: 2, maxRows: 4 }}
                                    />
                                  </Form.Item>
                                </Col>
                                <Col span={12}>
                                  <Form.Item label="密送" field="bcc">
                                    <TextArea
                                      placeholder="可选，多个邮箱以逗号/分号/空格/换行分隔"
                                      autoSize={{ minRows: 2, maxRows: 4 }}
                                    />
                                  </Form.Item>
                                </Col>
                              </Row>
                            )}
                          </Col>
                        </Row>

                        <Divider style={{ margin: '12px 0' }} />

                        {channel !== 'SMS' && (
                          <Form.Item label={channel === 'EMAIL' ? '邮件主题' : '通知标题'} field="title" rules={[{ required: true, message: '请输入标题' }]}> 
                            <Input placeholder="请输入标题" />
                          </Form.Item>
                        )}

                        <Typography.Text className="section-title">内容</Typography.Text>
                        {channel === 'BROWSER' ? (
                          <>
                            <Form.Item label="跳转链接" field="linkUrl" rules={[{
                              validator: (value: string | undefined, cb: (msg?: string) => void) => {
                                if (!value) return cb();
                                const ok = /^(https?:\/\/).+/i.test(value);
                                return ok ? cb() : cb('请输入合法的 http/https 链接');
                              }
                            }]}
                            >
                              <Input placeholder="可选，点击通知跳转的链接，例如 https://example.com/page" />
                            </Form.Item>
                            <Form.Item label="内容（富文本）" required>
                              <RichTextEditor value={browserContentHtml} onChange={setBrowserContentHtml} />
                            </Form.Item>
                          </>
                        ) : (
                          <Form.Item label="内容" field="content" rules={[{ required: true, message: '请输入内容' }]}> 
                            <TextArea placeholder="请输入消息内容" autoSize={{ minRows: 4, maxRows: 10 }} />
                          </Form.Item>
                        )}

                        {channel === 'EMAIL' && (
                          <>
                            <Divider style={{ margin: '12px 0' }} />
                            <Typography.Text className="section-title">附件</Typography.Text>
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
                            <Button type="primary" icon={<IconSend />} loading={sending} onClick={handleSend}>
                              发送
                            </Button>
                            <Button onClick={() => formRef.current?.resetFields?.()}>重置</Button>
                          </Space>
                        </div>
                      </Form>
                    </Card>
                  </div>
                </div>
              );
            };

            export default NotificationPage;
