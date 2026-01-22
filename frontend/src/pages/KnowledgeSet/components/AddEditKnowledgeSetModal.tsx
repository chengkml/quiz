import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Message } from '@arco-design/web-react';
import { createKnowledgeSet, updateKnowledgeSet } from '../api';

const FormItem = Form.Item;
const TextArea = Input.TextArea;

interface AddEditKnowledgeSetModalProps {
    visible: boolean;
    currentRecord: any;
    onCancel: () => void;
    onSuccess: () => void;
}

const AddEditKnowledgeSetModal: React.FC<AddEditKnowledgeSetModalProps> = ({
    visible,
    currentRecord,
    onCancel,
    onSuccess
}) => {
    const [form] = Form.useForm();
    const isEdit = !!currentRecord;

    useEffect(() => {
        if (visible) {
            if (currentRecord) {
                form.setFieldsValue(currentRecord);
            } else {
                form.resetFields();
            }
        }
    }, [visible, currentRecord, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validate();
            if (isEdit) {
                await updateKnowledgeSet({ ...values, id: currentRecord.id });
                Message.success('更新成功');
            } else {
                await createKnowledgeSet(values);
                Message.success('创建成功');
            }
            onSuccess();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Modal
            title={isEdit ? '编辑知识集' : '新建知识集'}
            visible={visible}
            onOk={handleSubmit}
            onCancel={onCancel}
            unmountOnExit
        >
            <Form form={form} labelCol={{ span: 5 }} wrapperCol={{ span: 19 }}>
                <FormItem
                    label="名称"
                    field="name"
                    rules={[{ required: true, message: '请输入名称' }]}
                >
                    <Input placeholder="请输入知识集名称" />
                </FormItem>
                <FormItem label="描述" field="descr">
                    <TextArea placeholder="请输入描述" />
                </FormItem>
                <FormItem label="标签" field="tags">
                    <Input placeholder="请输入标签，逗号分隔" />
                </FormItem>
                <FormItem
                    label="可见性"
                    field="visibility"
                    initialValue="PRIVATE"
                    rules={[{ required: true }]}
                >
                    <Select>
                        <Select.Option value="PUBLIC">公开</Select.Option>
                        <Select.Option value="PRIVATE">私有</Select.Option>
                    </Select>
                </FormItem>
                <FormItem
                    label="状态"
                    field="status"
                    initialValue="ENABLE"
                    rules={[{ required: true }]}
                >
                    <Select>
                        <Select.Option value="ENABLE">启用</Select.Option>
                        <Select.Option value="DISABLE">禁用</Select.Option>
                    </Select>
                </FormItem>
            </Form>
        </Modal>
    );
};

export default AddEditKnowledgeSetModal;
