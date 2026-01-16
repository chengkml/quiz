package com.ck.quiz.user_role.entity;

import org.hibernate.annotations.Comment;

import com.ck.quiz.role.entity.UserRole;
import com.ck.quiz.user.entity.User;
import jakarta.persistence.*;
import lombok.Data;

@Comment("用户角色关联表")
@Entity
@Table(name = "user_role_rela", indexes = {
                @Index(name = "uk_role_rela_user_role", columnList = "user_id, role_id", unique = true),
                @Index(name = "idx_role_rela_role_id", columnList = "role_id"),
                @Index(name = "idx_role_rela_user_id", columnList = "user_id")
})
@Data
public class UserRoleRela {

        @Id
        @Comment("主键ID")
        @Column(name = "rela_id", length = 32, nullable = false)
        private String relaId;

        @Comment("用户ID")
        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "user_id", referencedColumnName = "user_id")
        private User user;

        @Comment("角色ID")
        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "role_id", referencedColumnName = "id")
        private UserRole role;
}
