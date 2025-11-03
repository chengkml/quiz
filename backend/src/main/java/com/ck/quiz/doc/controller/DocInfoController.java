package com.ck.quiz.doc.controller;

import com.ck.quiz.doc.dto.*;
import com.ck.quiz.doc.service.DocInfoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

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
     * @param docId    文档ID
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
     * @param docId 文档ID
     * @return 功能点树列表
     */
    @GetMapping("/{docId}/function-point-tree")
    @Operation(summary = "获取功能点树", description = "根据文档ID获取功能点的层级结构")
    public ResponseEntity<List<FunctionPointTreeDto>> getFunctionPointTree(
            @Parameter(description = "文档ID") @PathVariable String docId) {
        List<FunctionPointTreeDto> functionPointTree = docInfoService.getFunctionPointTree(docId);
        return ResponseEntity.ok(functionPointTree);
    }

    /**
     * 分页查询文档三级功能点
     *
     * @param queryDto 查询条件
     * @return 分页功能点列表
     */
    @GetMapping("/{docId}/function-points/three-level/page")
    @Operation(
            summary = "分页查询文档三级功能点",
            description = "根据文档ID分页查询文档的三级功能点（不构建树结构，直接分页返回）"
    )
    public ResponseEntity<Page<FunctionPointTreeDto>> getThreeLevelFunctionPointsPage(
            @PathVariable String docId,
            @Valid FunctionPointQueryDto queryDto) {
        // 设置文档ID
        queryDto.setDocId(docId);
        Page<FunctionPointTreeDto> functionPointsPage =
                docInfoService.getThreeLevelFunctionPointsPage(queryDto);
        return ResponseEntity.ok(functionPointsPage);
    }

    /**
     * 根据功能点ID生成流程说明
     *
     * @param functionId 功能点ID
     * @return 包含流程简述、业务说明、功能描述的结果
     */
    @PostMapping("/process/generate/{functionId}")
    @Operation(
            summary = "AI生成流程说明",
            description = "根据功能点ID，自动提取对应的流程节点内容，使用大模型生成流程简述、业务说明和功能描述"
    )
    public ResponseEntity<Map<String, Object>> generateProcessDescription(
            @Parameter(description = "功能点ID", required = true)
            @PathVariable String functionId) {
        Map<String, Object> result = docInfoService.generateByProcess(functionId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/process/generate/flow/{functionId}")
    public ResponseEntity<String> generateFlow(
            @Parameter(description = "功能点ID", required = true)
            @PathVariable String functionId) {
        String result = docInfoService.generateFlowByProcess(functionId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/process/generate/inf/{functionId}")
    public ResponseEntity<Map<String, Object>> generateInf(
            @Parameter(description = "功能点ID", required = true)
            @PathVariable String functionId) {
        Map<String, Object> result = docInfoService.generateInfByProcess(functionId);
        return ResponseEntity.ok(result);
    }


    @GetMapping("/process/batchgenerate")
    public ResponseEntity batchGenerateProcessDescription() {
        docInfoService.batchGenerateProcessDescription();
        return ResponseEntity.ok().build();
    }

    @GetMapping("/process/batchgenerate/flow")
    public ResponseEntity batchGenerateFlow() {
        docInfoService.batchGenerateFlowByProcess();
        return ResponseEntity.ok().build();
    }

    @GetMapping("/process/batchgenerate/inf")
    public ResponseEntity batchGenerateInf() {
        docInfoService.batchGenerateInf();
        return ResponseEntity.ok().build();
    }
    
    /**
     * 导出文档标题为docx文件
     *
     * @param id 文档ID
     * @return 生成的docx文档
     */
    @GetMapping("/{id}/export-headings")
    @Operation(summary = "导出文档标题", description = "将文档标题数据导出为docx文件")
    public ResponseEntity<byte[]> exportHeadings(
            @Parameter(description = "文档ID") @PathVariable String id) {
        byte[] docxBytes = docInfoService.exportHeadingsToDocx(id);
        
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=doc_headings_" + id + ".docx")
                .contentLength(docxBytes.length)
                .body(docxBytes);
    }
    

}