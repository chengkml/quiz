package com.ck.quiz.knowledgeset.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.knowledgeset.entity.KnowledgeSet;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface KnowledgeSetRepository extends BaseRepository<KnowledgeSet> {

    boolean existsByNameAndCreateUser(String name, String createUser);

    boolean existsByNameAndCreateUserAndIdNot(String name, String createUser, String id);

    KnowledgeSet findByNameAndCreateUser(String name, String createUser);

    @Query("select ks.id from KnowledgeSet ks where ks.status = 'ENABLED' and (ks.createUser = :userId or ks.visibility = 'PUBLIC')")
    List<String> findAccessibleEnabledIds(@Param("userId") String userId);

    @Query("select count(ks) from KnowledgeSet ks where ks.id = :knowledgeSetId and ks.status = 'ENABLED' and (ks.createUser = :userId or ks.visibility = 'PUBLIC')")
    long countAccessibleEnabledById(@Param("knowledgeSetId") String knowledgeSetId, @Param("userId") String userId);
}
