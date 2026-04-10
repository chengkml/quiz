package com.ck.quiz.lifecountdown.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.lifecountdown.entity.LifeCountdownProfile;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LifeCountdownProfileRepository extends BaseRepository<LifeCountdownProfile> {

    Optional<LifeCountdownProfile> findFirstByCreateUser(String createUser);
}
