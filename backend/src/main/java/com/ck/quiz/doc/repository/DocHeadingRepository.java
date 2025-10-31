package com.ck.quiz.doc.repository;

import com.ck.quiz.doc.entity.DocHeading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocHeadingRepository extends JpaRepository<DocHeading, String> {

    List<DocHeading> findByDocIdOrderByOrderNoAsc(String docId);

    @Modifying
    @Query("delete from DocHeading h where h.docId = :docId")
    int deleteByDocId(@Param("docId") String docId);

    List<DocHeading> findByDocIdAndHeadingText(String docId, String text);

    List<DocHeading> findByDocIdAndHeadingLevelIn(String docId, List<Integer> headingLevels);
}
