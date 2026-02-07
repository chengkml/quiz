package com.ck.quiz.crawler.repository;

import com.ck.quiz.crawler.domain.CrawlerConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CrawlerConfigRepository extends JpaRepository<CrawlerConfig, String> {
    
    List<CrawlerConfig> findByState(String state);
    
    List<CrawlerConfig> findByNameContaining(String name);
}
