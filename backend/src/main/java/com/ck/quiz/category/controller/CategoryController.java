package com.ck.quiz.category.controller;

import com.ck.quiz.category.dto.CategoryCreateDto;
import com.ck.quiz.category.dto.CategoryDto;
import com.ck.quiz.category.dto.CategoryQueryDto;
import com.ck.quiz.category.dto.CategoryUpdateDto;
import com.ck.quiz.category.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 分类管理控制器
 * 提供分类相关的REST API接口
 */
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Tag(name = "分类管理", description = "分类管理相关API")
public class CategoryController {

    private final CategoryService categoryService;

    /**
     * 创建新分类
     *
     * @param createDto 分类创建信息
     * @return 创建的分类信息
     */
    @PostMapping
    @Operation(summary = "创建分类", description = "创建一个新的分类")
    public ResponseEntity<CategoryDto> createCategory(
            @Valid @RequestBody CategoryCreateDto createDto) {
        CategoryDto category = categoryService.createCategory(createDto);
        return ResponseEntity.ok(category);
    }

    /**
     * 更新分类信息
     *
     * @param updateDto 分类更新信息
     * @return 更新后的分类信息
     */
    @PutMapping
    @Operation(summary = "更新分类", description = "更新现有分类的信息")
    public ResponseEntity<CategoryDto> updateCategory(
            @Valid @RequestBody CategoryUpdateDto updateDto) {
        CategoryDto category = categoryService.updateCategory(updateDto);
        return ResponseEntity.ok(category);
    }

    /**
     * 删除分类
     *
     * @param id 分类ID
     * @return 删除结果
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "删除分类", description = "根据ID删除分类")
    public ResponseEntity<Void> deleteCategory(
            @Parameter(description = "分类ID") @PathVariable String id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok().build();
    }

    /**
     * 根据ID获取分类信息
     *
     * @param id 分类ID
     * @return 分类信息
     */
    @GetMapping("/{id}")
    @Operation(summary = "获取分类详情", description = "根据ID获取分类详细信息")
    public ResponseEntity<CategoryDto> getCategoryById(
            @Parameter(description = "分类ID") @PathVariable String id) {
        CategoryDto category = categoryService.getCategoryById(id);
        return ResponseEntity.ok(category);
    }

    /**
     * 根据名称获取分类信息
     *
     * @param name 分类名称
     * @return 分类信息
     */
    @GetMapping("/name/{name}")
    @Operation(summary = "根据名称获取分类", description = "根据分类名称获取分类信息")
    public ResponseEntity<CategoryDto> getCategoryByName(
            @Parameter(description = "分类名称") @PathVariable String name) {
        CategoryDto category = categoryService.getCategoryByName(name);
        return ResponseEntity.ok(category);
    }

    /**
     * 分页查询分类
     *
     * @param queryDto 查询条件
     * @return 分页分类列表
     */
    @PostMapping("/search")
    @Operation(summary = "分页查询分类", description = "根据条件分页查询分类列表")
    public ResponseEntity<Page<CategoryDto>> searchCategories(
            @RequestBody CategoryQueryDto queryDto) {
        Page<CategoryDto> categories = categoryService.searchCategories(queryDto);
        return ResponseEntity.ok(categories);
    }

    /**
     * 获取所有分类
     *
     * @return 所有分类列表
     */
    @GetMapping("/all")
    @Operation(summary = "获取所有分类", description = "获取系统中所有分类的列表")
    public ResponseEntity<List<CategoryDto>> getAllCategories() {
        List<CategoryDto> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(categories);
    }

    /**
     * 根据学科ID获取分类列表
     *
     * @param subjectId 学科ID
     * @return 分类列表
     */
    @GetMapping("/subject/{subjectId}")
    @Operation(summary = "根据学科获取分类", description = "根据学科ID获取该学科下的所有分类")
    public ResponseEntity<List<CategoryDto>> getCategoriesBySubjectId(
            @Parameter(description = "学科ID") @PathVariable String subjectId) {
        List<CategoryDto> categories = categoryService.getCategoriesBySubjectId(subjectId);
        return ResponseEntity.ok(categories);
    }

    /**
     * 根据父分类ID获取子分类列表
     *
     * @param parentId 父分类ID
     * @return 子分类列表
     */
    @GetMapping("/parent/{parentId}")
    @Operation(summary = "获取子分类", description = "根据父分类ID获取子分类列表")
    public ResponseEntity<List<CategoryDto>> getCategoriesByParentId(
            @Parameter(description = "父分类ID") @PathVariable String parentId) {
        List<CategoryDto> categories = categoryService.getCategoriesByParentId(parentId);
        return ResponseEntity.ok(categories);
    }

    /**
     * 根据层级获取分类列表
     *
     * @param level 分类层级
     * @return 分类列表
     */
    @GetMapping("/level/{level}")
    @Operation(summary = "根据层级获取分类", description = "根据层级获取分类列表")
    public ResponseEntity<List<CategoryDto>> getCategoriesByLevel(
            @Parameter(description = "分类层级") @PathVariable Integer level) {
        List<CategoryDto> categories = categoryService.getCategoriesByLevel(level);
        return ResponseEntity.ok(categories);
    }

    /**
     * 检查分类名称是否存在
     *
     * @param name 分类名称
     * @param excludeId 排除的分类ID（用于更新时检查）
     * @return 是否存在
     */
    @GetMapping("/check-name")
    @Operation(summary = "检查分类名称", description = "检查分类名称是否已存在")
    public ResponseEntity<Boolean> checkCategoryNameExists(
            @Parameter(description = "分类名称") @RequestParam String name,
            @Parameter(description = "排除的分类ID") @RequestParam(required = false) String excludeId) {
        boolean exists = categoryService.checkCategoryNameExists(name, excludeId);
        return ResponseEntity.ok(exists);
    }

    

}