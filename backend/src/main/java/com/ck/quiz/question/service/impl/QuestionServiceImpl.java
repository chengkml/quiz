package com.ck.quiz.question.service.impl;

import com.ck.quiz.knowledge.dto.KnowledgeCreateDto;
import com.ck.quiz.knowledge.dto.KnowledgeDto;
import com.ck.quiz.knowledge.entity.Knowledge;
import com.ck.quiz.knowledge.repository.KnowledgeRepository;
import com.ck.quiz.knowledge.service.KnowledgeService;
import com.ck.quiz.llmmodel.entity.LLMModel;
import com.ck.quiz.llmmodel.repository.LLMModelRepository;
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
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
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
    private LLMModelRepository llmModelRepository;

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
    public SseEmitter streamGenerateQuestions(String knowledgeDescr, int num, String modelName) {
        SseEmitter emitter = new SseEmitter(0L);
        // 在新线程中执行生成并实时流式发送
        new Thread(() -> {
            ObjectMapper objectMapper = new ObjectMapper();
            try {
                // 查询模型配置
                LLMModel model = resolveModel(modelName);
                if (model == null) {
                    try {
                        emitter.send("[ERROR]未找到指定的文本模型，请先在模型管理中配置模型");
                    } catch (Exception ex) {
                        // ignore
                    }
                    emitter.completeWithError(new RuntimeException("未找到指定的文本模型，请先在模型管理中配置模型"));
                    return;
                }

                OpenAiApi openAiApi = OpenAiApi.builder()
                        .apiKey(model.getApiKey())
                        .baseUrl(model.getApiEndpoint())
                        .build();
                OpenAiChatOptions options = OpenAiChatOptions.builder()
                        .model(model.getName())
                        .build();
                OpenAiChatModel chatModel = OpenAiChatModel.builder()
                        .openAiApi(openAiApi)
                        .defaultOptions(options)
                        .build();
                ChatClient chat = ChatClient.builder(chatModel).build();

                // 使用流式 API 调用大模型，实时推送内容到前端
                StringBuilder fullContent = new StringBuilder();
                int maxRetries = 3;
                long retryDelayMs = 1000L;
                int attempt = 0;
                Exception lastException = null;

                while (attempt < maxRetries) {
                    boolean finished = false;
                    try {
                        attempt++;
                        // 每次重试前清空之前累积的内容
                        fullContent.setLength(0);
                        String prompt = buildPrompt(knowledgeDescr, num);

                        // 推送重试日志到前端（仅重试时推送，首次不推）
                        if (attempt > 1) {
                            try {
                                emitter.send("[RETRY]第" + attempt + "次重试AI生成题目...");
                            } catch (Exception e) {
                                // ignore
                            }
                        }

                        // 使用流式调用
                        chat.prompt()
                                .user(prompt)
                                .stream()
                                .content()  // 流式获取内容
                                .doOnNext(chunk -> {
                                    try {
                                        // 实时推送流式内容（token/chunk）到前端
                                        emitter.send(chunk);
                                        // 同时累积完整内容用于最后解析
                                        fullContent.append(chunk);
                                    } catch (Exception e) {
                                        // 推送失败时记录但继续接收流
                                        System.err.println("Failed to send chunk: " + e.getMessage());
                                    }
                                })
                                .blockLast();  // 阻塞等待流完成

                        // 流式内容接收完毕后，尝试解析最终的 JSON 结果
                        String content = fullContent.toString().trim();

                        try {
                            // 尝试解析 JSON（假设模型最后输出的是 JSON 数组）
                            List<QuestionCreateDto> list = objectMapper.readValue(content, new TypeReference<>() {
                            });

                            // 解析成功后，推送一个分隔符，告诉前端开始解析最终结果
                            try {
                                emitter.send("\n\n[PARSE_RESULT]\n");
                            } catch (Exception e) {
                                // ignore
                            }

                            // 逐条推送解析结果
                            for (QuestionCreateDto item : list) {
                                try {
                                    String json = objectMapper.writeValueAsString(item);
                                    // 使用特殊前缀标记这是解析完毕的完整题目对象
                                    emitter.send("[QUESTION]" + json);
                                    Thread.sleep(50);
                                } catch (Exception sendEx) {
                                    // 忽略单条发送错误，继续发送下一条
                                }
                            }

                            emitter.complete();
                            finished = true;
                            break;  // 成功完成，退出重试循环
                        } catch (Exception parseEx) {
                            // 将 JSON 解析失败视为一次失败，记录异常用于最终上报
                            lastException = parseEx;
                            // 如果还可以重试，则发送重试日志并继续重试（不要关闭 emitter）
                            if (attempt < maxRetries) {
                                try {
                                    emitter.send("[RETRY]解析 JSON 失败，第" + (attempt + 1) + "次重试...");
                                } catch (Exception e) {
                                    // ignore
                                }
                                try {
                                    Thread.sleep(retryDelayMs);
                                } catch (InterruptedException ie) {
                                    Thread.currentThread().interrupt();
                                    try {
                                        emitter.send("[ERROR]重试被中断: " + ie.getMessage());
                                    } catch (Exception ex) {
                                        // ignore
                                    }
                                    emitter.completeWithError(new RuntimeException("重试被中断", ie));
                                    return;
                                }
                                // 继续下一次重试循环
                                continue;
                            } else {
                                // 最后一次重试且解析失败，走到外层统一处理
                            }
                        }
                    } catch (Exception e) {
                        lastException = e;
                        // 只要不是最后一次重试，不能关闭emitter
                        if (attempt < maxRetries) {
                            try {
                                Thread.sleep(retryDelayMs);
                            } catch (InterruptedException ie) {
                                Thread.currentThread().interrupt();
                                try {
                                    emitter.send("[ERROR]重试被中断: " + ie.getMessage());
                                } catch (Exception ex) {
                                    // ignore
                                }
                                emitter.completeWithError(new RuntimeException("重试被中断", ie));
                                return;
                            }
                        }
                    }
                }
                // 只有所有重试都失败时才关闭emitter并推送错误
                if (attempt >= maxRetries) {
                    try {
                        emitter.send("[ERROR]生成题目失败，重试次数已达上限: " + (lastException != null ? lastException.getMessage() : "未知错误"));
                    } catch (Exception ex) {
                        // ignore
                    }
                    emitter.completeWithError(new RuntimeException("生成题目失败，重试次数已达上限", lastException));
                }
            } catch (Exception e) {
                try {
                    emitter.send("[ERROR]服务异常: " + e.getMessage());
                } catch (Exception ex) {
                    // ignore
                }
                try {
                    emitter.completeWithError(e);
                } catch (Exception ex) {
                    // ignore
                }
            }
        }).start();
        return emitter;
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
        StringBuilder sql = new StringBuilder(
                "SELECT q.question_id AS id, q.type, q.content, q.options, q.answer, q.explanation, " +
                        "q.create_date, q.create_user, q.update_date, q.update_user, u.user_name create_user_name " +
                        "FROM question q left join users u on u.user_id = q.create_user ");

        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM question q ");

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
                    INNER JOIN category c ON k.category_id = c.category_id
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
        // 查询模型配置
        LLMModel model = resolveModel(modelName);
        if (model == null) {
            throw new RuntimeException("未找到指定的文本模型，请先在模型管理中配置模型");
        }
        OpenAiApi openAiApi = OpenAiApi.builder().apiKey(model.getApiKey()).baseUrl(model.getApiEndpoint())
                .build();
        OpenAiChatOptions options = OpenAiChatOptions.builder().model(model.getName())
                .build();
        OpenAiChatModel chatModel = OpenAiChatModel.builder()
                .openAiApi(openAiApi)
                .defaultOptions(options)
                .build();
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

    /**
     * 解析模型配置
     * 
     * @param modelName 模型名称（可选）
     * @return 模型配置，如果未指定模型名则返回默认模型
     */
    private LLMModel resolveModel(String modelName) {
        if (StringUtils.hasText(modelName)) {
            return llmModelRepository.findByName(modelName).orElse(null);
        } else {
            return llmModelRepository.findByTypeAndIsDefault(LLMModel.ModelType.TEXT, "1").orElse(null);
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
        // 使用SQL查询近7天的题目数量，按日期分组
        String sql = """
                    SELECT
                      DATE_FORMAT(create_date, '%Y-%m-%d') AS date,
                      COUNT(*) AS count
                    FROM question
                    WHERE create_user = :createUser and DATE(create_date) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                    GROUP BY DATE_FORMAT(create_date, '%Y-%m-%d')
                    ORDER BY date ASC
                """;

        return jdbcTemplate.query(sql, params, (rs, rowNum) -> {
            String date = rs.getString("date");
            Long count = rs.getLong("count");
            return Map.entry(date, count);
        }).stream().collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getQuestionCountBySubject() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Map<String, Object> params = new HashMap<>();
        params.put("createUser", authentication.getName());
        // 使用SQL查询各学科的题目数量
        String sql = """
                    SELECT s.name as subject_name, COUNT(DISTINCT q.question_id) as count
                    FROM question q
                    LEFT JOIN question_knowledge_rela r ON q.question_id = r.question_id
                    LEFT JOIN knowledge k ON r.knowledge_id = k.knowledge_id
                    LEFT JOIN category c ON k.category_id = c.category_id
                    LEFT JOIN subject s ON c.subject_id = s.id
                    WHERE q.create_user = :createUser and s.name is not null
                    GROUP BY s.name
                    ORDER BY count DESC
                """;

        return jdbcTemplate.query(sql, params, (rs, rowNum) -> {
            String subjectName = rs.getString("subject_name");
            Long count = rs.getLong("count");
            return Map.entry(subjectName, count);
        }).stream().filter(entry -> entry.getKey() != null)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getQuestionCountByLastMonth() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Map<String, Object> params = new HashMap<>();
        params.put("createUser", authentication.getName());
        // 使用SQL查询近30天的题目数量，按日期分组
        String sql = """
                    SELECT
                      DATE_FORMAT(create_date, '%Y-%m-%d') AS date,
                      COUNT(*) AS count
                    FROM question
                    WHERE create_user = :createUser and DATE(create_date) >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
                    GROUP BY DATE_FORMAT(create_date, '%Y-%m-%d')
                    ORDER BY date ASC
                """;

        return jdbcTemplate.query(sql, params, (rs, rowNum) -> {
            String date = rs.getString("date");
            Long count = rs.getLong("count");
            return Map.entry(date, count);
        }).stream().collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

}