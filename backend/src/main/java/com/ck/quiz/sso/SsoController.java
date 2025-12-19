package com.ck.quiz.sso;

import com.ck.quiz.sso.impl.DefaultSsoProtocolAdapter;
import com.ck.quiz.user.dto.UserDto;
import com.ck.quiz.user.service.UserService;
import com.ck.quiz.utils.SpringContextUtil;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;


@Controller
@RequestMapping("/_api/_/sso")
public class SsoController {

    private static final Logger log = LoggerFactory.getLogger(SsoController.class);

    @Autowired
    private Environment env;

    @Autowired
    private UserService userService;

    @Autowired
    private AuthenticationManager authenticationManager;

    private SsoProtocolAdapter getAdapter() {
        String adapteString = env.getProperty("app.sso-login.adapter",
                "com.asiainfo.synth.sso.impl.DefaultSsoProtocolAdapter");
        try {
            Class<?> clazz = Class.forName(adapteString);
            return (SsoProtocolAdapter) SpringContextUtil.getBean(clazz);
        } catch (Exception e) {
            log.error("加载 SSO 适配器失败，使用默认适配器", e);
            return SpringContextUtil.getBean(DefaultSsoProtocolAdapter.class);
        }
    }

    @GetMapping("/login")
    public void login(HttpServletRequest req, HttpServletResponse resp) {
        getAdapter().redirectToLogin(req, resp);
    }

    @GetMapping("/callback")
    public String callback(HttpServletRequest req, HttpServletResponse resp) {
        AuthResult result = getAdapter().handleCallback(req);
        
        if (result == null || !result.isSuccess()) {
            log.warn("SSO 认证失败");
            return "redirect:/login?error=auth_failed";
        }
        
        try {
            String userId = result.getUserId();
            if (userId == null || userId.isEmpty()) {
                log.warn("SSO 认证结果缺少用户ID");
                return "redirect:/login?error=no_user_id";
            }
            
            // 从数据库获取用户信息并验证
            UserDto userDto = userService.getUserById(userId);
            if (userDto == null) {
                log.warn("用户不存在: {}", userId);
                return "redirect:/login?error=user_not_found";
            }
            
            // 建立登录态（包含 Spring Security 认证和 Session 创建）
            establishLogin(userId, userDto, result, req, resp);
            
            log.info("用户 [{}] SSO 登录成功", userId);
            return "redirect:/frame";
            
        } catch (Exception e) {
            log.error("SSO 登录处理失败", e);
            return "redirect:/login?error=sso_login_failed";
        }
    }

    @PostMapping("/logout")
    public void logout(HttpServletRequest req, HttpServletResponse resp) {
        getAdapter().logout(extractToken(req));
    }

    /**
     * 建立登录态，参考 UserController 的登录流程
     * 步骤：1) Spring Security 认证  2) 保存 Session  3) 设置 Cookie
     *
     * @param userId  用户ID
     * @param userDto 用户信息
     * @param result  SSO 认证结果
     * @param req     HTTP 请求对象
     * @param resp    HTTP 响应对象
     */
    private void establishLogin(String userId, UserDto userDto, AuthResult result, HttpServletRequest req, HttpServletResponse resp) {
        // 步骤1: 创建并认证用户令牌
        // 注：SSO 认证成功，直接使用 SSO 用户信息创建认证令牌，无需再次验证密码
        UsernamePasswordAuthenticationToken token =
                new UsernamePasswordAuthenticationToken(userId, userDto.getPassword());

        Authentication authentication = authenticationManager.authenticate(token);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // 步骤2: 创建 Session 并保存 Spring Security 上下文
        HttpSession session = req.getSession(true);
        SecurityContext context = SecurityContextHolder.getContext();
        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);

        log.debug("建立登录态成功，用户ID: {}, 会话ID: {}", userId, session.getId());
    }

    /**
     * 获取当前请求的 HttpServletRequest
     */
    private HttpServletRequest getRequest() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            return attrs.getRequest();
        }
        return null;
    }

    /**
     * 获取当前请求的 HttpServletResponse
     */
    private HttpServletResponse getResponse() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            return attrs.getResponse();
        }
        return null;
    }

    /**
     * 从请求中提取 Token
     */
    private String extractToken(HttpServletRequest req) {
        // 实现从 request 中提取 Token 的逻辑
        String token = req.getHeader("Authorization");
        if (token == null) {
            token = req.getParameter("token");
        }
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        return token;
    }
}
