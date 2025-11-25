package com.ck.quiz.funcdoc.service.impl;

import com.ck.quiz.funcdoc.dto.*;
import com.ck.quiz.funcdoc.entity.FuncDocHeading;
import com.ck.quiz.funcdoc.entity.FuncDoc;
import com.ck.quiz.funcdoc.entity.FuncDocProcessNode;
import com.ck.quiz.funcdoc.entity.FunctionPoint;
import com.ck.quiz.funcdoc.exception.FuncDocException;
import com.ck.quiz.funcdoc.repository.FuncDocHeadingRepository;
import com.ck.quiz.funcdoc.repository.FuncDocInfoRepository;
import com.ck.quiz.funcdoc.repository.FuncDocProcessNodeRepository;
import com.ck.quiz.funcdoc.repository.FunctionPointRepository;
import com.ck.quiz.funcdoc.service.FuncDocService;
import com.ck.quiz.thpool.CommonPool;
import com.ck.quiz.utils.HumpHelper;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.util.Units;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xwpf.usermodel.*;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTAbstractNum;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTLvl;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.STNumberFormat;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.math.BigInteger;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
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
public class FuncFuncDocServiceImpl implements FuncDocService {

    @Autowired
    private FuncDocInfoRepository funcDocInfoRepository;

    @Autowired
    private FuncDocHeadingRepository funcDocHeadingRepository;

    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;

    @Autowired
    private FuncDocProcessNodeRepository nodeRepository;

    @Autowired
    private FunctionPointRepository functionPointRepository;

    @Autowired
    private ChatClient.Builder chatBuilder;

    @Override
    @Transactional
    public FuncDocDto createDocInfo(FuncDocCreateDto createDto) {
        log.info("创建文档: {}", createDto.getFileName());

        // 检查文件MD5是否已存在
        if (funcDocInfoRepository.existsByFileMd5(createDto.getFileMd5())) {
            throw new FuncDocException("DOC_FILE_MD5_EXISTS", "文件已存在: " + createDto.getFileName());
        }

        // 创建文档实体
        FuncDoc funcDoc = new FuncDoc();
        funcDoc.setId(IdHelper.genUuid());
        BeanUtils.copyProperties(createDto, funcDoc);

        // 保存文档
        FuncDoc savedFuncDoc = funcDocInfoRepository.save(funcDoc);
        log.info("文档创建成功，ID: {}", savedFuncDoc.getId());

        return convertToDto(savedFuncDoc);
    }


    @Override
    @Transactional
    public void deleteDocInfo(String id) {
        log.info("删除文档: {}", id);

        // 检查文档是否存在
        FuncDoc funcDoc = funcDocInfoRepository.findById(id)
                .orElseThrow(() -> new FuncDocException("DOC_NOT_FOUND", "文档不存在: " + id));

        // 1️⃣ 删除流程节点记录
        int deletedNodes = nodeRepository.deleteByDocId(id);
        log.info("已删除文档 [{}] 关联的流程节点记录 {} 条", id, deletedNodes);

        // 2️⃣ 删除关联标题记录
        int deletedHeadings = funcDocHeadingRepository.deleteByDocId(id);
        log.info("已删除文档 [{}] 关联的标题记录 {} 条", id, deletedHeadings);

        // 3️⃣ 删除原始文件
        String filePath = funcDoc.getFilePath();
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
        funcDocInfoRepository.delete(funcDoc);
        log.info("文档记录删除成功，ID: {}", id);
    }

    @Override
    public FuncDocDto getDocInfoById(String id) {
        log.info("根据ID获取文档: {}", id);

        FuncDoc funcDoc = funcDocInfoRepository.findById(id)
                .orElseThrow(() -> new FuncDocException("DOC_NOT_FOUND", "文档不存在: " + id));

        return convertToDto(funcDoc);
    }

