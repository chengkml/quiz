package com.ck.quiz.role_menu.entity;

import com.ck.quiz.menu.entity.Menu;
import com.ck.quiz.role.entity.UserRole;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 角色-菜单关联实体类
 * 对应表：modo_role_menu_rela
 * <p>
 * 用途：
 * - 建立角色和菜单的多对多关系
 * - 用于权限控制
 */
@Entity
@Table(
        name = "role_menu_rela",
        uniqueConstraints = @UniqueConstraint(columnNames = {"role_id", "menu_id"}),
        indexes = {
                @Index(name = "idx_role_menu_rela_role", columnList = "role_id"),
                @Index(name = "idx_role_menu_rela_menu", columnList = "menu_id")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleMenuRela {

    /**
     * 关联记录主键
     */
    @Id
    @Column(name = "rela_id", length = 32, nullable = false)
    private String relaId;

    /**
     * 角色ID
     */
    @Column(name = "role_id", length = 32, nullable = false)
    private String roleId;

    /**
     * 菜单ID
     */
    @Column(name = "menu_id", length = 32, nullable = false)
    private String menuId;

    /**
     * 角色对象（懒加载）
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", referencedColumnName = "role_id", insertable = false, updatable = false)
    private UserRole role;

    /**
     * 菜单对象（懒加载）
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_id", referencedColumnName = "menu_id", insertable = false, updatable = false)
    private Menu menu;

}
