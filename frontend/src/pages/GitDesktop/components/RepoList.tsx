import React, { useState, useEffect } from 'react';
import { List, Button, Input, Space, Typography, Tooltip, Popconfirm, Message } from '@arco-design/web-react';
import { IconSearch, IconPlus, IconFolder, IconDelete, IconEdit } from '@arco-design/web-react/icon';
import { searchRepos, deleteRepo, GitRepoDto } from '../api';

const { Title, Text } = Typography;

interface RepoListProps {
    activeRepoId: string | null;
    onSelectRepo: (repoId: string) => void;
    onAddClick: () => void;
    onEditClick: (repo: GitRepoDto) => void;
}

const RepoList: React.FC<RepoListProps> = ({ activeRepoId, onSelectRepo, onAddClick, onEditClick }) => {
    const [repos, setRepos] = useState<GitRepoDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [keyword, setKeyword] = useState('');

    const fetchRepos = async () => {
        setLoading(true);
        try {
            const res = await searchRepos({
                pageNum: 0,
                pageSize: 100,
                keyWord: keyword
            });
            setRepos(res.data.content || []);
        } catch (error) {
            Message.error('获取仓库列表失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRepos();
    }, [keyword]);

    // 暴露给外部刷新
    useEffect(() => {
        const handleRefresh = () => fetchRepos();
        window.addEventListener('refresh-repo-list', handleRefresh);
        return () => window.removeEventListener('refresh-repo-list', handleRefresh);
    }, []);

    const handleDelete = async (e: any, id: string) => {
        e.stopPropagation();
        try {
            await deleteRepo(id);
            Message.success('删除成功');
            fetchRepos();
            if (activeRepoId === id) {
                onSelectRepo('');
            }
        } catch (error) {
            Message.error('删除失败');
        }
    };

    return (
        <div className="repo-list-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="repo-list-header" style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Title heading={6} style={{ margin: 0 }}>Repositories</Title>
                    <Tooltip content="添加仓库">
                        <Button type="primary" icon={<IconPlus />} shape="circle" size="small" onClick={onAddClick} />
                    </Tooltip>
                </div>
                <Input
                    prefix={<IconSearch />}
                    placeholder="查找仓库..."
                    value={keyword}
                    onChange={setKeyword}
                    allowClear
                />
            </div>

            <div className="repo-list-content" style={{ flex: 1, overflowY: 'auto' }}>
                <List
                    size="small"
                    loading={loading}
                    dataSource={repos}
                    render={(repo: GitRepoDto) => (
                        <List.Item
                            key={repo.id}
                            className={`repo-item ${activeRepoId === repo.id ? 'active' : ''}`}
                            onClick={() => onSelectRepo(repo.id)}
                            style={{
                                cursor: 'pointer',
                                cursor: 'pointer',
                                background: activeRepoId === repo.id ? 'var(--color-fill-2)' : 'transparent',
                                borderLeft: activeRepoId === repo.id ? '3px solid rgb(var(--primary-6))' : '3px solid transparent'
                            }}
                            actionLayout="vertical"
                            actions={[
                                <span className="repo-actions" onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 8 }}>
                                    <Tooltip content="编辑">
                                        <Button
                                            type="text"
                                            size="mini"
                                            icon={<IconEdit />}
                                            onClick={(e) => { e.stopPropagation(); onEditClick(repo); }}
                                        />
                                    </Tooltip>
                                    <Popconfirm
                                        title="确认移除该仓库？(仅移除记录，不删除本地文件)"
                                        onOk={(e) => handleDelete(e, repo.id)}
                                    >
                                        <Button type="text" status="danger" size="mini" icon={<IconDelete />} />
                                    </Popconfirm>
                                </span>
                            ]}
                        >
                            <List.Item.Meta
                                avatar={<IconFolder style={{ fontSize: 24, color: repo.isValid ? 'rgb(var(--primary-6))' : 'var(--color-text-3)' }} />}
                                title={
                                    <Text bold style={{ color: repo.isValid ? 'inherit' : 'var(--color-text-3)' }}>
                                        {repo.name}
                                    </Text>
                                }
                                description={
                                    <Tooltip content={repo.localPath}>
                                        <Text type="secondary" style={{ fontSize: 12, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>
                                            {repo.localPath}
                                        </Text>
                                    </Tooltip>
                                }
                            />
                        </List.Item>
                    )}
                />
            </div>
        </div>
    );
};

export default RepoList;
