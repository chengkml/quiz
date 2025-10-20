import axios from '@/core/src/http';

const base = '/quiz';

// 获取学科列表（分页查询）
const getSubjectList = params => axios.get(`${base}/api/subject`, {params});

// 获取学科详情
const getSubjectById = id => axios.get(`${base}/api/subject/${id}`);

// 根据名称获取学科
const getSubjectByName = name => axios.get(`${base}/api/subject/name/${name}`);

// 创建学科
const createSubject = params => axios.post(`${base}/api/subject/create`, params);

// 更新学科
const updateSubject = params => axios.put(`${base}/api/subject/update`, params);

// 删除学科
const deleteSubject = id => axios.delete(`${base}/api/subject/delete/${id}`);

// 获取所有学科列表
const getAllSubjects = () => axios.get(`${base}/api/subject/list/user/all`);

// 检查学科名称是否存在
const checkSubjectName = params => axios.get(`${base}/api/subject/check/name`, {params});

export {
  getSubjectList,
  getSubjectById,
  getSubjectByName,
  createSubject,
  updateSubject,
  deleteSubject,
  getAllSubjects,
  checkSubjectName
};