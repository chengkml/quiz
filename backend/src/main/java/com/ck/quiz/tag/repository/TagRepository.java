package com.ck.quiz.tag.repository;

import com.ck.quiz.tag.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TagRepository extends JpaRepository<Tag, String> {
    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, String id);

    boolean existsByLabel(String label);

    boolean existsByLabelAndIdNot(String label, String id);

    java.util.List<Tag> findByCreateUser(String createUser);

    Tag findByCreateUserAndName(String createUser, String name);
}
