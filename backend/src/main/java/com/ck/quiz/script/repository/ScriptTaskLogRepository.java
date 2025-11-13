package com.ck.quiz.script.repository;

import com.ck.quiz.script.entity.ScriptTaskLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

/**
 * 脚本任务日志Repository
 */
public interface ScriptTaskLogRepository extends JpaRepository<ScriptTaskLog, String>, JpaSpecificationExecutor<ScriptTaskLog> {
}