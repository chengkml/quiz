package com.ck.quiz.category.service;

import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.category.dto.CategoryCreateDto;
import com.ck.quiz.category.dto.CategoryDto;
import com.ck.quiz.category.dto.CategoryQueryDto;
import com.ck.quiz.category.dto.CategoryUpdateDto;
import com.ck.quiz.category.entity.Category;
import com.ck.quiz.subject.dto.SubjectDto;

import java.util.List;

public interface CategoryService
        extends BaseService<CategoryCreateDto, CategoryUpdateDto, CategoryQueryDto, CategoryDto, Category> {

    boolean checkNameUniq(String userId, String name, String excludeId);

    List<SubjectDto> getSubjectCategoryTree(String userId);

    List<CategoryDto> listBySubjectId(String subjectId);

}