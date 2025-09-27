import request from '../utils/request';

// 数据集API服务
class DatasetService {
  // 分页查询数据集
  async getDatasets(params = {}) {
    const {
      page = 0,
      size = 20,
      sortBy = 'createTime',
      sortDir = 'desc',
      keyword,
      sourceType,
      state,
      createUser
    } = params;

    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('size', size);
    queryParams.append('sortBy', sortBy);
    queryParams.append('sortDir', sortDir);
    
    if (keyword) queryParams.append('keyword', keyword);
    if (sourceType) queryParams.append('sourceType', sourceType);
    if (state) queryParams.append('state', state);
    if (createUser) queryParams.append('createUser', createUser);

    return request.get(`/api/datasets?${queryParams.toString()}`);
  }

  // 搜索数据集
  async searchDatasets(keyword) {
    return request.get(`/api/datasets/search?keyword=${encodeURIComponent(keyword)}`);
  }

  // 创建数据集
  async createDataset(data) {
    const { datasetName, sourceType, descr, state = '1', createUser } = data;
    return request.post('/api/datasets', {
      datasetName,
      sourceType,
      descr,
      state,
      createUser
    });
  }

  // 获取数据集详情
  async getDatasetById(datasetId) {
    return request.get(`/api/datasets/${datasetId}`);
  }

  // 根据名称获取数据集
  async getDatasetByName(datasetName) {
    return request.get(`/api/datasets/name/${encodeURIComponent(datasetName)}`);
  }

  // 更新数据集
  async updateDataset(datasetId, data) {
    const { datasetName, descr, state, updateUser } = data;
    return request.post(`/api/datasets/${datasetId}/update`, {
      datasetId,
      datasetName,
      descr,
      state,
      updateUser
    });
  }

  // 删除数据集
  async deleteDataset(datasetId) {
    return request.post(`/api/datasets/${datasetId}/delete`);
  }

  // 批量删除数据集
  async batchDeleteDatasets(datasetIds) {
    return request.post('/api/datasets/batch/delete', datasetIds);
  }

  // 启用数据集
  async enableDataset(datasetId) {
    return request.post(`/api/datasets/${datasetId}/enable`);
  }

  // 禁用数据集
  async disableDataset(datasetId) {
    return request.post(`/api/datasets/${datasetId}/disable`);
  }

  // 检查数据集名称是否存在
  async checkDatasetName(datasetName, excludeId = null) {
    let url = `/api/datasets/check-name?datasetName=${encodeURIComponent(datasetName)}`;
    if (excludeId) {
      url += `&excludeId=${excludeId}`;
    }
    return request.get(url);
  }
}

export default new DatasetService();