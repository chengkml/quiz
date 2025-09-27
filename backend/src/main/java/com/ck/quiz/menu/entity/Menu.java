package com.ck.quiz.menu.entity;

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
 * 菜单信息实体类
 * 对应数据库表 modo_menu
 * <p>
 * 功能说明：
 * - 支持层级结构（通过 parentId 建立父子关系）
 * - 记录菜单的基本信息（名称、类型、图标、URL 等）
 * - 记录创建人 / 更新人和时间（通过 Spring Security 获取当前登录用户）
 */
@Entity
@Table(name = "menu", indexes = {
        @Index(name = "idx_menu_name", columnList = "menu_name"),
        @Index(name = "idx_menu_parent_id", columnList = "parent_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Menu {

    /**
     * 菜单唯一标识
     */
    @Id
    @Column(name = "menu_id", length = 32, nullable = false)
    private String menuId;

    /**
     * 菜单名称（唯一业务标识）
     */
    @Column(name = "menu_name", length = 128, nullable = false)
    private String menuName;

    /**
     * 菜单显示名称（前端展示用）
     */
    @Column(name = "menu_label", length = 128)
    private String menuLabel;

    /**
     * 菜单类型（目录 / 菜单 / 按钮）
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "menu_type", length = 32, nullable = false)
    private MenuType menuType;

    /**
     * 父级菜单 ID（根节点为 null 或 "0"）
     */
    @Column(name = "parent_id", length = 32)
    private String parentId;

    /**
     * 菜单路由地址或按钮权限标识
     */
    @Column(name = "url", length = 256)
    private String url;

    /**
     * 菜单图标（前端展示）
     */
    @Column(name = "menu_icon", length = 128)
    private String menuIcon;

    /**
     * 排序号（数值越小越靠前）
     */
    @Column(name = "seq")
    private Integer seq;

    /**
     * 菜单状态：ENABLED / DISABLED
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "state", length = 16, nullable = false)
    private MenuState state;

    /**
     * 菜单描述
     */
    @Column(name = "menu_descr", length = 512)
    private String menuDescr;

    /**
     * 创建时间
     */
    @Column(name = "create_date", updatable = false)
    private LocalDateTime createDate;

    /**
     * 创建人（通过 Spring Security 获取当前登录用户）
     */
    @Column(name = "create_user", length = 64, updatable = false)
    private String createUser;

    /**
     * 最后更新时间
     */
    @Column(name = "update_date")
    private LocalDateTime updateDate;

    /**
     * 最后更新人（通过 Spring Security 获取当前登录用户）
     */
    @Column(name = "update_user", length = 64)
    private String updateUser;

    /**
     * 父菜单实体（懒加载）
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id", referencedColumnName = "menu_id", insertable = false, updatable = false)
    private Menu parent;

    /**
     * 子菜单列表（级联删除）
     */
    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Menu> children = new ArrayList<>();

    /**
     * 菜单状态枚举
     */
    public enum MenuState {
        ENABLED,   // 启用
        DISABLED   // 停用
    }

    /**
     * 菜单类型枚举
     */
    public enum MenuType {
        MENU,       // 普通菜单
        DIRECTORY,  // 目录（可作为父节点）
        BUTTON      // 按钮（操作权限）
    }

    /**
     * 新增时自动填充：
     * - createDate
     * - createUser
     */
    @PrePersist
    public void prePersist() {
        this.createDate = LocalDateTime.now();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            this.createUser = authentication.getName();
        }
    }

    /**
     * 更新时自动填充：
     * - updateDate
     * - updateUser
     */
    @PreUpdate
    public void preUpdate() {
        this.updateDate = LocalDateTime.now();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            this.updateUser = authentication.getName();
        }
    }
}
