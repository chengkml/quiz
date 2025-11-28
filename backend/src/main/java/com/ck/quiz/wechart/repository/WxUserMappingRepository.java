package com.ck.quiz.wechart.repository;

import com.ck.quiz.wechart.entity.WxUserMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WxUserMappingRepository extends JpaRepository<WxUserMapping, String> {

    Optional<WxUserMapping> findByAppidAndOpenid(String appid, String openid);
}