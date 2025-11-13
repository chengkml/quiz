package com.ck.quiz.cron.repository;

import com.ck.quiz.cron.domain.PendingJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 维度配置数据访问接口
 */
@Repository
public interface PendingJobRepository extends JpaRepository<PendingJob, String> {

    List<PendingJob> findByQueueName(String queueName);
}