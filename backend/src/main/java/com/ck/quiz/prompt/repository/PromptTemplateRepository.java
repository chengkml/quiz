package com.ck.quiz.prompt.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.prompt.entity.PromptTemplate;

public interface PromptTemplateRepository extends BaseRepository<PromptTemplate> {

    PromptTemplate findByName(String name);
}