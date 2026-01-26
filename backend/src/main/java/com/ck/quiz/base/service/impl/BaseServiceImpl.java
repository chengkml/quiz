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

    @Override
    @Transactional
    public D create(C createDto) {
        M model = newModel();
        model.setId(IdHelper.genUuid());
        BeanUtils.copyProperties(createDto, model);
        M savedModel = repository.save(model);
        if (StringUtils.isNotBlank(createDto.getGroup())) {
            String createUser = savedModel.getCreateUser();
            Group group = groupRepository.findByCreateUserAndName(createUser, createDto.getGroup());
            if (group != null) {
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
            String createUser = savedModel.getCreateUser();
            for (String tagName : createDto.getTags()) {
                Tag tag = tagRepository.findByCreateUserAndName(createUser, tagName);
                if (tag != null) {
                    TagObjRela rela = new TagObjRela();
                    rela.setRelaId(IdHelper.genUuid());
                    rela.setTagId(tag.getId());
                    rela.setObjId(savedModel.getId());
                    tagObjRelaRepository.save(rela);
                } else {
                    throw new IllegalArgumentException("Tag not found: " + tagName);
                }
            }
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
                Group group = groupRepository.findByCreateUserAndName(createUser, updateDto.getGroup());
                if (group != null) {
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

            if (!updateDto.getTags().isEmpty()) {
                // 添加新的标签关联
                String createUser = updatedModel.getCreateUser();
                for (String tagName : updateDto.getTags()) {
                    Tag tag = tagRepository.findByCreateUserAndName(createUser, tagName);
                    if (tag != null) {
                        TagObjRela rela = new TagObjRela();
                        rela.setRelaId(IdHelper.genUuid());
                        rela.setTagId(tag.getId());
                        rela.setObjId(updatedModel.getId());
                        tagObjRelaRepository.save(rela);
                    } else {
                        throw new IllegalArgumentException("Tag not found: " + tagName);
                    }
                }
            }
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
        List<D> dtos = models.stream().map(model -> convertToDto(model, false)).collect(Collectors.toList());
        Map<String, List<D>> createUserToGroups = dtos.stream()
                .collect(Collectors.groupingBy(D::getCreateUser));
        Map<String, List<D>> updateUserToGroups = dtos.stream()
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
