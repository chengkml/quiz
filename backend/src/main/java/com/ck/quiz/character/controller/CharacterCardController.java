package com.ck.quiz.character.controller;

import com.ck.quiz.base.controller.ReviewBaseController;
import com.ck.quiz.base.service.ReviewBaseService;
import com.ck.quiz.character.dto.CharacterCardCreateDto;
import com.ck.quiz.character.dto.CharacterCardDto;
import com.ck.quiz.character.dto.CharacterCardQueryDto;
import com.ck.quiz.character.dto.CharacterCardUpdateDto;
import com.ck.quiz.character.service.CharacterCardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

/**
 * 生字卡片控制器
 */
@RestController
@RequestMapping("/api/character")
@Tag(name = "生字卡片管理", description = "生字本学习系统 API")
public class CharacterCardController extends ReviewBaseController<CharacterCardCreateDto, CharacterCardUpdateDto, CharacterCardQueryDto, CharacterCardDto> {

    @Autowired
    private CharacterCardService characterCardService;

    @Override
    protected ReviewBaseService<CharacterCardCreateDto, CharacterCardUpdateDto, CharacterCardQueryDto, CharacterCardDto, ?> getService() {
        return characterCardService;
    }

    @GetMapping(path = "/generate/stream", produces = org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "流式生成释义（SSE）", description = "根据生字调用大模型流式生成Markdown释义")
    public Flux<String> streamGenerateDefinition(
            @RequestParam("characterText") String characterText,
            @RequestParam(value = "modelName", required = false) String modelName) {
        return characterCardService.streamGenerateDefinition(characterText, modelName);
    }
}
