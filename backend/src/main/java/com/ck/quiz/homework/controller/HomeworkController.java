package com.ck.quiz.homework.controller;

import com.ck.quiz.base.controller.BaseController;
import org.springframework.http.ResponseEntity;
import com.ck.quiz.homework.dto.HomeworkCreateDto;
import com.ck.quiz.homework.dto.HomeworkDto;
import com.ck.quiz.homework.dto.HomeworkQueryDto;
import com.ck.quiz.homework.dto.HomeworkUpdateDto;
import com.ck.quiz.homework.entity.Homework;
import com.ck.quiz.homework.service.HomeworkService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/homework", "/homework"})
public class HomeworkController
        extends BaseController<HomeworkCreateDto, HomeworkUpdateDto, HomeworkQueryDto, HomeworkDto> {

    @Autowired
    private HomeworkService homeworkService;

    @Override
    protected com.ck.quiz.base.service.BaseService<HomeworkCreateDto, HomeworkUpdateDto, HomeworkQueryDto, HomeworkDto, ?> getService() {
        return homeworkService;
    }

    @PostMapping("/{id}/generate-todos")
    public ResponseEntity<String> generateTodos(@PathVariable String id) {
        String result = homeworkService.generateTodos(id);
        return ResponseEntity.ok(result);
    }
}
