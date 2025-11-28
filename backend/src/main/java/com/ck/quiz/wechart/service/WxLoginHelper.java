package com.ck.quiz.wechart.service;

import com.ck.quiz.wechart.entity.WxApp;
import com.ck.quiz.wechart.repository.WxAppRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Optional;

/**
 * 微信小程序登录工具类
 * <p>
 * 提供根据 code 获取 openid 和 session_key 的方法
 * secret 从后端数据库 wx_app 表获取，不暴露给前端
 */
@Component
public class WxLoginHelper {

    private static final String WX_CODE2SESSION_URL = "https://api.weixin.qq.com/sns/jscode2session";
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final RestTemplate restTemplate = new RestTemplate();

    private final WxAppRepository wxAppRepository;

    public WxLoginHelper(WxAppRepository wxAppRepository) {
        this.wxAppRepository = wxAppRepository;
    }

    /**
     * 根据 appid 和 code 获取 openid
     *
     * @param appid 小程序 AppId
     * @param code  前端传来的 code
     * @return openid，如果失败返回 null
     */
    public String getOpenIdByCode(String appid, String code) {
        JsonNode result = getOpenIdAndSessionKey(appid, code);
        return result != null && result.has("openid") ? result.get("openid").asText() : null;
    }

    /**
     * 根据 appid 和 code 获取 openid + session_key
     *
     * @param appid 小程序 AppId
     * @param code  前端传来的 code
     * @return JsonNode 包含 openid 和 session_key，如果失败返回 null
     */
    public JsonNode getOpenIdAndSessionKey(String appid, String code) {
        try {
            // 1. 根据 appid 从数据库获取 appSecret
            Optional<WxApp> appOpt = wxAppRepository.findByAppid(appid);
            if (!appOpt.isPresent()) {
                throw new RuntimeException("未找到对应的 WxApp 配置: " + appid);
            }
            String secret = appOpt.get().getAppSecret();

            // 2. 调用微信接口
            String url = UriComponentsBuilder.fromHttpUrl(WX_CODE2SESSION_URL)
                    .queryParam("appid", appid)
                    .queryParam("secret", secret)
                    .queryParam("js_code", code)
                    .queryParam("grant_type", "authorization_code")
                    .toUriString();

            String response = restTemplate.getForObject(url, String.class);
            JsonNode jsonNode = objectMapper.readTree(response);

            if (jsonNode.has("errcode")) {
                System.err.println("WxLoginHelper error: " + jsonNode.toString());
                return null;
            }

            return jsonNode;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
