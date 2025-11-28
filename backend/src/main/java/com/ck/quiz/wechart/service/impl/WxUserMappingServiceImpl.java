package com.ck.quiz.wechart.service.impl;


import com.ck.quiz.user.entity.User;
import com.ck.quiz.user.repository.UserRepository;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JwtUtil;
import com.ck.quiz.wechart.dto.WxBindDto;
import com.ck.quiz.wechart.dto.WxLoginDto;
import com.ck.quiz.wechart.dto.WxLoginRespDto;
import com.ck.quiz.wechart.entity.WxUserMapping;
import com.ck.quiz.wechart.repository.WxUserMappingRepository;
import com.ck.quiz.wechart.service.WxLoginHelper;
import com.ck.quiz.wechart.service.WxUserMappingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * 微信小程序用户服务实现
 */
@Service
public class WxUserMappingServiceImpl implements WxUserMappingService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WxUserMappingRepository wxUserMappingRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private WxLoginHelper wxLoginHelper;

    @Override
    public WxLoginRespDto login(WxLoginDto dto) {
        String appId = dto.getAppId();
        String openid = wxLoginHelper.getOpenIdByCode(appId, dto.getCode());
        if (openid == null) {
            throw new RuntimeException("微信 code 无效或已过期");
        }

        Optional<WxUserMapping> mappingOpt = wxUserMappingRepository.findByAppIdAndOpenId(appId, openid);
        if (mappingOpt.isPresent()) {
            // 已绑定 Web 用户
            User user = mappingOpt.get().getUser();
            String token = jwtUtil.generateToken(user.getUserId());
            return new WxLoginRespDto(user.getUserId(), token, false);
        } else {
            // 首次登录，需要绑定 Web 用户
            return new WxLoginRespDto(null, null, true);
        }
    }

    @Override
    @Transactional
    public WxLoginRespDto bind(WxBindDto dto) {
        // 1. 查找 Web 用户
        User user = userRepository.findByUserId(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        // 2. 验证密码
        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new RuntimeException("账号或密码错误");
        }

        // 3. 检查是否已绑定
        if (wxUserMappingRepository.findByAppIdAndOpenId(dto.getAppId(), dto.getOpenId()).isPresent()) {
            throw new RuntimeException("该小程序用户已绑定其他账号");
        }

        // 4. 保存映射关系
        WxUserMapping mapping = new WxUserMapping();
        mapping.setMappingId(IdHelper.genUuid());
        mapping.setAppId(dto.getAppId());
        mapping.setOpenId(dto.getOpenId());
        mapping.setUser(user);
        mapping.setCreateTime(LocalDateTime.now());
        wxUserMappingRepository.save(mapping);

        // 5. 生成 JWT
        String token = jwtUtil.generateToken(user.getUserId());
        return new WxLoginRespDto(user.getUserId(), token, false);
    }

}