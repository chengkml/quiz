package com.ck.quiz.mindmap.repository;

import com.ck.quiz.mindmap.entity.MindMap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 思维导图数据访问接口
 */
@Repository
public interface MindMapRepository extends JpaRepository<MindMap, String> {

}