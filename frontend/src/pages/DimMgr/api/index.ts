import axios from '@/core/src/http';

const base = '';

const getDimensionTree = params => axios.get(`${base}/_api/_/dim/tree`, {params});

const getDimensionList = params => axios.get(`${base}/_api/_/dim/list`, {params});

const validateDimCode = params => axios.get(`${base}/_api/_/dim/check/uniq`, {params});

const getDimensionGroups = params => axios.get(`${base}/_api/_/dim/groups`, {params});

const addDimension = (params) => axios.post(`${base}/_api/_/dim/create`, params);

const updateDimension = (params) => axios.post(`${base}/_api/_/dim/update/${params.id}`, params);

const enableDimension = (params) => axios.post(`${base}/_api/_/dim/${params.id}/enable`, params);

const disableDimension = (params) => axios.post(`${base}/_api/_/dim/${params.id}/disable`, params);

const safeDeleteDimension = (params) => axios.post(`${base}/_api/_/dim/safe/delete/${params.id}`);

const deleteDimension = (params) => axios.post(`${base}/_api/_/dim/safe/delete/${params.id}`);

const cascadeDeleteDimension = (params) => axios.post(`${base}/_api/_/dim/cascade/delete/${params.id}`);

// 导出维度数据
const exportDimensions = (params) => axios.post(`${base}/_api/_/dim/export`, params, {
  responseType: 'blob'
});

// 导入维度数据
const importDimensions = (formData) => axios.post(`${base}/_api/_/dim/import`, formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

export {
  getDimensionTree,
  getDimensionList,
  validateDimCode,
  getDimensionGroups,
  addDimension,
  updateDimension,
  enableDimension,
  disableDimension,
  safeDeleteDimension,
  deleteDimension,
  cascadeDeleteDimension,
  exportDimensions,
  importDimensions
};
