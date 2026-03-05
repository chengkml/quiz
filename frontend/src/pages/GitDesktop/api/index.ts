import axios from '@/core/src/http';

export interface GitRepoDto {
    id: string;
    name: string;
    localPath: string;
    remoteUrl?: string;
    defaultBranch?: string;
    description?: string;
    sortOrder?: number;
    isValid?: boolean;
    currentBranch?: string;
    createDate?: string;
    updateDate?: string;
}

export interface FileChangeDto {
    filePath: string;
    changeType: 'ADD' | 'MODIFY' | 'DELETE' | 'UNTRACKED' | 'CONFLICT';
    staged: boolean;
}

export interface GitStatusDto {
    repoId: string;
    repoName: string;
    currentBranch: string;
    ahead: number;
    behind: number;
    clean: boolean;
    changedFiles: FileChangeDto[];
}

export interface GitDiffDto {
    filePath: string;
    oldContent?: string;
    newContent?: string;
    diffContent?: string;
}

export interface GitCommitRequest {
    message: string;
    filesToStage?: string[];
    amend?: boolean;
}

export interface GitCommitDto {
    commitId: string;
    shortId: string;
    message: string;
    author: string;
    authorEmail: string;
    date: string;
    parentIds?: string[];
    changedFiles?: FileChangeDto[];
}

export interface GitBranchDto {
    name: string;
    isRemote: boolean;
    isCurrent: boolean;
    trackingBranch?: string;
    aheadCount?: number;
    behindCount?: number;
}

export interface GitPushPullResult {
    success: boolean;
    message: string;
    hasConflicts: boolean;
    conflictFiles?: string[];
}

// ================= Repository Management APIs =================
export const searchRepos = (params: any) => axios.post('/git/repos/search', params);
export const createRepo = (data: any) => axios.post('/git/repos/create', data);
export const updateRepo = (data: any) => axios.put('/git/repos/update', data);
export const deleteRepo = (id: string) => axios.delete('/git/repos/delete/' + id);
// ================= Git Operations APIs =================
export const getGitStatus = (repoId: string) =>
    axios.get('/git/repos/' + repoId + '/status');

export const getGitDiff = (repoId: string, filePath: string, staged: boolean = false) =>
    axios.get('/git/repos/' + repoId + '/diff', { params: { filePath, staged } });

export const stageFiles = (repoId: string, filePaths: string[]) =>
    axios.post('/git/repos/' + repoId + '/stage', { filePaths });

export const unstageFiles = (repoId: string, filePaths: string[]) =>
    axios.post('/git/repos/' + repoId + '/unstage', { filePaths });

export const stageAll = (repoId: string) =>
    axios.post('/git/repos/' + repoId + '/stage-all');

export const unstageAll = (repoId: string) =>
    axios.post('/git/repos/' + repoId + '/unstage-all');

export const commitChanges = (repoId: string, data: GitCommitRequest) =>
    axios.post('/git/repos/' + repoId + '/commit', data);

export const discardFiles = (repoId: string, filePaths: string[]) =>
    axios.post('/git/repos/' + repoId + '/discard', { filePaths });

export const getGitLog = (repoId: string, params: { branch?: string, page?: number, size?: number, keyword?: string }) =>
    axios.get('/git/repos/' + repoId + '/log', { params });

export const getCommitDetail = (repoId: string, commitId: string) =>
    axios.get('/git/repos/' + repoId + '/log/' + commitId);

export const getBranches = (repoId: string) =>
    axios.get('/git/repos/' + repoId + '/branches');

export const createBranch = (repoId: string, branchName: string, startPoint?: string) =>
    axios.post('/git/repos/' + repoId + '/branches', { branchName, startPoint });

export const checkoutBranch = (repoId: string, branchName: string) =>
    axios.post('/git/repos/' + repoId + '/checkout', { branchName });

export const deleteGitBranch = (repoId: string, branchName: string) =>
    axios.delete('/git/repos/' + repoId + '/branches/' + encodeURIComponent(branchName));

export const pushRepo = (repoId: string, remoteName?: string, force?: boolean) =>
    axios.post('/git/repos/' + repoId + '/push', { remoteName, force });

export const pullRepo = (repoId: string, remoteName?: string, rebase?: boolean) =>
    axios.post('/git/repos/' + repoId + '/pull', { remoteName, rebase });

export const fetchRepo = (repoId: string, remoteName?: string) =>
    axios.post('/git/repos/' + repoId + '/fetch', { remoteName });

export const mergeBranch = (repoId: string, sourceBranch: string) =>
    axios.post('/git/repos/' + repoId + '/merge', { sourceBranch });
