package com.ck.quiz.utils;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.core.io.ClassPathResource;
import org.springframework.util.FileCopyUtils;

import com.vladsch.flexmark.ast.*;
import com.vladsch.flexmark.parser.Parser;
import com.vladsch.flexmark.util.ast.Node;
import com.vladsch.flexmark.util.data.MutableDataSet;

import lombok.Data;

public class MdTemplateHelper {

    /**
     * 块项 - 表示一个markdown块（用---分隔）
     */
    @Data
    private class BlockItem {
        /** 块的关键字标识 */
        private String blockKey;
        /** 该块包含的所有行项 */
        private List<LineItem> lines;
    }

    /**
     * 行项 - 表示markdown中的一行内容（标题、段落、列表项等）
     */
    @Data
    private class LineItem {
        /** 行的级别标识（如#、##表示标题级别，-表示列表符号） */
        private String level;
        /** 行的类型：text（纯文本）或tpl（模板） */
        private String type;
        /** 行的内容（如果是模板则为{{}}内的内容） */
        private String content;
        /** 行的关键字（从模板中点号分隔后的第二部分） */
        private String lineKey;
        /** 模板前的前缀文本 */
        private String preffix;
    }

    public Map<String, List<Map<String, Object>>> resolveMdContent(String mdContent, List<BlockItem> tplBlocks) {
        Map<String, List<Map<String, Object>>> result = new java.util.HashMap<>();
        for (BlockItem block : tplBlocks) {
            List<Map<String, Object>> resolved = resolveBlock(mdContent, block);
            result.put(block.getBlockKey(), resolved);
        }
        return result;
    }

    public Map<String, List<Map<String, Object>>> resolveMdContent(String mdContent) {
        ClassPathResource resource = new ClassPathResource("templates/md_extract.md");
        String mdTpl = "";
        try (InputStream is = resource.getInputStream();
                Reader reader = new InputStreamReader(is, java.nio.charset.StandardCharsets.UTF_8)) {
            mdTpl = FileCopyUtils.copyToString(reader);
        } catch (Exception e) {
            throw new RuntimeException("无法读取Markdown模板文件", e);
        }
        return resolveMdContent(mdContent, mdTpl);
    }

    public Map<String, List<Map<String, Object>>> resolveMdContent(String mdContent, String mdTpl) {
        List<BlockItem> tplBlocks = readTpl(mdTpl);
        return resolveMdContent(mdContent, tplBlocks);
    }

    private List<Map<String, Object>> resolveBlock(String mdContent, BlockItem block) {
        List<Map<String, Object>> result = new ArrayList<>();

        // 解析实际的 Markdown 内容
        MutableDataSet options = new MutableDataSet();
        Parser parser = Parser.builder(options).build();
        Node document = parser.parse(mdContent);

        // 将文档转换为行列表（类似于模板处理）
        List<ParsedLine> contentLines = parseDocumentToLines(document);

        // 将模板块的行项转换为匹配模式
        List<LinePattern> patterns = buildPatterns(block.getLines());

        // 遍历内容行，查找匹配的块
        for (int i = 0; i <= contentLines.size() - patterns.size(); i++) {
            Map<String, Object> matchedData = tryMatchBlock(contentLines, i, patterns);
            if (matchedData != null && !matchedData.isEmpty()) {
                result.add(matchedData);
                // 跳过已匹配的行
                i += patterns.size() - 1;
            }
        }

        return result;
    }

    /**
     * 解析后的行
     */
    private static class ParsedLine {
        String level;
        String text;
    }

    /**
     * 将文档解析为行列表
     */
    private List<ParsedLine> parseDocumentToLines(Node document) {
        List<ParsedLine> lines = new ArrayList<>();

        for (Node node : document.getChildren()) {
            if (node instanceof Heading) {
                Heading heading = (Heading) node;
                ParsedLine line = new ParsedLine();
                line.level = "#".repeat(heading.getLevel());
                line.text = heading.getText().toString();
                lines.add(line);
            } else if (node instanceof BulletList) {
                parseBulletListToLines((BulletList) node, lines);
            } else if (node instanceof Paragraph) {
                ParsedLine line = new ParsedLine();
                line.level = "";
                line.text = ((Paragraph) node).getContentChars().toString().trim();
                if (!line.text.isEmpty()) {
                    lines.add(line);
                }
            }
        }

        return lines;
    }

