package com.ck.quiz.doc.service.impl;

import com.ck.quiz.doc.dto.*;
import com.ck.quiz.doc.entity.DocHeading;
import com.ck.quiz.doc.entity.DocInfo;
import com.ck.quiz.doc.entity.DocProcessNode;
import com.ck.quiz.doc.entity.FunctionPoint;
import com.ck.quiz.doc.exception.DocInfoException;
import com.ck.quiz.doc.repository.DocHeadingRepository;
import com.ck.quiz.doc.repository.DocInfoRepository;
import com.ck.quiz.doc.repository.DocProcessNodeRepository;
import com.ck.quiz.doc.repository.FunctionPointRepository;
import com.ck.quiz.doc.service.DocInfoService;
import com.ck.quiz.utils.HumpHelper;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.apache.poi.xwpf.usermodel.XWPFStyle;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 文档服务实现类
 * 实现文档管理的具体业务逻辑
 */
@Service
@Slf4j
@Transactional(readOnly = true)
public class DocInfoServiceImpl implements DocInfoService {

    @Autowired
    private DocInfoRepository docInfoRepository;

    @Autowired
    private DocHeadingRepository docHeadingRepository;

    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;

    @Autowired
    private DocProcessNodeRepository nodeRepository;

    @Autowired
    private FunctionPointRepository functionPointRepository;

    @Override
    @Transactional
    public DocInfoDto createDocInfo(DocInfoCreateDto createDto) {
        log.info("创建文档: {}", createDto.getFileName());

        // 检查文件MD5是否已存在
        if (docInfoRepository.existsByFileMd5(createDto.getFileMd5())) {
            throw new DocInfoException("DOC_FILE_MD5_EXISTS", "文件已存在: " + createDto.getFileName());
        }

        // 创建文档实体
        DocInfo docInfo = new DocInfo();
        docInfo.setId(IdHelper.genUuid());
        BeanUtils.copyProperties(createDto, docInfo);

        // 保存文档
        DocInfo savedDocInfo = docInfoRepository.save(docInfo);
        log.info("文档创建成功，ID: {}", savedDocInfo.getId());

        return convertToDto(savedDocInfo);
    }


    @Override
    @Transactional
    public void deleteDocInfo(String id) {
        log.info("删除文档: {}", id);

        // 检查文档是否存在
        DocInfo docInfo = docInfoRepository.findById(id)
                .orElseThrow(() -> new DocInfoException("DOC_NOT_FOUND", "文档不存在: " + id));

        // 1️⃣ 删除流程节点记录
        int deletedNodes = nodeRepository.deleteByDocId(id);
        log.info("已删除文档 [{}] 关联的流程节点记录 {} 条", id, deletedNodes);

        // 2️⃣ 删除关联标题记录
        int deletedHeadings = docHeadingRepository.deleteByDocId(id);
        log.info("已删除文档 [{}] 关联的标题记录 {} 条", id, deletedHeadings);

        // 3️⃣ 删除原始文件
        String filePath = docInfo.getFilePath();
        if (filePath != null && !filePath.isBlank()) {
            File file = new File(filePath);
            if (file.exists()) {
                boolean deleted = file.delete();
                if (deleted) {
                    log.info("已删除原始文件: {}", filePath);
                } else {
                    log.warn("删除原始文件失败: {}", filePath);
                }
            } else {
                log.warn("原始文件不存在，无需删除: {}", filePath);
            }
        } else {
            log.warn("文档记录中无文件路径，跳过物理文件删除");
        }

        functionPointRepository.deleteByDocId(id);

        // 4️⃣ 删除文档主记录
        docInfoRepository.delete(docInfo);
        log.info("文档记录删除成功，ID: {}", id);
    }

    @Override
    public DocInfoDto getDocInfoById(String id) {
        log.info("根据ID获取文档: {}", id);

        DocInfo docInfo = docInfoRepository.findById(id)
                .orElseThrow(() -> new DocInfoException("DOC_NOT_FOUND", "文档不存在: " + id));

        return convertToDto(docInfo);
    }

