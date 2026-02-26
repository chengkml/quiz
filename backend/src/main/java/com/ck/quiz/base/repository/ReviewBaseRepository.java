package com.ck.quiz.base.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.NoRepositoryBean;

import com.ck.quiz.base.entity.ReviewModel;

@NoRepositoryBean
public interface ReviewBaseRepository<M extends ReviewModel> extends BaseRepository<M> {

    /**
     * 查询用户今日待复习的记录
     * @param today 今天的日期
     * @param userId 用户ID
     * @return 待复习记录列表（按下次复习日期升序排序）
     */
    @Query("SELECT m FROM #{#entityName} m WHERE m.nextReviewDate <= :today AND m.createUser = :userId AND m.archived = false ORDER BY m.nextReviewDate ASC")
    List<M> findDueToday(LocalDate today, String userId);
}
