import React, { useState } from 'react';
import { Select, Button, Space, Modal, Input, Message, Dropdown, Menu } from '@arco-design/web-react';
import { IconBranch, IconPlus, IconDown } from '@arco-design/web-react/icon';
import { GitBranchDto, createBranch } from '../api';

const { Option } = Select;

interface BranchSelectorProps {
    repoId: string | null;
    branches: GitBranchDto[];
    currentBranch: string;
    onCheckout: (branchName: string) => void;
    onRefresh: () => void;
}

const BranchSelector: React.FC<BranchSelectorProps> = ({ repoId, branches, currentBranch, onCheckout, onRefresh }) => {
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [newBranchName, setNewBranchName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreateBranch = async () => {
        if (!repoId || !newBranchName.trim()) return;
        setLoading(true);
        try {
            await createBranch(repoId, newBranchName.trim(), currentBranch);
            Message.success(`分支 ${newBranchName} 创建成功`);
            setCreateModalVisible(false);
            setNewBranchName('');
            onRefresh();
        } catch (error) {
            Message.error('创建分支失败');
        } finally {
            setLoading(false);
        }
    };

    // Filter local branches for quick switch Menu
    const localBranches = branches.filter(b => !b.isRemote);

    return (
        <Space size="medium" align="center">
            <IconBranch style={{ color: 'var(--color-text-3)' }} />
            <Dropdown
                droplist={
                    <Menu onClickMenuItem={(key) => onCheckout(key)}>
                        {localBranches.map((b) => (
                            <Menu.Item key={b.name} disabled={b.isCurrent}>
                                {b.name} {b.isCurrent && '(当前)'}
                            </Menu.Item>
                        ))}
                    </Menu>
                }
                trigger="click"
            >
                <Button type="text" size="small" style={{ fontWeight: 'bold' }}>
                    {currentBranch || '未选择分支'} <IconDown style={{ marginLeft: 4, fontSize: 12 }} />
                </Button>
            </Dropdown>

            <Button size="mini" type="text" icon={<IconPlus />} onClick={() => setCreateModalVisible(true)}>
                新分支
            </Button>

            <Modal
                title="基于当前分支创建新分支"
                visible={createModalVisible}
                onOk={handleCreateBranch}
                onCancel={() => setCreateModalVisible(false)}
                confirmLoading={loading}
            >
                <Input
                    value={newBranchName}
                    onChange={setNewBranchName}
                    placeholder="新分支名称，例如 feature/xxx"
                    prefix={<IconBranch />}
                    onPressEnter={handleCreateBranch}
                />
            </Modal>
        </Space>
    );
};

export default BranchSelector;
