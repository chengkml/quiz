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

}