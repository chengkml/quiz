package com.ck.quiz.category.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.category.dto.CategoryCreateDto;
import com.ck.quiz.category.dto.CategoryDto;
import com.ck.quiz.category.dto.CategoryQueryDto;
import com.ck.quiz.category.dto.CategoryUpdateDto;
import com.ck.quiz.category.entity.Category;
import com.ck.quiz.category.repository.CategoryRepository;
import com.ck.quiz.category.service.CategoryService;
import com.ck.quiz.knowledge.service.KnowledgeService;
import com.ck.quiz.question.service.QuestionService;
import com.ck.quiz.subject.dto.SubjectDto;
import com.ck.quiz.subject.entity.Subject;
import com.ck.quiz.subject.repository.SubjectRepository;
import com.ck.quiz.subject.service.SubjectService;
import com.ck.quiz.utils.JdbcQueryHelper;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
public class CategoryServiceImpl extends
        BaseServiceImpl<CategoryCreateDto, CategoryUpdateDto, CategoryQueryDto, CategoryDto, Category, CategoryRepository>
        implements CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private SubjectService subjectService;

    @Autowired
    private SubjectRepository subjectRepository;

    @Lazy
    @Autowired
    private KnowledgeService knowledgeService;

    @Lazy
    @Autowired
    private QuestionService questionService;

    @Override
    public Page<CategoryDto> search(String userId, CategoryQueryDto queryDto) {
        StringBuilder sql = new StringBuilder(
                "select c.* from category c where 1=1 ");
        StringBuilder countSql = new StringBuilder("select count(1) from category c where 1=1 ");
        Map<String, Object> params = new HashMap<>();

        JdbcQueryHelper.lowerLike("keyWord", queryDto.getKeyWord(),
                " and lower(c.name) like :keyWord ", params, namedParameterJdbcTemplate, sql, countSql);

        JdbcQueryHelper.equals("parentId", queryDto.getParentId(),
                " and c.parent_id = :parentId ", params, sql, countSql);

        JdbcQueryHelper.equals("subjectId", queryDto.getSubjectId(),
                " and c.subject_id = :subjectId ", params, sql, countSql);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            JdbcQueryHelper.equals("createUser", userId,
                    " AND c.create_user = :createUser ", params, sql, countSql);
        }

        JdbcQueryHelper.order("c.create_date", "desc", sql);

        String limitSql = JdbcQueryHelper.getLimitSql(
                namedParameterJdbcTemplate,
                sql.toString(),
                queryDto.getPageNum(),
                queryDto.getPageSize());

        List<Category> categories = namedParameterJdbcTemplate.query(
                limitSql,
                params,
                (rs, rowNum) -> {
                    Category c = new Category();
                    c.setId(rs.getString("id"));
                    c.setName(rs.getString("name"));
                    c.setParentId(rs.getString("parent_id"));
                    c.setSubjectId(rs.getString("subject_id"));
                    c.setDescr(rs.getString("descr"));
                    c.setCreateDate(rs.getTimestamp("create_date").toLocalDateTime());
                    c.setUpdateDate(
                            rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime()
                                    : null);
                    c.setCreateUser(rs.getString("create_user"));
                    c.setUpdateUser(rs.getString("update_user"));
                    return c;
                });

        List<CategoryDto> categoryDtos = convertToDtos(categories);

        // 填充学科信息
        populateSubjectInfo(categoryDtos);

        // 组装分页对象
        return JdbcQueryHelper.toPage(
                namedParameterJdbcTemplate,
                countSql.toString(),
                params,
                categoryDtos,
                queryDto.getPageNum(),
                queryDto.getPageSize());
    }

    private void populateSubjectInfo(List<CategoryDto> dtos) {
        if (dtos == null || dtos.isEmpty()) {
            return;
        }

        Set<String> subjectIds = dtos.stream()
                .map(CategoryDto::getSubjectId)
                .filter(StringUtils::hasText)
                .collect(Collectors.toSet());

        if (subjectIds.isEmpty()) {
            return;
        }

        List<Subject> subjects = subjectRepository.findAllById(subjectIds);
        Map<String, Subject> subjectMap = subjects.stream()
                .collect(Collectors.toMap(Subject::getId, Function.identity()));

        for (CategoryDto dto : dtos) {
            if (StringUtils.hasText(dto.getSubjectId())) {
                Subject subject = subjectMap.get(dto.getSubjectId());
                if (subject != null) {
                    dto.setSubjectName(subject.getName());
                    dto.setSubjectLabel(subject.getLabel());
                }
            }
        }
    }

    @Override
    public boolean checkNameUniq(String userId, String categoryName, String excludeId) {
        if (!StringUtils.hasText(categoryName)) {
            return true;
        }
        if (StringUtils.hasText(excludeId)) {
            return !categoryRepository.existsByNameAndIdNot(categoryName, excludeId);
        }
        return !categoryRepository.existsByName(categoryName);
    }

    @Override
    public List<SubjectDto> getSubjectCategoryTree(String userId) {
        List<SubjectDto> subjects = subjectService.list(userId);
        for (SubjectDto subject : subjects) {
            List<Category> categories = categoryRepository.findBySubjectId(subject.getId());
            List<CategoryDto> categoryDtos = convertToDtos(categories);
            List<CategoryDto> categoryTree = buildCategoryTree(new ArrayList<>(categoryDtos));
            subject.setCategories(categoryTree);
        }
        return subjects;
    }

    @Override
    public List<CategoryDto> listBySubjectId(String subjectId) {
        List<Category> categories = categoryRepository.findBySubjectId(subjectId);
        List<CategoryDto> categoryDtos = convertToDtos(categories);
        return buildCategoryTree(new ArrayList<>(categoryDtos));
    }

    private List<CategoryDto> buildCategoryTree(List<CategoryDto> categories) {
        if (categories == null || categories.isEmpty()) {
            return List.of();
        }
        Map<String, CategoryDto> categoryMap = new HashMap<>();
        for (CategoryDto category : categories) {
            categoryMap.put(category.getId(), category);
            category.setChildren(new ArrayList<>());
        }
        List<CategoryDto> rootCategories = new ArrayList<>();
        for (CategoryDto category : categories) {
            if (category.getParentId() == null || category.getParentId().isEmpty()) {
                rootCategories.add(category);
            } else {
                CategoryDto parent = categoryMap.get(category.getParentId());
                if (parent != null) {
                    parent.getChildren().add(category);
                }
            }
        }
        return rootCategories;
    }

    @Override
    protected CategoryDto newDto() {
        return new CategoryDto();
    }

    @Override
    protected Category newModel() {
        return new Category();
    }

}