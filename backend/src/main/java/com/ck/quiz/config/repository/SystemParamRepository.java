package com.ck.quiz.config.repository;

import com.ck.quiz.config.entity.SystemParam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 系统参数数据访问层
 */
@Repository
public interface SystemParamRepository extends JpaRepository<SystemParam, String> {

    /**
     * 根据参数键查询
     * @param paramKey 参数键
     * @return 参数实体
     */
    Optional<SystemParam> findByParamKey(String paramKey);

    /**
     * 根据分类查询
     * @param category 分类
     * @return 参数列表
     */
    List<SystemParam> findByCategory(String category);

    /**
     * 根据状态查询
     * @param status 状态
     * @return 参数列表
     */
    List<SystemParam> findByStatus(SystemParam.ParamStatus status);

    /**
     * 根据分类和状态查询
     * @param category 分类
     * @param status 状态
     * @return 参数列表
     */
    List<SystemParam> findByCategoryAndStatus(String category, SystemParam.ParamStatus status);
}
