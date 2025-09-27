package com.ck.quiz.init;

import com.ck.quiz.menu.entity.Menu;
import com.ck.quiz.menu.repository.MenuRepository;
import com.ck.quiz.role.entity.UserRole;
import com.ck.quiz.role.repository.UserRoleRepository;
import com.ck.quiz.role_menu.entity.RoleMenuRela;
import com.ck.quiz.role_menu.repository.RoleMenuRelaRepository;
import com.ck.quiz.user.entity.User;
import com.ck.quiz.user.repository.UserRepository;
import com.ck.quiz.user_role.entity.UserRoleRela;
import com.ck.quiz.user_role.repository.UserRoleRelaRepository;
import com.ck.quiz.utils.IdHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * 数据库数据初始化器
 */
@Component
public class DbDataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private UserRoleRelaRepository roleRelaRepository;

    @Autowired
    private MenuRepository menuRepository;

    @Autowired
    private RoleMenuRelaRepository roleMenuRelaRepository;

    @Override
    public void run(String... args) {
        // 检查用户表是否为空
        long userCount = userRepository.count();
        if (userCount == 0) {
            initializeAdminUser();
        }
        // 检查角色表是否为空
        long roleCount = userRoleRepository.count();
        if (roleCount == 0) {
            initializeSysMgrRole();
        }
        // 检查admin角色是否为空
        long adminRoleCount = roleRelaRepository.countByUser(userRepository.findByUserId("admin").get());
        if (adminRoleCount == 0) {
            initializeAdminRole();
        }

        long menuCount = menuRepository.count();
        if (menuCount == 0) {
            initializeMenu();
        }

        long roleMenuRelaCount = roleMenuRelaRepository.countByRoleId("sys_mgr");
        if (roleMenuRelaCount == 0) {
            initializeRoleMenuRela();
        }
    }

    private void initializeMenu() {
        Menu sysMgr = new Menu();
        sysMgr.setMenuId("sys_mgr");
        sysMgr.setMenuName("sys_mgr");
        sysMgr.setMenuLabel("系统管理");
        sysMgr.setMenuType(Menu.MenuType.DIRECTORY);
        sysMgr.setSeq(1);
        sysMgr.setState(Menu.MenuState.ENABLED);
        sysMgr.setMenuDescr("系统管理");
        sysMgr.setCreateDate(LocalDateTime.now());
        sysMgr.setUpdateDate(LocalDateTime.now());
        menuRepository.save(sysMgr);
        menuRepository.flush();

        List<Menu> menus = new ArrayList<>();
        Menu menuMgr = new Menu();
        menuMgr.setMenuId("menu_mgr");
        menuMgr.setMenuName("menu_mgr");
        menuMgr.setMenuLabel("菜单管理");
        menuMgr.setMenuType(Menu.MenuType.MENU);
        menuMgr.setParentId("sys_mgr");
        menuMgr.setSeq(3);
        menuMgr.setState(Menu.MenuState.ENABLED);
        menuMgr.setCreateDate(LocalDateTime.now());
        menuMgr.setUpdateDate(LocalDateTime.now());
        menus.add(menuMgr);

        Menu roleMgr = new Menu();
        roleMgr.setMenuId("role_mgr");
        roleMgr.setMenuName("role_mgr");
        roleMgr.setMenuLabel("角色管理");
        roleMgr.setMenuType(Menu.MenuType.MENU);
        roleMgr.setParentId("sys_mgr");
        roleMgr.setSeq(2);
        roleMgr.setState(Menu.MenuState.ENABLED);
        roleMgr.setCreateDate(LocalDateTime.now());
        roleMgr.setUpdateDate(LocalDateTime.now());
        menus.add(roleMgr);


        Menu userMgr = new Menu();
        userMgr.setMenuId("user_mgr");
        userMgr.setMenuName("user_mgr");
        userMgr.setMenuLabel("用户管理");
        userMgr.setMenuType(Menu.MenuType.MENU);
        userMgr.setParentId("sys_mgr");
        userMgr.setSeq(1);
        userMgr.setState(Menu.MenuState.ENABLED);
        userMgr.setCreateDate(LocalDateTime.now());
        userMgr.setUpdateDate(LocalDateTime.now());
        menus.add(userMgr);
        menuRepository.saveAll(menus);

    }

    private void initializeRoleMenuRela() {
        RoleMenuRela r2 = new RoleMenuRela();
        r2.setRelaId(IdHelper.genUuid());
        r2.setRoleId("sys_mgr");
        r2.setMenuId("menu_mgr");

        RoleMenuRela r3 = new RoleMenuRela();
        r3.setRelaId(IdHelper.genUuid());
        r3.setRoleId("sys_mgr");
        r3.setMenuId("role_mgr");

        RoleMenuRela r4 = new RoleMenuRela();
        r4.setRelaId(IdHelper.genUuid());
        r4.setRoleId("sys_mgr");
        r4.setMenuId("sys_mgr");

        RoleMenuRela r5 = new RoleMenuRela();
        r5.setRelaId(IdHelper.genUuid());
        r5.setRoleId("sys_mgr");
        r5.setMenuId("user_mgr");
        roleMenuRelaRepository.saveAll(Arrays.asList(r2, r3, r4, r5));
    }


    private void initializeAdminRole() {
        UserRoleRela adminRoleRela = new UserRoleRela();
        adminRoleRela.setRelaId(IdHelper.genUuid());
        adminRoleRela.setUser(userRepository.findByUserId("admin").get());
        adminRoleRela.setRole(userRoleRepository.findById("sys_mgr").get());
        roleRelaRepository.save(adminRoleRela);
    }

    private void initializeSysMgrRole() {
        UserRole sysMgrRole = new UserRole();
        sysMgrRole.setId("sys_mgr");
        sysMgrRole.setName("系统管理员");
        sysMgrRole.setState(UserRole.RoleState.ENABLED);
        sysMgrRole.setDescr("系统管理员");
        sysMgrRole.setCreateUser("admin");
        sysMgrRole.setUpdateUser("admin");
        sysMgrRole.setCreateDate(LocalDateTime.now());
        sysMgrRole.setUpdateDate(LocalDateTime.now());
        userRoleRepository.save(sysMgrRole);
    }

    /**
     * 初始化系统管理员账户
     */
    private void initializeAdminUser() {
        User adminUser = new User();
        adminUser.setUserId("admin");
        adminUser.setUserName("系统管理员");
        adminUser.setPassword(passwordEncoder.encode("sys"));
        adminUser.setEmail("admin@asiainfo.com");
        adminUser.setPhone("12345678901");
        adminUser.setState(User.UserState.ENABLED); // 启用状态
        userRepository.save(adminUser);
    }
}