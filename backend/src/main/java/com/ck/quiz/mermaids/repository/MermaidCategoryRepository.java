package com.ck.quiz.mermaids.repository;

import com.ck.quiz.mermaids.entity.MermaidCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MermaidCategoryRepository extends JpaRepository<MermaidCategory, String> {
    Optional<MermaidCategory> findByCategoryName(String categoryName);
}
