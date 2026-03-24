package com.ck.quiz.knowledgeset.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.knowledgeset.entity.KnowledgeSource;

import java.util.List;

public interface KnowledgeSourceRepository extends BaseRepository<KnowledgeSource> {
    List<KnowledgeSource> findByKnowledgeSetId(String knowledgeSetId);
}
