package com.ck.quiz.doc.service;

import com.ck.quiz.doc.dto.*;
import com.ck.quiz.doc.entity.DocProcessNode;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * 文档服务接口
 * 定义文档管理的核心业务操作
 */
public interface DocInfoService {

    /**
     * 创建新文档
     *
     * @param createDto 文档创建信息
     * @return 创建的文档信息
     */
    DocInfoDto createDocInfo(DocInfoCreateDto createDto);

    /**
     * 上传文档文件
     *
     * @param file 上传的文件
     * @return 文档信息
     */
    DocInfoDto uploadDocFile(MultipartFile file);

    /**
     * 删除文档
     *
     * @param id 文档ID
     */
    void deleteDocInfo(String id);

    /**
     * 根据ID获取文档信息
     *
     * @param id 文档ID
     * @return 文档信息
     */
    DocInfoDto getDocInfoById(String id);

    /**
     * 分页查询文档列表
     *
     * @param queryDto 查询条件
     * @return 分页文档列表
     */
    Page<DocInfoDto> pageDocInfo(DocInfoQueryDto queryDto);
    
    /**
     * 根据文档ID获取文档标题树
     *
     * @param docId 文档ID
     * @return 文档标题树列表
     */
    List<DocHeadingTreeDto> getDocHeadingTree(String docId);
    
    /**
     * 分页查询文档流程节点
     *
     * @param queryDto 查询条件
     * @return 流程节点分页结果
     */
    Page<DocProcessNodeDto> pageDocProcessNode(DocProcessNodeQueryDto queryDto);
    
    /**
     * 导出文档标题为docx文件
     *
     * @param docId 文档ID
     * @return 生成的docx文档字节数组
     */
    byte[] exportHeadingsToDocx(String docId);
    
    /**
     * 根据文档ID获取功能点树
     *
     * @param docId 文档ID
     * @return 功能点树列表
     */
    List<FunctionPointTreeDto> getFunctionPointTree(String docId);

    /**
     * 分页查询文档三级功能点
     *
     * @param queryDto 查询条件
     * @return 分页功能点列表
     */
    Page<FunctionPointTreeDto> getThreeLevelFunctionPointsPage(FunctionPointQueryDto queryDto);

    Map<String, Object> generateByProcess(String functionId);

    void batchGenerateProcessDescription();

    String generateFlowByProcess(String functionId);

    void batchGenerateFlowByProcess();

    Map<String, Object> generateInfByProcess(String functionId);

    void batchGenerateInf();
    
}