package com.ck.quiz.git.controller;

import com.ck.quiz.git.dto.*;
import com.ck.quiz.git.service.GitService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "Git操作", description = "Git仓库的版本控制操作接口")
@RestController
@RequestMapping("/api/git/repos/{repoId}")
public class GitController {

    @Autowired
    private GitService gitService;

    @Operation(summary = "获取工作区状态")
    @GetMapping("/status")
    public ResponseEntity<GitStatusDto> getStatus(
            @Parameter(description = "仓库ID") @PathVariable String repoId) {
        return ResponseEntity.ok(gitService.getStatus(repoId));
    }

    @Operation(summary = "查看文件diff")
    @GetMapping("/diff")
    public ResponseEntity<GitDiffDto> getDiff(
            @PathVariable String repoId,
            @RequestParam String filePath,
            @RequestParam(defaultValue = "false") boolean staged) {
        return ResponseEntity.ok(gitService.getDiff(repoId, filePath, staged));
    }

    @Operation(summary = "暂存文件")
    @PostMapping("/stage")
    public ResponseEntity<GitStatusDto> stageFiles(
            @PathVariable String repoId,
            @RequestBody Map<String, List<String>> body) {
        return ResponseEntity.ok(gitService.stageFiles(repoId, body.get("filePaths")));
    }

    @Operation(summary = "取消暂存")
    @PostMapping("/unstage")
    public ResponseEntity<GitStatusDto> unstageFiles(
            @PathVariable String repoId,
            @RequestBody Map<String, List<String>> body) {
        return ResponseEntity.ok(gitService.unstageFiles(repoId, body.get("filePaths")));
    }

    @Operation(summary = "暂存全部")
    @PostMapping("/stage-all")
    public ResponseEntity<GitStatusDto> stageAll(@PathVariable String repoId) {
        return ResponseEntity.ok(gitService.stageAll(repoId));
    }

    @Operation(summary = "取消暂存全部")
    @PostMapping("/unstage-all")
    public ResponseEntity<GitStatusDto> unstageAll(@PathVariable String repoId) {
        return ResponseEntity.ok(gitService.unstageAll(repoId));
    }

    @Operation(summary = "提交")
    @PostMapping("/commit")
    public ResponseEntity<GitCommitDto> commit(
            @PathVariable String repoId,
            @RequestBody GitCommitRequest request) {
        return ResponseEntity.ok(gitService.commit(repoId, request));
    }

    @Operation(summary = "丢弃文件变更")
    @PostMapping("/discard")
    public ResponseEntity<GitStatusDto> discardFiles(
            @PathVariable String repoId,
            @RequestBody Map<String, List<String>> body) {
        return ResponseEntity.ok(gitService.discardFiles(repoId, body.get("filePaths")));
    }

    @Operation(summary = "提交历史")
    @GetMapping("/log")
    public ResponseEntity<List<GitCommitDto>> getLog(
            @PathVariable String repoId,
            @RequestParam(required = false) String branch,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(gitService.getLog(repoId, branch, page, size, keyword));
    }

    @Operation(summary = "提交详情")
    @GetMapping("/log/{commitId}")
    public ResponseEntity<GitCommitDto> getCommitDetail(
            @PathVariable String repoId,
            @PathVariable String commitId) {
        return ResponseEntity.ok(gitService.getCommitDetail(repoId, commitId));
    }

    @Operation(summary = "分支列表")
    @GetMapping("/branches")
    public ResponseEntity<List<GitBranchDto>> getBranches(@PathVariable String repoId) {
        return ResponseEntity.ok(gitService.getBranches(repoId));
    }

    @Operation(summary = "创建分支")
    @PostMapping("/branches")
    public ResponseEntity<GitBranchDto> createBranch(
            @PathVariable String repoId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(gitService.createBranch(repoId,
                body.get("branchName"), body.get("startPoint")));
    }

    @Operation(summary = "切换分支")
    @PostMapping("/checkout")
    public ResponseEntity<GitStatusDto> checkout(
            @PathVariable String repoId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(gitService.checkout(repoId, body.get("branchName")));
    }

    @Operation(summary = "删除分支")
    @DeleteMapping("/branches/{branchName}")
    public ResponseEntity<Void> deleteBranch(
            @PathVariable String repoId,
            @PathVariable String branchName) {
        gitService.deleteBranch(repoId, branchName);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "推送")
    @PostMapping("/push")
    public ResponseEntity<GitPushPullResult> push(
            @PathVariable String repoId,
            @RequestBody(required = false) Map<String, Object> body) {
        String remoteName = body != null ? (String) body.get("remoteName") : null;
        boolean force = body != null && Boolean.TRUE.equals(body.get("force"));
        return ResponseEntity.ok(gitService.push(repoId, remoteName, force));
    }

    @Operation(summary = "拉取")
    @PostMapping("/pull")
    public ResponseEntity<GitPushPullResult> pull(
            @PathVariable String repoId,
            @RequestBody(required = false) Map<String, Object> body) {
        String remoteName = body != null ? (String) body.get("remoteName") : null;
        boolean rebase = body != null && Boolean.TRUE.equals(body.get("rebase"));
        return ResponseEntity.ok(gitService.pull(repoId, remoteName, rebase));
    }

    @Operation(summary = "获取远程更新")
    @PostMapping("/fetch")
    public ResponseEntity<GitPushPullResult> fetch(
            @PathVariable String repoId,
            @RequestBody(required = false) Map<String, Object> body) {
        String remoteName = body != null ? (String) body.get("remoteName") : null;
        return ResponseEntity.ok(gitService.fetch(repoId, remoteName));
    }

    @Operation(summary = "合并分支")
    @PostMapping("/merge")
    public ResponseEntity<GitPushPullResult> merge(
            @PathVariable String repoId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(gitService.merge(repoId, body.get("sourceBranch")));
    }
}
