package com.ck.quiz.user_role.service.impl;

import com.ck.quiz.role.dto.RoleDto;
import com.ck.quiz.role.entity.UserRole;
import com.ck.quiz.role.repository.UserRoleRepository;
import com.ck.quiz.role.service.RoleService;
import com.ck.quiz.user.repository.UserRepository;
import com.ck.quiz.user_role.entity.UserRoleRela;
import com.ck.quiz.user_role.repository.UserRoleRelaRepository;
import com.ck.quiz.user_role.service.UserRoleRelaService;
import com.ck.quiz.utils.IdHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    public int assignRoles(String id, List<String> roleIds) {
        // 检查用户是否存在
        if (!userRepository.existsByUserId(id)) {
            throw new RuntimeException("用户不存在: " + id);
        }

        // 检查角色是否存在
        List<UserRole> roles = userRoleRepository.findAllById(roleIds);
        if (roles.size() != roleIds.size()) {
            throw new RuntimeException("部分角色不存在");
        }

        // 删除用户现有的角色关联
        userRoleRelaRepository.deleteByUser(userRepository.findByUserId(id).get());

        // 创建新的角色关联
        List<UserRoleRela> roleRelas = roleIds.stream()
                .map(roleId -> {
                    UserRoleRela rela = new UserRoleRela();
                    rela.setRelaId(IdHelper.genUuid());
                    rela.setUser(userRepository.findByUserId(id).get());
                    rela.setRole(userRoleRepository.findById(roleId).get());
                    return rela;
                })
                .collect(Collectors.toList());

        userRoleRelaRepository.saveAll(roleRelas);

        return roleRelas.size();
    }

    @Override
    @Transactional
    public int revokeRole(String id, List<String> roleIds) {
        // TODO
        return 0;
    }
}
