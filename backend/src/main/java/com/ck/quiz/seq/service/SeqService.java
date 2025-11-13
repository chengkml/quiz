package com.ck.quiz.seq.service;

import com.ck.quiz.seq.entity.Seq;
import com.ck.quiz.seq.repository.SeqRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class SeqService {

    @Autowired
    private SeqRepository seqRepository;

    private static final int DEFAULT_SEQ_LENGTH = 6;

    /**
     * 生成普通自增序列（不每日重置）
     *
     * @param seqType 序列类型
     * @return 格式化后的序列号
     */
    @Transactional
    public String genSeq(String seqType) {
        String id = seqType; // 非每日重置，id 直接用 seqType

        Seq seq = seqRepository.findByTypeAndDaylyForUpdate(seqType, "0", id)
                .orElseGet(() -> {
                    Seq newSeq = new Seq();
                    newSeq.setId(id);
                    newSeq.setSeqType(seqType);
                    newSeq.setDayly("0"); // 非每日重置
                    newSeq.setSeqVal(0);
                    return newSeq;
                });

        int seqVal = seq.getSeqVal() + 1;
        seq.setSeqVal(seqVal);
        seqRepository.save(seq);

        // 返回固定长度序列号
        return seqType + String.format("%0" + DEFAULT_SEQ_LENGTH + "d", seqVal);
    }

    /**
     * 生成每日自增序列
     *
     * @param seqType 序列类型
     * @return 格式化后的序列号
     */
    @Transactional
    public String genDaylySeq(String seqType) {
        String dateStr = new java.text.SimpleDateFormat("yyyyMMdd").format(new java.util.Date());

        String id = seqType + "_" + dateStr;

        Seq seq = seqRepository.findByTypeAndDaylyForUpdate(seqType, "1", id)
                .orElseGet(() -> {
                    Seq newSeq = new Seq();
                    newSeq.setId(id);
                    newSeq.setSeqType(seqType);
                    newSeq.setDayly("1");
                    newSeq.setSeqVal(0);
                    return newSeq;
                });

        int seqVal = seq.getSeqVal() + 1;
        seq.setSeqVal(seqVal);
        seqRepository.save(seq);

        // 返回固定长度序列号
        return seqType + dateStr + "_" + String.format("%0" + DEFAULT_SEQ_LENGTH + "d", seqVal);
    }
}
