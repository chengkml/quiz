package com.ck.quiz.knowledgeset.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.knowledgeset.entity.KnowledgeSet;

public interface KnowledgeSetRepository extends BaseRepository<KnowledgeSet> {

    boolean existsByNameAndCreateUser(String name, String createUser);

    boolean existsByNameAndCreateUserAndIdNot(String name, String createUser, String id);

    KnowledgeSet findByNameAndCreateUser(String name, String createUser);
}
