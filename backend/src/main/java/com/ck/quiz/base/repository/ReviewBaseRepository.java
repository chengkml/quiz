package com.ck.quiz.base.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.NoRepositoryBean;

import com.ck.quiz.base.entity.ReviewModel;

@NoRepositoryBean
public interface ReviewBaseRepository<M extends ReviewModel> extends BaseRepository<M> {

    /**
     * 查询用户待复习的记录（到期时间 <= 当前时间）
     * @param now 当前时间
     * @param userId 用户ID
     * @return 待复习记录列表（按下次复习时间升序排序）
     */
    @Query("SELECT m FROM #{#entityName} m WHERE m.nextReviewDate <= :now AND m.createUser = :userId AND m.archived = false ORDER BY m.nextReviewDate ASC")
    List<M> findDueToday(LocalDateTime now, String userId);
}
