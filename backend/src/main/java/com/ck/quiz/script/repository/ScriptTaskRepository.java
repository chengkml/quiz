package com.ck.quiz.script.repository;

import com.ck.quiz.script.entity.ScriptTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * 脚本任务Repository
 */
@Repository
public interface ScriptTaskRepository extends JpaRepository<ScriptTask, String>, JpaSpecificationExecutor<ScriptTask> {
}