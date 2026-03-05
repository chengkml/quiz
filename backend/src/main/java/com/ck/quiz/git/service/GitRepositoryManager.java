package com.ck.quiz.git.service;

import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.storage.file.FileRepositoryBuilder;
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider;
import org.springframework.stereotype.Component;

import jakarta.annotation.PreDestroy;
import java.io.File;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

/**
 * JGit Repository 缓存池管理器。
 * 根据 repoId 动态获取/缓存 JGit Repository 实例。
 */
@Slf4j
@Component
public class GitRepositoryManager {

    private final ConcurrentHashMap<String, Repository> cache = new ConcurrentHashMap<>();

    /**
     * 根据 repoId 获取 JGit Repository，有缓存则复用，否则动态打开。
     */
    public Repository getRepository(String repoId, String localPath) throws IOException {
        Repository repo = cache.get(repoId);
        if (repo != null) {
            // 检查仓库是否仍然有效
            File gitDir = repo.getDirectory();
            if (gitDir != null && gitDir.exists()) {
                return repo;
            }
            // 缓存失效，移除
            cache.remove(repoId);
            repo.close();
        }
        // 动态打开仓库
        Repository newRepo = new FileRepositoryBuilder()
                .setGitDir(new File(localPath, ".git"))
                .readEnvironment()
                .build();
        cache.put(repoId, newRepo);
        return newRepo;
    }

    /**
     * 校验路径是否为有效 Git 仓库
     */
    public boolean isValidRepo(String localPath) {
        File gitDir = new File(localPath, ".git");
        return gitDir.exists() && gitDir.isDirectory();
    }

    /**
     * 克隆远程仓库到本地路径
     */
    public void cloneRepository(String remoteUrl, String localPath, String username, String password) throws GitAPIException {
        File targetDir = new File(localPath);
        if (targetDir.exists()) {
            throw new IllegalArgumentException("目标路径已存在: " + localPath);
        }
        
        // 创建父目录
        if (!targetDir.getParentFile().exists()) {
            targetDir.getParentFile().mkdirs();
        }
        
        // 检查 URL 类型
        if (remoteUrl.startsWith("git@")) {
            throw new IllegalArgumentException("不支持 SSH 协议，请使用 HTTPS 地址\n例如：https://github.com/username/repo.git");
        }
        
        log.info("开始克隆仓库: {} -> {}", remoteUrl, localPath);
        
        var cloneCommand = Git.cloneRepository()
                .setURI(remoteUrl)
                .setDirectory(targetDir);
        
        // 如果提供了凭据，则使用身份验证
        if (username != null && !username.trim().isEmpty() && password != null && !password.trim().isEmpty()) {
            cloneCommand.setCredentialsProvider(
                new UsernamePasswordCredentialsProvider(username.trim(), password.trim())
            );
            log.info("使用身份验证: {}", username);
        }
        
        cloneCommand.call();
        log.info("仓库克隆完成: {}", localPath);
    }

    /**
     * 移除仓库时清除缓存
     */
    public void evict(String repoId) {
        Repository repo = cache.remove(repoId);
        if (repo != null) {
            repo.close();
            log.info("Evicted JGit repository cache for repoId: {}", repoId);
        }
    }

    @PreDestroy
    public void cleanup() {
        cache.values().forEach(Repository::close);
        cache.clear();
        log.info("Cleaned up all JGit repository caches");
    }
}
