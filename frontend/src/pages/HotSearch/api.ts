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
  matchedTopics?: string[];
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
  followedOnly?: boolean;
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

export interface HotSearchFollowTopicDto {
  id: string;
  topicName?: string;
  keywords?: string;
  enabled?: boolean;
  seq?: number;
  createDate?: string;
  createUser?: string;
  updateDate?: string;
  updateUser?: string;
}

export interface HotSearchFollowTopicCreateDto {
  topicName: string;
  keywords?: string;
  enabled?: boolean;
  seq?: number;
}

export interface HotSearchFollowTopicUpdateDto extends HotSearchFollowTopicCreateDto {
  id: string;
}

export interface HotSearchFollowTopicQueryDto {
  topicName?: string;
  enabled?: boolean;
  pageNum: number;
  pageSize: number;
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
  if (response.data?.success === false) {
    return null;
  }
  return response.data?.data || null;
};

export const searchFollowTopics = async (payload: HotSearchFollowTopicQueryDto): Promise<PageResp<HotSearchFollowTopicDto>> => {
  const response = await axios.post('/hot-search/follow-topic/search', payload);
  return response.data;
};

export const listFollowTopics = async (): Promise<HotSearchFollowTopicDto[]> => {
  const response = await axios.get('/hot-search/follow-topic/list');
  return response.data;
};

export const createFollowTopic = async (payload: HotSearchFollowTopicCreateDto): Promise<HotSearchFollowTopicDto> => {
  const response = await axios.post('/hot-search/follow-topic/create', payload);
  return response.data;
};

export const updateFollowTopic = async (payload: HotSearchFollowTopicUpdateDto): Promise<HotSearchFollowTopicDto> => {
  const response = await axios.put('/hot-search/follow-topic/update', payload);
  return response.data;
};

export const deleteFollowTopic = async (id: string): Promise<void> => {
  await axios.delete(`/hot-search/follow-topic/delete/${id}`);
};
