package com.ck.quiz.project.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.project.entity.RequirementLifecycleLog;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RequirementLifecycleLogRepository extends BaseRepository<RequirementLifecycleLog> {

    List<RequirementLifecycleLog> findByRequirementIdOrderByCreateDateAsc(String requirementId);
}
