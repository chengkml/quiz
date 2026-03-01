import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Message } from '@arco-design/web-react';
import MDEditor from '@uiw/react-md-editor';
import { createPoetry, PoetryCardDto, updatePoetry } from '../api';

const FormItem = Form.Item;
const TextArea = Input.TextArea;

interface AddEditModalProps {
    visible: boolean;
    record: PoetryCardDto | null;
    onOk: () => void;
    onCancel: () => void;
}

const ANALYSIS_TEMPLATE = `### 诗词赏析
---
- **主题**：
- **意象**：
- **情感**：
- **写作手法**：
`;

const AddEditModal: React.FC<AddEditModalProps> = ({ visible, record, onOk, onCancel }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [mdContent, setMdContent] = useState('');

    useEffect(() => {
        if (visible) {
            if (record) {
                form.setFieldsValue({
                    title: record.title,
                    author: record.author,
                    dynasty: record.dynasty,
                    content: record.content,
                    mdAnalysis: record.mdAnalysis,
                });
                setMdContent(record.mdAnalysis || '');
            } else {
                form.resetFields();
                setMdContent(ANALYSIS_TEMPLATE);
                form.setFieldValue('mdAnalysis', ANALYSIS_TEMPLATE);
            }
        }
    }, [visible, record, form]);

    const handleSubmit = async () => {
        try {
            await form.validate();
            const values = form.getFieldsValue();
            setLoading(true);

            if (record) {
                await updatePoetry({
                    id: record.id,
                    ...values,
                });
                Message.success('更新成功');
            } else {
                await createPoetry(values);
                Message.success('创建成功');
            }

            onOk();
        } catch (error: any) {
            if (error.response?.data?.message) {
                Message.error(error.response.data.message);
            } else if (error.name !== 'ValidateError') {
                Message.error('操作失败');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={record ? '编辑诗词' : '添加诗词'}
            visible={visible}
            onOk={handleSubmit}
            onCancel={onCancel}
            confirmLoading={loading}
            style={{ width: 860 }}
            maskClosable={false}
        >
            <Form form={form} layout="vertical">
                <FormItem
                    label="标题"
                    field="title"
                    rules={[{ required: true, message: '请输入标题' }]}
                >
                    <Input placeholder="输入诗词标题（例如：静夜思）" />
                </FormItem>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <FormItem label="作者" field="author">
                        <Input placeholder="输入作者（例如：李白）" />
                    </FormItem>
                    <FormItem label="朝代" field="dynasty">
                        <Input placeholder="输入朝代（例如：唐）" />
                    </FormItem>
                </div>

                <FormItem label="正文" field="content">
                    <TextArea placeholder="请输入诗词正文" autoSize={{ minRows: 3, maxRows: 8 }} />
                </FormItem>

                <FormItem label="Markdown 赏析" field="mdAnalysis">
                    <div data-color-mode="light">
                        <MDEditor
                            value={mdContent}
                            onChange={(val) => {
                                const nextValue = val || '';
                                setMdContent(nextValue);
                                form.setFieldValue('mdAnalysis', nextValue);
                            }}
                            height={320}
                            preview="preview"
                        />
                    </div>
                </FormItem>
            </Form>
        </Modal>
    );
};

export default AddEditModal;
