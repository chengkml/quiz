package com.ck.quiz.uuid.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

import java.util.Date;

@Entity
@Table(name = "worker_node", indexes = {
        @Index(name = "uk_worker_host_port", columnList = "hostName, port", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UuidWorkerNode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // 自增主键
    private long id;

    @Column(name = "host_name", length = 128, nullable = false)
    private String hostName;

    @Column(length = 32, nullable = false)
    private String port;

    @Column(nullable = false)
    private int type;

    @Column(name = "launch_date", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date launchDate = new Date();

    @CreatedDate
    @Column(nullable = false, updatable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date created;

    @LastModifiedDate
    @Column(nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date modified;
}
