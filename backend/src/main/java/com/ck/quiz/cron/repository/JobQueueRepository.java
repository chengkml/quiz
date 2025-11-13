package com.ck.quiz.cron.repository;

import com.ck.quiz.cron.domain.JobQueue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;


/**
 * 维度配置数据访问接口
 */
@Repository
public interface JobQueueRepository extends JpaRepository<JobQueue, String> {

    JobQueue findByQueueName(String queueName);

    List<JobQueue> findByState(String state);

    boolean existsByQueueName(String queueName);

    boolean existsByQueueNameAndIdNot(String queueName, String id);
}