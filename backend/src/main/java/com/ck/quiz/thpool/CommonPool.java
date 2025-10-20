package com.ck.quiz.thpool;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class CommonPool {
    public static ExecutorService cachedPool = Executors.newCachedThreadPool();
}
