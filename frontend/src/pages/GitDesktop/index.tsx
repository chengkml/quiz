import React, { useState, useEffect } from 'react';
import { Layout, ResizeBox, Typography, Empty, Spin } from '@arco-design/web-react';
import RepoList from './components/RepoList';
import RepoAddModal from './components/RepoAddModal';
import FileChangeList from './components/FileChangeList';
import DiffViewer from './components/DiffViewer';
import CommitPanel from './components/CommitPanel';
import BranchSelector from './components/BranchSelector';
import CommitHistory from './components/CommitHistory';
import SyncStatus from './components/SyncStatus';
import { useGitOperations } from './hooks/useGitOperations';
import { FileChangeDto, GitRepoDto } from './api';
import './style/index.less';

const { Sider, Content, Header } = Layout;
const { Title } = Typography;

const GitDesktop: React.FC = () => {
    const [activeRepoId, setActiveRepoId] = useState<string | null>(null);
    const [activeFile, setActiveFile] = useState<FileChangeDto | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editingRepo, setEditingRepo] = useState<GitRepoDto | null>(null);

    const {
        loading,
        status,
        commits,
        branches,
        refreshAll,
        handleStage,
        handleUnstage,
        handleStageAll,
        handleUnstageAll,
        handleCommit,
        handleDiscard,
        handleCheckout,
        syncAction
    } = useGitOperations(activeRepoId);

    useEffect(() => {
        refreshAll();
        setActiveFile(null);
        setSelectedFiles([]);
    }, [activeRepoId, refreshAll]);

    // Handle initial repo load implicitly if first repo is selected by users

    return (
        <Layout className="git-desktop-container">
            <Sider width={260} className="git-sidebar">
                <RepoList
                    activeRepoId={activeRepoId}
                    onSelectRepo={setActiveRepoId}
                    onAddClick={() => {
                        setEditingRepo(null);
                        setAddModalVisible(true);
                    }}
                    onEditClick={(repo) => {
                        setEditingRepo(repo);
                        setAddModalVisible(true);
                    }}
                />
            </Sider>
            <Content className="git-main-content">
                {!activeRepoId ? (
                    <div className="empty-state">
                        <Empty description="请在左侧选择或添加一个 Git 仓库" />
                    </div>
                ) : (
                    <div className="repo-workspace">
                        <Header className="workspace-header">
                            <div className="header-left">
                                <Title heading={5} style={{ margin: 0 }}>{status?.repoName || 'Loading...'}</Title>
                            </div>
                            <div className="header-right">
                                {status && (
                                    <>
                                        <BranchSelector
                                            repoId={activeRepoId}
                                            branches={branches}
                                            currentBranch={status.currentBranch}
                                            onCheckout={handleCheckout}
                                            onRefresh={refreshAll}
                                        />
                                        <SyncStatus
                                            ahead={status.ahead}
                                            behind={status.behind}
                                            loading={loading}
                                            onPush={() => syncAction('push')}
                                            onPull={() => syncAction('pull', undefined)}
                                            onFetch={() => syncAction('fetch')}
                                        />
                                    </>
                                )}
                            </div>
                        </Header>

                        <div className="workspace-body">
                            <ResizeBox.Split
                                direction="horizontal"
                                style={{ height: '100%', width: '100%' }}
                                min={0.1}
                                max={0.5}
                                size={0.25}
                                panes={[
                                    <div className="changes-area" key="changes">
                                        <div className="changes-list-container">
                                            <FileChangeList
                                                staged={false}
                                                files={status ? status.changedFiles.filter(f => !f.staged) : []}
                                                selectedFiles={selectedFiles}
                                                onSelectChange={setSelectedFiles}
                                                onStageFiles={handleStage}
                                                onDiscardFiles={handleDiscard}
                                                onFileClick={setActiveFile}
                                                activeFile={activeFile?.filePath}
                                            />
                                            <FileChangeList
                                                staged={true}
                                                files={status ? status.changedFiles.filter(f => f.staged) : []}
                                                selectedFiles={selectedFiles}
                                                onSelectChange={setSelectedFiles}
                                                onUnstageFiles={handleUnstage}
                                                onFileClick={setActiveFile}
                                                activeFile={activeFile?.filePath}
                                            />
                                        </div>
                                        <CommitPanel
                                            stagedCount={status ? status.changedFiles.filter(f => f.staged).length : 0}
                                            onCommit={(req) => handleCommit(req)}
                                            loading={loading}
                                        />
                                    </div>,
                                    <ResizeBox.Split
                                        key="diff-history"
                                        direction="horizontal"
                                        style={{ height: '100%', width: '100%' }}
                                        min={0.2}
                                        max={0.8}
                                        size={0.6}
                                        panes={[
                                            <div className="diff-area" key="diff">
                                                <DiffViewer repoId={activeRepoId} activeFile={activeFile} />
                                            </div>,
                                            <div className="history-area" key="history" style={{ background: 'var(--color-bg-2)', borderLeft: '1px solid var(--color-border)' }}>
                                                <CommitHistory
                                                    commits={commits}
                                                    loading={loading}
                                                    onViewDetail={() => { }}
                                                />
                                            </div>
                                        ]}
                                    />
                                ]}
                            />
                        </div>
                    </div>
                )}
            </Content>

            <RepoAddModal
                visible={addModalVisible}
                onCancel={() => setAddModalVisible(false)}
                onSuccess={() => setAddModalVisible(false)}
                editingRepo={editingRepo}
            />
        </Layout>
    );
};

export default GitDesktop;
