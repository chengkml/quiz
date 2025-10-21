package com.ck.quiz.category.service;

import com.ck.quiz.category.dto.CategoryCreateDto;
import com.ck.quiz.category.dto.CategoryDto;
import com.ck.quiz.category.dto.CategoryQueryDto;
import com.ck.quiz.category.dto.CategoryUpdateDto;
import com.ck.quiz.category.entity.Category;
import com.ck.quiz.subject.dto.SubjectDto;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

/**
 * 分类服务接口
 * 定义分类管理的核心业务操作
 */
public interface CategoryService {

    /**
     * 创建新分类
     *
     * @param createDto 分类创建信息
     * @return 创建的分类信息
     */
    CategoryDto createCategory(CategoryCreateDto createDto);

    /**
     * 更新分类信息
     *
     * @param updateDto 分类更新信息
     * @return 更新后的分类信息
     */
    CategoryDto updateCategory(CategoryUpdateDto updateDto);

    /**
     * 删除分类
     *
     * @param id 分类ID
     */
    void deleteCategory(String id);

    /**
     * 根据ID获取分类信息
     *
     * @param id 分类ID
     * @return 分类信息
     */
    CategoryDto getCategoryById(String id);

    /**
     * 根据名称获取分类信息
     *
     * @param name 分类名称
     * @return 分类信息
     */
    CategoryDto getCategoryByName(String name);

    /**
     * 分页查询分类
     *
     * @param queryDto 查询条件
     * @return 分页分类列表
     */
    Page<CategoryDto> searchCategories(CategoryQueryDto queryDto);

    /**
     * 获取所有分类
     *
     * @return 所有分类列表
     */
    List<CategoryDto> getAllCategories();

    /**
     * 根据学科ID获取分类列表
     *
     * @param subjectId 学科ID
     * @return 分类列表
     */
    List<CategoryDto> getCategoriesBySubjectId(String subjectId);

    /**
     * 根据父分类ID获取子分类列表
     *
     * @param parentId 父分类ID
     * @return 子分类列表
     */
    List<CategoryDto> getCategoriesByParentId(String parentId);

    /**
     * 根据层级获取分类列表
     *
     * @param level 分类层级
     * @return 分类列表
     */
    List<CategoryDto> getCategoriesByLevel(Integer level);

    /**
     * 检查分类名称是否存在
     *
     * @param name 分类名称
     * @param excludeId 排除的分类ID（用于更新时检查）
     * @return 是否存在
     */
    boolean checkCategoryNameExists(String name, String excludeId);

    /**
     * 将分类实体转换为DTO
     *
     * @param category 分类实体
     * @return 分类DTO
     */
    CategoryDto convertToDto(Category category);

    List<SubjectDto> getSubjectCategoryTree();

    void initCategoryQuestions(String userId, String categoryId, int questionNum);

    default void initCategoryQuestions(String categoryId, int questionNum) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        initCategoryQuestions(authentication.getName(), categoryId, questionNum);
    }

    void initCategoryQuestionsAsync(String categoryId, int questionNum);
}