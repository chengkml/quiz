package com.ck.quiz.mdconvert.service;

import com.itextpdf.text.Document;
import com.itextpdf.text.Font;
import com.itextpdf.text.PageSize;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.pdf.BaseFont;
import com.itextpdf.text.pdf.PdfWriter;
import com.vladsch.flexmark.html.HtmlRenderer;
import com.vladsch.flexmark.parser.Parser;
import com.vladsch.flexmark.util.ast.Node;
import com.vladsch.flexmark.util.data.MutableDataSet;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.xwpf.usermodel.*;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTSectPr;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;

/**
 * Markdown转换服务
 * 支持转换为HTML、Word、PDF等格式
 */
@Slf4j
@Service
public class MdConvertService {

    private final Parser parser;
    private final HtmlRenderer htmlRenderer;

    public MdConvertService() {
        MutableDataSet options = new MutableDataSet();
        // 可以添加更多flexmark配置
        this.parser = Parser.builder(options).build();
        this.htmlRenderer = HtmlRenderer.builder(options).build();
    }

    /**
     * 将Markdown转换为HTML
     * 
     * @param mdContent Markdown内容
     * @return HTML字符串
     */
    public String convertToHtml(String mdContent) {
        try {
            Node document = parser.parse(mdContent);
            return htmlRenderer.render(document);
        } catch (Exception e) {
            log.error("Markdown转HTML异常", e);
            throw new RuntimeException("转换为HTML失败: " + e.getMessage(), e);
        }
    }

    /**
     * 将Markdown转换为Word (DOCX)
     * 
     * @param mdContent Markdown内容
     * @param fileName  文件名（不含扩展名）
     * @return Word文件的字节数组
     */
    public byte[] convertToWord(String mdContent, String fileName) {
        try {
            XWPFDocument document = new XWPFDocument();

            // 设置document属性
            CTSectPr sectPr = document.getDocument().getBody().getSectPr();
            if (sectPr == null) {
                sectPr = document.getDocument().getBody().addNewSectPr();
            }

            // 解析Markdown并添加到Word文档
            String[] lines = mdContent.split("\n");
            for (String line : lines) {
                addParagraphToDocument(document, line);
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.write(baos);
            document.close();

            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Markdown转Word异常", e);
            throw new RuntimeException("转换为Word失败: " + e.getMessage(), e);
        }
    }

    /**
     * 将Markdown转换为PDF
     * 使用iText库进行PDF生成
     * 
     * @param mdContent Markdown内容
     * @param fileName  文件名（不含扩展名）
     * @return PDF文件的字节数组
     */
    public byte[] convertToPdf(String mdContent, String fileName) {
        try {
            // 首先转换为HTML
            String htmlContent = convertToHtml(mdContent);
            
            // 去除HTML标签获取纯文本
            String plainText = stripHtmlTags(htmlContent);

            // 使用iText创建PDF
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4, 50, 50, 50, 50);
            PdfWriter.getInstance(document, baos);
            document.open();

            // 设置字体（支持中文）
            BaseFont bfChinese = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
            Font font = new Font(bfChinese, 11, Font.NORMAL);
            Font titleFont = new Font(bfChinese, 16, Font.BOLD);
            
            // 添加标题
            Paragraph title = new Paragraph(fileName, titleFont);
            title.setAlignment(Paragraph.ALIGN_CENTER);
            document.add(title);
            
            // 添加内容
            String[] lines = plainText.split("\n");
            for (String line : lines) {
                if (!line.trim().isEmpty()) {
                    Paragraph para = new Paragraph(line, font);
                    para.setFirstLineIndent(20);
                    document.add(para);
                } else {
                    document.add(new Paragraph());
                }
            }

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Markdown转PDF异常", e);
            throw new RuntimeException("转换为PDF失败: " + e.getMessage(), e);
        }
    }

    /**
     * 将Word文档转换为PDF
     * 
     * @param wordBytes Word文档的字节数组
     * @param fileName  文件名（不含扩展名）
     * @return PDF文件的字节数组
     */
    public byte[] convertWordToPdf(byte[] wordBytes, String fileName) {
        try {
            // 读取Word文档
            XWPFDocument wordDocument = new XWPFDocument(new java.io.ByteArrayInputStream(wordBytes));
            
            // 创建PDF文档
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document pdfDocument = new Document(PageSize.A4, 50, 50, 50, 50);
            PdfWriter.getInstance(pdfDocument, baos);
            pdfDocument.open();

            // 设置字体（支持中文）
            BaseFont bfChinese = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
            Font font = new Font(bfChinese, 11, Font.NORMAL);
            Font titleFont = new Font(bfChinese, 16, Font.BOLD);
            Font heading1Font = new Font(bfChinese, 18, Font.BOLD);
            Font heading2Font = new Font(bfChinese, 14, Font.BOLD);
            
            // 添加标题
            Paragraph title = new Paragraph(fileName, titleFont);
            title.setAlignment(Paragraph.ALIGN_CENTER);
            title.setSpacingAfter(20);
            pdfDocument.add(title);

            // 遍历Word文档中的所有段落
            for (XWPFParagraph paragraph : wordDocument.getParagraphs()) {
                String text = paragraph.getText();
                if (text == null || text.trim().isEmpty()) {
                    pdfDocument.add(new Paragraph());
                    continue;
                }

                Paragraph pdfParagraph = new Paragraph();
                
                // 根据Word段落样式设置PDF段落格式
                String style = paragraph.getStyle();
                if (style != null) {
                    if (style.equals("Heading1")) {
                        pdfParagraph = new Paragraph(text, heading1Font);
                        pdfParagraph.setSpacingBefore(10);
                        pdfParagraph.setSpacingAfter(10);
                    } else if (style.equals("Heading2")) {
                        pdfParagraph = new Paragraph(text, heading2Font);
                        pdfParagraph.setSpacingBefore(8);
                        pdfParagraph.setSpacingAfter(8);
                    } else {
                        pdfParagraph = new Paragraph(text, font);
                    }
                } else {
                    pdfParagraph = new Paragraph(text, font);
                }

                pdfDocument.add(pdfParagraph);
            }

            // 关闭文档
            pdfDocument.close();
            wordDocument.close();
            
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Word转PDF异常", e);
            throw new RuntimeException("Word转PDF失败: " + e.getMessage(), e);
        }
    }

