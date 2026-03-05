package com.ck.quiz.git.service.impl;

import com.ck.quiz.git.dto.*;
import com.ck.quiz.git.entity.GitRepo;
import com.ck.quiz.git.repository.GitRepoRepository;
import com.ck.quiz.git.service.GitRepositoryManager;
import com.ck.quiz.git.service.GitService;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.*;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.diff.DiffEntry;
import org.eclipse.jgit.diff.DiffFormatter;
import org.eclipse.jgit.lib.*;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.revwalk.RevWalk;
import org.eclipse.jgit.transport.PushResult;
import org.eclipse.jgit.transport.RemoteRefUpdate;
import org.eclipse.jgit.api.TransportCommand;
import org.eclipse.jgit.treewalk.CanonicalTreeParser;
import org.eclipse.jgit.treewalk.EmptyTreeIterator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;
import java.util.stream.Collectors;

@Slf4j
@Service
public class GitServiceImpl implements GitService {

    @Autowired
    private GitRepoRepository gitRepoRepository;

    @Autowired
    private GitRepositoryManager gitRepositoryManager;

    /** 按 repoId 加锁，防止同一仓库并发写操作 */
    private final ConcurrentHashMap<String, ReentrantLock> repoLocks = new ConcurrentHashMap<>();

    private ReentrantLock getLock(String repoId) {
        return repoLocks.computeIfAbsent(repoId, id -> new ReentrantLock());
    }

    /**
     * 为 Git 命令设置凭证提供程序（支持 HTTPS）
     */
    private void setCredientialsProvider(TransportCommand<?, ?> cmd) {
        try {
            org.eclipse.jgit.transport.CredentialsProvider provider = org.eclipse.jgit.transport.CredentialsProvider
                    .getDefault();
            if (provider != null) {
                cmd.setCredentialsProvider(provider);
                log.debug("已设置系统凭证提供程序");
            } else {
                log.debug("系统凭证提供程序为空，将使用默认 SSH 或其他认证方式");
            }
        } catch (Exception e) {
            log.warn("设置凭证提供程序失败: {}", e.getMessage());
            // 不中止执行，继续使用默认认证方式
        }
    }

    /**
     * 安全获取当前分支名
     */
    private String getCurrentBranch(Repository repo) {
        try {
            return repo.getBranch();
        } catch (IOException e) {
            log.warn("获取当前分支名失败，可能处于分离头指针状态", e);
            try {
                ObjectId headId = repo.resolve("HEAD");
                if (headId != null) {
                    return headId.abbreviate(7).name();
                }
            } catch (Exception ex) {
                log.debug("获取HEAD失败");
            }
            return "HEAD";
        }
    }

    private Repository getRepo(String repoId) {
        GitRepo gitRepo = gitRepoRepository.findById(repoId)
                .orElseThrow(() -> new IllegalArgumentException("仓库不存在: " + repoId));
        try {
            return gitRepositoryManager.getRepository(repoId, gitRepo.getLocalPath());
        } catch (IOException e) {
            throw new RuntimeException("无法打开仓库: " + gitRepo.getLocalPath(), e);
        }
    }

