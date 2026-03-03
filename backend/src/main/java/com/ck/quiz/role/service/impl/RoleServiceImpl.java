package com.ck.quiz.role.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.role.dto.RoleCreateDto;
import com.ck.quiz.role.dto.RoleDto;
import com.ck.quiz.role.dto.RoleQueryDto;
import com.ck.quiz.role.dto.RoleUpdateDto;
import com.ck.quiz.role.entity.UserRole;
import com.ck.quiz.role.repository.UserRoleRepository;
import com.ck.quiz.role.service.RoleService;
import com.ck.quiz.utils.JdbcQueryHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class RoleServiceImpl
        extends BaseServiceImpl<RoleCreateDto, RoleUpdateDto, RoleQueryDto, RoleDto, UserRole, UserRoleRepository>
        implements RoleService {

    @Autowired
    private UserRoleRepository roleRepository;

    @Override
    public Page<RoleDto> search(String userId, RoleQueryDto queryDto) {
        StringBuilder sql = new StringBuilder(
                "select r.* from user_role r where 1=1 ");
        StringBuilder countSql = new StringBuilder("select count(1) from user_role r where 1=1 ");
        Map<String, Object> params = new HashMap<>();

        // 按名称模糊查询
        JdbcQueryHelper.lowerLike("keyWord", queryDto.getKeyWord(),
                " and lower(r.name) like :keyWord ", params, namedParameterJdbcTemplate, sql, countSql);

        // 排序
        JdbcQueryHelper.order("r.create_date", "desc", sql);

        // 分页SQL
        String limitSql = JdbcQueryHelper.getLimitSql(
                namedParameterJdbcTemplate,
                sql.toString(),
                queryDto.getPageNum(),
                queryDto.getPageSize());

        // 查询数据
        List<RoleDto> roles = namedParameterJdbcTemplate.query(
                limitSql,
                params,
                (rs, rowNum) -> {
                    UserRole role = new UserRole();
                    role.setId(rs.getString("id"));
                    role.setName(rs.getString("name"));
                    role.setDescr(rs.getString("descr"));
                    role.setState(UserRole.RoleState.valueOf(rs.getString("state")));
                    role.setCreateUser(rs.getString("create_user"));
                    role.setUpdateUser(rs.getString("update_user"));

                    java.sql.Timestamp createTimestamp = rs.getTimestamp("create_date");
                    if (createTimestamp != null) {
                        role.setCreateDate(createTimestamp.toLocalDateTime());
                    }

                    java.sql.Timestamp updateTimestamp = rs.getTimestamp("update_date");
                    if (updateTimestamp != null) {
                        role.setUpdateDate(updateTimestamp.toLocalDateTime());
                    }

                    RoleDto dto = convertToDto(role, true);
                    return dto;
                });

        // 组装分页对象
        return JdbcQueryHelper.toPage(
                namedParameterJdbcTemplate,
                countSql.toString(),
                params,
                roles,
                queryDto.getPageNum(),
                queryDto.getPageSize());
    }

    @Override
    public boolean checkNameUniq(String userId, String name, String excludeId) {
        if (!StringUtils.hasText(name)) {
            return true;
        }
        UserRole role = roleRepository.findByName(name);
        if (role == null) {
            return true;
        }
        if (excludeId != null && excludeId.equals(role.getId())) {
            return true;
        }
        return false;
    }

    @Override
    protected RoleDto newDto() {
        return new RoleDto();
    }

    @Override
    protected UserRole newModel() {
        return new UserRole();
    }

    @Override
    public boolean checkIdUniq(String userId, String id) {
        if (!StringUtils.hasText(id)) {
            return true;
        }
        return !roleRepository.existsById(id);
    }

    @Override
    public RoleDto enableRole(String id) {
        Optional<UserRole> roleOpt = roleRepository.findById(id);
        if (!roleOpt.isPresent()) {
            throw new IllegalArgumentException("Role not found: " + id);
        }
        UserRole role = roleOpt.get();
        role.setState(UserRole.RoleState.ENABLED);
        UserRole saved = roleRepository.save(role);
        return convertToDto(saved, true);
    }

    @Override
    public RoleDto disableRole(String id) {
        Optional<UserRole> roleOpt = roleRepository.findById(id);
        if (!roleOpt.isPresent()) {
            throw new IllegalArgumentException("Role not found: " + id);
        }
        UserRole role = roleOpt.get();
        role.setState(UserRole.RoleState.DISABLED);
        UserRole saved = roleRepository.save(role);
        return convertToDto(saved, true);
    }

    @Override
    public List<RoleDto> listActiveRoles() {
        List<UserRole> roles = roleRepository.findByState(UserRole.RoleState.ENABLED);
        return roles.stream()
                .map(role -> convertToDto(role, true))
                .collect(java.util.stream.Collectors.toList());
    }

}
