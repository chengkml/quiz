package com.ck.quiz.knowledge.entity;

import com.ck.quiz.base.entity.ReviewModel;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import java.util.ArrayList;
import java.util.List;

@Entity
@Comment("知识点信息实体")
@Table(
        name = "knowledge",
        indexes = {
                @Index(name = "idx_kp_name", columnList = "name"),
                @Index(name = "idx_kp_category_id", columnList = "category_id"),
                @Index(name = "idx_kp_subject_id", columnList = "subject_id"),
                @Index(name = "idx_kp_create_date", columnList = "create_date")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@AttributeOverrides({
    @AttributeOverride(name = "id", column = @Column(name = "knowledge_id", length = 32, nullable = false)),
    @AttributeOverride(name = "createDate", column = @Column(name = "create_date", updatable = false)),
    @AttributeOverride(name = "createUser", column = @Column(name = "create_user", length = 64, updatable = false)),
    @AttributeOverride(name = "updateDate", column = @Column(name = "update_date")),
    @AttributeOverride(name = "updateUser", column = @Column(name = "update_user", length = 64))
})
public class Knowledge extends ReviewModel {

    @Comment("知识点名称")
    @Column(name = "name", length = 512, nullable = false)
    private String name;

    @Comment("所属分类ID")
    @Column(name = "category_id", length = 32, nullable = false)
    private String categoryId;

    @Comment("所属学科ID")
    @Column(name = "subject_id", length = 32, nullable = false)
    private String subjectId;

    @Comment("知识点内容(HTML)")
    @Column(columnDefinition = "TEXT")
    private String content;

    @ManyToMany(mappedBy = "knowledgePoints", fetch = FetchType.LAZY)
    private List<com.ck.quiz.question.entity.Question> questions = new ArrayList<>();
}