    @Override
    public GitStatusDto getStatus(String repoId) {
        Repository repo = getRepo(repoId);
        try (Git git = new Git(repo)) {
            Status status = git.status().call();
            GitStatusDto dto = new GitStatusDto();
            GitRepo gitRepo = gitRepoRepository.findById(repoId).orElse(null);
            dto.setRepoId(repoId);
            dto.setRepoName(gitRepo != null ? gitRepo.getName() : "");
            dto.setCurrentBranch(getCurrentBranch(repo));
            dto.setClean(status.isClean());

            List<FileChangeDto> files = new ArrayList<>();

            // Staged files
            for (String path : status.getAdded()) {
                files.add(buildFileChange(path, "ADD", true));
            }
            for (String path : status.getChanged()) {
                files.add(buildFileChange(path, "MODIFY", true));
            }
            for (String path : status.getRemoved()) {
                files.add(buildFileChange(path, "DELETE", true));
            }

            // Unstaged files
            for (String path : status.getModified()) {
                // 如果已经在 staged (changed) 中，跳过
                if (!status.getChanged().contains(path)) {
                    files.add(buildFileChange(path, "MODIFY", false));
                }
            }
            for (String path : status.getMissing()) {
                if (!status.getRemoved().contains(path)) {
                    files.add(buildFileChange(path, "DELETE", false));
                }
            }
            for (String path : status.getUntracked()) {
                files.add(buildFileChange(path, "UNTRACKED", false));
            }
            for (String path : status.getConflicting()) {
                files.add(buildFileChange(path, "CONFLICT", false));
            }

            dto.setChangedFiles(files);

            // ahead/behind counts
            try {
                String currentBranch = getCurrentBranch(repo);
                BranchTrackingStatus trackingStatus = BranchTrackingStatus.of(repo, currentBranch);
                if (trackingStatus != null) {
                    dto.setAhead(trackingStatus.getAheadCount());
                    dto.setBehind(trackingStatus.getBehindCount());
                }
            } catch (Exception e) {
                // 没有跟踪分支，忽略
            }

            return dto;
        } catch (GitAPIException e) {
            throw new RuntimeException("获取仓库状态失败", e);
        }
    }

    private FileChangeDto buildFileChange(String path, String changeType, boolean staged) {
        FileChangeDto dto = new FileChangeDto();
        dto.setFilePath(path);
        dto.setChangeType(changeType);
        dto.setStaged(staged);
        return dto;
    }

