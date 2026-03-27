package com.ck.quiz.hotsearch.repository;

import com.ck.quiz.hotsearch.entity.HotSearchRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface HotSearchRecordRepository extends JpaRepository<HotSearchRecord, String> {

    @Query(value = """
            select r from HotSearchRecord r
            where (:source is null or :source = '' or r.source = :source)
              and (:titleKeyword is null or :titleKeyword = '' or lower(r.title) like lower(concat('%', :titleKeyword, '%')))
              and (:fromTime is null or r.crawlTime >= :fromTime)
              and (:toTime is null or r.crawlTime <= :toTime)
            """,
            countQuery = """
                    select count(r) from HotSearchRecord r
                    where (:source is null or :source = '' or r.source = :source)
                      and (:titleKeyword is null or :titleKeyword = '' or lower(r.title) like lower(concat('%', :titleKeyword, '%')))
                      and (:fromTime is null or r.crawlTime >= :fromTime)
                      and (:toTime is null or r.crawlTime <= :toTime)
                    """)
    Page<HotSearchRecord> searchPage(
            @Param("source") String source,
            @Param("titleKeyword") String titleKeyword,
            @Param("fromTime") LocalDateTime fromTime,
            @Param("toTime") LocalDateTime toTime,
            Pageable pageable
    );

    @Query("""
            select r from HotSearchRecord r
            where (:source is null or :source = '' or r.source = :source)
              and r.crawlTime = (
                    select max(r2.crawlTime) from HotSearchRecord r2
                    where (:source is null or :source = '' or r2.source = :source)
              )
            order by r.rankIndex asc, r.createDate desc
            """)
    List<HotSearchRecord> findLatestBatch(@Param("source") String source);
}
