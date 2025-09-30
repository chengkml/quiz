package com.ck.quiz.subject.service.impl;

import com.ck.quiz.subject.dto.SubjectCreateDto;
import com.ck.quiz.subject.dto.SubjectDto;
import com.ck.quiz.subject.dto.SubjectQueryDto;
import com.ck.quiz.subject.dto.SubjectUpdateDto;
import com.ck.quiz.subject.entity.Subject;
import com.ck.quiz.subject.exception.SubjectException;
import com.ck.quiz.subject.repository.SubjectRepository;
import com.ck.quiz.subject.service.SubjectService;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

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
        StringBuilder sql = new StringBuilder("select * from subject where 1=1 ");
        StringBuilder countSql = new StringBuilder("select count(1) from subject where 1=1 ");
        Map<String, Object> params = new HashMap<>();

        // 按名称模糊查询
        JdbcQueryHelper.lowerLike("name", queryDto.getName(),
                " and lower(name) like :name ", params, jdbcTemplate, sql, countSql);

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
        List<Subject> subjects = jdbcTemplate.query(
                limitSql,
                params,
                (rs, rowNum) -> {
                    Subject s = new Subject();
                    s.setId(rs.getString("id"));
                    s.setName(rs.getString("name"));
                    s.setDescription(rs.getString("description"));
                    s.setCreateDate(rs.getTimestamp("create_date").toLocalDateTime());
                    s.setUpdateDate(rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime() : null);
                    return s;
                }
        );

        // 转换成DTO
        List<SubjectDto> dtos = subjects.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());

        // 组装分页对象
        return JdbcQueryHelper.toPage(
                jdbcTemplate,
                countSql.toString(),
                params,
                dtos,
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
}