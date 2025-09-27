package com.ck.quiz.config;

import com.ck.quiz.uuid.entity.UuidWorkerNode;
import com.ck.quiz.uuid.repository.UuidWorkerNodeRepository;
import com.xfvape.uid.UidGenerator;
import com.xfvape.uid.impl.CachedUidGenerator;
import com.xfvape.uid.worker.DisposableWorkerIdAssigner;
import com.xfvape.uid.worker.dao.WorkerNodeDAO;
import com.xfvape.uid.worker.entity.WorkerNodeEntity;
import org.springframework.beans.BeanUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class QuizConfig {

    /**
     * 数据库实现 WorkerNodeDAO，用于分配唯一 WorkerID
     */
    @Bean
    public WorkerNodeDAO workerNodeDAO(UuidWorkerNodeRepository repository) {
        return new WorkerNodeDAO() {
            @Override
            public WorkerNodeEntity getWorkerNodeByHostPort(String host, String port) {
                UuidWorkerNode uuidWorkerNode = repository.findByHostNameAndPort(host, port).orElse(null);
                WorkerNodeEntity workerNodeEntity = new WorkerNodeEntity();
                BeanUtils.copyProperties(uuidWorkerNode, workerNodeEntity);
                return workerNodeEntity;
            }

            @Override
            public void addWorkerNode(WorkerNodeEntity workerNodeEntity) {
                if (workerNodeEntity == null) return;

                UuidWorkerNode uuidWorkerNode = new UuidWorkerNode();
                BeanUtils.copyProperties(workerNodeEntity, uuidWorkerNode);

                // 设置创建时间和修改时间
                if (uuidWorkerNode.getCreated() == null) {
                    uuidWorkerNode.setCreated(new java.util.Date());
                }
                uuidWorkerNode.setModified(new java.util.Date());

                repository.save(uuidWorkerNode);
            }
        };
    }

    /**
     * 用完即弃的 WorkerId 分配器，依赖数据库
     */
    @Bean
    public DisposableWorkerIdAssigner disposableWorkerIdAssigner(WorkerNodeDAO workerNodeDAO) {
        DisposableWorkerIdAssigner assigner = new DisposableWorkerIdAssigner();
        assigner.setWorkerNodeDAO(workerNodeDAO);
        return assigner;
    }

    /**
     * CachedUidGenerator 配置
     */
    @Bean
    public UidGenerator cachedUidGenerator(DisposableWorkerIdAssigner disposableWorkerIdAssigner) throws Exception {
        CachedUidGenerator generator = new CachedUidGenerator();

        generator.setWorkerIdAssigner(disposableWorkerIdAssigner);

        generator.setTimeBits(29);
        generator.setWorkerBits(21);
        generator.setSeqBits(13);
        generator.setEpochStr("2025-09-24");

        generator.setBoostPower(3);
        generator.setPaddingFactor(50);
        generator.setScheduleInterval(60);

        generator.afterPropertiesSet();
        return generator;
    }
}
