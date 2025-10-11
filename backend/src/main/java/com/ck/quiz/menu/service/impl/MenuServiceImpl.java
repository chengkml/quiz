package com.ck.quiz.menu.service.impl;

import com.ck.quiz.menu.dto.MenuCreateDto;
import com.ck.quiz.menu.dto.MenuDto;
import com.ck.quiz.menu.dto.MenuQueryDto;
import com.ck.quiz.menu.dto.MenuUpdateDto;
import com.ck.quiz.menu.entity.Menu;
import com.ck.quiz.menu.exception.MenuException;
import com.ck.quiz.menu.repository.MenuRepository;
import com.ck.quiz.menu.service.MenuService;
import com.ck.quiz.role_menu.repository.RoleMenuRelaRepository;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 菜单管理服务实现类
 */
@Service
public class MenuServiceImpl implements MenuService {

    @Autowired
    private MenuRepository menuRepository;

    @Autowired
    private RoleMenuRelaRepository roleMenuRelaRepository;

    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;

    @Override
    public MenuDto createMenu(MenuCreateDto menuCreateDto) {
        menuCreateDto.setMenuId(IdHelper.genUuid());
        // 检查菜单ID是否已存在
        if (menuRepository.existsById(menuCreateDto.getMenuId())) {
            throw new MenuException("MENU_ID_EXISTS", "菜单ID已存在: " + menuCreateDto.getMenuId());
        }

        // 检查父菜单是否存在
        if (StringUtils.hasText(menuCreateDto.getParentId()) &&
                !menuRepository.existsById(menuCreateDto.getParentId())) {
            throw new MenuException("PARENT_MENU_NOT_EXISTS", "父菜单不存在: " + menuCreateDto.getParentId());
        }

        // 创建菜单实体
        Menu menu = new Menu();
        menu.setState(Menu.MenuState.ENABLED);
        BeanUtils.copyProperties(menuCreateDto, menu);

        // 保存菜单
        Menu savedMenu = menuRepository.save(menu);

        // 转换为DTO返回
        return convertToMenuDto(savedMenu);
    }

    @Override
    @Transactional(readOnly = true)
    public MenuDto getMenuById(String menuId) {
        Optional<Menu> menuOpt = menuRepository.findById(menuId);
        if (!menuOpt.isPresent()) {
            throw new MenuException("MENU_NOT_FOUND", "菜单不存在");
        }
        return convertToMenuDto(menuOpt.get());
    }

    @Override
    @Transactional(readOnly = true)
    public MenuDto getMenuByName(String menuName) {
        Optional<Menu> menuOpt = menuRepository.findByMenuName(menuName);
        if (!menuOpt.isPresent()) {
            throw new MenuException("MENU_NOT_FOUND", "菜单不存在");
        }
        return convertToMenuDto(menuOpt.get());
    }

    @Override
    public MenuDto updateMenu(MenuUpdateDto menuUpdateDto) {
        Optional<Menu> menuOpt = menuRepository.findById(menuUpdateDto.getMenuId());
        if (!menuOpt.isPresent()) {
            throw new MenuException("MENU_NOT_EXISTS", "菜单不存在: " + menuUpdateDto.getMenuId());
        }

        Menu menu = menuOpt.get();

        // 更新非空字段
        if (StringUtils.hasText(menuUpdateDto.getMenuName())) {
            menu.setMenuName(menuUpdateDto.getMenuName());
        }
        if (menuUpdateDto.getMenuType() != null) {
            menu.setMenuType(menuUpdateDto.getMenuType());
        }
        if (menuUpdateDto.getParentId() != null) {
            menu.setParentId(menuUpdateDto.getParentId());
        }
        if (menuUpdateDto.getUrl() != null) {
            menu.setUrl(menuUpdateDto.getUrl());
        }
        if (menuUpdateDto.getMenuIcon() != null) {
            menu.setMenuIcon(menuUpdateDto.getMenuIcon());
        }
        if (menuUpdateDto.getSeq() != null) {
            menu.setSeq(menuUpdateDto.getSeq());
        }
        if (menuUpdateDto.getMenuDescr() != null) {
            menu.setMenuDescr(menuUpdateDto.getMenuDescr());
        }

        Menu savedMenu = menuRepository.save(menu);
        return convertToMenuDto(savedMenu);
    }

    @Override
    @Transactional
    public boolean deleteMenu(String menuId) {
        if (!menuRepository.existsById(menuId)) {
            throw new MenuException("MENU_DELETE_FAILED", "菜单删除失败，菜单不存在");
        }

        // 检查是否有子菜单
        long childCount = menuRepository.countByParentId(menuId);
        if (childCount > 0) {
            throw new MenuException("HAS_CHILD_MENUS", "存在子菜单，无法删除");
        }

        // 删除角色菜单关联
        roleMenuRelaRepository.deleteByMenuId(menuId);

        // 删除菜单
        menuRepository.deleteById(menuId);
        return true;
    }

    @Override
    public boolean enableMenu(String menuId) {
        Optional<Menu> menuOpt = menuRepository.findById(menuId);
        if (!menuOpt.isPresent()) {
            throw new MenuException("MENU_ENABLE_FAILED", "菜单启用失败，菜单不存在");
        }

        Menu menu = menuOpt.get();
        menu.setState(Menu.MenuState.ENABLED);
        menuRepository.save(menu);
        return true;
    }

