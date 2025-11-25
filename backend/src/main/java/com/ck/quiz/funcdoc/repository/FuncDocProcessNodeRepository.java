package com.ck.quiz.funcdoc.repository;

import com.ck.quiz.funcdoc.entity.FuncDocProcessNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FuncDocProcessNodeRepository extends JpaRepository<FuncDocProcessNode, String> {


    @Modifying
    @Query("delete from FuncDocProcessNode n where n.docId = :docId")
    int deleteByDocId(@Param("docId") String docId);
}