    @Override
    public GitDiffDto getDiff(String repoId, String filePath, boolean staged) {
        Repository repo = getRepo(repoId);
        GitDiffDto dto = new GitDiffDto();
        dto.setFilePath(filePath);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream();
                DiffFormatter formatter = new DiffFormatter(out)) {
            formatter.setRepository(repo);

            List<DiffEntry> diffs;
            if (staged) {
                // HEAD vs Index
                ObjectId head = repo.resolve(Constants.HEAD + "^{tree}");
                if (head != null) {
                    CanonicalTreeParser oldTree = new CanonicalTreeParser();
                    try (ObjectReader reader = repo.newObjectReader()) {
                        oldTree.reset(reader, head);
                    }
                    diffs = formatter.scan(oldTree, new org.eclipse.jgit.treewalk.FileTreeIterator(repo));
                } else {
                    diffs = formatter.scan(new EmptyTreeIterator(),
                            new org.eclipse.jgit.treewalk.FileTreeIterator(repo));
                }
            } else {
                // Index vs Working Tree
                try (Git git = new Git(repo)) {
                    diffs = git.diff().call();
                }
            }

            // 过滤目标文件
            for (DiffEntry entry : diffs) {
                String entryPath = entry.getChangeType() == DiffEntry.ChangeType.DELETE
                        ? entry.getOldPath()
                        : entry.getNewPath();
                if (entryPath.equals(filePath)) {
                    out.reset();
                    formatter.format(entry);
                    dto.setDiffContent(out.toString("UTF-8"));
                    break;
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("获取 diff 失败: " + filePath, e);
        }

        return dto;
    }

    @Override
    public GitStatusDto stageFiles(String repoId, List<String> filePaths) {
        ReentrantLock lock = getLock(repoId);
        lock.lock();
        try {
            Repository repo = getRepo(repoId);
            try (Git git = new Git(repo)) {
                AddCommand addCmd = git.add();
                for (String path : filePaths) {
                    addCmd.addFilepattern(path);
                }
                addCmd.call();
            } catch (GitAPIException e) {
                throw new RuntimeException("暂存文件失败", e);
            }
            return getStatus(repoId);
        } finally {
            lock.unlock();
        }
    }

    @Override
    public GitStatusDto unstageFiles(String repoId, List<String> filePaths) {
        ReentrantLock lock = getLock(repoId);
        lock.lock();
        try {
            Repository repo = getRepo(repoId);
            try (Git git = new Git(repo)) {
                ResetCommand resetCmd = git.reset();
                for (String path : filePaths) {
                    resetCmd.addPath(path);
                }
                resetCmd.call();
            } catch (GitAPIException e) {
                throw new RuntimeException("取消暂存失败", e);
            }
            return getStatus(repoId);
        } finally {
            lock.unlock();
        }
    }

    @Override
    public GitStatusDto stageAll(String repoId) {
        ReentrantLock lock = getLock(repoId);
        lock.lock();
        try {
            Repository repo = getRepo(repoId);
            try (Git git = new Git(repo)) {
                git.add().addFilepattern(".").call();
                // 也处理删除的文件
                git.add().addFilepattern(".").setUpdate(true).call();
            } catch (GitAPIException e) {
                throw new RuntimeException("暂存全部失败", e);
            }
            return getStatus(repoId);
        } finally {
            lock.unlock();
        }
    }

    @Override
    public GitStatusDto unstageAll(String repoId) {
        ReentrantLock lock = getLock(repoId);
        lock.lock();
        try {
            Repository repo = getRepo(repoId);
            try (Git git = new Git(repo)) {
                git.reset().call();
            } catch (GitAPIException e) {
                throw new RuntimeException("取消暂存全部失败", e);
            }
            return getStatus(repoId);
        } finally {
            lock.unlock();
        }
    }

    @Override
    public GitCommitDto commit(String repoId, GitCommitRequest request) {
        ReentrantLock lock = getLock(repoId);
        lock.lock();
        try {
            Repository repo = getRepo(repoId);
            try (Git git = new Git(repo)) {
                // 先暂存指定文件
                if (request.getFilesToStage() != null && !request.getFilesToStage().isEmpty()) {
                    AddCommand addCmd = git.add();
                    for (String path : request.getFilesToStage()) {
                        addCmd.addFilepattern(path);
                    }
                    addCmd.call();
                }

                CommitCommand commitCmd = git.commit()
                        .setMessage(request.getMessage())
                        .setAmend(request.isAmend());
                RevCommit commit = commitCmd.call();

                return convertCommit(commit);
            } catch (GitAPIException e) {
                throw new RuntimeException("提交失败: " + e.getMessage(), e);
            }
        } finally {
            lock.unlock();
        }
    }

    @Override
    public GitStatusDto discardFiles(String repoId, List<String> filePaths) {
        ReentrantLock lock = getLock(repoId);
        lock.lock();
        try {
            Repository repo = getRepo(repoId);
            try (Git git = new Git(repo)) {
                CheckoutCommand checkoutCmd = git.checkout();
                for (String path : filePaths) {
                    checkoutCmd.addPath(path);
                }
                checkoutCmd.call();
            } catch (GitAPIException e) {
                throw new RuntimeException("丢弃变更失败", e);
            }
            return getStatus(repoId);
        } finally {
            lock.unlock();
        }
    }

    @Override
    public List<GitCommitDto> getLog(String repoId, String branch, int page, int size, String keyword) {
        Repository repo = getRepo(repoId);
        try (Git git = new Git(repo)) {
            // 检查仓库是否为空（没有任何提交）
            try {
                ObjectId headId = repo.resolve("HEAD");
                if (headId == null) {
                    log.info("仓库为空，没有任何提交历史");
                    return new ArrayList<>();
                }
            } catch (Exception e) {
                log.info("仓库为空或损坏，没有有效的HEAD");
                return new ArrayList<>();
            }

            LogCommand logCmd = git.log();

            if (branch != null && !branch.isEmpty()) {
                ObjectId branchId = repo.resolve(branch);
                if (branchId != null) {
                    logCmd.add(branchId);
                } else {
                    log.warn("分支不存在: {}", branch);
                    return new ArrayList<>();
                }
            } else {
                // 当没有指定分支时，获取所有分支的提交历史
                logCmd.all();
            }

            logCmd.setSkip(page * size);
            logCmd.setMaxCount(size);

            List<GitCommitDto> commits = new ArrayList<>();
            Iterable<RevCommit> commitIter = logCmd.call();
            if (commitIter != null) {
                for (RevCommit commit : commitIter) {
                    GitCommitDto dto = convertCommit(commit);
                    // keyword 过滤
                    if (keyword != null && !keyword.isEmpty()) {
                        if (!dto.getMessage().toLowerCase().contains(keyword.toLowerCase())
                                && !dto.getAuthor().toLowerCase().contains(keyword.toLowerCase())) {
                            continue;
                        }
                    }
                    commits.add(dto);
                }
            }
            return commits;
        } catch (GitAPIException | IOException e) {
            log.error("获取提交历史失败，repoId: {}, branch: {}", repoId, branch, e);
            throw new RuntimeException("获取提交历史失败: " + e.getMessage(), e);
        }
    }

    @Override
    public GitCommitDto getCommitDetail(String repoId, String commitId) {
        Repository repo = getRepo(repoId);
        try (RevWalk revWalk = new RevWalk(repo)) {
            ObjectId id = repo.resolve(commitId);
            if (id == null) {
                throw new IllegalArgumentException("Commit 不存在: " + commitId);
            }
            RevCommit commit = revWalk.parseCommit(id);
            GitCommitDto dto = convertCommit(commit);

            // 获取此次 commit 的文件变更
            List<FileChangeDto> changes = new ArrayList<>();
            try (ByteArrayOutputStream out = new ByteArrayOutputStream();
                    DiffFormatter formatter = new DiffFormatter(out)) {
                formatter.setRepository(repo);
                List<DiffEntry> diffs;

                if (commit.getParentCount() > 0) {
                    RevCommit parent = revWalk.parseCommit(commit.getParent(0).getId());
                    diffs = formatter.scan(parent.getTree(), commit.getTree());
                } else {
                    diffs = formatter.scan(new EmptyTreeIterator(),
                            new CanonicalTreeParser(null, repo.newObjectReader(), commit.getTree()));
                }

                for (DiffEntry entry : diffs) {
                    FileChangeDto fc = new FileChangeDto();
                    fc.setFilePath(entry.getChangeType() == DiffEntry.ChangeType.DELETE
                            ? entry.getOldPath()
                            : entry.getNewPath());
                    fc.setChangeType(entry.getChangeType().name());
                    fc.setStaged(true);
                    changes.add(fc);
                }
            }
            dto.setChangedFiles(changes);
            return dto;
        } catch (Exception e) {
            throw new RuntimeException("获取提交详情失败", e);
        }
    }

    @Override
    public List<GitBranchDto> getBranches(String repoId) {
        Repository repo = getRepo(repoId);
        try (Git git = new Git(repo)) {
            List<GitBranchDto> result = new ArrayList<>();
            String currentBranch = getCurrentBranch(repo);

            // 本地分支
            for (Ref ref : git.branchList().call()) {
                GitBranchDto dto = new GitBranchDto();
                String name = ref.getName().replace("refs/heads/", "");
                dto.setName(name);
                dto.setRemote(false);
                dto.setCurrent(name.equals(currentBranch));

                try {
                    BranchTrackingStatus tracking = BranchTrackingStatus.of(repo, name);
                    if (tracking != null) {
                        dto.setTrackingBranch(tracking.getRemoteTrackingBranch());
                        dto.setAheadCount(tracking.getAheadCount());
                        dto.setBehindCount(tracking.getBehindCount());
                    }
                } catch (Exception e) {
                    // 忽略
                }
                result.add(dto);
            }

            // 远程分支
            for (Ref ref : git.branchList().setListMode(ListBranchCommand.ListMode.REMOTE).call()) {
                GitBranchDto dto = new GitBranchDto();
                dto.setName(ref.getName().replace("refs/remotes/", ""));
                dto.setRemote(true);
                dto.setCurrent(false);
                result.add(dto);
            }

            return result;
        } catch (GitAPIException e) {
            throw new RuntimeException("获取分支列表失败", e);
        }
    }

    @Override
    public GitBranchDto createBranch(String repoId, String branchName, String startPoint) {
        ReentrantLock lock = getLock(repoId);
        lock.lock();
        try {
            Repository repo = getRepo(repoId);
            try (Git git = new Git(repo)) {
                CreateBranchCommand cmd = git.branchCreate().setName(branchName);
                if (startPoint != null && !startPoint.isEmpty()) {
                    cmd.setStartPoint(startPoint);
                }
                Ref ref = cmd.call();

                GitBranchDto dto = new GitBranchDto();
                dto.setName(branchName);
                dto.setRemote(false);
                dto.setCurrent(false);
                return dto;
            } catch (GitAPIException e) {
                throw new RuntimeException("创建分支失败: " + e.getMessage(), e);
            }
        } finally {
            lock.unlock();
        }
    }

    @Override
    public GitStatusDto checkout(String repoId, String branchName) {
        ReentrantLock lock = getLock(repoId);
        lock.lock();
        try {
            Repository repo = getRepo(repoId);
            try (Git git = new Git(repo)) {
                git.checkout().setName(branchName).call();
            } catch (GitAPIException e) {
                throw new RuntimeException("切换分支失败: " + e.getMessage(), e);
            }
            return getStatus(repoId);
        } finally {
            lock.unlock();
        }
    }

    @Override
    public void deleteBranch(String repoId, String branchName) {
        ReentrantLock lock = getLock(repoId);
        lock.lock();
        try {
            Repository repo = getRepo(repoId);
            try (Git git = new Git(repo)) {
                git.branchDelete().setBranchNames(branchName).setForce(true).call();
            } catch (GitAPIException e) {
                throw new RuntimeException("删除分支失败: " + e.getMessage(), e);
            }
        } finally {
            lock.unlock();
        }
    }

    @Override
    public GitPushPullResult push(String repoId, String remoteName, boolean force) {
        ReentrantLock lock = getLock(repoId);
        lock.lock();
        try {
            Repository repo = getRepo(repoId);
            GitPushPullResult result = new GitPushPullResult();
            try (Git git = new Git(repo)) {
                PushCommand pushCmd = git.push();
                if (remoteName != null && !remoteName.isEmpty()) {
                    pushCmd.setRemote(remoteName);
                }
                pushCmd.setForce(force);

                // 设置凭证提供程序以支持 HTTPS 认证
                setCredientialsProvider(pushCmd);

                Iterable<PushResult> pushResults = pushCmd.call();
                StringBuilder msg = new StringBuilder();
                boolean allOk = true;
                boolean hasAuthError = false;
                for (PushResult pr : pushResults) {
                    // 检查推送结果中的错误消息
                    if (pr.getMessages() != null && !pr.getMessages().isEmpty()) {
                        String messages = pr.getMessages();
                        if (messages.contains("Authentication")) {
                            hasAuthError = true;
                        }
                    }

                    for (RemoteRefUpdate update : pr.getRemoteUpdates()) {
                        if (update.getStatus() != RemoteRefUpdate.Status.OK
                                && update.getStatus() != RemoteRefUpdate.Status.UP_TO_DATE) {
                            allOk = false;
                            // 检查更新的具体状态
                            String statusMsg = update.getStatus().toString();
                            if (statusMsg.contains("REJECTED") || statusMsg.contains("NO_CHANGE")) {
                                msg.append(update.getRemoteName()).append(": ")
                                        .append(statusMsg);
                                if (update.getMessage() != null && !update.getMessage().isEmpty()) {
                                    msg.append(" - ").append(update.getMessage());
                                }
                                msg.append("\n");
                            }
                        }
                    }
                }
                result.setSuccess(allOk);

                if (!allOk && hasAuthError) {
                    result.setMessage("推送失败: 需要身份认证。请确保已配置 Git 凭证或使用 SSH 密钥。");
                } else if (!allOk && msg.length() > 0) {
                    result.setMessage("推送失败: " + msg.toString().trim());
                } else if (!allOk) {
                    result.setMessage("推送失败: 未知错误");
                } else {
                    result.setMessage("推送成功");
                }
            } catch (GitAPIException e) {
                result.setSuccess(false);
                String errorMsg = e.getMessage();
                if (errorMsg != null && errorMsg.contains("Authentication is required")) {
                    result.setMessage("推送失败: 需要身份认证。请配置 Git 凭证或使用 SSH 密钥。");
                } else {
                    result.setMessage("推送失败: " + errorMsg);
                }
            }
            return result;
        } finally {
            lock.unlock();
        }
    }

    @Override
    public GitPushPullResult pull(String repoId, String remoteName, boolean rebase) {
        ReentrantLock lock = getLock(repoId);
        lock.lock();
        try {
            Repository repo = getRepo(repoId);
            GitPushPullResult result = new GitPushPullResult();
            try (Git git = new Git(repo)) {
                String currentBranch = getCurrentBranch(repo);
                String remoteToUse = (remoteName != null && !remoteName.isEmpty()) ? remoteName : "origin";

                // 如果没有指定远程分支，尝试找到远端对应的分支
                String remoteBranch = null;
                try {
                    // 获取远程分支列表
                    java.util.List<Ref> remoteRefs = git.lsRemote()
                            .setRemote(remoteToUse)
                            .setHeads(true) // 只获取分支，不获取 tags
                            .call()
                            .stream()
                            .filter(ref -> ref.getName().startsWith("refs/heads/"))
                            .collect(java.util.stream.Collectors.toList());

                    // 首先尝试找到当前分支名对应的远程分支
                    remoteBranch = remoteRefs.stream()
                            .filter(ref -> ref.getName().equals("refs/heads/" + currentBranch))
                            .map(ref -> currentBranch)
                            .findFirst()
                            .orElse(null);

                    // 如果当前分支在远端不存在，尝试找到默认分支（main 或 master）
                    if (remoteBranch == null && !remoteRefs.isEmpty()) {
                        remoteBranch = remoteRefs.stream()
                                .filter(ref -> ref.getName().equals("refs/heads/main")
                                        || ref.getName().equals("refs/heads/master"))
                                .map(ref -> {
                                    String refName = ref.getName();
                                    return refName.substring("refs/heads/".length());
                                })
                                .findFirst()
                                .orElse(null);
                    }

                    if (remoteBranch == null && !remoteRefs.isEmpty()) {
                        // 如果找不到 main 或 master，使用第一个远程分支
                        String refName = remoteRefs.get(0).getName();
                        remoteBranch = refName.substring("refs/heads/".length());
                    }
                } catch (Exception e) {
                    log.warn("获取远程分支列表失败: {}", e.getMessage());
                    // 如果获取列表失败，使用当前分支名
                    remoteBranch = currentBranch;
                }

                if (remoteBranch == null) {
                    result.setSuccess(false);
                    result.setMessage("无法找到合适的远程分支。请检查远程仓库是否为空或网络连接。");
                    return result;
                }

                PullCommand pullCmd = git.pull();
                pullCmd.setRemote(remoteToUse);
                if (rebase) {
                    pullCmd.setRebase(BranchConfig.BranchRebaseMode.REBASE);
                }

                // 设置凭证提供程序以支持 HTTPS 认证
                setCredientialsProvider(pullCmd);

                org.eclipse.jgit.api.PullResult pullResult = pullCmd.call();

                result.setSuccess(pullResult.isSuccessful());
                String resultMsg = "";
                if (pullResult.getMergeResult() != null) {
                    resultMsg = pullResult.getMergeResult().getMergeStatus().toString();
                    if (pullResult.getMergeResult().getConflicts() != null) {
                        result.setHasConflicts(true);
                        result.setConflictFiles(new ArrayList<>(pullResult.getMergeResult().getConflicts().keySet()));
                    }
                } else if (pullResult.getRebaseResult() != null) {
                    resultMsg = pullResult.getRebaseResult().getStatus().toString();
                    if (pullResult.getRebaseResult().getConflicts() != null) {
                        result.setHasConflicts(true);
                        result.setConflictFiles(pullResult.getRebaseResult().getConflicts());
                    }
                } else {
                    resultMsg = "成功从 " + remoteToUse + "/" + remoteBranch + " 拉取更新";
                }
                result.setMessage(resultMsg);
            } catch (GitAPIException e) {
                result.setSuccess(false);
                String errorMsg = e.getMessage();
                if (errorMsg != null && errorMsg.contains("did not advertise Ref")) {
                    result.setMessage("拉取失败: 远程分支不存在。请检查远程仓库的分支配置。");
                } else {
                    result.setMessage("拉取失败: " + errorMsg);
                }
            }
            return result;
        } finally {
            lock.unlock();
        }
    }

    @Override
    public GitPushPullResult fetch(String repoId, String remoteName) {
        ReentrantLock lock = getLock(repoId);
        lock.lock();
        try {
            Repository repo = getRepo(repoId);
            GitPushPullResult result = new GitPushPullResult();
            try (Git git = new Git(repo)) {
                FetchCommand fetchCmd = git.fetch();
                if (remoteName != null && !remoteName.isEmpty()) {
                    fetchCmd.setRemote(remoteName);
                }
                // 设置凭证提供程序以支持 HTTPS 认证
                setCredientialsProvider(fetchCmd);
                fetchCmd.call();
                result.setSuccess(true);
                result.setMessage("Fetch completed");
            } catch (GitAPIException e) {
                result.setSuccess(false);
                result.setMessage("获取远程更新失败: " + e.getMessage());
            }
            return result;
        } finally {
            lock.unlock();
        }
    }

    @Override
    public GitPushPullResult merge(String repoId, String sourceBranch) {
        ReentrantLock lock = getLock(repoId);
        lock.lock();
        try {
            Repository repo = getRepo(repoId);
            GitPushPullResult result = new GitPushPullResult();
            try (Git git = new Git(repo)) {
                ObjectId branchId = repo.resolve(sourceBranch);
                if (branchId == null) {
                    result.setSuccess(false);
                    result.setMessage("分支不存在: " + sourceBranch);
                    return result;
                }
                org.eclipse.jgit.api.MergeResult mergeResult = git.merge()
                        .include(branchId)
                        .call();
                result.setSuccess(mergeResult.getMergeStatus().isSuccessful());
                result.setMessage(mergeResult.getMergeStatus().toString());
                if (mergeResult.getConflicts() != null) {
                    result.setHasConflicts(true);
                    result.setConflictFiles(new ArrayList<>(mergeResult.getConflicts().keySet()));
                }
            } catch (Exception e) {
                result.setSuccess(false);
                result.setMessage("合并失败: " + e.getMessage());
            }
            return result;
        } finally {
            lock.unlock();
        }
    }

    private GitCommitDto convertCommit(RevCommit commit) {
        GitCommitDto dto = new GitCommitDto();
        dto.setCommitId(commit.getId().getName());
        dto.setShortId(commit.getId().abbreviate(7).name());
        dto.setMessage(commit.getFullMessage());
        dto.setAuthor(commit.getAuthorIdent().getName());
        dto.setAuthorEmail(commit.getAuthorIdent().getEmailAddress());
        dto.setDate(LocalDateTime.ofInstant(
                Instant.ofEpochSecond(commit.getCommitTime()),
                ZoneId.systemDefault()));
        dto.setParentIds(Arrays.stream(commit.getParents())
                .map(p -> p.getId().getName())
                .collect(Collectors.toList()));
        return dto;
    }
}
