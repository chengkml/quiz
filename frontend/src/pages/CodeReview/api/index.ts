import axios from '@/core/src/http';

export const getCodeReviewIssueList = (params: any) => axios.post('/code-review/search', params);
export const createCodeReviewIssue = (params: any) => axios.post('/code-review/create', params);
export const updateCodeReviewIssue = (params: any) => axios.put('/code-review/update', params);
export const deleteCodeReviewIssue = (id: string) => axios.delete(`/code-review/delete/${id}`);
export const convertToRequirement = (id: string) => axios.post(`/code-review/${id}/convert-to-requirement`);

export default {
    getCodeReviewIssueList,
    createCodeReviewIssue,
    updateCodeReviewIssue,
    deleteCodeReviewIssue,
    convertToRequirement,
};
