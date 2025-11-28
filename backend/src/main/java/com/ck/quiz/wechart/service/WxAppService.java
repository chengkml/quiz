package com.ck.quiz.wechart.service;

import com.ck.quiz.todo.dto.TodoDto;
import com.ck.quiz.todo.dto.TodoQueryDto;
import com.ck.quiz.wechart.dto.WxAppCreateDto;
import com.ck.quiz.wechart.dto.WxAppDto;
import com.ck.quiz.wechart.dto.WxAppQueryDto;
import com.ck.quiz.wechart.dto.WxAppUpdateDto;
import com.ck.quiz.wechart.entity.WxApp;
import org.springframework.data.domain.Page;

import java.util.Optional;

/**
 * 微信小程序 App 服务接口
 * <p>
 * 提供 WxApp 的增删改查操作
 */
public interface WxAppService {

    /**
     * 创建一个新的小程序 App 配置
     *
     * @param wxApp 小程序 App 实体
     * @return 创建后的 WxApp
     */
    WxApp createWxApp(WxAppCreateDto wxApp);

    /**
     * 根据 appId 更新小程序 App 信息
     *
     * @param wxApp 小程序 App 实体
     * @return 更新后的 WxApp
     */
    WxApp updateWxApp(WxAppUpdateDto wxApp);

    /**
     * 根据 appId 删除小程序 App 配置
     *
     * @param appId 主键 ID
     * @return 是否删除成功
     */
    boolean deleteWxApp(String appId);

    /**
     * 根据 appId 查询小程序 App 配置
     *
     * @param appId 主键 ID
     * @return Optional<WxApp>
     */
    Optional<WxAppDto> getWxAppById(String appId);

    /**
     * 分页查询APP
     */
    Page<WxAppDto> searchTodos(WxAppQueryDto queryDto);

}
