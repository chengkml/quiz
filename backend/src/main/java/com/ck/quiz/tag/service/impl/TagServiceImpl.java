package com.ck.quiz.tag.service.impl;

import com.ck.quiz.tag.dto.TagUpdateDto;
import com.ck.quiz.tag.dto.TagCreateDto;
import com.ck.quiz.tag.dto.TagDto;
import com.ck.quiz.tag.dto.TagQueryDto;
import com.ck.quiz.tag.entity.Tag;
import com.ck.quiz.tag.repository.TagRepository;
import com.ck.quiz.tag.service.TagService;
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
public class TagServiceImpl implements TagService {

    @Autowired
    private TagRepository tagRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;

    @Override
    public List<TagDto> list(String userId) {
        if (!StringUtils.hasText(userId)) {
            throw new IllegalArgumentException("User ID cannot be empty");
        }
        List<Tag> tags = tagRepository.findByCreateUser(userId);
        return convertToDtos(tags);
    }

    @Override
    public Page<TagDto> search(String userId, TagQueryDto queryDto) {
        StringBuilder sql = new StringBuilder(
                "select t.*, u.user_name create_user_name from tag t left join user u on t.create_user = u.user_id where 1=1 ");
        StringBuilder countSql = new StringBuilder("select count(1) from tag t where 1=1 ");
        Map<String, Object> params = new HashMap<>();

        // 按关键词模糊查询
        JdbcQueryHelper.lowerLike("keyWord", queryDto.getKeyWord(),
                " and (lower(t.name) like :keyWord or lower(t.label) like :keyWord) ", params, jdbcTemplate, sql, countSql);

        // 按创建用户过滤
        if (StringUtils.hasText(userId)) {
            JdbcQueryHelper.equals("createUser", userId,
                    " AND t.create_user = :createUser ", params, sql, countSql);
        }

        // 排序
        JdbcQueryHelper.order("t.create_date", "desc", sql);

        // 分页SQL
        String limitSql = JdbcQueryHelper.getLimitSql(
                jdbcTemplate,
                sql.toString(),
                queryDto.getPageNum(),
                queryDto.getPageSize());

        // 查询数据
        List<TagDto> tags = jdbcTemplate.query(
                limitSql,
                params,
                (rs, rowNum) -> {
                    TagDto t = new TagDto();
                    t.setId(rs.getString("tag_id"));
                    t.setName(rs.getString("name"));
                    t.setLabel(rs.getString("label"));
                    t.setDescr(rs.getString("descr"));
                    t.setColor(rs.getString("color"));
                    t.setCreateUser(rs.getString("create_user"));
                    t.setCreateUserName(rs.getString("create_user_name"));
                    t.setCreateDate(rs.getTimestamp("create_date") != null ? rs.getTimestamp("create_date").toLocalDateTime() : null);
                    t.setUpdateDate(
                            rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime()
                                    : null);
                    t.setUpdateUser(rs.getString("update_user"));
                    return t;
                });

        // 组装分页对象
        return JdbcQueryHelper.toPage(
                jdbcTemplate,
                countSql.toString(),
                params,
                tags,
                queryDto.getPageNum(),
                queryDto.getPageSize());
    }

    @Override
    public boolean checkNameUniq(String userId, String tagName, String excludeTagId) {
        if (!StringUtils.hasText(tagName)) {
            return true;
        }
        Tag tag = tagRepository.findByCreateUserAndName(userId, tagName);
        if (tag == null) {
            return true;
        }
        if (excludeTagId != null && excludeTagId.equals(tag.getId())) {
            return true;
        }
        return false;
    }

    @Override
    public TagDto get(String userId, String tagId) {
        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new IllegalArgumentException("Tag not found: " + tagId));
        if (!tag.getCreateUser().equals(userId)) {
            throw new IllegalArgumentException("No access to tag: " + tagId);
        }
        return convertToDto(tag, true);
    }

    @Override
    public TagDto create(TagCreateDto tagCreateDto) {
        Tag tag = new Tag();
        tag.setId(IdHelper.genUuid());
        if (tagCreateDto.getName() != null)
            tag.setName(tagCreateDto.getName());
        if (tagCreateDto.getLabel() != null)
            tag.setLabel(tagCreateDto.getLabel());
        if (tagCreateDto.getDescr() != null)
            tag.setDescr(tagCreateDto.getDescr());
        if (tagCreateDto.getColor() != null)
            tag.setColor(tagCreateDto.getColor());
        Tag saved = tagRepository.save(tag);
        return convertToDto(saved, true);
    }

    @Override
    public TagDto update(String userId, TagUpdateDto tagUpdateDto) {
        Tag tag = tagRepository.findById(tagUpdateDto.getId())
                .orElseThrow(() -> new IllegalArgumentException("Tag not found: " + tagUpdateDto.getId()));
        if (!tag.getCreateUser().equals(userId)) {
            throw new IllegalArgumentException("No access to tag: " + tagUpdateDto.getId());
        }
        if (tagUpdateDto.getName() != null)
            tag.setName(tagUpdateDto.getName());
        if (tagUpdateDto.getLabel() != null)
            tag.setLabel(tagUpdateDto.getLabel());
        if (tagUpdateDto.getDescr() != null)
            tag.setDescr(tagUpdateDto.getDescr());
        if (tagUpdateDto.getColor() != null)
            tag.setColor(tagUpdateDto.getColor());
        Tag saved = tagRepository.save(tag);
        return convertToDto(saved, true);
    }

    @Override
    public void delete(String userId, String tagId) {
        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new IllegalArgumentException("Tag not found: " + tagId));
        if (!tag.getCreateUser().equals(userId)) {
            throw new IllegalArgumentException("No access to tag: " + tagId);
        }
        tagRepository.delete(tag);
    }

    @Override
    public List<TagDto> convertToDtos(List<Tag> tags) {
        List<TagDto> dtos = tags.stream().map(tag -> convertToDto(tag, false)).collect(Collectors.toList());
        Map<String, List<TagDto>> createUserToTags = dtos.stream()
                .collect(Collectors.groupingBy(TagDto::getCreateUser));
        Map<String, List<TagDto>> updateUserToTags = dtos.stream()
                .collect(Collectors.groupingBy(TagDto::getUpdateUser));
        userService.getUserMapByIds(new ArrayList<>(createUserToTags.keySet())).forEach((userId, userDto) -> {
            List<TagDto> userTags = createUserToTags.get(userId);
            userTags.forEach(tagDto -> tagDto.setCreateUserName(userDto.getUserName()));
        });
        userService.getUserMapByIds(new ArrayList<>(updateUserToTags.keySet())).forEach((userId, userDto) -> {
            List<TagDto> userTags = updateUserToTags.get(userId);
            userTags.forEach(tagDto -> tagDto.setUpdateUserName(userDto.getUserName()));
        });
        return dtos;
    }

    @Override
    public TagDto convertToDto(Tag tag, Boolean loadProps) {
        TagDto dto = new TagDto();
        BeanUtils.copyProperties(tag, dto);
        if (loadProps == null || !loadProps) {
            return dto;
        }
        String createUserId = tag.getCreateUser();
        String updateUserId = tag.getUpdateUser();
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
