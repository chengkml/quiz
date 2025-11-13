package com.ck.quiz.seq.repository;

import com.ck.quiz.seq.entity.Seq;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;


@Repository
public interface SeqRepository extends JpaRepository<Seq, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Seq s WHERE s.seqType = :seqType AND s.dayly = :daylyFlag AND s.id = :id")
    Optional<Seq> findByTypeAndDaylyForUpdate(@Param("seqType") String seqType,
                                              @Param("daylyFlag") String daylyFlag,
                                              @Param("id") String id);
}
