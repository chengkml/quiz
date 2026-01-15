package com.ck.quiz.group.service.impl;

import com.ck.quiz.group.dto.GroupUpdateDto;
import com.ck.quiz.group.dto.GroupCreateDto;
import com.ck.quiz.group.dto.GroupDto;
import com.ck.quiz.group.dto.GroupQueryDto;
import com.ck.quiz.group.entity.Group;
import com.ck.quiz.group.repository.GroupRepository;
import com.ck.quiz.group.service.GroupService;
import com.ck.quiz.user.service.UserService;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class GroupServiceImpl implements GroupService {

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;

    @Override
    public List<GroupDto> list(String userId) {
        return convertToDtos(groupRepository.findByCreateUser(userId));
    }

    @Override
    public Page<GroupDto> search(String userId, GroupQueryDto queryDto) {
        StringBuilder sql = new StringBuilder(
                "select g.*, u.user_name create_user_name from group g left join users u on g.create_user = u.user_id where 1=1 ");
        StringBuilder countSql = new StringBuilder("select count(1) from group g where 1=1 ");
        Map<String, Object> params = new HashMap<>();

        // 按关键词模糊查询
        JdbcQueryHelper.lowerLike("keyWord", queryDto.getKeyWord(),
                " and (lower(g.name) like :keyWord or lower(g.label) like :keyWord) ", params, jdbcTemplate, sql, countSql);

        // 按创建用户过滤
        if (StringUtils.hasText(userId)) {
            JdbcQueryHelper.equals("createUser", userId,
                    " AND g.create_user = :createUser ", params, sql, countSql);
        }

        // 排序
        JdbcQueryHelper.order("g.create_date", "desc", sql);

        // 分页SQL
        String limitSql = JdbcQueryHelper.getLimitSql(
                jdbcTemplate,
                sql.toString(),
                queryDto.getPageNum(),
                queryDto.getPageSize());

        // 查询数据
        List<GroupDto> groups = jdbcTemplate.query(
                limitSql,
                params,
                (rs, rowNum) -> {
                    GroupDto g = new GroupDto();
                    g.setId(rs.getString("group_id"));
                    g.setName(rs.getString("name"));
                    g.setLabel(rs.getString("label"));
                    g.setCreateUser(rs.getString("create_user"));
                    g.setCreateUserName(rs.getString("create_user_name"));
                    g.setCreateDate(rs.getTimestamp("create_date") != null ? rs.getTimestamp("create_date").toLocalDateTime() : null);
                    g.setUpdateDate(
                            rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime()
                                    : null);
                    g.setUpdateUser(rs.getString("update_user"));
                    return g;
                });

        // 组装分页对象
        return JdbcQueryHelper.toPage(
                jdbcTemplate,
                countSql.toString(),
                params,
                groups,
                queryDto.getPageNum(),
                queryDto.getPageSize());
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

    @Override
    public GroupDto get(String userId, String id) {
        Group group = groupRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Group not found: " + id));
        if (!group.getCreateUser().equals(userId)) {
            throw new IllegalArgumentException("No access to group: " + id);
        }
        return convertToDto(group, true);
    }

    @Override
    public GroupDto create(GroupCreateDto createDto) {
        Group group = new Group();
        group.setId(IdHelper.genUuid());
        if (createDto.getName() != null)
            group.setName(createDto.getName());
        if (createDto.getLabel() != null)
            group.setLabel(createDto.getLabel());
        Group saved = groupRepository.save(group);
        return convertToDto(saved, true);
    }

    @Override
    public GroupDto update(String userId, GroupUpdateDto updateDto) {
        Group group = groupRepository.findById(updateDto.getId())
                .orElseThrow(() -> new IllegalArgumentException("Group not found: " + updateDto.getId()));
        if(!group.getCreateUser().equals(userId)) {
            throw new IllegalArgumentException("No access to group: " + updateDto.getId());
        }
        if (updateDto.getName() != null)
            group.setName(updateDto.getName());
        if (updateDto.getLabel() != null)
            group.setLabel(updateDto.getLabel());
        Group saved = groupRepository.save(group);
        return convertToDto(saved, true);
    }

    @Override
    public void delete(String userId, String id) {
        Group group = groupRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Group not found: " + id));
        if(!group.getCreateUser().equals(userId)) {
            throw new IllegalArgumentException("No access to group: " + id);
        }
        groupRepository.delete(group);
    }

    @Override
    public List<GroupDto> convertToDtos(List<Group> groups) {
        List<GroupDto> dtos = groups.stream().map(group -> convertToDto(group, false)).collect(Collectors.toList());
        Map<String, List<GroupDto>> createUserToGroups = dtos.stream()
                .collect(Collectors.groupingBy(GroupDto::getCreateUser));
        Map<String, List<GroupDto>> updateUserToGroups = dtos.stream()
                .collect(Collectors.groupingBy(GroupDto::getUpdateUser));
        userService.getUserMapByIds(new ArrayList<>(createUserToGroups.keySet())).forEach((userId, userDto) -> {
            List<GroupDto> userGroups = createUserToGroups.get(userId);
            userGroups.forEach(groupDto -> groupDto.setCreateUserName(userDto.getUserName()));
        });
        userService.getUserMapByIds(new ArrayList<>(updateUserToGroups.keySet())).forEach((userId, userDto) -> {
            List<GroupDto> userGroups = updateUserToGroups.get(userId);
            userGroups.forEach(groupDto -> groupDto.setUpdateUserName(userDto.getUserName()));
        });
        return dtos;
    }

    @Override
    public GroupDto convertToDto(Group group, Boolean loadProps) {
        GroupDto dto = new GroupDto();
        BeanUtils.copyProperties(group, dto);
        if (loadProps == null || !loadProps) {
            return dto;
        }
        String createUserId = group.getCreateUser();
        String updateUserId = group.getUpdateUser();
        userService.getUserMapByIds(
                List.of(createUserId, updateUserId)).forEach((userId, userDto) -> {
                    if (userId.equals(createUserId)) {
                        dto.setCreateUserName(userDto.getUserName());
                    }
                    if (userId.equals(updateUserId)) {
                        dto.setUpdateUserName(userDto.getUserName());
                    }
                });
        return dto;
    }

}