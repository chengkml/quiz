package com.ck.quiz.script.repository;

import com.ck.quiz.script.entity.ScriptJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 脚本任务Repository
 */
@Repository
public interface ScriptJobRepository extends JpaRepository<ScriptJob, String>, JpaSpecificationExecutor<ScriptJob> {
    Optional<ScriptJob> findByJobId(String id);
}