package com.ck.quiz.user_role.entity;

import com.ck.quiz.role.entity.UserRole;
import com.ck.quiz.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 用户角色关联实体类
 * <p>
 * 用于表示用户和角色之间的多对多关系。
 * 由于 JPA 不直接推荐使用 @ManyToMany（不易扩展），
 * 因此通过中间表 {@code user_role_rela} 来管理关联关系。
 */
@Entity
@Table(
        name = "user_role_rela",
        indexes = {
                // 保证 user_id 和 role_id 的唯一性，一个用户不能重复绑定同一个角色
                @Index(name = "uk_role_rela_user_role", columnList = "user_id, role_id", unique = true),
                // 提高基于角色 ID 的查询效率
                @Index(name = "idx_role_rela_role_id", columnList = "role_id"),
                // 提高基于用户 ID 的查询效率
                @Index(name = "idx_role_rela_user_id", columnList = "user_id")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserRoleRela {

    /**
     * 主键 ID（关系记录唯一标识）
     */
    @Id
    @Column(name = "rela_id", length = 32, nullable = false)
    private String relaId;

    /**
     * 用户对象（多对一关联）
     * 使用 {@code user_id} 作为外键映射到 {@link User} 实体
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "user_id")
    private User user;

    /**
     * 角色对象（多对一关联）
     * 使用 {@code role_id} 作为外键映射到 {@link UserRole} 实体
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", referencedColumnName = "role_id")
    private UserRole role;
}