    /**
     * 上传文档文件到resources/docs目录并创建文档记录
     *
     * @param file 上传的文件
     * @return 文档信息
     */
    @Override
    @Transactional
    public FuncDocDto uploadDocFile(MultipartFile file) {
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
            FuncDoc funcDoc = new FuncDoc();
            funcDoc.setId(IdHelper.genUuid());
            funcDoc.setFileName(fileName);
            funcDoc.setFilePath(filePath);
            funcDoc.setFileMd5(fileMd5);

            // 保存文档信息到数据库
            funcDoc = funcDocInfoRepository.save(funcDoc);
            log.info("文档信息保存成功: {}", funcDoc.getId());

            // 🔹 解析文档标题及层级关系
            extractAndSaveHeadings(funcDoc.getId(), filePath);

            // 解析流程节点
            extractProcessNodesWithHeading(funcDoc.getId(), filePath);
            // 解析功能点
            extractFunctionPoints(funcDoc.getId());

            // 转换为DTO返回
            return convertToDto(funcDoc);
        } catch (IOException e) {
            log.error("文件上传失败", e);
            throw new RuntimeException("文件上传失败: " + e.getMessage(), e);
        } catch (NoSuchAlgorithmException e) {
            log.error("计算文件MD5失败", e);
            throw new RuntimeException("计算文件MD5失败: " + e.getMessage(), e);
        }
    }

    /**
     * @param docId
     */
    private void extractFunctionPoints(String docId) {
        log.info("提取功能点，文档ID: {}", docId);

        // 1️⃣ 删除旧功能点
        functionPointRepository.deleteByDocId(docId);

        // 2️⃣ 查询3、4、5级标题
        List<FuncDocHeading> headings = funcDocHeadingRepository.findByDocIdAndHeadingLevelIn(
                docId,
                Arrays.asList(3, 4, 5)
        );

        if (headings.isEmpty()) {
            log.info("文档 [{}] 未发现 3~5 级标题，无需提取功能点", docId);
            return;
        }

        // 3️⃣ 构建 parentId -> 子标题列表映射
        Map<String, List<FuncDocHeading>> childrenMap = new HashMap<>();
        for (FuncDocHeading h : headings) {
            if (h.getParentId() != null) {
                childrenMap.computeIfAbsent(h.getParentId(), k -> new ArrayList<>()).add(h);
            }
        }

        AtomicInteger orderCounter = new AtomicInteger(1);

        // 4️⃣ 获取所有三级标题（一级功能点）
        List<FuncDocHeading> level3List = headings.stream()
                .filter(h -> h.getHeadingLevel() == 3)
                .sorted(Comparator.comparingInt(FuncDocHeading::getOrderNo))
                .toList();

        for (FuncDocHeading level3 : level3List) {

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
            List<FuncDocHeading> level4List = childrenMap.getOrDefault(level3.getId(), Collections.emptyList())
                    .stream()
                    .filter(h -> h.getHeadingLevel() == 4)
                    .sorted(Comparator.comparingInt(FuncDocHeading::getOrderNo))
                    .toList();

            for (FuncDocHeading level4 : level4List) {
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
                List<FuncDocHeading> level5List = childrenMap.getOrDefault(level4.getId(), Collections.emptyList())
                        .stream()
                        .filter(h -> h.getHeadingLevel() == 5)
                        .sorted(Comparator.comparingInt(FuncDocHeading::getOrderNo))
                        .toList();

                for (FuncDocHeading level5 : level5List) {
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
            funcDocHeadingRepository.deleteByDocId(docId);

            List<XWPFParagraph> paragraphs = document.getParagraphs();
            AtomicInteger orderNo = new AtomicInteger(1);

            Map<Integer, FuncDocHeading> lastHeadingByLevel = new HashMap<>();

            for (XWPFParagraph para : paragraphs) {
                String style = para.getStyle();
                String text = para.getText().trim();
                if (text.isEmpty()) continue;

                // 提取层级
                int level = extractHeadingLevelCompat(document, para, style);

                if (level > 0) {
                    FuncDocHeading heading = new FuncDocHeading();
                    heading.setId(IdHelper.genUuid());
                    heading.setDocId(docId);
                    heading.setHeadingText(text);
                    heading.setHeadingLevel(level);
                    heading.setOrderNo(orderNo.getAndIncrement());
                    heading.setStyleName(style);

                    // 找父标题
                    FuncDocHeading parentHeading = null;
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

                    funcDocHeadingRepository.save(heading);
                }
            }

            log.info("文档 [{}] 标题解析完成，共 {} 个标题", docId, orderNo.get() - 1);

        } catch (Exception e) {
            log.error("解析文档标题层级失败: {}", e.getMessage(), e);
            throw new FuncDocException("DOC_HEADING_PARSE_FAIL", "文档标题解析失败: " + e.getMessage());
        }
    }

    /**
     * 智能识别标题层级
     * 支持：
     * - Heading 1 / 标题1 / heading1
     * - 手动加粗 + 大字号（伪标题）
     * - 自定义样式引用
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
        } catch (Exception ignored) {
        }

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
    public Page<FuncDocDto> pageDocInfo(FuncDocQueryDto queryDto) {
        log.info("分页查询文档信息，条件: {}", queryDto);

        StringBuilder sql = new StringBuilder(
                "SELECT d.*, u.user_name upload_user_name " +
                        "FROM func_doc d LEFT JOIN user u ON d.upload_user = u.user_id WHERE 1=1 "
        );

        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM func_doc d WHERE 1=1 "
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
        List<FuncDocDto> docs = jdbcTemplate.query(
                limitSql,
                params,
                (rs, rowNum) -> {
                    FuncDocDto dto = new FuncDocDto();
                    dto.setId(rs.getString("doc_id"));
                    dto.setFileName(rs.getString("file_name"));
                    dto.setFilePath(rs.getString("file_path"));
                    dto.setFileMd5(rs.getString("file_md5"));
                    dto.setUploadUser(rs.getString("upload_user"));
                    dto.setUploadTime(rs.getTimestamp("upload_time").toLocalDateTime());
                    dto.setRemark(rs.getString("remark"));
                    dto.setCreateDate(rs.getTimestamp("create_date").toLocalDateTime());
                    dto.setCreateUser(rs.getString("create_user"));
                    dto.setUploadUserName(rs.getString("upload_user_name"));
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
     * @param funcDoc 文档实体
     * @return 文档DTO
     */
    private FuncDocDto convertToDto(FuncDoc funcDoc) {
        FuncDocDto funcDocDto = new FuncDocDto();
        BeanUtils.copyProperties(funcDoc, funcDocDto);
        return funcDocDto;
    }

    @Override
    public List<FuncDocHeadingTreeDto> getDocHeadingTree(String docId) {
        log.info("获取文档标题树，文档ID: {}", docId);

        // 验证文档是否存在
        funcDocInfoRepository.findById(docId)
                .orElseThrow(() -> new FuncDocException("DOC_NOT_FOUND", "文档不存在: " + docId));

        // 按order_no正序获取文档标题列表
        List<FuncDocHeading> headings = funcDocHeadingRepository.findByDocIdOrderByOrderNoAsc(docId);

        // 构建标题树
        return buildHeadingTree(headings);
    }

    /**
     * 构建文档标题树
     *
     * @param headings 标题列表
     * @return 标题树列表
     */
    private List<FuncDocHeadingTreeDto> buildHeadingTree(List<FuncDocHeading> headings) {
        Map<String, FuncDocHeadingTreeDto> nodeMap = new HashMap<>();
        List<FuncDocHeadingTreeDto> rootNodes = new ArrayList<>();

        // 首先将所有标题转换为DTO并放入Map
        for (FuncDocHeading heading : headings) {
            FuncDocHeadingTreeDto dto = new FuncDocHeadingTreeDto();
            BeanUtils.copyProperties(heading, dto);
            nodeMap.put(heading.getId(), dto);
        }

        // 构建树结构
        for (FuncDocHeading heading : headings) {
            FuncDocHeadingTreeDto currentNode = nodeMap.get(heading.getId());
            String parentId = heading.getParentId();

            if (parentId == null) {
                // 顶级标题
                rootNodes.add(currentNode);
            } else {
                // 非顶级标题，添加到父标题的子节点中
                FuncDocHeadingTreeDto parentNode = nodeMap.get(parentId);
                if (parentNode != null) {
                    parentNode.getChildren().add(currentNode);
                }
            }
        }

        return rootNodes;
    }

    @Override
    public byte[] exportHeadingsToDocx(String docId) {
        log.info("导出文档标题为docx，文档ID: {}", docId);

        // 验证文档是否存在
        funcDocInfoRepository.findById(docId)
                .orElseThrow(() -> new FuncDocException("DOC_NOT_FOUND", "文档不存在: " + docId));

        // 获取文档标题树
        List<FuncDocHeadingTreeDto> headingTree = getDocHeadingTree(docId);

        List<FunctionPointTreeDto> functionPointTree = getFunctionPointTree(docId);
        Map<String, FunctionPointTreeDto> functionIdMap = new HashMap<>();
        resolveFunctionIdMap(functionPointTree, functionIdMap);

        // 创建新的docx文档
        try (XWPFDocument document = new XWPFDocument()) {
            // 创建标题样式
            createHeadingStyles(document);

            // 添加空行
            document.createParagraph();

            // 递归添加标题树
            for (FuncDocHeadingTreeDto rootNode : headingTree) {
                addHeadingToDocument(document, rootNode, 1, functionIdMap);
            }

            // 保存到字节数组
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            document.write(outputStream);
            outputStream.flush();
            return outputStream.toByteArray();

        } catch (IOException e) {
            log.error("导出docx文档失败: {}", e.getMessage(), e);
            throw new FuncDocException("DOC_EXPORT_FAIL", "导出文档失败: " + e.getMessage());
        }
    }

    /**
     * 递归解析功能点树，构建功能点ID与节点的映射关系
     */
    private void resolveFunctionIdMap(List<FunctionPointTreeDto> functionPointTree, Map<String, FunctionPointTreeDto> functionIdMap) {
        if (functionPointTree == null || functionPointTree.isEmpty()) {
            return;
        }

        for (FunctionPointTreeDto node : functionPointTree) {
            // 将当前节点放入Map
            if (node.getId() != null) {
                functionIdMap.put(node.getId(), node);
            }

            // 递归处理子节点
            if (node.getChildren() != null && !node.getChildren().isEmpty()) {
                resolveFunctionIdMap(node.getChildren(), functionIdMap);
            }
        }
    }


    /**
     * 创建标题样式
     */
    private void createHeadingStyles(XWPFDocument document) {
        // 这里可以创建自定义样式，但为了简单起见，我们直接在添加标题时设置格式
    }

    /**
     * 递归添加标题到文档
     */
    private void addHeadingToDocument(XWPFDocument document, FuncDocHeadingTreeDto heading, int level, Map<String, FunctionPointTreeDto> functionIdMap) {
        // 确保level不超过9（Word支持的最大标题级别）
        int actualLevel = Math.min(level, 9);

        // 确保存在编号定义
        if (document.getNumbering() == null) {
            XWPFNumbering numbering = document.createNumbering();
            createMultilevelHeadingNumbering(numbering);
        }

        // 获取编号对象
        XWPFNumbering numbering = document.getNumbering();
        BigInteger abstractNumId = BigInteger.ZERO;
        BigInteger numId = numbering.numExist(BigInteger.ONE)
                ? BigInteger.ONE
                : numbering.addNum(abstractNumId);

        // 创建段落并设置标题样式
        XWPFParagraph paragraph = document.createParagraph();
        paragraph.setStyle("标题" + actualLevel);
        paragraph.setNumID(numId);
        paragraph.setNumILvl(BigInteger.valueOf(actualLevel - 1));

        XWPFRun run = paragraph.createRun();
        run.setText(heading.getHeadingText());

        // 根据标题级别设置字体样式
        switch (actualLevel) {
            case 1 -> {
                run.setFontSize(16);
                run.setBold(true);
            }
            case 2 -> {
                run.setFontSize(14);
                run.setBold(true);
            }
            case 3 -> {
                run.setFontSize(13);
                run.setBold(true);
            }
            case 4 -> {
                run.setFontSize(12);
                run.setBold(true);
            }
            default -> run.setFontSize(11);
        }

        // 第五级标题时，输出功能说明及配图
        if (actualLevel == 5 && functionIdMap.containsKey(heading.getId())) {
            FunctionPointTreeDto functionPoint = functionIdMap.get(heading.getId());

            // 写入业务说明、流程简介、流程节点信息、功能描述
            addSubSection(document, "业务说明：", functionPoint.getBusinessDesc());
            addSubSection(document, "流程简述：", functionPoint.getProcessSummary());
            insertFlowImage(document, functionPoint.getId());
            addSubSection(document, "流程节点信息：", functionPoint.getProcessDetail());
            addSubSection(document, "功能描述：", functionPoint.getFunctionDesc());

            // 插入功能流程图
        }

        // 递归添加子标题
        if (heading.getChildren() != null && !heading.getChildren().isEmpty()) {
            for (FuncDocHeadingTreeDto child : heading.getChildren()) {
                addHeadingToDocument(document, child, actualLevel + 1, functionIdMap);
            }
        }
    }

    /**
     * 添加说明小节（标题 + 内容）
     */
    private void addSubSection(XWPFDocument document, String title, String content) {
        if (content == null || content.isBlank()) return;

        // 添加小标题
        XWPFParagraph titlePara = document.createParagraph();
        XWPFRun titleRun = titlePara.createRun();
        titleRun.setBold(true);
        titleRun.setFontSize(12);
        titleRun.setText(title);

        // 添加正文内容（支持多行）
        for (String line : content.split("\\r?\\n")) {
            if (line.isBlank()) continue;
            XWPFParagraph contentPara = document.createParagraph();
            XWPFRun contentRun = contentPara.createRun();
            contentRun.setFontSize(11);
            contentRun.setText(line.trim());
        }
    }

    /**
     * 插入功能流程图（如果图片存在）
     */
    private void insertFlowImage(XWPFDocument document, String functionId) {
        String uploadDir = "D:\\quiz\\flows";
        Path imagePath = Paths.get(uploadDir, functionId + ".png");

        if (Files.exists(imagePath)) {
            try (InputStream is = Files.newInputStream(imagePath)) {
                XWPFParagraph imgPara = document.createParagraph();
                XWPFRun imgRun = imgPara.createRun();

                // 添加标题“流程图：”
                XWPFParagraph labelPara = document.createParagraph();
                XWPFRun labelRun = labelPara.createRun();
                labelRun.setBold(true);
                labelRun.setFontSize(12);
                labelRun.setText("流程图：");

                // 插入图片（设置宽度、高度）
                imgRun.addPicture(
                        is,
                        XWPFDocument.PICTURE_TYPE_PNG,
                        imagePath.getFileName().toString(),
                        Units.toEMU(420),  // 宽度
                        Units.toEMU(260)   // 高度
                );
            } catch (Exception e) {
                System.err.println("插入流程图失败：" + imagePath + " - " + e.getMessage());
            }
        } else {
            System.err.println("未找到流程图文件：" + imagePath);
        }
    }


    /**
     * 创建多级标题编号定义：
     * - 标题1 从 2 开始
     * - 标题2 从 2.1 开始
     * - 标题3 从 2.1.5 开始
     * - 标题4 从 2.1.5.1 开始
     * - 标题5 从 2.1.5.1.1 开始
     */
    private void createMultilevelHeadingNumbering(XWPFNumbering numbering) {
        CTAbstractNum abstractNum = CTAbstractNum.Factory.newInstance();
        abstractNum.setAbstractNumId(BigInteger.ZERO);

        // ===== 标题1：从2开始 =====
        CTLvl lvl1 = abstractNum.addNewLvl();
        lvl1.setIlvl(BigInteger.ZERO);
        lvl1.addNewStart().setVal(BigInteger.valueOf(2));
        lvl1.addNewNumFmt().setVal(STNumberFormat.DECIMAL);
        lvl1.addNewLvlText().setVal("%1");
        lvl1.addNewPStyle().setVal("标题1");

        // ===== 标题2：从2.1开始 =====
        CTLvl lvl2 = abstractNum.addNewLvl();
        lvl2.setIlvl(BigInteger.ONE);
        lvl2.addNewStart().setVal(BigInteger.ONE);
        lvl2.addNewNumFmt().setVal(STNumberFormat.DECIMAL);
        lvl2.addNewLvlText().setVal("%1.%2");
        lvl2.addNewPStyle().setVal("标题2");

        // ===== 标题3：从2.1.5开始 =====
        CTLvl lvl3 = abstractNum.addNewLvl();
        lvl3.setIlvl(BigInteger.valueOf(2));
        lvl3.addNewStart().setVal(BigInteger.valueOf(5));
        lvl3.addNewNumFmt().setVal(STNumberFormat.DECIMAL);
        lvl3.addNewLvlText().setVal("%1.%2.%3");
        lvl3.addNewPStyle().setVal("标题3");

        // ===== 标题4：从2.1.5.1开始 =====
        CTLvl lvl4 = abstractNum.addNewLvl();
        lvl4.setIlvl(BigInteger.valueOf(3));
        lvl4.addNewStart().setVal(BigInteger.ONE);
        lvl4.addNewNumFmt().setVal(STNumberFormat.DECIMAL);
        lvl4.addNewLvlText().setVal("%1.%2.%3.%4");
        lvl4.addNewPStyle().setVal("标题4");

        // ===== 标题5：从2.1.5.1.1开始 =====
        CTLvl lvl5 = abstractNum.addNewLvl();
        lvl5.setIlvl(BigInteger.valueOf(4));
        lvl5.addNewStart().setVal(BigInteger.ONE);
        lvl5.addNewNumFmt().setVal(STNumberFormat.DECIMAL);
        lvl5.addNewLvlText().setVal("%1.%2.%3.%4.%5");
        lvl5.addNewPStyle().setVal("标题5");

        // 注册定义
        XWPFAbstractNum absNum = new XWPFAbstractNum(abstractNum);
        numbering.addAbstractNum(absNum);
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
//                // 检测5级标题（Heading 5 或“标题5”）
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
                    List<FuncDocHeading> headings = funcDocHeadingRepository.findByDocIdAndHeadingText(docId, text);
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

            FuncDocProcessNode node = new FuncDocProcessNode();
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
    public Page<FuncDocProcessNodeDto> pageDocProcessNode(FuncDocProcessNodeQueryDto queryDto) {
        log.info("分页查询文档流程节点，查询条件: {}", queryDto);

        String docId = queryDto.getDocId();
        Integer pageNum = queryDto.getPageNum();
        Integer pageSize = queryDto.getPageSize();
        String keyWord = queryDto.getKeyWord();
        String headingId = queryDto.getHeadingId();

        // 验证文档是否存在
        funcDocInfoRepository.findById(docId)
                .orElseThrow(() -> new FuncDocException("DOC_NOT_FOUND", "文档不存在: " + docId));

        StringBuilder sql = new StringBuilder(
                "SELECT n.node_id, n.doc_id, n.heading_id, n.sequence_no, n.content, n.create_date, h.heading_text " +
                        "FROM func_doc_process_node n LEFT JOIN func_doc_heading h ON n.heading_id = h.heading_id " +
                        "WHERE n.doc_id = :docId "
        );

        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM func_doc_process_node n WHERE n.doc_id = :docId "
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
            countSql.append("AND (n.content LIKE :keyWord OR (SELECT h.heading_text FROM func_doc_heading h WHERE h.heading_id = n.heading_id) LIKE :keyWord) ");
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
        List<FuncDocProcessNodeDto> nodeDtos = jdbcTemplate.query(
                limitSql,
                params,
                (rs, rowNum) -> {
                    FuncDocProcessNodeDto dto = new FuncDocProcessNodeDto();
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
        funcDocInfoRepository.findById(docId)
                .orElseThrow(() -> new FuncDocException("DOC_NOT_FOUND", "文档不存在: " + docId));

        // 按order_num正序获取文档功能点列表
        List<FunctionPoint> functionPoints = functionPointRepository.findByDocIdOrderByOrderNumAsc(docId);
        Map<String, FunctionPoint> idMap = new HashMap<>();
        functionPoints.forEach(fp -> {
            idMap.put(fp.getId(), fp);
        });
        Map<String, Object> queryParams = new HashMap<>();
        Map<String, String> processDetailMap = new HashMap<>();
        if (!idMap.isEmpty()) {
            queryParams.put("docId", docId);
            queryParams.put("headingIds", new ArrayList<>(idMap.keySet()));
            Map<String, List<String>> contentsMap = new HashMap<>();
            HumpHelper.lineToHump(jdbcTemplate.queryForList("select * from func_doc_process_node where doc_id = :docId and heading_id in (:headingIds) order by sequence_no asc  ", queryParams)).forEach(map -> {
                String headingId = MapUtils.getString(map, "headingId");
                String content = MapUtils.getString(map, "content");
                contentsMap.computeIfAbsent(headingId, key -> new ArrayList<>()).add(content);
            });
            contentsMap.forEach((id, contents) -> {
                if (idMap.containsKey(id)) {
                    processDetailMap.put(id, StringUtils.join(contents, "\n"));
                }
            });
        }
        // 构建功能点树
        return buildFunctionPointTree(functionPoints, processDetailMap);
    }

    /**
     * 构建功能点树
     *
     * @param functionPoints 功能点列表
     * @return 功能点树列表
     */
    private List<FunctionPointTreeDto> buildFunctionPointTree(List<FunctionPoint> functionPoints, Map<String, String> processDetailMap) {
        Map<String, FunctionPointTreeDto> nodeMap = new HashMap<>();
        List<FunctionPointTreeDto> rootNodes = new ArrayList<>();

        // 首先将所有功能点转换为DTO并放入Map
        for (FunctionPoint functionPoint : functionPoints) {
            FunctionPointTreeDto dto = new FunctionPointTreeDto();
            BeanUtils.copyProperties(functionPoint, dto);
            if (processDetailMap.containsKey(dto.getId())) {
                dto.setProcessDetail(processDetailMap.get(dto.getId()));
            }
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
            throw new FuncDocException("DOC_ID_REQUIRED", "文档ID不能为空");
        }

        Map<String, Object> queryParams = new HashMap<>();
        queryParams.put("docId", docId);

        StringBuilder listSql = new StringBuilder(
                "SELECT fp.id, fp.doc_id, fp.parent_id, fp.name, fp.level, fp.type, fp.order_num, " +
                        "       fp.create_date, fp.update_date, p.name AS parent_name, fp.process_summary, fp.function_desc, fp.business_desc " +
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
                    dto.setProcessSummary(rs.getString("process_summary"));
                    dto.setFunctionDesc(rs.getString("function_desc"));
                    dto.setBusinessDesc(rs.getString("business_desc"));
                    idMap.put(id, dto);
                    return dto;
                }
        );
        if (!idMap.isEmpty()) {
            queryParams.put("docId", docId);
            queryParams.put("headingIds", new ArrayList<>(idMap.keySet()));
            Map<String, List<String>> contentsMap = new HashMap<>();
            HumpHelper.lineToHump(jdbcTemplate.queryForList("select * from func_doc_process_node where doc_id = :docId and heading_id in (:headingIds) order by sequence_no asc  ", queryParams)).forEach(map -> {
                String headingId = MapUtils.getString(map, "headingId");
                String content = MapUtils.getString(map, "content");
                contentsMap.computeIfAbsent(headingId, key -> new ArrayList<>()).add(content);
            });
            contentsMap.forEach((id, contents) -> {
                if (idMap.containsKey(id)) {
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

    @Override
    public Map<String, Object> generateInfByProcess(String functionId) {
        Map<String, Object> params = new HashMap<>();
        params.put("functionId", functionId);

        // 1. 查询流程节点内容
        List<String> contents = new ArrayList<>();
        HumpHelper.lineToHump(jdbcTemplate.queryForList(
                "select * from func_doc_process_node where heading_id = :functionId order by sequence_no asc",
                params)).forEach(map -> {
            String content = MapUtils.getString(map, "content");
            if (StringUtils.isNotBlank(content)) {
                contents.add(content);
            }
        });

        if (contents.isEmpty()) {
            throw new RuntimeException("未找到流程节点内容");
        }

        // 2. 查询提示词模板
        List<Map<String, Object>> list = HumpHelper.lineToHump(jdbcTemplate.queryForList(
                "select * from prompt_templates where name = 'infGenerate'", params));
        if (list.isEmpty()) {
            throw new RuntimeException("未配置提示词模板：infGenerate");
        }

        // 3. 构建提示词
        String prompt = MapUtils.getString(list.get(0), "content");
        prompt = prompt.replace("{{processDetail}}", String.join("\n", contents));

        // 4. 调用大模型生成接口信息 JSON
        ChatClient chatClient = chatBuilder.build();
        String result = chatClient.prompt()
                .user(prompt)
                .call()
                .content();

        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> jsonRes;

        // 5. 尝试解析 JSON
        try {
            jsonRes = parseAiResult(result, mapper);
        } catch (Exception e) {
            String jsonPart = extractJson(result);
            try {
                jsonRes = mapper.readValue(jsonPart, new TypeReference<Map<String, Object>>() {
                });
            } catch (Exception ex) {
                throw new RuntimeException("AI 返回结果解析失败：" + result, ex);
            }
        }

        // 6. 补充 functionId
        jsonRes.put("functionId", functionId);

        // 7. 将 infDetail 转为字符串（JSON）
        Object infDetail = jsonRes.get("infDetail");
        String infDetailStr = null;
        try {
            infDetailStr = mapper.writeValueAsString(infDetail);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("infDetail 转 JSON 字符串失败", e);
        }

        Map<String, Object> updateMap = new HashMap<>();
        updateMap.put("functionId", functionId);
        updateMap.put("infDescr", MapUtils.getString(jsonRes, "infDescr"));
        updateMap.put("infDetail", infDetailStr);

        // 8. 更新数据库
        jdbcTemplate.update(
                "update function_point set inf_desc = :infDescr, inf_detail = :infDetail where id = :functionId",
                updateMap
        );

        // 9. 返回最终结果
        jsonRes.put("infDetail", infDetailStr);
        return jsonRes;
    }


    public Map<String, Object> generateByProcess(String functionId) {
        Map<String, Object> params = new HashMap<>();
        params.put("functionId", functionId);

        // 查询流程节点内容
        List<String> contents = new ArrayList<>();
        HumpHelper.lineToHump(jdbcTemplate.queryForList(
                "select * from func_doc_process_node where heading_id = :functionId order by sequence_no asc",
                params)).forEach(map -> {
            String content = MapUtils.getString(map, "content");
            if (StringUtils.isNotBlank(content)) {
                contents.add(content);
            }
        });

        // 查询提示词模板
        List<Map<String, Object>> list = HumpHelper.lineToHump(jdbcTemplate.queryForList(
                "select * from prompt_templates where name = 'processGenerate'", params));
        if (list.isEmpty()) {
            throw new RuntimeException("未配置提示词模板");
        }

        // 构建提示词
        String prompt = MapUtils.getString(list.get(0), "content");
        prompt = prompt.replace("{{processDetail}}", StringUtils.join(contents, "\n"));

        // 调用大模型生成结果
        ChatClient chatClient = chatBuilder.build();
        String result = chatClient.prompt()
                .user(prompt)
                .call()
                .content();
        if (!result.startsWith("[") && result.endsWith("]")) {
            result = result.substring(0, result.length() - 1);
        }
        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> jsonRes;

        // 尝试解析 JSON
        try {
            jsonRes = parseAiResult(result, mapper);
            jsonRes.put("functionId", functionId);

            // 更新数据库
            jdbcTemplate.update(
                    "update function_point set process_summary = :processSummary, business_desc = :businessDesc, function_desc = :functionDesc where id = :functionId",
                    jsonRes
            );
            return jsonRes;
        } catch (Exception e) {
            throw new RuntimeException("AI 返回结果解析失败：" + result, e);
        }
    }

    public String generateFlowByProcess(String functionId) {
        Map<String, Object> params = new HashMap<>();
        params.put("functionId", functionId);

        // 1. 查询流程节点内容
        List<String> contents = new ArrayList<>();
        HumpHelper.lineToHump(jdbcTemplate.queryForList(
                "select * from func_doc_process_node where heading_id = :functionId order by sequence_no asc",
                params)).forEach(map -> {
            String content = MapUtils.getString(map, "content");
            if (StringUtils.isNotBlank(content)) {
                contents.add(content);
            }
        });

        if (contents.isEmpty()) {
            throw new RuntimeException("未找到流程节点内容");
        }

        // 2. 查询提示词模板
        List<Map<String, Object>> list = HumpHelper.lineToHump(jdbcTemplate.queryForList(
                "select * from prompt_templates where name = 'flowGenerate'", params));
        if (list.isEmpty()) {
            throw new RuntimeException("未配置提示词模板：flowGenerate");
        }

        // 3. 构建提示词
        String prompt = MapUtils.getString(list.get(0), "content");
        prompt = prompt.replace("{{processDetail}}", String.join("\n", contents));

        // 4. 调用大模型生成 Mermaid 流程图 JSON
        ChatClient chatClient = chatBuilder.build();
        String result = chatClient.prompt()
                .user(prompt)
                .call()
                .content();

        // 5. 尝试解析 JSON
        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> jsonRes;
        try {
            jsonRes = parseAiResult(result, mapper);
        } catch (Exception e) {
            String jsonPart = extractJson(result);
            try {
                jsonRes = mapper.readValue(jsonPart, new TypeReference<Map<String, Object>>() {
                });
            } catch (Exception ex) {
                throw new RuntimeException("AI 返回结果解析失败：" + result, ex);
            }
        }

        // 6. 补充 functionId 并更新数据库
        jsonRes.put("functionId", functionId);
        jdbcTemplate.update(
                "update function_point set mermaid_code = :mermaidCode where id = :functionId",
                jsonRes
        );

        String mermaidCode = MapUtils.getString(jsonRes, "mermaidCode");
        if (StringUtils.isBlank(mermaidCode)) {
            throw new RuntimeException("AI 未生成 mermaidCode");
        }

        // 7. 使用 URL 安全 Base64 编码
        String mermaidBase64 = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(mermaidCode.getBytes(StandardCharsets.UTF_8));

        // 8. 调用 mermaid.ink 下载图片
        String imageUrl = "https://mermaid.ink/img/" + mermaidBase64;
        String uploadDir = "D:\\quiz\\flows";

        Path targetPath = Paths.get(uploadDir, functionId + ".png");
        try (InputStream in = new URL(imageUrl).openStream()) {
            Files.createDirectories(targetPath.getParent());
            Files.copy(in, targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("下载 Mermaid 流程图失败：" + imageUrl, e);
        }

        return mermaidBase64;
    }


    @Override
    public void batchGenerateFlowByProcess() {
        Map<String, Object> params = new HashMap<>();
        String uploadDir = "D:\\quiz\\flows";
        File dir = new File(uploadDir);
        if (!dir.exists()) dir.mkdirs();

        List<Map<String, Object>> functionPoints = HumpHelper.lineToHump(
                jdbcTemplate.queryForList("select * from function_point where level = 3", params)
        );

        if (functionPoints.isEmpty()) {
            log.info("没有需要生成流程图的功能点");
            return;
        }

        functionPoints.forEach(map -> {
            CommonPool.cachedPool.execute(() -> {
                String functionId = MapUtils.getString(map, "id");

                File imgFile = new File(uploadDir, functionId + ".png");
                String mermaidCode = MapUtils.getString(map, "mermaidCode");

                try {
                    // 图片存在且 mermaidCode 不为空 → 跳过
                    if (imgFile.exists() && StringUtils.isNotBlank(mermaidCode)) {
                        log.info("功能点 [{}] 流程图已存在，跳过生成", functionId);
                        return;
                    }

                    // 如果 mermaidCode 为空 → 调用 AI 生成
                    if (StringUtils.isBlank(mermaidCode)) {
                        mermaidCode = generateFlowByProcess(functionId);
                    }

                    // 下载图片
                    String mermaidBase64 = Base64.getUrlEncoder().withoutPadding()
                            .encodeToString(mermaidCode.getBytes(StandardCharsets.UTF_8));
                    String imgUrl = "https://mermaid.ink/img/" + mermaidBase64;

                    try (InputStream in = new URL(imgUrl).openStream();
                         FileOutputStream out = new FileOutputStream(imgFile)) {
                        byte[] buffer = new byte[8192];
                        int len;
                        while ((len = in.read(buffer)) != -1) {
                            out.write(buffer, 0, len);
                        }
                    }

                    log.info("功能点 [{}] 流程图生成并保存成功: {}", functionId, imgFile.getAbsolutePath());
                } catch (Exception e) {
                    log.error("功能点 [{}] 流程图生成失败: {}", functionId, e.getMessage(), e);
                }
            });
        });
    }


    @Override
    public void batchGenerateProcessDescription() {
        Map<String, Object> params = new HashMap<>();
        HumpHelper.lineToHump(jdbcTemplate.queryForList("select * from function_point where level = 3 and (process_summary is null or function_desc is null or business_desc is null)", params)).forEach(map -> {
            CommonPool.cachedPool.execute(() -> {
                generateByProcess(MapUtils.getString(map, "id"));
            });
        });
    }

    @Override
    public void batchGenerateInf() {
        Map<String, Object> params = new HashMap<>();
        HumpHelper.lineToHump(jdbcTemplate.queryForList("select * from function_point where level = 3 and (inf_desc is null or inf_detail is null)", params)).forEach(map -> {
            CommonPool.cachedPool.execute(() -> {
                generateInfByProcess(MapUtils.getString(map, "id"));
            });
        });
    }

    /**
     * 尝试解析 AI 返回结果为 JSON，先清理 Markdown，再提取 JSON 片段
     */
    private Map<String, Object> parseAiResult(String result, ObjectMapper mapper) throws Exception {
        // 1. 清理 Markdown 代码块
        String cleaned = cleanJsonString(result);

        try {
            return mapper.readValue(cleaned, new TypeReference<Map<String, Object>>() {
            });
        } catch (Exception e) {
            // 2. 提取 JSON 片段
            String jsonPart = extractJson(cleaned);
            return mapper.readValue(jsonPart, new TypeReference<Map<String, Object>>() {
            });
        }
    }

    /**
     * 清理可能的 Markdown 包裹和多余空白
     */
    private String cleanJsonString(String text) {
        if (text == null) return "{}";
        text = text.replaceAll("(?s)```.*?\\n", "").replaceAll("```", "");
        return text.trim();
    }


    /**
     * 尝试从文本中提取 JSON 对象部分
     */
    private String extractJson(String text) {
        int start = text.indexOf("{");
        int end = text.lastIndexOf("}");
        if (start != -1 && end != -1 && end > start) {
            return text.substring(start, end + 1);
        }
        return text;
    }

    @Override
    public byte[] exportToExcel(String docId) {
        log.info("导出接口信息为 Excel，文档ID: {}", docId);

        // 验证文档是否存在
        funcDocInfoRepository.findById(docId)
                .orElseThrow(() -> new FuncDocException("DOC_NOT_FOUND", "文档不存在: " + docId));

        try {
            // 获取文档标题树与功能点树
            List<FuncDocHeadingTreeDto> headingTree = getDocHeadingTree(docId);
            List<FunctionPointTreeDto> functionPointTree = getFunctionPointTree(docId);
            Map<String, FunctionPointTreeDto> functionIdMap = new HashMap<>();
            resolveFunctionIdMap(functionPointTree, functionIdMap);

            // 收集接口信息
            List<Map<String, Object>> loopData = new ArrayList<>();
            for (FuncDocHeadingTreeDto rootNode : headingTree) {
                loadInfData(rootNode, 1, functionIdMap, loopData);
            }

            // === 创建 Excel 工作簿 ===
            try (Workbook workbook = new XSSFWorkbook()) {
                Sheet sheet = workbook.createSheet("接口信息");

                // 标题行
                String[] headers = {"功能点名称", "序号", "接口名称", "接口说明", "中文字段名称", "出入参"};
                Row headerRow = sheet.createRow(0);
                for (int i = 0; i < headers.length; i++) {
                    Cell cell = headerRow.createCell(i);
                    cell.setCellValue(headers[i]);
                    sheet.setColumnWidth(i, 8000);
                }

                int rowNum = 1;
                int seq = 1;

                for (Map<String, Object> data : loopData) {
                    // 每个接口的入参、出参按行展开
                    String functionName = Objects.toString(data.get("functionName"), "");
                    String interfaceName = Objects.toString(data.get("interfaceName"), "");
                    String description = Objects.toString(data.get("description"), "");

                    List<Map<String, Object>> inputParams = (List<Map<String, Object>>) data.get("inputList");
                    List<Map<String, Object>> outputParams = (List<Map<String, Object>>) data.get("outputList");

                    int startRow = rowNum;

                    // 入参
                    for (Map<String, Object> p : inputParams) {
                        Row row = sheet.createRow(rowNum++);
                        row.createCell(0).setCellValue(functionName);
                        row.createCell(1).setCellValue(seq);
                        row.createCell(2).setCellValue(interfaceName);
                        row.createCell(3).setCellValue(description);
                        row.createCell(4).setCellValue(Objects.toString(p.get("name"), ""));
                        row.createCell(5).setCellValue("入参");
                    }

                    // 出参
                    for (Map<String, Object> p : outputParams) {
                        Row row = sheet.createRow(rowNum++);
                        row.createCell(0).setCellValue(functionName);
                        row.createCell(1).setCellValue(seq);
                        row.createCell(2).setCellValue(interfaceName);
                        row.createCell(3).setCellValue(description);
                        row.createCell(4).setCellValue(Objects.toString(p.get("name"), ""));
                        row.createCell(5).setCellValue("出参");
                    }

                    seq++;
                }

                // 输出为字节数组
                try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
                    workbook.write(outputStream);
                    outputStream.flush();
                    return outputStream.toByteArray();
                }
            }

        } catch (IOException e) {
            log.error("导出 Excel 文档失败: {}", e.getMessage(), e);
            throw new FuncDocException("DOC_EXPORT_FAIL", "导出 Excel 文件失败: " + e.getMessage());
        } catch (Exception e) {
            log.error("生成接口信息 Excel 失败: {}", e.getMessage(), e);
            throw new RuntimeException("导出 Excel 文件失败: " + e.getMessage(), e);
        }
    }

    /**
     * 只保留每个功能点的第一个接口
     */
    private void loadInfData(FuncDocHeadingTreeDto heading, int level, Map<String, FunctionPointTreeDto> functionIdMap, List<Map<String, Object>> loopData) {
        int actualLevel = Math.min(level, 9);

        if (actualLevel == 5 && functionIdMap.containsKey(heading.getId())) {
            FunctionPointTreeDto functionPoint = functionIdMap.get(heading.getId());
            String infDetail = functionPoint.getInfDetail();
            if (infDetail != null && !infDetail.isEmpty()) {
                try {
                    ObjectMapper objectMapper = new ObjectMapper();
                    Map<String, Map<String, Object>> infMap = objectMapper.readValue(infDetail,
                            new TypeReference<Map<String, Map<String, Object>>>() {});

                    // 只取第一个接口
                    Map.Entry<String, Map<String, Object>> firstEntry = infMap.entrySet().iterator().next();
                    Map<String, Object> detail = firstEntry.getValue();

                    String interfaceName = Objects.toString(detail.get("interfaceName"), "");
                    String description = Objects.toString(detail.get("description"), "");

                    Map<String, Object> params = (Map<String, Object>) detail.get("params");
                    List<Map<String, Object>> inputList = params != null ? (List<Map<String, Object>>) params.get("input") : Collections.emptyList();
                    List<Map<String, Object>> outputList = params != null ? (List<Map<String, Object>>) params.get("output") : Collections.emptyList();

                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("functionName", heading.getHeadingText());
                    row.put("interfaceName", interfaceName);
                    row.put("description", description);
                    row.put("inputList", inputList);
                    row.put("outputList", outputList);

                    loopData.add(row);

                } catch (Exception e) {
                    throw new RuntimeException("解析 infDetail JSON 出错: " + e.getMessage(), e);
                }
            }
        }

        // 递归子节点
        if (heading.getChildren() != null && !heading.getChildren().isEmpty()) {
            for (FuncDocHeadingTreeDto child : heading.getChildren()) {
                loadInfData(child, actualLevel + 1, functionIdMap, loopData);
            }
        }
    }



}