package com.ck.quiz.group.service;

import com.ck.quiz.group.dto.GroupUpdateDto;
import com.ck.quiz.group.entity.Group;
import com.ck.quiz.group.dto.GroupCreateDto;
import com.ck.quiz.group.dto.GroupDto;
import com.ck.quiz.group.dto.GroupQueryDto;
import org.springframework.data.domain.Page;
import java.util.List;

public interface GroupService {

    boolean checkNameUniq(String userId, String name, String excludeId);

    GroupDto create(GroupCreateDto createDto);

    GroupDto update(String userId, GroupUpdateDto updateDto);

    void delete(String userId, String id);

    GroupDto get(String userId, String id);

    Page<GroupDto> search(String userId, GroupQueryDto queryDto);

    List<GroupDto> list(String userId);

    GroupDto convertToDto(Group group, Boolean loadProps);

    List<GroupDto> convertToDtos(List<Group> groups);

}