    /**
     * 解析列表为行列表
     */
    private void parseBulletListToLines(BulletList list, List<ParsedLine> result) {
        for (Node item : list.getChildren()) {
            if (item instanceof BulletListItem) {
                BulletListItem listItem = (BulletListItem) item;
                String level = String.valueOf(listItem.getOpeningMarker().charAt(0));

                for (Node child : listItem.getChildren()) {
                    if (child instanceof Paragraph) {
                        // 处理段落中的多行（用SoftLineBreak分隔）
                        List<String> textLines = extractLinesFromParagraph((Paragraph) child);
                        for (String textLine : textLines) {
                            if (!textLine.trim().isEmpty()) {
                                ParsedLine line = new ParsedLine();
                                line.level = level;
                                line.text = textLine.trim();
                                result.add(line);
                            }
                        }
                    } else if (child instanceof BulletList) {
                        // 递归处理嵌套列表
                        parseBulletListToLines((BulletList) child, result);
                    }
                }
            }
        }
    }

    /**
     * 将模板行项转换为匹配模式
     */
    private List<LinePattern> buildPatterns(List<LineItem> lineItems) {
        List<LinePattern> patterns = new ArrayList<>();
        for (LineItem line : lineItems) {
            LinePattern pattern = new LinePattern();
            pattern.level = line.getLevel();
            pattern.type = line.getType();
            pattern.lineKey = line.getLineKey();
            pattern.preffix = line.getPreffix();
            pattern.content = line.getContent();
            patterns.add(pattern);
        }
        return patterns;
    }

    /**
     * 尝试从指定位置匹配一个完整的块
     */
    private Map<String, Object> tryMatchBlock(List<ParsedLine> lines, int startIndex, List<LinePattern> patterns) {
        Map<String, Object> data = new java.util.HashMap<>();

        int lineIndex = startIndex;
        for (LinePattern pattern : patterns) {
            if (lineIndex >= lines.size()) {
                return null; // 行不足，匹配失败
            }

            ParsedLine line = lines.get(lineIndex);

            // 检查级别是否匹配
            if (!pattern.level.isEmpty() && !pattern.level.equals(line.level)) {
                return null;
            }

            // 如果是模板类型，提取数据
            if ("tpl".equals(pattern.type)) {
                // 检查前缀是否匹配
                if (pattern.preffix != null && !pattern.preffix.isEmpty()) {
                    if (!line.text.startsWith(pattern.preffix)) {
                        return null;
                    }
                    // 提取前缀后的内容
                    String value = line.text.substring(pattern.preffix.length()).trim();
                    data.put(pattern.lineKey, value);
                } else {
                    // 没有前缀，整个内容都是值
                    data.put(pattern.lineKey, line.text);
                }
            } else if ("text".equals(pattern.type)) {
                // 纯文本类型，需要精确匹配
                if (!line.text.equals(pattern.content)) {
                    return null;
                }
            }

            lineIndex++;
        }

        return data;
    }

    /**
     * 行匹配模式
     */
    private static class LinePattern {
        String level;
        String type;
        String lineKey;
        String preffix;
        String content;
    }

    public List<BlockItem> readTpl(String mdTpl) {
        // 按 --- 分割 block
        String[] blocks = mdTpl.split("---\\r?\\n");
        List<BlockItem> blockItemList = new ArrayList<>();

        MutableDataSet options = new MutableDataSet();
        Parser parser = Parser.builder(options).build();

        for (String block : blocks) {
            if (block.trim().isEmpty())
                continue;

            BlockItem blockItem = new BlockItem();
            List<LineItem> lineItems = new ArrayList<>();
            String blockKey = null;

            Node document = parser.parse(block);
            for (Node node : document.getChildren()) {
                List<LineItem> nodeLines = processNode(node);

                // 合并结果并更新blockKey
                for (LineItem lineItem : nodeLines) {
                    lineItems.add(lineItem);
                    if (blockKey == null && lineItem.getLineKey() != null) {
                        // 从模板内容中提取点号前面的部分作为blockKey
                        String[] parts = lineItem.getContent().split("\\.");
                        if (parts.length > 0) {
                            blockKey = parts[0];
                        }
                    }
                }
            }

            blockItem.setBlockKey(blockKey);
            blockItem.setLines(lineItems);
            blockItemList.add(blockItem);
        }
        return blockItemList;
    }

