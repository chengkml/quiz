package com.ck.quiz.category.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.category.entity.Category;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends BaseRepository<Category> {

    Optional<Category> findByName(String name);

    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, String id);

    List<Category> findBySubjectId(String subjectId);

    List<Category> findByParentId(String parentId);

}