    @Override
    public boolean disableMenu(String menuId) {
        Optional<Menu> menuOpt = menuRepository.findById(menuId);
        if (!menuOpt.isPresent()) {
            throw new MenuException("MENU_DISABLE_FAILED", "菜单禁用失败，菜单不存在");
        }

        Menu menu = menuOpt.get();
        menu.setState(Menu.MenuState.DISABLED);
        menuRepository.save(menu);
        return true;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MenuDto> searchMenus(MenuQueryDto menuQueryDto) {
        StringBuilder sql = new StringBuilder(
                "select m.menu_id, m.menu_name, m.menu_label, m.menu_type, " +
                        "m.parent_id, p.menu_name as parent_name, " +
                        "m.url, m.menu_icon, m.seq, m.state, m.menu_descr, " +
                        "m.create_date, m.create_user, " +
                        "m.update_date, m.update_user " +
                        "from menu m " +
                        "left join menu p on m.parent_id = p.menu_id " +
                        "where 1=1 "
        );

        StringBuilder countSql = new StringBuilder(
                "select count(1) from menu m where 1=1 "
        );

        Map<String, Object> params = new HashMap<>();

        // 动态条件
        JdbcQueryHelper.lowerLike(
                "menuName",
                menuQueryDto.getMenuName(),
                " and lower(m.menu_name) like :menuName ",
                params, jdbcTemplate, sql, countSql
        );

        if (menuQueryDto.getMenuType() != null) {
            JdbcQueryHelper.equals(
                    "menuType",
                    menuQueryDto.getMenuType().name(),
                    " and m.menu_type = :menuType ",
                    params, sql, countSql
            );
        }

        JdbcQueryHelper.equals(
                "parentId",
                menuQueryDto.getParentId(),
                " and m.parent_id = :parentId ",
                params, sql, countSql
        );

        if (menuQueryDto.getState() != null) {
            JdbcQueryHelper.equals(
                    "state",
                    menuQueryDto.getState().name(),
                    " and m.state = :state ",
                    params, sql, countSql
            );
        }

        // 排序
        JdbcQueryHelper.order(menuQueryDto.getSortColumn(), menuQueryDto.getSortType(), sql);

        // 分页
        String pageSql = JdbcQueryHelper.getLimitSql(
                jdbcTemplate,
                sql.toString(),
                menuQueryDto.getPageNum(),
                menuQueryDto.getPageSize()
        );

        // 查询数据
        List<MenuDto> menus = jdbcTemplate.query(pageSql, params, (rs, rowNum) ->
                new MenuDto(
                        rs.getString("menu_id"),
                        rs.getString("menu_name"),
                        rs.getString("menu_label"),
                        rs.getString("menu_type") != null ? Menu.MenuType.valueOf(rs.getString("menu_type")) : null,
                        rs.getString("parent_id"),
                        rs.getString("parent_name"),
                        rs.getString("url"),
                        rs.getString("menu_icon"),
                        rs.getObject("seq") != null ? rs.getInt("seq") : null,
                        rs.getString("state") != null ? Menu.MenuState.valueOf(rs.getString("state")) : null,
                        rs.getString("menu_descr"),
                        rs.getTimestamp("create_date") != null ? rs.getTimestamp("create_date").toLocalDateTime() : null,
                        rs.getString("create_user"),
                        rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime() : null,
                        rs.getString("update_user"),
                        null // children 树形结构由前端或额外逻辑组装，这里置空
                )
        );

        // 查询总数
        Long total = jdbcTemplate.queryForObject(countSql.toString(), params, Long.class);

        return new PageImpl<>(
                menus,
                PageRequest.of(menuQueryDto.getPageNum(), menuQueryDto.getPageSize()),
                total
        );
    }


    @Override
    @Transactional(readOnly = true)
    public List<MenuDto> getMenuTree() {
        List<Menu> allMenus = menuRepository.findAll();
        return buildMenuTree(allMenus);
    }

    /**
     * 将ModoMenu实体转换为MenuDto
     */
    @Override
    public MenuDto convertToMenuDto(Menu menu) {
        MenuDto dto = new MenuDto();
        BeanUtils.copyProperties(menu, dto);
        return dto;
    }

    /**
     * 构建菜单树
     */
    @Override
    public List<MenuDto> buildMenuTree(List<Menu> menus) {
        if (menus == null || menus.isEmpty()) {
            return new ArrayList<>();
        }

        // 转换为TreeDto
        List<MenuDto> treeDtos = menus.stream()
                .map(this::convertToMenuDto)
                .collect(Collectors.toList());

        // 构建父子关系映射
        Map<String, List<MenuDto>> parentChildMap = new HashMap<>();
        List<MenuDto> rootNodes = new ArrayList<>();

        for (MenuDto dto : treeDtos) {
            if (dto.getParentId() == null || dto.getParentId().trim().isEmpty()) {
                rootNodes.add(dto);
            } else {
                parentChildMap.computeIfAbsent(dto.getParentId(), k -> new ArrayList<>()).add(dto);
            }
        }

        // 递归设置子节点
        setChildren(rootNodes, parentChildMap);

        // 按序号排序
        rootNodes.sort(Comparator.comparingInt(MenuDto::getSeq));

        return rootNodes;
    }

    /**
     * 递归设置子节点
     */
    private void setChildren(List<MenuDto> nodes, Map<String, List<MenuDto>> parentChildMap) {
        for (MenuDto node : nodes) {

            List<MenuDto> children = parentChildMap.get(node.getMenuId());
            if (children != null && !children.isEmpty()) {
                // 排序子节点
                children.sort(Comparator.comparingInt(MenuDto::getSeq));
                node.setChildren(children);

                // 递归设置子节点的子节点
                setChildren(children, parentChildMap);
            } else {
                node.setChildren(new ArrayList<>());
            }
        }
    }
}