    /**
     * 上传文档文件到resources/docs目录并创建文档记录
     *
     * @param file 上传的文件
     * @return 文档信息
     */
    @Override
    @Transactional
    public DocInfoDto uploadDocFile(MultipartFile file) {
        try {
            // 验证文件
            if (file.isEmpty()) {
                throw new IllegalArgumentException("上传文件不能为空");
            }

            // 获取文件名
            String fileName = file.getOriginalFilename();
            if (fileName == null) {
                throw new IllegalArgumentException("文件名不能为空");
            }

            // 确保上传目录存在
            String uploadDir = "D:\\quiz\\docs";
            File dir = new File(uploadDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            // 生成文件存储路径
            String filePath = uploadDir + File.separator + fileName;
            File dest = new File(filePath);

            // 检查文件是否已存在
            int counter = 1;
            while (dest.exists()) {
                String baseName = fileName.substring(0, fileName.lastIndexOf('.'));
                String extension = fileName.substring(fileName.lastIndexOf('.'));
                fileName = baseName + "(" + counter + ")" + extension;
                filePath = uploadDir + File.separator + fileName;
                dest = new File(filePath);
                counter++;
            }

            // 保存文件
            file.transferTo(dest);
            log.info("文件保存成功: {}", filePath);

            // 计算文件MD5
            String fileMd5 = calculateFileMd5(dest);

            // 创建文档信息
            DocInfo docInfo = new DocInfo();
            docInfo.setId(IdHelper.genUuid());
            docInfo.setFileName(fileName);
            docInfo.setFilePath(filePath);
            docInfo.setFileMd5(fileMd5);

            // 保存文档信息到数据库
            docInfo = docInfoRepository.save(docInfo);
            log.info("文档信息保存成功: {}", docInfo.getId());

            // 🔹 解析文档标题及层级关系
            extractAndSaveHeadings(docInfo.getId(), filePath);

            // 解析流程节点
            extractProcessNodesWithHeading(docInfo.getId(), filePath);
            // 解析功能点
            extractFunctionPoints(docInfo.getId());

            // 转换为DTO返回
            return convertToDto(docInfo);
        } catch (IOException e) {
            log.error("文件上传失败", e);
            throw new RuntimeException("文件上传失败: " + e.getMessage(), e);
        } catch (NoSuchAlgorithmException e) {
            log.error("计算文件MD5失败", e);
            throw new RuntimeException("计算文件MD5失败: " + e.getMessage(), e);
        }
    }

    /**
     *
     * @param docId
     */
    private void extractFunctionPoints(String docId) {
        log.info("提取功能点，文档ID: {}", docId);

        // 1️⃣ 删除旧功能点
        functionPointRepository.deleteByDocId(docId);

        // 2️⃣ 查询3、4、5级标题
        List<DocHeading> headings = docHeadingRepository.findByDocIdAndHeadingLevelIn(
                docId,
                Arrays.asList(3, 4, 5)
        );

        if (headings.isEmpty()) {
            log.info("文档 [{}] 未发现 3~5 级标题，无需提取功能点", docId);
            return;
        }

        // 3️⃣ 构建 parentId -> 子标题列表映射
        Map<String, List<DocHeading>> childrenMap = new HashMap<>();
        for (DocHeading h : headings) {
            if (h.getParentId() != null) {
                childrenMap.computeIfAbsent(h.getParentId(), k -> new ArrayList<>()).add(h);
            }
        }

        AtomicInteger orderCounter = new AtomicInteger(1);

        // 4️⃣ 获取所有三级标题（一级功能点）
        List<DocHeading> level3List = headings.stream()
                .filter(h -> h.getHeadingLevel() == 3)
                .sorted(Comparator.comparingInt(DocHeading::getOrderNo))
                .toList();

        for (DocHeading level3 : level3List) {

            // 一级功能点
            FunctionPoint fp1 = new FunctionPoint();
            fp1.setId(level3.getId());
            fp1.setDocId(docId);
            fp1.setParentId(null);
            fp1.setName(level3.getHeadingText());
            fp1.setLevel(1);
            fp1.setType("模块");
            fp1.setOrderNum(orderCounter.getAndIncrement());
            functionPointRepository.save(fp1);

            // 5️⃣ 获取四级标题（作为二级功能点）
            List<DocHeading> level4List = childrenMap.getOrDefault(level3.getId(), Collections.emptyList())
                    .stream()
                    .filter(h -> h.getHeadingLevel() == 4)
                    .sorted(Comparator.comparingInt(DocHeading::getOrderNo))
                    .toList();

            for (DocHeading level4 : level4List) {
                FunctionPoint fp2 = new FunctionPoint();
                fp2.setId(level4.getId());
                fp2.setDocId(docId);
                fp2.setParentId(fp1.getId());
                fp2.setName(level4.getHeadingText());
                fp2.setLevel(2);
                fp2.setType("子模块");
                fp2.setOrderNum(orderCounter.getAndIncrement());
                functionPointRepository.save(fp2);

                // 6️⃣ 获取五级标题（作为三级功能点）
                List<DocHeading> level5List = childrenMap.getOrDefault(level4.getId(), Collections.emptyList())
                        .stream()
                        .filter(h -> h.getHeadingLevel() == 5)
                        .sorted(Comparator.comparingInt(DocHeading::getOrderNo))
                        .toList();

                for (DocHeading level5 : level5List) {
                    FunctionPoint fp3 = new FunctionPoint();
                    fp3.setId(level5.getId());
                    fp3.setDocId(docId);
                    fp3.setParentId(fp2.getId());
                    fp3.setName(level5.getHeadingText());
                    fp3.setLevel(3);
                    fp3.setType("功能");
                    fp3.setOrderNum(orderCounter.getAndIncrement());
                    functionPointRepository.save(fp3);
                }
            }
        }

        log.info("文档 [{}] 功能点提取完成，共生成 {} 条功能点记录", docId, orderCounter.get() - 1);
    }



    public void extractAndSaveHeadings(String docId, String filePath) {
        try (FileInputStream fis = new FileInputStream(filePath);
             XWPFDocument document = new XWPFDocument(fis)) {

            // 删除旧标题记录
            docHeadingRepository.deleteByDocId(docId);

            List<XWPFParagraph> paragraphs = document.getParagraphs();
            AtomicInteger orderNo = new AtomicInteger(1);

            Map<Integer, DocHeading> lastHeadingByLevel = new HashMap<>();

            for (XWPFParagraph para : paragraphs) {
                String style = para.getStyle();
                String text = para.getText().trim();
                if (text.isEmpty()) continue;

                // 提取层级
                int level = extractHeadingLevelCompat(document, para, style);

                if (level > 0) {
                    DocHeading heading = new DocHeading();
                    heading.setId(IdHelper.genUuid());
                    heading.setDocId(docId);
                    heading.setHeadingText(text);
                    heading.setHeadingLevel(level);
                    heading.setOrderNo(orderNo.getAndIncrement());
                    heading.setStyleName(style);

                    // 找父标题
                    DocHeading parentHeading = null;
                    for (int i = level - 1; i >= 1; i--) {
                        if (lastHeadingByLevel.containsKey(i)) {
                            parentHeading = lastHeadingByLevel.get(i);
                            break;
                        }
                    }
                    heading.setParentId(parentHeading != null ? parentHeading.getId() : null);

                    // 更新当前层级状态
                    lastHeadingByLevel.put(level, heading);
                    lastHeadingByLevel.keySet().removeIf(l -> l > level);

                    docHeadingRepository.save(heading);
                }
            }

            log.info("文档 [{}] 标题解析完成，共 {} 个标题", docId, orderNo.get() - 1);

        } catch (Exception e) {
            log.error("解析文档标题层级失败: {}", e.getMessage(), e);
            throw new DocInfoException("DOC_HEADING_PARSE_FAIL", "文档标题解析失败: " + e.getMessage());
        }
    }

    /**
     * 智能识别标题层级
     * 支持：
     *  - Heading 1 / 标题 1 / heading1
     *  - 手动加粗 + 大字号（伪标题）
     *  - 自定义样式引用
     */
    private int extractHeadingLevelCompat(XWPFDocument doc, XWPFParagraph para, String style) {
        // ✅ 1. 优先识别标准样式
        if (style != null) {
            style = style.toLowerCase();
            if (style.contains("heading")) {
                return extractHeadingLevel(style);
            }
            if (style.contains("标题")) {
                Matcher m = Pattern.compile("(标题\\s*(\\d+))").matcher(style);
                if (m.find()) return Integer.parseInt(m.group(2));
            }
        }

        // ✅ 2. 尝试通过样式表 (StyleDefinitions) 判断
        try {
            if (style != null) {
                XWPFStyle xwpfStyle = doc.getStyles().getStyle(style);
                if (xwpfStyle != null && xwpfStyle.getName() != null) {
                    String name = xwpfStyle.getName().toLowerCase();
                    if (name.contains("heading")) {
                        return extractHeadingLevel(name);
                    }
                    if (name.contains("标题")) {
                        Matcher m = Pattern.compile("(标题\\s*(\\d+))").matcher(name);
                        if (m.find()) return Integer.parseInt(m.group(2));
                    }
                }
            }
        } catch (Exception ignored) {}

        // ✅ 3. 通过“伪标题”特征判断（加粗 + 大字体 + 特殊间距）
//        if (isPseudoHeading(para)) {
//            return 1; // 默认为一级标题
//        }

        return 0;
    }

    /**
     * 检测段落是否为“伪标题”格式
     */
    private boolean isPseudoHeading(XWPFParagraph para) {
        if (para.getRuns().isEmpty()) return false;
        for (XWPFRun run : para.getRuns()) {
            if (run.isBold()) {
                int fontSize = run.getFontSize();
                if (fontSize >= 14 || fontSize == -1) { // Word 默认未定义时返回 -1
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 从样式字符串中提取标题层级数字
     */
    private int extractHeadingLevel(String style) {
        Matcher m = Pattern.compile("heading\\s*(\\d+)").matcher(style.toLowerCase());
        if (m.find()) {
            return Integer.parseInt(m.group(1));
        }
        return 0;
    }


    /**
     * 计算文件MD5值
     *
     * @param file 文件对象
     * @return MD5值
     * @throws IOException              文件读取异常
     * @throws NoSuchAlgorithmException 算法不存在异常
     */
    private String calculateFileMd5(File file) throws IOException, NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance("MD5");
        byte[] fileBytes = Files.readAllBytes(file.toPath());
        byte[] hashBytes = md.digest(fileBytes);

        StringBuilder sb = new StringBuilder();
        for (byte b : hashBytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    @Override
    public Page<DocInfoDto> pageDocInfo(DocInfoQueryDto queryDto) {
        log.info("分页查询文档信息，条件: {}", queryDto);

        StringBuilder sql = new StringBuilder(
                "SELECT d.*, u.user_name create_user_name " +
                        "FROM doc_info d LEFT JOIN user u ON d.create_user = u.user_id WHERE 1=1 "
        );

        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM doc_info d WHERE 1=1 "
        );

        Map<String, Object> params = new HashMap<>();

        // 模糊查询：文件名
        JdbcQueryHelper.lowerLike(
                "fileName",
                queryDto.getFileName(),
                " AND lower(d.file_name) LIKE :fileName ",
                params,
                jdbcTemplate,
                sql,
                countSql
        );

        // 登录用户过滤（仅查看自己上传的文档）
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            JdbcQueryHelper.equals(
                    "createUser",
                    authentication.getName(),
                    " AND d.create_user = :createUser ",
                    params,
                    sql,
                    countSql
            );
        }

        // 排序（默认按 upload_time 倒序）
        JdbcQueryHelper.order(
                "d.upload_time",
                "DESC",
                sql
        );

        // 分页SQL
        String limitSql = JdbcQueryHelper.getLimitSql(
                jdbcTemplate,
                sql.toString(),
                queryDto.getPageNum(),
                queryDto.getPageSize()
        );

        // 查询数据
        List<DocInfoDto> docs = jdbcTemplate.query(
                limitSql,
                params,
                (rs, rowNum) -> {
                    DocInfoDto dto = new DocInfoDto();
                    dto.setId(rs.getString("doc_id"));
                    dto.setFileName(rs.getString("file_name"));
                    dto.setFilePath(rs.getString("file_path"));
                    dto.setFileMd5(rs.getString("file_md5"));
                    dto.setUploadUser(rs.getString("upload_user"));
                    dto.setUploadTime(rs.getTimestamp("upload_time").toLocalDateTime());
                    dto.setRemark(rs.getString("remark"));
                    dto.setCreateDate(rs.getTimestamp("create_date").toLocalDateTime());
                    dto.setCreateUser(rs.getString("create_user"));
                    dto.setUpdateDate(
                            rs.getTimestamp("update_date") != null ?
                                    rs.getTimestamp("update_date").toLocalDateTime() : null
                    );
                    dto.setUpdateUser(rs.getString("update_user"));
                    return dto;
                }
        );

        // 组装分页对象
        return JdbcQueryHelper.toPage(
                jdbcTemplate,
                countSql.toString(),
                params,
                docs,
                queryDto.getPageNum(),
                queryDto.getPageSize()
        );
    }


    /**
     * 将实体类转换为DTO
     *
     * @param docInfo 文档实体
     * @return 文档DTO
     */
    private DocInfoDto convertToDto(DocInfo docInfo) {
        DocInfoDto docInfoDto = new DocInfoDto();
        BeanUtils.copyProperties(docInfo, docInfoDto);
        return docInfoDto;
    }
    
    @Override
    public List<DocHeadingTreeDto> getDocHeadingTree(String docId) {
        log.info("获取文档标题树，文档ID: {}", docId);
        
        // 验证文档是否存在
        docInfoRepository.findById(docId)
                .orElseThrow(() -> new DocInfoException("DOC_NOT_FOUND", "文档不存在: " + docId));
        
        // 按order_no正序获取文档标题列表
        List<DocHeading> headings = docHeadingRepository.findByDocIdOrderByOrderNoAsc(docId);
        
        // 构建标题树
        return buildHeadingTree(headings);
    }
    
    /**
     * 构建文档标题树
     *
     * @param headings 标题列表
     * @return 标题树列表
     */
    private List<DocHeadingTreeDto> buildHeadingTree(List<DocHeading> headings) {
        Map<String, DocHeadingTreeDto> nodeMap = new HashMap<>();
        List<DocHeadingTreeDto> rootNodes = new ArrayList<>();
        
        // 首先将所有标题转换为DTO并放入Map
        for (DocHeading heading : headings) {
            DocHeadingTreeDto dto = new DocHeadingTreeDto();
            BeanUtils.copyProperties(heading, dto);
            nodeMap.put(heading.getId(), dto);
        }
        
        // 构建树结构
        for (DocHeading heading : headings) {
            DocHeadingTreeDto currentNode = nodeMap.get(heading.getId());
            String parentId = heading.getParentId();
            
            if (parentId == null) {
                // 顶级标题
                rootNodes.add(currentNode);
            } else {
                // 非顶级标题，添加到父标题的子节点中
                DocHeadingTreeDto parentNode = nodeMap.get(parentId);
                if (parentNode != null) {
                    parentNode.getChildren().add(currentNode);
                }
            }
        }
        
        return rootNodes;
    }

//    public void extractProcessNodesWithHeading(String docId, String filePath) {
//        try (FileInputStream fis = new FileInputStream(filePath);
//             XWPFDocument document = new XWPFDocument(fis)) {
//
//            // 删除旧记录
//            nodeRepository.deleteByDocId(docId);
//
//            List<XWPFParagraph> paragraphs = document.getParagraphs();
//            AtomicInteger seqNo = new AtomicInteger(1);
//
//            boolean inProcessSection = false;
//            String currentHeadingId = null;
//
//            for (XWPFParagraph para : paragraphs) {
//                String text = para.getText().trim();
//                if (text.isEmpty()) continue;
//
//                // 检测5级标题（Heading 5 或“标题 5”）
//                String style = para.getStyle();
//                int level = extractHeadingLevelCompat(document, para, style);
//                if (level == 5) {
//                    // 获取标题在数据库中的 ID
//                    List<DocHeading> headings = docHeadingRepository.findByDocIdAndHeadingText(docId, text);
//                    if (!headings.isEmpty()) {
//                        currentHeadingId = headings.get(0).getId();
//                    } else {
//                        currentHeadingId = null;
//                    }
//                    continue; // 标题本身不存储
//                }
//
//                // 检测开始/结束标记
//                if (text.startsWith("流程节点说明")) {
//                    inProcessSection = true;
//                    continue;
//                }
//                if (text.startsWith("【功能描述】")) {
//                    inProcessSection = false;
//                    continue;
//                }
//
//                if (inProcessSection && currentHeadingId != null) {
//                    // 按序号开头的流程节点拆分（保持序号在内容中）
//                    String[] lines = text.split("(?<=^|\\n)(?=\\d+、)");
//                    for (String line : lines) {
//                        line = line.trim();
//                        if (line.isEmpty()) continue;
//
//                        DocProcessNode node = new DocProcessNode();
//                        node.setId(IdHelper.genUuid());
//                        node.setDocId(docId);
//                        node.setHeadingId(currentHeadingId);
//                        node.setSequenceNo(seqNo.getAndIncrement());
//                        node.setContent(line);
//
//                        nodeRepository.save(node);
//                    }
//                }
//            }
//
//        } catch (Exception e) {
//            throw new RuntimeException("提取流程节点失败: " + e.getMessage(), e);
//        }
//    }

    public void extractProcessNodesWithHeading(String docId, String filePath) {
        try (FileInputStream fis = new FileInputStream(filePath);
             XWPFDocument document = new XWPFDocument(fis)) {

            // 删除旧记录
            nodeRepository.deleteByDocId(docId);

            List<XWPFParagraph> paragraphs = document.getParagraphs();
            AtomicInteger seqNo = new AtomicInteger(1);

            boolean inProcessSection = false;
            String currentHeadingId = null;
            StringBuilder processBuffer = new StringBuilder();

            for (int i = 0; i < paragraphs.size(); i++) {
                XWPFParagraph para = paragraphs.get(i);
                String text = para.getText().trim();
                if (text.isEmpty()) continue;

                // 检测标题级别
                String style = para.getStyle();
                int level = extractHeadingLevelCompat(document, para, style);

                // === 检测七级标题（Heading 7）===
                if (level == 7) {
                    // 遇到新标题前，先保存上一个“流程步骤”缓冲区内容
                    if (inProcessSection && currentHeadingId != null && processBuffer.length() > 0) {
                        saveProcessNodes(docId, currentHeadingId, processBuffer.toString(), seqNo);
                        processBuffer.setLength(0);
                        inProcessSection = false;
                    }

                    // 设置当前 headingId
                    List<DocHeading> headings = docHeadingRepository.findByDocIdAndHeadingText(docId, text);
                    if (!headings.isEmpty()) {
                        currentHeadingId = headings.get(0).getId();
                    } else {
                        currentHeadingId = null;
                    }
                    continue;
                }

                // === 检测“本时序图流程步骤如下：”开始标记 ===
                if (text.contains("本时序图流程步骤如下：")) {
                    inProcessSection = true;
                    processBuffer.setLength(0); // 清空旧内容
                    continue;
                }

                // === 如果在流程步骤区，收集内容，直到下一个七级标题出现 ===
                if (inProcessSection) {
                    processBuffer.append(text).append("\n");
                }
            }

            // 文档结束时若仍在流程区，也保存
            if (inProcessSection && currentHeadingId != null && processBuffer.length() > 0) {
                saveProcessNodes(docId, currentHeadingId, processBuffer.toString(), seqNo);
            }

        } catch (Exception e) {
            throw new RuntimeException("提取流程节点失败: " + e.getMessage(), e);
        }
    }

    /**
     * 按行或编号拆分保存流程节点
     */
    private void saveProcessNodes(String docId, String headingId, String content, AtomicInteger seqNo) {
        // 按编号或换行拆分，如 "1、" 或 "2."
        String[] lines = content.split("(?<=^|\\n)(?=\\d+\\s*[、.])");
        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty()) continue;

            DocProcessNode node = new DocProcessNode();
            node.setId(IdHelper.genUuid());
            node.setDocId(docId);
            node.setHeadingId(headingId);
            node.setSequenceNo(seqNo.getAndIncrement());
            node.setContent(line);

            nodeRepository.save(node);
        }
    }


    /**
     * 分页查询文档流程节点
     *
     * @param queryDto 查询条件
     * @return 流程节点分页结果
     */
    @Override
    public Page<DocProcessNodeDto> pageDocProcessNode(DocProcessNodeQueryDto queryDto) {
        log.info("分页查询文档流程节点，查询条件: {}", queryDto);
        
        String docId = queryDto.getDocId();
        Integer pageNum = queryDto.getPageNum();
        Integer pageSize = queryDto.getPageSize();
        String keyWord = queryDto.getKeyWord();
        String headingId = queryDto.getHeadingId();
        
        // 验证文档是否存在
        docInfoRepository.findById(docId)
                .orElseThrow(() -> new DocInfoException("DOC_NOT_FOUND", "文档不存在: " + docId));
        
        StringBuilder sql = new StringBuilder(
                "SELECT n.node_id, n.doc_id, n.heading_id, n.sequence_no, n.content, n.create_date, h.heading_text " +
                "FROM doc_process_node n LEFT JOIN doc_heading h ON n.heading_id = h.heading_id " +
                "WHERE n.doc_id = :docId "
        );
        
        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM doc_process_node n WHERE n.doc_id = :docId "
        );
        
        Map<String, Object> params = new HashMap<>();
        params.put("docId", docId);
        
        // 添加标题ID筛选条件
        if (headingId != null && !headingId.isEmpty()) {
            sql.append("AND n.heading_id = :headingId ");
            countSql.append("AND n.heading_id = :headingId ");
            params.put("headingId", headingId);
        }
        
        // 添加关键词搜索条件
        if (keyWord != null && !keyWord.isEmpty()) {
            String searchPattern = "%" + keyWord + "%";
            sql.append("AND (n.content LIKE :keyWord OR h.heading_text LIKE :keyWord) ");
            countSql.append("AND (n.content LIKE :keyWord OR (SELECT h.heading_text FROM doc_heading h WHERE h.heading_id = n.heading_id) LIKE :keyWord) ");
            params.put("keyWord", searchPattern);
        }
        
        // 排序（按序号正序）
        JdbcQueryHelper.order(
                "n.sequence_no",
                "ASC",
                sql
        );
        
        // 分页SQL
        String limitSql = JdbcQueryHelper.getLimitSql(
                jdbcTemplate,
                sql.toString(),
                pageNum,
                pageSize
        );
        
        // 查询数据，返回DTO对象
        List<DocProcessNodeDto> nodeDtos = jdbcTemplate.query(
                limitSql,
                params,
                (rs, rowNum) -> {
                    DocProcessNodeDto dto = new DocProcessNodeDto();
                    dto.setId(rs.getString("node_id"));
                    dto.setDocId(rs.getString("doc_id"));
                    dto.setHeadingId(rs.getString("heading_id"));
                    dto.setSequenceNo(rs.getInt("sequence_no"));
                    dto.setContent(rs.getString("content"));
                    dto.setCreateDate(rs.getTimestamp("create_date").toLocalDateTime());
                    dto.setHeadingText(rs.getString("heading_text")); // 添加标题文本
                    return dto;
                }
        );
        
        // 组装分页对象
        return JdbcQueryHelper.toPage(
                jdbcTemplate,
                countSql.toString(),
                params,
                nodeDtos,
                pageNum,
                pageSize
        );
    }
    
    @Override
    public List<FunctionPointTreeDto> getFunctionPointTree(String docId) {
        log.info("获取功能点树，文档ID: {}", docId);
        
        // 验证文档是否存在
        docInfoRepository.findById(docId)
                .orElseThrow(() -> new DocInfoException("DOC_NOT_FOUND", "文档不存在: " + docId));
        
        // 按order_num正序获取文档功能点列表
        List<FunctionPoint> functionPoints = functionPointRepository.findByDocIdOrderByOrderNumAsc(docId);
        
        // 构建功能点树
        return buildFunctionPointTree(functionPoints);
    }
    
    /**
     * 构建功能点树
     *
     * @param functionPoints 功能点列表
     * @return 功能点树列表
     */
    private List<FunctionPointTreeDto> buildFunctionPointTree(List<FunctionPoint> functionPoints) {
        Map<String, FunctionPointTreeDto> nodeMap = new HashMap<>();
        List<FunctionPointTreeDto> rootNodes = new ArrayList<>();
        
        // 首先将所有功能点转换为DTO并放入Map
        for (FunctionPoint functionPoint : functionPoints) {
            FunctionPointTreeDto dto = new FunctionPointTreeDto();
            BeanUtils.copyProperties(functionPoint, dto);
            nodeMap.put(functionPoint.getId(), dto);
        }
        
        // 构建树结构
        for (FunctionPoint functionPoint : functionPoints) {
            FunctionPointTreeDto currentNode = nodeMap.get(functionPoint.getId());
            String parentId = functionPoint.getParentId();
            
            if (parentId == null) {
                // 顶级功能点
                rootNodes.add(currentNode);
            } else {
                // 非顶级功能点，添加到父功能点的子节点中
                FunctionPointTreeDto parentNode = nodeMap.get(parentId);
                if (parentNode != null) {
                    parentNode.getChildren().add(currentNode);
                }
            }
        }
        
        return rootNodes;
    }

    @Override
    public Page<FunctionPointTreeDto> getThreeLevelFunctionPointsPage(FunctionPointQueryDto queryDto) {
        log.info("分页查询三级功能点，查询条件: {}", queryDto);

        String docId = queryDto.getDocId();
        String name = queryDto.getName();
        String parentId = queryDto.getParentId();
        int pageNum = queryDto.getPageNum();
        int pageSize = queryDto.getPageSize();

        if (StringUtils.isBlank(docId)) {
            throw new DocInfoException("DOC_ID_REQUIRED", "文档ID不能为空");
        }

        Map<String, Object> queryParams = new HashMap<>();
        queryParams.put("docId", docId);
        
        StringBuilder listSql = new StringBuilder(
                "SELECT fp.id, fp.doc_id, fp.parent_id, fp.name, fp.level, fp.type, fp.order_num, " +
                        "       fp.create_date, fp.update_date, p.name AS parent_name " +
                        "FROM function_point fp " +
                        "LEFT JOIN function_point p ON fp.parent_id = p.id " +
                        "WHERE fp.doc_id = :docId AND fp.level = 3 "
        );

        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM function_point fp WHERE fp.doc_id = :docId AND fp.level = 3 "
        );

        JdbcQueryHelper.equals("parentId", parentId, "and fp.parent_id = :parentId ", queryParams, listSql, countSql);

        // 模糊搜索功能点名称
        JdbcQueryHelper.lowerLike(
                "keyWord",
                name,
                " AND lower(fp.name) LIKE :keyWord ",
                queryParams,
                jdbcTemplate,
                listSql,
                countSql
        );

        // 排序（按 order_num 升序）
        JdbcQueryHelper.order("fp.order_num", "ASC", listSql);

        // 分页SQL
        String limitSql = JdbcQueryHelper.getLimitSql(
                jdbcTemplate,
                listSql.toString(),
                pageNum,
                pageSize
        );

        Map<String, FunctionPointTreeDto> idMap = new HashMap<>();
        // 查询结果
        List<FunctionPointTreeDto> records = jdbcTemplate.query(
                limitSql,
                queryParams,
                (rs, rowNum) -> {
                    FunctionPointTreeDto dto = new FunctionPointTreeDto();
                    String id = rs.getString("id");
                    dto.setId(id);
                    dto.setDocId(rs.getString("doc_id"));
                    dto.setParentId(rs.getString("parent_id"));
                    dto.setName(rs.getString("name"));
                    dto.setLevel(rs.getInt("level"));
                    dto.setType(rs.getString("type"));
                    dto.setOrderNum(rs.getInt("order_num"));
                    dto.setParentName(rs.getString("parent_name"));
                    idMap.put(id, dto);
                    return dto;
                }
        );
        if(!idMap.isEmpty()) {
            queryParams.put("docId", docId);
            queryParams.put("headingIds", new ArrayList<>(idMap.keySet()));
            Map<String, List<String>> contentsMap = new HashMap<>();
            HumpHelper.lineToHump(jdbcTemplate.queryForList("select * from doc_process_node where doc_id = :docId and heading_id in (:headingIds) order by sequence_no asc  ", queryParams)).forEach(map->{
                String headingId = MapUtils.getString(map, "headingId");
                String content = MapUtils.getString(map, "content");
                contentsMap.computeIfAbsent(headingId, key->new ArrayList<>()).add(content);
            });
            contentsMap.forEach((id, contents)->{
                if(idMap.containsKey(id)) {
                    idMap.get(id).setProcessDetail(StringUtils.join(contents, "\n"));
                }
            });
        }

        // 组装分页对象
        return JdbcQueryHelper.toPage(
                jdbcTemplate,
                countSql.toString(),
                queryParams,
                records,
                pageNum,
                pageSize
        );
    }



}