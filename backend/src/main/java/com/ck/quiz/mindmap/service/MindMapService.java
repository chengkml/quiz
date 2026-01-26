package com.ck.quiz.mindmap.service;

import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.mindmap.dto.*;
import com.ck.quiz.mindmap.entity.MindMap;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

public interface MindMapService
        extends BaseService<MindMapCreateDto, MindMapUpdateDto, MindMapQueryDto, MindMapDto, MindMap> {

    MindMapDto updateMindMapBasicInfo(MindMapBasicInfoUpdateDto mindMapBasicInfoUpdateDto);

    MindMapDto updateMindMapData(MindMapDataUpdateDto mindMapDataUpdateDto);

    SseEmitter streamGenerateMindMap(String descr);

}