package com.ck.quiz.git.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.git.entity.GitRepo;

import java.util.List;

public interface GitRepoRepository extends BaseRepository<GitRepo> {

    List<GitRepo> findAllByOrderBySortOrderAsc();
}
