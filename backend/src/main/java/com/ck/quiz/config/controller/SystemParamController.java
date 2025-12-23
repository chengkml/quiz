package com.ck.quiz.config.controller;

import com.ck.quiz.config.dto.SystemParamCreateDto;
import com.ck.quiz.config.dto.SystemParamDto;
import com.ck.quiz.config.dto.SystemParamQueryDto;
import com.ck.quiz.config.dto.SystemParamUpdateDto;
import com.ck.quiz.config.service.SystemParamService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 系统参数管理控制器
 */
@RestController
@RequestMapping("/api/system-param")
@RequiredArgsConstructor
public class SystemParamController {

    private final SystemParamService paramService;

    /**
     * 创建参数
     */
    @PostMapping("/create")
    public Map<String, Object> createParam(@RequestBody SystemParamCreateDto createDto) {
        SystemParamDto dto = paramService.createParam(createDto);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", dto);
        return result;
    }

    /**
     * 更新参数
     */
    @PutMapping("/update")
    public Map<String, Object> updateParam(@RequestBody SystemParamUpdateDto updateDto) {
        SystemParamDto dto = paramService.updateParam(updateDto);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", dto);
        return result;
    }

    /**
     * 删除参数
     */
    @DeleteMapping("/delete/{id}")
    public Map<String, Object> deleteParam(@PathVariable String id) {
        paramService.deleteParam(id);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "删除成功");
        return result;
    }

    /**
     * 根据ID查询参数
     */
    @GetMapping("/{id}")
    public Map<String, Object> getParamById(@PathVariable String id) {
        SystemParamDto dto = paramService.getParamById(id);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", dto);
        return result;
    }

    /**
     * 根据参数键查询参数
     */
    @GetMapping("/key/{paramKey}")
    public Map<String, Object> getParamByKey(@PathVariable String paramKey) {
        SystemParamDto dto = paramService.getParamByKey(paramKey);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", dto);
        return result;
    }

    /**
     * 根据参数键获取参数值
     */
    @GetMapping("/value/{paramKey}")
    public Map<String, Object> getParamValue(@PathVariable String paramKey,
                                             @RequestParam(required = false) String defaultValue) {
        String value = defaultValue != null 
                ? paramService.getParamValue(paramKey, defaultValue)
                : paramService.getParamValue(paramKey);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", value);
        return result;
    }

    /**
     * 分页查询参数
     */
    @GetMapping("/search")
    public Map<String, Object> searchParams(SystemParamQueryDto queryDto) {
        Page<SystemParamDto> page = paramService.searchParams(queryDto);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("content", page.getContent());
        result.put("totalElements", page.getTotalElements());
        result.put("totalPages", page.getTotalPages());
        result.put("number", page.getNumber());
        result.put("size", page.getSize());
        return result;
    }

    /**
     * 根据分类查询所有参数
     */
    @GetMapping("/category/{category}")
    public Map<String, Object> getParamsByCategory(@PathVariable String category) {
        List<SystemParamDto> list = paramService.getParamsByCategory(category);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", list);
        return result;
    }

    /**
     * 批量更新参数
     */
    @PutMapping("/batch-update")
    public Map<String, Object> batchUpdateParams(@RequestBody List<SystemParamUpdateDto> updateDtos) {
        paramService.batchUpdateParams(updateDtos);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "批量更新成功");
        return result;
    }

    /**
     * 重置参数为默认值
     */
    @PutMapping("/reset/{id}")
    public Map<String, Object> resetParamToDefault(@PathVariable String id) {
        SystemParamDto dto = paramService.resetParamToDefault(id);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", dto);
        return result;
    }
}
