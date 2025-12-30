package com.ck.quiz.mermaids.repository;

import com.ck.quiz.mermaids.entity.MermaidDiagram;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MermaidDiagramRepository extends JpaRepository<MermaidDiagram, String> {
    Page<MermaidDiagram> findByDiagramNameContaining(String diagramName, Pageable pageable);
    Page<MermaidDiagram> findByDiagramNameContainingAndCategoryId(String diagramName, String categoryId, Pageable pageable);
}
