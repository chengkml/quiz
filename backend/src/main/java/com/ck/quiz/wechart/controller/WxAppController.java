package com.ck.quiz.wechart.controller;

import com.ck.quiz.todo.dto.TodoDto;
import com.ck.quiz.wechart.dto.*;
import com.ck.quiz.wechart.entity.WxApp;
import com.ck.quiz.wechart.service.WxAppService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@Tag(name = "微信小程序 App", description = "小程序 App 管理接口")
@RestController
@RequestMapping("/api/wx/app")
public class WxAppController {

    @Autowired
    private WxAppService wxAppService;

    @Operation(summary = "创建小程序 App", description = "添加一个新的小程序 App 配置")
    @PostMapping("/create")
    public ResponseEntity<WxApp> create(@Valid @RequestBody WxAppCreateDto dto) {
        WxApp app = wxAppService.createWxApp(dto);
        return ResponseEntity.ok(app);
    }

    @Operation(summary = "更新小程序 App", description = "更新指定小程序 App 配置")
    @PutMapping("/update")
    public ResponseEntity<WxApp> update(@Valid @RequestBody WxAppUpdateDto dto) {
        WxApp app = wxAppService.updateWxApp(dto);
        return ResponseEntity.ok(app);
    }

    @Operation(summary = "删除小程序 App", description = "根据 appId 删除小程序 App 配置")
    @DeleteMapping("/delete/{appId}")
    public ResponseEntity<Boolean> delete(@PathVariable String appId) {
        boolean result = wxAppService.deleteWxApp(appId);
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "获取小程序 App 详情", description = "根据 appId 查询小程序 App 配置")
    @GetMapping("/{appId}")
    public ResponseEntity<WxAppDto> getById(@PathVariable String appId) {
        Optional<WxAppDto> optional = wxAppService.getWxAppById(appId);
        return optional.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Operation(summary = "分页查询小程序 App", description = "分页获取小程序 App 列表")
    @PostMapping("/search")
    public ResponseEntity<Page<WxAppDto>> search(@Valid @RequestBody WxAppQueryDto queryDto) {
        Page<WxAppDto> page = wxAppService.searchTodos(queryDto);
        return ResponseEntity.ok(page);
    }

    @Operation(summary = "获取已登录用户列表", description = "根据 appId 查询小程序已绑定或已登录的用户列表")
    @GetMapping("/{appId}/users")
    public ResponseEntity<List<WxAppUserDto>> listLoginUsers(@PathVariable String appId) {
        List<WxAppUserDto> list = wxAppService.listLoginUsers(appId);
        return ResponseEntity.ok(list);
    }

}
