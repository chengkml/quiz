import axios from '@/core/src/http';

export interface PriceMonitorItemDto {
  id: string;
  platform?: string;
  itemName?: string;
  itemUrl?: string;
  externalItemId?: string;
  monitoringEnabled?: boolean;
  currency?: string;
  lastCollectedAt?: string;
  lastOriginalPrice?: number;
  lastDiscountText?: string;
  lastDiscountAmount?: number;
  lastFinalPrice?: number;
  lastRemark?: string;
  createDate?: string;
  createUserName?: string;
  updateDate?: string;
  updateUserName?: string;
}

export interface PriceMonitorItemQueryDto {
  platform?: string;
  itemName?: string;
  monitoringEnabled?: boolean;
  pageNum?: number;
  pageSize?: number;
}

export interface PriceMonitorItemCreateDto {
  platform?: string;
  itemName?: string;
  itemUrl?: string;
  externalItemId?: string;
  monitoringEnabled?: boolean;
  currency?: string;
}

export interface PriceMonitorItemUpdateDto extends PriceMonitorItemCreateDto {
  id: string;
}

export interface PriceSnapshotDto {
  id: string;
  itemId: string;
  itemName?: string;
  platform?: string;
  collectedAt?: string;
  originalPrice?: number;
  discountText?: string;
  discountAmount?: number;
  finalPrice?: number;
  remark?: string;
  rawPayload?: string;
}

export interface PriceAlertRuleDto {
  id: string;
  itemId: string;
  enabled?: boolean;
  alertOnIncrease?: boolean;
  alertOnDecrease?: boolean;
  absoluteThreshold?: number;
  percentageThreshold?: number;
  channel?: string;
}

export interface PriceAlertRuleCreateDto {
  enabled?: boolean;
  alertOnIncrease?: boolean;
  alertOnDecrease?: boolean;
  absoluteThreshold?: number;
  percentageThreshold?: number;
  channel?: string;
}

export interface PricePointDto {
  collectedAt: string;
  originalPrice?: number;
  finalPrice?: number;
  discountAmount?: number;
}

export interface PriceTrendDto {
  itemId: string;
  itemName?: string;
  platform?: string;
  currency?: string;
  points: PricePointDto[];
}

export interface PriceCollectResultDto {
  itemId: string;
  itemName?: string;
  snapshot?: PriceSnapshotDto;
  previousFinalPrice?: number;
  currentFinalPrice?: number;
  deltaAmount?: number;
  deltaRatio?: number;
  triggeredRules?: string[];
  notifyResult?: string;
}

export const getPriceMonitorItems = (payload: PriceMonitorItemQueryDto) =>
  axios.post('/price-monitor/items/search', payload);

export const createPriceMonitorItem = (payload: PriceMonitorItemCreateDto) =>
  axios.post('/price-monitor/items/create', payload);

export const updatePriceMonitorItem = (payload: PriceMonitorItemUpdateDto) =>
  axios.put('/price-monitor/items/update', payload);

export const deletePriceMonitorItem = (id: string) =>
  axios.delete(`/price-monitor/items/delete/${id}`);

export const collectPrice = (id: string, payload: any) =>
  axios.post(`/price-monitor/items/${id}/collect`, payload);

export const getPriceTrend = (id: string) =>
  axios.get(`/price-monitor/items/${id}/trend`);

export const getSnapshots = (itemId: string) =>
  axios.get(`/price-monitor/items/${itemId}/snapshots`);

export const getAlertRules = (itemId: string) =>
  axios.get(`/price-monitor/items/${itemId}/alert-rules`);

export const saveAlertRule = (itemId: string, payload: PriceAlertRuleCreateDto) =>
  axios.post(`/price-monitor/items/${itemId}/alert-rules`, payload);
