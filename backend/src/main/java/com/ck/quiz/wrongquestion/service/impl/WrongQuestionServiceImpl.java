package com.ck.quiz.wrongquestion.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.question.entity.Question;
import com.ck.quiz.utils.JdbcQueryHelper;
import com.ck.quiz.wrongquestion.dto.WrongQuestionCreateDto;
import com.ck.quiz.wrongquestion.dto.WrongQuestionDto;
import com.ck.quiz.wrongquestion.dto.WrongQuestionQueryDto;
import com.ck.quiz.wrongquestion.dto.WrongQuestionUpdateDto;
import com.ck.quiz.wrongquestion.entity.WrongQuestion;
import com.ck.quiz.wrongquestion.repository.WrongQuestionRepository;
import com.ck.quiz.wrongquestion.service.WrongQuestionService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WrongQuestionServiceImpl extends BaseServiceImpl<WrongQuestionCreateDto, WrongQuestionUpdateDto, WrongQuestionQueryDto, WrongQuestionDto, WrongQuestion, WrongQuestionRepository>
        implements WrongQuestionService {

    private final WrongQuestionRepository wrongQuestionRepository;

    @PostConstruct
    void initRepository() {
        this.repository = wrongQuestionRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WrongQuestionDto> search(String userId, WrongQuestionQueryDto queryDto) {
        StringBuilder sql = new StringBuilder("""
                SELECT wq.id,
                       wq.subject_id,
                       s.name AS subject_name,
                       wq.category_id,
                       c.name AS category_name,
                       wq.type,
                       wq.content,
                       wq.answer,
                       wq.difficulty,
                       wq.remark,
                       wq.original_image_file_id,
                       wq.original_image_name,
                       wq.ocr_text,
                       wq.create_date,
                       wq.create_user,
                       cu.user_name AS create_user_name,
                       wq.update_date,
                       wq.update_user,
                       uu.user_name AS update_user_name
                FROM wrong_question wq
                LEFT JOIN subject s ON s.id = wq.subject_id
                LEFT JOIN category c ON c.id = wq.category_id
                LEFT JOIN users cu ON cu.user_id = wq.create_user
                LEFT JOIN users uu ON uu.user_id = wq.update_user
                WHERE 1=1
                """);
        StringBuilder countSql = new StringBuilder("""
                SELECT COUNT(1)
                FROM wrong_question wq
                LEFT JOIN subject s ON s.id = wq.subject_id
                LEFT JOIN category c ON c.id = wq.category_id
                WHERE 1=1
                """);

        Map<String, Object> params = new HashMap<>();
        JdbcQueryHelper.equals("createUser", userId, " AND wq.create_user = :createUser ", params, sql, countSql);
        JdbcQueryHelper.equals("subjectId", queryDto.getSubjectId(), " AND wq.subject_id = :subjectId ", params, sql, countSql);
        JdbcQueryHelper.equals("categoryId", queryDto.getCategoryId(), " AND wq.category_id = :categoryId ", params, sql, countSql);
        JdbcQueryHelper.equals("type", queryDto.getType() == null ? null : queryDto.getType().name(), " AND wq.type = :type ", params, sql, countSql);
        JdbcQueryHelper.equals("difficulty", queryDto.getDifficulty(), " AND wq.difficulty = :difficulty ", params, sql, countSql);
        JdbcQueryHelper.lowerLike("contentKey", queryDto.getContent(), " AND LOWER(wq.content) LIKE :contentKey ", params, namedParameterJdbcTemplate, sql, countSql);

        JdbcQueryHelper.order("wq.create_date", "desc", sql);

        String pageSql = JdbcQueryHelper.getLimitSql(namedParameterJdbcTemplate, sql.toString(), queryDto.getPageNum(), queryDto.getPageSize());
        List<WrongQuestionDto> list = namedParameterJdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            WrongQuestionDto dto = new WrongQuestionDto();
            dto.setId(rs.getString("id"));
            dto.setSubjectId(rs.getString("subject_id"));
            dto.setSubjectName(rs.getString("subject_name"));
            dto.setCategoryId(rs.getString("category_id"));
            dto.setCategoryName(rs.getString("category_name"));
            String type = rs.getString("type");
            dto.setType(StringUtils.hasText(type) ? Question.QuestionType.valueOf(type) : null);
            dto.setContent(rs.getString("content"));
            dto.setAnswer(rs.getString("answer"));
            dto.setDifficulty(rs.getString("difficulty"));
            dto.setRemark(rs.getString("remark"));
            dto.setOriginalImageFileId(rs.getString("original_image_file_id"));
            dto.setOriginalImageName(rs.getString("original_image_name"));
            dto.setOcrText(rs.getString("ocr_text"));
            dto.setCreateDate(rs.getTimestamp("create_date") == null ? null : rs.getTimestamp("create_date").toLocalDateTime());
            dto.setCreateUser(rs.getString("create_user"));
            dto.setCreateUserName(rs.getString("create_user_name"));
            dto.setUpdateDate(rs.getTimestamp("update_date") == null ? null : rs.getTimestamp("update_date").toLocalDateTime());
            dto.setUpdateUser(rs.getString("update_user"));
            dto.setUpdateUserName(rs.getString("update_user_name"));
            if (StringUtils.hasText(dto.getOriginalImageFileId())) {
                dto.setOriginalImageUrl("/api/file/download?id=" + dto.getOriginalImageFileId());
            }
            return dto;
        });

        Long total = namedParameterJdbcTemplate.queryForObject(countSql.toString(), params, Long.class);
        return new PageImpl<>(list,
                org.springframework.data.domain.PageRequest.of(queryDto.getPageNum(), queryDto.getPageSize()),
                total == null ? 0 : total);
    }

    @Override
    public WrongQuestionDto convertToDto(WrongQuestion model, Boolean loadProps) {
        WrongQuestionDto dto = super.convertToDto(model, loadProps);
        if (dto == null) {
            dto = newDto();
            BeanUtils.copyProperties(model, dto);
        }
        if (StringUtils.hasText(model.getOriginalImageFileId())) {
            dto.setOriginalImageUrl("/api/file/download?id=" + model.getOriginalImageFileId());
        }
        return dto;
    }

    @Override
    protected WrongQuestionDto newDto() {
        return new WrongQuestionDto();
    }

    @Override
    protected WrongQuestion newModel() {
        return new WrongQuestion();
    }
}
