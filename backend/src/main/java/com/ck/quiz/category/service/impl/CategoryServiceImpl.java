package com.ck.quiz.category.service.impl;

import com.ck.quiz.category.dto.CategoryCreateDto;
import com.ck.quiz.category.dto.CategoryDto;
import com.ck.quiz.category.dto.CategoryQueryDto;
import com.ck.quiz.category.dto.CategoryUpdateDto;
import com.ck.quiz.category.entity.Category;
import com.ck.quiz.category.exception.CategoryException;
import com.ck.quiz.category.repository.CategoryRepository;
import com.ck.quiz.category.service.CategoryService;
import com.ck.quiz.subject.dto.SubjectDto;
import com.ck.quiz.subject.service.SubjectService;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 分类服务实现类
 * 实现分类管理的具体业务逻辑
 */
@Service
@Slf4j
public class CategoryServiceImpl implements CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private NamedParameterJdbcTemplate namedParameterJdbcTemplate;

    @Autowired
    private SubjectService subjectService;

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
        category.setId(IdHelper.genUuid());
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
    @Transactional(readOnly = true)
    public Page<CategoryDto> searchCategories(CategoryQueryDto queryDto) {
        StringBuilder sql = new StringBuilder("select c.*, u.user_name create_user_name, s.name subject_name from category c left join user u on u.user_id = c.create_user left join subject s on s.subject_id = c.subject_id where 1=1 ");
        StringBuilder countSql = new StringBuilder("select count(1) from category where 1=1 ");
        Map<String, Object> params = new HashMap<>();

        // 分类名称模糊查询
        JdbcQueryHelper.lowerLike("categoryName", queryDto.getName(),
                " and lower(name) like :categoryName ", params, namedParameterJdbcTemplate, sql, countSql);

        // 父分类 ID
        JdbcQueryHelper.equals("parentId", queryDto.getParentId(),
                " and parent_id = :parentId ", params, sql, countSql);

        // 学科 ID
        JdbcQueryHelper.equals("subjectId", queryDto.getSubjectId(),
                " and subject_id = :subjectId ", params, sql, countSql);

        // 分类层级
        if (queryDto.getLevel() != null) {
            sql.append(" and level = :level ");
            countSql.append(" and level = :level ");
            params.put("level", queryDto.getLevel());
        }

        // 排序
        JdbcQueryHelper.order(queryDto.getSortColumn(), queryDto.getSortType(), sql);

        // 分页（注意 pageNum 从 1 开始，JdbcQueryHelper 偏移量是 pageNum * pageSize）
        int pageNum = Math.max(0, queryDto.getPageNum() - 1);
        String limitSql = JdbcQueryHelper.getLimitSql(
                namedParameterJdbcTemplate,
                sql.toString(),
                pageNum,
                queryDto.getPageSize()
        );

        // 查询数据
        List<CategoryDto> categories = namedParameterJdbcTemplate.query(
                limitSql,
                params,
                (rs, rowNum) -> {
                    CategoryDto c = new CategoryDto();
                    c.setId(rs.getString("category_id"));
                    c.setName(rs.getString("name"));
                    c.setParentId(rs.getString("parent_id"));
                    c.setSubjectName(rs.getString("subject_name"));
                    c.setLevel(rs.getInt("level"));
                    c.setDescription(rs.getString("description"));
                    c.setCreateDate(rs.getTimestamp("create_date").toLocalDateTime());
                    c.setUpdateDate(rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime() : null);
                    c.setCreateUser(rs.getString("create_user"));
                    c.setCreateUserName(rs.getString("create_user_name"));
                    c.setUpdateUser(rs.getString("update_user"));
                    return c;
                }
        );

        // 封装分页结果
        return JdbcQueryHelper.toPage(
                namedParameterJdbcTemplate,
                countSql.toString(),
                params,
                categories,
                pageNum,
                queryDto.getPageSize()
        );
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

    @Override
    public List<SubjectDto> getSubjectCategoryTree() {
        log.info("获取学科分类树");
        
        // 1. 获取所有学科
        List<SubjectDto> subjects = subjectService.getAllSubjects();
        
        // 2. 为每个学科构建分类树
        for (SubjectDto subject : subjects) {
            // 获取该学科下的所有分类
            List<CategoryDto> categories = getCategoriesBySubjectId(subject.getId());
            
            // 构建树形结构
            List<CategoryDto> categoryTree = buildCategoryTree(categories);
            
            // 设置到学科对象中
            subject.setCategories(categoryTree);
        }
        
        return subjects;
    }
    
    /**
     * 构建分类树形结构
     * 
     * @param categories 分类列表
     * @return 树形结构的分类列表
     */
    private List<CategoryDto> buildCategoryTree(List<CategoryDto> categories) {
        if (categories == null || categories.isEmpty()) {
            return List.of();
        }
        
        // 创建ID到分类的映射
        Map<String, CategoryDto> categoryMap = new HashMap<>();
        for (CategoryDto category : categories) {
            categoryMap.put(category.getId(), category);
            category.setChildren(new ArrayList<>());
        }
        
        // 构建树形结构
        List<CategoryDto> rootCategories = new ArrayList<>();
        for (CategoryDto category : categories) {
            if (category.getParentId() == null || category.getParentId().isEmpty()) {
                // 根节点
                rootCategories.add(category);
            } else {
                // 子节点，添加到父节点的children中
                CategoryDto parent = categoryMap.get(category.getParentId());
                if (parent != null) {
                    parent.getChildren().add(category);
                }
            }
        }
        
        return rootCategories;
    }

}