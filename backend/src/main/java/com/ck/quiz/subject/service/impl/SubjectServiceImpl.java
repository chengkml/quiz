package com.ck.quiz.subject.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.subject.dto.SubjectCreateDto;
import com.ck.quiz.subject.dto.SubjectDto;
import com.ck.quiz.subject.dto.SubjectQueryDto;
import com.ck.quiz.subject.dto.SubjectUpdateDto;
import com.ck.quiz.subject.entity.Subject;
import com.ck.quiz.subject.repository.SubjectRepository;
import com.ck.quiz.subject.service.SubjectService;
import com.ck.quiz.utils.HumpHelper;
import com.ck.quiz.utils.JdbcQueryHelper;

import org.apache.commons.collections4.MapUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
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
public class SubjectServiceImpl extends BaseServiceImpl<SubjectCreateDto, SubjectUpdateDto, SubjectQueryDto, SubjectDto, Subject, SubjectRepository> implements SubjectService {

    @Autowired
    private SubjectRepository subjectRepository;

    @Override
    public Page<SubjectDto> search(String userId, SubjectQueryDto queryDto) {
        StringBuilder sql = new StringBuilder(
                "select s.* from subject s where 1=1 ");
        StringBuilder countSql = new StringBuilder("select count(1) from subject s where 1=1 ");
        Map<String, Object> params = new HashMap<>();

        // 按名称模糊查询
        JdbcQueryHelper.lowerLike("subjectName", queryDto.getKeyWord(),
                " and lower(s.name) like :subjectName ", params, namedParameterJdbcTemplate, sql, countSql);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            JdbcQueryHelper.equals("createUser", authentication.getName(),
                    " AND s.create_user = :createUser ", params, sql, countSql);
        }

        // 排序
        JdbcQueryHelper.order("s.create_date", "desc", sql);

        // 分页SQL
        String limitSql = JdbcQueryHelper.getLimitSql(
                namedParameterJdbcTemplate,
                sql.toString(),
                queryDto.getPageNum(),
                queryDto.getPageSize());

        // 查询数据
        List<SubjectDto> subjects = namedParameterJdbcTemplate.query(
                limitSql,
                params,
                (rs, rowNum) -> {
                    SubjectDto s = new SubjectDto();
                    s.setId(rs.getString("id"));
                    s.setName(rs.getString("name"));
                    s.setCreateUser(rs.getString("create_user"));
                    s.setDescr(rs.getString("descr"));
                    s.setCreateDate(rs.getTimestamp("create_date").toLocalDateTime());
                    s.setUpdateDate(
                            rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime()
                                    : null);
                    return s;
                });

        // 组装分页对象
        return JdbcQueryHelper.toPage(
                namedParameterJdbcTemplate,
                countSql.toString(),
                params,
                subjects,
                queryDto.getPageNum(),
                queryDto.getPageSize());
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
        SubjectDto dto = super.convertToDto(subject, loadProps);
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
        HumpHelper.lineToHump(namedParameterJdbcTemplate.queryForList(
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
        HumpHelper.lineToHump(namedParameterJdbcTemplate.queryForList(
                "select k.subject_id, count(*) num from knowledge k where k.subject_id in (:subjectIds) group by k.subject_id",
                params)).forEach(map -> {
                    String subjectId = MapUtils.getString(map, "subjectId");
                    int num = MapUtils.getIntValue(map, "num");
                    idMap.get(subjectId).setKnowledgeNum(num);
                });
    }

    @Override
    protected SubjectDto newDto() {
        return new SubjectDto();
    }

    @Override
    protected Subject newModel() {
        return new Subject();
    }

}