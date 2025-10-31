package com.ck.quiz.doc.repository;

import com.ck.quiz.doc.entity.FunctionPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FunctionPointRepository extends JpaRepository<FunctionPoint, String> {


    @Modifying
    @Query("delete from FunctionPoint f where f.docId = :docId")
    int deleteByDocId(@Param("docId") String docId);

    List<FunctionPoint> findByDocIdOrderByOrderNumAsc(String docId);
}