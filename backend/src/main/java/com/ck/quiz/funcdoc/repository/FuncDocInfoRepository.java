package com.ck.quiz.funcdoc.repository;

import com.ck.quiz.funcdoc.entity.FuncDoc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 文档数据访问层接口
 * 定义文档相关的数据库操作方法
 */
@Repository
public interface FuncDocInfoRepository extends JpaRepository<FuncDoc, String> {


    /**
     * 检查文件MD5是否存在
     *
     * @param fileMd5 文件MD5
     * @return 是否存在
     */
    boolean existsByFileMd5(String fileMd5);
}