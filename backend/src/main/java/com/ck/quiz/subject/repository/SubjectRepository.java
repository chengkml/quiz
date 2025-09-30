package com.ck.quiz.subject.repository;

import com.ck.quiz.subject.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 学科数据访问接口
 */
@Repository
public interface SubjectRepository extends JpaRepository<Subject, String> {

    /**
     * 根据学科名称查找学科
     *
     * @param name 学科名称
     * @return 学科信息
     */
    Optional<Subject> findByName(String name);

    /**
     * 检查学科名称是否存在（排除指定ID）
     *
     * @param name      学科名称
     * @param subjectId 要排除的学科ID
     * @return 是否存在
     */
    boolean existsByNameAndIdNot(String name, String subjectId);
}