import axios from '@/core/src/http';

const base = '/quiz';

const getTrainningLog = params => axios.get(`${base}/api/cron/job/logs/${params.jobId}`, { params });

export {
  getTrainningLog
};
