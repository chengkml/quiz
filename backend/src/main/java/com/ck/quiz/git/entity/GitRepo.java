package com.ck.quiz.git.entity;

import com.ck.quiz.base.entity.Model;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

@Data
@Entity
@Comment("Git仓库注册表")
@EqualsAndHashCode(callSuper = true)
@Table(name = "quiz_git_repository", indexes = {
        @Index(name = "idx_git_repo_name", columnList = "name"),
        @Index(name = "idx_git_repo_create_user", columnList = "create_user")
})
public class GitRepo extends Model {

    @Column(length = 100, nullable = false)
    @Comment("仓库显示名称")
    private String name;

    @Column(length = 500, nullable = false)
    @Comment("本地绝对路径")
    private String localPath;

    @Column(length = 500)
    @Comment("远程仓库URL")
    private String remoteUrl;

    @Column(length = 100)
    @Comment("默认分支")
    private String defaultBranch;

    @Column(length = 500)
    @Comment("仓库描述")
    private String description;

    @Column
    @Comment("排序顺序")
    private Integer sortOrder;
}
