import React, { useEffect, useRef, useState } from 'react';
import { Button, Modal, Form, Input, Message } from '@arco-design/web-react';
import { createVocabulary, streamGenerateDefinitionUrl, updateVocabulary, VocabularyCardDto } from '../api';
import MDEditor from '@uiw/react-md-editor';

const FormItem = Form.Item;

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
    const [isGenerating, setIsGenerating] = useState(false);
    const generateEventSourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        if (visible) {
            if (record) {
                // 编辑模式
                form.setFieldsValue({
                    word: record.word,
                    mdDefinition: record.mdDefinition
                });
                setMdContent(record.mdDefinition || '');
            } else {
                // 新增模式
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
        setMdContent(prev => {
            const next = prev + chunk;
            form.setFieldValue('mdDefinition', next);
            return next;
        });
    };

    const handleGenerateDefinition = () => {
        const word = form.getFieldValue('word');
        if (!word || !word.trim()) {
            Message.error('请输入单词后再生成释义');
            return;
        }

        if (generateEventSourceRef.current) {
            generateEventSourceRef.current.close();
            generateEventSourceRef.current = null;
        }

        setIsGenerating(true);
        setMdContent('');
        form.setFieldValue('mdDefinition', '');

        const url = streamGenerateDefinitionUrl({ word: word.trim() });
        const es = new EventSource(url);
        generateEventSourceRef.current = es;

        let isParsingResult = false;

        const applyDefinitionResult = (jsonStr: string) => {
            try {
                const result = JSON.parse(jsonStr);
                const mdDefinition = result?.mdDefinition || '';
                setMdContent(mdDefinition);
                form.setFieldValue('mdDefinition', mdDefinition);
                setIsGenerating(false);
                es.close();
                generateEventSourceRef.current = null;
            } catch (error) {
                Message.error('解析生成结果失败');
                setIsGenerating(false);
            }
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
                        const jsonStr = afterSeparator.substring('[DEFINITION]'.length);
                        if (jsonStr) {
                            applyDefinitionResult(jsonStr);
                        }
                    }
                    return;
                }
                appendDefinitionChunk(data);
                return;
            }

            const trimmedData = data.trim();
            if (trimmedData.startsWith('[DEFINITION]')) {
                const jsonStr = trimmedData.substring('[DEFINITION]'.length);
                applyDefinitionResult(jsonStr);
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

            setLoading(true);

            const payload = {
                ...values
            };

            if (record) {
                // 更新
                await updateVocabulary({
                    id: record.id,
                    ...payload
                } as any);
                Message.success('更新成功');
            } else {
                // 新增
                await createVocabulary(payload as any);
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
