package com.ck.quiz.base.repository;

import com.ck.quiz.base.entity.ReviewLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * 复习记录仓库接口（通用）
 */
public interface ReviewLogRepository extends JpaRepository<ReviewLog, String> {

    /**
     * 获取某对象的复习历史
     * @param objId 关联对象ID
     * @return 复习记录列表，按时间倒序
     */
    @Query("SELECT r FROM ReviewLog r WHERE r.objId = :objId ORDER BY r.reviewDate DESC")
    List<ReviewLog> findByObjId(@Param("objId") String objId);
}
