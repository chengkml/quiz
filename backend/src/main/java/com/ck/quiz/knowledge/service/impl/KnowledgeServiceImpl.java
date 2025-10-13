package com.ck.quiz.knowledge.service.impl;

import com.ck.quiz.knowledge.dto.KnowledgeCreateDto;
import com.ck.quiz.knowledge.dto.KnowledgeDto;
import com.ck.quiz.knowledge.dto.KnowledgeQueryDto;
import com.ck.quiz.knowledge.dto.KnowledgeUpdateDto;
import com.ck.quiz.knowledge.entity.Knowledge;
import com.ck.quiz.knowledge.exception.KnowledgeException;
import com.ck.quiz.knowledge.repository.KnowledgeRepository;
import com.ck.quiz.knowledge.service.KnowledgeService;
import com.ck.quiz.question.repository.QuestionKnowledgeRepository;
import com.ck.quiz.question.service.QuestionService;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 知识点服务实现类
 * 实现知识点管理的具体业务逻辑
 */
@Slf4j
@Service
@Transactional
public class KnowledgeServiceImpl implements KnowledgeService {

    @Autowired
    private KnowledgeRepository knowledgeRepository;
    @Autowired
    private NamedParameterJdbcTemplate namedParameterJdbcTemplate;
    @Autowired
    private QuestionKnowledgeRepository questionKnowledgeRepository;
    @Lazy
    @Autowired
    private QuestionService questionService;

    @Override
    public KnowledgeDto createKnowledge(KnowledgeCreateDto createDto) {
        log.info("创建知识点: {}", createDto.getName());

        // 检查知识点名称是否已存在
        if (knowledgeRepository.existsByName(createDto.getName())) {
            throw new KnowledgeException("KNOWLEDGE_NAME_EXISTS", "知识点名称已存在: " + createDto.getName());
        }

        // 创建知识点实体
        Knowledge knowledge = new Knowledge();
        knowledge.setId(IdHelper.genUuid());
        knowledge.setName(createDto.getName());
        knowledge.setDescription(createDto.getDescription());
        knowledge.setCategoryId(createDto.getCategoryId());
        knowledge.setSubjectId(createDto.getSubjectId());
        knowledge.setDifficultyLevel(createDto.getDifficultyLevel());

        // 保存知识点
        Knowledge savedKnowledge = knowledgeRepository.save(knowledge);
        log.info("知识点创建成功，ID: {}", savedKnowledge.getId());

        return convertToDto(savedKnowledge);
    }

    @Override
    public KnowledgeDto updateKnowledge(KnowledgeUpdateDto updateDto) {
        log.info("更新知识点: {}", updateDto.getId());

        // 检查知识点是否存在
        Knowledge knowledge = knowledgeRepository.findById(updateDto.getId())
                .orElseThrow(() -> new KnowledgeException("KNOWLEDGE_NOT_FOUND", "知识点不存在: " + updateDto.getId()));

        // 检查知识点名称是否已被其他知识点使用
        if (knowledgeRepository.existsByNameAndIdNot(updateDto.getName(), updateDto.getId())) {
            throw new KnowledgeException("KNOWLEDGE_NAME_EXISTS", "知识点名称已存在: " + updateDto.getName());
        }

        // 更新知识点信息
        knowledge.setName(updateDto.getName());
        knowledge.setDescription(updateDto.getDescription());
        knowledge.setCategoryId(updateDto.getCategoryId());
        knowledge.setSubjectId(updateDto.getSubjectId());
        knowledge.setDifficultyLevel(updateDto.getDifficultyLevel());

        // 保存更新
        Knowledge savedKnowledge = knowledgeRepository.save(knowledge);
        log.info("知识点更新成功，ID: {}", savedKnowledge.getId());

        return convertToDto(savedKnowledge);
    }

