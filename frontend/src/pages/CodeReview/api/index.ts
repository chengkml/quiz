import axios from '@/core/src/http';

export const getCodeReviewTaskList = (params: any) => axios.post('/code-review/task/search', params);
export const getCodeReviewTaskById = (id: string) => axios.get(`/code-review/task/get/${id}`);
export const createCodeReviewTask = (params: any) => axios.post('/code-review/task/create', params);
export const updateCodeReviewTask = (params: any) => axios.put('/code-review/task/update', params);
export const deleteCodeReviewTask = (id: string) => axios.delete(`/code-review/task/delete/${id}`);
export const startCodeReviewTask = (id: string) => axios.post(`/code-review/task/${id}/start`);
export const completeCodeReviewTask = (id: string) => axios.post(`/code-review/task/${id}/complete`);
export const getCodeReviewTaskHistoryOptions = () => axios.get('/code-review/task/history-options');

export const getCodeReviewIssueList = (params: any) => axios.post('/code-review/search', params);
export const createCodeReviewIssue = (params: any) => axios.post('/code-review/create', params);
export const updateCodeReviewIssue = (params: any) => axios.put('/code-review/update', params);
export const deleteCodeReviewIssue = (id: string) => axios.delete(`/code-review/delete/${id}`);
export const convertToRequirement = (id: string) => axios.post(`/code-review/issue/${id}/convert-to-requirement`);

export default {
    getCodeReviewTaskList,
    getCodeReviewTaskById,
    createCodeReviewTask,
    updateCodeReviewTask,
    deleteCodeReviewTask,
    startCodeReviewTask,
    completeCodeReviewTask,
    getCodeReviewTaskHistoryOptions,
    getCodeReviewIssueList,
    createCodeReviewIssue,
    updateCodeReviewIssue,
    deleteCodeReviewIssue,
    convertToRequirement,
};
