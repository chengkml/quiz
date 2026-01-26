package com.ck.quiz.group.service;

import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.group.dto.GroupCreateDto;
import com.ck.quiz.group.dto.GroupDto;
import com.ck.quiz.group.dto.GroupQueryDto;
import com.ck.quiz.group.dto.GroupUpdateDto;
import com.ck.quiz.group.entity.Group;

public interface GroupService extends BaseService<GroupCreateDto, GroupUpdateDto, GroupQueryDto, GroupDto, Group> {

    boolean checkNameUniq(String userId, String name, String excludeId);
}