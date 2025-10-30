package com.ck.quiz.doc.repository;

import com.ck.quiz.doc.entity.DocInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 文档数据访问层接口
 * 定义文档相关的数据库操作方法
 */
@Repository
public interface DocInfoRepository extends JpaRepository<DocInfo, String> {


    /**
     * 检查文件MD5是否存在
     *
     * @param fileMd5 文件MD5
     * @return 是否存在
     */
    boolean existsByFileMd5(String fileMd5);
}