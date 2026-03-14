package com.ck.quiz.question.service;

import com.ck.quiz.question.dto.QuestionCreateDto;
import com.ck.quiz.question.dto.QuestionDto;
import com.ck.quiz.question.dto.QuestionQueryDto;
import com.ck.quiz.question.dto.QuestionUpdateDto;
import com.ck.quiz.question.entity.Question;
import org.springframework.data.domain.Page;
import reactor.core.publisher.Flux;

import java.util.List;

/**
 * 题目管理服务接口
 */
public interface QuestionService {

    QuestionDto createQuestion(QuestionCreateDto questionCreateDto);

    QuestionDto updateQuestion(QuestionUpdateDto questionUpdateDto);

    QuestionDto deleteQuestion(String questionId);

    QuestionDto getQuestionById(String questionId);

    Page<QuestionDto> searchQuestions(QuestionQueryDto queryDto);

    QuestionDto convertToDto(Question question);

    List<QuestionCreateDto> generateQuestions(String knowledgeDescr, int num, String modelName);

    Flux<String> streamGenerateQuestions(String knowledgeDescr, String knowledgeTitle, String knowledgeContent, int num,
            String modelName);

    List<QuestionDto> createQuestions(List<QuestionCreateDto> questionCreateDtos);

    void associateKnowledge(String questionId, List<String> knowledgeIds);

    void disassociateKnowledge(String questionId, List<String> knowledgeIds);

    List<com.ck.quiz.knowledge.dto.KnowledgeDto> getQuestionKnowledge(String questionId);
}
