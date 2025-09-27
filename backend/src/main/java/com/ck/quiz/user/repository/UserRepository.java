package com.ck.quiz.user.repository;

import com.ck.quiz.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;


/**
 * 用户数据访问接口
 */
@Repository
public interface UserRepository extends JpaRepository<User, String> {

    /**
     * 根据用户账号查找用户
     *
     * @param userId 用户账号
     * @return 用户信息
     */
    Optional<User> findByUserId(String userId);

    /**
     * 检查用户账号是否存在
     *
     * @param userId 用户账号
     * @return 是否存在
     */
    boolean existsByUserId(String userId);

}