package com.ck.quiz.mermaids.service.impl;

import com.ck.quiz.mermaids.dto.MermaidCategoryDTO;
import com.ck.quiz.mermaids.entity.MermaidCategory;
import com.ck.quiz.mermaids.repository.MermaidCategoryRepository;
import com.ck.quiz.mermaids.service.MermaidCategoryService;
import com.ck.quiz.utils.IdHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class MermaidCategoryServiceImpl implements MermaidCategoryService {

    private final MermaidCategoryRepository repository;

    @Override
    public MermaidCategoryDTO create(MermaidCategoryDTO dto) {
        MermaidCategory e = new MermaidCategory();
        e.setId(dto.getId() == null ? IdHelper.genUuid() : dto.getId());
        e.setCategoryName(dto.getCategoryName());
        e.setDescription(dto.getDescription());
        e = repository.save(e);
        return toDto(e);
    }

    @Override
    public MermaidCategoryDTO update(String id, MermaidCategoryDTO dto) {
        MermaidCategory e = repository.findById(id).orElseThrow(() -> new RuntimeException("Category not found"));
        if (dto.getCategoryName() != null) e.setCategoryName(dto.getCategoryName());
        e.setDescription(dto.getDescription());
        e = repository.save(e);
        return toDto(e);
    }

    @Override
    public void delete(String id) {
        repository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public MermaidCategoryDTO findById(String id) {
        return repository.findById(id).map(this::toDto).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MermaidCategoryDTO> list(Pageable pageable) {
        var page = repository.findAll(pageable);
        List<MermaidCategoryDTO> list = page.stream().map(this::toDto).collect(Collectors.toList());
        return new PageImpl<>(list, pageable, page.getTotalElements());
    }

    private MermaidCategoryDTO toDto(MermaidCategory e) {
        MermaidCategoryDTO d = new MermaidCategoryDTO();
        d.setId(e.getId());
        d.setCategoryName(e.getCategoryName());
        d.setDescription(e.getDescription());
        d.setCreateDate(e.getCreateDate());
        d.setCreateUser(e.getCreateUser());
        d.setUpdateDate(e.getUpdateDate());
        d.setUpdateUser(e.getUpdateUser());
        return d;
    }
}
