package com.ck.quiz.question.service.impl;

import com.ck.quiz.knowledge.dto.KnowledgeCreateDto;
import com.ck.quiz.knowledge.dto.KnowledgeDto;
import com.ck.quiz.knowledge.entity.Knowledge;
import com.ck.quiz.knowledge.repository.KnowledgeRepository;
import com.ck.quiz.knowledge.service.KnowledgeService;
import com.ck.quiz.question.dto.QuestionCreateDto;
import com.ck.quiz.question.dto.QuestionDto;
import com.ck.quiz.question.dto.QuestionQueryDto;
import com.ck.quiz.question.dto.QuestionUpdateDto;
import com.ck.quiz.question.entity.Question;
import com.ck.quiz.question.repository.QuestionKnowledgeRepository;
import com.ck.quiz.question.repository.QuestionRepository;
import com.ck.quiz.question.service.QuestionService;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 题目管理服务实现类
 */
@Service
public class QuestionServiceImpl implements QuestionService {

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private QuestionKnowledgeRepository questionKnowledgeRepository;

    @Autowired
    private KnowledgeRepository knowledgeRepository;

    @Autowired
    private KnowledgeService knowledgeService;

    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;

    @Autowired
    private ChatClient.Builder chatBuilder;

    @Override
    @Transactional
    public QuestionDto createQuestion(QuestionCreateDto questionCreateDto) {
        Question question = new Question();
        question.setId(IdHelper.genUuid());
        question.setType(questionCreateDto.getType());
        question.setContent(questionCreateDto.getContent());
        question.setOptions(questionCreateDto.getOptions());
        question.setAnswer(questionCreateDto.getAnswer());
        question.setExplanation(questionCreateDto.getExplanation());
        question.setDifficultyLevel(questionCreateDto.getDifficultyLevel());
        String subjectId = questionCreateDto.getSubjectId();
        String categoryId = questionCreateDto.getCategoryId();

        // 将题目内容作为知识点存储
        if (StringUtils.hasText(subjectId) && StringUtils.hasText(categoryId) && StringUtils.hasText(questionCreateDto.getKnowledge())) {
            String knowledgeName = questionCreateDto.getKnowledge();

            // 检查是否已存在相同名称的知识点
            Optional<Knowledge> existingKnowledge = knowledgeRepository.findByName(knowledgeName);

            Knowledge knowledge;
            if (!existingKnowledge.isPresent()) {
                // 创建新的知识点
                KnowledgeCreateDto knowledgeCreateDto =
                        new KnowledgeCreateDto();
                knowledgeCreateDto.setName(knowledgeName);
                knowledgeCreateDto.setDescription(knowledgeName);
                knowledgeCreateDto.setSubjectId(subjectId);
                knowledgeCreateDto.setCategoryId(categoryId);
                knowledgeCreateDto.setDifficultyLevel(questionCreateDto.getDifficultyLevel());

                KnowledgeDto createdKnowledge = knowledgeService.createKnowledge(knowledgeCreateDto);
                knowledge = knowledgeRepository.findById(createdKnowledge.getId()).orElse(null);
            } else {
                knowledge = existingKnowledge.get();
            }

            // 保存题目
            Question savedQuestion = questionRepository.save(question);

            // 建立题目与知识点的关联关系
            if (knowledge != null) {
                savedQuestion.getKnowledgePoints().add(knowledge);
                questionRepository.save(savedQuestion);
            }

            return convertToDto(savedQuestion);
        }

        Question savedQuestion = questionRepository.save(question);
        return convertToDto(savedQuestion);
    }

    @Override
    @Transactional
    public QuestionDto updateQuestion(QuestionUpdateDto questionUpdateDto) {
        Optional<Question> optionalQuestion = questionRepository.findById(questionUpdateDto.getId());
        if (optionalQuestion.isEmpty()) {
            throw new RuntimeException("题目不存在，ID: " + questionUpdateDto.getId());
        }

        Question question = optionalQuestion.get();

        // 只更新非空字段
        if (questionUpdateDto.getType() != null) {
            question.setType(questionUpdateDto.getType());
        }
        if (StringUtils.hasText(questionUpdateDto.getContent())) {
            question.setContent(questionUpdateDto.getContent());
        }
        if (questionUpdateDto.getOptions() != null) {
            question.setOptions(questionUpdateDto.getOptions());
        }
        if (StringUtils.hasText(questionUpdateDto.getAnswer())) {
            question.setAnswer(questionUpdateDto.getAnswer());
        }
        if (questionUpdateDto.getExplanation() != null) {
            question.setExplanation(questionUpdateDto.getExplanation());
        }
        if (questionUpdateDto.getDifficultyLevel() != null) {
            question.setDifficultyLevel(questionUpdateDto.getDifficultyLevel());
        }

        Question savedQuestion = questionRepository.save(question);
        return convertToDto(savedQuestion);
    }

    @Override
    @Transactional
    public QuestionDto deleteQuestion(String questionId) {
        Optional<Question> optionalQuestion = questionRepository.findById(questionId);
        if (optionalQuestion.isEmpty()) {
            throw new RuntimeException("题目不存在，ID: " + questionId);
        }

        Question question = optionalQuestion.get();
        questionRepository.delete(question);
        return convertToDto(question);
    }

