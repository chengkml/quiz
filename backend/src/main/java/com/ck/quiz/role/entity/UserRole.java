package com.ck.quiz.role.entity;

import com.ck.quiz.user_role.entity.UserRoleRela;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 角色信息实体类
 */
@Entity
@Table(
        name = "user_role",
        indexes = {
                @Index(name = "idx_role_role_name", columnList = "role_name"),
                @Index(name = "idx_role_state", columnList = "state"),
                @Index(name = "idx_role_create_date", columnList = "create_date")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserRole {

    @Id
    @Column(name = "role_id", length = 32, nullable = false)
    private String id;

    @Column(name = "role_name", length = 64, nullable = false)
    private String name;

    @Column(name = "role_descr", length = 128)
    private String descr;

    @Enumerated(EnumType.STRING)
    @Column(name = "state", length = 10, nullable = false)
    private RoleState state;

    @Column(name = "create_date", updatable = false)
    private LocalDateTime createDate;

    @Column(name = "create_user", length = 64, updatable = false)
    private String createUser;

    @Column(name = "update_date")
    private LocalDateTime updateDate;

    @Column(name = "update_user", length = 64)
    private String updateUser;

    @OneToMany(mappedBy = "role", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserRoleRela> userRoleRelas = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        this.createDate = LocalDateTime.now();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            this.createUser = authentication.getName();
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updateDate = LocalDateTime.now();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            this.updateUser = authentication.getName();
        }
    }

    public enum RoleState {
        ENABLED,
        DISABLED
    }
}
