package com.ck.quiz.group_obj.repository;

import com.ck.quiz.group_obj.entity.GroupObjRela;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GroupObjRelaRepository extends JpaRepository<GroupObjRela, String> {

    List<GroupObjRela> findByObjId(String objId);

    List<GroupObjRela> findByObjIdIn(List<String> objIds);

    void deleteByObjId(String objId);

    void deleteByObjIdAndGroupId(String objId, String groupId);
}