    @Override
    @Transactional(readOnly = true)
    public QuestionDto getQuestionById(String questionId) {
        Optional<Question> optionalQuestion = questionRepository.findById(questionId);
        if (optionalQuestion.isEmpty()) {
            throw new RuntimeException("题目不存在，ID: " + questionId);
        }
        return convertToDto(optionalQuestion.get());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<QuestionDto> searchQuestions(QuestionQueryDto queryDto) {
        StringBuilder sql = new StringBuilder(
                "SELECT q.question_id AS id, q.type, q.content, q.options, q.answer, q.explanation, " +
                        "q.difficulty_level, q.create_date, q.create_user, q.update_date, q.update_user, u.user_name create_user_name " +
                        "FROM question q left join user u on u.user_id = q.create_user "
        );

        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM question q "
        );

        if (queryDto.getCategoryId() != null || queryDto.getSubjectId() != null) {
            sql.append(" LEFT JOIN question_knowledge_rela r on q.question_id = r.question_id LEFT JOIN knowledge k on k.knowledge_id = r.knowledge_id ");
            countSql.append(" LEFT JOIN question_knowledge_rela r on q.question_id = r.question_id LEFT JOIN knowledge k on k.knowledge_id = r.knowledge_id ");
        }

        sql.append(" WHERE 1=1 ");
        countSql.append(" WHERE 1=1 ");

        Map<String, Object> params = new HashMap<>();

        // 添加查询条件
        if (queryDto.getType() != null) {
            JdbcQueryHelper.equals("type", queryDto.getType().name(), " AND q.type = :type ", params, sql, countSql);
        }

        JdbcQueryHelper.equals("categoryId", queryDto.getCategoryId(), " AND k.category_id = :categoryId ", params, sql, countSql);

        JdbcQueryHelper.equals("subjectId", queryDto.getSubjectId(), " AND k.subject_id = :subjectId ", params, sql, countSql);

        JdbcQueryHelper.lowerLike("keyWord", queryDto.getContent(), " AND LOWER(q.content) LIKE :keyWord ", params, jdbcTemplate, sql, countSql);

        if (queryDto.getDifficultyLevel() != null) {
            JdbcQueryHelper.equals("difficultyLevel", String.valueOf(queryDto.getDifficultyLevel()), " AND q.difficulty_level = :difficultyLevel ", params, sql, countSql);
        }

        JdbcQueryHelper.equals("createUser", queryDto.getCreateUser(), " AND q.create_user = :createUser ", params, sql, countSql);

        // 添加排序
        JdbcQueryHelper.order(queryDto.getSortColumn(), queryDto.getSortType(), sql);

        // 分页查询
        String pageSql = JdbcQueryHelper.getLimitSql(jdbcTemplate, sql.toString(), queryDto.getPageNum(), queryDto.getPageSize());

        List<QuestionDto> list = jdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            QuestionDto dto = new QuestionDto();
            dto.setId(rs.getString("id"));
            dto.setType(Question.QuestionType.valueOf(rs.getString("type")));
            dto.setContent(rs.getString("content"));
            dto.setOptions(rs.getString("options"));
            dto.setAnswer(rs.getString("answer"));
            dto.setExplanation(rs.getString("explanation"));
            dto.setDifficultyLevel(rs.getInt("difficulty_level"));
            dto.setCreateDate(rs.getTimestamp("create_date") != null ? rs.getTimestamp("create_date").toLocalDateTime() : null);
            dto.setCreateUser(rs.getString("create_user"));
            dto.setCreateUserName(rs.getString("create_user_name"));
            dto.setUpdateDate(rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime() : null);
            dto.setUpdateUser(rs.getString("update_user"));
            return dto;
        });
        if (!list.isEmpty()) {
            List<String> questionIds = list.stream().map(QuestionDto::getId).collect(Collectors.toList());

            // 查询题目关联的知识点、分类、学科
            String relaSql = """
        SELECT r.question_id,
               k.category_id,
               c.name category_name,
               k.subject_id,
               s.name subject_name
        FROM question_knowledge_rela r
        INNER JOIN knowledge k ON r.knowledge_id = k.knowledge_id
        INNER JOIN category c ON k.category_id = c.category_id
        INNER JOIN subject s ON c.subject_id = s.subject_id
        WHERE r.question_id IN (:questionIds)
        """;

            Map<String, Object> relaParams = new HashMap<>();
            relaParams.put("questionIds", questionIds);

            // 查询所有关联结果
            List<Map<String, Object>> relaList = jdbcTemplate.queryForList(relaSql, relaParams);

            // 按 question_id 组织映射（如果题目属于多个分类，只取一个或第一个）
            Map<String, Map<String, Object>> relaMap = new HashMap<>();
            for (Map<String, Object> row : relaList) {
                String qid = (String) row.get("question_id");
                relaMap.putIfAbsent(qid, row);
            }

            // 回填字段
            for (QuestionDto dto : list) {
                Map<String, Object> row = relaMap.get(dto.getId());
                if (row != null) {
                    dto.setSubjectId((String) row.get("subject_id"));
                    dto.setSubjectName((String) row.get("subject_name"));
                    dto.setCategoryId((String) row.get("category_id"));
                    dto.setCategoryName((String) row.get("category_name"));
                }
            }
        }

        // 获取总数
        Long total = jdbcTemplate.queryForObject(countSql.toString(), params, Long.class);

        return new PageImpl<>(list,
                org.springframework.data.domain.PageRequest.of(queryDto.getPageNum(), queryDto.getPageSize()),
                total != null ? total : 0);
    }

    @Override
    public QuestionDto convertToDto(Question question) {
        QuestionDto dto = new QuestionDto();
        BeanUtils.copyProperties(question, dto);
        return dto;
    }

    @Override
    public List<QuestionCreateDto> generateQuestions(String knowledgeDescr, int num) {
        ChatClient chat = chatBuilder.build();
        ObjectMapper objectMapper = new ObjectMapper();

        int maxRetries = 3;          // 最大重试次数
        long retryDelayMs = 1000L;   // 重试间隔 1 秒
        int attempt = 0;

        while (true) {
            try {
                attempt++;
                String content = chat.prompt(buildPrompt(knowledgeDescr, num)).call().content();
                return objectMapper.readValue(content, new TypeReference<>() {
                });
            } catch (Exception e) {
                if (attempt >= maxRetries) {
                    throw new RuntimeException("生成题目失败，重试次数已达上限", e);
                }
                try {
                    Thread.sleep(retryDelayMs);  // 等待后再重试
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("重试被中断", ie);
                }
            }
        }
    }

    @Override
    public List<QuestionDto> createQuestions(List<QuestionCreateDto> questionCreateDtos) {
        List<QuestionDto> result = new ArrayList<>();
        questionCreateDtos.forEach(questionCreateDto -> {
            result.add(createQuestion(questionCreateDto));
        });
        return result;
    }

    private String buildPrompt(String knowledgePointDescription, int num) {
        return "你是一个专业的教育题库生成器。我将给你一个知识点描述，请你生成" + num + "道题目。要求如下：\n" +
                "\n" +
                "1. 输出严格 JSON，包含以下字段：\n" +
                "[{\n" +
                "  \"type\": \"SINGLE | MULTIPLE\",  // 题型\n" +
                "  \"content\": \"题干文本\",\n" +
                "  \"options\": \"A.选项1;B.选项2;C.选项3;D.选项4\",   // 所有选项用分号分隔，单选/多选题必填，填空/简答可为空\n" +
                "  \"answer\": \"正确答案的 key 或文本，如 A 或 选项文本\",  // 对应正确答案，多个答案用逗号分隔\n" +
                "  \"explanation\": \"题目解析说明\",\n" +
                "  \"difficultyLevel\": 1-5                               // 难度等级\n" +
                "}]\n" +
                "\n" +
                "2. 题型说明：\n" +
                "- SINGLE: 单选题\n" +
                "- MULTIPLE: 多选题，答案多个时请用逗号分隔\n" +
                "\n" +
                "3. 输出规则：\n" +
                "- 题目必须紧扣知识点描述\n" +
                "- 单选题选项互斥，多选题选项合理\n" +
                "- 解析要详细，便于学习者理解\n" +
                "- options 和 answer 必须为字符串，不要输出 JSON 对象或数组\n" +
                "- 输出 JSON 严格规范，不要多余文字\n" +
                "- 每次生成多道题时，请输出一个 JSON 数组，每个元素为一条题目\n" +
                "\n" +
                "知识点描述如下：\n" +
                "\"" + knowledgePointDescription + "\"\n";
    }

    @Override
    @Transactional
    public void associateKnowledge(String questionId, List<String> knowledgeIds) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("问题不存在: " + questionId));

        List<Knowledge> knowledgeList = knowledgeRepository.findAllById(knowledgeIds);
        if (knowledgeList.size() != knowledgeIds.size()) {
            throw new RuntimeException("部分知识点不存在");
        }

        // 添加新的关联关系
        for (Knowledge knowledge : knowledgeList) {
            if (!question.getKnowledgePoints().contains(knowledge)) {
                question.getKnowledgePoints().add(knowledge);
            }
        }

        questionRepository.save(question);
    }

    @Override
    @Transactional
    public void disassociateKnowledge(String questionId, List<String> knowledgeIds) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("问题不存在: " + questionId));

        List<Knowledge> knowledgeList = knowledgeRepository.findAllById(knowledgeIds);

        // 移除关联关系
        for (Knowledge knowledge : knowledgeList) {
            question.getKnowledgePoints().remove(knowledge);
        }

        questionRepository.save(question);
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.ck.quiz.knowledge.dto.KnowledgeDto> getQuestionKnowledge(String questionId) {
        List<Knowledge> knowledgeList = questionKnowledgeRepository.findKnowledgeByQuestionId(questionId);
        return knowledgeList.stream()
                .map(knowledgeService::convertToDto)
                .toList();
    }

}