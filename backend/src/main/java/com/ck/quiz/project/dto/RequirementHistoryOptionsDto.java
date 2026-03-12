package com.ck.quiz.project.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class RequirementHistoryOptionsDto {

    private List<String> projectNames = new ArrayList<>();

    private List<String> gitUrls = new ArrayList<>();

    private List<String> branches = new ArrayList<>();
}
