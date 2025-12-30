package com.ck.quiz.mermaids.repository;

import com.ck.quiz.mermaids.entity.MermaidDiagramHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MermaidDiagramHistoryRepository extends JpaRepository<MermaidDiagramHistory, String> {
    List<MermaidDiagramHistory> findByDiagramIdOrderByVersionNumDesc(String diagramId);
}
