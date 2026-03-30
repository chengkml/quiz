import axios from '@/core/src/http';

export interface HotSearchRecordDto {
  id: string;
  source?: string;
  externalId?: string;
  title?: string;
  url?: string;
  hotValue?: string;
  rankIndex?: number;
  crawlTime?: string;
  batchNo?: string;
  detailMarkdown?: string;
  extraJson?: string;
  createDate?: string;
  createUser?: string;
  updateDate?: string;
  updateUser?: string;
}

export interface HotSearchQueryDto {
  source?: string;
  titleKeyword?: string;
  fromTime?: string;
  toTime?: string;
  pageNum: number;
  pageSize: number;
}

export interface PageResp<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const searchHotSearch = async (payload: HotSearchQueryDto): Promise<PageResp<HotSearchRecordDto>> => {
  const response = await axios.post('/hot-search/search', payload);
  return response.data;
};

export const latestHotSearch = async (source?: string): Promise<HotSearchRecordDto[]> => {
  const response = await axios.get('/hot-search/latest', { params: { source } });
  return response.data;
};

export const getHotSearchDetail = async (id: string): Promise<HotSearchRecordDto | null> => {
  const response = await axios.get(`/hot-search/${id}`);
  if (response.success === false) {
    return null;
  }
  return response.data;
};
