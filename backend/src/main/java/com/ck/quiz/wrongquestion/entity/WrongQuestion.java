package com.ck.quiz.wrongquestion.entity;

import com.ck.quiz.base.entity.Model;
import com.ck.quiz.question.entity.Question;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

@Data
@Entity
@Table(
        name = "wrong_question",
        indexes = {
                @Index(name = "idx_wrong_question_subject_id", columnList = "subject_id"),
                @Index(name = "idx_wrong_question_category_id", columnList = "category_id"),
                @Index(name = "idx_wrong_question_type", columnList = "type"),
                @Index(name = "idx_wrong_question_create_date", columnList = "create_date")
        }
)
@EqualsAndHashCode(callSuper = true)
public class WrongQuestion extends Model {

    @Column(name = "subject_id", length = 32, nullable = false)
    @Comment("学科ID")
    private String subjectId;

    @Column(name = "category_id", length = 32)
    @Comment("分类ID")
    private String categoryId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 20, nullable = false)
    @Comment("题型")
    private Question.QuestionType type;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    @Comment("题目内容")
    private String content;

    @Column(name = "answer", columnDefinition = "TEXT")
    @Comment("答案")
    private String answer;

    @Column(name = "difficulty", length = 20)
    @Comment("难度")
    private String difficulty;

    @Column(name = "remark", columnDefinition = "TEXT")
    @Comment("解析或备注")
    private String remark;

    @Column(name = "original_image_file_id", length = 32)
    @Comment("原始图片文件ID")
    private String originalImageFileId;

    @Column(name = "original_image_name", length = 255)
    @Comment("原始图片名")
    private String originalImageName;

    @Column(name = "ocr_text", columnDefinition = "TEXT")
    @Comment("OCR识别文本")
    private String ocrText;
}
