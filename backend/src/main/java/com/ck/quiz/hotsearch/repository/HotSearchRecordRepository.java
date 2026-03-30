package com.ck.quiz.hotsearch.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.hotsearch.entity.HotSearchRecord;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface HotSearchRecordRepository extends BaseRepository<HotSearchRecord> {

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

    @Modifying
    @Query("delete from HotSearchRecord r where r.source = :source and r.batchNo = :batchNo")
    void deleteBySourceAndBatchNo(@Param("source") String source, @Param("batchNo") String batchNo);

    @Query("""
            select max(r.crawlTime) from HotSearchRecord r
            where r.source = :source and r.batchNo = :batchNo
            """)
    LocalDateTime findMaxCrawlTimeBySourceAndBatchNo(@Param("source") String source, @Param("batchNo") String batchNo);
}
