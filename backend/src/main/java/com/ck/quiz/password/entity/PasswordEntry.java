package com.ck.quiz.password.entity;

import com.ck.quiz.base.entity.Model;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

@Data
@Entity
@Comment("密码本")
@Table(name = "t_password_entry")
@EqualsAndHashCode(callSuper = true)
public class PasswordEntry extends Model {

    @Comment("标题")
    @Column(length = 128, nullable = false)
    private String title;

    @Comment("用户名")
    @Column(length = 128)
    private String username;

    @Comment("加密密码")
    @Column(name = "password_data", length = 512, nullable = false)
    private String encryptedPassword;

    @Comment("网址")
    @Column(length = 512)
    private String url;

    @Comment("分组")
    @Column(length = 64)
    private String category;

    @Comment("备注")
    @Column(length = 1024)
    private String remark;

}
