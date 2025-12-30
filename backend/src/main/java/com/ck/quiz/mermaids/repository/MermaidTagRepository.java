package com.ck.quiz.mermaids.repository;

import com.ck.quiz.mermaids.entity.MermaidTag;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MermaidTagRepository extends JpaRepository<MermaidTag, String> {
    Optional<MermaidTag> findByTagName(String tagName);
}
