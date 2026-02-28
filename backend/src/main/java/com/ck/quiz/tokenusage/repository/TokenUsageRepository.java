package com.ck.quiz.tokenusage.repository;

import com.ck.quiz.tokenusage.entity.TokenUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TokenUsageRepository extends JpaRepository<TokenUsage, String> {

    /**
     * 按模型统计token使用情况
     */
    @Query("SELECT t.modelName, SUM(t.totalTokens) as totalTokens, SUM(t.promptTokens) as promptTokens, " +
           "SUM(t.completionTokens) as completionTokens, SUM(t.totalCost) as totalCost, COUNT(t) as requestCount " +
           "FROM TokenUsage t " +
           "WHERE t.createDate >= COALESCE(:startDate, t.createDate) " +
           "AND t.createDate <= COALESCE(:endDate, t.createDate) " +
           "AND (COALESCE(:userId, '') = '' OR t.createUser = :userId) " +
           "GROUP BY t.modelName " +
           "ORDER BY totalTokens DESC")
    List<Object[]> statisticsByModel(@Param("startDate") LocalDateTime startDate,
                                     @Param("endDate") LocalDateTime endDate,
                                     @Param("userId") String userId);

    /**
     * 按业务类型统计token使用情况
     */
    @Query("SELECT t.businessType, SUM(t.totalTokens) as totalTokens, SUM(t.promptTokens) as promptTokens, " +
           "SUM(t.completionTokens) as completionTokens, SUM(t.totalCost) as totalCost, COUNT(t) as requestCount " +
           "FROM TokenUsage t " +
           "WHERE t.createDate >= COALESCE(:startDate, t.createDate) " +
           "AND t.createDate <= COALESCE(:endDate, t.createDate) " +
           "AND (COALESCE(:userId, '') = '' OR t.createUser = :userId) " +
           "GROUP BY t.businessType " +
           "ORDER BY totalTokens DESC")
    List<Object[]> statisticsByBusinessType(@Param("startDate") LocalDateTime startDate,
                                            @Param("endDate") LocalDateTime endDate,
                                            @Param("userId") String userId);

    /**
     * 按用户统计token使用情况
     */
    @Query("SELECT t.createUser, SUM(t.totalTokens) as totalTokens, SUM(t.promptTokens) as promptTokens, " +
           "SUM(t.completionTokens) as completionTokens, SUM(t.totalCost) as totalCost, COUNT(t) as requestCount " +
           "FROM TokenUsage t " +
           "WHERE t.createDate >= COALESCE(:startDate, t.createDate) " +
           "AND t.createDate <= COALESCE(:endDate, t.createDate) " +
           "GROUP BY t.createUser " +
           "ORDER BY totalTokens DESC")
    List<Object[]> statisticsByUser(@Param("startDate") LocalDateTime startDate,
                                    @Param("endDate") LocalDateTime endDate);

    /**
     * 按日期统计token使用情况
     */
    @Query("SELECT CAST(t.createDate AS date), SUM(t.totalTokens) as totalTokens, SUM(t.promptTokens) as promptTokens, " +
           "SUM(t.completionTokens) as completionTokens, SUM(t.totalCost) as totalCost, COUNT(t) as requestCount " +
           "FROM TokenUsage t " +
           "WHERE t.createDate >= COALESCE(:startDate, t.createDate) " +
           "AND t.createDate <= COALESCE(:endDate, t.createDate) " +
           "AND (COALESCE(:userId, '') = '' OR t.createUser = :userId) " +
           "AND (COALESCE(:modelName, '') = '' OR t.modelName = :modelName) " +
           "GROUP BY CAST(t.createDate AS date) " +
           "ORDER BY CAST(t.createDate AS date) DESC")
    List<Object[]> statisticsByDate(@Param("startDate") LocalDateTime startDate,
                                    @Param("endDate") LocalDateTime endDate,
                                    @Param("userId") String userId,
                                    @Param("modelName") String modelName);

    /**
     * 根据会话ID查询token使用记录
     */
    List<TokenUsage> findBySessionIdOrderByCreateDateAsc(String sessionId);

    /**
     * 根据业务ID查询token使用记录
     */
    List<TokenUsage> findByBusinessIdOrderByCreateDateAsc(String businessId);
}
