package com.ck.quiz.role.service;

import com.ck.quiz.role.dto.RoleCreateDto;
import com.ck.quiz.role.dto.RoleDto;
import com.ck.quiz.role.dto.RoleQueryDto;
import com.ck.quiz.role.dto.RoleUpdateDto;
import com.ck.quiz.role.entity.UserRole;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * 角色管理服务接口
 * <p>
 * 定义了角色相关的核心业务操作，包括增删改查、启用禁用、唯一性校验等。
 * 实现类通常会调用数据库访问层（Repository）来完成具体逻辑。
 */
public interface RoleService {

    /**
     * 创建角色
     *
     * @param roleCreateDto 角色创建信息（包含角色名、描述等）
     * @return 创建成功后的角色信息
     */
    RoleDto createRole(RoleCreateDto roleCreateDto);

    /**
     * 更新角色
     *
     * @param roleUpdateDto 角色更新信息（包含角色ID和待更新字段）
     * @return 更新后的角色信息
     */
    RoleDto updateRole(RoleUpdateDto roleUpdateDto);

    /**
     * 删除角色
     *
     * @param roleId 角色ID
     * @return 被删除的角色信息（可用于前端回显或确认）
     */
    RoleDto deleteRole(String roleId);

    /**
     * 根据ID获取角色信息
     *
     * @param roleId 角色ID
     * @return 对应的角色信息，如果不存在可返回 null 或抛异常
     */
    RoleDto getRoleById(String roleId);

    /**
     * 根据角色名称获取角色信息
     *
     * @param roleName 角色名称
     * @return 对应的角色信息
     */
    RoleDto getRoleByName(String roleName);

    /**
     * 分页查询角色列表
     *
     * @param queryDto 查询条件（支持角色名、状态、分页参数等）
     * @return 分页封装的角色列表
     */
    Page<RoleDto> searchRoles(RoleQueryDto queryDto);

    /**
     * 获取所有启用状态的角色列表
     *
     * @return 启用状态的角色集合
     */
    List<RoleDto> getActiveRoles();

    /**
     * 启用角色
     *
     * @param roleId 角色ID
     * @return 已启用的角色信息
     */
    RoleDto enableRole(String roleId);

    /**
     * 禁用角色
     *
     * @param roleId 角色ID
     * @return 已禁用的角色信息
     */
    RoleDto disableRole(String roleId);

    /**
     * 检查角色名称是否存在（用于新增或更新时保证唯一性）
     *
     * @param roleName      角色名称
     * @param excludeRoleId 排除的角色ID（在更新时使用，避免和自己重名）
     * @return true 表示存在，false 表示不存在
     */
    boolean isRoleNameExists(String roleName, String excludeRoleId);

    /**
     * 将实体类对象转换为传输对象
     *
     * @param role 角色实体对象
     * @return 角色DTO
     */
    RoleDto convertToDto(UserRole role);
}
