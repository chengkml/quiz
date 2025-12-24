import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import wsEventBus from './eventBus';
import { WsEventMessage, WsDispatchContext } from './types';

interface SubscriptionRecord {
  id: string;
  topic: string;
  handler: (payload: WsEventMessage | null, ctx: WsDispatchContext) => void;
  stompSub?: StompSubscription;
}

// Backend STOMP endpoint is registered at /ws (代理加/quiz)
const WS_ENDPOINT = '/quiz-ws';

const getToken = () => {
  try {
    return localStorage.getItem('token') || undefined;
  } catch (_) {
    return undefined;
  }
};

class WebSocketManager {
  private client: Client | null = null;
  private connected = false;
  private subscriptions = new Map<string, SubscriptionRecord>();

  connect() {
    if (this.client) {
      return;
    }

    const token = getToken();

    this.client = new Client({
      webSocketFactory: () => new SockJS(WS_ENDPOINT, undefined, { transports: ['websocket'] }),
      reconnectDelay: 5000,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      debug: () => undefined,
      onConnect: () => {
        this.connected = true;
        wsEventBus.emit('ws:connected', null);
        this.resubscribeAll();
      },
      onDisconnect: () => {
        this.connected = false;
        wsEventBus.emit('ws:disconnected', null);
      },
      onStompError: (frame) => {
        wsEventBus.emit('ws:error', frame);
      },
    });

    this.client.activate();
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.connected = false;
      this.subscriptions.forEach((sub) => sub.stompSub?.unsubscribe());
      this.subscriptions.clear();
    }
  }

  subscribe(
    topic: string,
    handler: (payload: WsEventMessage | null, ctx: WsDispatchContext) => void,
  ): () => void {
    const id = `sub-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const record: SubscriptionRecord = { id, topic, handler };
    this.subscriptions.set(id, record);

    // 仅在底层 STOMP 连接已建立时才立即订阅，避免 "There is no underlying STOMP connection" 错误
    if (this.client && (this.client as any).connected === true) {
      record.stompSub = this.client.subscribe(topic, (msg) => this.handleMessage(msg, record));
    }

    // Ensure connection is started
    this.connect();

    return () => {
      const current = this.subscriptions.get(id);
      current?.stompSub?.unsubscribe();
      this.subscriptions.delete(id);
    };
  }

  private resubscribeAll() {
    if (!this.client || !this.connected) return;
    this.subscriptions.forEach((record) => {
      record.stompSub?.unsubscribe();
      record.stompSub = this.client!.subscribe(record.topic, (msg) => this.handleMessage(msg, record));
    });
  }

  private handleMessage(message: IMessage, record: SubscriptionRecord) {
    const ctx: WsDispatchContext = { topic: record.topic, raw: message };
    let payload: WsEventMessage | null = null;
    try {
      payload = message.body ? JSON.parse(message.body) : null;
    } catch (e) {
      wsEventBus.emit('ws:parse-error', { message, error: e });
    }

    record.handler(payload, ctx);
    wsEventBus.emit('ws:message', { topic: record.topic, payload, raw: message });

    if (payload?.type) {
      wsEventBus.emit(`ws:type:${payload.type}`, { topic: record.topic, payload, raw: message });
    }
    if (payload?.bizType) {
      wsEventBus.emit(`ws:biz:${payload.bizType}`, { topic: record.topic, payload, raw: message });
    }
  }
}

export const wsClient = new WebSocketManager();
export default wsClient;
