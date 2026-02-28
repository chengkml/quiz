package com.ck.quiz.ocr.service;

import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;


public interface OcrService {

	/**
	 * 将上传的图片文件发送到视觉大模型进行文字识别并返回识别结果文本
	 *
	 * @param file MultipartFile 图片
	 * @param modelName 可选的模型名，若为空则使用默认视觉模型
	 * @return 识别出的纯文本
	 * @throws Exception 出错时抛出异常
	 */
	String recognize(MultipartFile file, String modelName) throws Exception;

	/**
	 * 流式识别图片，返回 SSE 流（逐步返回模型输出 chunk）
	 * @param file 图片文件
	 * @param modelName 可选模型名
	 * @return SseEmitter 用于流式推送识别结果
	 * @throws Exception
	 */
	SseEmitter recognizeStream(MultipartFile file, String modelName) throws Exception;

	/**
	 * 批量处理图片目录，使用线程池并发调用
	 * @param sourceRoot 源图片根目录（包含多个子目录）
	 * @param targetBase 输出Markdown基础目录
	 * @param modelName 指定模型名称（可为null使用默认模型）
	 * @param maxWorkers 线程池大小，默认为2
	 */
	void batchRecognize(String sourceRoot, String targetBase, String modelName, int maxWorkers);

}