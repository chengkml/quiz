package com.ck.quiz.hotsearch.collector;

import com.ck.quiz.hotsearch.dto.HotSearchSourceItem;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
public class ToutiaoHotSearchCollector implements HotSearchCollector {

    private static final String SOURCE = "TOUTIAO";
    private static final String API_URL = "https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc";

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public ToutiaoHotSearchCollector() {
        this.webClient = WebClient.builder()
                .defaultHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                .build();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public String source() {
        return SOURCE;
    }

    @Override
    public List<HotSearchSourceItem> collect() {
        String body = webClient.get()
                .uri(API_URL)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        if (body == null || body.isBlank()) {
            throw new IllegalStateException("头条热搜接口返回为空");
        }

        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode data = root.path("data");
            List<HotSearchSourceItem> result = new ArrayList<>();
            if (!data.isArray()) {
                log.warn("头条热搜响应 data 非数组: {}", body.length() > 200 ? body.substring(0, 200) : body);
                return result;
            }

            for (int i = 0; i < data.size(); i++) {
                JsonNode item = data.get(i);
                HotSearchSourceItem dto = new HotSearchSourceItem();
                dto.setExternalId(text(item, "ClusterIdStr"));
                dto.setTitle(text(item, "Title"));
                dto.setUrl(text(item, "Url"));
                dto.setHotValue(text(item, "HotValue"));
                dto.setRankIndex(i + 1);
                dto.setDetailMarkdown(buildMarkdown(item, i + 1));
                dto.setExtraJson(item.toString());

                if (dto.getTitle() == null || dto.getTitle().isBlank()) {
                    continue;
                }
                result.add(dto);
            }
            return result;
        } catch (Exception e) {
            throw new RuntimeException("解析头条热搜失败: " + e.getMessage(), e);
        }
    }

    private String text(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isMissingNode() || value.isNull() ? null : value.asText();
    }

    private String buildMarkdown(JsonNode item, int rank) {
        String title = text(item, "Title");
        String url = text(item, "Url");
        String hot = text(item, "HotValue");
        String label = text(item, "Label");
        String category = text(item, "InterestCategory");

        StringBuilder md = new StringBuilder();
        md.append("# ").append(rank).append(". ").append(title == null ? "" : title).append("\n\n");
        if (url != null && !url.isBlank()) {
            md.append("- 链接: [查看原文](").append(url).append(")\n");
        }
        if (hot != null && !hot.isBlank()) {
            md.append("- 热度: ").append(hot).append("\n");
        }
        if (label != null && !label.isBlank()) {
            md.append("- 标签: ").append(label).append("\n");
        }
        if (category != null && !category.isBlank()) {
            md.append("- 分类: ").append(category).append("\n");
        }
        md.append("\n---\n");
        md.append("\n> 说明：该条内容由系统定时采集，详情字段基于来源接口实时生成。\n");
        return md.toString();
    }
}
