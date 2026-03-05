package com.ck.quiz.git.service;

import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.git.dto.*;
import com.ck.quiz.git.entity.GitRepo;

public interface GitRepoService
        extends BaseService<GitRepoCreateDto, GitRepoUpdateDto, GitRepoQueryDto, GitRepoDto, GitRepo> {
}
