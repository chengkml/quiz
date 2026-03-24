import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Message, Button } from '@arco-design/web-react';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import { createKnowledgeSource, updateKnowledgeSource } from '../api';

const FormItem = Form.Item;

function AddEditKnowledgeSourceModal({ visible, record, onOk, onCancel, knowledgeSetId }: any) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const type = Form.useWatch('type', form);

    const handleTestConnection = async () => {
        try {
            const values = form.getFieldsValue();
            const { driver, host, port, user, password, database } = values;
            if (!driver || !host || !port || !user || !database) {
                Message.error('请填写完整的连接信息');
                return;
            }
            
            setTesting(true);
            const content = JSON.stringify({ driver, host, port, user, password, database });
            await import('../api').then(mod => mod.testConnection({ type: 'DB', content }));
            Message.success('连接成功');
        } catch (error) {
            console.error(error);
            Message.error('连接失败');
        } finally {
            setTesting(false);
        }
    };

    const handleSubmit = async () => {
        try {
            await form.validate();
            const values = form.getFieldsValue();
            setLoading(true);

            let payload = { ...values };
            if (values.type === 'DB') {
                const { driver, host, port, user, password, database } = values;
                payload.content = JSON.stringify({ driver, host, port, user, password, database });
                // Clean up individual fields from payload if backend doesn't want them (though backend ignores extras usually)
            }

            if (record) {
                await updateKnowledgeSource({ ...payload, id: record.id });
                Message.success('更新成功');
            } else {
                if (!knowledgeSetId) {
                     Message.error('缺少知识集ID');
                     setLoading(false);
                     return;
                }
                await createKnowledgeSource({ ...payload, knowledgeSetId });
                Message.success('创建成功');
            }
            onOk();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (visible) {
            if (record) {
                const data = { ...record };
                if (data.type === 'DB' && data.content) {
                    try {
                        const config = JSON.parse(data.content);
                        Object.assign(data, config);
                    } catch (e) {
                        console.error('Failed to parse DB config', e);
                    }
                }
                form.setFieldsValue(data);
            } else {
                form.resetFields();
            }
        }
    }, [visible, record, form]);

    return (
        <Modal
            title={record ? '编辑知识来源' : '新增知识来源'}
            visible={visible}
            onOk={handleSubmit}
            onCancel={onCancel}
            confirmLoading={loading}
            style={{ width: 600 }}
        >
            <Form form={form} labelCol={{ span: 5 }} wrapperCol={{ span: 19 }}>
                <FormItem label="名称" field="name" rules={[{ required: true, message: '请输入名称' }]}>
                    <Input placeholder="请输入名称" />
                </FormItem>
                <FormItem label="类型" field="type" rules={[{ required: true, message: '请选择类型' }]}>
                    <Select placeholder="请选择类型">
                        <Select.Option value="FILE">文件</Select.Option>
                        <Select.Option value="DB">数据库表</Select.Option>
                        <Select.Option value="MARKDOWN">Markdown</Select.Option>
                    </Select>
                </FormItem>

                {type === 'DB' ? (
                    <>
                        <FormItem label="数据库类型" field="driver" rules={[{ required: true, message: '请选择数据库类型' }]}>
                            <Select placeholder="请选择数据库类型">
                                <Select.Option value="MySQL">MySQL</Select.Option>
                                <Select.Option value="PostgreSQL">PostgreSQL</Select.Option>
                            </Select>
                        </FormItem>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <FormItem label="主机" field="host" rules={[{ required: true, message: '请输入主机' }]} style={{ flex: 2 }}>
                                <Input placeholder="localhost" />
                            </FormItem>
                            <FormItem label="端口" field="port" rules={[{ required: true, message: '请输入端口' }]} style={{ flex: 1 }} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                                <Input placeholder="3306" />
                            </FormItem>
                        </div>
                        <FormItem label="数据库名" field="database" rules={[{ required: true, message: '请输入数据库名' }]}>
                            <Input placeholder="请输入数据库名" />
                        </FormItem>
                        <FormItem label="用户名" field="user" rules={[{ required: true, message: '请输入用户名' }]}>
                            <Input placeholder="请输入用户名" />
                        </FormItem>
                        <FormItem label="密码" field="password" rules={[{ required: true, message: '请输入密码' }]}>
                            <Input.Password placeholder="请输入密码" />
                        </FormItem>
                        <FormItem wrapperCol={{ offset: 5 }}>
                            <Button onClick={handleTestConnection} loading={testing}>测试连接</Button>
                        </FormItem>
                    </>
                ) : type === 'MARKDOWN' ? (
                    <FormItem
                        label="Markdown 内容"
                        field="content"
                        rules={[
                            { required: true, message: '请输入 Markdown 内容' },
                            {
                                validator: (value: string | undefined, cb: (msg?: string) => void) => {
                                    if ((value || '').length > 2048) {
                                        cb('Markdown 内容长度不能超过 2048 字符');
                                        return;
                                    }
                                    cb();
                                },
                            },
                        ]}
                    >
                        <div>
                            <MDEditor
                                height={320}
                                value={form.getFieldValue('content') || ''}
                                onChange={(value) => form.setFieldsValue({ content: value || '' })}
                                preview='edit'
                                textareaProps={{ placeholder: '请输入 Markdown 正文（最多 2048 字符）' }}
                            />
                            <div style={{ textAlign: 'right', color: 'var(--color-text-3)', marginTop: 6, fontSize: 12 }}>
                                {(form.getFieldValue('content') || '').length}/2048
                            </div>
                        </div>
                    </FormItem>
                ) : (
                    <FormItem label="内容/路径" field="content">
                        <Input.TextArea
                            placeholder="请输入文件路径或连接串"
                            maxLength={2048}
                            showWordLimit
                        />
                    </FormItem>
                )}

                <FormItem label="描述" field="descr">
                    <Input.TextArea placeholder="请输入描述" />
                </FormItem>
                <FormItem label="标签" field="tags">
                    <Input placeholder="请输入标签，逗号分隔" />
                </FormItem>
            </Form>
        </Modal>
    );
}

export default AddEditKnowledgeSourceModal;
