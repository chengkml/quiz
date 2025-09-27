package com.ck.quiz.user.service;

import com.ck.quiz.role.dto.RoleDto;
import com.ck.quiz.user.dto.UserCreateDto;
import com.ck.quiz.user.dto.UserDto;
import com.ck.quiz.user.dto.UserUpdateDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * 用户管理服务接口
 */
public interface UserService {

    /**
     * 用户注册
     *
     * @param userCreateDto 用户创建信息
     * @return 创建的用户信息
     */
    UserDto register(UserCreateDto userCreateDto);

    /**
     * 根据ID获取用户详情
     *
     * @param id 用户ID
     * @return 用户信息
     */
    UserDto getUserById(String id);

    /**
     * 分页查询用户
     *
     * @param userId   用户账号（模糊查询）
     * @param userName 用户姓名（模糊查询）
     * @param state    状态
     * @param pageable 分页参数
     * @return 用户分页列表
     */
    Page<UserDto> searchUsers(String userId, String userName, String state, Pageable pageable);

    /**
     * 更新用户信息
     *
     * @param userUpdateDto 更新信息
     * @return 更新后的用户信息
     */
    UserDto updateUser(UserUpdateDto userUpdateDto);

    /**
     * 管理员重置用户密码
     *
     * @param id          用户ID
     * @param newPassword 新密码
     * @return 是否成功
     */
    boolean resetPassword(String id, String newPassword);

    /**
     * 启用用户
     *
     * @param id 用户ID
     * @return 是否成功
     */
    UserDto enableUser(String id);

    /**
     * 禁用用户
     *
     * @param id 用户ID
     * @return 是否成功
     */
    UserDto disableUser(String id);

    /**
     * 检查用户账号是否存在
     *
     * @param userId 用户账号
     * @return 是否存在
     */
    boolean existsByUserId(String userId);

    /**
     * 删除用户
     *
     * @param id 用户ID
     * @return 是否成功
     */
    UserDto deleteUser(String id);

}