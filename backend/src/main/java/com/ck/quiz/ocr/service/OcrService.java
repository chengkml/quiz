package com.ck.quiz.ocr.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.InputStream;

/**
 * OCR 文字识别服务接口
 * <p>
 * 提供多种图片输入方式的文字识别能力，包括本地文件、网络 URL、字节流及 Web 上传文件。
 * 所有方法均调用底层 OCR 引擎（如阿里云 OCR）进行通用文字识别，返回纯文本结果。
 * </p>
 */
public interface OcrService {

    /**
     * 识别本地图片文件中的文字内容（同步）
     *
     * @param imageFile 本地图片文件（支持 JPG、PNG、BMP 等常见格式）
     * @return 识别出的文本内容，按原始排版保留换行符
     * @throws IllegalArgumentException 当文件为 null、不存在、非文件或格式不支持时
     */
    String recognizeFromFile(File imageFile);

    /**
     * 识别网络图片中的文字内容（同步）
     *
     * @param imageUrl 网络图片的可公开访问 URL（必须可被 OCR 服务直接拉取）
     * @return 识别出的文本内容，按原始排版保留换行符
     * @throws IllegalArgumentException 当 URL 为 null、格式非法或为空字符串时
     */
    String recognizeFromUrl(String imageUrl);

    /**
     * 从输入流中识别图片文字内容（同步）
     * <p>
     * 适用于从内存、HTTP 请求体、数据库 BLOB 等来源读取的图片数据。
     * 调用方需确保输入流指向完整且有效的图片内容。
     * </p>
     *
     * @param is 图片的输入流（不会自动关闭，由调用方管理资源）
     * @return 识别出的文本内容
     * @throws IllegalArgumentException 当输入流为 null 时
     */
    String recognizeFromInputStream(InputStream is);

    /**
     * 识别 Spring Web 上传的多部分文件中的文字内容（同步）
     * <p>
     * 通常用于处理前端通过表单上传的图片文件（如 POST /upload）。
     * 支持 MultipartFile 的内存/临时文件模式。
     * </p>
     *
     * @param multipartFile 前端上传的图片文件对象
     * @return 识别出的文本内容
     * @throws IllegalArgumentException 当 multipartFile 为 null 或无有效内容时
     */
    String recognizeFromMultiFile(MultipartFile multipartFile);
}