package com.ck.quiz.script.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.script.entity.ScriptInfo;

public interface ScriptInfoRepository extends BaseRepository<ScriptInfo> {

    ScriptInfo findByScriptCode(String scriptCode);

    boolean existsByScriptCode(String scriptCode);
}