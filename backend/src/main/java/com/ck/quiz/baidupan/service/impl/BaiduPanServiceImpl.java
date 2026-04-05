package com.ck.quiz.baidupan.service.impl;

import com.ck.quiz.baidupan.dto.*;
import com.ck.quiz.baidupan.exception.BaiduPanException;
import com.ck.quiz.baidupan.service.BaiduPanService;
import com.ck.quiz.config.dto.SystemParamDto;
import com.ck.quiz.config.service.SystemParamService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BaiduPanServiceImpl implements BaiduPanService {

    public static final String PARAM_CLIENT_ID = "quiz.baidu-pan.client_id";
    public static final String PARAM_CLIENT_SECRET = "quiz.baidu-pan.client_secret";
    public static final String PARAM_REDIRECT_URI = "quiz.baidu-pan.redirect_uri";

    private static final String CALLBACK_PATH = "/open/baidu-pan/auth/callback";
    private static final String CONFIG_ROUTE = "/frame/systemparam";
    private static final String CONFIG_CATEGORY = "百度网盘配置";
    private static final String PROVIDER_NAME = "百度网盘";
    private static final List<String> REQUIRED_CONFIG_KEYS = List.of(
            PARAM_CLIENT_ID,
            PARAM_CLIENT_SECRET,
            PARAM_REDIRECT_URI
    );
    private static final String NOT_CONNECTED_MESSAGE = "百度网盘真实接口尚未接通，当前仅保留页面、路由、接口骨架、system param 配置与 OAuth 回调位点，不提供任何 mock 数据";

    private final SystemParamService systemParamService;

    @Override
    public BaiduPanAuthorizeUrlDto getAuthorizeUrl(String userId, String baseUrl) {
        BaiduPanConfigSnapshot config = loadConfig();
        if (!config.missingKeys().isEmpty()) {
            throw BaiduPanException.badRequest(
                    "BAIDU_PAN_MISSING_CONFIG",
                    "未配置百度网盘开放平台参数：" + String.join(" / ", config.missingKeys()) + "；请前往系统参数管理（/frame/systemparam）补齐"
            );
        }
        throw BaiduPanException.serviceUnavailable(
                "BAIDU_PAN_OAUTH_NOT_CONNECTED",
                "百度网盘开放平台参数已配置，但真实 OAuth 授权 URL 生成逻辑尚未接入，当前不能发起授权"
        );
    }

    @Override
    public BaiduPanAuthStatusDto getAuthStatus(String userId) {
        BaiduPanConfigSnapshot config = loadConfig();
        boolean configured = config.missingKeys().isEmpty();
        String message = configured
                ? "已配置百度网盘开放平台基础参数，但真实 OAuth 与文件接口尚未接通"
                : "暂未接入真实百度网盘开放平台，缺少参数：" + String.join(" / ", config.missingKeys());
        String authTip = configured
                ? NOT_CONNECTED_MESSAGE
                : "请前往系统参数管理（/frame/systemparam）配置百度网盘参数后，再继续真实接入";

        return BaiduPanAuthStatusDto.builder()
                .configured(configured)
                .bound(false)
                .mockMode(false)
                .providerName(PROVIDER_NAME)
                .message(message)
                .authTip(authTip)
                .callbackPath(CALLBACK_PATH)
                .authorizeUrl(null)
                .configRoute(CONFIG_ROUTE)
                .configCategory(CONFIG_CATEGORY)
                .requiredConfigKeys(REQUIRED_CONFIG_KEYS)
                .missingConfigKeys(config.missingKeys())
                .build();
    }

    @Override
    public BaiduPanAuthStatusDto unbind(String userId) {
        return getAuthStatus(userId);
    }

    @Override
    public boolean hasPendingAuthorization(String state) {
        return false;
    }

    @Override
    public BaiduPanAuthStatusDto completeAuthorization(String state, String code) {
        throw BaiduPanException.serviceUnavailable(
                "BAIDU_PAN_OAUTH_NOT_IMPLEMENTED",
                "百度网盘 OAuth 回调位点已保留，但真实 code -> token 换取、token 持久化与绑定状态更新尚未接入，当前不能完成绑定"
        );
    }

    @Override
    public List<BaiduPanFileItemDto> list(String userId, String path) {
        throw notConnected("当前未接入真实百度网盘文件列表接口，无法读取目录");
    }

    @Override
    public BaiduPanFileItemDto createFolder(String userId, BaiduPanCreateFolderRequest request) {
        throw notConnected("当前未接入真实百度网盘新建文件夹接口，无法创建目录");
    }

    @Override
    public BaiduPanFileItemDto upload(String userId, MultipartFile file, String path) {
        throw notConnected("当前未接入真实百度网盘上传接口，无法上传文件");
    }

    @Override
    public DownloadPayload download(String userId, String path) {
        throw notConnected("当前未接入真实百度网盘下载接口，无法下载文件");
    }

    @Override
    public BaiduPanFileItemDto rename(String userId, BaiduPanRenameRequest request) {
        throw notConnected("当前未接入真实百度网盘重命名接口，无法重命名文件");
    }

    @Override
    public void delete(String userId, BaiduPanDeleteRequest request) {
        throw notConnected("当前未接入真实百度网盘删除接口，无法删除文件");
    }

    @Override
    public void move(String userId, BaiduPanMoveRequest request) {
        throw notConnected("当前未接入真实百度网盘移动接口，无法移动文件");
    }

    private BaiduPanException notConnected(String message) {
        return BaiduPanException.serviceUnavailable("BAIDU_PAN_NOT_CONNECTED", message);
    }

    private BaiduPanConfigSnapshot loadConfig() {
        Map<String, String> values = new LinkedHashMap<>();
        for (String key : REQUIRED_CONFIG_KEYS) {
            values.put(key, loadParamValue(key));
        }
        List<String> missingKeys = values.entrySet().stream()
                .filter(entry -> entry.getValue() == null || entry.getValue().isBlank())
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
        return new BaiduPanConfigSnapshot(values, missingKeys);
    }

    private String loadParamValue(String key) {
        try {
            SystemParamDto dto = systemParamService.getParamByName(key);
            return dto == null ? null : dto.getParamValue();
        } catch (Exception e) {
            return null;
        }
    }

    private record BaiduPanConfigSnapshot(Map<String, String> values, List<String> missingKeys) {
    }
}
