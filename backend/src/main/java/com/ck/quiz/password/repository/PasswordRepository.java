package com.ck.quiz.password.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.password.entity.PasswordEntry;
import org.springframework.stereotype.Repository;

@Repository
public interface PasswordRepository extends BaseRepository<PasswordEntry> {
}
