package com.ck.quiz.syslog.service;

import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.syslog.dto.SysLogCreateDto;
import com.ck.quiz.syslog.dto.SysLogDto;
import com.ck.quiz.syslog.dto.SysLogQueryDto;
import com.ck.quiz.syslog.dto.SysLogUpdateDto;
import com.ck.quiz.syslog.entity.SysLog;

public interface SysLogService extends BaseService<SysLogCreateDto, SysLogUpdateDto, SysLogQueryDto, SysLogDto, SysLog> {
}

