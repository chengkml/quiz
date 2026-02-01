package com.ck.quiz.base.service.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.apache.commons.lang.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import com.ck.quiz.base.dto.CreateDto;
import com.ck.quiz.base.dto.Dto;
import com.ck.quiz.base.dto.QueryDto;
import com.ck.quiz.base.dto.UpdateDto;
import com.ck.quiz.base.entity.Model;
import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.group.entity.Group;
import com.ck.quiz.group.repository.GroupRepository;
import com.ck.quiz.group_obj.entity.GroupObjRela;
import com.ck.quiz.group_obj.repository.GroupObjRelaRepository;
import com.ck.quiz.tag.entity.Tag;
import com.ck.quiz.tag.repository.TagRepository;
import com.ck.quiz.tag_obj.entity.TagObjRela;
import com.ck.quiz.tag_obj.repository.TagObjRelaRepository;
import com.ck.quiz.user.service.UserService;
import com.ck.quiz.utils.IdHelper;

public abstract class BaseServiceImpl<C extends CreateDto, U extends UpdateDto, Q extends QueryDto, D extends Dto, M extends Model, R extends BaseRepository<M>>
        implements BaseService<C, U, Q, D, M> {

    @Autowired
    protected R repository;

    @Autowired
    protected UserService userService;

    @Autowired
    protected NamedParameterJdbcTemplate namedParameterJdbcTemplate;

    @Autowired
    protected GroupRepository groupRepository;

    @Autowired
    protected GroupObjRelaRepository groupObjRelaRepository;

    @Autowired
    protected TagRepository tagRepository;

    @Autowired
    protected TagObjRelaRepository tagObjRelaRepository;

    protected abstract D newDto();

    protected abstract M newModel();

    protected String getTagType() {
        return null;
    }

    protected void saveTags(String objId, List<String> tagNames, String createUser) {
        if (tagNames == null || tagNames.isEmpty()) {
            return;
        }
        String type = getTagType();
        for (String tagName : tagNames) {
            Tag tag;
            if (StringUtils.isNotBlank(type)) {
                tag = tagRepository.findByCreateUserAndNameAndType(createUser, tagName, type);
            } else {
                // 如果没有指定类型，尝试直接查找（兼容旧数据或无类型标签）
                // 优先尝试找无类型的
                tag = tagRepository.findByCreateUserAndNameAndType(createUser, tagName, null);
                if (tag == null) {
                    // Fallback: use the old method which might return something if unique
                    // constraint wasn't strict before,
                    // but now with (name, type, user), checking raw name might fail if multiple
                    // exist.
                    // So let's stick to strict type check logic.
                    // If getTagType() is null, we look for type IS NULL.
                }
            }

            if (tag != null) {
                TagObjRela rela = new TagObjRela();
                rela.setRelaId(IdHelper.genUuid());
                rela.setTagId(tag.getId());
                rela.setObjId(objId);
                tagObjRelaRepository.save(rela);
            } else {
                throw new IllegalArgumentException("Tag not found: " + tagName);
            }
        }
    }

    @Override
    @Transactional
    public D create(C createDto) {
        M model = newModel();
        model.setId(IdHelper.genUuid());
        BeanUtils.copyProperties(createDto, model);
        M savedModel = repository.save(model);
        if (StringUtils.isNotBlank(createDto.getGroup())) {
            String createUser = savedModel.getCreateUser();
            List<Group> groups = groupRepository.findByCreateUserAndName(createUser, createDto.getGroup());
            if (!groups.isEmpty()) {
                Group group = groups.get(0);
                GroupObjRela rela = new GroupObjRela();
                rela.setRelaId(IdHelper.genUuid());
                rela.setGroupId(group.getId());
                rela.setObjId(savedModel.getId());
                groupObjRelaRepository.save(rela);
            } else {
                throw new IllegalArgumentException("Group not found: " + createDto.getGroup());
            }
        }
        if (createDto.getTags() != null && !createDto.getTags().isEmpty()) {
            saveTags(savedModel.getId(), createDto.getTags(), savedModel.getCreateUser());
        }
        return convertToDto(savedModel, true);
    }

    @Override
    @Transactional
    public D update(String userId, U updateDto) {
        M model = repository.findById(updateDto.getId())
                .orElseThrow(() -> new IllegalArgumentException("Subject not found: " + updateDto.getId()));
        if (model.getCreateUser() != null && !model.getCreateUser().equals(userId)) {
            throw new IllegalArgumentException("No permission to update subject: " + updateDto.getId());
        }
        BeanUtils.copyProperties(updateDto, model);
        M updatedModel = repository.save(model);

        // 处理分组关联逻辑
        if (updateDto.getGroup() != null) {
            // 删除现有的分组关联
            groupObjRelaRepository.deleteByObjId(updatedModel.getId());

            if (StringUtils.isNotBlank(updateDto.getGroup())) {
                // 添加新的分组关联
                String createUser = updatedModel.getCreateUser();
                List<Group> groups = groupRepository.findByCreateUserAndName(createUser, updateDto.getGroup());
                if (!groups.isEmpty()) {
                    Group group = groups.get(0);
                    GroupObjRela rela = new GroupObjRela();
                    rela.setRelaId(IdHelper.genUuid());
                    rela.setGroupId(group.getId());
                    rela.setObjId(updatedModel.getId());
                    groupObjRelaRepository.save(rela);
                } else {
                    throw new IllegalArgumentException("Group not found: " + updateDto.getGroup());
                }
            }
        }

        // 处理标签关联逻辑
        if (updateDto.getTags() != null) {
            // 删除现有的标签关联
            tagObjRelaRepository.deleteByObjId(updatedModel.getId());
            saveTags(updatedModel.getId(), updateDto.getTags(), updatedModel.getCreateUser());
        }

        return convertToDto(updatedModel, true);
    }

    @Override
    @Transactional
    public void delete(String userId, String id) {
        M model = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Object not found: " + id));
        if (model.getCreateUser() != null && !model.getCreateUser().equals(userId)) {
            throw new IllegalArgumentException("No permission to delete object: " + id);
        }
        // 删除对象的所有分组关联
        groupObjRelaRepository.deleteByObjId(id);
        // 删除对象的所有标签关联
        tagObjRelaRepository.deleteByObjId(id);
        // 删除对象本身
        repository.delete(model);
    }

    @Override
    public D get(String userId, String id) {
        M model = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Object not found: " + id));
        if (model.getCreateUser() != null && !model.getCreateUser().equals(userId)) {
            throw new IllegalArgumentException("No permission to access object: " + id);
        }
        return convertToDto(model, true);
    }

    @Override
    public List<D> list(String userId) {
        if (!StringUtils.isNotBlank(userId)) {
            throw new IllegalArgumentException("User ID cannot be empty");
        }
        List<M> models = repository.findByCreateUser(userId);
        return convertToDtos(models);
    }

    @Override
    public D convertToDto(M model, Boolean loadProps) {
        D dto = newDto();
        BeanUtils.copyProperties(model, dto);
        if (loadProps == null || !loadProps) {
            return dto;
        }

        // 加载分组信息
        if (StringUtils.isNotBlank(model.getId())) {
            List<GroupObjRela> groupRelas = groupObjRelaRepository.findByObjId(model.getId());
            if (!groupRelas.isEmpty()) {
                groupRepository.findById(groupRelas.get(0).getGroupId()).ifPresent(group -> {
                    dto.setGroupName(group.getName());
                    dto.setGroupLabel(group.getLabel());
                });
            }
        }

        // 加载标签信息
        if (StringUtils.isNotBlank(model.getId())) {
            List<TagObjRela> tagRelas = tagObjRelaRepository.findByObjId(model.getId());
            if (!tagRelas.isEmpty()) {
                List<String> tagIds = tagRelas.stream().map(TagObjRela::getTagId).collect(Collectors.toList());
                List<Tag> tags = tagRepository.findAllById(tagIds);
                dto.setTagNames(tags.stream().map(Tag::getName).collect(Collectors.toList()));
                dto.setTagLabels(tags.stream().map(Tag::getLabel).collect(Collectors.toList()));
            }
        }

        String createUserId = model.getCreateUser();
        String updateUserId = model.getUpdateUser();

        // 过滤掉 null 值，避免 List.of() 抛出 NullPointerException
        List<String> userIds = new ArrayList<>();
        if (createUserId != null) {
            userIds.add(createUserId);
        }
        if (updateUserId != null) {
            userIds.add(updateUserId);
        }

        if (!userIds.isEmpty()) {
            userService.getUserMapByIds(userIds).forEach((userId, userDto) -> {
                if (userId.equals(createUserId)) {
                    dto.setCreateUserName(userDto.getUserName());
                }
                if (userId.equals(updateUserId)) {
                    dto.setUpdateUserName(userDto.getUserName());
                }
            });
        }
        return dto;
    }

    @Override
    public List<D> convertToDtos(List<M> models) {
        if (models == null || models.isEmpty()) {
            return new ArrayList<>();
        }
        List<D> dtos = models.stream().map(model -> convertToDto(model, false)).collect(Collectors.toList());
        List<String> objIds = models.stream().map(Model::getId).collect(Collectors.toList());

        // 批量加载分组关联
        List<GroupObjRela> groupRelas = groupObjRelaRepository.findByObjIdIn(objIds);
        if (!groupRelas.isEmpty()) {
            Map<String, String> objToGroupIdMap = groupRelas.stream()
                    .collect(Collectors.toMap(GroupObjRela::getObjId, GroupObjRela::getGroupId, (v1, v2) -> v1));
            List<String> groupIds = new ArrayList<>(objToGroupIdMap.values());
            if (!groupIds.isEmpty()) {
                Map<String, Group> groupMap = groupRepository.findAllById(groupIds).stream()
                        .collect(Collectors.toMap(Group::getId, group -> group));
                dtos.forEach(dto -> {
                    String groupId = objToGroupIdMap.get(dto.getId());
                    if (groupId != null) {
                        Group group = groupMap.get(groupId);
                        if (group != null) {
                            dto.setGroupName(group.getName());
                            dto.setGroupLabel(group.getLabel());
                        }
                    }
                });
            }
        }

        // 批量加载标签关联
        List<TagObjRela> tagRelas = tagObjRelaRepository.findByObjIdIn(objIds);
        if (!tagRelas.isEmpty()) {
            Map<String, List<String>> objToTagIdsMap = tagRelas.stream()
                    .collect(Collectors.groupingBy(TagObjRela::getObjId,
                            Collectors.mapping(TagObjRela::getTagId, Collectors.toList())));

            List<String> allTagIds = tagRelas.stream().map(TagObjRela::getTagId).distinct()
                    .collect(Collectors.toList());
            if (!allTagIds.isEmpty()) {
                Map<String, Tag> tagMap = tagRepository.findAllById(allTagIds).stream()
                        .collect(Collectors.toMap(Tag::getId, tag -> tag));

                dtos.forEach(dto -> {
                    List<String> tagIds = objToTagIdsMap.get(dto.getId());
                    if (tagIds != null) {
                        List<Tag> tags = tagIds.stream()
                                .map(tagMap::get)
                                .filter(tag -> tag != null)
                                .collect(Collectors.toList());
                        dto.setTagNames(tags.stream().map(Tag::getName).collect(Collectors.toList()));
                        dto.setTagLabels(tags.stream().map(Tag::getLabel).collect(Collectors.toList()));
                    }
                });
            }
        }

        Map<String, List<D>> createUserToGroups = dtos.stream()
                .collect(Collectors.groupingBy(D::getCreateUser));
        Map<String, List<D>> updateUserToGroups = dtos.stream()
                .filter(d -> d.getUpdateUser() != null)
                .collect(Collectors.groupingBy(D::getUpdateUser));
        userService.getUserMapByIds(new ArrayList<>(createUserToGroups.keySet())).forEach((userId, userDto) -> {
            List<D> userGroups = createUserToGroups.get(userId);
            userGroups.forEach(D -> D.setCreateUserName(userDto.getUserName()));
        });
        userService.getUserMapByIds(new ArrayList<>(updateUserToGroups.keySet())).forEach((userId, userDto) -> {
            List<D> userGroups = updateUserToGroups.get(userId);
            userGroups.forEach(D -> D.setUpdateUserName(userDto.getUserName()));
        });
        return dtos;
    }

}
