package com.ck.quiz.doc.controller;

import com.ck.quiz.doc.dto.DocHeadingTreeDto;
import com.ck.quiz.doc.dto.DocInfoCreateDto;
import com.ck.quiz.doc.dto.DocInfoDto;
import com.ck.quiz.doc.dto.DocInfoQueryDto;
import com.ck.quiz.doc.dto.DocProcessNodeDto;
import com.ck.quiz.doc.dto.DocProcessNodeQueryDto;
import com.ck.quiz.doc.dto.FunctionPointTreeDto;
// 移除对实体类的引用，使用DTO
import com.ck.quiz.doc.service.DocInfoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 文档管理控制器
 * 提供文档相关的REST API接口
 */
@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@Tag(name = "文档管理", description = "文档管理相关API")
public class DocInfoController {

    private final DocInfoService docInfoService;

    /**
     * 创建新文档
     *
     * @param createDto 文档创建信息
     * @return 创建的文档信息
     */
    @PostMapping
    @Operation(summary = "创建文档", description = "创建一个新的文档")
    public ResponseEntity<DocInfoDto> createDocInfo(
            @Valid @RequestBody DocInfoCreateDto createDto) {
        DocInfoDto docInfo = docInfoService.createDocInfo(createDto);
        return ResponseEntity.ok(docInfo);
    }

    /**
     * 删除文档
     *
     * @param id 文档ID
     * @return 删除结果
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "删除文档", description = "根据ID删除文档")
    public ResponseEntity<Void> deleteDocInfo(
            @Parameter(description = "文档ID") @PathVariable String id) {
        docInfoService.deleteDocInfo(id);
        return ResponseEntity.ok().build();
    }

    /**
     * 根据ID获取文档信息
     *
     * @param id 文档ID
     * @return 文档信息
     */
    @GetMapping("/{id}")
    @Operation(summary = "获取文档详情", description = "根据ID获取文档详细信息")
    public ResponseEntity<DocInfoDto> getDocInfoById(
            @Parameter(description = "文档ID") @PathVariable String id) {
        DocInfoDto docInfo = docInfoService.getDocInfoById(id);
        return ResponseEntity.ok(docInfo);
    }

    /**
     * 分页查询文档列表
     *
     * @param queryDto 查询条件
     * @return 分页文档列表
     */
    @GetMapping("/page")
    @Operation(summary = "分页查询文档", description = "分页查询文档列表")
    public ResponseEntity<Page<DocInfoDto>> pageDocInfo(
            @Valid DocInfoQueryDto queryDto) {
        Page<DocInfoDto> docInfoPage = docInfoService.pageDocInfo(queryDto);
        return ResponseEntity.ok(docInfoPage);
    }
    
    /**
     * 分页查询文档流程节点
     *
     * @param docId 文档ID
     * @param queryDto 查询条件
     * @return 流程节点分页结果
     */
    @GetMapping("/{docId}/process-nodes/page")
    @Operation(summary = "分页查询文档流程节点", description = "分页查询指定文档的流程节点，支持关键词搜索和标题筛选")
    public ResponseEntity<Page<DocProcessNodeDto>> pageDocProcessNode(
            @Parameter(description = "文档ID") @PathVariable String docId,
            @Valid DocProcessNodeQueryDto queryDto) {
        // 设置文档ID
        queryDto.setDocId(docId);
        Page<DocProcessNodeDto> processNodePage = docInfoService.pageDocProcessNode(queryDto);
        return ResponseEntity.ok(processNodePage);
    }

    /**
     * 上传文档文件
     *
     * @param file 上传的文件
     * @return 文档信息
     */
    @PostMapping("/upload")
    @Operation(summary = "上传文档", description = "上传文档文件并创建文档记录")
    public ResponseEntity<DocInfoDto> uploadDocFile(
            @Parameter(description = "文档文件", required = true)
            @RequestParam("file") MultipartFile file) {
        DocInfoDto docInfo = docInfoService.uploadDocFile(file);
        return ResponseEntity.ok(docInfo);
    }
    
    /**
     * 根据文档ID获取文档标题树
     *
     * @param id 文档ID
     * @return 文档标题树列表
     */
    @GetMapping("/{id}/heading-tree")
    @Operation(summary = "获取文档标题树", description = "根据文档ID获取文档标题的层级结构")
    public ResponseEntity<List<DocHeadingTreeDto>> getDocHeadingTree(
            @Parameter(description = "文档ID") @PathVariable String id) {
        List<DocHeadingTreeDto> headingTree = docInfoService.getDocHeadingTree(id);
        return ResponseEntity.ok(headingTree);
    }
    
    /**
     * 根据文档ID获取功能点树
     *
     * @param id 文档ID
     * @return 功能点树列表
     */
    @GetMapping("/{id}/function-point-tree")
    @Operation(summary = "获取功能点树", description = "根据文档ID获取功能点的层级结构")
    public ResponseEntity<List<FunctionPointTreeDto>> getFunctionPointTree(
            @Parameter(description = "文档ID") @PathVariable String id) {
        List<FunctionPointTreeDto> functionPointTree = docInfoService.getFunctionPointTree(id);
        return ResponseEntity.ok(functionPointTree);
    }
}