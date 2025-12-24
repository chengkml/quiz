export type WsEventType =
  | 'SYS_MSG_NEW'
  | 'BIZ_EVENT'
  | 'FORCE_LOGOUT'
  | 'TASK_DONE'
  | 'DATA_REFRESH';

export type WsBizType =
  | 'SYSTEM'
  | 'EXAM'
  | 'QUESTION'
  | 'SCHEDULE'
  | 'TASK';

export type WsAction = 'REFRESH' | 'REDIRECT' | 'POPUP' | 'BADGE' | 'SILENT';

export interface WsEventMessage {
  type: WsEventType;
  eventId: string;
  bizType?: WsBizType;
  bizId?: string;
  action?: WsAction;
  level?: string;
  timestamp?: number;
  payload?: Record<string, any> | null;
}

export interface WsDispatchContext {
  topic: string;
  raw: unknown;
}
