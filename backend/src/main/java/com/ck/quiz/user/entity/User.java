package com.ck.quiz.user.entity;

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
 * 用户信息实体表
 */
@Entity
@Table(name = "user", indexes = {
        @Index(name = "idx_user_user_id", columnList = "user_id"),
        @Index(name = "idx_user_email", columnList = "email"),
        @Index(name = "idx_user_phone", columnList = "phone")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @Column(name = "user_id", length = 32, nullable = false)
    private String userId;

    @Column(name = "user_name", length = 128, nullable = false)
    private String userName;

    @Column(name = "password", length = 256, nullable = false)
    private String password;

    @Column(name = "email", length = 128)
    private String email;

    @Column(name = "phone", length = 20)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(name = "state", length = 10)
    private UserState state;

    @Column(name = "logo", length = 256)
    private String logo;

    @Column(name = "create_date", updatable = false)
    private LocalDateTime createDate;

    @Column(name = "create_user", length = 64, updatable = false)
    private String createUser;

    @Column(name = "update_date")
    private LocalDateTime updateDate;

    @Column(name = "update_user", length = 64)
    private String updateUser;

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

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserRoleRela> userRoleRelas = new ArrayList<>();

    public enum UserState {
        ENABLED,
        DISABLED
    }
}
