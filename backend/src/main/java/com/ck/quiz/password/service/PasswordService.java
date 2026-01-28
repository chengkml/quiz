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

    public String getDecryptedPassword(String id, String currentUsername) {
        PasswordEntry entry = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Entry not found: " + id));

        // Additional security check
        if (!entry.getCreateUser().equals(currentUsername) && !"admin".equals(currentUsername)) {
            throw new RuntimeException("No permission to view this password");
        }
        return EncryptUtil.decrypt(entry.getEncryptedPassword(), null);
    }
}
