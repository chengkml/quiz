package com.ck.quiz.subject.service.impl;

import com.ck.quiz.subject.dto.SubjectCreateDto;
import com.ck.quiz.subject.dto.SubjectDto;
import com.ck.quiz.subject.dto.SubjectQueryDto;
import com.ck.quiz.subject.dto.SubjectUpdateDto;
import com.ck.quiz.subject.entity.Subject;
import com.ck.quiz.subject.repository.SubjectRepository;
import com.ck.quiz.subject.service.SubjectService;
import com.ck.quiz.utils.HumpHelper;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import org.apache.commons.collections4.MapUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
    public SubjectDto create(SubjectCreateDto createDto) {
        Subject subject = new Subject();
        subject.setId(IdHelper.genUuid());
        if (createDto.getName() != null) {
            subject.setName(createDto.getName());
        }
        if (createDto.getLabel() != null) {
            subject.setLabel(createDto.getLabel());
        }
        if (createDto.getDescr() != null) {
            subject.setDescr(createDto.getDescr());
        }
        Subject savedSubject = subjectRepository.save(subject);
        return convertToDto(savedSubject, true);
    }

    @Override
    @Transactional
    public SubjectDto update(String userId, SubjectUpdateDto updateDto) {
        Subject subject = subjectRepository.findById(updateDto.getId())
                .orElseThrow(() -> new IllegalArgumentException("Subject not found: " + updateDto.getId()));
        if (subject.getCreateUser() != null && !subject.getCreateUser().equals(userId)) {
            throw new IllegalArgumentException("No permission to update subject: " + updateDto.getId());
        }
        if (updateDto.getName() != null) {
            subject.setName(updateDto.getName());
        }
        if (updateDto.getLabel() != null) {
            subject.setLabel(updateDto.getLabel());
        }
        if (updateDto.getDescr() != null) {
            subject.setDescr(updateDto.getDescr());
        }
        Subject updatedSubject = subjectRepository.save(subject);
        return convertToDto(updatedSubject, true);
    }

    @Override
    @Transactional
    public void delete(String userId, String subjectId) {
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new IllegalArgumentException("Subject not found: " + subjectId));
        if (subject.getCreateUser() != null && !subject.getCreateUser().equals(userId)) {
            throw new IllegalArgumentException("No permission to delete subject: " + subjectId);
        }
        subjectRepository.delete(subject);
    }

    @Override
    public SubjectDto get(String userId, String subjectId) {
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new IllegalArgumentException("Subject not found: " + subjectId));
        if (subject.getCreateUser() != null && !subject.getCreateUser().equals(userId)) {
            throw new IllegalArgumentException("No permission to access subject: " + subjectId);
        }
        return convertToDto(subject, true);
    }

    @Override
    public Page<SubjectDto> search(String userId, SubjectQueryDto queryDto) {
        StringBuilder sql = new StringBuilder(
                "select s.*, u.user_name create_user_name from subject s left join user u on s.create_user = u.user_id where 1=1 ");
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
        JdbcQueryHelper.order("create_date", "desc", sql);

        // 分页SQL
        String limitSql = JdbcQueryHelper.getLimitSql(
                jdbcTemplate,
                sql.toString(),
                queryDto.getPageNum(),
                queryDto.getPageSize());

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
                    s.setDescr(rs.getString("descr"));
                    s.setCreateDate(rs.getTimestamp("create_date").toLocalDateTime());
                    s.setUpdateDate(
                            rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime()
                                    : null);
                    return s;
                });

        // 组装分页对象
        return JdbcQueryHelper.toPage(
                jdbcTemplate,
                countSql.toString(),
                params,
                subjects,
                queryDto.getPageNum(),
                queryDto.getPageSize());
    }

    @Override
    public List<SubjectDto> list(String userId) {
        if (!StringUtils.hasText(userId)) {
            throw new IllegalArgumentException("User ID cannot be empty");
        }
        List<Subject> subjects = subjectRepository.findByCreateUser(userId);
        return convertToDtos(subjects);
    }

    @Override
    public boolean checkNameUniq(String userId, String subjectName, String excludeSubjectId) {
        if (!StringUtils.hasText(subjectName)) {
            return true;
        }
        Subject subject = subjectRepository.findByCreateUserAndName(userId, subjectName);
        if (subject == null) {
            return true;
        }
        if (excludeSubjectId != null && excludeSubjectId.equals(subject.getId())) {
            return true;
        }
        return false;
    }

    @Override
    public SubjectDto convertToDto(Subject subject, Boolean loadProps) {
        SubjectDto dto = new SubjectDto();
        BeanUtils.copyProperties(subject, dto);
        if (loadProps != null && loadProps) {
            List<SubjectDto> subjectList = List.of(dto);
            loadKnowledgeNum(subjectList);
            loadQuestionNum(subjectList);
        }
        return dto;
    }

    @Override
    public List<SubjectDto> convertToDtos(List<Subject> subjects) {
        List<SubjectDto> dtos = subjects.stream().map(subject -> convertToDto(subject, false))
                .collect(Collectors.toList());
        loadKnowledgeNum(dtos);
        loadQuestionNum(dtos);
        return dtos;
    }

    private void loadQuestionNum(List<SubjectDto> subjects) {
        if (subjects.isEmpty()) {
            return;
        }
        Map<String, SubjectDto> idMap = new HashMap<>();
        subjects.forEach(subject -> {
            idMap.put(subject.getId(), subject);
        });
        Map<String, Object> params = new HashMap<>();
        params.put("subjectIds", idMap.keySet());
        HumpHelper.lineToHump(jdbcTemplate.queryForList(
                "select k.subject_id, count(*) num from knowledge k inner join question_knowledge_rela r on k.knowledge_id = r.knowledge_id inner join question q on q.question_id = r.question_id where k.subject_id in (:subjectIds) group by k.subject_id",
                params)).forEach(map -> {
                    String subjectId = MapUtils.getString(map, "subjectId");
                    int num = MapUtils.getIntValue(map, "num");
                    idMap.get(subjectId).setQuestionNum(num);
                });
    }

    private void loadKnowledgeNum(List<SubjectDto> subjects) {
        if (subjects.isEmpty()) {
            return;
        }
        Map<String, SubjectDto> idMap = new HashMap<>();
        subjects.forEach(subject -> {
            idMap.put(subject.getId(), subject);
        });
        Map<String, Object> params = new HashMap<>();
        params.put("subjectIds", idMap.keySet());
        HumpHelper.lineToHump(jdbcTemplate.queryForList(
                "select k.subject_id, count(*) num from knowledge k where k.subject_id in (:subjectIds) group by k.subject_id",
                params)).forEach(map -> {
                    String subjectId = MapUtils.getString(map, "subjectId");
                    int num = MapUtils.getIntValue(map, "num");
                    idMap.get(subjectId).setKnowledgeNum(num);
                });
    }

}