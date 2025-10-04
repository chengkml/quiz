package com.ck.quiz.question.service.impl;

import com.ck.quiz.question.dto.QuestionCreateDto;
import com.ck.quiz.question.dto.QuestionDto;
import com.ck.quiz.question.dto.QuestionQueryDto;
import com.ck.quiz.question.dto.QuestionUpdateDto;
import com.ck.quiz.question.entity.Question;
import com.ck.quiz.question.repository.QuestionRepository;
import com.ck.quiz.question.repository.QuestionKnowledgeRepository;
import com.ck.quiz.question.service.QuestionService;
import com.ck.quiz.knowledge.entity.Knowledge;
import com.ck.quiz.knowledge.repository.KnowledgeRepository;
import com.ck.quiz.knowledge.service.KnowledgeService;
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
                        "q.difficulty_level, q.create_date, q.create_user, q.update_date, q.update_user " +
                        "FROM question q WHERE 1=1 "
        );

        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM question q WHERE 1=1 "
        );

        Map<String, Object> params = new HashMap<>();

        // 添加查询条件
        if (queryDto.getType() != null) {
            JdbcQueryHelper.equals("type", queryDto.getType().name(), " AND q.type = :type ", params, sql, countSql);
        }

        if (StringUtils.hasText(queryDto.getContent())) {
            JdbcQueryHelper.lowerLike("keyWord", queryDto.getContent(), " AND LOWER(q.content) LIKE :keyWord ", params, jdbcTemplate, sql, countSql);
        }

        if (queryDto.getDifficultyLevel() != null) {
            JdbcQueryHelper.equals("difficultyLevel", String.valueOf(queryDto.getDifficultyLevel()), " AND q.difficulty_level = :difficultyLevel ", params, sql, countSql);
        }

        if (StringUtils.hasText(queryDto.getCreateUser())) {
            JdbcQueryHelper.equals("createUser", queryDto.getCreateUser(), " AND q.create_user = :createUser ", params, sql, countSql);
        }

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
            dto.setUpdateDate(rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime() : null);
            dto.setUpdateUser(rs.getString("update_user"));
            return dto;
        });

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
                "  \"type\": \"SINGLE | MULTIPLE | BLANK | SHORT_ANSWER\",  // 题型\n" +
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
                "- BLANK: 填空题\n" +
                "- SHORT_ANSWER: 简答题\n" +
                "\n" +
                "3. 输出规则：\n" +
                "- 题目必须紧扣知识点描述\n" +
                "- 单选题选项互斥，多选题选项合理\n" +
                "- 填空题、简答题可为空选项，但必须提供答案\n" +
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