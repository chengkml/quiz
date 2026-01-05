package com.ck.quiz.base.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.Comment;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import lombok.Data;

@Data
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class Model {

    @Id
    @Column(name = "id", length = 32, nullable = false)
    @Comment("主题ID")
    private String id;

    @CreatedDate
    @Column(updatable = false)
    @Comment("创建日期")
    private LocalDateTime createDate;

    @CreatedBy
    @Column(updatable = false, length = 64)
    @Comment("创建用户")
    private String createUser;

    @LastModifiedDate
    @Comment("更新日期")
    private LocalDateTime updateDate;

    @LastModifiedBy
    @Column(length = 64)
    @Comment("更新用户")
    private String updateUser;

}
