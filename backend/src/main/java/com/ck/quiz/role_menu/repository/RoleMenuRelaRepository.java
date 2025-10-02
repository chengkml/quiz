package com.ck.quiz.role_menu.repository;

import com.ck.quiz.role_menu.entity.RoleMenuRela;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.stream.Stream;

/**
 * 角色菜单关联数据访问接口
 */
@Repository
public interface RoleMenuRelaRepository extends JpaRepository<RoleMenuRela, String> {

    /**
     * 根据角色ID查询关联记录
     */
    List<RoleMenuRela> findByRoleId(String roleId);

    /**
     * 根据角色ID删除所有关联记录
     */
    @Modifying
    int deleteByRoleId(String roleId);

    /**
     * 根据菜单ID删除所有关联记录
     */
    @Modifying
    int deleteByMenuId(String menuId);

    /**
     * 统计某角色绑定的菜单数量
     */
    long countByRoleId(String roleId);

    List<RoleMenuRela> findByRoleIdIn(List<String> roleIds);
}
