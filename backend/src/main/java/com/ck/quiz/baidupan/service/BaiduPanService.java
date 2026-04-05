package com.ck.quiz.baidupan.service;

import com.ck.quiz.baidupan.dto.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface BaiduPanService {

    BaiduPanAuthorizeUrlDto getAuthorizeUrl(String userId, String baseUrl);

    BaiduPanAuthStatusDto getAuthStatus(String userId);

    BaiduPanAuthStatusDto unbind(String userId);

    boolean hasPendingAuthorization(String state);

    BaiduPanAuthStatusDto completeAuthorization(String state, String code);

    List<BaiduPanFileItemDto> list(String userId, String path);

    BaiduPanFileItemDto createFolder(String userId, BaiduPanCreateFolderRequest request);

    BaiduPanFileItemDto upload(String userId, MultipartFile file, String path);

    DownloadPayload download(String userId, String path);

    BaiduPanFileItemDto rename(String userId, BaiduPanRenameRequest request);

    void delete(String userId, BaiduPanDeleteRequest request);

    void move(String userId, BaiduPanMoveRequest request);

    record DownloadPayload(String fileName, String contentType, byte[] content) {
    }
}