    @Override
    public void deleteKnowledge(String id) {
        log.info("删除知识点: {}", id);

        // 检查知识点是否存在
        if (!knowledgeRepository.existsById(id)) {
            throw new KnowledgeException("KNOWLEDGE_NOT_FOUND", "知识点不存在: " + id);
        }

        // TODO: 检查是否有关联的题目，如果有则不允许删除

        // 删除知识点
        knowledgeRepository.deleteById(id);
        log.info("知识点删除成功，ID: {}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public KnowledgeDto getKnowledgeById(String id) {
        log.debug("根据ID获取知识点: {}", id);

        Knowledge knowledge = knowledgeRepository.findById(id)
                .orElseThrow(() -> new KnowledgeException("KNOWLEDGE_NOT_FOUND", "知识点不存在: " + id));

        return convertToDto(knowledge);
    }

    @Override
    @Transactional(readOnly = true)
    public KnowledgeDto getKnowledgeByName(String name) {
        log.debug("根据名称获取知识点: {}", name);

        Knowledge knowledge = knowledgeRepository.findByName(name)
                .orElseThrow(() -> new KnowledgeException("KNOWLEDGE_NOT_FOUND", "知识点不存在: " + name));

        return convertToDto(knowledge);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<KnowledgeDto> searchKnowledge(KnowledgeQueryDto queryDto) {
        StringBuilder sql = new StringBuilder("select k.*, u.user_name create_user_name, s.name subject_name, c.name category_name from knowledge k left join user u on u.user_id = k.create_user left join subject s on s.subject_id = k.subject_id left join category c on c.category_id = k.category_id where 1=1 ");
        StringBuilder countSql = new StringBuilder("select count(1) from knowledge k where 1=1 ");
        Map<String, Object> params = new HashMap<>();

        // 知识点名称（模糊查询）
        JdbcQueryHelper.lowerLike("knowledgeName", queryDto.getKnowledgeName(),
                " and lower(k.name) like :knowledgeName ", params, namedParameterJdbcTemplate, sql, countSql);

        // 分类ID
        JdbcQueryHelper.equals("categoryId", queryDto.getCategoryId(),
                " and k.category_id = :categoryId ", params, sql, countSql);

        // 学科ID
        JdbcQueryHelper.equals("subjectId", queryDto.getSubjectId(),
                " and k.subject_id = :subjectId ", params, sql, countSql);

        // 难度等级
        if (queryDto.getDifficultyLevel() != null) {
            sql.append(" and k.difficulty_level = :difficultyLevel ");
            countSql.append(" and k.difficulty_level = :difficultyLevel ");
            params.put("difficultyLevel", queryDto.getDifficultyLevel());
        }

        // 排序
        JdbcQueryHelper.order(queryDto.getSortColumn(), queryDto.getSortType(), sql);

        // 分页（pageNum 从1开始，转成从0开始）
        int pageNum = Math.max(0, queryDto.getPageNum() - 1);
        String limitSql = JdbcQueryHelper.getLimitSql(
                namedParameterJdbcTemplate,
                sql.toString(),
                pageNum,
                queryDto.getPageSize()
        );

        // 查询结果
        List<KnowledgeDto> knowledgeList = namedParameterJdbcTemplate.query(
                limitSql,
                params,
                (rs, rowNum) -> {
                    KnowledgeDto k = new KnowledgeDto();
                    k.setId(rs.getString("knowledge_id"));
                    k.setName(rs.getString("name"));
                    k.setDescription(rs.getString("description"));
                    k.setCategoryId(rs.getString("category_id"));
                    k.setCategoryName(rs.getString("category_name"));
                    k.setSubjectId(rs.getString("subject_id"));
                    k.setSubjectName(rs.getString("subject_name"));
                    k.setDifficultyLevel(rs.getInt("difficulty_level"));
                    k.setCreateDate(rs.getTimestamp("create_date").toLocalDateTime());
                    k.setUpdateDate(rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime() : null);
                    k.setCreateUser(rs.getString("create_user"));
                    k.setCreateUserName(rs.getString("create_user_name"));
                    k.setUpdateUser(rs.getString("update_user"));
                    return k;
                }
        );

        // 分页结果封装
        return JdbcQueryHelper.toPage(
                namedParameterJdbcTemplate,
                countSql.toString(),
                params,
                knowledgeList,
                pageNum,
                queryDto.getPageSize()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public boolean checkKnowledgeNameExists(String name, String excludeId) {
        log.debug("检查知识点名称是否存在: {}, 排除ID: {}", name, excludeId);

        if (StringUtils.hasText(excludeId)) {
            return knowledgeRepository.existsByNameAndIdNot(name, excludeId);
        } else {
            return knowledgeRepository.existsByName(name);
        }
    }

    @Override
    public KnowledgeDto convertToDto(Knowledge knowledge) {
        if (knowledge == null) {
            return null;
        }

        KnowledgeDto dto = new KnowledgeDto();
        dto.setId(knowledge.getId());
        dto.setName(knowledge.getName());
        dto.setDescription(knowledge.getDescription());
        dto.setCategoryId(knowledge.getCategoryId());
        dto.setSubjectId(knowledge.getSubjectId());
        dto.setDifficultyLevel(knowledge.getDifficultyLevel());
        dto.setCreateDate(knowledge.getCreateDate());
        dto.setCreateUser(knowledge.getCreateUser());
        dto.setUpdateDate(knowledge.getUpdateDate());
        dto.setUpdateUser(knowledge.getUpdateUser());

        // TODO: 根据categoryId和subjectId查询对应的名称
        // dto.setCategoryName(categoryService.getCategoryById(knowledge.getCategoryId()).getName());
        // dto.setSubjectName(subjectService.getSubjectById(knowledge.getSubjectId()).getName());

        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.ck.quiz.question.dto.QuestionDto> getKnowledgeQuestions(String knowledgeId) {
        List<com.ck.quiz.question.entity.Question> questions = questionKnowledgeRepository.findQuestionsByKnowledgeId(knowledgeId);
        return questions.stream()
                .map(questionService::convertToDto)
                .toList();
    }

}