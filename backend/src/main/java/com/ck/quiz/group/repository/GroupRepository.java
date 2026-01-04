package com.ck.quiz.group.repository;

import com.ck.quiz.group.entity.Group;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface GroupRepository extends JpaRepository<Group, String> {

    List<Group> findByCreateUser(String createUser);

    Group findByCreateUserAndName(String createUser, String name);
}