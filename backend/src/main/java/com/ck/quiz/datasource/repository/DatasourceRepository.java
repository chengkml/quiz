package com.ck.quiz.datasource.repository;

import com.ck.quiz.datasource.entity.Datasource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 数据源信息数据访问接口
 */
@Repository
public interface DatasourceRepository extends JpaRepository<Datasource, String> {

    Optional<Datasource> findByName(String name);
}