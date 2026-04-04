package com.ck.quiz.hotsearch.entity;

import com.ck.quiz.base.entity.Model;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

@Data
@Entity
@Comment("热搜关注主题")
@EqualsAndHashCode(callSuper = true)
@Table(name = "hot_search_follow_topic", indexes = {
        @Index(name = "idx_hot_search_follow_topic_user", columnList = "create_user"),
        @Index(name = "idx_hot_search_follow_topic_user_enabled", columnList = "create_user, enabled"),
        @Index(name = "idx_hot_search_follow_topic_user_seq", columnList = "create_user, seq")
})
public class HotSearchFollowTopic extends Model {

    @Column(name = "topic_name", length = 128, nullable = false)
    @Comment("主题名称")
    private String topicName;

    @Column(name = "keywords", columnDefinition = "TEXT")
    @Comment("匹配关键词，逗号/换行分隔")
    private String keywords;

    @Column(name = "enabled", nullable = false)
    @Comment("是否启用")
    private Boolean enabled;

    @Column(name = "seq")
    @Comment("排序")
    private Integer seq;
}
