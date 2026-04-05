package com.ck.quiz.baidupan.controller;

import com.ck.quiz.baidupan.dto.BaiduPanAuthStatusDto;
import com.ck.quiz.baidupan.exception.BaiduPanException;
import com.ck.quiz.baidupan.service.BaiduPanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/open/baidu-pan/auth")
@RequiredArgsConstructor
public class BaiduPanOpenController {

    private final BaiduPanService baiduPanService;

    @GetMapping(value = "/callback", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> callback(@RequestParam(value = "state", required = false) String state,
                                           @RequestParam(value = "code", required = false) String code) {
        try {
            BaiduPanAuthStatusDto status = baiduPanService.completeAuthorization(state, code);
            return ResponseEntity.ok(buildHtml(
                    "#00b42a",
                    "已绑定",
                    "百度网盘授权完成",
                    status.getMessage() == null ? status.getAuthTip() : status.getMessage(),
                    status.getAccountName() == null ? "未绑定" : status.getAccountName()
            ));
        } catch (BaiduPanException e) {
            return ResponseEntity.status(e.getStatus()).body(buildHtml(
                    "#f53f3f",
                    "未接通",
                    "百度网盘真实 OAuth 尚未接入",
                    e.getMessage(),
                    "未绑定"
            ));
        }
    }

    private String buildHtml(String badgeColor, String badgeText, String title, String message, String accountName) {
        return """
                <!doctype html>
                <html lang=\"zh-CN\">
                <head>
                  <meta charset=\"UTF-8\" />
                  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
                  <title>百度网盘授权结果</title>
                  <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f7fa; margin: 0; padding: 40px; color: #1d2129; }
                    .card { max-width: 720px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 12px 40px rgba(15, 35, 95, .08); }
                    .badge { display: inline-block; padding: 6px 12px; border-radius: 999px; background: %s; color: #fff; font-size: 14px; }
                    h1 { margin: 16px 0 12px; font-size: 28px; }
                    p { line-height: 1.8; color: #4e5969; }
                    code { background: #f2f3f5; padding: 2px 6px; border-radius: 6px; }
                  </style>
                </head>
                <body>
                  <div class=\"card\">
                    <span class=\"badge\">%s</span>
                    <h1>%s</h1>
                    <p>%s</p>
                    <p>当前账号：<code>%s</code></p>
                    <p>说明：当前只保留百度网盘开放平台回调位点；真实接入时，应在这里完成 code -> token 换取、token 持久化与绑定状态更新。</p>
                    <p>请返回 quiz 的“百度网盘”页面查看未接入提示与所需配置项。</p>
                  </div>
                </body>
                </html>
                """.formatted(badgeColor, badgeText, title, message, accountName);
    }
}
