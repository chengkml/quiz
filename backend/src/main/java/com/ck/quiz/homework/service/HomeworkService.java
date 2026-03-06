package com.ck.quiz.homework.service;

import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.homework.dto.HomeworkCreateDto;
import com.ck.quiz.homework.dto.HomeworkDto;
import com.ck.quiz.homework.dto.HomeworkQueryDto;
import com.ck.quiz.homework.dto.HomeworkUpdateDto;
import com.ck.quiz.homework.entity.Homework;

import java.util.List;

public interface HomeworkService
        extends BaseService<HomeworkCreateDto, HomeworkUpdateDto, HomeworkQueryDto, HomeworkDto, Homework> {

    /**
     * 根据作业内容生成待办事项
     * 
     * @param homeworkId 作业ID
     * @return 提取出的待办事项内容（或直接保存后的提示）
     */
    String generateTodos(String homeworkId);
}
