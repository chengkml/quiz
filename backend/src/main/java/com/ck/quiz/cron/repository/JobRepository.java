package com.ck.quiz.cron.repository;

import com.ck.quiz.cron.domain.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Job数据访问接口
 */
@Repository
public interface JobRepository extends JpaRepository<Job, String> {

    /**
     * 统计各状态的作业数量
     */
    @Query("SELECT j.state, COUNT(j) FROM Job j GROUP BY j.state")
    List<Object[]> countByState();

    /**
     * 统计今日作业数量
     */
    @Query("SELECT COUNT(j) FROM Job j WHERE DATE(j.createTime) = CURRENT_DATE")
    Long countTodayJobs();

    /**
     * 统计运行中的作业数量
     */
    @Query("SELECT COUNT(j) FROM Job j WHERE j.state = 'RUNNING'")
    Long countRunningJobs();

    /**
     * 统计失败的作业数量
     */
    @Query("SELECT COUNT(j) FROM Job j WHERE j.state = 'FAILED'")
    Long countFailedJobs();

    /**
     * 统计成功的作业数量
     */
    @Query("SELECT COUNT(j) FROM Job j WHERE j.state = 'SUCCESS'")
    Long countSuccessJobs();
}