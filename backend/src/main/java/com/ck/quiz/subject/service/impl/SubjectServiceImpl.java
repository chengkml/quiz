package com.ck.quiz.subject.service.impl;

import com.ck.quiz.category.entity.Category;
import com.ck.quiz.category.repository.CategoryRepository;
import com.ck.quiz.category.service.CategoryService;
import com.ck.quiz.subject.dto.SubjectCreateDto;
import com.ck.quiz.subject.dto.SubjectDto;
import com.ck.quiz.subject.dto.SubjectQueryDto;
import com.ck.quiz.subject.dto.SubjectUpdateDto;
import com.ck.quiz.subject.entity.Subject;
import com.ck.quiz.subject.exception.SubjectException;
import com.ck.quiz.subject.repository.SubjectRepository;
import com.ck.quiz.subject.service.SubjectService;
import com.ck.quiz.thpool.CommonPool;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class SubjectServiceImpl implements SubjectService {

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;

    @Autowired
    private CategoryRepository categoryRepository;

    @Lazy
    @Autowired
    private CategoryService categoryService;

    @Override
    @Transactional
    public SubjectDto createSubject(SubjectCreateDto subjectCreateDto) {
        if (subjectRepository.findByName(subjectCreateDto.getName()).isPresent()) {
            throw new SubjectException("SUBJECT_NAME_EXISTS", "学科名称已存在: " + subjectCreateDto.getName());
        }

        Subject subject = new Subject();
        subject.setId(IdHelper.genUuid());
        BeanUtils.copyProperties(subjectCreateDto, subject);

        Subject savedSubject = subjectRepository.save(subject);
        return convertToDto(savedSubject);
    }

    @Override
    @Transactional
    public SubjectDto updateSubject(SubjectUpdateDto subjectUpdateDto) {
        Subject subject = subjectRepository.findById(subjectUpdateDto.getId())
                .orElseThrow(() -> new SubjectException("SUBJECT_NOT_FOUND", "学科不存在: " + subjectUpdateDto.getId()));

        if (subjectRepository.existsByNameAndIdNot(subjectUpdateDto.getName(), subjectUpdateDto.getId())) {
            throw new SubjectException("SUBJECT_NAME_EXISTS", "学科名称已存在: " + subjectUpdateDto.getName());
        }

        subject.setName(subjectUpdateDto.getName());
        subject.setDescription(subjectUpdateDto.getDescription());

        Subject updatedSubject = subjectRepository.save(subject);
        return convertToDto(updatedSubject);
    }

    @Override
    @Transactional
    public SubjectDto deleteSubject(String subjectId) {
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new SubjectException("SUBJECT_NOT_FOUND", "学科不存在: " + subjectId));

        subjectRepository.deleteById(subjectId);
        return convertToDto(subject);
    }

    @Override
    @Transactional(readOnly = true)
    public SubjectDto getSubjectById(String subjectId) {
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new SubjectException("SUBJECT_NOT_FOUND", "学科不存在: " + subjectId));
        return convertToDto(subject);
    }

    @Override
    @Transactional(readOnly = true)
    public SubjectDto getSubjectByName(String subjectName) {
        Subject subject = subjectRepository.findByName(subjectName)
                .orElseThrow(() -> new SubjectException("SUBJECT_NOT_FOUND", "学科不存在: " + subjectName));
        return convertToDto(subject);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SubjectDto> searchSubjects(SubjectQueryDto queryDto) {
        StringBuilder sql = new StringBuilder("select s.*, u.user_name create_user_name from subject s left join user u on s.create_user = u.user_id where 1=1 ");
        StringBuilder countSql = new StringBuilder("select count(1) from subject s where 1=1 ");
        Map<String, Object> params = new HashMap<>();

        // 按名称模糊查询
        JdbcQueryHelper.lowerLike("subjectName", queryDto.getName(),
                " and lower(s.name) like :subjectName ", params, jdbcTemplate, sql, countSql);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            JdbcQueryHelper.equals("createUser", authentication.getName(),
                    " AND s.create_user = :createUser ", params, sql, countSql);
        }

        // 排序
        JdbcQueryHelper.order(queryDto.getSortColumn(), queryDto.getSortType(), sql);

        // 分页SQL
        String limitSql = JdbcQueryHelper.getLimitSql(
                jdbcTemplate,
                sql.toString(),
                queryDto.getPageNum(),
                queryDto.getPageSize()
        );

        // 查询数据
        List<SubjectDto> subjects = jdbcTemplate.query(
                limitSql,
                params,
                (rs, rowNum) -> {
                    SubjectDto s = new SubjectDto();
                    s.setId(rs.getString("subject_id"));
                    s.setName(rs.getString("name"));
                    s.setCreateUser(rs.getString("create_user"));
                    s.setCreateUserName(rs.getString("create_user_name"));
                    s.setDescription(rs.getString("description"));
                    s.setCreateDate(rs.getTimestamp("create_date").toLocalDateTime());
                    s.setUpdateDate(rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime() : null);
                    return s;
                }
        );

        // 组装分页对象
        return JdbcQueryHelper.toPage(
                jdbcTemplate,
                countSql.toString(),
                params,
                subjects,
                queryDto.getPageNum(),
                queryDto.getPageSize()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubjectDto> getAllSubjects() {
        List<Subject> subjects = subjectRepository.findAll();
        return subjects.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    public List<SubjectDto> getUserSubjects(String userId) {
        List<Subject> subjects = subjectRepository.findByCreateUser(userId);
        return subjects.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isSubjectNameExists(String subjectName, String excludeSubjectId) {
        if (StringUtils.hasText(excludeSubjectId)) {
            return subjectRepository.existsByNameAndIdNot(subjectName, excludeSubjectId);
        } else {
            return subjectRepository.findByName(subjectName).isPresent();
        }
    }

    @Override
    public SubjectDto convertToDto(Subject subject) {
        SubjectDto dto = new SubjectDto();
        BeanUtils.copyProperties(subject, dto);
        return dto;
    }

    @Override
    public List<SubjectDto> getAllUserSubjects(String userId) {
        List<Subject> subjects = subjectRepository.findByCreateUser(userId);
        return subjects.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    public void exportSubjects(HttpServletResponse response) {
        try {
            // 获取所有学科数据
            List<Subject> subjects = subjectRepository.findAll();
            
            // 创建Excel工作簿
            Workbook workbook = new XSSFWorkbook();
            Sheet sheet = workbook.createSheet("学科列表");
            
            // 设置表头
            Row headerRow = sheet.createRow(0);
            String[] headers = {"学科ID", "学科名称", "学科描述", "创建人", "创建时间", "更新时间"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                // 设置表头样式
                CellStyle headerStyle = workbook.createCellStyle();
                Font font = workbook.createFont();
                font.setBold(true);
                headerStyle.setFont(font);
                headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
                headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
                cell.setCellStyle(headerStyle);
            }
            
            // 填充数据
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            for (int i = 0; i < subjects.size(); i++) {
                Subject subject = subjects.get(i);
                Row row = sheet.createRow(i + 1);
                
                row.createCell(0).setCellValue(subject.getId());
                row.createCell(1).setCellValue(subject.getName());
                row.createCell(2).setCellValue(subject.getDescription() != null ? subject.getDescription() : "");
                row.createCell(3).setCellValue(subject.getCreateUser() != null ? subject.getCreateUser() : "");
                row.createCell(4).setCellValue(subject.getCreateDate() != null ? 
                    subject.getCreateDate().format(formatter) : "");
                row.createCell(5).setCellValue(subject.getUpdateDate() != null ? 
                    subject.getUpdateDate().format(formatter) : "");
            }
            
            // 自动调整列宽
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }
            
            // 设置响应头
            String fileName = "学科列表_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".xlsx";
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=" + 
                URLEncoder.encode(fileName, StandardCharsets.UTF_8.toString()));
            
            // 输出文件
            try (OutputStream outputStream = response.getOutputStream()) {
                workbook.write(outputStream);
                workbook.close();
            }
        } catch (Exception e) {
            throw new SubjectException("EXPORT_FAILED", "导出学科列表失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public Map<String, Object> importSubjects(MultipartFile file) {
        Map<String, Object> result = new HashMap<>();
        int successCount = 0;
        int errorCount = 0;
        List<String> errorMessages = new ArrayList<>();
        
        try {
            // 验证文件
            if (file == null || file.isEmpty()) {
                throw new SubjectException("FILE_EMPTY", "上传文件不能为空");
            }
            
            String fileName = file.getOriginalFilename();
            if (fileName == null || !fileName.endsWith(".xlsx")) {
                throw new SubjectException("FILE_TYPE_ERROR", "只能上传.xlsx格式的Excel文件");
            }
            
            // 获取当前登录用户
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String currentUserName = authentication != null && authentication.isAuthenticated() ? 
                authentication.getName() : "system";
            
            // 读取Excel文件
            try (InputStream inputStream = file.getInputStream();
                 Workbook workbook = new XSSFWorkbook(inputStream)) {
                
                Sheet sheet = workbook.getSheetAt(0);
                if (sheet == null) {
                    throw new SubjectException("SHEET_NOT_FOUND", "Excel文件中未找到工作表");
                }
                
                int rowCount = sheet.getLastRowNum();
                
                // 从第二行开始读取数据（第一行是表头）
                for (int i = 1; i <= rowCount; i++) {
                    Row row = sheet.getRow(i);
                    if (row == null) continue;
                    
                    try {
                        // 读取学科名称
                        Cell nameCell = row.getCell(1);
                        if (nameCell == null || StringUtils.isEmpty(nameCell.getStringCellValue())) {
                            errorMessages.add("第" + (i + 1) + "行：学科名称不能为空");
                            errorCount++;
                            continue;
                        }
                        
                        String subjectName = nameCell.getStringCellValue().trim();
                        
                        // 检查学科名称是否已存在
                        if (subjectRepository.findByName(subjectName).isPresent()) {
                            errorMessages.add("第" + (i + 1) + "行：学科名称" + subjectName + "已存在");
                            errorCount++;
                            continue;
                        }
                        
                        // 创建学科
                        Subject subject = new Subject();
                        subject.setId(IdHelper.genUuid());
                        subject.setName(subjectName);
                        
                        // 读取描述
                        Cell descCell = row.getCell(2);
                        if (descCell != null) {
                            subject.setDescription(descCell.getStringCellValue());
                        }
                        
                        subject.setCreateUser(currentUserName);
                        subject.setCreateDate(LocalDateTime.now());
                        subject.setUpdateDate(LocalDateTime.now());
                        
                        subjectRepository.save(subject);
                        successCount++;
                    } catch (Exception e) {
                        errorMessages.add("第" + (i + 1) + "行：导入失败，错误信息：" + e.getMessage());
                        errorCount++;
                    }
                }
            }
            
            result.put("total", successCount + errorCount);
            result.put("successCount", successCount);
            result.put("errorCount", errorCount);
            result.put("errorMessages", errorMessages);
            result.put("message", "导入完成，成功" + successCount + "条，失败" + errorCount + "条");
            
        } catch (SubjectException e) {
            result.put("success", false);
            result.put("message", e.getMessage());
        } catch (IOException e) {
            throw new SubjectException("IMPORT_FAILED", "导入学科列表失败: " + e.getMessage());
        }
        
        return result;
    }

    public void initSubjectQuestions(String subjectId, int questionNum) {
        subjectRepository.findById(subjectId)
                .orElseThrow(() -> new SubjectException("SUBJECT_NOT_FOUND", "学科不存在: " + subjectId));
        List<Category> categories = categoryRepository.findBySubjectId(subjectId);
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        CommonPool.cachedPool.execute(()->{
            categories.forEach(category -> {
                categoryService.initCategoryQuestions(authentication.getName(), category.getId(), questionNum);
            });
        });
    }
}