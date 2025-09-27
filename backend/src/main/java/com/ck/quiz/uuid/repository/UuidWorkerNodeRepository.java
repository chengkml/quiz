package com.ck.quiz.uuid.repository;

import com.ck.quiz.uuid.entity.UuidWorkerNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UuidWorkerNodeRepository extends JpaRepository<UuidWorkerNode, Long> {

    Optional<UuidWorkerNode> findByHostNameAndPort(String hostName, String port);
}
