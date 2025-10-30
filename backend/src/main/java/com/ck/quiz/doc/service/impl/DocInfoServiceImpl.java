package com.ck.quiz.doc.service.impl;

import com.ck.quiz.doc.dto.DocHeadingTreeDto;
import com.ck.quiz.doc.dto.DocInfoCreateDto;
import com.ck.quiz.doc.dto.DocInfoDto;
import com.ck.quiz.doc.dto.DocInfoQueryDto;
import com.ck.quiz.doc.entity.DocHeading;
import com.ck.quiz.doc.entity.DocInfo;
import com.ck.quiz.doc.exception.DocInfoException;
import com.ck.quiz.doc.repository.DocHeadingRepository;
import com.ck.quiz.doc.repository.DocInfoRepository;
import com.ck.quiz.doc.service.DocInfoService;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import lombok.extern.slf4j.Slf4j;
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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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

        // 1️⃣ 删除关联标题记录
        int deletedHeadings = docHeadingRepository.deleteByDocId(id);
        log.info("已删除文档 [{}] 关联的标题记录 {} 条", id, deletedHeadings);

        // 2️⃣ 删除原始文件
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

        // 3️⃣ 删除文档主记录
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
        if (isPseudoHeading(para)) {
            return 1; // 默认为一级标题
        }

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
}