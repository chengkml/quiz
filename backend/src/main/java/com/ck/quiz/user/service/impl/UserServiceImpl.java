package com.ck.quiz.user.service.impl;

import com.ck.quiz.role.entity.UserRole;
import com.ck.quiz.user.dto.UserCreateDto;
import com.ck.quiz.user.dto.UserDto;
import com.ck.quiz.user.dto.UserUpdateDto;
import com.ck.quiz.user.entity.User;
import com.ck.quiz.user.repository.UserRepository;
import com.ck.quiz.user.service.UserService;
import com.ck.quiz.user_role.entity.UserRoleRela;
import com.ck.quiz.utils.JdbcQueryHelper;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 用户管理服务实现类
 */
@Service
public class UserServiceImpl implements UserService, UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;

    @Override
    public UserDto register(UserCreateDto userCreateDto) {
        // 检查用户账号是否已存在
        if (userRepository.existsByUserId(userCreateDto.getUserId())) {
            throw new RuntimeException("用户账号已存在: " + userCreateDto.getUserId());
        }

        // 创建用户实体
        User user = new User();
        user.setUserId(userCreateDto.getUserId());
        user.setUserName(userCreateDto.getUserName());
        user.setPassword(passwordEncoder.encode(userCreateDto.getPassword()));
        user.setEmail(userCreateDto.getEmail());
        user.setPhone(userCreateDto.getPhone());
        user.setState(User.UserState.ENABLED); // 默认启用
        user.setLogo(userCreateDto.getLogo());

        // 保存用户
        user = userRepository.save(user);

        // 转换为DTO返回
        return convertToUserDto(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getUserById(String id) {
        Optional<User> userOpt = userRepository.findByUserId(id);
        if (!userOpt.isPresent()) {
            throw new RuntimeException("用户不存在: " + id);
        }

        UserDto userDto = convertToUserDto(userOpt.get());
        return userDto;
    }

    @Override
    public Page<UserDto> searchUsers(String userId, String userName, String state, Pageable pageable) {
        StringBuilder sql = new StringBuilder(
                "select u.user_id, u.user_name, u.password, u.email, u.phone, u.state, u.logo, " +
                        "u.create_date, u.create_user, cu.user_name as create_user_name, " +
                        "u.update_date, u.update_user, uu.user_name as update_user_name " +
                        "from user u " +
                        "left join user cu on u.create_user = cu.user_id " +
                        "left join user uu on u.update_user = uu.user_id " +
                        "where 1=1 "
        );
        StringBuilder countSql = new StringBuilder(
                "select count(1) from user u where 1=1 "
        );
        Map<String, Object> params = new HashMap<>();

        // 动态条件构建
        JdbcQueryHelper.equals("userId", userId, " and u.user_id = :userId ", params, sql, countSql);
        JdbcQueryHelper.lowerLike("userName", userName, " and (lower(u.user_name) like :userName or lower(u.user_id) like :userName) ", params, jdbcTemplate, sql, countSql);
        JdbcQueryHelper.equals("state", state, " and u.state = :state ", params, sql, countSql);

        // 排序
        JdbcQueryHelper.order(pageable.getSort().isEmpty() ? null : pageable.getSort().toString(), "u", sql);

        // 分页
        String pageSql = JdbcQueryHelper.getLimitSql(
                jdbcTemplate, sql.toString(),
                (int) pageable.getPageNumber(),
                pageable.getPageSize()
        );

        // 查询数据并映射到 UserDto
        List<UserDto> users = jdbcTemplate.query(pageSql, params, (rs, rowNum) ->
                new UserDto(
                        rs.getString("user_id"),
                        rs.getString("user_name"),
                        rs.getString("password"),
                        rs.getString("email"),
                        rs.getString("phone"),
                        rs.getString("state") != null ? User.UserState.valueOf(rs.getString("state")) : null,
                        rs.getString("logo"),
                        rs.getTimestamp("create_date") != null ? rs.getTimestamp("create_date").toLocalDateTime() : null,
                        rs.getString("create_user"),
                        rs.getString("create_user_name"),
                        rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime() : null,
                        rs.getString("update_user"),
                        rs.getString("update_user_name")
                )
        );

        // 查询总数
        Long total = jdbcTemplate.queryForObject(countSql.toString(), params, Long.class);

        return new PageImpl<>(users, pageable, total);
    }


    @Override
    public UserDto updateUser(UserUpdateDto userUpdateDto) {
        Optional<User> userOpt = userRepository.findByUserId(userUpdateDto.getUserId());
        if (!userOpt.isPresent()) {
            throw new RuntimeException("用户不存在: " + userUpdateDto.getUserId());
        }

        User user = userOpt.get();

        // 更新用户信息
        if (StringUtils.hasText(userUpdateDto.getUserName())) {
            user.setUserName(userUpdateDto.getUserName());
        }
        if (StringUtils.hasText(userUpdateDto.getEmail())) {
            user.setEmail(userUpdateDto.getEmail());
        }
        if (StringUtils.hasText(userUpdateDto.getPhone())) {
            user.setPhone(userUpdateDto.getPhone());
        }
        if (StringUtils.hasText(userUpdateDto.getLogo())) {
            user.setLogo(userUpdateDto.getLogo());
        }

        user = userRepository.save(user);

        return convertToUserDto(user);
    }

    @Override
    public boolean resetPassword(String id, String newPassword) {
        Optional<User> userOpt = userRepository.findByUserId(id);
        if (!userOpt.isPresent()) {
            throw new RuntimeException("用户不存在: " + id);
        }

        User user = userOpt.get();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return true;
    }

    @Override
    public UserDto enableUser(String id) {
        return updateUserState(id, User.UserState.ENABLED);
    }

    @Override
    public UserDto disableUser(String id) {
        return updateUserState(id, User.UserState.DISABLED);
    }

    private UserDto updateUserState(String id, User.UserState state) {
        Optional<User> userOpt = userRepository.findByUserId(id);
        if (!userOpt.isPresent()) {
            throw new RuntimeException("用户不存在: " + id);
        }

        User user = userOpt.get();
        user.setState(state);
        userRepository.save(user);

        return convertToUserDto(user);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByUserId(String userId) {
        return userRepository.existsByUserId(userId);
    }

    /**
     * 将用户实体转换为DTO
     */
    private UserDto convertToUserDto(User user) {
        UserDto userDto = new UserDto();
        BeanUtils.copyProperties(user, userDto);
        return userDto;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 根据用户账号查找用户
        Optional<User> userOpt = userRepository.findByUserId(username);
        if (!userOpt.isPresent()) {
            throw new UsernameNotFoundException("用户不存在: " + username);
        }

        User user = userOpt.get();

        // 检查用户状态
        if (!User.UserState.ENABLED.equals(user.getState())) {
            throw new UsernameNotFoundException("用户已被禁用: " + username);
        }
        List<UserRole> roles = user.getUserRoleRelas().stream().map(UserRoleRela::getRole).collect(Collectors.toList());

        // 过滤启用的角色并转换为GrantedAuthority
        List<GrantedAuthority> authorities = roles.stream()
                .filter(role -> "1".equals(role.getState()))
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getName()))
                .collect(Collectors.toList());

        // 如果用户没有任何启用的角色，给一个默认角色
        if (authorities.isEmpty()) {
            authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
        }

        // 返回Spring Security的User对象
        return new org.springframework.security.core.userdetails.User(
                user.getUserId(),
                user.getPassword(),
                User.UserState.ENABLED.equals(user.getState()), // enabled
                true, // accountNonExpired
                true, // credentialsNonExpired
                true, // accountNonLocked
                authorities
        );
    }

    @Override
    @Transactional
    public UserDto deleteUser(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        userRepository.delete(user); // 会自动级联删除 userRoleRela
        return convertToUserDto(user);
    }
}