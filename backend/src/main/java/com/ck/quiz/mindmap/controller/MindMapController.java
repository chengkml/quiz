package com.ck.quiz.mindmap.controller;

import com.ck.quiz.mindmap.dto.*;
import com.ck.quiz.mindmap.service.MindMapService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@Tag(name = "思维导图管理", description = "思维导图相关的API接口")
@RestController
@RequestMapping("/api/mindmap")
public class MindMapController {

    @Autowired
    private MindMapService mindMapService;

    @Operation(summary = "创建思维导图", description = "创建新的思维导图")
    @PostMapping("/create")
    public ResponseEntity createMindMap(
            @Parameter(description = "思维导图创建信息", required = true) @Valid @RequestBody MindMapCreateDto mindMapCreateDto) {
        return ResponseEntity.ok(mindMapService.createMindMap(mindMapCreateDto));
    }

    @Operation(summary = "更新思维导图基本信息", description = "更新思维导图的名称、描述等基本信息")
    @PutMapping("/update-basic-info")
    public ResponseEntity updateMindMapBasicInfo(
            @Parameter(description = "思维导图基本信息更新", required = true) @Valid @RequestBody MindMapBasicInfoUpdateDto mindMapBasicInfoUpdateDto) {
        return ResponseEntity.ok(mindMapService.updateMindMapBasicInfo(mindMapBasicInfoUpdateDto));
    }

    @Operation(summary = "更新思维导图数据", description = "更新思维导图的实际数据内容")
    @PutMapping("/update-data")
    public ResponseEntity updateMindMapData(
            @Parameter(description = "思维导图数据更新", required = true) @Valid @RequestBody MindMapDataUpdateDto mindMapDataUpdateDto) {
        return ResponseEntity.ok(mindMapService.updateMindMapData(mindMapDataUpdateDto));
    }

    @Operation(summary = "更新思维导图（兼容旧接口）", description = "更新指定思维导图的信息（包含基本信息和数据）")
    @PutMapping("/update")
    public ResponseEntity updateMindMap(
            @Parameter(description = "思维导图更新信息", required = true) @Valid @RequestBody MindMapUpdateDto mindMapUpdateDto) {
        return ResponseEntity.ok(mindMapService.updateMindMap(mindMapUpdateDto));
    }

    @Operation(summary = "删除思维导图", description = "根据ID删除指定思维导图")
    @DeleteMapping("/{id}")
    public ResponseEntity deleteMindMap(
            @Parameter(description = "思维导图ID", required = true) @PathVariable String id) {
        return ResponseEntity.ok(mindMapService.deleteMindMap(id));
    }

    @Operation(summary = "获取思维导图详情", description = "根据ID获取思维导图详细信息")
    @GetMapping("/{id}")
    public ResponseEntity getMindMapById(
            @Parameter(description = "思维导图ID", required = true) @PathVariable String id) {
        return ResponseEntity.ok(mindMapService.getMindMapById(id));
    }

    @Operation(summary = "分页查询思维导图", description = "根据条件分页查询思维导图列表")
    @GetMapping
    public ResponseEntity searchMindMaps(
            @Parameter(description = "导图名称") @RequestParam(required = false) String mapName,
            @Parameter(description = "页码") @RequestParam(defaultValue = "0") int pageNum,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "20") int pageSize,
            @Parameter(description = "排序字段") @RequestParam(defaultValue = "create_date") String sortColumn,
            @Parameter(description = "排序方向") @RequestParam(defaultValue = "desc") String sortType) {
        MindMapQueryDto queryDto = new MindMapQueryDto();
        queryDto.setMapName(mapName);
        queryDto.setPageNum(pageNum);
        queryDto.setPageSize(pageSize);
        queryDto.setSortColumn(sortColumn);
        queryDto.setSortType(sortType);
        return ResponseEntity.ok(mindMapService.searchMindMaps(queryDto));
    }
}