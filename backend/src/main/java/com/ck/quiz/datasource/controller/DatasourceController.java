package com.ck.quiz.datasource.controller;

import com.ck.quiz.datasource.dto.DatasourceCreateDto;
import com.ck.quiz.datasource.dto.DatasourceQueryDto;
import com.ck.quiz.datasource.dto.DatasourceUpdateDto;
import com.ck.quiz.datasource.service.DatasourceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "数据源管理", description = "数据库连接信息管理API接口")
@RestController
@RequestMapping("/api/datasource")
public class DatasourceController {

    @Autowired
    private DatasourceService datasourceService;

    @Operation(summary = "创建数据源", description = "创建新的数据库连接信息")
    @PostMapping("/create")
    public ResponseEntity createDatasource(
            @Parameter(description = "数据源创建信息", required = true) @Valid @RequestBody DatasourceCreateDto createDto) {
        return ResponseEntity.ok(datasourceService.createDatasource(createDto));
    }

    @Operation(summary = "更新数据源", description = "更新指定数据源的信息")
    @PutMapping("/update")
    public ResponseEntity updateDatasource(
            @Parameter(description = "数据源更新信息", required = true) @Valid @RequestBody DatasourceUpdateDto updateDto) {
        return ResponseEntity.ok(datasourceService.updateDatasource(updateDto));
    }

    @Operation(summary = "删除数据源", description = "根据ID删除指定数据源")
    @DeleteMapping("/{id}")
    public ResponseEntity deleteDatasource(
            @Parameter(description = "数据源ID", required = true) @PathVariable String id) {
        return ResponseEntity.ok(datasourceService.deleteDatasource(id));
    }

    @Operation(summary = "获取数据源详情", description = "根据ID获取数据源详细信息")
    @GetMapping("/{id}")
    public ResponseEntity getDatasourceById(
            @Parameter(description = "数据源ID", required = true) @PathVariable String id) {
        return ResponseEntity.ok(datasourceService.getDatasourceById(id));
    }

    @Operation(summary = "分页查询数据源", description = "根据条件分页查询数据源列表")
    @GetMapping
    public ResponseEntity searchDatasources(
            @Parameter(description = "名称关键字") @RequestParam(required = false) String name,
            @Parameter(description = "是否启用") @RequestParam(required = false) Boolean active,
            @Parameter(description = "页码") @RequestParam(defaultValue = "0") int pageNum,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "20") int pageSize,
            @Parameter(description = "排序字段") @RequestParam(defaultValue = "create_date") String sortColumn,
            @Parameter(description = "排序方向") @RequestParam(defaultValue = "desc") String sortType) {
        DatasourceQueryDto queryDto = new DatasourceQueryDto();
        queryDto.setName(name);
        queryDto.setActive(active);
        queryDto.setPageNum(pageNum);
        queryDto.setPageSize(pageSize);
        queryDto.setSortColumn(sortColumn);
        queryDto.setSortType(sortType);
        return ResponseEntity.ok(datasourceService.searchDatasources(queryDto));
    }

    @Operation(summary = "测试数据源连接", description = "根据ID测试数据源连接是否成功")
    @PostMapping("/{id}/test")
    public ResponseEntity testConnection(
            @Parameter(description = "数据源ID", required = true) @PathVariable String id) {
        return ResponseEntity.ok(datasourceService.testConnection(id));
    }

    @Operation(summary = "采集数据源表结构", description = "根据ID采集数据库的表结构信息")
    @GetMapping("/{id}/schema")
    public ResponseEntity collectSchema(
            @Parameter(description = "数据源ID", required = true) @PathVariable String id,
            @Parameter(description = "schema名称（MySQL等将作为catalog使用）") @RequestParam(required = false) String schema) {
        if (schema == null || schema.isEmpty()) {
            return ResponseEntity.ok(datasourceService.collectSchema(id));
        }
        return ResponseEntity.ok(datasourceService.collectSchema(id, schema));
    }

    @Operation(summary = "获取可选schema列表", description = "根据ID获取数据库的schema（无schema则返回catalog）")
    @GetMapping("/{id}/schemas")
    public ResponseEntity listSchemas(
            @Parameter(description = "数据源ID", required = true) @PathVariable String id) {
        return ResponseEntity.ok(datasourceService.listSchemas(id));
    }
}