package com.ck.quiz.cron.exec;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;


@Service
public class CronTaskTest extends AbstractCronTask{

	  private static final Logger log = LoggerFactory.getLogger(CronTaskTest.class);

	    @Override
	    public String run(Map<String, Object> params) {
	        log.info(null == params ? "CronTaskTest is running..." : "CronTaskTest is running with params: {}", params);
	    	return null;
		}

}
