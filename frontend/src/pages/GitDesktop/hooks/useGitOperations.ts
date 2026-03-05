import { useState, useCallback } from 'react';
import { Message } from '@arco-design/web-react';
import {
    getGitStatus,
    stageFiles,
    unstageFiles,
    stageAll,
    unstageAll,
    commitChanges,
    discardFiles,
    getGitLog,
    getBranches,
    checkoutBranch,
    pushRepo,
    pullRepo,
    fetchRepo,
    GitStatusDto,
    GitCommitRequest,
    GitCommitDto,
    GitBranchDto,
    GitPushPullResult
} from '../api';

export const useGitOperations = (activeRepoId: string | null) => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<GitStatusDto | null>(null);
    const [commits, setCommits] = useState<GitCommitDto[]>([]);
    const [branches, setBranches] = useState<GitBranchDto[]>([]);

    const refreshStatus = useCallback(async () => {
        if (!activeRepoId) return;
        try {
            setLoading(true);
            const res = await getGitStatus(activeRepoId);
            setStatus(res.data);
        } catch (error) {
            Message.error('获取仓库状态失败');
        } finally {
            setLoading(false);
        }
    }, [activeRepoId]);

    const refreshLog = useCallback(async (branch?: string) => {
        if (!activeRepoId) return;
        try {
            const res = await getGitLog(activeRepoId, { branch, page: 0, size: 50 });
            setCommits(res.data);
        } catch (error) {
            Message.error('获取提交历史失败');
        }
    }, [activeRepoId]);

    const refreshBranches = useCallback(async () => {
        if (!activeRepoId) return;
        try {
            const res = await getBranches(activeRepoId);
            setBranches(res.data);
        } catch (error) {
            Message.error('获取分支列表失败');
        }
    }, [activeRepoId]);

    const refreshAll = useCallback(() => {
        if (!activeRepoId) {
            setStatus(null);
            setCommits([]);
            setBranches([]);
            return;
        }
        refreshStatus();
        refreshLog();
        refreshBranches();
    }, [activeRepoId, refreshStatus, refreshLog, refreshBranches]);

    const handleStage = async (filePaths: string[]) => {
        if (!activeRepoId) return;
        try {
            setLoading(true);
            const res = await stageFiles(activeRepoId, filePaths);
            setStatus(res.data);
            Message.success('已暂存');
        } catch (error) {
            Message.error('暂存失败');
        } finally {
            setLoading(false);
        }
    };

    const handleUnstage = async (filePaths: string[]) => {
        if (!activeRepoId) return;
        try {
            setLoading(true);
            const res = await unstageFiles(activeRepoId, filePaths);
            setStatus(res.data);
            Message.success('已取消暂存');
        } catch (error) {
            Message.error('取消暂存失败');
        } finally {
            setLoading(false);
        }
    };

    const handleStageAll = async () => {
        if (!activeRepoId) return;
        try {
            setLoading(true);
            const res = await stageAll(activeRepoId);
            setStatus(res.data);
            Message.success('已全部暂存');
        } catch (error) {
            Message.error('暂存失败');
        } finally {
            setLoading(false);
        }
    };

    const handleUnstageAll = async () => {
        if (!activeRepoId) return;
        try {
            setLoading(true);
            const res = await unstageAll(activeRepoId);
            setStatus(res.data);
            Message.success('已取消全部暂存');
        } catch (error) {
            Message.error('取消暂存失败');
        } finally {
            setLoading(false);
        }
    };

    const handleCommit = async (request: GitCommitRequest) => {
        if (!activeRepoId) return;
        try {
            setLoading(true);
            await commitChanges(activeRepoId, request);
            Message.success('提交成功');
            refreshAll();
        } catch (error) {
            Message.error('提交失败');
        } finally {
            setLoading(false);
        }
    };

    const handleDiscard = async (filePaths: string[]) => {
        if (!activeRepoId) return;
        try {
            setLoading(true);
            const res = await discardFiles(activeRepoId, filePaths);
            setStatus(res.data);
            Message.success('已丢弃变更');
        } catch (error) {
            Message.error('丢弃失败');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = async (branchName: string) => {
        if (!activeRepoId) return;
        try {
            setLoading(true);
            await checkoutBranch(activeRepoId, branchName);
            Message.success(`已切换到分支 ${branchName}`);
            refreshAll();
        } catch (error) {
            Message.error('切换分支失败');
        } finally {
            setLoading(false);
        }
    };

    const syncAction = async (action: 'push' | 'pull' | 'fetch', remoteName?: string): Promise<GitPushPullResult | null> => {
        if (!activeRepoId) return null;
        try {
            setLoading(true);
            let res;
            if (action === 'push') res = await pushRepo(activeRepoId, remoteName);
            else if (action === 'pull') res = await pullRepo(activeRepoId, remoteName);
            else res = await fetchRepo(activeRepoId, remoteName);

            const result: GitPushPullResult = res.data;
            if (result.success) {
                Message.success(`${action} 成功`);
            } else {
                Message.warning(`${action} 完成，但有警告：${result.message}`);
            }
            refreshAll();
            return result;
        } catch (error) {
            Message.error(`${action} 失败`);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        status,
        commits,
        branches,
        refreshAll,
        refreshStatus,
        refreshLog,
        refreshBranches,
        handleStage,
        handleUnstage,
        handleStageAll,
        handleUnstageAll,
        handleCommit,
        handleDiscard,
        handleCheckout,
        syncAction
    };
};
