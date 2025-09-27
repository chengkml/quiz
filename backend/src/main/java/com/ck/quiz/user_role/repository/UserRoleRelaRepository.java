package com.ck.quiz.user_role.repository;

import com.ck.quiz.user.entity.User;
import com.ck.quiz.user_role.entity.UserRoleRela;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 用户角色关联数据访问接口
 */
@Repository
public interface UserRoleRelaRepository extends JpaRepository<UserRoleRela, String> {

    List<UserRoleRela> findByUser(User user);

    @Modifying
    @Transactional
    void deleteByUser(User user);

    long countByUser(User user);
}