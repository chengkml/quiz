package com.ck.quiz.group.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.group.dto.GroupDto;
import com.ck.quiz.group.dto.GroupQueryDto;
import com.ck.quiz.group.entity.Group;
import com.ck.quiz.group.repository.GroupRepository;
import com.ck.quiz.group.service.GroupService;
import com.ck.quiz.group.dto.GroupCreateDto;
import com.ck.quiz.group.dto.GroupUpdateDto;
import com.ck.quiz.utils.JdbcQueryHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.time.LocalDateTime;

@Service
public class GroupServiceImpl
        extends BaseServiceImpl<GroupCreateDto, GroupUpdateDto, GroupQueryDto, GroupDto, Group, GroupRepository>
        implements GroupService {

    @Autowired
    private GroupRepository groupRepository;

    @Override
    protected GroupDto newDto() {
        return new GroupDto();
    }

    @Override
    protected Group newModel() {
        return new Group();
    }

    @Override
    public Page<GroupDto> search(String userId, GroupQueryDto queryDto) {
        StringBuilder sql = new StringBuilder("SELECT g.* FROM obj_group g WHERE 1=1 ");
        StringBuilder countSql = new StringBuilder("SELECT COUNT(1) FROM obj_group g WHERE 1=1 ");
        Map<String, Object> params = new HashMap<>();

        JdbcQueryHelper.lowerLike("keyWord", queryDto.getKeyWord(),
                " AND (LOWER(g.name) LIKE :keyWord OR LOWER(g.label) LIKE :keyWord) ",
                params, namedParameterJdbcTemplate, sql, countSql);

        if (StringUtils.hasText(userId)) {
            JdbcQueryHelper.equals("createUser", userId,
                    " AND g.create_user = :createUser ", params, sql, countSql);
        }

        // 强制要求 queryDto.type 必须有值
        if (!StringUtils.hasText(queryDto.getType())) {
            throw new IllegalArgumentException("查询分组时必须指定 type 参数");
        }
        JdbcQueryHelper.equals("type", queryDto.getType(),
                " AND g.type = :type ", params, sql, countSql);

        JdbcQueryHelper.order("create_date", "desc", sql);

        String pageSql = JdbcQueryHelper.getLimitSql(namedParameterJdbcTemplate, sql.toString(),
                queryDto.getPageNum(), queryDto.getPageSize());

        List<GroupDto> list = namedParameterJdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            Group g = new Group();
            g.setId(rs.getString("id"));
            g.setName(rs.getString("name"));
            g.setLabel(rs.getString("label"));
            g.setDescr(rs.getString("descr"));
            g.setType(rs.getString("type"));
            LocalDateTime cd = rs.getTimestamp("create_date") != null ? rs.getTimestamp("create_date").toLocalDateTime()
                    : null;
            LocalDateTime ud = rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime()
                    : null;
            g.setCreateDate(cd);
            g.setUpdateDate(ud);
            g.setCreateUser(rs.getString("create_user"));
            g.setUpdateUser(rs.getString("update_user"));
            return convertToDto(g, true);
        });

        return JdbcQueryHelper.toPage(namedParameterJdbcTemplate, countSql.toString(), params, list,
                queryDto.getPageNum(), queryDto.getPageSize());
    }

    @Override
    public boolean checkNameUniq(String userId, String name, String excludeId) {
        if (!StringUtils.hasText(name)) {
            return true;
        }
        Group group = groupRepository.findByCreateUserAndName(userId, name);
        if (group == null) {
            return true;
        }
        if (excludeId != null && excludeId.equals(group.getId())) {
            return true;
        }
        return false;
    }
}