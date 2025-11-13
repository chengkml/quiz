package com.ck.quiz.cron.repository;

import com.ck.quiz.cron.domain.CronTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 维度配置数据访问接口
 */
@Repository
public interface CronTaskRepository extends JpaRepository<CronTask, String> {

}