package com.ck.quiz.filedetector.service.impl;

import com.ck.quiz.filedetector.service.FileTypeDetector;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class MagicFileTypeDetector implements FileTypeDetector {

    /** 魔术字节映射表（需按长度从长到短排列，避免前缀覆盖） */
    private static final Map<String, String> MAGIC_MAP = new LinkedHashMap<>();

    static {
        MAGIC_MAP.put("424D", "image/bmp");
        MAGIC_MAP.put("49492A00", "image/tiff");
        MAGIC_MAP.put("4D4D002A", "image/tiff");
        MAGIC_MAP.put("377ABCAF271C", "application/x-7z-compressed");
        MAGIC_MAP.put("1F8B08", "application/gzip");
        MAGIC_MAP.put("3C3F786D6C", "application/xml");
        MAGIC_MAP.put("7B5C727466", "application/rtf");
        MAGIC_MAP.put("494433", "audio/mpeg");
        MAGIC_MAP.put("000001BA", "video/mpeg");
        MAGIC_MAP.put("000001B3", "video/mpeg");
        MAGIC_MAP.put("66747970", "video/mp4");
        MAGIC_MAP.put("3026B2758E66CF11", "video/x-ms-wmv");
        MAGIC_MAP.put("52494646", "audio/wav");
        MAGIC_MAP.put("4F676753", "audio/ogg");
        MAGIC_MAP.put("1A45DFA3", "video/webm");
        MAGIC_MAP.put("00000018", "image/heif");

    }

    // 最大魔术字节长度（根据 map 自动计算）
    private static final int MAX_MAGIC_LENGTH = MAGIC_MAP.keySet()
            .stream()
            .mapToInt(String::length)
            .max()
            .orElse(8) / 2;

    @Override
    public String detect(Path path) throws Exception {
        try (InputStream is = Files.newInputStream(path)) {
            return detect(is);
        }
    }

    @Override
    public String detect(MultipartFile file) throws Exception {
        try (InputStream is = file.getInputStream()) {
            return detect(is);
        }
    }

    @Override
    public String detect(InputStream is) throws Exception {
        byte[] header = readHeader(is, MAX_MAGIC_LENGTH);
        String hex = toHex(header);

        for (var entry : MAGIC_MAP.entrySet()) {
            if (hex.startsWith(entry.getKey())) {
                return entry.getValue();
            }
        }
        return "unknown";
    }

    /** 安全读取 header（确保读取 length 字节或文件结束） */
    private byte[] readHeader(InputStream is, int length) throws Exception {
        byte[] buffer = new byte[length];
        int read = is.read(buffer, 0, length); // read 可能小于 length
        if (read <= 0) {
            return new byte[0];
        }
        if (read < length) {
            byte[] truncated = new byte[read];
            System.arraycopy(buffer, 0, truncated, 0, read);
            return truncated;
        }
        return buffer;
    }

    /** 转 hex 字符串 */
    private String toHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02X", b));
        }
        return sb.toString();
    }
}
