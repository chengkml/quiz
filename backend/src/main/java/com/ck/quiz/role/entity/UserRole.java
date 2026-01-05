package com.ck.quiz.role.entity;

import com.ck.quiz.base.entity.Model;
import com.ck.quiz.user_role.entity.UserRoleRela;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Comment("角色表")
@EqualsAndHashCode(callSuper = true)
@Table(name = "user_role", indexes = {
        @Index(name = "idx_role_name", columnList = "name"),
        @Index(name = "idx_role_state", columnList = "state"),
        @Index(name = "idx_role_create_date", columnList = "create_date")
})
public class UserRole extends Model {

    @Column(length = 64, nullable = false)
    @Comment("角色名称")
    private String name;

    @Column(length = 128)
    @Comment("角色描述")
    private String descr;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Comment("角色状态")
    private RoleState state = RoleState.ENABLED;

    @OneToMany(mappedBy = "role", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserRoleRela> userRoleRelas = new ArrayList<>();

    public enum RoleState {
        ENABLED,
        DISABLED
    }
}
