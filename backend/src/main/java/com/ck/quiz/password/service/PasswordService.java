package com.ck.quiz.password.service;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.notification.service.NotificationMessage;
import com.ck.quiz.notification.service.impl.EmailChannel;
import com.ck.quiz.password.dto.PasswordCreateDto;
import com.ck.quiz.password.dto.PasswordDto;
import com.ck.quiz.password.dto.PasswordQueryDto;
import com.ck.quiz.password.dto.PasswordUpdateDto;
import com.ck.quiz.password.entity.PasswordEntry;
import com.ck.quiz.password.repository.PasswordRepository;
import com.ck.quiz.user.dto.UserDto;
import com.ck.quiz.user.service.UserService;
import com.ck.quiz.utils.EncryptUtil;
import com.ck.quiz.utils.IdHelper;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PasswordService extends BaseServiceImpl<PasswordCreateDto, PasswordUpdateDto, PasswordQueryDto, PasswordDto, PasswordEntry, PasswordRepository> {

    @Autowired
    private PasswordRepository passwordRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private EmailChannel emailChannel;

    private final Map<String, CodeInfo> verificationCodes = new ConcurrentHashMap<>();

    @Override
    protected PasswordDto newDto() {
        return new PasswordDto();
    }

    @Override
    protected PasswordEntry newModel() {
        return new PasswordEntry();
    }

    @Override
    public PasswordDto create(PasswordCreateDto createDto) {
        PasswordEntry entry = newModel();
        entry.setId(IdHelper.genUuid());
        entry.setTitle(createDto.getTitle());
        entry.setUsername(createDto.getUsername());
        entry.setUrl(createDto.getUrl());
        entry.setRemark(createDto.getRemark());
        entry.setEncryptedPassword(EncryptUtil.encrypt(createDto.getPassword(), null));

        PasswordEntry saved = repository.save(entry);
        return convertToDto(saved, true);
    }

    @Override
    public PasswordDto update(String userId, PasswordUpdateDto updateDto) {
        PasswordEntry entry = repository.findById(updateDto.getId())
                .orElseThrow(() -> new IllegalArgumentException("Password entry not found: " + updateDto.getId()));

        if (entry.getCreateUser() != null && !entry.getCreateUser().equals(userId)) {
            throw new IllegalArgumentException("No permission to update password entry: " + updateDto.getId());
        }

        entry.setTitle(updateDto.getTitle());
        entry.setUsername(updateDto.getUsername());
        entry.setUrl(updateDto.getUrl());
        entry.setRemark(updateDto.getRemark());

        if (StringUtils.hasText(updateDto.getPassword())) {
            entry.setEncryptedPassword(EncryptUtil.encrypt(updateDto.getPassword(), null));
        }

        PasswordEntry saved = repository.save(entry);
        return convertToDto(saved, true);
    }

    @Override
    public Page<PasswordDto> search(String userId, PasswordQueryDto queryDto) {
        Specification<PasswordEntry> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(queryDto.getKeyWord())) {
                String likePattern = "%" + queryDto.getKeyWord().trim() + "%";
                predicates.add(cb.or(
                        cb.like(root.get("title"), likePattern),
                        cb.like(root.get("username"), likePattern),
                        cb.like(root.get("remark"), likePattern)));
            }
            predicates.add(cb.equal(root.get("createUser"), userId));
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        int page = Math.max(queryDto.getPageNum(), 0);
        int pageSize = queryDto.getPageSize() > 0 ? queryDto.getPageSize() : 20;
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Direction.DESC, "updateDate", "createDate"));

        Page<PasswordEntry> result = passwordRepository.findAll(spec, pageable);
        return result.map(entity -> convertToDto(entity, true));
    }

    public synchronized void sendViewSalt(String userId) {
        UserDto user = userService.getUserById(userId);
        if (user == null || !StringUtils.hasText(user.getEmail())) {
            throw new RuntimeException("用户未绑定邮箱，无法发送验证码");
        }

        String code = String.format("%06d", (int) (Math.random() * 1000000));
        verificationCodes.put(userId, new CodeInfo(code, LocalDateTime.now().plusMinutes(5)));

        NotificationMessage message = new NotificationMessage();
        message.setTo(user.getEmail());
        message.setTitle("【密钥管理】查看明文密码验证");
        message.setContent("您正在尝试查看明文密码，本次验证码为：<b>" + code + "</b><br>有效期5分钟，请勿泄露给他人。");
        emailChannel.send(message);
    }

    public String getDecryptedPassword(String id, String userId, String salt) {
        CodeInfo info = verificationCodes.get(userId);
        if (info == null) {
            throw new RuntimeException("请先获取验证码");
        }
        if (LocalDateTime.now().isAfter(info.getExpireTime())) {
            verificationCodes.remove(userId);
            throw new RuntimeException("验证码已过期，请重新获取");
        }
        if (!info.getCode().equals(salt)) {
            throw new RuntimeException("验证码错误");
        }

        PasswordEntry entry = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Entry not found: " + id));

        if (!StringUtils.pathEquals(entry.getCreateUser(), userId)) {
            throw new RuntimeException("无权查看该密钥");
        }

        verificationCodes.remove(userId);
        String plainPassword = EncryptUtil.decrypt(entry.getEncryptedPassword(), null);
        if (!EncryptUtil.isV2Encrypted(entry.getEncryptedPassword())) {
            entry.setEncryptedPassword(EncryptUtil.encrypt(plainPassword, null));
            repository.save(entry);
        }
        return plainPassword;
    }

    @Override
    public PasswordDto convertToDto(PasswordEntry model, Boolean loadProps) {
        PasswordDto dto = super.convertToDto(model, loadProps);
        BeanUtils.copyProperties(model, dto, "encryptedPassword");
        return dto;
    }

    @Data
    @AllArgsConstructor
    private static class CodeInfo {
        private String code;
        private LocalDateTime expireTime;
    }
}
