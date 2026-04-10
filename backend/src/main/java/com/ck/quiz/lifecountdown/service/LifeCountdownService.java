package com.ck.quiz.lifecountdown.service;

import com.ck.quiz.lifecountdown.dto.LifeCountdownGenerateWarningDto;
import com.ck.quiz.lifecountdown.dto.LifeCountdownProfileDto;
import com.ck.quiz.lifecountdown.dto.LifeCountdownSaveDto;
import com.ck.quiz.lifecountdown.dto.LifeCountdownWarningDto;

public interface LifeCountdownService {

    LifeCountdownProfileDto getCurrentProfile(String userId);

    LifeCountdownProfileDto saveProfile(String userId, LifeCountdownSaveDto dto);

    LifeCountdownWarningDto generateTodayWarning(String userId, LifeCountdownGenerateWarningDto dto);
}