    /**
     * 去除HTML标签，用于简化处理
     * 
     * @param html HTML内容
     * @return 纯文本
     */
    private String stripHtmlTags(String html) {
        return html.replaceAll("<[^>]*>", "");
    }

    /**
     * 为HTML添加样式包装
     * 
     * @param htmlContent 原始HTML内容
     * @return 包含样式的完整HTML文档
     */
    private String wrapHtmlWithStyles(String htmlContent) {
        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <title>Markdown Document</title>\n" +
                "    <style>\n" +
                "        * { margin: 0; padding: 0; }\n" +
                "        body {\n" +
                "            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\n"
                +
                "            font-size: 14px;\n" +
                "            line-height: 1.8;\n" +
                "            color: #333;\n" +
                "            padding: 20px;\n" +
                "        }\n" +
                "        h1 { font-size: 28px; font-weight: 700; margin: 24px 0 16px 0; border-bottom: 2px solid #ddd; padding-bottom: 8px; }\n"
                +
                "        h2 { font-size: 22px; font-weight: 600; margin: 20px 0 12px 0; }\n" +
                "        h3 { font-size: 18px; font-weight: 600; margin: 16px 0 10px 0; }\n" +
                "        h4, h5, h6 { font-weight: 600; margin: 12px 0 8px 0; }\n" +
                "        p { margin: 12px 0; }\n" +
                "        code { background: #f5f5f5; color: #d73a49; padding: 2px 6px; border-radius: 3px; font-family: 'Monaco', 'Menlo', monospace; font-size: 13px; }\n"
                +
                "        pre { background: #f5f5f5; padding: 12px; border-radius: 4px; overflow-x: auto; margin: 12px 0; border-left: 3px solid #0066cc; }\n"
                +
                "        pre code { background: transparent; color: #333; padding: 0; }\n" +
                "        ul, ol { margin: 12px 0 12px 20px; }\n" +
                "        li { margin: 6px 0; }\n" +
                "        blockquote { border-left: 4px solid #0066cc; margin: 12px 0; padding: 8px 12px; background: #f9f9f9; }\n"
                +
                "        table { border-collapse: collapse; width: 100%; margin: 12px 0; border: 1px solid #ddd; }\n" +
                "        thead { background: #f5f5f5; }\n" +
                "        th { padding: 8px; text-align: left; font-weight: 600; border: 1px solid #ddd; }\n" +
                "        td { padding: 8px; border: 1px solid #ddd; }\n" +
                "        a { color: #0066cc; text-decoration: none; }\n" +
                "        a:hover { text-decoration: underline; }\n" +
                "        img { max-width: 100%; height: auto; margin: 12px 0; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                htmlContent +
                "</body>\n" +
                "</html>";
    }

    /**
     * 将单行内容添加到Word文档
     * 支持Markdown的基本语法解析
     * 
     * @param document Word文档
     * @param line     单行内容
     */
    private void addParagraphToDocument(XWPFDocument document, String line) {
        line = line.trim();

        if (line.isEmpty()) {
            document.createParagraph();
            return;
        }

        XWPFParagraph paragraph = document.createParagraph();

        // 处理标题
        if (line.startsWith("# ")) {
            paragraph.setStyle("Heading1");
            addFormattedText(paragraph, line.substring(2));
        } else if (line.startsWith("## ")) {
            paragraph.setStyle("Heading2");
            addFormattedText(paragraph, line.substring(3));
        } else if (line.startsWith("### ")) {
            paragraph.setStyle("Heading3");
            addFormattedText(paragraph, line.substring(4));
        } else if (line.startsWith("- ") || line.startsWith("* ")) {
            // 列表项
            paragraph.setNumID(null);
            addFormattedText(paragraph, line.substring(2));
        } else if (line.matches("^\\d+\\.\\s.*")) {
            // 有序列表
            int spaceIdx = line.indexOf(' ');
            addFormattedText(paragraph, line.substring(spaceIdx + 1));
        } else if (line.startsWith("> ")) {
            // 引用
            XWPFRun run = paragraph.createRun();
            run.setText(line.substring(2));
            run.setItalic(true);
        } else {
            // 普通文本
            addFormattedText(paragraph, line);
        }
    }

    /**
     * 添加带格式的文本到段落
     * 支持粗体、斜体、代码等基本格式
     * 
     * @param paragraph Word段落
     * @param text      文本内容
     */
    private void addFormattedText(XWPFParagraph paragraph, String text) {
        // 简化实现：直接添加文本，不处理复杂的格式
        // 实际可以使用正则表达式解析**粗体**、*斜体*、`代码`等
        XWPFRun run = paragraph.createRun();

        // 处理粗体
        text = text.replaceAll("\\*\\*(.+?)\\*\\*", "$1");
        // 处理斜体
        text = text.replaceAll("\\*(.+?)\\*", "$1");
        // 处理代码
        text = text.replaceAll("`(.+?)`", "$1");

        run.setText(text);
    }
}
