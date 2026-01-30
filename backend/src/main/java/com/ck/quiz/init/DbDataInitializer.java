package com.ck.quiz.init;

import com.ck.quiz.config.dto.SystemParamCreateDto;
import com.ck.quiz.config.entity.SystemParam;
import com.ck.quiz.config.repository.SystemParamRepository;
import com.ck.quiz.config.service.SystemParamService;
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
import com.ck.quiz.knowledgeset.entity.KnowledgeSet;
import com.ck.quiz.knowledgeset.repository.KnowledgeSetRepository;
import com.ck.quiz.utils.IdHelper;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
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

    @Autowired
    private SystemParamRepository systemParamRepository;

    @Autowired
    private SystemParamService systemParamService;

    @Autowired
    private KnowledgeSetRepository knowledgeSetRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

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

        // 初始化邮件配置参数
        initializeMailConfig();

        // 初始化文件存储配置参数
        initializeFileConfig();

        // 初始化思维导图知识集
        initializeKnowledgeSet();

        // 初始化流程图知识集
        initializeFlowchartKnowledgeSet();
    }

    private void initializeMenu() {
        Menu sysMgr = new Menu();
        sysMgr.setMenuId("sys_mgr");
        sysMgr.setMenuName("sys_mgr");
        sysMgr.setUrl("");
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
        menuMgr.setUrl("menu");
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
        roleMgr.setUrl("role");
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
        userMgr.setUrl("user");
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
        adminUser.setCreateUser("admin");
        adminUser.setState(User.UserState.ENABLED);
        userRepository.save(adminUser);
    }

    /**
     * 初始化邮件配置参数
     */
    private void initializeMailConfig() {
        log.info("开始检查并初始化邮件配置参数...");
        List<InitConfigParam> mailParams = getMailConfigParams();
        initializeParams(mailParams, "邮件配置");
    }

    /**
     * 初始化文件存储配置参数
     */
    private void initializeFileConfig() {
        log.info("开始检查并初始化文件存储配置参数...");
        List<InitConfigParam> fileParams = getFileConfigParams();
        initializeParams(fileParams, "文件存储配置");
    }

    private void initializeParams(List<InitConfigParam> params, String configName) {
        int insertedCount = 0;

        for (InitConfigParam param : params) {
            try {
                // 检查参数是否已存在
                if (systemParamRepository.findByParamName(param.paramName).isEmpty()) {
                    // 参数不存在，创建新参数
                    SystemParamCreateDto createDto = new SystemParamCreateDto();
                    createDto.setParamName(param.paramName);
                    createDto.setParamValue(param.paramValue);
                    createDto.setDefaultValue(param.defaultValue);
                    createDto.setParamType(param.paramType);
                    createDto.setCategory(param.category);
                    createDto.setDescription(param.description);
                    createDto.setIsEncrypted(param.isEncrypted);
                    createDto.setIsReadonly(false);
                    createDto.setStatus(SystemParam.ParamStatus.ACTIVE);
                    createDto.setSortOrder(param.sortOrder);

                    systemParamService.create(createDto);
                    insertedCount++;
                    log.info("已初始化{}: {} = {}", configName, param.paramName, param.paramValue);
                }
            } catch (Exception e) {
                log.error("初始化{}失败: {}", configName, param.paramName, e);
            }
        }

        if (insertedCount > 0) {
            log.info("成功初始化 {} 个{}", insertedCount, configName);
        } else {
            log.info("{}已存在，无需初始化", configName);
        }
    }

    /**
     * 获取邮件配置参数列表
     */
    private List<InitConfigParam> getMailConfigParams() {
        List<InitConfigParam> params = new ArrayList<>();

        params.add(new InitConfigParam(
                "mail.host",
                "smtp.example.com",
                "smtp.example.com",
                SystemParam.ParamType.STRING,
                "邮件配置",
                "SMTP服务器地址（如：smtp.qq.com、smtp.163.com、smtp.gmail.com）",
                false,
                1));

        params.add(new InitConfigParam(
                "mail.port",
                "587",
                "587",
                SystemParam.ParamType.NUMBER,
                "邮件配置",
                "SMTP服务器端口（常用端口：25、465、587）",
                false,
                2));

        params.add(new InitConfigParam(
                "mail.username",
                "your-email@example.com",
                "your-email@example.com",
                SystemParam.ParamType.STRING,
                "邮件配置",
                "发件人邮箱地址",
                false,
                3));

        params.add(new InitConfigParam(
                "mail.password",
                "your-password",
                "your-password",
                SystemParam.ParamType.STRING,
                "邮件配置",
                "邮箱密码或授权码（建议使用授权码）",
                true,
                4));

        params.add(new InitConfigParam(
                "mail.encoding",
                "UTF-8",
                "UTF-8",
                SystemParam.ParamType.STRING,
                "邮件配置",
                "邮件编码格式",
                false,
                5));

        params.add(new InitConfigParam(
                "mail.smtp.auth",
                "true",
                "true",
                SystemParam.ParamType.BOOLEAN,
                "邮件配置",
                "启用SMTP身份验证",
                false,
                6));

        params.add(new InitConfigParam(
                "mail.smtp.starttls.enable",
                "true",
                "true",
                SystemParam.ParamType.BOOLEAN,
                "邮件配置",
                "启用STARTTLS加密传输",
                false,
                7));

        params.add(new InitConfigParam(
                "mail.smtp.starttls.required",
                "true",
                "true",
                SystemParam.ParamType.BOOLEAN,
                "邮件配置",
                "要求必须使用STARTTLS",
                false,
                8));

        return params;
    }

    /**
     * 初始化思维导图知识集
     */
    private void initializeKnowledgeSet() {
        String name = "思维导图";
        String descr = "系统默认思维导图知识集";

        List<User> users = userRepository.findAll();
        for (User user : users) {
            String userId = user.getUserId();
            if (knowledgeSetRepository.existsByNameAndCreateUser(name, userId)) {
                continue;
            }
            KnowledgeSet ks = new KnowledgeSet();
            ks.setId(IdHelper.genUuid());
            ks.setName(name);
            ks.setDescr(descr);
            ks.setCreateUser(userId);
            ks.setUpdateUser(userId);
            ks.setCreateDate(LocalDateTime.now());
            ks.setUpdateDate(LocalDateTime.now());
            ks.setIsSystem(true);
            ks.setStatus("ENABLED");
            knowledgeSetRepository.save(ks);
            log.info("Initialized Mind Map Knowledge Set for user: {}", userId);
        }
    }

    /**
     * 初始化流程图知识集
     */
    private void initializeFlowchartKnowledgeSet() {
        String name = "流程图";
        String descr = "系统默认流程图知识集";

        // 使用 JDBC 直接查询用户列表
        List<String> userIds = jdbcTemplate.queryForList(
                "SELECT user_id FROM user",
                String.class);

        if (userIds.isEmpty()) {
            return;
        }

        // 批量插入知识集
        List<Object[]> batchArgs = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (String userId : userIds) {
            // 检查是否已存在
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM knowledge_set WHERE name = ? AND create_user = ?",
                    Integer.class,
                    name, userId);

            if (count != null && count > 0) {
                continue;
            }

            String id = IdHelper.genUuid();
            batchArgs.add(new Object[] {
                    id, name, descr, userId, userId, now, now, true, "ENABLED"
            });
        }

        if (!batchArgs.isEmpty()) {
            jdbcTemplate.batchUpdate(
                    "INSERT INTO knowledge_set (id, name, descr, create_user, update_user, " +
                            "create_date, update_date, is_system, status) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    batchArgs);
            log.info("Initialized Flowchart Knowledge Set for {} users", batchArgs.size());
        }
    }

    /**
     * 获取文件存储配置参数列表
     */
    private List<InitConfigParam> getFileConfigParams() {
        List<InitConfigParam> params = new ArrayList<>();

        params.add(new InitConfigParam(
                "quiz.file.storage-type",
                "local",
                "local",
                SystemParam.ParamType.STRING,
                "文件存储配置",
                "文件存储类型 (local, sftp, s3)",
                false,
                1));

        params.add(new InitConfigParam(
                "quiz.file.local.base-path",
                "./data/files",
                "./data/files",
                SystemParam.ParamType.STRING,
                "文件存储配置",
                "本地存储基础路径",
                false,
                2));

        params.add(new InitConfigParam(
                "quiz.file.sftp.host",
                "localhost",
                "localhost",
                SystemParam.ParamType.STRING,
                "文件存储配置",
                "SFTP服务器地址",
                false,
                3));

        params.add(new InitConfigParam(
                "quiz.file.sftp.port",
                "22",
                "22",
                SystemParam.ParamType.NUMBER,
                "文件存储配置",
                "SFTP服务器端口",
                false,
                4));

        params.add(new InitConfigParam(
                "quiz.file.sftp.username",
                "user",
                "user",
                SystemParam.ParamType.STRING,
                "文件存储配置",
                "SFTP用户名",
                false,
                5));

        params.add(new InitConfigParam(
                "quiz.file.sftp.password",
                "password",
                "",
                SystemParam.ParamType.STRING,
                "文件存储配置",
                "SFTP密码",
                true,
                6));

        params.add(new InitConfigParam(
                "quiz.file.sftp.private-key",
                "",
                "",
                SystemParam.ParamType.STRING,
                "文件存储配置",
                "SFTP私钥文件路径（可选）",
                false,
                7));

        params.add(new InitConfigParam(
                "quiz.file.sftp.base-path",
                "/upload",
                "/upload",
                SystemParam.ParamType.STRING,
                "文件存储配置",
                "SFTP远程基础路径",
                false,
                8));

        params.add(new InitConfigParam(
                "quiz.file.s3.access-key",
                "minioadmin",
                "",
                SystemParam.ParamType.STRING,
                "文件存储配置",
                "S3 Access Key",
                false,
                9));

        params.add(new InitConfigParam(
                "quiz.file.s3.secret-key",
                "minioadmin",
                "",
                SystemParam.ParamType.STRING,
                "文件存储配置",
                "S3 Secret Key",
                true,
                10));

        params.add(new InitConfigParam(
                "quiz.file.s3.region",
                "us-east-1",
                "us-east-1",
                SystemParam.ParamType.STRING,
                "文件存储配置",
                "S3 Region",
                false,
                11));

        params.add(new InitConfigParam(
                "quiz.file.s3.bucket",
                "mybucket",
                "mybucket",
                SystemParam.ParamType.STRING,
                "文件存储配置",
                "S3 Bucket Name",
                false,
                12));

        params.add(new InitConfigParam(
                "quiz.file.s3.endpoint",
                "http://localhost:9000",
                "",
                SystemParam.ParamType.STRING,
                "文件存储配置",
                "S3 Endpoint URL (Optional)",
                false,
                13));

        params.add(new InitConfigParam(
                "quiz.file.s3.base-path",
                "",
                "",
                SystemParam.ParamType.STRING,
                "文件存储配置",
                "S3存储基础路径 (Optional)",
                false,
                14));

        return params;
    }

    /**
     * 邮件配置参数内部类
     */
    private static class InitConfigParam {
        String paramName;
        String paramValue;
        String defaultValue;
        SystemParam.ParamType paramType;
        String category;
        String description;
        Boolean isEncrypted;
        Integer sortOrder;

        InitConfigParam(String paramName, String paramValue, String defaultValue,
                SystemParam.ParamType paramType, String category, String description,
                Boolean isEncrypted, Integer sortOrder) {
            this.paramName = paramName;
            this.paramValue = paramValue;
            this.defaultValue = defaultValue;
            this.paramType = paramType;
            this.category = category;
            this.description = description;
            this.isEncrypted = isEncrypted;
            this.sortOrder = sortOrder;
        }
    }
}