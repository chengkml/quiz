package com.ck.quiz.mermaids.repository;

import com.ck.quiz.mermaids.entity.MermaidDiagramTagRel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MermaidDiagramTagRelRepository extends JpaRepository<MermaidDiagramTagRel, String> {
    List<MermaidDiagramTagRel> findByDiagramId(String diagramId);
    List<MermaidDiagramTagRel> findByTagId(String tagId);
}
