package com.ck.quiz.role_menu.service.impl;

import com.ck.quiz.menu.dto.MenuDto;
import com.ck.quiz.menu.entity.Menu;
import com.ck.quiz.menu.service.MenuService;
import com.ck.quiz.role_menu.entity.RoleMenuRela;
import com.ck.quiz.role_menu.repository.RoleMenuRelaRepository;
import com.ck.quiz.role_menu.service.RoleMenuService;
import com.ck.quiz.user.entity.User;
import com.ck.quiz.user.repository.UserRepository;
import com.ck.quiz.user_role.entity.UserRoleRela;
import com.ck.quiz.user_role.repository.UserRoleRelaRepository;
import com.ck.quiz.utils.IdHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 角色-菜单关系业务实现类
 * <p>
 * 提供以下功能：
 * 1. 角色绑定/替换菜单权限
 * 2. 查询角色对应的菜单列表
 * 3. 查询角色对应的菜单树（树形结构）
 * 4. 查询用户对应的菜单树（树形结构，间接通过角色）
 */
@Service
public class RoleMenuServiceImpl implements RoleMenuService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserRoleRelaRepository userRoleRelaRepository;

    @Autowired
    private RoleMenuRelaRepository roleMenuRelaRepository;

    @Autowired
    private MenuService menuService;

    /**
     * 替换角色的所有菜单绑定关系
     * <p>
     * 步骤：
     * 1. 先删除该角色下所有已有的菜单绑定记录
     * 2. 批量插入新的菜单绑定关系
     *
     * @param roleId  角色ID
     * @param menuIds 菜单ID集合
     * @return 新增的绑定数量
     */
    @Override
    @Transactional
    public int replaceRoleMenus(String roleId, List<String> menuIds) {
        // 删除旧的绑定关系
        roleMenuRelaRepository.deleteByRoleId(roleId);

        // 构建新的绑定关系
        List<RoleMenuRela> relas = new ArrayList<>();
        menuIds.forEach(menuId -> {
            RoleMenuRela rela = new RoleMenuRela();
            rela.setRelaId(IdHelper.genUuid()); // 生成唯一主键
            rela.setRoleId(roleId);
            rela.setMenuId(menuId);
            relas.add(rela);
        });

        // 批量保存
        roleMenuRelaRepository.saveAll(relas);

        return relas.size();
    }

    /**
     * 根据角色ID获取菜单树（树形结构）
     *
     * @param roleId 角色ID
     * @return 菜单树 DTO 列表
     */
    @Override
    @Transactional(readOnly = true)
    public List<MenuDto> getMenuTreeByRoleId(String roleId) {
        List<Menu> menus = roleMenuRelaRepository.findByRoleId(roleId).stream()
                .map(RoleMenuRela::getMenu)                  // 获取菜单实体
                .collect(Collectors.toList());

        return menuService.buildMenuTree(menus);
    }


    @Override
    @Transactional(readOnly = true)
    public List<MenuDto> getMenuTreeByUserId(String userId) {
        Optional<User> userOpt = userRepository.findByUserId(userId);
        if (!userOpt.isPresent()) {
            throw new RuntimeException("用户不存在: " + userId);
        }

        // 1. 找出用户所有角色
        List<UserRoleRela> userRoleRelas = userRoleRelaRepository.findByUser(userOpt.get());
        if (userRoleRelas.isEmpty()) {
            return new ArrayList<>();
        }
        List<String> roleIds = userRoleRelas.stream()
                .map(ur -> ur.getRole().getId())
                .collect(Collectors.toList());

        // 2. 找出这些角色绑定的所有菜单关系
        List<RoleMenuRela> roleMenuRelas = roleMenuRelaRepository.findByRoleIdIn(roleIds);
        if (roleMenuRelas.isEmpty()) {
            return new ArrayList<>();
        }

        // 3. 收集菜单实体（去重）
        List<Menu> menus = roleMenuRelas.stream()
                .map(RoleMenuRela::getMenu)
                .distinct()
                .collect(Collectors.toList());

        // 4. 构建菜单树
        return menuService.buildMenuTree(menus);
    }

}
