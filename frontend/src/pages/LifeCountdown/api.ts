import axios from '@/core/src/http';

export interface LifeCountdownProfileDto {
  id?: string;
  deathDate?: string;
  todayWarningDate?: string;
  todayWarningText?: string;
  todayWarningGeneratedAt?: string;
  todayWarningModel?: string;
  createDate?: string;
  updateDate?: string;
}

export interface LifeCountdownSaveDto {
  deathDate: string;
}

export interface LifeCountdownGenerateWarningDto {
  forceRefresh?: boolean;
  modelName?: string;
}

export interface LifeCountdownWarningDto {
  warningText?: string;
  warningDate?: string;
  generatedAt?: string;
  modelName?: string;
  cached?: boolean;
}

export const getCurrentLifeCountdown = () =>
  axios.get('/life-countdown/current');

export const saveLifeCountdownProfile = (payload: LifeCountdownSaveDto) =>
  axios.post('/life-countdown/save', payload);

export const generateTodayWarning = (payload: LifeCountdownGenerateWarningDto) =>
  axios.post('/life-countdown/generate-warning', payload);
