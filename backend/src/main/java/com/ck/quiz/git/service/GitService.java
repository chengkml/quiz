package com.ck.quiz.git.service;

import com.ck.quiz.git.dto.*;

import java.util.List;

/**
 * Git 操作服务接口
 */
public interface GitService {

    GitStatusDto getStatus(String repoId);

    GitDiffDto getDiff(String repoId, String filePath, boolean staged);

    GitStatusDto stageFiles(String repoId, List<String> filePaths);

    GitStatusDto unstageFiles(String repoId, List<String> filePaths);

    GitStatusDto stageAll(String repoId);

    GitStatusDto unstageAll(String repoId);

    GitCommitDto commit(String repoId, GitCommitRequest request);

    GitStatusDto discardFiles(String repoId, List<String> filePaths);

    List<GitCommitDto> getLog(String repoId, String branch, int page, int size, String keyword);

    GitCommitDto getCommitDetail(String repoId, String commitId);

    List<GitBranchDto> getBranches(String repoId);

    GitBranchDto createBranch(String repoId, String branchName, String startPoint);

    GitStatusDto checkout(String repoId, String branchName);

    void deleteBranch(String repoId, String branchName);

    GitPushPullResult push(String repoId, String remoteName, boolean force);

    GitPushPullResult pull(String repoId, String remoteName, boolean rebase);

    GitPushPullResult fetch(String repoId, String remoteName);

    GitPushPullResult merge(String repoId, String sourceBranch);
}
