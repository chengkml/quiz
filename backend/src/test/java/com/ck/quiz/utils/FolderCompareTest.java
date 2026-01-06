package com.ck.quiz.utils;

import org.junit.jupiter.api.Test;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

public class FolderCompareTest {
    @Test
    public void testCompareAndMoveSameFiles() throws IOException {
        // 文件夹路径，可根据需要修改
        String folderA = "C:\\Users\\AI\\Desktop\\new_lib";
        String folderB = "C:\\Users\\AI\\Desktop\\old_lib";
        String targetFolder = "C:\\Users\\AI\\Desktop\\same_lib";

        File dirA = new File(folderA);
        File dirB = new File(folderB);
        File dirTarget = new File(targetFolder);
        if (!dirTarget.exists()) {
            assertTrue(dirTarget.mkdirs(), "目标文件夹创建失败");
        }

        Set<String> fileNamesA = new HashSet<>();
        for (File file : dirA.listFiles()) {
            if (file.isFile()) {
                fileNamesA.add(file.getName());
            }
        }
        Set<String> fileNamesB = new HashSet<>();
        for (File file : dirB.listFiles()) {
            if (file.isFile()) {
                fileNamesB.add(file.getName());
            }
        }
        // 找出同名文件
        fileNamesA.retainAll(fileNamesB);
        for (String name : fileNamesA) {
            File fileA = new File(dirA, name);
            File fileB = new File(dirB, name);
            // 比较内容
            boolean same = Files.mismatch(fileA.toPath(), fileB.toPath()) == -1;
            if (same) {
                // 移动到目标文件夹
                Files.move(fileA.toPath(), new File(dirTarget, name).toPath(), StandardCopyOption.REPLACE_EXISTING);
            }
        }
        // 验证目标文件夹是否有文件
        assertTrue(dirTarget.listFiles().length > 0, "没有相同文件被移动");
    }
}
