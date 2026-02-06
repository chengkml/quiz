import React, { useRef, useState } from 'react';
import { Modal, Form, Input, Message, ColorPicker } from '@arco-design/web-react';
import { createTag, checkTagName } from '../api';

const FormItem = Form.Item;
const TextArea = Input.TextArea;

interface AddTagModalProps {
    visible: boolean;
    onCancel: () => void;
    onSuccess: () => void;
}

const AddTagModal: React.FC<AddTagModalProps> = ({ visible, onCancel, onSuccess }) => {
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [form] = Form.useForm();

    const handleSubmit = async () => {
        try {
            const values = await form.validate();
            setConfirmLoading(true);

            await createTag(values);
            Message.success('添加成功');
            form.resetFields();
            onSuccess();
        } catch (error) {
            console.error('添加标签失败:', error);
            // 只有非验证错误才提示，验证错误由Form自动提示
            if (!(error instanceof Error) && typeof error === 'object' && error !== null) {
                 // Form validation error
            } else {
                 Message.error('添加失败');
            }
        } finally {
            setConfirmLoading(false);
        }
    };

    return (
        <Modal
            title="添加标签"
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
                                if (value) {
                                    try {
                                        const res = await checkTagName(value, form.getFieldValue("type"));
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
                    <Input placeholder="请输入标签英文唯一标识，例如: user_type" />
                </FormItem>
                <FormItem
                    label="标签标签 (显示名)"
                    field="label"
                    rules={[{ required: true, message: '请输入显示名' }]}
                >
                    <Input placeholder="请输入显示在页面的名称，例如: 用户类型" />
                </FormItem>
                <FormItem label="分类" field="type" initialValue="Common">
                    <Input placeholder="请输入分类，例如: Common, Task 等" />
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

export default AddTagModal;
