import React from 'react';
import { Input, Button, Checkbox, Form, Space } from '@arco-design/web-react';
import { GitCommitRequest } from '../api';

const { TextArea } = Input;

interface CommitPanelProps {
    onCommit: (request: GitCommitRequest) => void;
    stagedCount: number;
    loading: boolean;
}

const CommitPanel: React.FC<CommitPanelProps> = ({ onCommit, stagedCount, loading }) => {
    const [form] = Form.useForm();

    const handleSubmit = async () => {
        try {
            const values = await form.validate();
            onCommit({
                message: values.message,
                amend: values.amend,
                filesToStage: [] // If they click commit without staging everything, JGit commit only commits staged. 
                // We leave filesToStage empty here because we already staged them via other actions.
            });
            form.resetFields();
        } catch (e) {
            // Validation failed
        }
    };

    return (
        <div className="commit-panel" style={{ padding: '16px', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
            <Form form={form} layout="vertical">
                <Form.Item
                    field="message"
                    rules={[{ required: true, message: '提交信息不能为空' }]}
                    style={{ marginBottom: 12 }}
                >
                    <TextArea
                        placeholder="提交说明 (Commit message)"
                        autoSize={{ minRows: 3, maxRows: 6 }}
                    />
                </Form.Item>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Form.Item field="amend" triggerPropName="checked" style={{ marginBottom: 0 }}>
                        <Checkbox>Amend (修改最后一次提交)</Checkbox>
                    </Form.Item>
                    <Button
                        type="primary"
                        loading={loading}
                        disabled={stagedCount === 0 && !form.getFieldValue('amend')}
                        onClick={handleSubmit}
                    >
                        提交 ({stagedCount})
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default CommitPanel;
