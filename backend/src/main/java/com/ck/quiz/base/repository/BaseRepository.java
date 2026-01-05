package com.ck.quiz.base.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.repository.NoRepositoryBean;

import com.ck.quiz.base.entity.Model;

@NoRepositoryBean
public interface BaseRepository<M extends Model>
        extends JpaRepository<M, String>, JpaSpecificationExecutor<M> {

    List<M> findByCreateUser(String userId);
}