package com.ck.quiz.group.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.group.dto.GroupCreateDto;
import com.ck.quiz.group.dto.GroupDto;
import com.ck.quiz.group.dto.GroupQueryDto;
import com.ck.quiz.group.dto.GroupUpdateDto;
import com.ck.quiz.group.entity.Group;
import com.ck.quiz.group.repository.GroupRepository;
import com.ck.quiz.group.service.GroupService;
import jakarta.persistence.criteria.Predicate;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class GroupServiceImpl
        extends BaseServiceImpl<GroupCreateDto, GroupUpdateDto, GroupQueryDto, GroupDto, Group, GroupRepository>
        implements GroupService {

    @Override
    protected GroupDto newDto() {
        return new GroupDto();
    }

    @Override
    protected Group newModel() {
        return new Group();
    }

    @Override
    public boolean checkNameUniq(String userId, String name, String excludeId) {
        List<Group> groups = groupRepository.findByCreateUserAndName(userId, name);
        if (groups.isEmpty()) {
            return true;
        }
        for (Group group : groups) {
            if (excludeId == null || !group.getId().equals(excludeId)) {
                return false;
            }
        }
        return true;
    }

    @Override
    public Page<GroupDto> search(String userId, GroupQueryDto queryDto) {
        Pageable pageable = PageRequest.of(queryDto.getPageNum(), queryDto.getPageSize(),
                Sort.by(Sort.Direction.DESC, "createDate"));

        Specification<Group> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("createUser"), userId));

            if (StringUtils.isNotBlank(queryDto.getKeyWord())) {
                String likePattern = "%" + queryDto.getKeyWord() + "%";
                predicates.add(cb.or(
                        cb.like(root.get("name"), likePattern),
                        cb.like(root.get("label"), likePattern)));
            }

            if (StringUtils.isNotBlank(queryDto.getType())) {
                predicates.add(cb.equal(root.get("type"), queryDto.getType()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Group> page = repository.findAll(spec, pageable);
        List<GroupDto> dtos = convertToDtos(page.getContent());
        return new PageImpl<>(dtos, pageable, page.getTotalElements());
    }
}
