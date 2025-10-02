package com.ck.quiz.role.repository;

import com.ck.quiz.role.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 角色数据访问接口
 */
@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, String> {

    /**
     * 根据角色名称查找角色
     *
     * @param roleName 角色名称
     * @return 角色信息
     */
    Optional<UserRole> findByName(String roleName);

    /**
     * 根据状态查找角色列表
     *
     * @param state 状态
     * @return 角色列表
     */
    List<UserRole> findByState(UserRole.RoleState state);

    /**
     * 检查角色名称是否存在（排除指定ID）
     *
     * @param roleName 角色名称
     * @param roleId   要排除的角色ID
     * @return 是否存在
     */
    boolean existsByNameAndIdNot(String roleName, String roleId);

}