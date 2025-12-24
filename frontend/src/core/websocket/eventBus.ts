type Handler<T = any> = (payload: T) => void;

class EventBus {
  private target = new EventTarget();

  on<T = any>(type: string, handler: Handler<T>): () => void {
    const wrapped = (event: Event) => {
      const custom = event as CustomEvent<T>;
      handler(custom.detail);
    };
    this.target.addEventListener(type, wrapped as EventListener);
    return () => this.target.removeEventListener(type, wrapped as EventListener);
  }

  emit<T = any>(type: string, payload: T): void {
    const evt = new CustomEvent<T>(type, { detail: payload });
    this.target.dispatchEvent(evt);
  }
}

export const wsEventBus = new EventBus();
export default wsEventBus;
