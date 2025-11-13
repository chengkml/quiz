package com.ck.quiz.script.repository;

import com.ck.quiz.script.entity.ScriptInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 脚本信息Repository
 */
@Repository
public interface ScriptInfoRepository extends JpaRepository<ScriptInfo, String>, JpaSpecificationExecutor<ScriptInfo> {

    /**
     * 根据脚本编码查询脚本信息
     *
     * @param scriptCode 脚本编码
     * @return 脚本信息
     */
    Optional<ScriptInfo> findByScriptCode(String scriptCode);

    /**
     * 根据脚本编码判断是否存在
     *
     * @param scriptCode 脚本编码
     * @return 是否存在
     */
    boolean existsByScriptCode(String scriptCode);
}