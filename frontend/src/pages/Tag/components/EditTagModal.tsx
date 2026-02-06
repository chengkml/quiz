import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Message, ColorPicker } from '@arco-design/web-react';
import { updateTag, checkTagName, TagDto } from '../api';

const FormItem = Form.Item;
const TextArea = Input.TextArea;

interface EditTagModalProps {
    visible: boolean;
    record: TagDto | null;
    onCancel: () => void;
    onSuccess: () => void;
}

const EditTagModal: React.FC<EditTagModalProps> = ({ visible, record, onCancel, onSuccess }) => {
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        if (visible && record) {
            form.setFieldsValue({
                ...record
            });
        }
    }, [visible, record, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validate();
            setConfirmLoading(true);

            await updateTag({
                ...values,
                id: record?.id
            });
            Message.success('更新成功');
            onSuccess();
        } catch (error) {
            console.error('更新标签失败:', error);
            if (!(error instanceof Error) && typeof error === 'object' && error !== null) {
                // Form validation error
           } else {
                Message.error('更新失败');
           }
        } finally {
            setConfirmLoading(false);
        }
    };

    return (
        <Modal
            title="编辑标签"
            visible={visible}
            onOk={handleSubmit}
            onCancel={() => {
                form.resetFields();
                onCancel();
            }}
            confirmLoading={confirmLoading}
            maskClosable={false}
        >
            <Form form={form} layout="vertical">
                <FormItem
                    label="标签名称 (英文)"
                    field="name"
                    rules={[
                        { required: true, message: '请输入标签名称' },
                        {
                            validator: async (value, callback) => {
                                if (value && record) {
                                    if (value === record.name && form.getFieldValue("type") === record.type) {
                                        return callback();
                                    }
                                    try {
                                        const res = await checkTagName(value, form.getFieldValue("type"), record.id);
                                        if (res.data) {
                                            callback('标签名称已存在');
                                        } else {
                                            callback();
                                        }
                                    } catch (e) {
                                        // ignore
                                    }
                                }
                            }
                        }
                    ]}
                >
                    <Input placeholder="请输入标签英文唯一标识" />
                </FormItem>
                <FormItem
                    label="标签标签 (显示名)"
                    field="label"
                    rules={[{ required: true, message: '请输入显示名' }]}
                >
                    <Input placeholder="请输入显示在页面的名称" />
                </FormItem>
                <FormItem label="分类" field="type">
                    <Input placeholder="请输入分类" />
                </FormItem>
                <FormItem label="颜色" field="color">
                    <ColorPicker showHistory />
                </FormItem>
                <FormItem label="描述" field="descr">
                    <TextArea placeholder="请输入描述" />
                </FormItem>
            </Form>
        </Modal>
    );
};

export default EditTagModal;
