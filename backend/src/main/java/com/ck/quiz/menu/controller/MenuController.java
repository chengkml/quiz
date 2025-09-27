package com.ck.quiz.menu.controller;

import com.ck.quiz.menu.dto.MenuCreateDto;
import com.ck.quiz.menu.dto.MenuQueryDto;
import com.ck.quiz.menu.dto.MenuUpdateDto;
import com.ck.quiz.menu.entity.Menu;
import com.ck.quiz.menu.service.MenuService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "菜单管理", description = "菜单管理相关接口")
@RestController
@RequestMapping("/api/menu")
public class MenuController {

    @Autowired
    private MenuService menuService;

    @Operation(summary = "创建菜单", description = "创建新的菜单项")
    @PostMapping("create")
    public ResponseEntity createMenu(
            @Parameter(description = "菜单创建信息", required = true) @Valid @RequestBody MenuCreateDto menuCreateDto) {
        return ResponseEntity.ok(menuService.createMenu(menuCreateDto));
    }

    @Operation(summary = "获取菜单详情", description = "根据菜单ID获取菜单的详细信息")
    @GetMapping("/{menuId}")
    public ResponseEntity getMenuById(
            @Parameter(description = "菜单ID", required = true) @PathVariable String menuId) {
        return ResponseEntity.ok(menuService.getMenuById(menuId));
    }

    @Operation(summary = "根据名称获取菜单", description = "根据菜单名称获取菜单信息")
    @GetMapping("/name/{menuName}")
    public ResponseEntity getMenuByName(
            @Parameter(description = "菜单名称", required = true) @PathVariable String menuName) {
        return ResponseEntity.ok(menuService.getMenuByName(menuName));
    }

    @Operation(summary = "分页查询菜单", description = "根据条件分页查询菜单列表")
    @GetMapping
    public ResponseEntity searchMenus(
            @Parameter(description = "菜单名称") @RequestParam(required = false) String menuName,
            @Parameter(description = "菜单类型") @RequestParam(required = false) Menu.MenuType menuType,
            @Parameter(description = "父菜单ID") @RequestParam(required = false) String parentId,
            @Parameter(description = "菜单状态") @RequestParam(required = false) Menu.MenuState state,
            @Parameter(description = "页码") @RequestParam(defaultValue = "0") int pageNum,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "20") int pageSize,
            @Parameter(description = "排序字段") @RequestParam(defaultValue = "seq") String sortColumn,
            @Parameter(description = "排序方向") @RequestParam(defaultValue = "asc") String sortType) {
        MenuQueryDto queryDto = new MenuQueryDto();
        queryDto.setMenuName(menuName);
        queryDto.setMenuType(menuType);
        queryDto.setParentId(parentId);
        queryDto.setState(state);
        queryDto.setPageNum(pageNum);
        queryDto.setPageSize(pageSize);
        queryDto.setSortColumn(sortColumn);
        queryDto.setSortType(sortType);
        return ResponseEntity.ok(menuService.searchMenus(queryDto));
    }

    @Operation(summary = "更新菜单", description = "更新指定菜单的信息")
    @PutMapping("/{menuId}/update")
    public ResponseEntity updateMenu(
            @Parameter(description = "菜单ID", required = true) @PathVariable String menuId,
            @Parameter(description = "菜单更新信息", required = true) @Valid @RequestBody MenuUpdateDto menuUpdateDto) {
        menuUpdateDto.setMenuId(menuId);
        return ResponseEntity.ok(menuService.updateMenu(menuUpdateDto));
    }

    @Operation(summary = "删除菜单", description = "删除指定的菜单")
    @DeleteMapping("/{menuId}/delete")
    public ResponseEntity deleteMenu(
            @Parameter(description = "菜单ID", required = true) @PathVariable String menuId) {
        return ResponseEntity.ok(menuService.deleteMenu(menuId));
    }

    @Operation(summary = "启用菜单", description = "启用指定的菜单")
    @PostMapping("/{menuId}/enable")
    public ResponseEntity enableMenu(
            @Parameter(description = "菜单ID", required = true) @PathVariable String menuId) {
        return ResponseEntity.ok(menuService.enableMenu(menuId));
    }

    @Operation(summary = "禁用菜单", description = "禁用指定的菜单")
    @PostMapping("/{menuId}/disable")
    public ResponseEntity disableMenu(
            @Parameter(description = "菜单ID", required = true) @PathVariable String menuId) {
        return ResponseEntity.ok(menuService.disableMenu(menuId));
    }

    @Operation(summary = "获取菜单树", description = "获取完整的菜单树形结构")
    @GetMapping("/tree")
    public ResponseEntity getMenuTree() {
        return ResponseEntity.ok(menuService.getMenuTree());
    }

}
