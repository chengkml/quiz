package com.ck.quiz.cron.exec;

import org.apache.commons.collections4.MapUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.ck.quiz.notification.service.NotificationChannelType;
import com.ck.quiz.notification.service.NotificationDispatcher;
import com.ck.quiz.notification.service.NotificationMessage;

import java.util.Map;

@Component
public class NotificationJob extends AbstractJob {

    @Autowired
    private NotificationDispatcher dispatcher;

    @Override
    public String getJobPreffix() {
        return "Notification";
    }

    @Override
    public String getJobLabel() {
        return "发送通知";
    }

    @Override
    public void run(Map<String, Object> params) {
        log.info("NotificationJob 开始执行，参数: {}", params);

        try {
            String channelTypeStr = MapUtils.getString(params, "channelType");
            String to = MapUtils.getString(params, "to");
            String title = MapUtils.getString(params, "title");
            String content = MapUtils.getString(params, "content");
            String type = MapUtils.getString(params, "type");
            String senderId = MapUtils.getString(params, "senderId");

            log.debug("解析参数 -> channelType: {}, to: {}, title: {}, content: {}",
                    channelTypeStr, to, title, content);

            NotificationChannelType channelType = NotificationChannelType.valueOf(channelTypeStr);
            NotificationMessage message = NotificationMessage.builder()
                    .to(to)
                    .title(title)
                    .content(content)
                    .channelType(channelType)
                    .type(type)
                    .senderId(senderId)
                    .build();

            dispatcher.dispatch(message);
            log.info("通知发送成功 -> to: {}, channelType: {}", to, channelType);
        } catch (Exception e) {
            log.error("NotificationJob 执行失败", e);
        }
    }

    @Override
    public Map<String, Object> getParamDef() {
        return Map.of(
            "channelType", Map.of(
                "label", "渠道类型",
                "type", "string",
                "required", true,
                "placeholder", "请输入渠道类型，如 EMAIL/SMS/BROWSER"
            ),
            "to", Map.of(
                "label", "接收人",
                "type", "string",
                "required", true,
                "placeholder", "请输入接收人标识，如用户ID或地址"
            ),
            "title", Map.of(
                "label", "标题",
                "type", "string",
                "required", false,
                "placeholder", "请输入通知标题"
            ),
            "content", Map.of(
                "label", "内容",
                "type", "string",
                "required", true,
                "placeholder", "请输入通知内容"
            ),
            "type", Map.of(
                "label", "消息类型",
                "type", "string",
                "required", false,
                "placeholder", "可选：INFO/WARNING/ERROR/SUCCESS"
            ),
            "senderId", Map.of(
                "label", "发送人ID",
                "type", "string",
                "required", false,
                "placeholder", "可选，填写发送人标识"
            )
        );
    }
}
