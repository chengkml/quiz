package com.ck.quiz.question.service.impl;

import com.ck.quiz.knowledge.dto.KnowledgeCreateDto;
import com.ck.quiz.knowledge.dto.KnowledgeDto;
import com.ck.quiz.knowledge.entity.Knowledge;
import com.ck.quiz.knowledge.repository.KnowledgeRepository;
import com.ck.quiz.knowledge.service.KnowledgeService;
import com.ck.quiz.llmmodel.service.LLMModelService;
import com.ck.quiz.prompt.dto.PromptTemplateDto;
import com.ck.quiz.prompt.service.PromptTemplateService;
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
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import reactor.core.publisher.Flux;

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
    private PromptTemplateService promptTemplateService;

    @Autowired
    private LLMModelService llmModelService;

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
        String subjectId = questionCreateDto.getSubjectId();
        String categoryId = questionCreateDto.getCategoryId();

        // 将题目内容作为知识点存储
        if (StringUtils.hasText(subjectId) && StringUtils.hasText(categoryId)
                && StringUtils.hasText(questionCreateDto.getKnowledge())) {
            String knowledgeName = questionCreateDto.getKnowledge();

            // 检查是否已存在相同名称的知识点
            Optional<Knowledge> existingKnowledge = knowledgeRepository.findByName(knowledgeName);

            Knowledge knowledge;
            if (!existingKnowledge.isPresent()) {
                // 创建新的知识点
                KnowledgeCreateDto knowledgeCreateDto = new KnowledgeCreateDto();
                knowledgeCreateDto.setName(knowledgeName);
                knowledgeCreateDto.setSubjectId(subjectId);
                knowledgeCreateDto.setCategoryId(categoryId);

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
    public Flux<String> streamGenerateQuestions(String knowledgeDescr, int num, String modelName) {
        OpenAiChatModel chatModel = llmModelService.getChatModel(modelName);
        ChatClient chat = ChatClient.builder(chatModel).build();
        String prompt = buildPrompt(knowledgeDescr, num);

        StringBuilder fullContent = new StringBuilder();
        ObjectMapper objectMapper = new ObjectMapper();

        return chat.prompt()
                .user(prompt)
                .stream()
                .content()
                .doOnNext(chunk -> fullContent.append(chunk))
                .concatWith(Flux.defer(() -> {
                    String content = fullContent.toString().trim();

                    try {
                        List<QuestionCreateDto> list = objectMapper.readValue(content, new TypeReference<>() {
                        });

                        // 先发送解析标记
                        Flux<String> header = Flux.just("\n\n[PARSE_RESULT]\n");

                        // 再发送数据
                        Flux<String> body = Flux.fromIterable(list)
                                .map(item -> {
                                    try {
                                        return "[QUESTION]" + objectMapper.writeValueAsString(item);
                                    } catch (Exception e) {
                                        return "[ERROR]序列化题目失败";
                                    }
                                });

                        return Flux.concat(header, body);
                    } catch (Exception parseEx) {
                        return Flux.just("[ERROR]解析JSON失败: " + parseEx.getMessage());
                    }
                }))
                .onErrorResume(e -> Flux.just("[ERROR]服务异常: " + e.getMessage()));
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
        // 动态构建通用SQL，兼容多种数据库
        // 避免使用数据库特定函数，通过标准SQL实现查询
        StringBuilder sql = new StringBuilder(
                "SELECT q.question_id AS id, q.type, q.content, q.options, q.answer, q.explanation, " +
                        "q.create_date, q.create_user, q.update_date, q.update_user, u.user_name create_user_name " +
                        "FROM question q left join users u on u.user_id = q.create_user ");

        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM question q ");

        // 根据查询条件动态添加关联表
        if (queryDto.getCategoryIds() != null || queryDto.getSubjectId() != null) {
            sql.append(
                    " LEFT JOIN question_knowledge_rela r on q.question_id = r.question_id LEFT JOIN knowledge k on k.knowledge_id = r.knowledge_id ");
            countSql.append(
                    " LEFT JOIN question_knowledge_rela r on q.question_id = r.question_id LEFT JOIN knowledge k on k.knowledge_id = r.knowledge_id ");
        }

        sql.append(" WHERE 1=1 ");
        countSql.append(" WHERE 1=1 ");

        Map<String, Object> params = new HashMap<>();

        // 添加查询条件
        if (queryDto.getType() != null) {
            JdbcQueryHelper.equals("type", queryDto.getType().name(), " AND q.type = :type ", params, sql, countSql);
        }

        JdbcQueryHelper.in("categoryIds", queryDto.getCategoryIds(), " AND k.category_id in (:categoryIds) ", params,
                sql, countSql);

        JdbcQueryHelper.equals("subjectId", queryDto.getSubjectId(), " AND k.subject_id = :subjectId ", params, sql,
                countSql);

        // 使用标准的LIKE语句，兼容所有主流数据库
        JdbcQueryHelper.lowerLike("keyWord", queryDto.getContent(), " AND LOWER(q.content) LIKE :keyWord ", params,
                jdbcTemplate, sql, countSql);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            JdbcQueryHelper.equals("createUser", authentication.getName(), " AND q.create_user = :createUser ", params,
                    sql, countSql);
        }

        // 添加排序
        JdbcQueryHelper.order(queryDto.getSortColumn(), queryDto.getSortType(), sql);

        // 分页查询
        String pageSql = JdbcQueryHelper.getLimitSql(jdbcTemplate, sql.toString(), queryDto.getPageNum(),
                queryDto.getPageSize());

        List<QuestionDto> list = jdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            QuestionDto dto = new QuestionDto();
            dto.setId(rs.getString("id"));
            dto.setType(Question.QuestionType.valueOf(rs.getString("type")));
            dto.setContent(rs.getString("content"));
            dto.setOptions(rs.getString("options"));
            dto.setAnswer(rs.getString("answer"));
            dto.setExplanation(rs.getString("explanation"));
            dto.setCreateDate(
                    rs.getTimestamp("create_date") != null ? rs.getTimestamp("create_date").toLocalDateTime() : null);
            dto.setCreateUser(rs.getString("create_user"));
            dto.setCreateUserName(rs.getString("create_user_name"));
            dto.setUpdateDate(
                    rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime() : null);
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
                    INNER JOIN category c ON k.category_id = c.id
                    INNER JOIN subject s ON c.subject_id = s.id
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
    public List<QuestionCreateDto> generateQuestions(String knowledgeDescr, int num, String modelName) {
        OpenAiChatModel chatModel = llmModelService.getChatModel(modelName);
        ChatClient chat = ChatClient.builder(chatModel).build();

        ObjectMapper objectMapper = new ObjectMapper();

        int maxRetries = 3; // 最大重试次数
        long retryDelayMs = 1000L; // 重试间隔 1 秒
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
                    Thread.sleep(retryDelayMs); // 等待后再重试
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
        PromptTemplateDto promptTemplateDto = promptTemplateService.getByName("questionGenerate");
        String targetPrompt = promptTemplateDto.getContent().replace("{{questionNum}}", String.valueOf(num));
        targetPrompt = targetPrompt.replace("{{knowledgePointDescr}}", knowledgePointDescription);
        return targetPrompt;
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
    public List<KnowledgeDto> getQuestionKnowledge(String questionId) {
        List<Knowledge> knowledgeList = questionKnowledgeRepository.findKnowledgeByQuestionId(questionId);
        return knowledgeList.stream()
                .map(knowledgeService::convertToDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getQuestionCountByLastSevenDays() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Map<String, Object> params = new HashMap<>();
        params.put("createUser", authentication.getName());

        // 使用通用SQL，兼容各种数据库
        String sql = """
                    SELECT create_date
                    FROM question
                    WHERE create_user = :createUser
                    ORDER BY create_date ASC
                """;

        List<java.time.LocalDateTime> dates = jdbcTemplate.query(sql, params, (rs, rowNum) -> {
            java.sql.Timestamp timestamp = rs.getTimestamp("create_date");
            return timestamp != null ? timestamp.toLocalDateTime() : null;
        }).stream().filter(Objects::nonNull).toList();

        // 获取最近7天的日期范围
        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalDate sevenDaysAgo = today.minusDays(6);

        // 在代码中按日期分组统计
        Map<String, Long> result = new LinkedHashMap<>();
        for (java.time.LocalDate date = sevenDaysAgo; !date.isAfter(today); date = date.plusDays(1)) {
            String dateStr = date.toString();
            result.put(dateStr, 0L);
        }

        // 统计各日期的题目数量
        for (java.time.LocalDateTime dateTime : dates) {
            String dateStr = dateTime.toLocalDate().toString();
            if (result.containsKey(dateStr)) {
                result.put(dateStr, result.get(dateStr) + 1);
            }
        }

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getQuestionCountBySubject() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Map<String, Object> params = new HashMap<>();
        params.put("createUser", authentication.getName());

        // 简化SQL，只查询需要的数据，在代码中处理关联和统计
        String sql = """
                    SELECT DISTINCT q.question_id, s.name as subject_name
                    FROM question q
                    LEFT JOIN question_knowledge_rela r ON q.question_id = r.question_id
                    LEFT JOIN knowledge k ON r.knowledge_id = k.knowledge_id
                    LEFT JOIN category c ON k.category_id = c.id
                    LEFT JOIN subject s ON c.subject_id = s.id
                    WHERE q.create_user = :createUser
                """;

        // 查询所有数据，在代码中进行统计和排序
        List<Map<String, Object>> records = jdbcTemplate.queryForList(sql, params);

        // 在代码中按学科名称分组统计
        Map<String, Long> countMap = new LinkedHashMap<>();
        Set<String> seenQuestions = new HashSet<>();

        for (Map<String, Object> record : records) {
            String subjectName = (String) record.get("subject_name");
            String questionId = (String) record.get("question_id");

            // 过滤掉学科为null的记录
            if (subjectName != null && questionId != null) {
                String key = subjectName + ":" + questionId;
                if (!seenQuestions.contains(key)) {
                    seenQuestions.add(key);
                    countMap.put(subjectName, countMap.getOrDefault(subjectName, 0L) + 1);
                }
            }
        }

        // 按计数降序排序
        return countMap.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new));
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getQuestionCountByLastMonth() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Map<String, Object> params = new HashMap<>();
        params.put("createUser", authentication.getName());

        // 使用通用SQL，兼容各种数据库
        String sql = """
                    SELECT create_date
                    FROM question
                    WHERE create_user = :createUser
                    ORDER BY create_date ASC
                """;

        List<java.time.LocalDateTime> dates = jdbcTemplate.query(sql, params, (rs, rowNum) -> {
            java.sql.Timestamp timestamp = rs.getTimestamp("create_date");
            return timestamp != null ? timestamp.toLocalDateTime() : null;
        }).stream().filter(Objects::nonNull).toList();

        // 获取最近30天的日期范围
        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalDate thirtyDaysAgo = today.minusDays(29);

        // 在代码中按日期分组统计
        Map<String, Long> result = new LinkedHashMap<>();
        for (java.time.LocalDate date = thirtyDaysAgo; !date.isAfter(today); date = date.plusDays(1)) {
            String dateStr = date.toString();
            result.put(dateStr, 0L);
        }

        // 统计各日期的题目数量
        for (java.time.LocalDateTime dateTime : dates) {
            String dateStr = dateTime.toLocalDate().toString();
            if (result.containsKey(dateStr)) {
                result.put(dateStr, result.get(dateStr) + 1);
            }
        }

        return result;
    }

}