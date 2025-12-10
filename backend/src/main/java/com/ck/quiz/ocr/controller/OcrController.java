package com.ck.quiz.ocr.controller;

import com.ck.quiz.ocr.service.OcrService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/ocr")
public class OcrController {

	@Autowired
	private OcrService ocrService;

	@PostMapping(value = "/recognize", produces = "text/event-stream")
	public SseEmitter recognize(@RequestParam("image") MultipartFile image,
								@RequestParam(value = "model", required = false) String model) {
		try {
			return ocrService.recognizeStream(image, model);
		} catch (Exception e) {
			SseEmitter emitter = new SseEmitter(0L);
			try {
				emitter.send("[ERROR]" + e.getMessage());
			} catch (Exception ex) {
				// ignore
			}
			emitter.completeWithError(e);
			return emitter;
		}
	}

}
