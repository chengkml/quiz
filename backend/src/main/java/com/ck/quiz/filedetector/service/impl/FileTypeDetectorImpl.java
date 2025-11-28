package com.ck.quiz.filedetector.service.impl;

import com.ck.quiz.filedetector.service.FileTypeDetector;
import org.apache.tika.Tika;
import org.apache.tika.metadata.Metadata;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedInputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@Component
public class FileTypeDetectorImpl implements FileTypeDetector {

    /**
     * Tika 实例（线程安全，单例复用即可）
     */
    private static final Tika TIKA = new Tika();

    /**
     * 魔术字节映射表（按长度从长到短，避免前缀覆盖）
     */
    private static final Map<String, String> MAGIC_MAP = new LinkedHashMap<>();

    static {
        // 图片
        MAGIC_MAP.put("FFD8FF", "image/jpeg");
        MAGIC_MAP.put("89504E47", "image/png");
        MAGIC_MAP.put("47494638", "image/gif");
        MAGIC_MAP.put("424D", "image/bmp");

        // 文档 PDF
        MAGIC_MAP.put("25504446", "application/pdf");

        // Office 旧格式（doc/xls/ppt）
        MAGIC_MAP.put("D0CF11E0A1B11AE1", "application/x-ole-storage");

        // Office 新格式（docx/xlsx/pptx）
        MAGIC_MAP.put("504B0304", "application/zip");

        // 视频
        MAGIC_MAP.put("0000002066747970", "video/mp4");
        MAGIC_MAP.put("66747970", "video/mp4");
        MAGIC_MAP.put("52494646", "riff"); // avi / wav
        MAGIC_MAP.put("3026B2758E66CF11", "video/x-ms-wmv");

        // 音频
        MAGIC_MAP.put("494433", "audio/mp3"); // ID3
        MAGIC_MAP.put("664C6143", "audio/flac");
        MAGIC_MAP.put("FFF1", "audio/aac");
        MAGIC_MAP.put("FFF9", "audio/aac");
    }

    private static final int MAX_MAGIC_LENGTH = MAGIC_MAP.keySet()
            .stream()
            .mapToInt(String::length)
            .max().orElse(8) / 2;


    @Override
    public String detect(Path path) throws Exception {
        try (InputStream is = Files.newInputStream(path)) {
            return detect(is, path.getFileName().toString());
        }
    }

    @Override
    public String detect(MultipartFile file) throws Exception {
        try (InputStream is = file.getInputStream()) {
            return detect(is, file.getOriginalFilename());
        }
    }

    @Override
    public String detect(InputStream is) throws Exception {
        return detect(is, null);
    }


    // =============================
    //   多策略融合检测核心方法
    // =============================
    public String detect(InputStream inputStream, String filename) throws Exception {

        BufferedInputStream bis = new BufferedInputStream(inputStream);
        bis.mark(MAX_MAGIC_LENGTH + 4096);

        // 1. 魔术字节识别（最快）
        String type = detectByMagic(bis, filename);
        if (!"unknown".equals(type)) {
            return type;
        }

        bis.reset();  // 还原流，给 Tika 用

        // 2. Tika 检测（最高准确度）
        type = detectByTika(bis, filename);
        if (!"unknown".equals(type)) {
            return type;
        }

        bis.reset();

        // 3. 文本内容特征识别（json/jsonl/csv/tsv/txt/md）
        type = detectTextTypes(bis);
        if (!"unknown".equals(type)) {
            return type;
        }

        // 4. 扩展名兜底
        if (filename != null) {
            return detectByExtension(filename);
        }

        return "unknown";
    }

    // =============================
    //       魔术字节识别
    // =============================
    private String detectByMagic(InputStream is, String filename) throws Exception {
        byte[] header = readHeader(is, MAX_MAGIC_LENGTH);
        String hex = toHex(header);

        for (var entry : MAGIC_MAP.entrySet()) {
            if (hex.startsWith(entry.getKey())) {

                String result = entry.getValue();

                if ("application/zip".equals(result) && filename != null) {
                    return guessZipType(filename);
                }

                if ("riff".equals(result)) {
                    return guessRiffType(header);
                }

                return result;
            }
        }
        return "unknown";
    }


    // =============================
    //          Tika 识别
    // =============================
    private String detectByTika(InputStream is, String filename) {
        try {
            Metadata md = new Metadata();
            if (filename != null) md.set("resourceName", filename);

            String mime = TIKA.detect(is, md);
            if (mime != null && !mime.equals("application/octet-stream")) {
                return mime;
            }
        } catch (Exception ignored) {
        }
        return "unknown";
    }


    // =============================
    //       文本格式识别
    // =============================
    private String detectTextTypes(InputStream is) throws Exception {
        byte[] bytes = readHeader(is, 4096);
        String content = new String(bytes).trim();

        if (content.startsWith("{") || content.startsWith("[")) {
            if (content.contains("\n")) return "application/jsonl";
            return "application/json";
        }
        if (content.contains(",")) return "text/csv";
        if (content.contains("\t")) return "text/tsv";
        if (content.length() > 0) return "text/plain";

        return "unknown";
    }


    // =============================
    //        扩展名兜底
    // =============================
    private String detectByExtension(String filename) {
        String ext = getExt(filename);
        return switch (ext) {
            case "html", "htm" -> "text/html";
            case "md" -> "text/markdown";
            case "txt" -> "text/plain";
            case "json" -> "application/json";
            case "jsonl" -> "application/jsonl";
            case "csv" -> "text/csv";
            case "tsv" -> "text/tsv";

            case "doc" -> "application/msword";
            case "xls" -> "application/vnd.ms-excel";
            case "ppt" -> "application/vnd.ms-powerpoint";

            case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "xlsx" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            case "pptx" -> "application/vnd.openxmlformats-officedocument.presentationml.presentation";

            case "wps" -> "application/wps-office";
            case "dps" -> "application/wps-dps";
            case "et" -> "application/wps-et";

            default -> "unknown";
        };
    }


    // =============================
    //    ZIP 类型推断（docx/xlsx 等）
    // =============================
    private String guessZipType(String filename) {
        return detectByExtension(filename); // 利用扩展名区分
    }

    // AVI / WAV 同为 RIFF，需要继续检查 header
    private String guessRiffType(byte[] header) {
        // RIFF....AVI  (415649)
        if (header.length > 8 && header[8] == 'A' && header[9] == 'V' && header[10] == 'I') {
            return "video/avi";
        }
        if (header.length > 8 && header[8] == 'W' && header[9] == 'A' && header[10] == 'V') {
            return "audio/wav";
        }
        return "audio/wav";
    }

    private byte[] readHeader(InputStream is, int len) throws Exception {
        byte[] buffer = new byte[len];
        int read = is.read(buffer, 0, len);
        if (read <= 0) return new byte[0];
        if (read < len) return Arrays.copyOf(buffer, read);
        return buffer;
    }

    private String getExt(String filename) {
        int i = filename.lastIndexOf('.');
        if (i < 0) return "";
        return filename.substring(i + 1).toLowerCase(Locale.ROOT);
    }

    private String toHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) sb.append(String.format("%02X", b));
        return sb.toString();
    }
}
