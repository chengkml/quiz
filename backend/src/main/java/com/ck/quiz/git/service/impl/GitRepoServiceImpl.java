package com.ck.quiz.git.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.git.dto.*;
import com.ck.quiz.git.entity.GitRepo;
import com.ck.quiz.git.repository.GitRepoRepository;
import com.ck.quiz.git.service.GitRepoService;
import com.ck.quiz.git.service.GitRepositoryManager;
import com.ck.quiz.utils.JdbcQueryHelper;

import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.lib.Repository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@Transactional
public class GitRepoServiceImpl
        extends
        BaseServiceImpl<GitRepoCreateDto, GitRepoUpdateDto, GitRepoQueryDto, GitRepoDto, GitRepo, GitRepoRepository>
        implements GitRepoService {

    @Autowired
    private GitRepoRepository gitRepoRepository;

    @Autowired
    private GitRepositoryManager gitRepositoryManager;

    @org.springframework.beans.factory.annotation.Value("${quiz.git.base-path:./data/git_repos}")
    private String basePath;

    @Override
    public GitRepoDto create(GitRepoCreateDto createDto) {
        String repoName = createDto.getName().trim();
        if (!repoName.matches("^[a-zA-Z0-9_.-]+$")) {
            throw new IllegalArgumentException("仓库名称只能包含字母、数字、下划线、点和连字符");
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserName = (authentication != null && authentication.isAuthenticated()) ? authentication.getName()
                : "anonymous";
        // 构造本地绝对路径 (将 basePath / username / repoName 拼接)
        java.io.File baseDir = new java.io.File(basePath).getAbsoluteFile();
        java.io.File userBaseDir = new java.io.File(baseDir, currentUserName);
        java.io.File repoDir = new java.io.File(userBaseDir, repoName);
        String localPath = repoDir.getAbsolutePath();

        // 如果提供了远程URL，则克隆仓库
        String remoteUrl = createDto.getRemoteUrl();
        if (remoteUrl != null && !remoteUrl.trim().isEmpty()) {
            try {
                gitRepositoryManager.cloneRepository(remoteUrl.trim(), localPath);
            } catch (org.eclipse.jgit.api.errors.GitAPIException e) {
                log.error("克隆仓库失败: {} -> {}", remoteUrl, localPath, e);
                throw new RuntimeException("克隆仓库失败: " + e.getMessage(), e);
            }
        } else {
            // 校验路径有效性（仅在不克隆时）
            if (!gitRepositoryManager.isValidRepo(localPath)) {
                throw new IllegalArgumentException("该路径尚未初始化 Git 仓库或非有效仓库: " + localPath);
            }
        }

        GitRepo repo = newModel();
        // 手动拷贝属性（已移除 localPath）
        repo.setName(createDto.getName());
        repo.setDescription(createDto.getDescription());
        repo.setRemoteUrl(remoteUrl);
        repo.setSortOrder(createDto.getSortOrder());
        repo.setLocalPath(localPath);
        repo.setId(com.ck.quiz.utils.IdHelper.genUuid()); // Add Id generation since we bypass super.create

        return convertToDto(repository.save(repo), true);
    }

    @Override
    public void delete(String userId, String id) {
        // 清除仓库缓存
        gitRepositoryManager.evict(id);
        super.delete(userId, id);
    }

    @Override
    public GitRepoDto update(String userId, GitRepoUpdateDto updateDto) {
        String repoName = updateDto.getName().trim();
        if (!repoName.matches("^[a-zA-Z0-9_.-]+$")) {
            throw new IllegalArgumentException("仓库名称只能包含字母、数字、下划线、点和连字符");
        }

        // 当名称修改时，我们并不自动移动目录。如果需要支持重命名移动目录，这里需要特别处理。
        // 目前简单起见，如果名称改了，路径也需要跟着变吗？
        // 为避免复杂性，不允许修改名称，或者提示如果修改名称需手动转移目录。
        // 在这里我们允许修改名称，但会自动更新 localPath。
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserName = (authentication != null && authentication.isAuthenticated()) ? authentication.getName()
                : "anonymous";

        java.io.File baseDir = new java.io.File(basePath).getAbsoluteFile();
        java.io.File userBaseDir = new java.io.File(baseDir, currentUserName);
        java.io.File repoDir = new java.io.File(userBaseDir, repoName);
        String localPath = repoDir.getAbsolutePath();
        if (!gitRepositoryManager.isValidRepo(localPath)) {
            throw new IllegalArgumentException("新名称对应的路径不是有效的 Git 仓库: " + localPath);
        }

        GitRepo model = repository.findById(updateDto.getId())
                .orElseThrow(() -> new IllegalArgumentException("仓库不存在"));

        // 只有创建人或管理员能修改，基类里有校验，这里简单处理
        model.setName(repoName);
        model.setLocalPath(localPath);
        model.setRemoteUrl(updateDto.getRemoteUrl());
        model.setDescription(updateDto.getDescription());
        model.setDefaultBranch(updateDto.getDefaultBranch());
        model.setSortOrder(updateDto.getSortOrder());

        return convertToDto(repository.save(model), true);
    }

    @Override
    public GitRepoDto convertToDto(GitRepo model, Boolean loadProps) {
        GitRepoDto dto = super.convertToDto(model, loadProps);
        // 动态字段
        dto.setIsValid(gitRepositoryManager.isValidRepo(model.getLocalPath()));
        if (Boolean.TRUE.equals(dto.getIsValid())) {
            try {
                Repository repo = gitRepositoryManager.getRepository(model.getId(), model.getLocalPath());
                dto.setCurrentBranch(repo.getBranch());
                // 自动填充 remoteUrl（如果未手动设置）
                if (dto.getRemoteUrl() == null || dto.getRemoteUrl().isEmpty()) {
                    String remoteUrl = repo.getConfig().getString("remote", "origin", "url");
                    dto.setRemoteUrl(remoteUrl);
                }
            } catch (Exception e) {
                log.warn("获取仓库分支信息失败: {}", e.getMessage());
                dto.setIsValid(false);
            }
        }
        return dto;
    }

    @Override
    public Page<GitRepoDto> search(String userId, GitRepoQueryDto queryDto) {
        StringBuilder sql = new StringBuilder(
                "SELECT t.* FROM quiz_git_repository t WHERE 1=1 ");
        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM quiz_git_repository t WHERE 1=1 ");
        Map<String, Object> params = new HashMap<>();

        JdbcQueryHelper.lowerLike("keyWord", queryDto.getKeyWord(),
                " AND (LOWER(t.name) LIKE :keyWord OR LOWER(t.local_path) LIKE :keyWord) ",
                params, namedParameterJdbcTemplate, sql, countSql);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            JdbcQueryHelper.equals("createUser", authentication.getName(),
                    " AND t.create_user = :createUser ", params, sql, countSql);
        }

        JdbcQueryHelper.order("t.sort_order", "asc", sql);

        String pageSql = JdbcQueryHelper.getLimitSql(namedParameterJdbcTemplate, sql.toString(),
                queryDto.getPageNum(), queryDto.getPageSize());

        List<GitRepoDto> list = namedParameterJdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            GitRepo repo = new GitRepo();
            repo.setId(rs.getString("id"));
            repo.setName(rs.getString("name"));
            repo.setLocalPath(rs.getString("local_path"));
            repo.setRemoteUrl(rs.getString("remote_url"));
            repo.setDefaultBranch(rs.getString("default_branch"));
            repo.setDescription(rs.getString("description"));
            repo.setSortOrder(rs.getObject("sort_order") != null ? rs.getInt("sort_order") : null);
            repo.setCreateDate(
                    rs.getTimestamp("create_date") != null ? rs.getTimestamp("create_date").toLocalDateTime() : null);
            repo.setCreateUser(rs.getString("create_user"));
            repo.setUpdateDate(
                    rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime() : null);
            repo.setUpdateUser(rs.getString("update_user"));
            return convertToDto(repo, true);
        });

        return JdbcQueryHelper.toPage(namedParameterJdbcTemplate, countSql.toString(), params, list,
                queryDto.getPageNum(), queryDto.getPageSize());
    }

    @Override
    protected GitRepoDto newDto() {
        return new GitRepoDto();
    }

    @Override
    protected GitRepo newModel() {
        return new GitRepo();
    }
}
