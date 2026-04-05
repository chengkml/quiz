package com.ck.quiz.baidupan.controller;

import com.ck.quiz.baidupan.dto.*;
import com.ck.quiz.baidupan.service.BaiduPanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Tag(name = "百度网盘", description = "百度网盘接入骨架接口")
@RestController
@RequestMapping("/api/baidu-pan")
@RequiredArgsConstructor
public class BaiduPanController {

    private final BaiduPanService baiduPanService;

    @Operation(summary = "获取授权链接")
    @PostMapping("/auth/authorize-url")
    public ResponseEntity<BaiduPanAuthorizeUrlDto> getAuthorizeUrl(Authentication authentication,
                                                                   HttpServletRequest request) {
        return ResponseEntity.ok(baiduPanService.getAuthorizeUrl(authentication.getName(), resolveBaseUrl(request)));
    }

    @Operation(summary = "获取绑定状态")
    @GetMapping("/auth/status")
    public ResponseEntity<BaiduPanAuthStatusDto> getAuthStatus(Authentication authentication) {
        return ResponseEntity.ok(baiduPanService.getAuthStatus(authentication.getName()));
    }

    @Operation(summary = "解绑百度网盘")
    @PostMapping("/auth/unbind")
    public ResponseEntity<BaiduPanAuthStatusDto> unbind(Authentication authentication) {
        return ResponseEntity.ok(baiduPanService.unbind(authentication.getName()));
    }

    @Operation(summary = "列目录")
    @GetMapping("/files")
    public ResponseEntity<List<BaiduPanFileItemDto>> list(Authentication authentication,
                                                          @RequestParam(value = "path", required = false) String path) {
        return ResponseEntity.ok(baiduPanService.list(authentication.getName(), path));
    }

    @Operation(summary = "上传文件")
    @PostMapping(value = "/files/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BaiduPanFileItemDto> upload(Authentication authentication,
                                                      @RequestParam("file") MultipartFile file,
                                                      @RequestParam(value = "path", required = false) String path) {
        return ResponseEntity.ok(baiduPanService.upload(authentication.getName(), file, path));
    }

    @Operation(summary = "下载文件")
    @GetMapping("/files/download")
    public ResponseEntity<ByteArrayResource> download(Authentication authentication,
                                                      @RequestParam("path") String path) {
        BaiduPanService.DownloadPayload payload = baiduPanService.download(authentication.getName(), path);
        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(payload.contentType());
        } catch (Exception ex) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }
        String fileName = URLEncoder.encode(payload.fileName(), StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(mediaType)
                .contentLength(payload.content().length)
                .body(new ByteArrayResource(payload.content()));
    }

    @Operation(summary = "新建文件夹")
    @PostMapping("/files/folder")
    public ResponseEntity<BaiduPanFileItemDto> createFolder(Authentication authentication,
                                                            @Valid @RequestBody BaiduPanCreateFolderRequest request) {
        return ResponseEntity.ok(baiduPanService.createFolder(authentication.getName(), request));
    }

    @Operation(summary = "重命名")
    @PutMapping("/files/rename")
    public ResponseEntity<BaiduPanFileItemDto> rename(Authentication authentication,
                                                      @Valid @RequestBody BaiduPanRenameRequest request) {
        return ResponseEntity.ok(baiduPanService.rename(authentication.getName(), request));
    }

    @Operation(summary = "删除")
    @PostMapping("/files/delete")
    public ResponseEntity<Void> delete(Authentication authentication,
                                       @Valid @RequestBody BaiduPanDeleteRequest request) {
        baiduPanService.delete(authentication.getName(), request);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "移动")
    @PostMapping("/files/move")
    public ResponseEntity<Void> move(Authentication authentication,
                                     @Valid @RequestBody BaiduPanMoveRequest request) {
        baiduPanService.move(authentication.getName(), request);
        return ResponseEntity.ok().build();
    }

    private String resolveBaseUrl(HttpServletRequest request) {
        String contextPath = request.getContextPath() == null ? "" : request.getContextPath();
        return request.getScheme() + "://" + request.getServerName() +
                ((request.getServerPort() == 80 || request.getServerPort() == 443) ? "" : ":" + request.getServerPort()) +
                contextPath;
    }
}
