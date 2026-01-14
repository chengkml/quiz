package com.ck.quiz.syslog.controller;

import com.ck.quiz.base.controller.BaseController;
import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.syslog.dto.SysLogCreateDto;
import com.ck.quiz.syslog.dto.SysLogDto;
import com.ck.quiz.syslog.dto.SysLogQueryDto;
import com.ck.quiz.syslog.dto.SysLogUpdateDto;
import com.ck.quiz.syslog.service.SysLogService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "系统日志管理", description = "系统日志的创建、更新、删除、查询接口")
@RestController
@RequestMapping("/api/syslog")
public class SysLogController extends BaseController<SysLogCreateDto, SysLogUpdateDto, SysLogQueryDto, SysLogDto> {

    @Autowired
    private SysLogService sysLogService;

    @Override
    protected BaseService<SysLogCreateDto, SysLogUpdateDto, SysLogQueryDto, SysLogDto, ?> getService() {
        return sysLogService;
    }
}

