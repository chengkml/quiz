import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Message } from '@arco-design/web-react';
import { createRepo, updateRepo, GitRepoDto } from '../api';

interface RepoAddModalProps {
    visible: boolean;
    onCancel: () => void;
    onSuccess: () => void;
    editingRepo?: GitRepoDto | null;
}

const RepoAddModal: React.FC<RepoAddModalProps> = ({ visible, onCancel, onSuccess, editingRepo }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            if (editingRepo) {
                form.setFieldsValue({
                    name: editingRepo.name,
                    remoteUrl: editingRepo.remoteUrl,
                    description: editingRepo.description,
                    sortOrder: editingRepo.sortOrder || 0
                });
            } else {
                form.resetFields();
            }
        }
    }, [visible, editingRepo, form]);

    const handleSubmit = async () => {
        try {
            await form.validate();
            const values = form.getFieldsValue();
            setLoading(true);

            if (editingRepo) {
                await updateRepo({ ...values, id: editingRepo.id });
                Message.success('修改成功');
            } else {
                await createRepo(values);
                Message.success('添加成功');
            }

            // 触发列表刷新
            window.dispatchEvent(new Event('refresh-repo-list'));
            onSuccess();
        } catch (error: any) {
            if (error.response?.data?.message) {
                Message.error(error.response.data.message);
            } else if (!error.errors) {
                Message.error(editingRepo ? '修改失败' : '添加失败');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={editingRepo ? '编辑仓库' : '添加本地仓库'}
            visible={visible}
            onOk={handleSubmit}
            onCancel={onCancel}
            confirmLoading={loading}
            unmountOnExit
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    label="仓库名称"
                    field="name"
                    rules={[{ required: true, message: '请输入仓库名称' }]}
                    extra="系统将自动分配本地目录，例如 /data/git_repos/你的账号名/仓库名称"
                >
                    <Input placeholder="输入显示名称，如 quiz-backend" />
                </Form.Item>
                <Form.Item
                    label="远程仓库地址"
                    field="remoteUrl"
                    extra="提供远程地址将自动克隆仓库到本地；留空则使用已存在的本地仓库"
                >
                    <Input placeholder="https://github.com/username/repo.git" />
                </Form.Item>
                <Form.Item
                    label="描述"
                    field="description"
                >
                    <Input.TextArea placeholder="可选描述信息" />
                </Form.Item>
                <Form.Item
                    label="排序号"
                    field="sortOrder"
                    initialValue={0}
                >
                    <InputNumber placeholder="越小越靠前" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default RepoAddModal;
