import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Message, Select } from '@arco-design/web-react';
import { createVocabulary, updateVocabulary, VocabularyCardDto } from '../api';
import MDEditor from '@uiw/react-md-editor';

const FormItem = Form.Item;
const TextArea = Input.TextArea;
const Option = Select.Option;

interface AddEditModalProps {
    visible: boolean;
    record: VocabularyCardDto | null;
    onOk: () => void;
    onCancel: () => void;
}

const MD_TEMPLATE = `### 单词释义
---
- **释义**: 
- **例句**: 
  > This is an example sentence.
- **对比**: 
  | 单词 | 区别 |
  | :--- | :--- |
  | Word A | ... |
`;

/**
 * 新增/编辑单词弹窗
 */
const AddEditModal: React.FC<AddEditModalProps> = ({ visible, record, onOk, onCancel }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [mdContent, setMdContent] = useState('');

    useEffect(() => {
        if (visible) {
            if (record) {
                // 编辑模式
                form.setFieldsValue({
                    word: record.word,
                    mdDefinition: record.mdDefinition,
                    tags: record.tags || ''
                });
                setMdContent(record.mdDefinition || '');
            } else {
                // 新增模式
                form.resetFields();
                setMdContent(MD_TEMPLATE);
                form.setFieldValue('mdDefinition', MD_TEMPLATE);
            }
        }
    }, [visible, record, form]);

    const handleSubmit = async () => {
        try {
            await form.validate();
            const values = form.getFieldsValue();
            
            setLoading(true);
            
            if (record) {
                // 更新
                await updateVocabulary({
                    id: record.id,
                    ...values
                });
                Message.success('更新成功');
            } else {
                // 新增
                await createVocabulary(values);
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
            title={record ? '编辑单词' : '添加单词'}
            visible={visible}
            onOk={handleSubmit}
            onCancel={onCancel}
            confirmLoading={loading}
            style={{ width: 800 }}
            maskClosable={false}
        >
            <Form form={form} layout="vertical">
                <FormItem
                    label="单词"
                    field="word"
                    rules={[{ required: true, message: '请输入单词' }]}
                >
                    <Input placeholder="输入单词（例如：vocabulary）" />
                </FormItem>

                <FormItem
                    label="Markdown 释义"
                    field="mdDefinition"
                    rules={[{ required: true, message: '请输入释义' }]}
                >
                    <div data-color-mode="light">
                        <MDEditor
                            value={mdContent}
                            onChange={(val) => {
                                setMdContent(val || '');
                                form.setFieldValue('mdDefinition', val || '');
                            }}
                            height={400}
                            preview="edit"
                        />
                    </div>
                </FormItem>

                <FormItem
                    label="标签"
                    field="tags"
                    tooltip="多个标签用逗号分隔"
                >
                    <Input placeholder="例如：TOEFL,GRE,技术词汇" />
                </FormItem>
            </Form>
        </Modal>
    );
};

export default AddEditModal;
