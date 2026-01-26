package com.ck.quiz.tag_obj.repository;

import com.ck.quiz.tag_obj.entity.TagObjRela;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TagObjRelaRepository extends JpaRepository<TagObjRela, String> {

    List<TagObjRela> findByObjId(String objId);

    void deleteByObjId(String objId);

    void deleteByObjIdAndTagId(String objId, String tagId);
}
