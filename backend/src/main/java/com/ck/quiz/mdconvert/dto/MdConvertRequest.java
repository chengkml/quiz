package com.ck.quiz.mdconvert.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Markdown转换请求DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MdConvertRequest {
    /**
     * Markdown内容
     */
    private String mdContent;
    
    /**
     * 输出文件名（不包含扩展名）
     */
    private String fileName;
}