    private List<LineItem> processNode(Node node) {
        List<LineItem> result = new ArrayList<>();

        if (node instanceof Heading) {
            Heading heading = (Heading) node;
            String text = heading.getText().toString();
            String level = "#".repeat(heading.getLevel());
            LineItem lineItem = parseAndCreateLineItem(text, level);
            result.add(lineItem);

        } else if (node instanceof BulletList) {
            BulletList list = (BulletList) node;
            for (Node item : list.getChildren()) {
                if (item instanceof BulletListItem) {
                    BulletListItem listItem = (BulletListItem) item;
                    String level = String.valueOf(listItem.getOpeningMarker().charAt(0));

                    // 递归处理列表项的所有子节点
                    processNodeChildren(listItem, level, result);
                }
            }

        } else if (node instanceof Paragraph) {
            Paragraph para = (Paragraph) node;
            String text = para.getContentChars().toString().trim();
            if (!text.isEmpty()) {
                LineItem lineItem = parseAndCreateLineItem(text, "");
                result.add(lineItem);
            }
        }

        return result;
    }

    private void processNodeChildren(Node node, String level, List<LineItem> result) {
        for (Node child : node.getChildren()) {
            if (child instanceof Paragraph) {
                // 处理段落中的多行内容（用SoftLineBreak分隔）
                List<String> lines = extractLinesFromParagraph((Paragraph) child);
                for (String line : lines) {
                    if (!line.trim().isEmpty()) {
                        LineItem lineItem = parseAndCreateLineItem(line.trim(), level);
                        result.add(lineItem);
                    }
                }
            } else if (child instanceof BulletList) {
                // 处理嵌套列表
                BulletList nestedList = (BulletList) child;
                for (Node nestedItem : nestedList.getChildren()) {
                    if (nestedItem instanceof BulletListItem) {
                        BulletListItem nestedListItem = (BulletListItem) nestedItem;
                        String nestedLevel = String.valueOf(nestedListItem.getOpeningMarker().charAt(0));
                        processNodeChildren(nestedListItem, nestedLevel, result);
                    }
                }
            }
        }
    }

    private List<String> extractLinesFromParagraph(Paragraph paragraph) {
        List<String> lines = new ArrayList<>();
        StringBuilder currentLine = new StringBuilder();

        for (Node child : paragraph.getChildren()) {
            if (child instanceof Text) {
                currentLine.append(child.getChars());
            } else if (child instanceof SoftLineBreak || child instanceof HardLineBreak) {
                String line = currentLine.toString().trim();
                if (!line.isEmpty()) {
                    lines.add(line);
                }
                currentLine = new StringBuilder();
            }
        }

        // 添加最后一行
        String line = currentLine.toString().trim();
        if (!line.isEmpty()) {
            lines.add(line);
        }

        return lines;
    }

    private LineItem parseAndCreateLineItem(String text, String level) {
        LineItem lineItem = new LineItem();
        lineItem.setLevel(level);

        // 判断是否有模板语法
        int tplStart = text.indexOf("{{");
        int tplEnd = text.indexOf("}}", tplStart);

        if (tplStart >= 0 && tplEnd > tplStart) {
            lineItem.setType("tpl");
            lineItem.setPreffix(text.substring(0, tplStart).trim());
            String tplContent = text.substring(tplStart + 2, tplEnd).trim();
            lineItem.setContent(tplContent);

            // 点号分隔内容
            String[] keys = tplContent.split("\\.");
            if (keys.length == 2) {
                lineItem.setLineKey(keys[1]);
            }
        } else {
            lineItem.setType("text");
            lineItem.setContent(text);
        }

        return lineItem;
    }
}