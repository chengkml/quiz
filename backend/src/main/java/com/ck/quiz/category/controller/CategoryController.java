package com.ck.quiz.category.controller;

import com.ck.quiz.base.controller.BaseController;
import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.category.dto.CategoryCreateDto;
import com.ck.quiz.category.dto.CategoryDto;
import com.ck.quiz.category.dto.CategoryQueryDto;
import com.ck.quiz.category.dto.CategoryUpdateDto;
import com.ck.quiz.category.service.CategoryService;
import com.ck.quiz.subject.dto.SubjectDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "目录管理", description = "目录相关的API接口")
@RestController
@RequestMapping("/api/category")
public class CategoryController
        extends BaseController<CategoryCreateDto, CategoryUpdateDto, CategoryQueryDto, CategoryDto> {

    @Autowired
    private CategoryService categoryService;

    @Operation(summary = "检查目录名称", description = "检查目录名称是否已存在")
    @GetMapping("/check/name")
    public ResponseEntity<Boolean> checkCategoryName(
            @Parameter(description = "目录名称", required = true) @RequestParam("categoryName") String categoryName,
            @Parameter(description = "排除的目录ID") @RequestParam(value = "excludeCategoryId", required = false) String excludeCategoryId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity
                .ok(categoryService.checkNameUniq(authentication.getName(), categoryName, excludeCategoryId));
    }

    @Operation(summary = "获取学科目录树", description = "获取学科目录树")
    @GetMapping("/subject-category-tree")
    public ResponseEntity<List<SubjectDto>> getSubjectCategoryTree() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        List<SubjectDto> subjectDtos = categoryService.getSubjectCategoryTree(authentication.getName());
        return ResponseEntity.ok(subjectDtos);
    }

    @Override
    protected BaseService<CategoryCreateDto, CategoryUpdateDto, CategoryQueryDto, CategoryDto, ?> getService() {
        return categoryService;
    }

}