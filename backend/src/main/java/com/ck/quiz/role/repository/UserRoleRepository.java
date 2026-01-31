package com.ck.quiz.role.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.role.entity.UserRole;

public interface UserRoleRepository extends BaseRepository<UserRole> {

    UserRole findByName(String name);

    java.util.List<UserRole> findByState(UserRole.RoleState state);
}