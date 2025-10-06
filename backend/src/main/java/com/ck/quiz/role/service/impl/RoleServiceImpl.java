package com.ck.quiz.role.service.impl;

import com.ck.quiz.role.dto.RoleCreateDto;
import com.ck.quiz.role.dto.RoleDto;
import com.ck.quiz.role.dto.RoleQueryDto;
import com.ck.quiz.role.dto.RoleUpdateDto;
import com.ck.quiz.role.entity.UserRole;
import com.ck.quiz.role.exception.RoleException;
import com.ck.quiz.role.repository.UserRoleRepository;
import com.ck.quiz.role.service.RoleService;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class RoleServiceImpl implements RoleService {

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public RoleDto createRole(RoleCreateDto roleCreateDto) {
        if (userRoleRepository.findByName(roleCreateDto.getName()).isPresent()) {
            throw new RoleException("ROLE_NAME_EXISTS", "角色名称已存在: " + roleCreateDto.getName());
        }

        UserRole role = new UserRole();
        BeanUtils.copyProperties(roleCreateDto, role);

        UserRole savedRole = userRoleRepository.save(role);
        return convertToDto(savedRole);
    }

    @Override
    @Transactional
    public RoleDto updateRole(RoleUpdateDto roleUpdateDto) {
        UserRole role = userRoleRepository.findById(roleUpdateDto.getId())
                .orElseThrow(() -> new RoleException("ROLE_NOT_FOUND", "角色不存在: " + roleUpdateDto.getId()));

        if (userRoleRepository.existsByNameAndIdNot(roleUpdateDto.getName(), roleUpdateDto.getId())) {
            throw new RoleException("ROLE_NAME_EXISTS", "角色名称已存在: " + roleUpdateDto.getName());
        }

        role.setName(roleUpdateDto.getName());
        role.setDescr(roleUpdateDto.getDescr());

        UserRole updatedRole = userRoleRepository.save(role);
        return convertToDto(updatedRole);
    }

    @Override
    @Transactional
    public RoleDto deleteRole(String roleId) {
        UserRole role = userRoleRepository.findById(roleId)
                .orElseThrow(() -> new RoleException("ROLE_NOT_FOUND", "角色不存在: " + roleId));

        userRoleRepository.deleteById(roleId);
        return convertToDto(role);
    }

    @Override
    @Transactional(readOnly = true)
    public RoleDto getRoleById(String roleId) {
        UserRole role = userRoleRepository.findById(roleId)
                .orElseThrow(() -> new RoleException("ROLE_NOT_FOUND", "角色不存在: " + roleId));
        return convertToDto(role);
    }

    @Override
    @Transactional(readOnly = true)
    public RoleDto getRoleByName(String roleName) {
        UserRole role = userRoleRepository.findByName(roleName)
                .orElseThrow(() -> new RoleException("ROLE_NOT_FOUND", "角色不存在: " + roleName));
        return convertToDto(role);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RoleDto> searchRoles(RoleQueryDto queryDto) {
        StringBuilder sql = new StringBuilder(
                "SELECT r.role_id AS id, r.role_name AS name, r.role_descr AS descr, r.state, " +
                        "r.create_date, r.create_user, cu.user_name AS create_user_name, " +
                        "r.update_date, r.update_user, uu.user_name AS update_user_name " +
                        "FROM user_role r " +
                        "LEFT JOIN user cu ON r.create_user = cu.user_id " +
                        "LEFT JOIN user uu ON r.update_user = uu.user_id " +
                        "WHERE 1=1 "
        );

        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM user_role r WHERE 1=1 "
        );

        Map<String, Object> params = new HashMap<>();

        JdbcQueryHelper.lowerLike("keyWord", queryDto.getName(), " AND (LOWER(r.role_id) LIKE :keyWord or LOWER(r.role_name) LIKE :keyWord) ", params, jdbcTemplate, sql, countSql);
        JdbcQueryHelper.equals("state", queryDto.getState() == null ? null : queryDto.getState().name(), " AND r.state = :state ", params, sql, countSql);

        JdbcQueryHelper.order(queryDto.getSortColumn(), queryDto.getSortType(), sql);
        String pageSql = JdbcQueryHelper.getLimitSql(jdbcTemplate, sql.toString(), queryDto.getPageNum(), queryDto.getPageSize());

        List<RoleDto> list = jdbcTemplate.query(pageSql, params, (rs, rowNum) ->
                new RoleDto(
                        rs.getString("id"),
                        rs.getString("name"),
                        rs.getString("descr"),
                        UserRole.RoleState.valueOf(rs.getString("state")),
                        rs.getTimestamp("create_date").toLocalDateTime(),
                        rs.getString("create_user"),
                        rs.getString("create_user_name"),
                        rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime() : null,
                        rs.getString("update_user"),
                        rs.getString("update_user_name")
                )
        );

        return JdbcQueryHelper.toPage(jdbcTemplate, countSql.toString(), params, list, queryDto.getPageNum(), queryDto.getPageSize());
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoleDto> getActiveRoles() {
        List<UserRole> roles = userRoleRepository.findByState(UserRole.RoleState.ENABLED);
        return roles.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public RoleDto enableRole(String roleId) {
        UserRole role = userRoleRepository.findById(roleId)
                .orElseThrow(() -> new RoleException("ROLE_NOT_FOUND", "角色不存在: " + roleId));

        role.setState(UserRole.RoleState.ENABLED);
        userRoleRepository.save(role);
        return convertToDto(role);
    }

    @Override
    @Transactional
    public RoleDto disableRole(String roleId) {
        UserRole role = userRoleRepository.findById(roleId)
                .orElseThrow(() -> new RoleException("ROLE_NOT_FOUND", "角色不存在: " + roleId));

        role.setState(UserRole.RoleState.DISABLED);
        userRoleRepository.save(role);
        return convertToDto(role);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isRoleNameExists(String roleName, String excludeRoleId) {
        if (StringUtils.hasText(excludeRoleId)) {
            return userRoleRepository.existsByNameAndIdNot(roleName, excludeRoleId);
        } else {
            return userRoleRepository.findByName(roleName).isPresent();
        }
    }

    @Override
    public RoleDto convertToDto(UserRole role) {
        RoleDto dto = new RoleDto();
        BeanUtils.copyProperties(role, dto);
        return dto;
    }
}
