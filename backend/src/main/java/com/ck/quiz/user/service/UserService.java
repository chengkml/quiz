package com.ck.quiz.user.service;

import com.ck.quiz.user.dto.UserCreateDto;
import com.ck.quiz.user.dto.UserDto;
import com.ck.quiz.user.dto.UserUpdateDto;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;

public interface UserService {

    UserDto register(UserCreateDto userCreateDto);

    UserDto getUserById(String id);

    Page<UserDto> searchUsers(String userName, String state, String sortColumn, String sortType, int pageNum, int pageSize);

    UserDto updateUser(UserUpdateDto userUpdateDto);

    boolean resetPassword(String id, String newPassword);

    UserDto enableUser(String id);

    UserDto disableUser(String id);

    boolean existsByUserId(String userId);

    UserDto deleteUser(String id);

    Map<String, UserDto> getUserMapByIds(List<String> userIds);

}