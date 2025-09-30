package com.ck.quiz.category.service.impl;

import com.ck.quiz.category.dto.CategoryCreateDto;
import com.ck.quiz.category.dto.CategoryDto;
import com.ck.quiz.category.dto.CategoryQueryDto;
import com.ck.quiz.category.dto.CategoryUpdateDto;
import com.ck.quiz.category.entity.Category;
import com.ck.quiz.category.exception.CategoryException;
import com.ck.quiz.category.repository.CategoryRepository;
import com.ck.quiz.category.service.CategoryService;
import com.ck.quiz.common.util.IdHelper;
import com.ck.quiz.common.util.JdbcQueryHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;

/**
 * 分类服务实现类
 * 实现分类管理的具体业务逻辑
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final NamedParameterJdbcTemplate namedParameterJdbcTemplate;
    private final IdHelper idHelper;
    private final JdbcQueryHelper jdbcQueryHelper;

    @Override
    @Transactional
    public CategoryDto createCategory(CategoryCreateDto createDto) {
        log.info("创建分类: {}", createDto.getName());

        // 检查分类名称是否已存在
        if (checkCategoryNameExists(createDto.getName(), null)) {
            throw new CategoryException("CATEGORY_NAME_EXISTS", "分类名称已存在: " + createDto.getName());
        }

        // 创建分类实体
        Category category = new Category();
        category.setId(idHelper.generateId());
        BeanUtils.copyProperties(createDto, category);

        // 保存分类
        Category savedCategory = categoryRepository.save(category);
        log.info("分类创建成功，ID: {}", savedCategory.getId());

        return convertToDto(savedCategory);
    }

    @Override
    @Transactional
    public CategoryDto updateCategory(CategoryUpdateDto updateDto) {
        log.info("更新分类: {}", updateDto.getId());

        // 检查分类是否存在
        Category existingCategory = categoryRepository.findById(updateDto.getId())
                .orElseThrow(() -> new CategoryException("CATEGORY_NOT_FOUND", "分类不存在: " + updateDto.getId()));

        // 检查分类名称是否已被其他分类使用
        if (checkCategoryNameExists(updateDto.getName(), updateDto.getId())) {
            throw new CategoryException("CATEGORY_NAME_EXISTS", "分类名称已存在: " + updateDto.getName());
        }

        // 更新分类信息
        BeanUtils.copyProperties(updateDto, existingCategory, "id", "createDate", "createUser");

        // 保存更新
        Category updatedCategory = categoryRepository.save(existingCategory);
        log.info("分类更新成功，ID: {}", updatedCategory.getId());

        return convertToDto(updatedCategory);
    }

    @Override
    @Transactional
    public void deleteCategory(String id) {
        log.info("删除分类: {}", id);

        // 检查分类是否存在
        if (!categoryRepository.existsById(id)) {
            throw new CategoryException("CATEGORY_NOT_FOUND", "分类不存在: " + id);
        }

        // 检查是否有子分类
        List<Category> childCategories = categoryRepository.findByParentId(id);
        if (!childCategories.isEmpty()) {
            throw new CategoryException("CATEGORY_HAS_CHILDREN", "该分类下存在子分类，无法删除");
        }

        // 删除分类
        categoryRepository.deleteById(id);
        log.info("分类删除成功，ID: {}", id);
    }

    @Override
    public CategoryDto getCategoryById(String id) {
        log.debug("根据ID获取分类: {}", id);

        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new CategoryException("CATEGORY_NOT_FOUND", "分类不存在: " + id));

        return convertToDto(category);
    }

    @Override
    public CategoryDto getCategoryByName(String name) {
        log.debug("根据名称获取分类: {}", name);

        Category category = categoryRepository.findByName(name)
                .orElseThrow(() -> new CategoryException("CATEGORY_NOT_FOUND", "分类不存在: " + name));

        return convertToDto(category);
    }

    @Override
    public Page<CategoryDto> searchCategories(CategoryQueryDto queryDto) {
        log.debug("分页查询分类: {}", queryDto);

        // 构建查询SQL
        StringBuilder sql = new StringBuilder("SELECT * FROM category WHERE 1=1");
        MapSqlParameterSource params = new MapSqlParameterSource();

        // 添加查询条件
        if (StringUtils.hasText(queryDto.getName())) {
            sql.append(" AND name LIKE :name");
            params.addValue("name", "%" + queryDto.getName() + "%");
        }

        if (StringUtils.hasText(queryDto.getParentId())) {
            sql.append(" AND parent_id = :parentId");
            params.addValue("parentId", queryDto.getParentId());
        }

        if (StringUtils.hasText(queryDto.getSubjectId())) {
            sql.append(" AND subject_id = :subjectId");
            params.addValue("subjectId", queryDto.getSubjectId());
        }

        if (queryDto.getLevel() != null) {
            sql.append(" AND level = :level");
            params.addValue("level", queryDto.getLevel());
        }

        // 添加排序
        sql.append(" ORDER BY ").append(queryDto.getSortColumn()).append(" ").append(queryDto.getSortType());

        // 执行分页查询
        Pageable pageable = PageRequest.of(queryDto.getPageNum() - 1, queryDto.getPageSize());
        Page<Category> categoryPage = jdbcQueryHelper.queryForPage(sql.toString(), params, Category.class, pageable);

        // 转换为DTO
        List<CategoryDto> categoryDtos = categoryPage.getContent().stream()
                .map(this::convertToDto)
                .toList();

        return new PageImpl<>(categoryDtos, pageable, categoryPage.getTotalElements());
    }

    @Override
    public List<CategoryDto> getAllCategories() {
        log.debug("获取所有分类");

        List<Category> categories = categoryRepository.findAll();
        return categories.stream()
                .map(this::convertToDto)
                .toList();
    }

    @Override
    public List<CategoryDto> getCategoriesBySubjectId(String subjectId) {
        log.debug("根据学科ID获取分类: {}", subjectId);

        List<Category> categories = categoryRepository.findBySubjectId(subjectId);
        return categories.stream()
                .map(this::convertToDto)
                .toList();
    }

    @Override
    public List<CategoryDto> getCategoriesByParentId(String parentId) {
        log.debug("根据父分类ID获取子分类: {}", parentId);

        List<Category> categories = categoryRepository.findByParentId(parentId);
        return categories.stream()
                .map(this::convertToDto)
                .toList();
    }

    @Override
    public List<CategoryDto> getCategoriesByLevel(Integer level) {
        log.debug("根据层级获取分类: {}", level);

        List<Category> categories = categoryRepository.findByLevel(level);
        return categories.stream()
                .map(this::convertToDto)
                .toList();
    }

    @Override
    public boolean checkCategoryNameExists(String name, String excludeId) {
        log.debug("检查分类名称是否存在: {}, 排除ID: {}", name, excludeId);

        if (StringUtils.hasText(excludeId)) {
            return categoryRepository.existsByNameAndIdNot(name, excludeId);
        } else {
            return categoryRepository.existsByName(name);
        }
    }

    @Override
    public CategoryDto convertToDto(Category category) {
        if (category == null) {
            return null;
        }

        CategoryDto dto = new CategoryDto();
        BeanUtils.copyProperties(category, dto);

        // 获取父分类名称
        if (StringUtils.hasText(category.getParentId())) {
            Optional<Category> parentCategory = categoryRepository.findById(category.getParentId());
            parentCategory.ifPresent(parent -> dto.setParentName(parent.getName()));
        }

        // 获取学科名称（这里需要根据实际情况调用学科服务）
        // 暂时设置为空，后续可以通过注入学科服务来获取
        dto.setSubjectName(null);

        // 设置用户名称（这里需要根据实际情况调用用户服务）
        // 暂时设置为空，后续可以通过注入用户服务来获取
        dto.setCreateUserName(null);
        dto.setUpdateUserName(null);

        return dto;
    }

}