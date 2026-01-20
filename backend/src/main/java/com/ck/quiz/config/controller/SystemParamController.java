package com.ck.quiz.config.controller;

import com.ck.quiz.base.controller.BaseController;
import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.config.dto.SystemParamCreateDto;
import com.ck.quiz.config.dto.SystemParamDto;
import com.ck.quiz.config.dto.SystemParamQueryDto;
import com.ck.quiz.config.dto.SystemParamUpdateDto;
import com.ck.quiz.config.service.SystemParamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 系统参数管理控制器
 */
@Tag(name = "系统参数管理", description = "系统参数的创建、更新、删除、查询等接口")
@RestController
@RequestMapping("/api/system-param")
public class SystemParamController
        extends BaseController<SystemParamCreateDto, SystemParamUpdateDto, SystemParamQueryDto, SystemParamDto> {

    @Autowired
    private SystemParamService paramService;

    @Operation(summary = "根据参数名查询参数", description = "根据参数名称查询单个参数信息")
    @GetMapping("/by-name/{paramName}")
    public ResponseEntity<SystemParamDto> getParamByName(
            @Parameter(description = "参数名称", required = true) @PathVariable("paramName") String paramName) {
        return ResponseEntity.ok(paramService.getParamByName(paramName));
    }

    @Override
    protected BaseService<SystemParamCreateDto, SystemParamUpdateDto, SystemParamQueryDto, SystemParamDto, ?> getService() {
        return paramService;
    }

    /**
     * 根据分类查询所有参数
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<List<SystemParamDto>> getParamsByCategory(@PathVariable String category) {
        List<SystemParamDto> list = paramService.getParamsByCategory(category);
        return ResponseEntity.ok(list);
    }
}
