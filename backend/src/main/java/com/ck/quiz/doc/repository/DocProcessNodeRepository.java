package com.ck.quiz.doc.repository;

import com.ck.quiz.doc.entity.DocProcessNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DocProcessNodeRepository extends JpaRepository<DocProcessNode, String> {


    @Modifying
    @Query("delete from DocProcessNode n where n.docId = :docId")
    int deleteByDocId(@Param("docId") String docId);
}