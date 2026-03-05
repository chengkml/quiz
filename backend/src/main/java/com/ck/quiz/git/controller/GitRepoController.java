package com.ck.quiz.git.controller;

import com.ck.quiz.base.controller.BaseController;
import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.git.dto.*;
import com.ck.quiz.git.service.GitRepoService;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Git仓库管理", description = "Git仓库注册、更新、删除、查询等接口")
@RestController
@RequestMapping("/api/git/repos")
public class GitRepoController extends BaseController<GitRepoCreateDto, GitRepoUpdateDto, GitRepoQueryDto, GitRepoDto> {

    @Autowired
    private GitRepoService gitRepoService;

    @Override
    protected BaseService<GitRepoCreateDto, GitRepoUpdateDto, GitRepoQueryDto, GitRepoDto, ?> getService() {
        return gitRepoService;
    }
}
