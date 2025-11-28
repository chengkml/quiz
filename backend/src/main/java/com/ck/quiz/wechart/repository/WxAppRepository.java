package com.ck.quiz.wechart.repository;

import com.ck.quiz.wechart.entity.WxApp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;


@Repository
public interface WxAppRepository extends JpaRepository<WxApp, String> {

    /**
     * 根据 appid 查询小程序配置
     *
     * @param appId 小程序 AppId
     * @return Optional<WxApp> 配置对象
     */
    Optional<WxApp> findByAppId(String appId);

    boolean existsByAppId(String appId);
}