import React, { useEffect, useRef, useState } from 'react';
import { Button, Modal, Form, Input, Message } from '@arco-design/web-react';
import { createCharacter, streamGenerateDefinitionUrl, updateCharacter, CharacterCardDto } from '../api';
import MDEditor from '@uiw/react-md-editor';

const FormItem = Form.Item;

interface AddEditModalProps {
    visible: boolean;
    record: CharacterCardDto | null;
    onOk: () => void;
    onCancel: () => void;
}

const MD_TEMPLATE = `### 生字释义
---
- **生字**:
- **拼音**:
- **释义**:
- **词语搭配**:
- **例句**:
  > 这里填写例句。
- **易混字对比**:
  | 生字 | 区别 |
  | :--- | :--- |
  | 字A | ... |
`;

const AddEditModal: React.FC<AddEditModalProps> = ({ visible, record, onOk, onCancel }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [mdContent, setMdContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const generateEventSourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        if (visible) {
            if (record) {
                form.setFieldsValue({
                    characterText: record.characterText,
                    pinyin: record.pinyin,
                    mdDefinition: record.mdDefinition,
                });
                setMdContent(record.mdDefinition || '');
            } else {
                form.resetFields();
                setMdContent(MD_TEMPLATE);
                form.setFieldValue('mdDefinition', MD_TEMPLATE);
            }
        }

        if (!visible && generateEventSourceRef.current) {
            generateEventSourceRef.current.close();
            generateEventSourceRef.current = null;
        }
    }, [visible, record, form]);

    useEffect(() => () => {
        if (generateEventSourceRef.current) {
            generateEventSourceRef.current.close();
            generateEventSourceRef.current = null;
        }
    }, []);

    const appendDefinitionChunk = (chunk: string) => {
        setMdContent((prev) => {
            const next = prev + chunk;
            form.setFieldValue('mdDefinition', next);
            return next;
        });
    };

    const handleGenerateDefinition = () => {
        const characterText = form.getFieldValue('characterText');
        if (!characterText || !characterText.trim()) {
            Message.error('请输入生字后再生成释义');
            return;
        }

        if (generateEventSourceRef.current) {
            generateEventSourceRef.current.close();
            generateEventSourceRef.current = null;
        }

        setIsGenerating(true);
        setMdContent('');
        form.setFieldValue('mdDefinition', '');

        const url = streamGenerateDefinitionUrl({ characterText: characterText.trim() });
        const es = new EventSource(url);
        generateEventSourceRef.current = es;

        let isParsingResult = false;

        const applyDefinitionResult = (content: string) => {
            setMdContent(content);
            form.setFieldValue('mdDefinition', content);
            setIsGenerating(false);
            es.close();
            generateEventSourceRef.current = null;
        };

        es.onmessage = (event) => {
            const data = event.data || '';
            if (data === 'connected') {
                return;
            }

            if (!isParsingResult) {
                if (data.includes('[PARSE_RESULT]')) {
                    isParsingResult = true;
                    const parseIndex = data.indexOf('[PARSE_RESULT]');
                    const afterSeparator = data.substring(parseIndex + '[PARSE_RESULT]'.length).trim();
                    if (afterSeparator && afterSeparator.startsWith('[DEFINITION]')) {
                        const content = afterSeparator.substring('[DEFINITION]'.length);
                        if (content) {
                            applyDefinitionResult(content);
                        }
                    }
                    return;
                }
                appendDefinitionChunk(data);
                return;
            }

            const trimmedData = data.trim();
            if (trimmedData.startsWith('[DEFINITION]')) {
                const content = trimmedData.substring('[DEFINITION]'.length);
                applyDefinitionResult(content);
            } else if (trimmedData.startsWith('[ERROR]')) {
                const errorMsg = trimmedData.substring('[ERROR]'.length);
                Message.error('生成失败: ' + errorMsg);
                setIsGenerating(false);
                es.close();
                generateEventSourceRef.current = null;
            }
        };

        es.onerror = () => {
            Message.error('生成失败，请稍后重试');
            setIsGenerating(false);
            es.close();
            generateEventSourceRef.current = null;
        };
    };

    const handleSubmit = async () => {
        try {
            await form.validate();
            const values = form.getFieldsValue();
            const payload = {
                ...values,
                characterText: values.characterText?.trim(),
                pinyin: values.pinyin?.trim() || undefined,
            };

            setLoading(true);

            if (record) {
                await updateCharacter({
                    id: record.id,
                    ...payload,
                } as any);
                Message.success('更新成功');
            } else {
                await createCharacter(payload as any);
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
            title={record ? '编辑生字' : '添加生字'}
            visible={visible}
            onOk={handleSubmit}
            onCancel={onCancel}
            confirmLoading={loading}
            style={{ width: 800 }}
            maskClosable={false}
        >
            <Form form={form} layout="vertical">
                <FormItem
                    label="生字"
                    field="characterText"
                    rules={[{ required: true, message: '请输入生字' }]}
                >
                    <Input placeholder="输入生字（例如：曦）" />
                </FormItem>

                <FormItem label="拼音" field="pinyin">
                    <Input placeholder="输入拼音（例如：xi）" />
                </FormItem>

                <div style={{ marginTop: -8, marginBottom: 16 }}>
                    <Button type="primary" loading={isGenerating} onClick={handleGenerateDefinition}>
                        AI生成释义
                    </Button>
                </div>

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
                            preview="preview"
                        />
                    </div>
                </FormItem>
            </Form>
        </Modal>
    );
};

export default AddEditModal;
