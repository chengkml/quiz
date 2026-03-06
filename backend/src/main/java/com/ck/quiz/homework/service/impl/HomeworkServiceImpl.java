package com.ck.quiz.homework.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.homework.dto.HomeworkCreateDto;
import com.ck.quiz.homework.dto.HomeworkDto;
import com.ck.quiz.homework.dto.HomeworkQueryDto;
import com.ck.quiz.homework.dto.HomeworkUpdateDto;
import com.ck.quiz.homework.entity.Homework;
import com.ck.quiz.homework.repository.HomeworkRepository;
import com.ck.quiz.homework.service.HomeworkService;
import com.ck.quiz.todo.dto.TodoCreateDto;
import com.ck.quiz.todo.entity.Todo;
import com.ck.quiz.todo.service.TodoService;
import com.ck.quiz.utils.JdbcQueryHelper;
import com.ck.quiz.llmmodel.service.LLMModelService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
public class HomeworkServiceImpl extends
        BaseServiceImpl<HomeworkCreateDto, HomeworkUpdateDto, HomeworkQueryDto, HomeworkDto, Homework, HomeworkRepository>
        implements HomeworkService {

    @Autowired
    private HomeworkRepository homeworkRepository;

    @Autowired
    private TodoService todoService;

    @Autowired
    private LLMModelService llmModelService;

    @Override
    public HomeworkDto create(HomeworkCreateDto createDto) {
        if (!StringUtils.hasText(createDto.getTitle())) {
            // Auto generate title if empty
            createDto.setTitle("作业-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
        }
        if (createDto.getStatus() == null) {
            createDto.setStatus(Homework.Status.NOT_STARTED);
        }
        return super.create(createDto);
    }

    @Override
    public Page<HomeworkDto> search(String userId, HomeworkQueryDto queryDto) {
        StringBuilder sql = new StringBuilder("SELECT h.* FROM homework h WHERE 1=1 ");
        StringBuilder countSql = new StringBuilder("SELECT COUNT(1) FROM homework h WHERE 1=1 ");
        Map<String, Object> params = new HashMap<>();

        JdbcQueryHelper.lowerLike("titleKey", queryDto.getTitle(), " AND LOWER(h.title) LIKE :titleKey ", params,
                namedParameterJdbcTemplate, sql, countSql);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            JdbcQueryHelper.equals("createUser", authentication.getName(), " AND h.create_user = :createUser ", params,
                    sql, countSql);
        }

        JdbcQueryHelper.order("h.create_date", "desc", sql);

        String pageSql = JdbcQueryHelper.getLimitSql(namedParameterJdbcTemplate, sql.toString(), queryDto.getPageNum(),
                queryDto.getPageSize());

        List<HomeworkDto> list = namedParameterJdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            Homework homework = new Homework();
            homework.setId(rs.getString("id"));
            homework.setTitle(rs.getString("title"));
            homework.setContent(rs.getString("content"));
            homework.setStatus(rs.getString("status") != null ? Homework.Status.valueOf(rs.getString("status")) : null);
            homework.setCreateDate(
                    rs.getTimestamp("create_date") != null ? rs.getTimestamp("create_date").toLocalDateTime() : null);
            homework.setCreateUser(rs.getString("create_user"));
            homework.setUpdateDate(
                    rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime() : null);
            homework.setUpdateUser(rs.getString("update_user"));
            return convertToDto(homework, true);
        });

        return (Page<HomeworkDto>) JdbcQueryHelper.toPage(namedParameterJdbcTemplate, countSql.toString(), params, list,
                queryDto.getPageNum(), queryDto.getPageSize());
    }

    @Override
    protected HomeworkDto newDto() {
        return new HomeworkDto();
    }

    @Override
    protected Homework newModel() {
        return new Homework();
    }

    @Override
    public String generateTodos(String homeworkId) {
        Optional<Homework> optionalHomework = homeworkRepository.findById(homeworkId);
        if (optionalHomework.isEmpty()) {
            throw new RuntimeException("作业不存在");
        }
        Homework homework = optionalHomework.get();
        String content = homework.getContent();
        if (!StringUtils.hasText(content)) {
            return "作业内容为空，无法生成待办";
        }

        try {
            OpenAiChatModel chatModel = llmModelService.getChatModel(null);
            ChatClient chat = ChatClient.builder(chatModel).build();

            String prompt = "你是一个任务提取助手。请从以下作业内容中提取具体的待办任务（任务标题和任务描述）。\n" +
                    "请将提取结果严格以JSON数组的格式返回，每个元素包含 'title' 和 'descr' 两个字段。\n" +
                    "例如：[{\"title\":\"任务1\",\"descr\":\"描述1\"}]\n" +
                    "不要输出任何其他文本或markdown标记。\n\n" +
                    "作业内容：\n" + content;

            String resultText = chat.prompt()
                    .user(prompt)
                    .call()
                    .content();

            // 如果包含markdown的 ```json ... ```，替换掉
            if (resultText != null) {
                resultText = resultText.trim();
                if (resultText.startsWith("```json")) {
                    resultText = resultText.substring(7);
                } else if (resultText.startsWith("```")) {
                    resultText = resultText.substring(3);
                }
                if (resultText.endsWith("```")) {
                    resultText = resultText.substring(0, resultText.length() - 3);
                }
                resultText = resultText.trim();
            }

            ObjectMapper mapper = new ObjectMapper();
            List<Map<String, String>> tasks = mapper.readValue(resultText,
                    new TypeReference<List<Map<String, String>>>() {
                    });

            for (Map<String, String> task : tasks) {
                TodoCreateDto todoCreateDto = new TodoCreateDto();
                todoCreateDto.setTitle(task.get("title"));
                todoCreateDto.setDescr("来源作业ID: " + homeworkId + "\n\n" + task.get("descr"));
                todoCreateDto.setPriority(Todo.Priority.MEDIUM);
                todoCreateDto.setStatus(Todo.Status.SCHEDULED);
                todoCreateDto.setStartTime(LocalDateTime.now());
                todoCreateDto.setDueDate(LocalDateTime.now().plusDays(1));
                todoService.create(todoCreateDto);
            }

            return "成功基于当前内容提取了 " + tasks.size() + " 个待办项。";
        } catch (Exception e) {
            log.error("提取待办失败", e);
            throw new RuntimeException("提取待办失败: " + e.getMessage());
        }
    }
}
