package com.ck.quiz.user_role.service.impl;

import com.ck.quiz.role.dto.RoleDto;
import com.ck.quiz.role.repository.UserRoleRepository;
import com.ck.quiz.role.service.RoleService;
import com.ck.quiz.user.repository.UserRepository;
import com.ck.quiz.user_role.entity.UserRoleRela;
import com.ck.quiz.user_role.repository.UserRoleRelaRepository;
import com.ck.quiz.user_role.service.UserRoleRelaService;
import com.ck.quiz.utils.IdHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class UserRoleRelaServiceImpl implements UserRoleRelaService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleService roleService;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private UserRoleRelaRepository userRoleRelaRepository;

    @Override
    public List<RoleDto> getUserRoles(String userId) {
        return userRoleRelaRepository.findByUser(userRepository.findByUserId(userId).get()).stream()
                .map(UserRoleRela::getRole)       // 直接取角色实体
                .filter(Objects::nonNull)
                .map(roleService::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<RoleDto> replaceUserRoles(String userId, List<String> roleIds) {
        // 1. 校验用户是否存在
        var userOpt = userRepository.findByUserId(userId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("用户不存在: " + userId);
        }
        var user = userOpt.get();

        // 2. 删除旧的绑定关系
        userRoleRelaRepository.deleteByUser(user);

        // 3. 构建新的关联关系
        List<UserRoleRela> relas = roleIds.stream().map(roleId -> {
            var role = userRoleRepository.findById(roleId)
                    .orElseThrow(() -> new RuntimeException("角色不存在: " + roleId));
            UserRoleRela rela = new UserRoleRela();
            rela.setRelaId(IdHelper.genUuid());
            rela.setUser(user);
            rela.setRole(role);
            return rela;
        }).collect(Collectors.toList());

        // 4. 批量保存
        userRoleRelaRepository.saveAll(relas);

        // 5. 返回 DTO 列表
        return relas.stream()
                .map(UserRoleRela::getRole)
                .map(roleService::convertToDto)
                .collect(Collectors.toList());
    }

}
