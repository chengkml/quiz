package com.ck.quiz.funcdoc.repository;

import com.ck.quiz.funcdoc.entity.FuncDocHeading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FuncDocHeadingRepository extends JpaRepository<FuncDocHeading, String> {

    List<FuncDocHeading> findByDocIdOrderByOrderNoAsc(String docId);

    @Modifying
    @Query("delete from FuncDocHeading h where h.docId = :docId")
    int deleteByDocId(@Param("docId") String docId);

    List<FuncDocHeading> findByDocIdAndHeadingText(String docId, String text);

    List<FuncDocHeading> findByDocIdAndHeadingLevelIn(String docId, List<Integer> headingLevels);
}
