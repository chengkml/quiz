package com.ck.quiz.sso;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * SSO 协议适配器（系统端 SP 视角）
 *
 * 该接口用于屏蔽不同认证中心或认证协议的差异，
 * 系统端只依赖该抽象完成 SSO 相关流程，而不直接感知具体协议实现。
 *
 * 接口职责边界：
 * - 不负责用户认证（用户名、密码校验不在系统端）
 * - 不建立系统登录态（Session / SecurityContext 由系统端统一处理）
 * - 仅负责协议交互、回调解析及认证结果校验
 *
 * 典型调用流程：
 * redirectToLogin
 *   -> handleCallback
 *   -> establishLogin（系统端处理，不属于本接口）
 */
public interface SsoProtocolAdapter {

    /**
     * 发起 SSO 登录流程，重定向浏览器到认证中心登录页面。
     *
     * 使用场景：
     * - 系统端检测到当前请求未认证
     * - 需要引导用户前往认证中心完成登录
     *
     * 主要职责：
     * - 构造认证中心登录地址
     * - 携带必要的协议参数（如 clientId、redirectUri、state 等）
     * - 通过 HTTP 重定向方式跳转至认证中心
     *
     * 说明：
     * - 该方法不返回业务数据
     * - 不进行任何用户身份校验
     *
     * @param req  当前 HTTP 请求
     * @param resp HTTP 响应对象，用于执行重定向
     */
    void redirectToLogin(HttpServletRequest req, HttpServletResponse resp);

    /**
     * 处理认证中心登录成功后的回调请求。
     *
     * 使用场景：
     * - 认证中心完成用户认证后重定向回系统端
     *
     * 主要职责：
     * - 解析回调请求中的参数（如 token、code、state 等）
     * - 校验 state，防止 CSRF 攻击
     * - 根据协议需要获取或解析访问令牌
     * - 校验令牌合法性（签名、有效期、颁发方等）
     * - 提取用户身份信息并封装为统一的认证结果
     *
     * 说明：
     * - 该方法不建立系统登录态
     * - 不写入 Cookie 或 Session
     * - 返回结果必须是已校验、可信的认证结果
     *
     * @param req 认证中心回调的 HTTP 请求
     * @return 已校验的统一认证结果
     */
    AuthResult handleCallback(HttpServletRequest req);

    /**
     * 校验访问 Token 的有效性。
     *
     * 使用场景：
     * - 系统端处理业务请求前，对客户端携带的 Token 进行校验
     *
     * 主要职责：
     * - 校验 Token 签名是否合法
     * - 校验 Token 是否过期
     * - 校验 Token 的颁发者及接收方是否符合预期
     * - 可选校验 Token 是否已被注销或吊销
     *
     * 说明：
     * - 该方法不负责刷新 Token
     * - Token 无效时由上层统一返回未认证响应
     *
     * @param token 客户端携带的访问 Token
     * @return Token 是否有效
     */
    boolean validateToken(String token);

    /**
     * 执行单点登出操作。
     *
     * 使用场景：
     * - 用户在系统端主动退出登录
     *
     * 主要职责：
     * - 通知认证中心注销对应的全局登录状态
     * - 使当前 Token 失效（如加入吊销列表）
     *
     * 说明：
     * - 该方法不负责清理系统端的安全上下文
     * - 系统端需在调用前后自行完成本地登录态清理
     *
     * @param token 当前用户的访问 Token
     */
    void logout(String token);
}
