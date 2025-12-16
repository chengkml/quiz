import axios from '@/core/src/http';

const getTrainningLog = params => axios.get(`/cron/job/logs/${params.jobId}`, { params });

export {
  getTrainningLog
};
