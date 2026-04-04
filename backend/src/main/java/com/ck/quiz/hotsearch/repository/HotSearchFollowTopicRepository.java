package com.ck.quiz.hotsearch.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.hotsearch.entity.HotSearchFollowTopic;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HotSearchFollowTopicRepository extends BaseRepository<HotSearchFollowTopic> {

    List<HotSearchFollowTopic> findByCreateUserOrderBySeqAscCreateDateDesc(String createUser);

    List<HotSearchFollowTopic> findByCreateUserAndEnabledTrueOrderBySeqAscCreateDateDesc(String createUser);

    @Query("""
            select count(t) > 0 from HotSearchFollowTopic t
            where t.createUser = :createUser
              and lower(t.topicName) = lower(:topicName)
              and (:excludeId is null or t.id <> :excludeId)
            """)
    boolean existsDuplicateTopicName(@Param("createUser") String createUser,
                                     @Param("topicName") String topicName,
                                     @Param("excludeId") String excludeId);
}
