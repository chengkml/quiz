package com.ck.quiz.password.service;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.password.dto.PasswordCreateDto;
import com.ck.quiz.password.dto.PasswordDto;
import com.ck.quiz.password.dto.PasswordQueryDto;
import com.ck.quiz.password.dto.PasswordUpdateDto;
import com.ck.quiz.password.entity.PasswordEntry;
import com.ck.quiz.password.repository.PasswordRepository;
import com.ck.quiz.utils.EncryptUtil;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

@Service
public class PasswordService
        extends
        BaseServiceImpl<PasswordCreateDto, PasswordUpdateDto, PasswordQueryDto, PasswordDto, PasswordEntry, PasswordRepository> {

    @Autowired
    private PasswordRepository passwordRepository;

    @Override
    protected PasswordDto newDto() {
        return new PasswordDto();
    }

    @Override
    protected PasswordEntry newModel() {
        return new PasswordEntry();
    }

    @Override
    public PasswordDto update(String userId, PasswordUpdateDto updateDto) {
        PasswordEntry entry = repository.findById(updateDto.getId())
                .orElseThrow(() -> new IllegalArgumentException("Password entry not found: " + updateDto.getId()));

        if (entry.getCreateUser() != null && !entry.getCreateUser().equals(userId)) {
            throw new IllegalArgumentException("No permission to update password entry: " + updateDto.getId());
        }

        BeanUtils.copyProperties(updateDto, entry, "password"); // Ignore password in default copy

        if (StringUtils.hasText(updateDto.getPassword())) {
            entry.setEncryptedPassword(EncryptUtil.encrypt(updateDto.getPassword(), null));
        }

        // We skip Group/Tag logic as discussed.

        PasswordEntry saved = repository.save(entry);
        return convertToDto(saved, true);
    }

    // Also need to fix Create to match signature: create(C createDto) -> D create(C
    // createDto)
    // BaseServiceImpl: public D create(C createDto)
    // It does NOT take userId. User ID is usually handled by AuditingEntityListener
    // (CreatedBy) or set manually?
    // BaseServiceImpl relies on 'savedModel.getCreateUser()' being set?
    // Wait, AuditingEntityListener sets it upon save.
    // So create(C createDto) is fine.

    @Override
    public PasswordDto create(PasswordCreateDto createDto) {
        PasswordEntry entry = newModel();
        entry.setId(com.ck.quiz.utils.IdHelper.genUuid());
        BeanUtils.copyProperties(createDto, entry);

        if (StringUtils.hasText(createDto.getPassword())) {
            entry.setEncryptedPassword(EncryptUtil.encrypt(createDto.getPassword(), null));
        } else {
            entry.setEncryptedPassword("");
        }

        PasswordEntry saved = repository.save(entry);
        return convertToDto(saved, true);
    }

    @Override
    public Page<PasswordDto> search(String userId, PasswordQueryDto queryDto) {
        Specification<PasswordEntry> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(queryDto.getKeyWord())) {
                String likePattern = "%" + queryDto.getKeyWord() + "%";
                predicates.add(cb.or(
                        cb.like(root.get("title"), likePattern),
                        cb.like(root.get("username"), likePattern),
                        cb.like(root.get("remark"), likePattern)));
            }
            if (StringUtils.hasText(queryDto.getCategory())) {
                predicates.add(cb.equal(root.get("category"), queryDto.getCategory()));
            }

            // Security: Only own passwords
            predicates.add(cb.equal(root.get("createUser"), userId));

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        int page = queryDto.getPageNum() > 0 ? queryDto.getPageNum() - 1 : 0;
        Pageable pageable = PageRequest.of(page, queryDto.getPageSize(), Sort.by(Sort.Direction.DESC, "createDate"));

        Page<PasswordEntry> result = passwordRepository.findAll(spec, pageable);
        return result.map(entity -> convertToDto(entity, true));
    }

    // Explicitly expose getEntity for internal use if needed, but BaseServiceImpl
    // has protected M getEntity(String id).
    // Note: BaseServiceImpl getEntity implementation is: repository.findById...

    @Autowired
    private com.ck.quiz.user.service.UserService userService;

    @Autowired
    private com.ck.quiz.notification.service.impl.EmailChannel emailChannel;

    // UserId -> Code info
    private final java.util.Map<String, CodeInfo> verificationCodes = new java.util.concurrent.ConcurrentHashMap<>();

    @lombok.Data
    @lombok.AllArgsConstructor
    private static class CodeInfo {
        private String code;
        private java.time.LocalDateTime expireTime;
    }

    public synchronized void sendViewSalt(String userId) {
        // 1. Get User Email
        com.ck.quiz.user.dto.UserDto user = userService.getUserById(userId);
        if (user == null || !StringUtils.hasText(user.getEmail())) {
            throw new RuntimeException("用户未绑定邮箱，无法发送验证码");
        }

        // 2. Generate Code (6 digits)
        String code = String.valueOf((int) ((Math.random() * 9 + 1) * 100000));

        // 3. Store (5 minutes expiry)
        verificationCodes.put(userId, new CodeInfo(code, java.time.LocalDateTime.now().plusMinutes(5)));

        // 4. Send Email
        com.ck.quiz.notification.service.NotificationMessage message = new com.ck.quiz.notification.service.NotificationMessage();
        message.setTo(user.getEmail());
        message.setTitle("【密钥管理】查看明文密码验证");
        message.setContent("您正在尝试查看明文密码，本次验证码为：<b>" + code + "</b><br>有效期5分钟，请勿泄露给他人。");
        emailChannel.send(message);
    }

    public String getDecryptedPassword(String id, String userId, String salt) {
        // 1. Check Salt
        CodeInfo info = verificationCodes.get(userId);
        if (info == null) {
            throw new RuntimeException("请先获取验证码");
        }
        if (java.time.LocalDateTime.now().isAfter(info.getExpireTime())) {
            verificationCodes.remove(userId);
            throw new RuntimeException("验证码已过期，请重新获取");
        }
        if (!info.getCode().equals(salt)) {
            throw new RuntimeException("验证码错误");
        }

        // 2. Get Entry
        PasswordEntry entry = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Entry not found: " + id));

        // 3. Check Permission
        if (!entry.getCreateUser().equals(userId) && !"admin".equals(userId)) {
            throw new RuntimeException("No permission to view this password");
        }

        // 4. Decrypt
        return EncryptUtil.decrypt(entry.getEncryptedPassword(), null);
    }

    // Deprecated or Internal usage only matching old signature if needed by
    // interface?
    // The interface didn't expose it, it was public in impl.
    // We'll keep the old one for compatibility IF it was used elsewhere, but
    // ideally we should block it.
    // Given the requirement, we should probably remove/disable the direct access
    // one from Controller.
    public String getDecryptedPassword(String id, String currentUsername) {
        throw new RuntimeException("Direct access deprecated. Use salt verification.");
    }
}
