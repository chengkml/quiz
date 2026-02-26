package com.ck.quiz.base.entity;

import java.time.LocalDate;

import org.hibernate.annotations.Comment;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Data;

@Data
@MappedSuperclass
public abstract class ReviewModel extends Model {

	@Column(nullable = false, columnDefinition = "DECIMAL(4,2) DEFAULT 2.50")
	@Comment("简易度因子 (1.3 ~ 无穷)")
	private Double easinessFactor = 2.5;

	@Column(nullable = false, columnDefinition = "INTEGER DEFAULT 0")
	@Comment("复习间隔天数")
	private Integer interval = 0;

	@Column(nullable = false, columnDefinition = "INTEGER DEFAULT 0")
	@Comment("连续记对次数")
	private Integer repetition = 0;

	@Comment("下次复习日期")
	private LocalDate nextReviewDate;

	@Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
	@Comment("是否已归档")
	private Boolean archived = false;

	@Comment("总复习次数")
	@Column(nullable = false, columnDefinition = "INTEGER DEFAULT 0")
	private Integer totalReviewCount = 0;

	@Comment("最后一次评分 (0-5)")
	@Column(columnDefinition = "INTEGER")
	private Integer lastScore;
}
