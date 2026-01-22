import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Message } from '@arco-design/web-react';
import { createKnowledgeSource, updateKnowledgeSource } from '../api';

const FormItem = Form.Item;

function AddEditKnowledgeSourceModal({ visible, record, onOk, onCancel, knowledgeSetId }: any) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            if (record) {
                form.setFieldsValue(record);
            } else {
                form.resetFields();
            }
        }
    }, [visible, record, form]);

    const handleSubmit = async () => {
        try {
            await form.validate();
            const values = form.getFieldsValue();
            setLoading(true);

            if (record) {
                await updateKnowledgeSource({ ...values, id: record.id });
                Message.success('更新成功');
            } else {
                if (!knowledgeSetId) {
                     Message.error('缺少知识集ID');
                     setLoading(false);
                     return;
                }
                await createKnowledgeSource({ ...values, knowledgeSetId });
                Message.success('创建成功');
            }
            onOk();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={record ? '编辑知识来源' : '新增知识来源'}
            visible={visible}
            onOk={handleSubmit}
            onCancel={onCancel}
            confirmLoading={loading}
        >
            <Form form={form} labelCol={{ span: 5 }} wrapperCol={{ span: 19 }}>
                <FormItem label="名称" field="name" rules={[{ required: true, message: '请输入名称' }]}>
                    <Input placeholder="请输入名称" />
                </FormItem>
                <FormItem label="类型" field="type" rules={[{ required: true, message: '请选择类型' }]}>
                    <Select placeholder="请选择类型">
                        <Select.Option value="FILE">文件</Select.Option>
                        <Select.Option value="DB">数据库表</Select.Option>
                    </Select>
                </FormItem>
                <FormItem label="内容/路径" field="content">
                    <Input.TextArea placeholder="请输入文件路径或连接串" />
                </FormItem>
                <FormItem label="描述" field="descr">
                    <Input.TextArea placeholder="请输入描述" />
                </FormItem>
                <FormItem label="标签" field="tags">
                    <Input placeholder="请输入标签，逗号分隔" />
                </FormItem>
                <FormItem label="语言" field="language">
                    <Input placeholder="请输入语言 (如: zh-CN)" />
                </FormItem>
            </Form>
        </Modal>
    );
}

export default AddEditKnowledgeSourceModal;
