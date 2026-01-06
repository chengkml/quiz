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
import java.util.stream.Collectors;

@Service
@Transactional
public class RoleServiceImpl extends BaseServiceImpl<RoleCreateDto, RoleUpdateDto, RoleQueryDto, RoleDto, UserRole, UserRoleRepository> implements RoleService {

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
        JdbcQueryHelper.order("create_date", "desc", sql);

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
                    RoleDto r = new RoleDto();
                    r.setId(rs.getString("id"));
                    r.setName(rs.getString("name"));
                    r.setDescr(rs.getString("descr"));
                    r.setState(UserRole.RoleState.valueOf(rs.getString("state")));
                    r.setCreateUser(rs.getString("create_user"));
                    r.setCreateDate(rs.getTimestamp("create_date").toLocalDateTime());
                    r.setUpdateDate(
                            rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime()
                                    : null);
                    return r;
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

}
